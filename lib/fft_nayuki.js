/**
 * @file Free FFT and convolution (JavaScript)
 *
 * @copyright 2017 Project Nayuki. (MIT License)
 * @see https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 * @author Wrapped as ES6 module by Christian W. Zuckschwerdt <zany@triq.net>
 * @license
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

/*
 * Construct an object for calculating the discrete Fourier transform (DFT) of size n, where n is a power of 2.
 */
class FFTNayuki {
    constructor(n) {
        this.n = n;
        this.levels = -1;

        // Length variables
        for (let i = 0; i < 32; i++) {
            if (1 << i == n)
                this.levels = i;  // Equal to log2(n)
        }
        if (this.levels == -1)
            throw 'Length is not a power of 2';

        // Trigonometric tables
        this.cosTable = new Array(n / 2);
        this.sinTable = new Array(n / 2);
        for (let i = 0; i < n / 2; i++) {
            this.cosTable[i] = Math.cos(2 * Math.PI * i / n);
            this.sinTable[i] = Math.sin(2 * Math.PI * i / n);
        }
    }

    /*
     * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
     * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
     */
    transform(real, imag) {
        const n = this.n;

        // Bit-reversed addressing permutation
        for (let i = 0; i < n; i++) {
            const j = reverseBits(i, this.levels);
            if (j > i) {
                let temp = real[i];
                real[i] = real[j];
                real[j] = temp;
                temp = imag[i];
                imag[i] = imag[j];
                imag[j] = temp;
            }
        }

        // Cooley-Tukey decimation-in-time radix-2 FFT
        for (let size = 2; size <= n; size *= 2) {
            const halfsize = size / 2;
            const tablestep = n / size;
            for (let i = 0; i < n; i += size) {
                for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                    const l = j + halfsize;
                    const tpre =  real[l] * this.cosTable[k] + imag[l] * this.sinTable[k];
                    const tpim = -real[l] * this.sinTable[k] + imag[l] * this.cosTable[k];
                    real[l] = real[j] - tpre;
                    imag[l] = imag[j] - tpim;
                    real[j] += tpre;
                    imag[j] += tpim;
                }
            }
        }

        // Returns the integer whose value is the reverse of the lowest 'bits' bits of the integer 'x'.
        function reverseBits(x, bits) {
            let y = 0;
            for (let i = 0; i < bits; i++) {
                y = (y << 1) | (x & 1);
                x >>>= 1;
            }
            return y;
        }
    }

    // Post-process complex DFT into two real channels.
    // X[k] =    0.5 Z[k] + Z*[N-k]
    // Y[k] = -j 0.5 Z[k] - Z*[N-k]
    // left channel is index 0 to n/2-1, right channel is index n-1 to n/2.
    // s.a. http://www.ti.com/lit/an/spra291/spra291.pdf
    splitreal(real, imag) {
        const n = this.n;
        //real[0] = real[0]
        imag[0] = 0
        real[n / 2] = imag[0]
        imag[n / 2] = 0
        for (let i = 1; i < n / 2; i += 1) {
            const lr = 0.5 * (real[i] + real[n - i])
            const li = 0.5 * (imag[i] - imag[n - i])
            const rr = 0.5 * (imag[i] + imag[n - i])
            const ri = 0.5 * (-real[i] + real[n - i])
            real[i] = lr
            imag[i] = li
            real[n - i] = rr
            imag[n - i] = ri
        }
    }
}

export default FFTNayuki
