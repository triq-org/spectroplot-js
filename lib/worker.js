/**
    @file Worker to render an FFT to image.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/*eslint no-console: "off"*/

import './polyfill';
import SampleView from './samples';
import FFTNayuki from './fft_nayuki';

let fftN
let fft

/** Function for rendering an FFT to image. */
function renderFft(ctx) {
    const sampleView = new SampleView(ctx.format, ctx.buffer);
    const gauge_mins = new Uint8ClampedArray(new ArrayBuffer(ctx.width));
    const gauge_maxs = new Uint8ClampedArray(new ArrayBuffer(ctx.width));
    const gauge_amps = new Uint8ClampedArray(new ArrayBuffer(ctx.width));

    const sampleCount = sampleView.sampleCount;

    const block_norm = ctx.block_norm;
    const block_norm_db = 10 * Math.log10(block_norm);
    const gain = ctx.gain;
    const dB_range = ctx.range;
    let dBfs_min = 0.0;
    let dBfs_max = -200.0;
    const cmap = ctx.cmap;
    const color_max = cmap.length - 1;
    const color_norm = cmap.length / -dB_range;

    const cB_hist_size = 1000; // centi Bell (0.1 dB)
    const cB_hist = new Array(cB_hist_size).fill(0); // -0.0 to -100.0 dB
    const c_hist = new Array(cmap.length).fill(0);

    const n = ctx.n;
    const windowc = ctx.windowc;
    const height = n;
    const width = ctx.width;
    const points = width;
    const stride = (sampleCount - n) / (points - 1);
    const indexed = ctx.indexed
    const waterfall = ctx.waterfall
    // const imageData = new ImageData(width, height); // would need polyfill
    const byteCount = indexed ? width * height : 4 * width * height
    const imageData = { data: new Uint8ClampedArray(byteCount) };
    ////const imageBuffer = new ArrayBuffer(width * height * 4);
    //const imageBuffer = ctx.image;
    //const imageData = new Uint8ClampedArray(imageBuffer);

    if (fftN != n) {
        fft = new FFTNayuki(n);
        fftN = n;
    }
    const real = new Array(n);
    const imag = new Array(n);

    //console.time('fft worker');
    // faster to cast floats to int with bitwise nops than Math.round
    for (let x = 0; x < width; x++) {

        for (let k = 0; k < n; k++) {
            //const pos = 2 * (Math.round(stride * x) + k);
            const pos = ~~(0.5 + stride * x) + k;
            real[k] = windowc[k] * sampleView.sampleI(pos);
            imag[k] = windowc[k] * sampleView.sampleQ(pos);
        }

        fft.transform(real, imag);
        if (ctx.channelMode) {
            fft.splitreal(real, imag);
        }

        let dBfs_min_i = 0.0;
        let dBfs_max_i = -200.0;

        for (let i = 0; i < n; i++) {
        // for (let y = 0; y < n; y++) {
            // the positive frequencies are stored in the first half and
            // the negative frequencies are stored in backwards order in the second half.
            // (The frequency -k/n is the same as the frequency (n-k)/n.)
            const y = i <= n / 2 ? n / 2 - i : n / 2 + n - i;
            //const i = y < n / 2 ? n / 2 - 1 - y : n / 2 - 1 + n - y;
            const abs2 = real[i] * real[i] + imag[i] * imag[i];
            let dBfs = 5 * Math.log10(abs2) + block_norm_db + gain;

            //                const mean = 22;
            //                const sdev = 1;
            //                const xg = (-dBfs - mean) / sdev;
            //                const gauss = 1 / sdev * 1 / Math.sqrt(2 * Math.PI) * Math.exp(-0.5 * xg * xg);
            //                //console.log(gauss);
            //                dBfs *= gauss * 8 - 6;

            if (dBfs - gain < dBfs_min_i) dBfs_min_i = dBfs - gain;
            if (dBfs - gain > dBfs_max_i) dBfs_max_i = dBfs - gain;

            const cBabs = ~~(0.5 + (dBfs - gain) * -10);
            cB_hist[cBabs >= cB_hist_size ? cB_hist_size - 1 : cBabs] += 1;

            //const gray = color_max - Math.clamp(Math.round(dBfs * color_norm), 0, color_max);
            //const gray = Math.round(Math.clamp(color_max - dBfs * color_norm, 0, color_max));
            //const gray = ~~(0.5 + Math.clamp(color_max - dBfs * color_norm, 0, color_max));
            const grayU = color_max - dBfs * color_norm;
            const gray = ~~(0.5 + (grayU < 0 ? 0 : grayU > color_max ? color_max : grayU));
            c_hist[gray] += 1;
            if (indexed) {
                if (waterfall) {
                    imageData.data[height * x + y] = gray
                } else /*spectrogram*/ {
                    imageData.data[x + width * y] = gray
                }
            } else {
                const color = cmap[gray];
                const j = waterfall
                    ? height * (width - 1 - x) * 4 + (n - 1 - y) * 4
                    : x * 4 + width * y * 4;
                imageData.data[j + 0] = color[0]; // R
                imageData.data[j + 1] = color[1]; // G
                imageData.data[j + 2] = color[2]; // B
                imageData.data[j + 3] = 255; // A
            }
        }

        if (dBfs_min_i < dBfs_min) dBfs_min = dBfs_min_i;
        if (dBfs_max_i > dBfs_max) dBfs_max = dBfs_max_i;

        // amplitude gauge
        gauge_mins[x] = 0.5 + (dB_range + dBfs_min_i) * 256 / dB_range;
        gauge_maxs[x] = 0.5 + (dB_range + dBfs_max_i) * 256 / dB_range;

        const mid = ~~(0.5 + stride * x) + n/2;
        const re =  sampleView.sampleI(mid);
        const im =  sampleView.sampleQ(mid);
        const abs2 = re * re + im * im;
        let dBfs_amp = 5 * Math.log10(abs2) + gain;
        gauge_amps[x] = 0.5 + (dB_range + dBfs_amp) * 256 / dB_range;
    }
    //console.timeEnd('fft worker');

    postMessage({
        cB_hist: cB_hist,
        c_hist: c_hist,
        dBfs_min: dBfs_min,
        dBfs_max: dBfs_max,
        offset: ctx.offset,
        gauge_mins: gauge_mins,
        gauge_maxs: gauge_maxs,
        gauge_amps: gauge_amps,
        imageData: imageData,
    }, [
        gauge_mins.buffer,
        gauge_maxs.buffer,
        gauge_amps.buffer,
        imageData.data.buffer,
    ]);
}

onmessage = function (e) {
    if (e.data && e.data.buffer) {
        if (self.performance)
            performance.mark('render-start');

        renderFft(e.data);

        if (self.performance) {
            performance.mark('render-end');
            performance.measure('render', 'render-start', 'render-end');

            // Get all of the measures out.
            // In this case there is only one.
            var measures = performance.getEntriesByName('render');
            var measure = measures[0];
            console.log(`worker render: ${measure.duration.toFixed(2)}ms`);

            // Clean up the stored markers.
            performance.clearMarks();
            performance.clearMeasures();
        }
    }
};
