function genWhiteNoise(width, height) {
    return Array.from({ length: height }, () =>
        Array.from({ length: width }, () => Math.random())
    );
}

function outerProduct(v1, v2) {
    return v1.map(x => v2.map(y => x * y));
}

function normalizeKernel(kernel) {
    const total = kernel.flat().reduce((a, b) => a + b, 0);
    return kernel.map(row => row.map(x => x / total));
}

function normalizeMatrix(matrix) {
    let min = Infinity;
    let max = -Infinity;

    for (const row of matrix) {
        for (const v of row) {
            if (v < min) min = v;
            if (v > max) max = v;
        }
    }

    const range = max - min || 1;

    return matrix.map(row =>
        row.map(v => (v - min) / range)
    );
}

function genGaussianKernel(x, sigma) {
    return (1 / (Math.sqrt(2 * Math.PI) * sigma)) *
        Math.exp(-(x * x) / (2 * sigma * sigma));
}

function genGaussianVector(size, sigma) {
    const half = Math.floor(size / 2);
    const xs = Array.from({ length: size }, (_, i) => i - half);
    return xs.map(x => genGaussianKernel(x, sigma));
}

function genGaussianMatrix(size, sigma) {
    const vec = genGaussianVector(size, sigma);
    return normalizeKernel(outerProduct(vec, vec));
}

function applyGaussianBlur(matrix, kernel) {
    const height = matrix.length;
    const width = matrix[0].length;
    const kSize = kernel.length;
    const kCenter = Math.floor(kSize / 2);

    const blurred = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => 0)
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let weightSum = 0;

            for (let dy = 0; dy < kSize; dy++) {
                for (let dx = 0; dx < kSize; dx++) {
                    const iy = y + (dy - kCenter);
                    const ix = x + (dx - kCenter);

                    if (iy >= 0 && iy < height && ix >= 0 && ix < width) {
                        const pixel = matrix[iy][ix];
                        const weight = kernel[dy][dx];
                        sum += pixel * weight;
                        weightSum += weight;
                    }
                }
            }
            blurred[y][x] = weightSum > 0 ? sum / weightSum : 0;
        }
    }

    return blurred;
}

const CANVAS_HEIGHT = 1080;
const CANVAS_WIDTH = 1920;
const CANVAS_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

function drawLineMatrix(ctx, matrix, time) {
    const height = matrix.length;
    const width = matrix[0].length;
    const center_x = width / 2;

    const spacerX = CANVAS_WIDTH / width;
    const spacerY = CANVAS_HEIGHT / height;
    
    const amplifier = 100 * spacerY;

    const waveAmplitude = 35;
    const waveLength = 100;
    const waveSpeed = 0.005;

    const min_amp_factor = 0.5; 
    const max_amp_factor = 1.0;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = "hotpink";

    for (let y = 0; y < height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * spacerY);

        for (let x = 0; x < width; x++) {
            const center_dist = Math.abs(center_x - x);
            const max_dist = center_x;
        
            const amp_factor = min_amp_factor + (max_amp_factor - min_amp_factor) * (1 - center_dist / max_dist)
            const cur_amp = amplifier * amp_factor;
            const waveOffset = Math.sin((x / waveLength) + time * waveSpeed) * waveAmplitude;

            const px = x * spacerX;
            let py = y * spacerY + matrix[y][x] * cur_amp + waveOffset;

            py = Math.max(0, Math.min(CANVAS_HEIGHT - 1, py));

            ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
}

let time = 0;

function animate(ctx, matrix) {
    drawLineMatrix(ctx, matrix, time);
    time += 1;
    requestAnimationFrame(() => animate(ctx, matrix));
}

function init() {
    const canvas = document.getElementById("app");
    const ctx = canvas.getContext("2d");

    const width = 500;
    const height = 500;
    const noise = genWhiteNoise(width, height);

    const sigma = 8;
    const kernelSize = Math.max(3, Math.ceil(6 * sigma));
    const kernel = genGaussianMatrix(kernelSize, sigma);

    const blurred = applyGaussianBlur(noise, kernel);
    const normalized = normalizeMatrix(blurred)

    animate(ctx, normalized)
}

window.onload = init;
