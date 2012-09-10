/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _mocks = (function() {

var mocks = {};

var _empty = function() {};

mocks.gradient = {
    'addColorStop': _empty
};

mocks.context2d = {
    'save': _empty,
    'restore': _empty,
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
    'createLinearGradient': function() { return mocks.gradient; },
};

mocks.canvasStyle = {

};

mocks.saveCanvasFake = function(cvs) {
    cvs.__rOffsetLeft = 40;
    cvs.__rOffsetTop = 40;
};

var __cvs_attrs = {};

mocks.canvas = {
    'getContext': function() { return mocks.context2d; },
    'hasAttribute': function(attr) { return typeof __cvs_attrs[attr] !== 'undefined'; },
    'setAttribute': function(attr, val) { __cvs_attrs[attr] = val; },
    'getAttribute': function(attr) { return __cvs_attrs[attr]; },
    'style': mocks.canvasStyle,
    'addEventListener': _empty,
    '__resetMock': function() { __cvs_attrs = {}; }
};

return mocks;

})();