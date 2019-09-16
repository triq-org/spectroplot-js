/**
    @file Some naive color maps.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

function _naive_cmap(stops = 256) {
    const cmap = []
    for (let i = 0; i < stops; ++i) {
        let r, g, b
        if (i < stops / 4) {
            b = i * 128 / (stops / 4)
            g = 0
            r = 0
        } else if (i < stops / 2) {
            b = 256 - i / 2
            g = 0
            r = i - stops / 4
        } else if (i < stops * 3 / 4) {
            b = 0
            g = i - stops / 2
            r = 255
        } else {
            b = i - stops * 3 / 4
            g = 255
            r = 255
        }
        cmap.push([~~r, ~~g, ~~b])
    }
    return cmap
}
/** Naive rainbow color map. */
export const naive_cmap = _naive_cmap()

function _grayscale_cmap(stops = 256) {
    const cmap = []
    for (let i = 0; i < stops; ++i) {
        let c = i * 255 / stops
        cmap.push([~~c, ~~c, ~~c])
    }
    return cmap
}
/** Black to white color map. */
export const grayscale_cmap = _grayscale_cmap()

function _roentgen_cmap(stops = 256) {
    const cmap = []
    for (let i = 0; i < stops; ++i) {
        let c = 255 - (i * 255 / stops)
        cmap.push([~~c, ~~c, ~~c])
    }
    return cmap
}
/** White to black color map. */
export const roentgen_cmap = _roentgen_cmap()

function _phosphor_cmap(stops = 256) {
    const cmap = []
    for (let i = 0; i < stops; ++i) {
        let r, g, b
        if (i < stops / 2) {
            r = 0
            g = i * 191 / (stops / 2)
            b = 0
        } else {
            r = (i - stops / 2) * 255 / (stops / 2)
            g = 191 + (i - stops / 2) * 64 / (stops / 2)
            b = (i - stops / 2) * 255 / (stops / 2)
        }
        cmap.push([~~r, ~~g, ~~b])
    }
    return cmap
}
/** Black to green color map. */
export const phosphor_cmap = _phosphor_cmap()
