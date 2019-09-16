/**
    @file Various polyfill snippets from MDN.

    @copyright CC0 Licenses for code examples and snippets
    @license
    Any copyright is dedicated to the Public Domain. http://creativecommons.org/publicdomain/zero/1.0/
*/

// polyfill: Object.assign
if (!Object.assign)
    Object.assign = function (target, ...sources) {
        return sources.reduce(function (r, o) {
            Object.keys(o).forEach(function (k) {
                r[k] = o[k];
            });
            return r;
        }, target);
    };

// polyfill: Math.clamp
if (!Math.clamp)
    Math.clamp = function (x, lower, upper) {
        return Math.max(lower, Math.min(x, upper));
    };

// polyfill: Math.log10
if (!Math.log10)
    Math.log10 = function (x) {
        return Math.log(x) * Math.LOG10E;
    };


// polyfill: Math.log2
if (!Math.log2)
    Math.log2 = function (x) {
        return Math.log(x) * Math.LOG2E;
    };

// polyfill IE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill#Polyfill
if (!Array.prototype.fill)
    Object.defineProperty(Array.prototype, 'fill', {
        value: function (value) {

            // Steps 1-2.
            if (this == null) {
                throw new TypeError('this is null or not defined');
            }

            var O = Object(this);

            // Steps 3-5.
            var len = O.length >>> 0;

            // Steps 6-7.
            var start = arguments[1];
            var relativeStart = start >> 0;

            // Step 8.
            var k = relativeStart < 0 ?
                Math.max(len + relativeStart, 0) :
                Math.min(relativeStart, len);

            // Steps 9-10.
            var end = arguments[2];
            var relativeEnd = end === undefined ?
                len : end >> 0;

            // Step 11.
            var final = relativeEnd < 0 ?
                Math.max(len + relativeEnd, 0) :
                Math.min(relativeEnd, len);

            // Step 12.
            while (k < final) {
                O[k] = value;
                k++;
            }

            // Step 13.
            return O;
        }
    });
