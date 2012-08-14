var _mocks = (function() {

var mocks = {};

var __empty = function() {};

mocks.context2d = {
    'save': __empty,
    'fillRect': __empty,
    'fillText': __empty,
    'strokeRect': __empty,
    'translate': __empty,
    'createLinearGradient': __empty
};

mocks.canvasStyle = {

};

mocks.canvas = {
    'getContext': function() { return mocks.context2d; },
    'hasAttribute': __empty,
    'setAttribute': __empty,
    'style': mocks.canvasStyle,
    'addEventListener': __empty
}

return mocks;

})();