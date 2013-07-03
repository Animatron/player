exports.Engine = (function() {

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

        /* TODO: insert a real objects here */
        $NE.createCanvas = function(params, ratio) { return {}; };
        $NE.getPlayerCanvas = function(id, player) { return {}; };
        $NE.getContext = function(canvas, type) { return {}; };

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

        return $NE;

    };

})();