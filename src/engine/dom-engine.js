// DOM Engine
// -----------------------------------------------------------------------------

// FIXME: move into `anm` namespace
// TODO: should engine contain somewhat like `registerEngine` in this case?

(function(_GLOBAL_) { // preparation function which is executed immediately
                      // all engines should provide __anm_getGlobal and
                      // __anm_registerGlobally

var $glob, $wnd, $doc;

var isAmd = (typeof define === 'function' && define.amd),
    isCommonJSModule = (typeof module != 'undefined'),
    isCommonJSExports = (typeof exports === 'object');

var $glob = (typeof window !== 'undefined') ? window : _GLOBAL_;

    $wnd = (typeof window !== 'undefined') ? window : null,
    $doc = (typeof document !== 'undefined') ? document : null;

if (!$glob) throw new Error('Failed to find global object');

$glob.__anm_getGlobal = function(name) {
    return ($glob || $wnd)[name];
}

$glob.__anm_registerGlobally = function(name, obj) {
    ($glob || $wnd)[name] = obj;
}

// the engine is the only object which tricks the 'define' function and executed and
// included inline, because it is required to pass its own define version to all other files
// and they cannot use any other define version
var $engine = DomEngine();

__define('anm/engines/dom-engine', [], $engine);
// TODO: also move our define and require to global space somehow and make them not to overlap with require.js?

$glob.__anm_engine = $engine;

function DomEngine() { return (function() { // wrapper here is just to isolate it, executed immediately

    // DomEngine utils

    function __attrOr(canvas, attr, _default) {
        return canvas.hasAttribute(attr)
               ? canvas.getAttribute(attr)
               : _default;
    }

    var MARKER_ATTR = 'anm-player', // marks player existence on canvas element
        URL_ATTR = 'data-url';

    var $DE = {};

    // FIXME: here are truly a lot of methods, try to
    //        reduce their number as much as possible

    // require(what, func)
    // define(id?, what, func)

    // getRequestFrameFunc() -> function(callback)
    // getCancelFrameFunc() -> function(id)

    // ajax(url, callback) -> none

    // createTextMeasurer() -> function(text) -> [ width, height ]

    // findElementPosition(elm) -> [ x, y ]
    // findScrollAwarePos(elm) -> [ x, y ]
    // getElementBounds(elm) -> [ x, y, width, height, ratio ]
    // disposeElm(elm) -> none
    // detachElm(parent | null, child) -> none

    // createCanvas(params | [width, height], ratio?) -> canvas
    // assignPlayerToCanvas(id, player) -> canvas
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

    // getEventPos(event, elm?) -> [ x, y ]
    // subscribeWndEvents(handlers: object) -> none
    // subscribeCvsEvents(canvas, handlers: object) -> none
    // subscribeSceneToEvents(canvas, scene) -> none
    // unsubscribeSceneFromEvents(canvas, scene) -> none

    // keyEvent(evt) -> Event
    // mouseEvent(evt, canvas) -> Event

    // define / require

    $DE.require = __require;

    $DE.define = __define;

    // Framing

    $DE.__frameFunc = null;
    $DE.__cancelFunc = null;
    $DE.getRequestFrameFunc = function() {
        if ($DE.__frameFunc) return $DE.__frameFunc;
        return ($DE.__frameFunc =
                    ($wnd.requestAnimationFrame ||
                     $wnd.webkitRequestAnimationFrame ||
                     $wnd.mozRequestAnimationFrame ||
                     $wnd.oRequestAnimationFrame ||
                     $wnd.msRequestAnimationFrame ||
                     $wnd.__anm__frameGen ||
                     function(callback){
                       return $wnd.setTimeout(callback, 1000 / 60);
                     })) };
    $DE.getCancelFrameFunc = function() {
        if ($DE.__cancelFunc) return $DE.__cancelFunc;
        return ($DE.__cancelFunc =
                    ($wnd.cancelAnimationFrame ||
                     $wnd.webkitCancelAnimationFrame ||
                     $wnd.mozCancelAnimationFrame ||
                     $wnd.oCancelAnimationFrame ||
                     $wnd.msCancelAnimationFrame ||
                     $wnd.__anm__frameRem ||
                     function(id){
                       return $wnd.clearTimeout(id);
                     })) };
    /*$DE.stopAnim = function(reqId) {
        $DE.getCancelFrameFunc()(reqId);
    }*/

    // Global things

    $DE.PX_RATIO = $wnd.devicePixelRatio || 1;

    $DE.ajax = function(url, callback, errback) {
        var req = false;

        if (!$wnd.ActiveXObject) {
            req = new $wnd.XMLHttpRequest();
        } else {
            try {
                req = new $wnd.ActiveXObject("Msxml2.XMLHTTP");
            } catch (e1) {
                try {
                    req = $wnd.ActiveXObject("Microsoft.XMLHTTP");
                } catch (e2) {
                    throw new Error('No AJAX/XMLHttp support'); // SysErr
                }
            }
        }

        /*if (req.overrideMimeType) {
            req.overrideMimeType('text/xml');
          } */

        if (!req) {
          throw new Error('Failed to create XMLHttp instance'); // SysErr
        }

        var whenDone = function() {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    if (callback) callback(req);
                } else {
                    var error = new Error('AJAX request for ' + url + // SysErr
                                     ' returned ' + req.status +
                                     ' instead of 200');
                    if (errback) { errback(error, req); }
                    else { throw error; }
                }
            }
        };

        req.onreadystatechange = whenDone;
        req.open('GET', url, true);
        req.send(null);
    }

    $DE.__textBuf = null;
    $DE.createTextMeasurer = function() {
        var buff = $DE.__textBuf;
        if (!buff) {
            /* FIXME: dispose buffer when text is removed from scene */
            var _div = $doc.createElement('div');
            _div.style.visibility = 'hidden';
            _div.style.position = 'absolute';
            _div.style.top = -10000 + 'px';
            _div.style.left = -10000 + 'px';
            var _span = $doc.createElement('span');
            _div.appendChild(_span);
            $doc.body.appendChild(_div);
            $DE.__textBuf = _span;
            buff = $DE.__textBuf;
        }
        return function(text, lines_arg) {
            var has_arg = (typeof lines_arg !== 'undefined');
            var lines = has_arg ? lines_arg : text.lines;
            buff.style.font = text.font;
            buff.style.textAlign = text.align;
            buff.style.verticalAlign = text.baseline || 'bottom';
            if (Array.isArray(text.lines)) { // FIXME: replace with anm.is.arr()
                buff.textContent = text.lines.join('<br/>');
            } else {
                buff.textContent = text.lines.toString();
            }
            // TODO: test if lines were changed, and if not,
            //       use cached value
            return [ buff.offsetWidth,
                     buff.offsetHeight ];
        }
    }

    $DE.createTransform = function() {
        return new Transform();
    }

    // Elements

    /* FIXME: replace with elm.getBoundingClientRect();
       see http://stackoverflow.com/questions/8070639/find-elements-position-in-browser-scroll */
    // returns position on a screen, _including_ scroll
    $DE.findElementPosition = function(elm) {
        var curleft = 0,
            curtop = 0;
        do {
            curleft += elm.offsetLeft;
            curtop += elm.offsetTop;
        } while (elm = elm.offsetParent);
        return [ curleft, curtop ];
    }
    $DE.findScrollAwarePosition = function(elm) {
        //var bound = elm.getBoundingClientRect();
        //return [ bound.left, bound.top ];
        var curleft = 0,
            curtop = 0;
        do {
            curleft += elm.offsetLeft - elm.scrollLeft;
            curtop += elm.offsetTop - elm.scrollTop;
        } while (elm = elm.offsetParent);
        return [ curleft, curtop ];
    }
    /*$DE.getElementBounds = function(elm) {
        var rect = elm.getBoundingClientRect();
        return [ rect.left, rect.top, rect.width, rect.height, $DE.PX_RATIO ];
    }*/

    $DE.__trashBin;
    $DE.disposeElm = function(elm) {
        var trashBin = $DE.__trashBin;
        if (!trashBin) {
            trashBin = $doc.createElement('div');
            trashBin.id = 'trash-bin';
            trashBin.style.display = 'none';
            $doc.body.appendChild(trashBin);
            $DE.__trashBin = trashBin;
        }
        trashBin.appendChild(domElm);
        trashBin.innerHTML = '';
    }
    $DE.detachElm = function(parent, child) {
        (parent ? parent.parentNode
                : $doc.body).removeChild(child);
    }

    // Creating & Modifying Canvas

    $DE.createCanvas = function(dimen, ratio) {
        var cvs = $doc.createElement('canvas');
        $DE.configureCanvas(cvs, dimen, ratio);
        return cvs;
    }
    $DE.assignPlayerToCanvas = function(id, player) {
        var cvs = $doc.getElementById(id);
        //if (!cvs) throw new PlayerErr(_strf(Errors.P.NO_CANVAS_WITH_ID, [id]));
        //if (cvs.getAttribute(MARKER_ATTR)) throw new PlayerErr(Errors.P.ALREADY_ATTACHED);
        if (!cvs) throw new Errror('No canvas with id \'' + id + '\' was found.');
        if (cvs.getAttribute(MARKER_ATTR)) throw new Error('Player is already attached to canvas \'' + id + '\'.');
        cvs.setAttribute(MARKER_ATTR, true);
        return cvs;
    }
    $DE.playerAttachedTo = function(cvs, player) {
        return cvs.hasAttribute(MARKER_ATTR);
    }
    $DE.detachPlayer = function(cvs, player) {
        cvs.removeAttribute(MARKER_ATTR);
    }
    $DE.getContext = function(cvs, type) {
        return cvs.getContext(type);
    }
    $DE.extractUserOptions = function(cvs) {
      var width, height,
          ratio = $DE.PX_RATIO;
      return { 'debug': __attrOr(cvs, 'data-debug', undefined),
               'inParent': undefined,
               'muteErrors': __attrOr(cvs, 'data-mute-errors', false),
               'repeat': __attrOr(cvs, 'data-repeat', undefined),
               'mode': __attrOr(cvs, 'data-mode', undefined),
               'zoom': __attrOr(cvs, 'data-zoom', undefined),
               'meta': { 'title': __attrOr(cvs, 'data-title', undefined),
                         'author': __attrOr(cvs, 'data-author', undefined),
                         'copyright': undefined,
                         'version': undefined,
                         'description': undefined },
               'anim': { 'fps': undefined,
                         'width': (__attrOr(cvs, 'data-width',
                                  (width = __attrOr(cvs, 'width', undefined),
                                   width ? (width / ratio) : undefined))),
                         'height': (__attrOr(cvs, 'data-height',
                                   (height = __attrOr(cvs, 'height', undefined),
                                    height ? (height / ratio) : undefined))),
                         'bgcolor': cvs.hasAttribute('data-bgcolor')
                                   ? cvs.getAttribute('data-bgcolor')
                                   : undefined,
                         'duration': undefined } };
    }
    $DE.checkPlayerCanvas = function(cvs) {
        return true;
    }
    $DE.hasUrlToLoad = function(cvs) {
        return cvs.getAttribute(URL_ATTR);
    }
    $DE.setTabIndex = function(cvs, idx) {
        cvs.setAttribute('tabindex', idx);
    }
    $DE.getCanvasParams = function(cvs) {
        //var ratio = $DE.PX_RATIO;
        // ensure ratio is set when canvas created
        return [ cvs.__anm_width, cvs.__anm_height, $DE.PX_RATIO ];
    }
    $DE.getCanvasBounds = function(cvs/*, parent*/) {
        //var parent = parent || cvs.parentNode;
        var pos = $DE.findScrollAwarePosition(cvs),
            params = $DE.getCanvasParams(cvs);
        // bounds are: left, top, width, height, ratio.
        // I am not sure if I am correct in providing width/height instead of
        // left+width/top+height, but I think it's better to return values
        // not required to sum up/subtract in this case.
        return [ pos[0], pos[1], params[0], params[1], params[2] ];
    }
    $DE.configureCanvas = function(cvs, opts, ratio) {
        var ratio = ratio || $DE.PX_RATIO;
        var isObj = !(opts instanceof Array),
            _w = isObj ? opts.width : opts[0],
            _h = isObj ? opts.height : opts[1];
        if (isObj && opts.bgcolor) {
            cvs.style.backgroundColor = opts.bgcolor;
        }
        cvs.__anm_ratio = ratio;
        cvs.__anm_width = _w;
        cvs.__anm_height = _h;
        cvs.style.width = _w + 'px';
        cvs.style.height = _h + 'px';
        cvs.setAttribute('width', _w * (ratio || 1));
        cvs.setAttribute('height', _h * (ratio || 1));
        $DE._saveCanvasPos(cvs);
        return [ _w, _h ];
    }
    $DE._saveCanvasPos = function(cvs) {
        // FIXME: use getBoundingClientRect?
        var gcs = ($doc.defaultView &&
                   $doc.defaultView.getComputedStyle); // last is assigned

        // computed padding-left
        var cpl = gcs ?
              (parseInt(gcs(cvs, null).paddingLeft, 10) || 0) : 0,
        // computed padding-top
            cpt = gcs ?
              (parseInt(gcs(cvs, null).paddingTop, 10) || 0) : 0,
        // computed border-left
            cbl = gcs ?
              (parseInt(gcs(cvs, null).borderLeftWidth,  10) || 0) : 0,
        // computed border-top
            cbt = gcs ?
              (parseInt(gcs(cvs, null).borderTopWidth,  10) || 0) : 0;

        var html = $doc.body.parentNode,
            htol = html.offsetLeft,
            htot = html.offsetTop;

        var elm = cvs,
            ol = cpl + cbl + htol,
            ot = cpt + cbt + htot;

        if (elm.offsetParent !== undefined) {
            do {
                ol += elm.offsetLeft;
                ot += elm.offsetTop;
            } while (elm = elm.offsetParent)
        }

        ol += cpl + cbl + htol;
        ot += cpt + cbt + htot;

        /* FIXME: find a method with no injection of custom properties
                  (data-xxx attributes are stored as strings and may work
                   a bit slower for events) */
        cvs.__rOffsetLeft = ol || cvs.__anm_usr_x;
        cvs.__rOffsetTop = ot || cvs.__anm_usr_y;
    }
    $DE.addChildCanvas = function(id, parent, pos, style, inside) {
        // pos should be: [ x, y, w, h]
        // style may contain _class attr
        var _ratio = $DE.PX_RATIO,
            _x = pos[0], _y = pos[1],
            _w = pos[2], _h = pos[3], // width & height
            // FIXME: the variables below are not used
            _pp = $DE.findElementPosition(parent), // parent position
            _bp = [ _pp[0] + parent.clientLeft + _x, _pp[1] + parent.clientTop + _y ], // bounds position
            _cp = inside ? [ parent.parentNode.offsetLeft + parent.clientLeft + _x,
                             parent.parentNode.offsetTop  + parent.clientTop + _y ]
                           : _bp; // position to set in styles
        var cvs = $DE.createCanvas([ _w, _h ], _ratio);
        cvs.id = parent.id ? ('__' + parent.id + '_' + id) : ('__anm_' + id) ;
        if (style._class) cvs.className = style._class;
        for (var prop in style) {
            cvs.style[prop] = style[prop];
        }
        cvs.style.left = _cp[0] + 'px';
        cvs.style.top = _cp[1] + 'px';
        var appendTo = inside ? parent.parentNode
                              : $doc.body;
        // FIXME: a dirty hack?
        if (inside) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(cvs);
        return cvs;
    }

    // Events

    $DE.getEventPos = function(evt, elm) {
        /*if (elm && (elm.__rOffsetLeft || elm.__rOffsetTop)) return [ evt.pageX - elm.__rOffsetLeft,
                                                                     evt.pageY - elm.__rOffsetTop ];
        else */ if (elm) {
            var shift = $DE.findElementPosition(elm);
            return [ evt.pageX - shift[0], evt.pageY - shift[1] ];
        } else return [ evt.pageX, evt.pageY ];
    }
    $DE.subscribeWndEvents = function(handlers) {
        for (var type in handlers) {
            $wnd.addEventListener(type, handlers[type], false);
        }
    }
    $DE.subscribeCvsEvents = function(cvs, handlers) {
        for (var type in handlers) {
            cvs.addEventListener(type, handlers[type], false);
        }
    }
    $DE.unsubcribeCvsEvents = function(cvs, handlers) {
        for (var type in handlers) {
            cvs.removeEventListener(type, handlers[type]);
        }
    }
    $DE.keyEvent = function(e) {
        return { key: ((e.keyCode != null) ? e.keyCode : e.which),
                 ch: e.charCode };
    }
    $DE.mouseEvent = function(e, cvs) {
        return { pos: $DE.getEventPos(e, cvs) };
    }
    var _kevt = $DE.keyEvent,
        _mevt = $DE.mouseEvent;
    $DE.subscribeSceneToEvents = function(cvs, scene) {
        if (cvs.__anm_subscribed &&
            cvs.__anm_subscribed[scene.id]) {
            return;
        }
        //canvas.__anm_subscription_id = guid();
        if (!cvs.__anm_handlers)   cvs.__anm_handlers = {};
        if (!cvs.__anm_subscribed) cvs.__anm_subscribed = {};
        var handlers = cvs.__anm_subscribed[scene.id] || {
          mouseup:   function(evt) { anim.fire(C.X_MUP,     _mevt(evt, canvas)); },
          mousedown: function(evt) { anim.fire(C.X_MDOWN,   _mevt(evt, canvas)); },
          mousemove: function(evt) { anim.fire(C.X_MMOVE,   _mevt(evt, canvas)); },
          mouseover: function(evt) { anim.fire(C.X_MOVER,   _mevt(evt, canvas)); },
          mouseout:  function(evt) { anim.fire(C.X_MOUT,    _mevt(evt, canvas)); },
          click:     function(evt) { anim.fire(C.X_MCLICK,  _mevt(evt, canvas)); },
          dblclick:  function(evt) { anim.fire(C.X_MDCLICK, _mevt(evt, canvas)); },
          keyup:     function(evt) { anim.fire(C.X_KUP,     _kevt(evt)); },
          keydown:   function(evt) { anim.fire(C.X_KDOWN,   _kevt(evt)); },
          keypress:  function(evt) { anim.fire(C.X_KPRESS,  _kevt(evt)); }
        };
        canvas.__anm_handlers[scene.id] = handlers;
        canvas.__anm_subscribed[scene.id] = true;
        $DE.subscribeCvsEvents(canvas, handlers);
    }
    $DE.unsubscribeSceneFromEvents = function(cvs, scene) {
        if (!cvs.__anm_handlers   ||
            !cvs.__anm_subscribed ||
            !cvs.__anm_subscribed[scene.id]) return;
        var handlers = cvs.__anm_handlers[scene.id];
        if (!handlers) return;
        $DE.unsubscribeCvsEvents(cvs, handlers);
    }

    return $DE;

})(this); };

function __getAllFromGlob(what) {
    var what = Array.isArray(what) ? what : [ what ], // FIXME: replace with anm.is.arr()
        collected = [];
    for (var i = 0, il = what.length; i < il; i++) {
        collected.push(__getGlob(what[i]));
    }
    return collected;
}

function __getGlob(path) {
    // TODO: convert dashes to camel-case
    var split = path.split('/');
    var trg = $glob;
    for (var i = 0, il = split.length; i < il; i++) {
        trg = trg[split[i]];
    }
    return trg;
}

function __setGlob(path, val) {
    // TODO: convert dashes to camel-case
    var split = path.split('/');
    var trg = $glob;
    for (var i = 0, il = split.length; i < il; i++) {
        if (!trg[split[i]]) {
            trg[split[i]] = (i === (il - 1)) ? val : {};
        } else if (i === (il - 1)) {
            for (var prop in val) {
                trg[split[i]][prop] = val[prop];
            }
        }
        trg = trg[split[i]];
    }
}

function __prepareForNativeRequire(what) {
    // TODO: convert dashes to camel-case
    var what = Array.isArray(what) ? what : [ what ], // FIXME: replace with anm.is.arr()
        collected = [],
        split;
    for (var i = 0, il = what.length; i < il; i++) {
        collected.push(__adaptForNativeRequire(what[i]));
    }
    return collected;
}

function __adaptForNativeRequire(what) {
    // TODO: convert dashes to camel-case
    var split = what[i].split('/');
    if (split.length == 1) return split[0];
    var trg = '';
    for (var i = 1, il = split.length; i < il; i++) {
        trg += split[i] + ((i !== il - 1) ? '/' : '');
    }
    return trg;
}

function __require(what, func) {
    if (isAmd || isCommonJSModule || isCommonJSExports) {
        require(__prepareForNativeRequire(what), func);
    } else {
        func.apply(null, __getGlob(what));
    }
}

function __define(arg1, arg2, arg3) {
    var id = arg3 ? arg1 : null,
        req = arg3 ? arg2 : arg1,
        value = arg3 ? arg3 : arg2;

    if (isAmd) {
        define.apply(null, arguments);
    } else {
        // id will be a file-path
        var isFunc = (typeof value == 'function');
        var call_with = req ? ((isCommonJSModule || isCommonJSExports) ? __prepareForNativeRequire(req)
                                                                       : __getAllFromGlob(req))
                            : [];
        if (!isFunc) {
            for (var i = 0, il = call_with.length; i < il; i++) { require(call_with[i]); }
        }
        var result = (typeof value == 'function') ? value.apply(null, call_with) : value;
        if (isCommonJSModule) {
            module.exports = result;
        } else if (isCommonJSExports) {
            exports = result;
        } else {
            __setGlob(id, result);
        }
    }
}

})(this);
