/**
    @file Spectroplot easy template cloning.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

import { Spectroplot, loadUrl } from './spectroplot.js'
import { DropZone } from './dropzone.js'
import { selector } from './utils.js';

export { EasyCloning }

/**
    An example easy template cloning class.
*/
class EasyCloning {
    /**
        Initialize a new EasyCloning.
        @example
        new EasyCloning('#spectros', document.location.hash.substring(1))

        @param {Object|string} elementOrSelector - Parent element or selector
        @param {string} [dataUrl] - URL to load data from
    */
    constructor(elementOrSelector, dataUrl) {
        this.cloneParent = selector(elementOrSelector);
        // grab the template and remove from DOM
        this.cloneTemplate = this.cloneParent.firstElementChild;
        // this.cloneTemplate.remove(); // would need polyfill on IE
        this.cloneParent.removeChild(this.cloneTemplate);

        this.dropZone = new DropZone('#dropZone', this.cloneLoader.bind(this))
        this.dropZone.addInput('#inputfile')
        this.dropZone.addInput('#addfile')

        if (dataUrl) {
            this.loadUrl(dataUrl)
        }
    }

    /**
        Load data into a new clone.

        @param {Object} [filedata] - data object to load
    */
    cloneLoader(filedata) {
        const parent = this.cloneTemplate.cloneNode(true);
        this.cloneParent.appendChild(parent);
        const spectroplot = new Spectroplot({
            parent,
            filedata,
        })
        spectroplot.enableGuides()
        spectroplot.enableButtons()
        // spectroplot.createDropZone($refs.dropzone)
    }

    /**
        Load data from a URL.

        @param {string} [dataUrl] - URL to load data from
    */
    loadUrl(dataUrl) {
        loadUrl(dataUrl, this.cloneLoader);
    }
}
