/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

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

    // DomEngine constants

    var MARKER_ATTR = 'anm-player', // marks player existence on canvas element
        URL_ATTR = 'data-url';

    var $DE = {};

    // FIXME: here are truly a lot of methods, try to
    //        reduce their number as much as possible

    // PX_RATIO

    // require(what, func)
    // define(id?, what, func)

    // getRequestFrameFunc() -> function(callback)
    // getCancelFrameFunc() -> function(id)

    // ajax(url, callback?, errback?, method?, headers?) -> none
    // getCookie(name) -> String

    // ensureGlobalStylesInjected() -> none
    // injectElementStyles(elm, general_class, instance_class) -> [ general_rule, instance_rule ];

    // createTextMeasurer() -> function(text) -> [ width, height ]

    // createTransform() -> Transform

    // getElementById(id) -> Element
    // findElementPosition(elm) -> [ x, y ]
    // findScrollAwarePosition(elm) -> [ x, y ]
    // // getElementBounds(elm) -> [ x, y, width, height, ratio ]
    // moveElementTo(elm, x, y) -> none
    // disposeElement(elm) -> none
    // detachElement(parent | null, child) -> none
    // showElement(elm) -> none
    // hideElement(elm) -> none

    // createCanvas(width, height, bg?, ratio?) -> canvas
    // assignPlayerToCanvas(canvas, player, id) -> wrapper
    // getContext(canvas, type) -> context
    // playerAttachedTo(canvas, player) -> true | false
    // detachPlayer(canvas, player) -> none
    // extractUserOptions(canvas) -> options: object | {}
    // checkPlayerCanvas(canvas) -> true | false
    // hasUrlToLoad(canvas) -> string | null
    // setTabIndex(canvas) -> none
    // getCanvasSize(canvas) -> [ width, height ]
    // getCanvasPosition(canvas) -> [ x, y ]
    // getCanvasParameters(canvas) -> [ width, height, ratio ]
    // getCanvasBounds(canvas) -> [ x, y, width, height, ratio ]
    // setCanvasSize(canvas, width, height, ratio?) -> none
    // setCanvasPosisition(canvas, x, y) -> none
    // setCanvasBackground(canvas, value) -> none
    // updateCanvasMetrics(canvas) -> none
    // addCanvasOverlay(id, parent: canvas, conf: [x, y, w, h], callback: function(canvas)) -> canvas
    // updateCanvasOverlays(canvas) -> none

    // registerAsControlsElement(elm, player) -> none
    // registerAsInfoElement(elm, player) -> none

    // getEventPosition(event, elm?) -> [ x, y ]
    // subscribeWindowEvents(handlers: object) -> none
    // subscribeCanvasEvents(canvas, handlers: object) -> none
    // unsubscribeCanvasEvents(canvas, handlers: object) -> none
    // subscribeSceneToEvents(canvas, scene, map) -> none
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

    $DE.ajax = function(url, callback, errback, method, headers) {
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
        req.open(method || 'GET', url, true);

        if (headers) {
            for (var header in headers) {
                req.setRequestHeader(header, headers[header]);
            }
        }

        req.send(null);
    }
    $DE.getCookie = function(name) {
        // from http://www.codelib.net/javascript/cookies.html
        var s = $doc.cookie, i;
        if (s)
        for (i=0, s=s.split('; '); i<s.length; i++) {
        s[i] = s[i].split('=', 2);
        if (unescape(s[i][0]) == name)
        return unescape(s[i][1]);
        }
        return null;
        /*var val=RegExp("(\\b|;)"+name+"[^;\\b]+").exec($doc.cookie);
        return val ? unescape(val[0].replace(/^[^=]+./,"")) : null;*/
    }

    $DE.__stylesTag = null;
    // FIXME: move these constants to anm.js
    $DE.WRAPPER_CLASS = 'anm-wrapper';
    $DE.WRAPPER_INSTANCE_CLASS_PREFIX = 'anm-wrapper-';
    $DE.PLAYER_CLASS = 'anm-player';
    $DE.PLAYER_INSTANCE_CLASS_PREFIX = 'anm-player-';
    $DE.CONTROLS_CLASS = 'anm-controls';
    $DE.CONTROLS_INSTANCE_CLASS_PREFIX = 'anm-controls-';
    $DE.INFO_CLASS = 'anm-controls';
    $DE.INFO_INSTANCE_CLASS_PREFIX = 'anm-controls-';

    $DE.styling = {
        wrapperGeneral: function(rule) {
            rule.style.position = 'relative';
        },
        wrapperInstance: function(rule) { },
        playerGeneral: function(rule) { },
        playerInstance: function(rule, desc) { },
        controlsGeneral: function(rule) {
            rule.style.position = 'absolute';
            rule.style.left = 0;
            rule.style.top = 0;
            rule.style.verticalAlign = 'top';
            rule.style.zIndex = 100;
            rule.style.cursor = 'pointer';
            rule.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        },
        controlsInstance: function(rule, desc) { },
        infoGeneral: function(rule) {
            rule.style.position = 'relative';
            rule.style.verticalAlign = 'top';
            rule.style.zIndex = 110;
            rule.style.cursor = 'pointer';
            rule.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            rule.style.opacity = 1;
        },
        infoInstance: function(rule, desc) { },
    }

    $DE.ensureGlobalStylesInjected = function() {
        if ($DE.__stylesTag) return;
        //if (!($doc.readyState === "complete")) return;
        var stylesTag = $doc.createElement('style');
        stylesTag.type = 'text/css';

        $doc.getElementsByTagName("head")[0].appendChild(stylesTag);

        $DE.__stylesTag = stylesTag;
    }
    $DE.injectElementStyles = function(elm, general_class, instance_class) {
        var styles = $DE.__stylesTag.sheet,
            rules = styles.cssRules || styles.rules;
        if (elm.classList) {
            elm.classList.add(general_class);
            elm.classList.add(instance_class);
        } else if (elm.className){
            elm.className += general_class + ' ' + instance_class;
        } else {
            elm.className = general_class + ' ' + instance_class;
        }
        elm.__anm_genClass  = general_class;
        elm.__anm_instClass = instance_class;
        var general_rule_idx  = (styles.insertRule || styles.addRule).call(styles, '.' +general_class + '{}', rules.length),
            instance_rule_idx = (styles.insertRule || styles.addRule).call(styles, '.' +instance_class + '{}', rules.length);
        var elm_rules = [ rules[general_rule_idx],
                          rules[instance_rule_idx] ];
        elm.__anm_genRule  = elm_rules[0];
        elm.__anm_instRule = elm_rules[1];
        return elm_rules;
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
            $doc.body.appendChild(_div);
            $DE.__textBuf = _div;
            buff = $DE.__textBuf;
        }
        return function(text, lines_arg) {
            var has_arg = (typeof lines_arg !== 'undefined');
            var lines = has_arg ? lines_arg : text.lines;
            buff.style.font = text.font;
            //buff.style.textAlign = text.align;
            //buff.style.verticalAlign = text.baseline || 'bottom';
            buff.style.whiteSpace = 'pre';
            if (Array.isArray(text.lines)) { // FIXME: replace with anm.is.arr()
                buff.textContent = text.lines.join('\n');
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

    $DE.getElementById = function(id) {
        return $doc.getElementById(id);
    }
    /* FIXME: replace with elm.getBoundingClientRect();
       see http://stackoverflow.com/questions/8070639/find-elements-position-in-browser-scroll */
    // returns position on a screen, _including_ scroll
    $DE.findElementPosition = function(elm) {
        if (elm.getBoundingClientRect) {
           var rect = elm.getBoundingClientRect();
           return [ rect.left, rect.top ];
        }
        var curleft = 0,
            curtop = 0;
        do {
            curleft += elm.offsetLeft;
            curtop += elm.offsetTop;
        } while (elm = elm.offsetParent);
        return [ curleft, curtop ];
    }
    $DE.findScrollAwarePosition = function(elm) {
        if (elm.getBoundingClientRect) {
            var curleft = 0,
                curtop = 0;
            var rect = elm.getBoundingClientRect();
            do {
                curleft += ((elm !== $doc.body)
                            ? elm.scrollLeft
                            : $doc.documentElement.scrollLeft);
                curtop += ((elm !== $doc.body)
                            ? elm.scrollTop
                            : $doc.documentElement.scrollTop);
            } while (elm = elm.offsetParent);
            return [ rect.left - curleft, rect.top - curtop ];
        }
        //var bound = elm.getBoundingClientRect();
        //return [ bound.left, bound.top ];
        var curleft = 0,
            curtop = 0;
        do {
            curleft += elm.offsetLeft - ((elm !== $doc.body)
                                         ? elm.scrollLeft
                                         : $doc.documentElement.scrollLeft);
            curtop += elm.offsetTop - ((elm !== $doc.body)
                                         ? elm.scrollTop
                                         : $doc.documentElement.scrollTop);
        } while (elm = elm.offsetParent);
        return [ curleft, curtop ];
    }
    /*$DE.getElementBounds = function(elm) {
        var rect = elm.getBoundingClientRect();
        return [ rect.left, rect.top, rect.width, rect.height, $DE.PX_RATIO ];
    }*/
    $DE.moveElementTo = function(elm, x, y) {
        (elm.__anm_instRule || elm).style.left = (x === 0) ? '0' : (x + 'px');
        (elm.__anm_instRule || elm).style.top  = (y === 0) ? '0' : (y + 'px');
    }

    $DE.__trashBin;
    $DE.disposeElement = function(elm) {
        var trashBin = $DE.__trashBin;
        if (!trashBin) {
            trashBin = $doc.createElement('div');
            trashBin.id = 'trash-bin';
            trashBin.style.display = 'none';
            $doc.body.appendChild(trashBin);
            $DE.__trashBin = trashBin;
        }
        trashBin.appendChild(elm);
        trashBin.innerHTML = '';
    }
    $DE.detachElement = function(parent, child) {
        (parent || child.parentNode).removeChild(child);
    }
    $DE.showElement = function(elm) {
        (elm.__anm_instRule || elm).style.visibility = 'visible';
    }
    $DE.hideElement = function(elm) {
        (elm.__anm_instRule || elm).style.visibility = 'hidden';
    }

    // Creating & Modifying Canvas

    $DE.createCanvas = function(width, height, bg, ratio) {
        var cvs = $doc.createElement('canvas');
        $DE.setCanvasSize(cvs, width, height, ratio);
        if (bg) $DE.setCanvasBackground(cvs, bg);
        return cvs;
    }
    $DE.assignPlayerToCanvas = function(cvs, player, id) {
        //if (cvs.getAttribute(MARKER_ATTR)) throw new PlayerErr(Errors.P.ALREADY_ATTACHED);
        if (!cvs) return null;
        if (cvs.getAttribute(MARKER_ATTR)) throw new Error('Player is already attached to canvas \'' + (cvs.id || id) + '\'.');
        cvs.setAttribute(MARKER_ATTR, true);
        $DE.ensureGlobalStylesInjected();
        var cvs_rules = $DE.injectElementStyles(cvs,
                                                $DE.PLAYER_CLASS,
                                                $DE.PLAYER_INSTANCE_CLASS_PREFIX + (id || 'no-id'));
        $DE.styling.playerGeneral(cvs_rules[0]);
        $DE.styling.playerInstance(cvs_rules[1]);
        var wrapper = $doc.createElement('div');
        var parent = cvs.parentNode || $doc.body;
        if (cvs.parentNode) {
            parent.replaceChild(wrapper, cvs);
            wrapper.appendChild(cvs);
            cvs.__anm_wrapper = wrapper;
        }
        var wrapper_rules = $DE.injectElementStyles(wrapper,
                                                    $DE.WRAPPER_CLASS,
                                                    $DE.WRAPPER_INSTANCE_CLASS_PREFIX + (id || 'no-id'));
        $DE.styling.wrapperGeneral(wrapper_rules[0]);
        $DE.styling.wrapperInstance(wrapper_rules[1]);
        return wrapper;
    }
    $DE.playerAttachedTo = function(cvs, player) {
        return cvs.hasAttribute(MARKER_ATTR);
    }
    $DE.clearCanvasProps = function(cvs) {
        if (!cvs) return;
        cvs.__anm_wrapper = null;
        cvs.__anm_overlays = null;
        cvs.__anm_subscribed = null;
        cvs.__anm_genRule = null; cvs.__anm_instRule = null;
        cvs.__anm_ref_canvas = null;
        delete cvs.__anm_wrapper;
        delete cvs.__anm_overlays;
        delete cvs.__anm_subscribed;
        delete cvs.__anm_ratio;
        delete cvs.__anm_genRule; delete cvs.__anm_instRule;
        delete cvs.__anm_x; delete cvs.__anm_y;
        delete cvs.__anm_width; delete cvs.__anm_height;
        delete cvs.__anm_usr_x; delete cvs.__anm_usr_y;
        delete cvs.__anm_ref_canvas;
        if (cvs.__anm_genClass && cvs.__anm_instClass) {
            var styles = $DE.__stylesTag.sheet,
                rules = styles.cssRules || styles.rules;
            var to_remove = [];
            for (var i = 0, il = rules.length; i < il; i++) {
                if ((rules[i].selectorText == '.' + cvs.__anm_genClass) ||
                    (rules[i].selectorText == '.' + cvs.__anm_instClass)) {
                    to_remove.push(i); // not to conflict while iterating
                }
            }
            while (to_remove.length) { // remove from the end for safety
                (styles.deleteRule || styles.removeRule).call(styles, to_remove.pop());
            }
        }
        if (cvs.__anm_genClass  && cvs.classList) cvs.classList.remove(cvs.__anm_genClass);
        if (cvs.__anm_instClass && cvs.classList) cvs.classList.remove(cvs.__anm_instClass);
        delete cvs.__anm_genClass; delete cvs.__anm_instClass;
        // delete cvs.__anm_subscribed
    }
    $DE.detachPlayer = function(cvs, player) {
        cvs.removeAttribute(MARKER_ATTR);
        $DE.clearCanvasProps(cvs);
        if (player.controls) {
            $DE.clearCanvasProps(player.controls.canvas);
            if (player.controls.info) $DE.clearCanvasProps(player.controls.info.canvas);
        }
        //FIXME: should remove stylesTag when last player was deleted from page
        //$DE.detachElement(null, $DE.__stylesTag);
        //$DE.__stylesTag = null;
    }
    $DE.getContext = function(cvs, type) {
        return cvs.getContext(type);
    }
    $DE.extractUserOptions = function(cvs) {

        function __boolAttr(val) {
            //if (val === undefined) return undefined;
            if (typeof val === 'undefined') return undefined;
            if (val === null) return null;
            if (val == '0') return false;
            if (val == '1') return true;
            if (val == 'false') return false;
            if (val == 'true') return true;
            if (val == 'off') return false;
            if (val == 'on') return true;
            if (val == 'no') return false;
            if (val == 'yes') return true;
        }

        var ratio = $DE.PX_RATIO;
        var width = cvs.getAttribute('anm-width');
        if (!width) {
            width = cvs.hasAttribute('width') ? (cvs.getAttribute('width') / ratio)
                                              : undefined;
        }
        var height = cvs.getAttribute('anm-height');
        if (!height) {
            height = cvs.hasAttribute('height') ? (cvs.getAttribute('height') / ratio)
                                                : undefined;
        }
        return { 'debug': __boolAttr(cvs.getAttribute('anm-debug')),
                 'mode': cvs.getAttribute('anm-mode'),
                 'repeat': __boolAttr(cvs.getAttribute('anm-repeat')),
                 'zoom': cvs.getAttribute('anm-zoom'),
                 'speed': cvs.getAttribute('anm-speed'),
                 'width': width,
                 'height': height,
                 'autoPlay': __boolAttr(cvs.getAttribute('anm-autoplay') || cvs.getAttribute('anm-auto-play')),
                 'bgColor': cvs.getAttribute('anm-bgcolor') || cvs.getAttribute('anm-bg-color'),
                 'ribbonsColor': cvs.getAttribute('anm-ribbons') || cvs.getAttribute('anm-ribcolor') || cvs.getAttribute('anm-rib-color'),
                 'drawStill': __boolAttr(cvs.getAttribute('anm-draw-still')
                                         || cvs.getAttribute('anm-draw-thumbnail')
                                         || cvs.getAttribute('anm-draw-thumb')),
                 'imagesEnabled': __boolAttr(cvs.getAttribute('anm-images') || cvs.getAttribute('anm-images-enabled')),
                 'shadowsEnabled': __boolAttr(cvs.getAttribute('anm-shadows') || cvs.getAttribute('anm-shadows-enabled')),
                 'audioEnabled': __boolAttr(cvs.getAttribute('anm-audio') || cvs.getAttribute('anm-audio-enabled')),
                 'controlsEnabled': __boolAttr(cvs.getAttribute('anm-controls') || cvs.getAttribute('anm-controls-enabled')),
                 'infoEnabled': __boolAttr(cvs.getAttribute('anm-info') || cvs.getAttribute('anm-info-enabled')),
                 'handleEvents': __boolAttr(cvs.getAttribute('anm-events') || cvs.getAttribute('anm-handle-events')),
                 'infiniteDuration': __boolAttr(cvs.getAttribute('anm-infinite') || cvs.getAttribute('anm-infinite-duration')),
                 'forceSceneSize': __boolAttr(cvs.getAttribute('anm-scene-size') || cvs.getAttribute('anm-force-scene-size')),
                 'inParent': undefined, // TODO: check if we're in tag?
                 'muteErrors': __boolAttr(cvs.getAttribute('anm-mute-errors')),
                 'loadingMode': cvs.getAttribute('anm-loading-mode'),
                 'thumbnail': cvs.getAttribute('anm-thumbnail')
               };
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
    $DE.getCanvasParameters = function(cvs) {
        // if canvas size was not initialized by player, will return null
        if (!cvs.__anm_width || !cvs.__anm_height) return null;
        return [ cvs.__anm_width, cvs.__anm_height, $DE.PX_RATIO ];
    }
    $DE.getCanvasSize = function(cvs) {
        if (cvs.getBoundingClientRect) {
           var rect = cvs.getBoundingClientRect();
           return [ rect.width, rect.height ];
        }
        return [ /* cvs.getAttribute('offsetWidth') || cvs.offsetWidth || */
                 cvs.getAttribute('clientWidth') || cvs.clientWidth,
                 /* cvs.getAttribute('offsetHeight') || cvs.offsetHeight || */
                 cvs.getAttribute('clientHeight') || cvs.clientHeight ];
    }
    $DE.getCanvasPosition = function(cvs) {
        return $DE.findScrollAwarePosition(cvs);
    }
    $DE.getCanvasBounds = function(cvs/*, parent*/) {
        //var parent = parent || cvs.parentNode;
        var params = $DE.getCanvasParameters(cvs);
        if (!params) return null;
        var pos = $DE.getCanvasPosition(cvs);
        // bounds are: left, top, width, height, ratio.
        // I am not sure if I am correct in providing width/height instead of
        // left+width/top+height, but I think it's better to return values
        // not required to sum up/subtract in this case.
        return [ pos[0], pos[1], params[0], params[1], params[2] ];
    }
    $DE.setCanvasSize = function(cvs, width, height, ratio) {
        //$log.debug('request to resize canvas ' + (cvs.id || cvs) + ' to ' + width + ' ' + height);
        var ratio = ratio || $DE.PX_RATIO;
        var _w = width | 0,
            _h = height | 0;
        //$log.debug('resizing ' + (cvs.id || cvs) + ' to ' + _w + ' ' + _h);
        cvs.__anm_ratio = ratio;
        cvs.__anm_width = _w;
        cvs.__anm_height = _h;
        if (!cvs.style.width)  { (cvs.__anm_instRule || cvs).style.width  = _w + 'px'; }
        if (!cvs.style.height) { (cvs.__anm_instRule || cvs).style.height = _h + 'px'; }
        cvs.setAttribute('width', _w * (ratio || 1));
        cvs.setAttribute('height', _h * (ratio || 1));
        $DE._saveCanvasPos(cvs);
        return [ _w, _h ];
    }
    $DE.setCanvasPosition = function(cvs, x, y) {
        cvs.__anm_usr_x = x;
        cvs.__anm_usr_y = y;
        // TODO: actually move canvas
        $DE._saveCanvasPos(cvs);
    }
    $DE.setCanvasBackground = function(cvs, bg) {
        (cvs.__anm_instRule || cvs).style.backgroundColor = bg;
    }
    $DE.updateCanvasMetrics = function(cvs) { // FIXME: not used
        var pos = $DE.getCanvasPosition(cvs),
            size = $DE.getCanvasSize(cvs);
        cvs.__anm_ratio = $DE.PX_RATIO;
        cvs.__anm_x = pos[0];
        cvs.__anm_y = pos[1];
        cvs.__anm_width = size[0];
        cvs.__anm_height = size[1];
        $DE._saveCanvasPos(cvs);
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
    $DE.addCanvasOverlay = function(id, player_cvs, conf, callback) {
        // conf should be: [ x, y, w, h ], all in percentage relative to parent
        // style may contain _class attr
        // if (!parent) throw new Error();
        var holder = player_cvs.__anm_wrapper || player_cvs.parentNode || $doc.body;
        var x = conf[0], y = conf[1],
            w = conf[2], h = conf[3];
        var pconf = $DE.getCanvasSize(player_cvs),
            pw = pconf[0], ph = pconf[1];
        var p_style = $wnd.getComputedStyle ? $wnd.getComputedStyle(player_cvs) : player_cvs.currentStyle;
        var x_shift = parseFloat(p_style.getPropertyValue('border-left-width')),
            y_shift = parseFloat(p_style.getPropertyValue('border-top-width'));
        var new_w = (w * pw),
            new_h = (h * ph);
        var cvs = $doc.createElement('canvas');
        cvs.id = player_cvs.id ? ('__' + player_cvs.id + '_' + id) : ('__anm_' + id);
        if (callback) callback(cvs, player_cvs);
        $DE.setCanvasSize(cvs, new_w, new_h);
        // offset calculation is also only required because of `position: relative` (see `$DE.styling.controlsGeneral`)
        var new_x = x_shift + (x * new_w),
            new_y = y_shift + (y * new_h);
        $DE.moveElementTo(cvs, new_x, new_y);
        // .insertBefore() in combination with .nextSibling works as .insertAfter() simulation
        (holder || $doc.body).insertBefore(cvs, player_cvs.nextSibling);
        cvs.__anm_ref_canvas = player_cvs;
        if (!player_cvs.__anm_overlays) player_cvs.__anm_overlays = [];
        player_cvs.__anm_overlays.push(cvs);
        return cvs;
    }
    $DE.updateCanvasOverlays = function() { }

    // Controls & Info

    $DE.registerAsControlsElement = function(elm, player) {
        var rules = $DE.injectElementStyles(elm,
                                    $DE.CONTROLS_CLASS,
                                    $DE.CONTROLS_INSTANCE_CLASS_PREFIX + (player.id || 'no-id'));
        $DE.styling.controlsGeneral(rules[0]);
        $DE.styling.controlsInstance(rules[1]);
    }
    $DE.registerAsInfoElement = function(elm, player) {
        var rules = $DE.injectElementStyles(elm,
                                    $DE.INFO_CLASS,
                                    $DE.INFO_INSTANCE_CLASS_PREFIX + (player.id || 'no-id'));
        $DE.styling.infoGeneral(rules[0]);
        $DE.styling.infoInstance(rules[1]);
    }

    // Events

    $DE.getEventPosition = function(evt, elm) {
        /*if (elm && (elm.__rOffsetLeft || elm.__rOffsetTop)) return [ evt.pageX - elm.__rOffsetLeft,
                                                                     evt.pageY - elm.__rOffsetTop ];
        else */ if (elm) {
            var shift = $DE.findElementPosition(elm); // $DE.findScrollAwarePosition(elm);
            return [ evt.x - shift[0], evt.y - shift[1] ];
        } else return [ evt.x, evt.y ];
    }
    $DE.subscribeWindowEvents = function(handlers) {
        for (var type in handlers) {
            $wnd.addEventListener(type, handlers[type], false);
        }
    }
    $DE.subscribeCanvasEvents = function(cvs, handlers) {
        for (var type in handlers) {
            cvs.addEventListener(type, handlers[type], false);
        }
    }
    $DE.unsubscribeCanvasEvents = function(cvs, handlers) {
        for (var type in handlers) {
            cvs.removeEventListener(type, handlers[type]);
        }
    }
    $DE.keyEvent = function(e) {
        return { key: ((e.keyCode != null) ? e.keyCode : e.which),
                 ch: e.charCode };
    }
    $DE.mouseEvent = function(e, cvs) {
        return { pos: $DE.getEventPosition(e, cvs) };
    }
    var _kevt = $DE.keyEvent,
        _mevt = $DE.mouseEvent;
    $DE.subscribeSceneToEvents = function(cvs, scene, map) {
        if (cvs.__anm_subscribed &&
            cvs.__anm_subscribed[scene.id]) {
            return;
        }
        //cvs.__anm_subscription_id = guid();
        if (!cvs.__anm_handlers)   cvs.__anm_handlers = {};
        if (!cvs.__anm_subscribed) cvs.__anm_subscribed = {};
        var handlers = cvs.__anm_subscribed[scene.id] || {
          mouseup:   function(evt) { scene.fire(map.mouseup,   _mevt(evt, cvs)); },
          mousedown: function(evt) { scene.fire(map.mousedown, _mevt(evt, cvs)); },
          mousemove: function(evt) { scene.fire(map.mousemove, _mevt(evt, cvs)); },
          mouseover: function(evt) { scene.fire(map.mouseover, _mevt(evt, cvs)); },
          mouseout:  function(evt) { scene.fire(map.mouseout,  _mevt(evt, cvs)); },
          click:     function(evt) { scene.fire(map.click,     _mevt(evt, cvs)); },
          dblclick:  function(evt) { scene.fire(map.dblclick,  _mevt(evt, cvs)); },
          keyup:     function(evt) { scene.fire(map.keyup,     _kevt(evt)); },
          keydown:   function(evt) { scene.fire(map.keydown,   _kevt(evt)); },
          keypress:  function(evt) { scene.fire(map.keypress,  _kevt(evt)); }
        };
        cvs.__anm_handlers[scene.id] = handlers;
        cvs.__anm_subscribed[scene.id] = true;
        $DE.subscribeCanvasEvents(cvs, handlers);
    }
    $DE.unsubscribeSceneFromEvents = function(cvs, scene) {
        if (!cvs.__anm_handlers   ||
            !cvs.__anm_subscribed ||
            !cvs.__anm_subscribed[scene.id]) return;
        var handlers = cvs.__anm_handlers[scene.id];
        if (!handlers) return;
        $DE.unsubscribeCanvasEvents(cvs, handlers);
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
