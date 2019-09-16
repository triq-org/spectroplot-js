/**
    @file Determine step width (e.g. on an axis).

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

const autosteps = [0.1, 0.2, 0.5, 1.0];

/** Determine step width (e.g. on an axis). */
export function autostep(range, max_ticks) {
    const magnitude = ~~Math.log10(range)
    const scale = Math.pow(10, magnitude)
    const norm_range = range / scale
    for (let i = 0; i < autosteps.length; ++i) {
        const step = autosteps[i]
        if ((max_ticks + 1) * step > norm_range) {
            return step * scale
        }
    }
    return scale // fallback
}
