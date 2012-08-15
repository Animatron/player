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
    'createLinearGradient': function() { return mocks.gradient; },
};

mocks.canvasStyle = {

};

mocks.canvas = {
    'getContext': function() { return mocks.context2d; },
    'hasAttribute': __empty,
    'setAttribute': __empty,
    'getAttribute': __empty,
    //'style': mocks.canvasStyle,
    'addEventListener': __empty
};

return mocks;

})();