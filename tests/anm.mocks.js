/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _mocks = (function() {

var mocks = {};

var __nop = function() {};

mocks.saveCanvasFake = function(cvs) {
    cvs.__rOffsetLeft = 40;
    cvs.__rOffsetTop = 40;
};

mocks.factory = {};

mocks.factory.window = function() {
    return {
        addEventListener: __nop
    };
}

var canvasMocksCount = 0;
mocks.factory.canvas = function(id) {
    var contextMock = mocks.factory.context2d();
    var mockId = canvasMocksCount;
    canvasMocksCount++;
    return {
        '__mockId': mockId,
        '__attrs': {},
        '__ctx2dMock': contextMock,
        'id': id || ('canvas-mock-'+mockId),
        'getContext': function(which) { return which == '2d' ? contextMock : undefined; },
        'hasAttribute': function(attr) { return typeof this.__attrs[attr] !== 'undefined'; },
        'setAttribute': function(attr, val) { this.__attrs[attr] = val; },
        'getAttribute': function(attr) { return this.__attrs[attr]; },
        'style': mocks.factory.cssStyle(),
        'addEventListener': __nop,
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
        'fillRect': __nop,
        'clearRect': __nop,
        'fillText': __nop,
        'strokeRect': __nop,
        'translate': __nop,
        'transform': __nop,
        'beginPath': __nop,
        'closePath': __nop,
        'arc': __nop,
        'moveTo': __nop,
        'lineTo': __nop,
        'bezierCurveTo': __nop,
        'fill': __nop,
        'stroke': __nop,
        'clip': __nop,
        'rect': __nop,
        'drawImage': __nop,
        'scale': __nop,
        'rotate': __nop,
        'translate': __nop,
        'globalAlpha': 1,
        'globalCompositeOperation': 'source-over',
        'setTransform': __nop,
        'createLinearGradient': function() { return mocks.factory.linearGradient(); },
        'createRadialGradient': function() { return mocks.factory.radialGradient(); }
    };
};

mocks.factory.linearGradient = function() {
    return {
        'addColorStop': __nop
    };
};

mocks.factory.radialGradient = function() {
    return {
        'addColorStop': __nop
    };
};

mocks.factory.element = function(id) {
    return {
        'id': id || 'some-id',
        'style': mocks.factory.cssStyle(),
        'appendChild': __nop
    }
}

mocks.factory.importer = function() {
    return {
        'load': __nop
    }
}

mocks.factory.fullImporter = function() {
    return {
        'configureAnim': __nop,
        'configureMeta': __nop,
        'load': __nop
    }
}

mocks.factory.transform = function() {
    var _instance = {
            'reset': __nop,
            'multiply': __nop,
            'invert': __nop,
            'rotate': __nop,
            'rotateDegrees': __nop,
            'translate': __nop,
            'scale': __nop,
            'shear': __nop,
            'transformPoint': __nop,
            'apply': __nop,
            'clone': __nop,
            'inverted': __nop
        };
    var _f = function() {
        return _instance;
    }
    _f.instance = _instance;
    return _f;
}

mocks.factory.cssStyle = function() {
    return { };
};

mocks.factory.nop = function() {
    return function() {};
}

// TODO: attributes

/*
these mocks became accidentally reused among tests w/o resetting,
so I decided to turn them off and prefer direct creation from factory
mocks.canvas = mocks.factory.canvas();
mocks.context2d = mocks.canvas.getContext('2d');
mocks.canvasStyle = mocks.canvas.style;*/

mocks.gradient = mocks.factory.linearGradient();

mocks.nop = mocks.factory.nop();

mocks.createElement = function(tag) {
    if (tag === 'canvas') return mocks.factory.canvas();
    return mocks.factory.element();
};

mocks.adaptDocument = function(_doc, getElementById) {
    var _getElementById,
        _createElement,
        _appendChild,
        _removeChild;
    if (getElementById) {
        _getElementById = spyOn(document, 'getElementById').andCallFake(getElementById);
    } else {
        _getElementById = spyOn(document, 'getElementById').andReturn(mocks.factory.canvas());
    }
    _createElement = spyOn(document, 'createElement').andCallFake(mocks.createElement);
    _appendChild = spyOn(document.body, 'appendChild').andCallFake(mocks.nop);
    _removeChild = spyOn(document.body, 'removeChild').andCallFake(mocks.nop);
    return {
        'getElementById': _getElementById,
        'createElement': _createElement,
        'appendChild': _appendChild
    };
}

// TODO: tests for mocks

return mocks;

})();
