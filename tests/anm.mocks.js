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

var __cvs_attrs = {};

mocks.factory = {};

var canvasMocksCount = 0;
mocks.factory.canvas = function() {
    var contextMock = mocks.factory.context2d();
    return {
        '__mockId': canvasMocksCount++,
        'getContext': function() { return contextMock; },
        'hasAttribute': function(attr) { return typeof __cvs_attrs[attr] !== 'undefined'; },
        'setAttribute': function(attr, val) { __cvs_attrs[attr] = val; },
        'getAttribute': function(attr) { return __cvs_attrs[attr]; },
        'style': mocks.factory.cssStyle(),
        'addEventListener': _empty,
        'width': -1,
        'height': -1,
        '__resetMock': function() { __cvs_attrs = {}; }
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
        'globalCompositeOperation': 'source-over',
        'createLinearGradient': function() { return mocks.factory.linearGradient(); },
    };
};

mocks.factory.linearGradient = function() {
    return {
        'addColorStop': _empty
    };
};

mocks.factory.element = function() {
    return {
        'id': 'some-id',
        'style': mocks.factory.cssStyle()
    }
}

mocks.factory.cssStyle = function() {
    return { };
};

// TODO: attributes

mocks.canvas = mocks.factory.canvas();
mocks.context2d = mocks.canvas.getContext('2d');
mocks.canvasStyle = mocks.canvas.style;

mocks.gradient = mocks.factory.linearGradient();

mocks.nop = _empty;

return mocks;

})();