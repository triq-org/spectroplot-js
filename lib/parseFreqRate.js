/**
    @file Functions to parse file name info.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/*eslint no-console: "off"*/

/** Parse frequency and sample rate from a file name. */
export function parseFreqRate(name = '') {
    if (!name || typeof name !== 'string') {
        return {freq: 0, rate: 0}
    }

    // remove path
    const pos = name.lastIndexOf('/')
    if (pos !== -1) {
        name = name.substr(pos + 1)
        console.log(`skipping to ${pos + 1}, ${name}`)
    }

    let freq = 0, rate = 1

    // skip until separator [-_ .]
    for (let p = 0; p < name.length - 1; ++p) {
        if (name[p] == '_' || name[p] == '-' || name[p] == ' ' || name[p] == '.') {
            ++p
            // try to parse a double (float has too few digits)
            const f = parseFloat(name.substr(p))
            if (isNaN(f)) continue

            // skip digits
            while (p < name.length && (name[p] >= '0' && name[p] <= '9' || name[p] == '.'))
                ++p

            // suffixed with 'M' and separator?
            if (name[p] == 'M' || name[p] == 'm') {
                freq = f * 1000000.0
            }

            // suffixed with 'k' and separator?
            if (name[p] == 'k' || name[p] == 'K') {
                rate = f * 1000.0
            }
        }
    }

    return { freq: freq, rate: rate }
}

/** Parse format indication from a file name. */
export function parseFormat(name = '') {
    if (!name || typeof name !== 'string') {
        return '?'
    }

    // remove path
    const pos = name.lastIndexOf('.')
    if (pos !== -1) {
        return name.substr(pos + 1).toUpperCase()
    }

    return '?'
}
