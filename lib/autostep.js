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

/** Decimal scale to get the num in the range +-[1; 10), twice as fast as `Math.pow(10, Math.floor(Math.log10(Math.abs(num))))`. */
function decimal_scale(num) {
    num = Math.abs(num)
    if (num > 0) {
        let scale = 0
        while (num < 1) {
            num *= 10
            scale -= 1
        }
        while (num >= 10) {
            num /= 10
            scale += 1
        }
        return Math.pow(10, scale)
    } else {
        return 1
    }
}

const autosteps = [1, 2, 5, 10];

/** Determine step width (e.g. on an axis). */
export function autostep(range, max_ticks) {
    const scale = decimal_scale(range / max_ticks)
    const norm_range = range / scale
    for (let i = 0; i < autosteps.length; ++i) {
        const step = autosteps[i]
        if ((max_ticks + 1) * step > norm_range) {
            const major_step = step * scale
            const minor_step = major_step / (step == 5 ? 5 : 10)
            return { major_step, minor_step }
        }
    }
    return { major_step: scale, minor_step: scale / 10 } // fallback
}
