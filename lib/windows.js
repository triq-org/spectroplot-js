/**
    @file Windowing functions.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/** Rectangular window generator function. */
export function rectangularWindow(n) {
    const window = new Array(n)
    let weight = 0.0
    for (let i = 0; i < n; ++i) {
        weight += window[i] = 1.0
    }
    return { window: window, weight: weight }
}

/** Bartlett window generator function. */
export function bartlettWindow(n) {
    const window = new Array(n)
    let weight = 0.0
    for (let i = 0; i < n; ++i) {
        weight += window[i] = 1.0 - Math.abs((i - 0.5 * (n - 1)) / (0.5 * (n - 1)))
    }
    return { window: window, weight: weight }
}

/** Hamming window generator function. */
export function hammingWindow(n) {
    const a = 0.54
    const b = 0.46

    const window = new Array(n)
    let weight = 0.0
    for (let i = 0; i < n; ++i) {
        weight += window[i] = a - b * Math.cos(2.0 * Math.PI * i / (n - 1))
    }
    return { window: window, weight: weight }
}

/** Hann window generator function. */
export function hannWindow(n) {
    const window = new Array(n)
    let weight = 0.0
    for (let i = 0; i < n; ++i) {
        weight += window[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * i / (n - 1)))
    }
    return { window: window, weight: weight }
}

/** Blackman window generator function. */
export function blackmanWindow(n) {
    const a0 = 0.42
    const a1 = 0.5
    const a2 = 0.08

    const window = new Array(n)
    let weight = 0.0
    for (let i = 0; i < n; ++i) {
        weight += window[i] = a0
            - (a1 * Math.cos((2.0 * Math.PI * i) / (n - 1)))
            + (a2 * Math.cos((4.0 * Math.PI * i) / (n - 1)))
    }
    return { window: window, weight: weight }
}

/** Blackman-Harris window generator function. */
export function blackmanHarrisWindow(n) {
    const a0 = 0.35875
    const a1 = 0.48829
    const a2 = 0.14128
    const a3 = 0.01168

    const window = new Array(n)
    let weight = 0.0
    for (let i = 0; i < n; ++i) {
        weight += window[i] = a0
            - (a1 * Math.cos((2.0 * Math.PI * i) / (n - 1)))
            + (a2 * Math.cos((4.0 * Math.PI * i) / (n - 1)))
            - (a3 * Math.cos((6.0 * Math.PI * i) / (n - 1)))
    }
    return { window: window, weight: weight }
}
