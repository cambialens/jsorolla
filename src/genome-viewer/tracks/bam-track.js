/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of JS Common Libs.
 *
 * JS Common Libs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * JS Common Libs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with JS Common Libs. If not, see <http://www.gnu.org/licenses/>.
 */

BamTrack.prototype = new Track({});

function BamTrack(args) {
    Track.call(this, args);
    // Using Underscore 'extend' function to extend and add Backbone Events
    _.extend(this, Backbone.Events);

    //set default args

    //save default render reference;
    this.defaultRenderer = this.renderer;
    this.histogramRenderer = new HistogramRenderer();

    this.dataType = 'features';

    //set instantiation args, must be last
    _.extend(this, args);

};


BamTrack.prototype.clean = function () {
    this._clean();

//    console.time("-----------------------------------------empty");
    while (this.svgCanvasFeatures.firstChild) {
        this.svgCanvasFeatures.removeChild(this.svgCanvasFeatures.firstChild);
    }
//    console.timeEnd("-----------------------------------------empty");
};

BamTrack.prototype.updateHeight = function () {
//    this._updateHeight();


    var renderedHeight = this.svgCanvasFeatures.getBoundingClientRect().height;
    this.main.setAttribute('height', renderedHeight);

    //if (this.resizable) {
    //    if (this.autoHeight == false) {
    //        $(this.contentDiv).css({'height': this.height});
    //    } else if (this.autoHeight == true) {
    //        var x = this.pixelPosition;
    //        var width = this.width;
    //        var lastContains = 0;
    //        for (var i in this.renderedArea) {
    //            if (this.renderedArea[i].contains({start: x, end: x + width })) {
    //                lastContains = i;
    //            }
    //        }
    //        var visibleHeight = parseInt(lastContains) + 30;
    //        $(this.contentDiv).css({'height': visibleHeight + 5});
    //        this.main.setAttribute('height', visibleHeight);
    //    }
    //}
};

BamTrack.prototype.initializeDom = function (targetId) {
    this._initializeDom(targetId);

    this.main = SVG.addChild(this.contentDiv, 'svg', {
        'class': 'trackSvg',
        'x': 0,
        'y': 0,
        'width': this.width
    });
    this.svgCanvasFeatures = SVG.addChild(this.main, 'svg', {
        'class': 'features',
        'x': -this.pixelPosition,
        'width': this.svgCanvasWidth
    });
    this.updateHeight();
};

BamTrack.prototype.render = function (targetId) {
    var _this = this;

    this.initializeDom(targetId);

    this.svgCanvasOffset = (this.width * 3 / 2) / this.pixelBase;
    this.svgCanvasLeftLimit = this.region.start - this.svgCanvasOffset * 2;
    this.svgCanvasRightLimit = this.region.start + this.svgCanvasOffset * 2

    this.dataAdapter.on('data:ready', function (event) {
        var features;
        if (event.dataType == 'histogram') {
            _this.renderer = _this.histogramRenderer;
            features = event.items;
        } else {
            _this.renderer = _this.defaultRenderer;
            features = _this._removeDisplayedChunks(event);
            //features = _this.getFeaturesToRenderByChunk(event);
        }
        _this.renderer.render(features, {
            svgCanvasFeatures: _this.svgCanvasFeatures,
            featureTypes: _this.featureTypes,
            renderedArea: _this.renderedArea,
            pixelBase: _this.pixelBase,
            position: _this.region.center(),
            regionSize: _this.region.length(),
            maxLabelRegionSize: _this.maxLabelRegionSize,
            width: _this.width,
            pixelPosition: _this.pixelPosition,
            region: _this.region
        });
        _this.updateHeight();
    });
};

BamTrack.prototype.draw = function () {
    var _this = this;

    this.svgCanvasOffset = (this.width * 3 / 2) / this.pixelBase;
    this.svgCanvasLeftLimit = this.region.start - this.svgCanvasOffset * 2;
    this.svgCanvasRightLimit = this.region.start + this.svgCanvasOffset * 2

    this.updateHistogramParams();
    this.clean();

    this.dataType = 'features';
    if (this.histogram) {
        this.dataType = 'histogram';
    }

    if (typeof this.visibleRegionSize === 'undefined' || this.region.length() < this.visibleRegionSize) {
        this.setLoading(true);
        this.dataAdapter.getData({
            dataType: this.dataType,
            region: new Region({
                chromosome: this.region.chromosome,
                start: this.region.start - this.svgCanvasOffset * 2,
                end: this.region.end + this.svgCanvasOffset * 2
            }),
            params: {
                histogram: this.histogram,
                histogramLogarithm: this.histogramLogarithm,
                histogramMax: this.histogramMax,
                interval: this.interval
            },
            done: function () {
                _this.setLoading(false);
            }
        });
        //this.invalidZoomText.setAttribute("visibility", "hidden");
    } else {
        //this.invalidZoomText.setAttribute("visibility", "visible");
    }
    _this.updateHeight();
};


BamTrack.prototype.move = function (disp) {
    var _this = this;

    this.dataType = 'features';
    if (this.histogram) {
        this.dataType = 'histogram';
    }

    _this.region.center();
    var pixelDisplacement = disp * _this.pixelBase;
    this.pixelPosition -= pixelDisplacement;

    //parseFloat important
    var move = parseFloat(this.svgCanvasFeatures.getAttribute("x")) + pixelDisplacement;
    this.svgCanvasFeatures.setAttribute("x", move);

    var virtualStart = parseInt(this.region.start - this.svgCanvasOffset);
    var virtualEnd = parseInt(this.region.end + this.svgCanvasOffset);

    if (typeof this.visibleRegionSize === 'undefined' || this.region.length() < this.visibleRegionSize) {

        if (disp > 0 && virtualStart < this.svgCanvasLeftLimit) {
            this.dataAdapter.getData({
                dataType: this.dataType,
                region: new Region({
                    chromosome: _this.region.chromosome,
                    start: parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset),
                    end: this.svgCanvasLeftLimit
                }),
                params: {
                    histogram: this.histogram,
                    histogramLogarithm: this.histogramLogarithm,
                    histogramMax: this.histogramMax,
                    interval: this.interval
                },
                done: function () {}
            });
            this.svgCanvasLeftLimit = parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset);
        }

        if (disp < 0 && virtualEnd > this.svgCanvasRightLimit) {
            this.dataAdapter.getData({
                dataType: this.dataType,
                region: new Region({
                    chromosome: _this.region.chromosome,
                    start: this.svgCanvasRightLimit,
                    end: parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset)
                }),
                params: {
                    histogram: this.histogram,
                    histogramLogarithm: this.histogramLogarithm,
                    histogramMax: this.histogramMax,
                    interval: this.interval
                },
                done: function () {}
            });
            this.svgCanvasRightLimit = parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset);
        }

    }

};

BamTrack.prototype._removeDisplayedChunks = function (response) {
    //Returns an array avoiding already drawn features in this.chunksDisplayed

    var getChunkId = function (position) {
        return Math.floor(position / response.chunkSize);
    };
    var getChunkKey = function (chromosome, chunkId) {
        return chromosome + ":" + chunkId + "_" + response.dataType + "_" + response.chunkSize;
    };

    var chunks = response.items;
    var newChunks = [];

    var feature, displayed, featureFirstChunk, featureLastChunk, features = [];
    for (var i = 0, leni = chunks.length; i < leni; i++) {//loop over chunks
        if (this.chunksDisplayed[chunks[i].chunkKey] != true) {//check if any chunk is already displayed and skip it

            features = []; //initialize array, will contain features not drawn by other drawn chunks
            for (var j = 0, lenj = chunks[i].value.alignments.length; j < lenj; j++) {
                feature = chunks[i].value.alignments[j];

                //check if any feature has been already displayed by another chunk
                displayed = false;
                featureFirstChunk = getChunkId(feature.start);
                featureLastChunk = getChunkId(feature.end);
                for (var chunkId = featureFirstChunk; chunkId <= featureLastChunk; chunkId++) {//loop over chunks touched by this feature
                    var chunkKey = getChunkKey(feature.chromosome, chunkId);
                    if (this.chunksDisplayed[chunkKey] == true) {
                        displayed = true;
                        break;
                    }
                }
                if (!displayed) {
                    features.push(feature);
                }
            }
            this.chunksDisplayed[chunks[i].chunkKey] = true;
            chunks[i].value.alignments = features;//update features array
            newChunks.push(chunks[i]);
        }
    }
    response.items = newChunks;
    return response;
};