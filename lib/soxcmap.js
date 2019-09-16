/**
    @file Compute a cmap like SoX does.

    @copyright robs@users.sourceforge.net, 2008-9
    @license
    This library is free software; you can redistribute it and/or modify it
    under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation; either version 2.1 of the License, or (at
    your option) any later version.
*/

function _sox_cmap(stops = 256) {
    const cmap = []
    for (let i = 0; i < stops; ++i) {
        let x = i / (stops - 1.0)
        let c = [0.0, 0.0, 0.0]

        if (x < .13)
            c[0] = 0
        else if (x < .73)
            c[0] = 1 * Math.sin((x - .13) / .60 * Math.PI / 2)
        else
            c[0] = 1

        if (x < .60)
            c[1] = 0
        else if (x < .91)
            c[1] = 1 * Math.sin((x - .60) / .31 * Math.PI / 2)
        else
            c[1] = 1

        if (x < .60)
            c[2] = .5 * Math.sin((x - .00) / .60 * Math.PI)
        else if (x < .78)
            c[2] = 0
        else
            c[2] = (x - .78) / .22

        let r = Math.round(255 * c[0]) // or 1
        let g = Math.round(255 * c[1]) // or 0
        let b = Math.round(255 * c[2])

        cmap.push([r, g, b])
    }
    return cmap
}

/** Compute a cmap like SoX does. */
export const sox_cmap = _sox_cmap()
