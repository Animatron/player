var _mocks = (function() {

var mocks = {};

var __empty = function() {};

mocks.gradient = {
    'addColorStop': __empty
};

mocks.context2d = {
    'save': __empty,
    'restore': __empty,
    'fillRect': __empty,
    'clearRect': __empty,
    'fillText': __empty,
    'strokeRect': __empty,
    'translate': __empty,
    'transform': __empty,
    'beginPath': __empty,
    'closePath': __empty,
    'moveTo': __empty,
    'lineTo': __empty,
    'fill': __empty,
    'stroke': __empty,
    'createLinearGradient': function() { return mocks.gradient; },
};

mocks.canvasStyle = {

};

var __cvs_attrs = {};

mocks.canvas = {
    'getContext': function() { return mocks.context2d; },
    'hasAttribute': function(attr) { return typeof __cvs_attrs[attr] !== 'undefined'; },
    'setAttribute': function(attr, val) { __cvs_attrs[attr] = val; },
    'getAttribute': function(attr) { return __cvs_attrs[attr]; },
    'style': mocks.canvasStyle,
    'addEventListener': __empty
};

return mocks;

})();