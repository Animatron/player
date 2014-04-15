/* Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function TestEngine($wnd, $doc) { return (function() { // wrapper here is just to isolate it, executed immediately

    var $TE = {};

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

    var DomEngine = anm.__dev._DomEngine;

    // FIXME: return FrameGen
    $TE.getRequestFrameFunc = DomEngine.getRequestFrameFunc;
    // FIXME: return FrameGen
    $TE.getCancelFrameFunc = DomEngine.getCancelFrameFunc;
    $TE.createTransform = DomEngine.createTransform;

    /* TODO: insert a real objects here */
    $TE.createCanvas = function(params, ratio) { return _mocks.factory.canvas(); };
    $TE.getPlayerCanvas = DomEngine.getPlayerCanvas;
    $TE.getContext = DomEngine.getContext;

    $TE.ajax = DomEngine.ajax;

    $TE.createTextMeasurer = DomEngine.createTextMeasurer;
    $TE.findPos = function(elm) { return [0, 0] };
    $TE.disposeElm = function(elm) {};
    $TE.detachElm = function(parent, child) {};

    $TE.playerAttachedTo = DomEngine.playerAttachedTo;
    $TE.detachPlayer = DomEngine.detachPlayer;
    $TE.extractUserOptions = DomEngine.detachPlayer;
    $TE.checkPlayerCanvas = DomEngine.detachPlayer;
    $TE.hasUrlToLoad = DomEngine.detachPlayer;
    $TE.setTabIndex = __nop;
    $TE.getCanvasParams = DomEngine.getCanvasParams;
    $TE.getCanvasBounds = DomEngine.getCanvasBounds;
    $TE.configureCanvas = DomEngine.configureCanvas;
    $TE.addChildCanvas = __nop;

    $TE.evtPos = DomEngine.evtPos;
    $TE.subscribeEvents = DomEngine.subscribeEvents;
    $TE.subscribeSceneToEvents = DomEngine.subscribeSceneToEvents;

    // TODO: image, proper events

    var __nop = function() {};

    return $TE;

})(); };
