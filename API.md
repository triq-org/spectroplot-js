## Classes

<dl>
<dt><a href="#Spectroplot">Spectroplot</a></dt>
<dd><p>The main Spectroplot class.</p>
</dd>
<dt><a href="#EasyCloning">EasyCloning</a></dt>
<dd><p>An example easy template cloning class.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#loadUrl">loadUrl(url, [fileLoader])</a> ⇒ <code>Object</code></dt>
<dd><p>Load data from a URL.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#CustomWindowF">CustomWindowF</a> ⇒ <code>Object</code></dt>
<dd><p>Custom Window function.</p>
</dd>
<dt><a href="#RGB">RGB</a> : <code>Array.&lt;number&gt;</code></dt>
<dd><p>RGB triplet.</p>
</dd>
<dt><a href="#FileLoader">FileLoader</a> : <code>function</code></dt>
<dd><p>This callback is used to load file data.</p>
</dd>
</dl>

<a name="Spectroplot"></a>

## Spectroplot
The main Spectroplot class.

**Kind**: global class  

* [Spectroplot](#Spectroplot)
    * [new Spectroplot(options)](#new_Spectroplot_new)
    * [.enableGuides()](#Spectroplot+enableGuides)
    * [.disableGuides()](#Spectroplot+disableGuides)
    * [.enableButtons()](#Spectroplot+enableButtons)
    * [.setTheme(options)](#Spectroplot+setTheme)
    * [.destroy()](#Spectroplot+destroy)
    * [.setOption(opt, value)](#Spectroplot+setOption) ⇒ <code>Promise</code>
    * [.setOptions(opts)](#Spectroplot+setOptions) ⇒ <code>Promise</code>
    * [.setData(filedata)](#Spectroplot+setData) ⇒ <code>Promise</code>
    * [.drawHistograms()](#Spectroplot+drawHistograms)

<a name="new_Spectroplot_new"></a>

### new Spectroplot(options)
Initialize a new Spectroplot.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  |  |
| [options.fftN] | <code>number</code> | <code>512</code> | FFT width, powers of 2 only |
| [options.width] | <code>number</code> | <code>3000</code> | cavnas width in px |
| [options.height] | <code>number</code> | <code>512</code> | canvas height in px, 0 = auto |
| [options.zoom] | <code>number</code> | <code>1</code> | Zoom factor |
| [options.windowF] | [<code>WindowF</code>](#WindowF) \| [<code>CustomWindowF</code>](#CustomWindowF) | <code>blackmanHarris</code> | Window name or custom function |
| [options.gain] | <code>number</code> | <code>6</code> | Gain in dB |
| [options.range] | <code>number</code> | <code>30</code> | Range in dB |
| [options.cmap] | [<code>Cmap</code>](#Cmap) \| [<code>Array.&lt;RGB&gt;</code>](#RGB) | <code>cube1</code> | Color map name or custom map |
| [options.ampHeight] | <code>number</code> | <code>0</code> | Amp bar height in px, 0 = off |
| [options.minmaxHeight] | <code>number</code> | <code>20</code> | MinMax bar height in px, 0 = off |
| [options.channelMode] | <code>string</code> \| <code>Boolean</code> | <code>false</code> | Mode `'I/Q'` (false) or `'L/R'` (true) |
| [options.dbfsWidth] | <code>number</code> | <code>60</code> | dbfs width in px |
| [options.dbfsHeight] | <code>number</code> | <code>0</code> | 0 = auto: height + timeHeight |
| [options.freqWidth] | <code>number</code> | <code>40</code> | Freq width in px |
| [options.timeHeight] | <code>number</code> | <code>20</code> | Time height in px |
| [options.rampHeight] | <code>number</code> | <code>0</code> | Color ramp height in px, 0 = auto |
| [options.rampTop] | <code>number</code> | <code>10</code> | Color ramp top offset in px |
| [options.rampWidth] | <code>number</code> | <code>15</code> | Color ramp width in px |
| [options.histWidth] | <code>number</code> | <code>100</code> | Histogram width in px |
| [options.histLeft] | <code>number</code> | <code>55</code> | Histogramm left offset in px |
| options.parent | <code>string</code> \| <code>Object</code> |  | Container element or selector |
| [options.renderInfo] | <code>string</code> \| <code>Object</code> |  | Info element or selector |
| [options.theme] | <code>string</code> \| <code>Object</code> |  | Theme name or options, see [setTheme](setTheme) |

<a name="Spectroplot+enableGuides"></a>

### spectroplot.enableGuides()
Enables mouse-over guide drawing.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
<a name="Spectroplot+disableGuides"></a>

### spectroplot.disableGuides()
Disables mouse-over guide drawing.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
<a name="Spectroplot+enableButtons"></a>

### spectroplot.enableButtons()
Hooks up common button elements to the setter functions.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
<a name="Spectroplot+setTheme"></a>

### spectroplot.setTheme(options)
Set a color theme.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>string</code> \| <code>Object</code> |  | Theme name or theme options |
| [options.histoStroke] | <code>string</code> | <code>&quot;#b0b&quot;</code> | Histogram line color |
| [options.histoFill] | <code>string</code> | <code>&quot;rgba(187,0,187,0.2)&quot;</code> | Histogram fill color |
| [options.histoLine] | <code>number</code> | <code>2</code> | Histogram line width |
| [options.dbfsStroke] | <code>string</code> | <code>&quot;#999&quot;</code> | FS-Histogram line color |
| [options.dbfsFill] | <code>string</code> | <code>&quot;rgba(153,153,153,0.2)&quot;</code> | FS-Histogram fill color |
| [options.dbfsLine] | <code>number</code> | <code>2</code> | FS-Histogram line width |
| [options.rampFill] | <code>string</code> | <code>&quot;#666&quot;</code> | Color ramp text color |
| [options.freqLabelFill] | <code>string</code> | <code>&quot;#333&quot;</code> | Freq label text color |
| [options.freqMinorFill] | <code>string</code> | <code>&quot;#CCC&quot;</code> | Freq minor tick color |
| [options.freqMajorFill] | <code>string</code> | <code>&quot;#666&quot;</code> | Freq major tick color |
| [options.timeLabelFill] | <code>string</code> | <code>&quot;#333&quot;</code> | Time label text color |
| [options.timeMinorFill] | <code>string</code> | <code>&quot;#CCC&quot;</code> | Time minor tick color |
| [options.timeMajorFill] | <code>string</code> | <code>&quot;#666&quot;</code> | Time major tick color |
| [options.guidesBgFill] | <code>string</code> | <code>&quot;rgba(0,0,0,0.3)&quot;</code> | Guides background color |
| [options.guidesDragFill] | <code>string</code> | <code>&quot;rgba(0,0,0,0.3)&quot;</code> | Guides drag color |
| [options.guidesHairStroke] | <code>string</code> | <code>&quot;#fff&quot;</code> | Guides hair color |
| [options.guidesInfoBgFill] | <code>string</code> | <code>&quot;rgba(255,255,255,0.8)&quot;</code> | Guides info background color |
| [options.guidesInfoTextFill] | <code>string</code> | <code>&quot;#666&quot;</code> | Guides info text color |

<a name="Spectroplot+destroy"></a>

### spectroplot.destroy()
Release all event handlers and resources.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
<a name="Spectroplot+setOption"></a>

### spectroplot.setOption(opt, value) ⇒ <code>Promise</code>
Set an option on the Spectroplot to some value.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
**Returns**: <code>Promise</code> - A promise that resolves when the redrawing is complete  

| Param | Type | Description |
| --- | --- | --- |
| opt | <code>string</code> | Option name, see [new](#new_Spectroplot_new) |
| value | <code>Object</code> | The new value for the option |

<a name="Spectroplot+setOptions"></a>

### spectroplot.setOptions(opts) ⇒ <code>Promise</code>
Set a number of options on the Spectroplot to some values.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
**Returns**: <code>Promise</code> - A promise that resolves when the redrawing is complete  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | A key/value object of options to set, see [new](#new_Spectroplot_new) |

<a name="Spectroplot+setData"></a>

### spectroplot.setData(filedata) ⇒ <code>Promise</code>
Set new data on the Spectroplot.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
**Returns**: <code>Promise</code> - A promise that resolves when the redrawing is complete  

| Param | Type | Description |
| --- | --- | --- |
| filedata | <code>string</code> \| <code>Object</code> | A URL string or File data object of `{ fileBuffer: ArrayBuffer, name: string, size: number, type: string }` |

<a name="Spectroplot+drawHistograms"></a>

### spectroplot.drawHistograms()
Prints color histogram.

**Kind**: instance method of [<code>Spectroplot</code>](#Spectroplot)  
<a name="EasyCloning"></a>

## EasyCloning
An example easy template cloning class.

**Kind**: global class  

* [EasyCloning](#EasyCloning)
    * [new EasyCloning(elementOrSelector, [dataUrl])](#new_EasyCloning_new)
    * [.cloneLoader([filedata])](#EasyCloning+cloneLoader)
    * [.loadUrl([dataUrl])](#EasyCloning+loadUrl)

<a name="new_EasyCloning_new"></a>

### new EasyCloning(elementOrSelector, [dataUrl])
Initialize a new EasyCloning.


| Param | Type | Description |
| --- | --- | --- |
| elementOrSelector | <code>Object</code> \| <code>string</code> | Parent element or selector |
| [dataUrl] | <code>string</code> | URL to load data from |

**Example**  
```js
new EasyCloning('#spectros', document.location.hash.substring(1))

        
```
<a name="EasyCloning+cloneLoader"></a>

### easyCloning.cloneLoader([filedata])
Load data into a new clone.

**Kind**: instance method of [<code>EasyCloning</code>](#EasyCloning)  

| Param | Type | Description |
| --- | --- | --- |
| [filedata] | <code>Object</code> | data object to load |

<a name="EasyCloning+loadUrl"></a>

### easyCloning.loadUrl([dataUrl])
Load data from a URL.

**Kind**: instance method of [<code>EasyCloning</code>](#EasyCloning)  

| Param | Type | Description |
| --- | --- | --- |
| [dataUrl] | <code>string</code> | URL to load data from |

<a name="WindowF"></a>

## WindowF : <code>enum</code>
Predefined Window functions.

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| rectangular | <code>string</code> | <code>&quot;rectangular&quot;</code> | Rectangular window function |
| bartlett | <code>string</code> | <code>&quot;bartlett&quot;</code> | Bartlett window function |
| hamming | <code>string</code> | <code>&quot;hamming&quot;</code> | Hamming window function |
| hann | <code>string</code> | <code>&quot;hann&quot;</code> | Hann window function |
| blackman | <code>string</code> | <code>&quot;blackman&quot;</code> | Blackman window function |
| blackmanHarris | <code>string</code> | <code>&quot;blackmanHarris&quot;</code> | Blackman - Harris window function |

<a name="Cmap"></a>

## Cmap : <code>enum</code>
Predefined Color maps.

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| cube1 | <code>string</code> | <code>&quot;cube1&quot;</code> | Cube1 color map |
| viridis | <code>string</code> | <code>&quot;viridis&quot;</code> | Viridis color map |
| plasma | <code>string</code> | <code>&quot;plasma&quot;</code> | Plasma color map |
| inferno | <code>string</code> | <code>&quot;inferno&quot;</code> | Inferno color map |
| magma | <code>string</code> | <code>&quot;magma&quot;</code> | Magma color map |
| hot | <code>string</code> | <code>&quot;hot&quot;</code> | Hot color map |
| afmhot | <code>string</code> | <code>&quot;afmhot&quot;</code> | Afmhot color map |
| gist_heat | <code>string</code> | <code>&quot;gist_heat&quot;</code> | Gist heat color map |
| naive | <code>string</code> | <code>&quot;naive&quot;</code> | Naive color map |
| parabola | <code>string</code> | <code>&quot;parabola&quot;</code> | Parabola color map |
| sox | <code>string</code> | <code>&quot;sox&quot;</code> | Sox color map |
| grayscale | <code>string</code> | <code>&quot;grayscale&quot;</code> | Gray color map |
| roentgen | <code>string</code> | <code>&quot;roentgen&quot;</code> | Röntgen color map |
| phosphor | <code>string</code> | <code>&quot;phosphor&quot;</code> | Phosphor color map |

<a name="loadUrl"></a>

## loadUrl(url, [fileLoader]) ⇒ <code>Object</code>
Load data from a URL.

**Kind**: global function  
**Returns**: <code>Object</code> - File info object  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | URL to load data from |
| [fileLoader] | [<code>FileLoader</code>](#FileLoader) | Callback for File info object |

<a name="CustomWindowF"></a>

## CustomWindowF ⇒ <code>Object</code>
Custom Window function.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| n | <code>number</code> | FFT width |

<a name="RGB"></a>

## RGB : <code>Array.&lt;number&gt;</code>
RGB triplet.

**Kind**: global typedef  
<a name="FileLoader"></a>

## FileLoader : <code>function</code>
This callback is used to load file data.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| fileinfo | <code>Object</code> | File info object |

