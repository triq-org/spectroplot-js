/**
    @file I/Q Spectrogramm Plot JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/*eslint no-console: "off"*/

import './polyfill.js';

import * as windows from './windows.js';

import { autorange } from './autorange.js';
import { autostep } from './autostep.js';
import { parseFreqRate, parseFormat } from './parseFreqRate.js';

import * as cube1cmap from './cube1cmap.js';
import * as soxcmap from './soxcmap.js';
import * as naivecmap from './naivecmap.js';
import * as matplotlibcmaps from './matplotlibcmaps.js';
import * as parabolacmap from './parabolacmap.js';

import { selector, lookup, strip } from './utils.js';

import SampleView from './samples.js';
import { DropZone } from './dropzone.js';

// import Worker from 'worker-loader!./worker.js';
// import Worker from 'worker-loader?filename=spectroplot.worker.js!./worker.js';
// const worker_url = new URL('./worker.js', import.meta.url)

//import './styles.css';

// kind of a crowbar until I figure something better out
const cmaps = Object.assign({}, cube1cmap, soxcmap, naivecmap, matplotlibcmaps, parabolacmap);

// polyfill ImageData constructor
function newImageData() {
    var i = 0;
    if (arguments[0] instanceof Uint8ClampedArray) {
        var data = arguments[i++];
    }
    var width = arguments[i++];
    var height = arguments[i];
    if (data && height === undefined) height = data.length / 4 / width;

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d', { alpha: false });
    var imageData = ctx.createImageData(width, height);
    if (data) imageData.data.set(data);
    return imageData;
}

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('The File APIs are not fully supported in this browser.');
}

let resizeTimer;

window.addEventListener('resize', function () {

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {

        // Dispatch the event.
        const event = new Event('debouncedResize');
        window.dispatchEvent(event);

    }, 250);

}, false);


if (!navigator.hardwareConcurrency)
    console.error('The hardwareConcurrency APIs are not fully supported in this browser.');
const renderWorkerCount = navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 2;
console.log(`Creating ${renderWorkerCount} render workers.`);
// narrowly tailored Promise for multiplexed worker access, relies on sequential worker execution
let renderWorker = new Array(renderWorkerCount);
let renderCallbacks = new Array(renderWorkerCount);

function renderPromise(i, message, transfer) {
    return new Promise(resolve => {
        renderCallbacks[i].push(resolve);
        renderWorker[i].postMessage(message, transfer);
    });
}

export function startWorkers(workerOrUrl) {
    if (!workerOrUrl) {
        workerOrUrl = './spectroplot.worker.js'
    }
    if (window.Worker) {
        console.log(`Starting ${renderWorkerCount} render workers.`);

        for (let i = 0; i < renderWorkerCount; ++i) {
            renderWorker[i] = (typeof workerOrUrl === 'string') ? new Worker(workerOrUrl) : new workerOrUrl()
            // with Webpack 5 we could fallback to: new Worker(new URL('./worker.js', import.meta.url))
            renderCallbacks[i] = [];
            renderWorker[i].onmessage = (msg) => {
                const callback = renderCallbacks[i].shift();
                if (callback)
                    callback(msg);
            };
        }

        const ab = new ArrayBuffer(1);
        renderWorker[0].postMessage({ transferable: ab}, [ab]);
        if (ab.byteLength) {
            console.log('Transferables are not supported in your browser!');
        } else {
            // Transferables are supported.
        }

    } else {
        alert('The Worker APIs are not fully supported in this browser.');
        // TODO: emulate web worker.
    }
}

export class Spectroplot {
    constructor(options) {
        this.constrain = {
            n: value => parseInt(value, 10) || 512, // 2 ** ~~(Math.log2(n) + 0.5)
            height: value => parseInt(value, 10) || 0,
            windowf: value => lookup(windows, value) || windows.blackmanHarrisWindow,
            zoom: value => parseInt(value, 10) || 1,
            gain: value => parseInt(value, 10) || 0,
            range: value => parseInt(value, 10) || 30,
            cmap: value => lookup(cmaps, value) || cmaps.cube1_cmap,
            ampHeight: value => parseInt(value, 10) || 0,
            minmaxHeight: value => parseInt(value, 10) || 0,
            histWidth: value => parseInt(value, 10) || 0,
            channelMode: value => (typeof value === 'string') ? !value.toLowerCase().startsWith('i') : value,
        }
        let defaults = {
            n: 512, // powers of 2 only
            width: 3000,
            height: 512, // 0 = auto
            zoom: 1,
            windowf: windows.blackmanHarrisWindow,
            gain: 6,
            range: 30,
            cmap: cmaps.cube1_cmap,
            ampHeight: 0,
            minmaxHeight: 20,
            channelMode: false,

            dbfsWidth: 60,
            dbfsHeight: 0, // 0 = auto: height + timeHeight
            freqWidth: 40,
            timeHeight: 20,
            rampHeight: 0, // 0 = auto
            rampTop: 10,
            rampWidth: 15,
            histWidth: 100,
            histLeft: 55,
        };
        options = Object.assign({}, defaults, options);

        this.tag = Math.random().toString().substring(2); // unique instance tag
        this.buffer = null;
        this.fileinfo = null;
        this.parent = selector(options.parent);
        this.n = options.n;
        this.width = options.width;
        this.height = options.height;
        this.zoom = options.zoom;
        this.windowf = lookup(windows, options.windowf);
        this.gain = options.gain;
        this.range = options.range;
        this.cmap = lookup(cmaps, options.cmap);
        this.ampHeight = options.ampHeight;
        this.minmaxHeight = options.minmaxHeight;
        this.channelMode = options.channelMode;
        this.histWidth = options.histWidth;
        this.renderInfo = options.renderInfo;
        this.setTheme(options.theme);
        this.opts = options;

        if (!renderWorker[0])
            startWorkers(options.workerOrUrl)

        if (options.filedata)
            this.setData(options.filedata);

        if (window.ResizeObserver) {
            // currently only with recent Edge, Firefox, Chrome, Opera
            this.resizeObserver = new ResizeObserver(() => {
                this.processData()
            })
            this.resizeObserver.observe(this.parent)
        } else {
            // won't detect layout changes though
            window.addEventListener('debouncedResize', this, false)
        }
    }

    enableGuides() {
        const guides = this.parent.getElementsByClassName('guides')[0];
        let events = ['mousedown', 'mousemove', 'mouseup'];
        if ('ontouchstart' in window) {
            events = events.concat('touchstart', 'touchmove', 'touchend');
        }
        events.forEach(evt => guides.addEventListener(evt, this, false));
    }

    disableGuides() {
        const guides = this.parent.getElementsByClassName('guides')[0];
        let events = ['mousedown', 'mousemove', 'mouseup'];
        if ('ontouchstart' in window) {
            events = events.concat('touchstart', 'touchmove', 'touchend');
        }
        events.forEach(evt => guides.removeEventListener(evt, this, false));
    }

    enableButtons() {
        /*
        const selects = this.parent.querySelectorAll('.modal-select>.select');
        SelectModal.forAll(selects);
        */
        //document.querySelector('select[name="zoom"]').onchange = changeEventHandler;
        this.parent.getElementsByClassName('N')[0].addEventListener('change', (e) => this.setN(e.target.value), false);
        this.parent.getElementsByClassName('window')[0].addEventListener('change', (e) => this.setWindow(e.target.value), false);
        this.parent.getElementsByClassName('zoom')[0].addEventListener('change', (e) => this.setZoom(e.target.value), false);
        this.parent.getElementsByClassName('gain')[0].addEventListener('change', (e) => this.setGain(e.target.value), false);
        this.parent.getElementsByClassName('range')[0].addEventListener('change', (e) => this.setRange(e.target.value), false);
        this.parent.getElementsByClassName('cmap')[0].addEventListener('change', (e) => this.setCmap(e.target.value), false);
        this.parent.getElementsByClassName('ampHeight')[0].addEventListener('change', (e) => this.setAmpHeight(e.target.value), false);
        this.parent.getElementsByClassName('minmaxHeight')[0].addEventListener('change', (e) => this.setMinmaxHeight(e.target.value), false);
        this.parent.getElementsByClassName('histWidth')[0].addEventListener('change', (e) => this.setHistWidth(e.target.value), false);
        this.parent.getElementsByClassName('channelMode')[0].addEventListener('change', (e) => this.setChannelMode(e.target.value), false);
    }

    setTheme(options) {
        let defaults = {
            histoStroke: '#b0b',
            histoFill: 'rgba(187,0,187,0.2)',
            histoLine: 2,
            dbfsStroke: '#999',
            dbfsFill: 'rgba(153,153,153,0.2)',
            dbfsLine: 2,
            rampFill: '#666',
            freqLabelFill: '#333',
            freqMinorFill: '#CCC',
            freqMajorFill: '#666',
            timeLabelFill: '#333',
            timeMinorFill: '#CCC',
            timeMajorFill: '#666',
            guidesBgFill: 'rgba(0,0,0,0.3)',
            guidesDragFill: 'rgba(0,0,0,0.3)',
            guidesHairStroke: '#fff',
            guidesInfoBgFill: 'rgba(255,255,255,0.8)',
            guidesInfoTextFill: '#666',
            //minmaxCmap: colorRamp,
            //ampCmap: colorRamp,
        }
        const themes = {}
        themes.dark = {
            histoStroke: '#b0b',
            histoFill: 'rgba(191,0,191,0.2)',
            dbfsStroke: '#999',
            dbfsFill: 'rgba(153,153,153,0.2)',
            rampFill: '#999',
            freqLabelFill: '#DDD',
            freqMinorFill: '#666',
            freqMajorFill: '#999',
            timeLabelFill: '#DDD',
            timeMinorFill: '#666',
            timeMajorFill: '#999',
            guidesBgFill: 'rgba(0,0,0,0.3)',
            guidesDragFill: 'rgba(0,0,0,0.3)',
            guidesHairStroke: '#fff',
            guidesInfoBgFill: 'rgba(255,255,255,0.8)',
            guidesInfoTextFill: '#666',
            //minmaxCmap: colorRamp,
            //ampCmap: colorRamp,
        }
        if (typeof options === 'string' && themes[options]) defaults = themes[options]
        this.theme = Object.assign({}, defaults, options);
        return this.processData()
    }

    // Release all event handlers and resources
    destroy() {
        if (this.dropZone)
            this.dropZone.destroy()
        if (this.resizeObserver)
            this.resizeObserver.disconnect()
        window.removeEventListener('debouncedResize', this, false);
        this.disableGuides()
        if (ArrayBuffer.transfer)
            ArrayBuffer.transfer(this.buffer, 0);
    }

    setOption(opt, value) {
        this[opt] = this.constrain[opt](value)
        return this.processData()
    }

    setOptions(opts) {
        for (let opt in opts) {
            this[opt] = this.constrain[opt](opts[opt])
        }
        return this.processData()
    }

    setData(filedata) {
        let promise;
        // handle if the arg is a url
        if (typeof filedata === 'string') {
            promise = loadUrl(filedata);
        } else {
            promise = Promise.resolve(filedata);
        }

        // TODO: if there is no resolved arrayBuffer we should trigger a load

        return promise
            .then(filedata => {
                this.fileinfo = filedata;
                this.buffer = filedata.fileBuffer;
                this.sampleFormat = parseFormat(filedata.name);
                const nameInfo = parseFreqRate(filedata.name);
                this.center_freq = nameInfo.freq;
                this.sample_rate = nameInfo.rate;

                this.sampleView = new SampleView(this.sampleFormat, null, this.sample_rate, this.center_freq)
                return this.sampleView.loadBuffer(this.buffer)
            })
            .then(() => {
                this.sample_rate = this.sampleView.sampleRate;
                this.buildInfo();
                return this.processData();
            })
    }

    setN(value) {
        this.n = this.constrain['n'](value);
        return this.processData();
    }
    setHeight(value) {
        this.height = this.constrain['height'](value);
        return this.processData();
    }
    setWindow(value) {
        this.windowf = this.constrain['windowf'](value);
        return this.processData();
    }
    setZoom(value) {
        this.zoom = this.constrain['zoom'](value);
        return this.processData();
    }
    setGain(value) {
        this.gain = this.constrain['gain'](value);
        return this.processData();
    }
    setRange(value) {
        this.range = this.constrain['range'](value);
        return this.processData();
    }
    setCmap(value) {
        this.cmap = this.constrain['cmap'](value);
        return this.processData();
    }
    setAmpHeight(value) {
        this.ampHeight = this.constrain['ampHeight'](value);
        return this.processData();
    }
    setMinmaxHeight(value) {
        this.minmaxHeight = this.constrain['minmaxHeight'](value);
        return this.processData();
    }
    setHistWidth(value) {
        this.histWidth = this.constrain['histWidth'](value);
        return this.processData();
    }
    setChannelMode(value) {
        this.channelMode = this.constrain['channelMode'](value);
        return this.processData();
    }

    buildInfo() {
        const base_scale = autorange(this.center_freq, 10.0);
        const rate_scale = autorange(this.sample_rate, 10.0);
        const file = this.fileinfo;

        // TODO: refactor
        //const sampleWidth = this.sampleView.sampleWidth;
        const sampleCount = this.sampleView.sampleCount;
        const stride = (sampleCount - this.n) / (this.width - 1);

        const lastModified = file.lastModifiedDate || new Date(file.lastModified || 0); // use lastModifiedDate only on IE

        const infos = []
        infos.push({ text: 'File name', value: strip(file.name) })
        infos.push({ text: 'File type', value: file.type || 'n/a' })
        infos.push({ text: 'File size', value: `${file.size} bytes` })
        infos.push({ text: 'Last modified', value: lastModified.toISOString() })
        infos.push({ text: 'Sample format', value: this.sampleFormat })
        infos.push({ text: 'No. of samples', value: `${sampleCount} S` })
        infos.push({ text: 'Stride (window to window)', value: `× ${stride.toFixed(1)}` })
        if (this.center_freq)
            infos.push({ text: 'Center frequency', value: `${this.center_freq / base_scale.scale}${base_scale.prefix}` })
        if (this.sample_rate > 1)
            infos.push({ text: 'Sample rate', value: `${this.sample_rate / rate_scale.scale}${rate_scale.prefix}` })
        if (this.sample_rate > 1)
            infos.push({ text: 'Length (time)', value: `${(sampleCount / this.sample_rate).toFixed(3)} s` })
        if (this.dBfs_min)
            infos.push({ text: 'dBfs scale', value: `${this.dBfs_min.toFixed(1)} dB – ${this.dBfs_max.toFixed(1)} dB` })

        if (this.renderInfo) {
            this.renderInfo(infos)
        } else {
            let text = ''
            for (let item of infos) {
                text += `<span title="${item.text}">${item.value}</span>`
            }
            const info = this.parent.parentNode.getElementsByClassName('fileinfo')[0];
            info.innerHTML = text

        }
    }

    drawColorRamp() {
        const gain = this.gain;
        const dB_range = this.range;
        const height = this.height || this.n;

        // draw color ramp
        const dbfsWidth = this.opts.dbfsWidth + this.histWidth;
        const dbfsHeight = height + this.opts.timeHeight; // this.opts.dbfsHeight;
        const dbfsCanvas = this.parent.getElementsByClassName('dbfs')[0];
        dbfsCanvas.width = dbfsWidth;
        dbfsCanvas.height = dbfsHeight;
        dbfsCanvas.style.width = dbfsCanvas.width + 'px';
        dbfsCanvas.parentNode.style.width = dbfsCanvas.width + 'px';
        //dbfsCanvas.style.height = dbfsCanvas.height;
        const dbfsCtx = dbfsCanvas.getContext('2d');
        dbfsCtx.font = '10px sans-serif';
        const font_y = 10;

        const rampWidth = this.opts.rampWidth;
        const rampHeight = height;
        const rampLeft = 35; // space for the ramp marker
        const rampTop = this.opts.rampTop;
        const rampData = newImageData(rampWidth, rampHeight);
        const cmap = this.cmap;
        const color_max = cmap.length - 1;

        for (let y = 0; y < rampHeight; ++y) {
            for (let x = 0; x < rampWidth; ++x) {
                const idx = Math.round(y * color_max / (rampHeight - 1));
                const p = color_max - idx;
                const color = cmap[p];
                const j = x * 4 + rampWidth * y * 4;
                rampData.data[j + 0] = color[0]; // R
                rampData.data[j + 1] = color[1]; // G
                rampData.data[j + 2] = color[2]; // B
                rampData.data[j + 3] = 255; // A
                //dbfsCtx.fillRect(rangeWidth - 5, y, 5, 1);

            }
        }
        dbfsCtx.putImageData(rampData, rampLeft, rampTop);

        // draw dbFS marker
        // want a dbFS marker for about every 70 pixels
        const num_dbfs_markers = height / 50;
        let dbfs_markers_step = (gain + dB_range) / num_dbfs_markers;
        // round to 3
        dbfs_markers_step = Math.round(dbfs_markers_step / 3) * 3;
        if (dbfs_markers_step < 1.0) dbfs_markers_step = 1.0;

        dbfsCtx.fillStyle = this.theme.rampFill;
        for (let d = gain; d < gain + dB_range; d += dbfs_markers_step) {
            if (d >= gain + dB_range - dbfs_markers_step)
                d = gain + dB_range;
            const y = rampTop + rampHeight * (d - gain) / dB_range;
            dbfsCtx.fillRect(30, y, 5, 1);
            let y1 = y + font_y / 2 - 1; // adjust the sign to line up
            //if (d <= gain)
            //    y1 = y + 3 * font_y / 2; // push first label down
            //else if (d >= gain + dB_range)
            //    y1 = y - font_y / 2; // pull last label up
            dbfsCtx.fillText((-d).toFixed(0), 11, y1);
        }
    }

    /** Prints color histogram. */
    drawHistograms(c_hist, cB_hist) {
        const histWidth = this.histWidth;
        const histLeft = this.opts.histLeft;
        if (!histWidth) return;

        const height = this.height || this.n;
        const cmap = this.cmap;
        const color_max = cmap.length - 1;

        const dbfsCanvas = this.parent.getElementsByClassName('dbfs')[0];
        const dbfsCtx = dbfsCanvas.getContext('2d');

        const rampHeight = height;
        const rampTop = this.opts.rampTop;

        //console.log(c_hist);
        let c_hist_max = 0;

        dbfsCtx.lineWidth = this.theme.histoLine;
        dbfsCtx.strokeStyle = this.theme.histoStroke;
        dbfsCtx.fillStyle = this.theme.histoFill;
        dbfsCtx.beginPath();
        dbfsCtx.moveTo(histLeft, rampTop);
        for (let i = 0; i <= color_max; ++i)
            if (c_hist[i] > c_hist_max) c_hist_max = c_hist[i];
        //console.log(`c_hist_max = ${c_hist_max}`);
        for (let y = 0; y < rampHeight; ++y) {
            let i = color_max - Math.round(y * color_max / (rampHeight - 1));
            let h = histWidth * c_hist[i] / c_hist_max;
            //int h1 = i == 0 ? histWidth * c_hist[1] / c_hist_max : histWidth * c_hist[i - 1] / c_hist_max;
            //dbfsCtx.fillStyle = 'rgba(191,0,0,0.1)';
            //dbfsCtx.fillRect(histLeft, rampTop + y, h, 1);
            //dbfsCtx.fillStyle = `rgb(${55 + 20 * (10 - h)},0,0)`;
            //dbfsCtx.fillRect(histLeft + h - 1, rampTop + y, 1, 1);
            dbfsCtx.lineTo(histLeft + h, rampTop + y);
        }
        dbfsCtx.lineTo(histLeft, rampTop + rampHeight);
        //dbfsCtx.closePath();
        dbfsCtx.fill();
        dbfsCtx.stroke();

        // print dB histogram
        const cB_hist_size = cB_hist.length
        let cB_hist_max = 0;
        let cB_hist_mean = 0;
        for (let i = 0; i < cB_hist_size; ++i) {
            if (cB_hist[i] > cB_hist_max)
                cB_hist_max = cB_hist[i];
            cB_hist_mean += cB_hist[i] / cB_hist_size;
        }
        console.log(`cB_hist_mean = ${cB_hist_mean}`);

        dbfsCtx.lineWidth = this.theme.dbfsLine;
        dbfsCtx.strokeStyle = this.theme.dbfsStroke;
        dbfsCtx.fillStyle = this.theme.dbfsFill;
        dbfsCtx.beginPath();
        dbfsCtx.moveTo(histLeft, rampTop);
        for (let y = 0; y < rampHeight; ++y) {
            const i = Math.round(y * (cB_hist_size - 1) / (rampHeight - 1));
            const h = histWidth * cB_hist[i] / cB_hist_max;
            //int h1 = i == 0 ? histWidth * cB_hist[1] / cB_hist_max : histWidth * cB_hist[i - 1] / cB_hist_max;
            //dbfsCtx.fillStyle = 'rgba(0,191,0,0.1)';
            //dbfsCtx.fillRect(histLeft, rampTop + y, h, 1);
            //dbfsCtx.fillStyle = `rgb(0,${55 + 20 * (10 - h)},0)`;
            //dbfsCtx.fillRect(histLeft + h - 1, rampTop + y, 1, 1);
            dbfsCtx.lineTo(histLeft + h, rampTop + y);
        }
        dbfsCtx.lineTo(histLeft, rampTop + rampHeight);
        //dbfsCtx.closePath();
        dbfsCtx.fill();
        dbfsCtx.stroke();
    }

    drawAxis() {
        const width = this.width;
        const height = this.height || this.n;

        const center_freq = this.center_freq;
        const sample_rate = this.sample_rate;

        //const sampleWidth = this.sampleView.sampleWidth;
        const sampleCount = this.sampleView.sampleCount;

        // draw y-axis
        const freqWidth = this.opts.freqWidth;
        const freqCanvas = this.parent.getElementsByClassName('freq')[0];
        freqCanvas.width = freqWidth;
        freqCanvas.height = this.height || this.n;
        freqCanvas.style.width = freqCanvas.width + 'px';
        freqCanvas.parentNode.style.width = freqCanvas.width + 'px';
        //freqCanvas.style.height = freqCanvas.height + 'px';
        const freqCtx = freqCanvas.getContext('2d');
        freqCtx.font = '10px sans-serif';
        const fontY = 10;

        const min_spacing = 16;
        const max_ticks = ~~((height / 2 / min_spacing));
        const step = autostep(sample_rate / 2, max_ticks);
        const step_count = ~~(0.5 + (sample_rate / 2) / step) - 1; // round up and subtract the last tick
        const pixel_per_hz = (height / 2) / (sample_rate / 2);

        const freq_scale = autorange(center_freq + sample_rate, 10.0);

        freqCtx.fillStyle = this.theme.freqLabelFill;
        freqCtx.fillText(`f[${freq_scale.prefix}Hz]`, 6, fontY - 1);

        freqCtx.fillStyle = this.theme.freqMinorFill;
        for (let j = -step_count * 6; j <= step_count * 6; ++j) {
            const y = ~~(height / 2 - j * step / 5 * pixel_per_hz);
            freqCtx.fillRect(freqWidth - 5, y - 1, 5, 1);
        }

        freqCtx.fillStyle = this.theme.freqMajorFill;
        for (let j = -step_count; j <= step_count; ++j) {
            const y = ~~(height / 2 - j * step * pixel_per_hz);
            const scaleHz = (center_freq + j * step) / freq_scale.scale;
            freqCtx.fillRect(freqWidth - 10, y - 1, 10, 1);

            if (this.channelMode)
                freqCtx.fillText(Math.abs(scaleHz).toFixed(2), 0, y + fontY - 2);
            else if (center_freq)
                freqCtx.fillText(scaleHz.toFixed(3), 0, y + fontY - 2);
            else
                freqCtx.fillText(scaleHz.toFixed(2), 0, y + fontY - 2);
        }

        // draw x-axis
        const timeHeight = this.opts.timeHeight;
        const timeCanvas = this.parent.getElementsByClassName('time')[0];
        timeCanvas.width = width;
        timeCanvas.height = timeHeight;
        //timeCanvas.style.width = timeCanvas.width;
        //timeCanvas.style.height = timeCanvas.height;
        const timeCtx = timeCanvas.getContext('2d');
        timeCtx.font = '10px sans-serif';
        const fontX = timeCtx.measureText('8').width;

        const total_time = sampleCount / sample_rate;
        const time_scale = autorange(total_time, 10.0);
        const total_time_scaled = total_time / time_scale.scale;

        timeCtx.fillStyle = this.theme.timeLabelFill;
        timeCtx.fillText(`t[${time_scale.prefix}s]`, 32, 18);

        // want a time marker for about every 85 pixels
        const num_time_markers = width / 85;
        let time_markers_step = total_time_scaled / num_time_markers;
        // round to 5
        time_markers_step = ~~(time_markers_step / 5) * 5;
        if (time_markers_step < 1.0) time_markers_step = 1.0;

        const time_per_pixel = width / total_time_scaled;
        console.log(`total_time_scaled=${total_time_scaled}, time_markers_step=${time_markers_step}, time_per_pixel=${time_per_pixel}`);

        timeCtx.fillStyle = this.theme.timeMinorFill;
        for (let t = 0.0; t < total_time_scaled; t += time_markers_step / 5) {
            if (t >= total_time_scaled - time_markers_step)
                t = total_time_scaled;
            const x = ~~(t * time_per_pixel);
            timeCtx.fillRect(x, 0, 1, 5);
        }

        timeCtx.fillStyle = this.theme.timeMajorFill;
        for (let t = 0.0; t < total_time_scaled; t += time_markers_step) {
            if (t >= total_time_scaled - time_markers_step)
                t = total_time_scaled;
            const x = ~~(t * time_per_pixel);
            timeCtx.fillRect(x, 0, 1, 10);

            let x1 = x + 3;
            if (t >= total_time_scaled)
                x1 = x - 6 * fontX;
            //timeCtx.fillText(`${t.toFixed(0)}${time_scale.prefix}s`, x1, 18);
            timeCtx.fillText(t.toFixed(0), x1, 16);
        }

        // update guides
        const guides = this.parent.getElementsByClassName('guides')[0];
        guides.style.width = width + 'px';
        guides.style.height = (height + timeHeight + this.ampHeight + this.minmaxHeight) + 'px';

        this.hz_per_pixel = sample_rate / height;
        this.hz_offset = center_freq - sample_rate / 2;
        this.time_per_pixel = sampleCount / sample_rate / width;
        this.freq_scale = freq_scale;
        this.time_scale = time_scale;
    }


    drawGuides(x, y) {
        const width = this.width;
        const height = this.height || this.n;
        const timeHeight = this.opts.timeHeight;
        const fullHeight = (height + timeHeight + this.ampHeight + this.minmaxHeight);

        const guidesCanvas = this.parent.getElementsByClassName('guides')[0];
        guidesCanvas.width = width;
        guidesCanvas.height = fullHeight;
        const ctx = guidesCanvas.getContext('2d');
        ctx.font = '14px sans-serif';

        //ctx.globalCompositeOperation = 'xor';

        ctx.fillStyle = this.theme.guidesBgFill;
        ctx.fillRect(x - 2, 0, 3, height);
        ctx.fillRect(0, y - 2, width, 3);
        if (this.isDrag) {
            ctx.fillStyle = this.theme.guidesDragFill;
            ctx.fillRect(this.dragX + 1, 0, x - this.dragX, height);
        }

        ctx.strokeStyle = this.theme.guidesHairStroke;
        ctx.setLineDash([1, 1]);

        ctx.beginPath();
        ctx.moveTo(x - 0.5, 0);
        ctx.lineTo(x - 0.5, height);
        ctx.moveTo(0, y - 0.5);
        ctx.lineTo(width, y - 0.5);
        ctx.stroke();

        const y1 = height - y; // Y is inverted
        const f = (y1 * this.hz_per_pixel + this.hz_offset) / this.freq_scale.scale;
        const t = (this.isDrag ? x - this.dragX : x) * this.time_per_pixel / this.time_scale.scale;
        const text = `f: ${f.toFixed(3)} ${this.freq_scale.prefix}Hz, t: ${t.toFixed(this.isDrag ? 4 : 1)} ${this.time_scale.prefix}s`;

        // TODO: this should have a hysteresis
        const xOffset = x < width / 2 ? 8 : -190;
        const yOffset = y < height / 2 ? 8 : -22;

        ctx.fillStyle = this.theme.guidesInfoBgFill;
        ctx.fillRect(x + xOffset, y + yOffset, 180, 14);
        ctx.fillStyle = this.theme.guidesInfoTextFill;
        ctx.fillText(text, x + xOffset + 4, y + yOffset + 12);
    }

    processData() {
        if (!this.buffer) return Promise.resolve();
        if (!this.sampleView || !this.sampleView.buffer) return Promise.resolve();

        console.time('fft process ' + this.tag);
        const extraWidth = this.opts.freqWidth + this.opts.dbfsWidth + this.histWidth;
        this.width = this.parent.clientWidth * this.zoom - extraWidth;

        const sampleFormat = this.sampleView.format;
        const sampleWidth = this.sampleView.sampleWidth;
        const sampleCount = this.sampleView.sampleCount;

        //const center_freq = this.center_freq;
        //const sample_rate = this.sample_rate;

        const n = this.n;
        const { window, weight } = this.windowf(n); // blackmanHarrisWindow(n);
        //const block_norm = 1.0 / n;
        const block_norm = 1.0 / weight;
        const block_norm_db = 10 * Math.log10(block_norm);
        console.log(`block_norm=${n}, ${block_norm_db} dB, window weight=${weight}`);

        // cu8 has a possible range of 0 to -60 dBfs
        const gain = this.gain;
        const dB_range = this.range;

        this.dBfs_min = 0.0;
        this.dBfs_max = -200.0;

        const cmap = this.cmap;
        // OOB colors?
        cmap[0] = [0, 0, 0];
        cmap[cmap.length - 1] = [255, 255, 255];
        const color_norm = cmap.length / -dB_range;
        console.log(`colors=${cmap.length}, color_norm=${color_norm}`);

        const cB_hist_size = 1000; // centi Bell (0.1 dB)
        const cB_hist = new Array(cB_hist_size).fill(0); // -0.0 to -100.0 dB
        const c_hist = new Array(cmap.length).fill(0);

        //const stride = 128;
        //const width = Math.floor((sampleCount - n) / stride);
        const width = this.width;
        const points = width;
        const stride = (sampleCount - n) / (points - 1);
        console.log(`samples=${sampleCount} / stride=${stride}`);

        const height = n;
        console.log(`width=${width} height=${height}`);

        const fftCanvas = this.parent.getElementsByClassName('fft')[0];
        fftCanvas.width = width;
        fftCanvas.height = height;
        if (this.height) {
            fftCanvas.style.height = this.height + 'px';
            fftCanvas.style.width = width + 'px';
        } else { // 0 = auto
            fftCanvas.style.height = '';
            fftCanvas.style.width = '';
        }

        const minmaxCanvas = this.parent.getElementsByClassName('minmax')[0];
        minmaxCanvas.width = width;
        minmaxCanvas.height = this.minmaxHeight;

        const ampCanvas = this.parent.getElementsByClassName('amp')[0];
        ampCanvas.width = width;
        ampCanvas.height = this.ampHeight;


        console.time('fft render ' + this.tag);
        const startSample = 0; // ~~(this.buffer.byteLength / 4);
        const endSample = ~~(this.buffer.byteLength / sampleWidth); // 16 * 5); // TODO: should be this.sampleView.buffer?
        const sliceWidth = ~~(width / renderWorkerCount);
        let renders = []
        for (let i = 0; i < renderWorkerCount; ++i) {
            const bufferSlice = this.sampleView.slice(i, renderWorkerCount, startSample, endSample);

            const fftCtx = {
                block_norm: block_norm,
                gain: gain,
                range: dB_range,
                cmap: cmap,
                n: n,
                window: window,
                width: sliceWidth,
                offset: i * sliceWidth,
                buffer: bufferSlice,
                format: sampleFormat,
                channelMode: this.channelMode,
            };

            const promise = renderPromise(i, fftCtx, [bufferSlice])
            .then(msg => {
                if (msg.data.dBfs_min < this.dBfs_min) this.dBfs_min = msg.data.dBfs_min;
                if (msg.data.dBfs_max > this.dBfs_max) this.dBfs_max = msg.data.dBfs_max;

                for (let x = 0; x < cB_hist_size; x++) {
                    cB_hist[x] += msg.data.cB_hist[x];
                }
                for (let x = 0; x < this.cmap.length; x++) {
                    c_hist[x] += msg.data.c_hist[x];
                }

                // const image = msg.data.imageData; // would need polyfill in worker
                const image = newImageData(msg.data.imageData.data, sliceWidth);
                //const fftCanvas = this.parent.getElementsByClassName('fft')[0];
                const fftCtx = fftCanvas.getContext('2d'); // TODO: { alpha: false }
                fftCtx.putImageData(image, msg.data.offset, 0);

                //const ampCanvas = this.parent.getElementsByClassName('amp')[0];
                const ampCtx = ampCanvas.getContext('2d');
                const ampScale = this.ampHeight / 256;
                //const minmaxCanvas = this.parent.getElementsByClassName('minmax')[0];
                const minmaxCtx = minmaxCanvas.getContext('2d');
                const minmaxScale = this.minmaxHeight / 256;
                for (let x = 0; x < sliceWidth; x++) {
                    const g_min = msg.data.gauge_mins[x];
                    const g_max = msg.data.gauge_maxs[x];
                    const g_amp = msg.data.gauge_amps[x];
                    if (this.minmaxHeight) {
                        minmaxCtx.fillStyle = `rgb(${255 - g_max},${255 - g_max},${255 - g_max})`;
                        //const c = cmap[g_max];
                        //minmaxCtx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
                        minmaxCtx.fillRect(x + msg.data.offset, ~~(g_min * minmaxScale), 1, ~~((g_max - g_min) * minmaxScale));
                    }
                    if (this.ampHeight) {
                        ampCtx.fillStyle = `rgb(${255 - g_max},${255 - g_max},${255 - g_max})`;
                        //const c = cmap[g_max];
                        //ampCtx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
                        ampCtx.fillRect(x + msg.data.offset, 0, 1, ~~(g_amp * ampScale));
                    }
                }
            });
            renders.push(promise);
        }

        this.drawColorRamp();
        this.drawAxis();
        console.timeEnd('fft process ' + this.tag);

        return Promise.all(renders)
        .then(() => {
            console.timeEnd('fft render ' + this.tag);
            this.buildInfo();
            this.drawHistograms(c_hist, cB_hist);
        });

    }

    createDropZone(elementOrSelector) {
        elementOrSelector = elementOrSelector || this.parent.getElementsByClassName('dropzone')[0];
        const fileLoader = this.setData.bind(this);
        this.dropZone = new DropZone(elementOrSelector, fileLoader)
    }

    // events

    handleEvent(e) {
        //console.log(e.type)
        const handler = e.type
        if (typeof this[handler] === 'function') {
            return this[handler](e);
        }
    }

    debouncedResize() {
        this.processData()
    }

    mousedown(e) {
        this.dragX = e.offsetX;
        this.dragY = e.offsetY;
        this.isDrag = true;
        e.preventDefault();
    }

    mouseup(e) {
        this.isDrag = false;
        e.preventDefault();
    }

    mousemove(e) {
        window.requestAnimationFrame(this.drawGuides.bind(this, e.offsetX, e.offsetY));
        e.stopPropagation();
        e.preventDefault();
    }

    touchstart(e) {
        console.log(e);
        // single touch or start of a drag
        // touch events don't have offsetX, offsetY
        const clientRect = e.target.getBoundingClientRect();

        const t = e.targetTouches[0];
        const offsetX = t.clientX - clientRect.left;
        const offsetY = t.clientY - clientRect.top;

        window.requestAnimationFrame(this.drawGuides.bind(this, offsetX, offsetY));

        if (e.targetTouches.length > 1)
            e.preventDefault(); // don't allow multitouches
    }

    touchcancel(e) {
        if (e.targetTouches.length <= 1) {
            this.isDrag = false;
        }
    }

    touchend(e) {
        if (e.targetTouches.length <= 1) {
            this.isDrag = false;
        }
    }

    touchmove(e) {
        // touch events don't have offsetX, offsetY
        const clientRect = e.target.getBoundingClientRect();

        let t1 = e.targetTouches[0];
        if (e.targetTouches.length == 2) {
            // select range
            this.isDrag = true;
            const t2 = e.targetTouches[1];
            if (t1.clientX < t2.clientX) {
                this.dragX = t1.clientX - clientRect.left;
                this.dragY = t1.clientY - clientRect.top;
                t1 = t2;
            } else {
                this.dragX = t2.clientX - clientRect.left;
                this.dragY = t2.clientY - clientRect.top;
            }
            e.preventDefault();
        }

        const offsetX = t1.clientX - clientRect.left;
        const offsetY = t1.clientY - clientRect.top;

        window.requestAnimationFrame(this.drawGuides.bind(this, offsetX, offsetY));

        e.stopPropagation();
    }
}


function fetchArraybuffer(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(null);
    });
}

export function loadUrl(url, fileLoader) {
    url = url || '/bresser_3ch/gfile001.cu8';
    var basename = url.substring(url.lastIndexOf('/') + 1);
    if (!url.startsWith('//') && url.startsWith('/')) {
        basename = url.substring(1);
        url = 'https://cdn.jsdelivr.net/gh/merbanan/rtl_433_tests@latest/tests' + url;
    }

    return fetchArraybuffer(url).then(xhr => {
        var arrayBuffer = xhr.response; // Note: not xhr.responseText
        if (!arrayBuffer) {
            throw new Error('No data!');
        }
        console.log(xhr.getResponseHeader('Last-Modified'));
        const fileinfo = {
            fileBuffer: arrayBuffer,
            lastModified: xhr.getResponseHeader('Last-Modified'),
            name: basename,
            type: xhr.getResponseHeader('Content-Type'),
            size: arrayBuffer.byteLength,
        };
        if (fileLoader)
            fileLoader(fileinfo);
        return fileinfo;
    });
}

// example

/*
// load data if requested
if (document.location.hash) {
    loadUrl(document.location.hash.substring(1), fileLoader);
}
*/

// easy cloning

let cloneParent;
let cloneTemplate;

export function initCloning(elementOrSelector) {
    cloneParent = selector(elementOrSelector);
    // grab the template and remove from DOM
    cloneTemplate = cloneParent.firstElementChild;
    // cloneTemplate.remove(); // would need polyfill on IE
    cloneParent.removeChild(cloneTemplate);

    const dropZone = new DropZone('#dropZone', cloneLoader)
    dropZone.addInput('#inputfile')
    dropZone.addInput('#addfile')
}

function cloneLoader(filedata) {
    const parent = cloneTemplate.cloneNode(true);
    cloneParent.appendChild(parent);
    const spectroplot = new Spectroplot({
        parent,
        filedata,
    })
    spectroplot.enableGuides()
    spectroplot.enableButtons()
    // spectroplot.createDropZone($refs.dropzone)
}
