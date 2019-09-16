# Spectroplot: I/Q Spectrogram Plot JS library.

A library to visualize the I/Q or audio spectrogram of sample data in a HTML canvas.
For an example open https://triq.org/iqs and drop your sample data in.

You can choose the FFT bin number and zoom (x1, x2, x4, x8) with horizontal scrolling.
There is a frequency scale and a time scale, and dB(fs) range,
a histogram of the plotted dB range and the full dB range. You can choose the gain and dB range.
Also an experimental (spark line type) bar with min/max dB per sample.
A cross hair with info on the frequency and time position is available on hover or touch.
There are some windowing functions (Rectangular, Bartlett, Hamming, Hann, Blackman, Blackman-Harris),
and some Colormap (Cube1, Sox, Naive, Viridis, Plasma, Inferno, Magma, Hot, Afmhot, Gist_heat, Parabola) to choose from.

Supported raw SDR data file types are:
- .cu4
- .cs4
- .cu8 (.data .complex16u)
- .cs8 (.complex16s)
- .cu12
- .cs12
- .cu16
- .cs16
- .cu32
- .cs32
- .cu64
- .cs64
- .cf32 (.cfile .complex)
- .cf64

Also supported are (stereo) audio files containing I/Q data (if supported by the browser):
- .wav
- .bwf
- .webm
- .ogg
- .opus
- .flac
- .mp4
- .m4a
- .aac
- .mp3

All comments and suggestions very welcome.

If you like to give feedback:
- Is this useful to you? Why not, what is missing?
- Is this bundled in a useful way? Do you want the lib hosted on a CDN?

## Getting Started

To use this lib you either need the worker as `spectroplot.worker.js` in the lib location or
you need to pass the worker location or the `Worker` to the Spectroplot constructor.

With Webpack 4, you'll need to install `worker-loader`:
```console
npm install worker-loader --save-dev
```

or
```console
yarn add worker-loader --dev
```

then bundle the worker to some file:

```js
import SpectroplotWorker from 'worker-loader?filename=js/spectroplot.[hash].worker.js!spectroplot/lib/worker.js'
import { Spectroplot } from 'spectroplot'
```

With Webpack 5 use something like:
```js
const SpectroplotWorker = Worker(new URL('spectroplot/lib/worker.js', import.meta.url))
import { Spectroplot } from 'spectroplot'
```

You likely want to include some minimal styles, see [`styles.css`](lib/styles.css):
```js
import 'spectroplot/lib/styles.css'
```

then later pass the Worker to the constructor:
```js
let spectroplot = new Spectroplot({
    workerOrUrl: SpectroplotWorker,
    // ...
})
```

You can also eagerly load the worker by using `startWorkers()`:
```js
import SpectroplotWorker from 'worker-loader?filename=js/spectroplot.[hash].worker.js!spectroplot/lib/worker.js'
import { Spectroplot, startWorkers } from 'spectroplot'
// start workers eagerly:
startWorker(SpectroplotWorker) // no need to pass a worker option to `new Spectroplot()` now
```

## Using the API

There is a simple API which manages a drop zone and creates spectrograms from a template,
see [`example.html`](lib/example.html) for this `initCloning(elementOrSelector)` API.

For more control you can construct each `Spectroplot(options)` as needed with these options:
See [`iqspectrovue`](https://github.com/triq-org/iqspectrovue) for a full featured example using VueJS.

### Options on Spectroplot

|        Name        |        Type         |      Default       | Description                       |
| :----------------: | :-----------------: | :----------------: | :-------------------------------- |
| **`n`**            | `{Number}`          | `512`              | powers of 2 only                  |
| **`width`**        | `{Number}`          | `3000`             | in px                             |
| **`height`**       | `{Number}`          | `512`              | in px, 0 = auto                   |
| **`zoom`**         | `{Number}`          | `1`                | Zoom factor                       |
| **`windowf`**      | `{String\|Object}`  | `'blackmanHarris'` | Window name or custom function    |
| **`gain`**         | `{Number}`          | `6`                | Gain in dB                        |
| **`range`**        | `{Number}`          | `30`               | Range in dB                       |
| **`cmap`**         | `{String\|Object}`  | `'cube1'`          | Color map name or custom map      |
| **`ampHeight`**    | `{Number}`          | `0`                | Amp bar height in px, 0 = off     |
| **`minmaxHeight`** | `{Number}`          | `20`               | MinMax bar height in px, 0 = off  |
| **`channelMode`**  | `{String\|Boolean}` | `false`            | `'I/Q'` (false) or `'L/R'` (true) |
| **`dbfsWidth`**    | `{Number}`          | `60`               |                                   |
| **`dbfsHeight`**   | `{Number}`          | `0`                | 0 = auto: height + timeHeight     |
| **`freqWidth`**    | `{Number}`          | `40`               |                                   |
| **`timeHeight`**   | `{Number}`          | `20`               |                                   |
| **`rampHeight`**   | `{Number}`          | `0`                | 0 = auto                          |
| **`rampTop`**      | `{Number}`          | `10`               |                                   |
| **`rampWidth`**    | `{Number}`          | `15`               |                                   |
| **`histWidth`**    | `{Number}`          | `100`              |                                   |
| **`histLeft`**     | `{Number}`          | `55`               |                                   |
| **`parent`**       | `{String\|Object}`  |                    | Container element or selector     |
| **`renderInfo`**   | `{String\|Object}`  |                    | Info element or selector          |
| **`theme`**        | `{String\|Object}`  |                    | Theme name or options             |

### Predefined Window functions:

- `'rectangular'` : Rectangular window function
- `'bartlett'` : Bartlett window function
- `'hamming'` : Hamming window function
- `'hann'` : Hann window function
- `'blackman'` : Blackman window function
- `'blackmanHarris'` : Blackman-Harris window function

### Predefined Color maps:

- `'cube1'` : Cube1 color map
- `'viridis'` : Viridis color map
- `'plasma'` : Plasma color map
- `'inferno'` : Inferno color map
- `'magma'` : Magma color map
- `'hot'` : Hot color map
- `'afmhot'` : Afmhot color map
- `'gist_heat'` : Gist heat color map
- `'naive'` : Naive color map
- `'parabola'` : Parabola color map
- `'sox'` : Sox color map
- `'grayscale'` : Gray color map
- `'roentgen'` : Röntgen color map
- `'phosphor'` : Phosphor color map

### API functions on Spectroplot instance

- `enableGuides()`
- `disableGuides()`
- `enableButtons()`
- `setTheme(nameOrOptions)`
- `destroy()`
- `setOption(opt, value)`
- `setOptions(opts)`
- `setData(filedata)`

## Copyright and Licence

Copyright (C) 2017-2021 Christian W. Zuckschwerdt <zany@triq.net>

Unless otherwise noted all sources are:

License: GPL-2+
