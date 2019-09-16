/**
    @file Class for viewing sample formats.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/** Class for viewing sample formats. */
class SampleView {
    constructor(format, buffer, sampleRate, centerFreq) {
        /** A float representing the sample rate, in samples per second, of the data stored in the buffer. */
        this.sampleRate = sampleRate || 250000

        /** A float representing the center frequency, in Hz, of the data stored in the buffer. */
        this.centerFreq = centerFreq || 0

        format = format.toUpperCase()
        /** A string representing the data format, of the data stored in the buffer. */
        this.format = format

        // TODO: Endianess?
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView

        let typedArray, sampleBias, sampleScale, sampleWidth
        if (format == 'CU4') {
            // CU4 - Uint8Array (needs unpacking)
            sampleBias = 7.5
            sampleScale = 1.0 / 7.5
            sampleWidth = 1 // bytes
            typedArray = Uint8Array
            this.sampleI = this.unpackI_CU4
            this.sampleQ = this.unpackQ_CU4
        }
        else if (format == 'CS4') {
            // CS4 - Uint8Array (needs unpacking)
            sampleBias = 0
            sampleScale = 1.0 / 8.0
            sampleWidth = 1 // bytes
            typedArray = Uint8Array
            this.sampleI = this.unpackI_CS4
            this.sampleQ = this.unpackQ_CS4
        }
        else if (format == 'CU8' || format == 'DATA' || format == 'COMPLEX16U') {
            // CU8 - Uint8Array
            sampleBias = 127.5 // or 127? or 128?
            sampleScale = 1.0 / 127.5
            sampleWidth = 2 // bytes
            typedArray = Uint8Array
        }
        else if (format == 'CS8' || format == 'COMPLEX16S') {
            // CS8 - Int8Array
            sampleBias = 0
            sampleScale = 1.0 / 128.0
            sampleWidth = 2 // bytes
            typedArray = Int8Array
        }
        else if (format == 'CU16') {
            // CU16 - Uint16Array
            sampleBias = 32767.5
            sampleScale = 1.0 / 32768.0
            sampleWidth = 4 // bytes
            typedArray = Uint16Array
        }
        else if (format == 'CS16') {
            // CS16 - Int16Array
            sampleBias = 0
            sampleScale = 1.0 / 32768.0
            sampleWidth = 4 // bytes
            typedArray = Int16Array
        }
        else if (format == 'CU12') {
            // CU12 - Uint8Array (needs unpacking)
            sampleBias = 2047.5
            sampleScale = 1.0 / 2047.5
            sampleWidth = 3 // bytes
            typedArray = Uint8Array
            this.sampleI = this.unpackI_CU12
            this.sampleQ = this.unpackQ_CU12
        }
        else if (format == 'CS12') {
            // CS12 - Uint8Array (needs unpacking)
            sampleBias = 0
            sampleScale = 1.0 / 2048.0
            sampleWidth = 3 // bytes
            typedArray = Uint8Array
            this.sampleI = this.unpackI_CS12
            this.sampleQ = this.unpackQ_CS12
        }
        else if (format == 'CU32') {
            // CU32 - Uint32Array
            sampleBias = 2147483647.5
            sampleScale = 1.0 / 2147483648.0
            sampleWidth = 8 // bytes
            typedArray = Uint32Array
        }
        else if (format == 'CS32') {
            // CS32 - Int32Array
            sampleBias = 0
            sampleScale = 1.0 / 2147483648.0
            sampleWidth = 8 // bytes
            typedArray = Int32Array
        }
        else if (format == 'CU64') {
            // CU64 - Uint64Array (needs translation)
            sampleBias = 1.0
            sampleScale = 1.0
            sampleWidth = 16 // bytes
            typedArray = Uint32Array
            this.sampleI = this.unpackI_CU64
            this.sampleQ = this.unpackQ_CU64
        }
        else if (format == 'CS64') {
            // CS64 - Int64Array (needs translation)
            sampleBias = 0
            sampleScale = 1.0
            sampleWidth = 16 // bytes
            typedArray = Uint32Array
            this.sampleI = this.unpackI_CS64
            this.sampleQ = this.unpackQ_CS64
        }
        else if (format == 'CF32' || format == 'CFILE' || format == 'COMPLEX') {
            // CF32 - Float32Array
            sampleBias = 0
            sampleScale = 1.0
            sampleWidth = 8 // bytes
            typedArray = Float32Array
        }
        else if (format == 'CF64') {
            // CF64 - Float64Array
            sampleBias = 0
            sampleScale = 1.0
            sampleWidth = 16 // bytes
            typedArray = Float64Array
        }
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats#Browser_compatibility
        else if (format == 'WAV' || format == 'BWF' || format == 'WEBM' || format == 'OGG' || format == 'OPUS'
                || format == 'FLAC' || format == 'MP4' || format == 'M4A' || format == 'AAC' || format == 'MP3') {
            buffer = null // need to wait for Promise resolve
            sampleWidth = 8 // bytes
            this.sampleI = this.unpackI_audio
            this.sampleQ = this.unpackQ_audio
            this.format = 'CF32' // force format on decompressed buffer
        }
        else {
            // default to CU8 - Uint8Array
            sampleBias = 127.5 // or 127? or 128?
            sampleScale = 1.0 / 127.5
            sampleWidth = 2 // bytes
            typedArray = Uint8Array
        }
        this.sampleBias = sampleBias
        this.sampleScale = sampleScale
        this.sampleWidth = sampleWidth
        this.typedArray = typedArray

        if (buffer) {
            this.buffer = buffer
            this.view = new typedArray(buffer)
            // generally:
            // this.sampleCount = this.view.length / 2 // I+Q
            // but for CS12 rather:
            this.sampleCount = buffer.byteLength / this.sampleWidth
        }
    }

    loadBuffer(buffer) {
        if (this.typedArray) {
            this.buffer = buffer
            this.view = new this.typedArray(buffer)
            // generally:
            // this.sampleCount = this.view.length / 2 // I+Q
            // but for CS12 rather:
            this.sampleCount = buffer.byteLength / this.sampleWidth
            return Promise.resolve()
        } else {
            return this.readAudio(buffer)
        }
    }

    /// This will give a noisy envelope of OOK/ASK signals.
    /// Subtracts the bias (-128) and calculates the norm (scaled by 16384).
    amplitude_cu8() {
        const am_buf = new Uint16Array(this.sampleCount)
        for (let i = 0; i < this.sampleCount; i++) {
            let x = 127 - this.view[2 * i]
            let y = 127 - this.view[2 * i + 1]
            am_buf[i]  = x * x + y * y // max 32768, fs 16384
        }
        return am_buf
    }

    /// 122/128, 51/128 Magnitude Estimator for CU8 (SIMD has min/max).
    /// Note that magnitude emphasizes quiet signals / deemphasizes loud signals.
    magnitude_est_cu8() {
        const am_buf = new Uint16Array(this.sampleCount)
        for (let i = 0; i < this.sampleCount; i++) {
            let x = Math.abs(this.view[2 * i] - 128)
            let y = Math.abs(this.view[2 * i + 1] - 128)
            let mi = x < y ? x : y
            let mx = x > y ? x : y
            let mag_est = 122 * mx + 51 * mi
            am_buf[i] = mag_est // max 22144, fs 16384
        }
        return am_buf
    }

    /// True Magnitude for CU8 (sqrt can SIMD but float is slow).
    magnitude_true_cu8() {
        const am_buf = new Uint16Array(this.sampleCount)
        for (let i = 0; i < this.sampleCount; i++) {
            let x = this.view[2 * i] - 128
            let y = this.view[2 * i + 1] - 128
            am_buf[i]  = Math.sqrt(x * x + y * y) * 128.0 // max 181, scaled 23170, fs 16384
        }
        return am_buf
    }

    /// 122/128, 51/128 Magnitude Estimator for CS16 (SIMD has min/max).
    magnitude_est_cs16() {
        const am_buf = new Uint16Array(this.sampleCount)
        for (let i = 0; i < this.sampleCount; i++) {
            let x = Math.abs(this.view[2 * i])
            let y = Math.abs(this.view[2 * i + 1])
            let mi = x < y ? x : y
            let mx = x > y ? x : y
            let mag_est = 122 * mx + 51 * mi
            am_buf[i] = mag_est >> 8 // max 5668864, scaled 22144, fs 16384
        }
        return am_buf
    }

    /// True Magnitude for CS16 (sqrt can SIMD but float is slow).
    magnitude_true_cs16() {
        const am_buf = new Uint16Array(this.sampleCount)
        for (let i = 0; i < this.sampleCount; i++) {
            let x = this.view[2 * i]
            let y = this.view[2 * i + 1]
            am_buf[i]  = Math.sqrt(x * x + y * y) >> 1 // max 46341, scaled 23170, fs 16384
        }
        return am_buf
    }

    /** The duration property returns a double representing the duration, in seconds, of the data stored in the buffer. */
    get duration() {
        return this.sampleCount / this.sampleRate
    }

    slice(sliceIndex, sliceCount, startSample, endSample) {
        startSample = startSample || 0
        endSample = endSample || ~~(this.sampleCount)
        const sliceLength = this.sampleWidth * ~~((endSample - startSample) / sliceCount)
        return this.buffer.slice(startSample * this.sampleWidth + sliceLength * sliceIndex, startSample * this.sampleWidth + sliceLength * (sliceIndex + 1))
    }

    readAudio(audioData) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        return audioCtx.decodeAudioData(audioData)
            .then(buffer => {
                this.audioBuffer = buffer
                this.sampleCount = buffer.length
                this.sampleRate = buffer.sampleRate
                this.view = this.interleaved()
                this.buffer = this.view.buffer
                //console.log('decodeAudioData', buffer, this.view, this.buffer)
            })
            .catch(error => {
                if (!this.audioBuffer)
                    throw `decodeAudioData error: ${error}`
            })
    }
    interleaved() {
        if (!this.audioBuffer)
            throw 'AudioBuffer not initialized'
        if (this.audioBuffer.numberOfChannels != 2)
            throw `AudioBuffer wrong numberOfChannels (${this.audioBuffer.numberOfChannels})`
        const n = this.sampleCount
        const data = new Float32Array(n * 2)
        const ch0 = this.audioBuffer.getChannelData(0)
        const ch1 = this.audioBuffer.getChannelData(1)
        for (let i = 0; i < n; i += 1) {
            data[2 * i + 0] = ch0[i]
            data[2 * i + 1] = ch1[i]
        }
        return data
    }
    unpackI_audio(pos) {
        const channel = this.audioBuffer.getChannelData(0)
        return channel[pos]
    }
    unpackQ_audio(pos) {
        const channel = this.audioBuffer.getChannelData(1)
        return channel[pos]
    }

    // read 8 bit (iq), note the intermediate is Q0.3, LSB aligned
    unpackI_CU4(pos) {
        const b0 = this.view[1 * pos + 0]
        const s = (b0 & 0xf0) >> 4
        return (s - this.sampleBias) * this.sampleScale
    }
    unpackQ_CU4(pos) {
        const b0 = this.view[1 * pos + 0]
        const s = (b0 & 0x0f) >> 0
        return (s - this.sampleBias) * this.sampleScale
    }

    // read 8 bit (iq), note the intermediate is Q0.31, MSB aligned Int32 for sign-extend
    unpackI_CS4(pos) {
        const b0 = this.view[1 * pos + 0]
        const s = ((b0 & 0xf0) << 24) >> 28
        return s * this.sampleScale
    }
    unpackQ_CS4(pos) {
        const b0 = this.view[1 * pos + 0]
        const s = ((b0 & 0x0f) << 28) >> 28
        return s * this.sampleScale
    }

    // read 24 bit (iiqIQQ), note the intermediate is Q0.12, LSB aligned
    unpackI_CU12(pos) {
        const b0 = this.view[3 * pos + 0]
        const b1 = this.view[3 * pos + 1]
        const s = ((b1 & 0x0f) << 8) | (b0)
        return (s - this.sampleBias) * this.sampleScale
    }
    unpackQ_CU12(pos) {
        const b1 = this.view[3 * pos + 1]
        const b2 = this.view[3 * pos + 2]
        const s = (b2 << 4) | ((b1 & 0xf0) >> 4)
        return (s - this.sampleBias) * this.sampleScale
    }

    // read 24 bit (iiqIQQ), note the intermediate is Q0.31, MSB aligned Int32 for sign-extend
    unpackI_CS12(pos) {
        const b0 = this.view[3 * pos + 0]
        const b1 = this.view[3 * pos + 1]
        const s = (((b1 & 0x0f) << 28) | (b0 << 20)) >> 20
        return s * this.sampleScale
    }
    unpackQ_CS12(pos) {
        const b1 = this.view[3 * pos + 1]
        const b2 = this.view[3 * pos + 2]
        const s = ((b2 << 24) | ((b1 & 0xf0) << 16)) >> 20
        return s * this.sampleScale
    }

    // read 64 bit signed data as 53 bits float, this might loose lots of precision
    unpackI_CU64(pos) {
        const b0 = this.view[4 * pos + 0]
        const b1 = this.view[4 * pos + 1]
        const s = (b1) / 2 ** 31 + (b0 / 2 ** 64)
        return (s - this.sampleBias)
    }
    unpackQ_CU64(pos) {
        const b0 = this.view[4 * pos + 2]
        const b1 = this.view[4 * pos + 3]
        const s = (b1) / 2 ** 31 + (b0 / 2 ** 64)
        return (s - this.sampleBias)
    }

    // read 64 bit signed data as 53 bits float, this might loose lots of precision
    unpackI_CS64(pos) {
        const b0 = this.view[4 * pos + 0]
        const b1 = this.view[4 * pos + 1]
        const s = (b1 >> 0) / 2 ** 31 + (b0 / 2 ** 64)
        return s
    }
    unpackQ_CS64(pos) {
        const b0 = this.view[4 * pos + 2]
        const b1 = this.view[4 * pos + 3]
        const s = (b1 >> 0) / 2 ** 31 + (b0 / 2 ** 64)
        return s
    }

    /** The sample of the I-channel at index `pos`, of the data stored in the buffer. */
    sampleI(pos) {
        return (this.view[2 * pos + 0] - this.sampleBias) * this.sampleScale
    }

    /** The sample of the Q-channel at index `pos`, of the data stored in the buffer. */
    sampleQ(pos) {
        return (this.view[2 * pos + 1] - this.sampleBias) * this.sampleScale
    }
}

export default SampleView
