/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _mocks = (function() {

var mocks = {};

var _empty = function() {};

mocks.saveCanvasFake = function(cvs) {
    cvs.__rOffsetLeft = 40;
    cvs.__rOffsetTop = 40;
};

mocks.factory = {};

var canvasMocksCount = 0;
mocks.factory.canvas = function(id) {
    var contextMock = mocks.factory.context2d();
    var mockId = canvasMocksCount;
    canvasMocksCount++;
    return {
        '__mockId': mockId,
        '__attrs': {},
        'id': id || ('canvas-mock-'+mockId),
        'getContext': function() { return contextMock; },
        'hasAttribute': function(attr) { return typeof this.__attrs[attr] !== 'undefined'; },
        'setAttribute': function(attr, val) { this.__attrs[attr] = val; },
        'getAttribute': function(attr) { return this.__attrs[attr]; },
        'style': mocks.factory.cssStyle(),
        'addEventListener': _empty,
        'width': undefined,
        'height': undefined,
        '__resetMock': function() { this.__attrs = {};
                                    this.style = mocks.factory.cssStyle();
                                    this.width = undefined;
                                    this.height = undefined; }
    };
};

var ctxMocksCount = 0;
mocks.factory.context2d = function() {
    return {
        '__mockId': ctxMocksCount++,
        'save': function() {
            this.__copy = {
                'fillStyle': this.fillStyle,
                'strokeStyle': this.strokeStyle,
                'globalAlpha': this.globalAlpha,
                'globalCompositeOperation': this.globalCompositeOperation
            };
        },
        'restore': function() {
            this.fillStyle = this.__copy.fillStyle;
            this.strokeStyle = this.__copy.strokeStyle;
            this.globalAlpha = this.__copy.globalAlpha;
            this.globalCompositeOperation = this.__copy.globalCompositeOperation;
        },
        'fillRect': _empty,
        'clearRect': _empty,
        'fillText': _empty,
        'strokeRect': _empty,
        'translate': _empty,
        'transform': _empty,
        'beginPath': _empty,
        'closePath': _empty,
        'moveTo': _empty,
        'lineTo': _empty,
        'fill': _empty,
        'stroke': _empty,
        'clip': _empty,
        'drawImage': _empty,
        'scale': _empty,
        'globalCompositeOperation': 'source-over',
        'createLinearGradient': function() { return mocks.factory.linearGradient(); },
    };
};

mocks.factory.linearGradient = function() {
    return {
        'addColorStop': _empty
    };
};

mocks.factory.element = function(id) {
    return {
        'id': id || 'some-id',
        'style': mocks.factory.cssStyle()
    }
}

mocks.factory.cssStyle = function() {
    return { };
};

mocks.factory.nop = function() {
    return function() {};
}

// TODO: attributes

mocks.canvas = mocks.factory.canvas();
mocks.context2d = mocks.canvas.getContext('2d');
mocks.canvasStyle = mocks.canvas.style;

mocks.gradient = mocks.factory.linearGradient();

mocks.nop = mocks.factory.nop();

return mocks;

})();