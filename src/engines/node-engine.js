exports.Engine = (function() {

    var Transform = require('../vendor/matrix.js').Transform;

    return function() {

        var $NE = {};

        // getRequestFrameFunc() -> function(callback)
        // getCancelFrameFunc() -> function(id)

        // ajax(url, callback) -> none

        // createTextMeasurer() -> function(text) -> [ width, height ]

        // findPos(elm) -> [ x, y ]
        // disposeElm(elm) -> none
        // detachElm(parent | null, child) -> none

        // createCanvas(params | [width, height], pxratio) -> canvas
        // getPlayerCanvas(id, player) -> canvas
        // getContext(canvas, type) -> context
        // playerAttachedTo(canvas, player) -> true | false
        // detachPlayer(canvas, player) -> none
        // extractUserOptions(canvas) -> options: object | {}
        // checkPlayerCanvas(canvas) -> true | false
        // hasUrlToLoad(canvas) -> string | null
        // setTabIndex(canvas) -> none
        // getCanvasParams(canvas) -> [ width, height, ratio ]
        // getCanvasBounds(canvas) -> [ x, y, width, height, ratio ]
        // configureCanvas(canvas, options, ratio) -> none
        // addChildCanvas(id, parent, pos: [x, y], style: object, inside: boolean)

        // evtPos(event) -> [ x, y ]
        // subscribeEvents(canvas, handlers: object) -> none
        // subscribeSceneToEvents(scene, canvas) -> none

        $NE.getRequestFrameFunc = function() {
            return function(callback) {
                return setTimeout(callback, 1000 / 60);
            }
        }

        $NE.getCancelFrameFunc = function() {
            return function(id) {
                return clearTimeout(id);
            }
        }

        $NE.createTransform = function() {
            return new Transform();
        }

        /* TODO: insert a real objects here */
        $NE.createCanvas = function(params, ratio) { return {}; };
        $NE.getPlayerCanvas = function(id, player) { return {}; };
        $NE.getContext = function(canvas, type) { return mocks_factory.context2d(); };

        $NE.ajax = function() { throw new Error('Not Implemented'); }

        $NE.createTextMeasurer = function() {
            return function(text) { return [0, 0]; }
        }
        $NE.findPos = function(elm) { return [0, 0] };
        $NE.disposeElm = function(elm) {};
        $NE.detachElm = function(parent, child) {};

        $NE.playerAttachedTo = function(canvas, player) { return false; }
        $NE.detachPlayer = function(canvas, player) { };
        $NE.extractUserOptions = function(canvas) { return {} };
        $NE.checkPlayerCanvas = function(canvas) { return true; };
        $NE.hasUrlToLoad = function() { return null; }
        $NE.setTabIndex = function(canvas) { }
        $NE.getCanvasParams = function() { return [ 400, 250, 1 ]; }
        $NE.getCanvasBounds = function(canvas) { return [ 0, 0, 400, 250, 1 ]; }
        $NE.configureCanvas = function(canvas, options, ratio) { }
        $NE.addChildCanvas = function(id, parent, pos, style, inside) {}

        $NE.evtPos = function() { [] };
        $NE.subscribeEvents = function(canvas, handlers) {}
        $NE.subscribeSceneToEvents = function(scene, canvas) {}

        // TODO: image, proper events

        var mocks_factory = {};

        var __nop = function() {};
        var _ctxMocksCount = 0;
        mocks_factory.context2d = function() {
            return {
                '__mockId': _ctxMocksCount++,
                'save': __nop,
                'restore': __nop,
                'fillRect': __nop,
                'clearRect': __nop,
                'fillText': __nop,
                'strokeRect': __nop,
                'translate': __nop,
                'transform': __nop,
                'beginPath': __nop,
                'closePath': __nop,
                'moveTo': __nop,
                'lineTo': __nop,
                'fill': __nop,
                'stroke': __nop,
                'clip': __nop,
                'rect': __nop,
                'drawImage': __nop,
                'scale': __nop,
                'setTransform': __nop,
                'globalAlpha': 1,
                'globalCompositeOperation': 'source-over',
                'createLinearGradient': function() { return mocks_factory.linearGradient(); },
            };
        };

        mocks_factory.linearGradient = function() {
            return {
                'addColorStop': __nop
            };
        };

        return $NE;

    };

})();