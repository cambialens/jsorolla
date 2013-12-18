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

function DefaultVertexRenderer(args) {
    var _this = this;
    _.extend(this, Backbone.Events);

    //defaults
    this.shape = 'circle';
    this.size = 35;
    this.color = '#cccccc';
    this.strokeSize = 1;
    this.strokeColor = '#888888';
    this.opacity = 1;
    this.labelSize = 12;
    this.labelColor = '#111111';
//    this.labelPositionX = 5;
//    this.labelPositionY = 45;

    //set instantiation args, must be last
    _.extend(this, args);

}

DefaultVertexRenderer.prototype = {
    render: function (args) {
        switch (this.shape) {
            case "circle":
                this.drawCircleShape(args);
                break;
            case "square":
                this.drawSquareShape(args);
                break;
        }
    },
    drawCircleShape: function (args) {
        var vertex = args.vertex;
        var coords = args.coords;
        var targetSvg = args.target;



        var size = this.size + this.strokeSize;
        var size = size + (size * 0.3);
        var midOffset = size / 2;

        var vertexSvg = SVG.create("svg", {
            "id": vertex.id,
            "cursor": "pointer",
            x: coords.x - midOffset,
            y: coords.y - midOffset,
            'network-type': 'vertex-svg'
        });
        var groupSvg = SVG.addChild(vertexSvg, 'g');
        var circle = SVG.addChild(groupSvg, 'circle', {
            cx: midOffset,
            cy: midOffset,
            r: this.size / 2,
            stroke: this.strokeColor,
            'stroke-width': this.strokeSize,
            fill: this.color,
            'network-type': 'vertex'
        });
        var vertexText = SVG.addChild(vertexSvg, "text", {
            "x": 5,
            "y": this.labelSize+size,
            "font-size": this.labelSize,
            "fill": this.labelColor,
            'network-type': 'vertexLabel'
        });
        vertexText.textContent = vertex.name;
        targetSvg.appendChild(vertexSvg);
    },
    drawSquareShape: function (args) {

    }
}