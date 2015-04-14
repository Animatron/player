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

var $doc = window.document;
    // DomEngine constants

var MARKER_ATTR = 'anm-player', // marks player existence on canvas element
    AUTO_MARKER_ATTR = 'anm-player-target', // marks that this element is a target for a player
    URL_ATTR = 'anm-url',
    SNAPSHOT_URL_ATTR = 'anm-src',
    IMPORTER_ATTR = 'anm-importer';

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
// onDocReady(callback) -> none

// ensureGlobalStylesInjected() -> none
// injectElementStyles(elm, general_class, instance_class) -> [ general_rule, instance_rule ];

// createTextMeasurer() -> function(text) -> [ width, height ]

// getElementById(id) -> Element
// findElementPosition(element) -> [ x, y ]
// findScrollAwarePosition(eelementlm) -> [ x, y ]
// // getElementBounds(element) -> [ x, y, width, height, ratio ]
// moveElementTo(element, x, y) -> none
// disposeElement(element) -> none
// detachElement(parent | null, child) -> none
// showElement(element) -> none
// hideElement(element) -> none
// clearChildren(element) -> none

// assignPlayerToWrapper(wrapper, player, backup_id) -> { wrapper, canvas, id }
// hasUrlToLoad(element) -> { url, importer_id }
// extractUserOptions(element) -> options: object | {}
// registerAsControlsElement(element, player) -> none
// registerAsInfoElement(element, player) -> none
// detachPlayer(player) -> none
// playerAttachedTo(element, player) -> true | false
// findPotentialPlayers() -> [ element ]

// hasAnmProps(element) -> object | null
// getAnmProps(element) -> object
// clearAnmProps(element) -> none

// createCanvas(width, height, bg?, ratio?) -> canvas
// getContext(canvas, type) -> context
// checkPlayerCanvas(canvas) -> true | false
// setTabIndex(canvas) -> none
// getCanvasSize(canvas) -> [ width, height ]
// getCanvasPosition(canvas) -> [ x, y ]
// getCanvasParameters(canvas) -> [ width, height, ratio ]
// getCanvasBounds(canvas) -> [ x, y, width, height, ratio ]
// setCanvasSize(canvas, width, height, ratio?) -> none
// setCanvasPosisition(canvas, x, y) -> none
// setCanvasBackground(canvas, value) -> none
// addCanvasOverlay(id, parent: canvas, conf: [x, y, w, h], callback: function(canvas)) -> canvas
// updateCanvasOverlays(canvas) -> none
// updateOverlay(parent, overlay, props?) -> none

// getEventPosition(event, element?) -> [ x, y ]
// subscribeWindowEvents(handlers: object) -> none
// subscribeCanvasEvents(canvas, handlers: object) -> none
// unsubscribeCanvasEvents(canvas, handlers: object) -> none
// subscribeAnimationToEvents(canvas, anim, map) -> none
// unsubscribeAnimationFromEvents(canvas, anim) -> none
// subscribeWrapperToStateChanges(wrapper, player) -> none

// keyEvent(evt) -> Event
// mouseEvent(evt, canvas) -> Event//
// preventDefault(evt) -> none

// createStyle() -> Element
// createStatImg() -> Image

// canvasSupported -> bool

// Framing
// shim adopted from https://gist.github.com/paulirish/1579671
var requestAnimationFrame = global.requestAnimationFrame,
    cancelAnimationFrame = global.cancelAnimationFrame;
var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x) {
        requestAnimationFrame = global[vendors[x]+'RequestAnimationFrame'];
        cancelAnimationFrame = global[vendors[x]+'CancelAnimationFrame'] ||
                                   global[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!requestAnimationFrame) {
        requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!cancelAnimationFrame) {
        cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

$DE.getRequestFrameFunc = function(){ return requestAnimationFrame; };
$DE.getCancelFrameFunc = function(){ return cancelAnimationFrame; };

// Global things

$DE.PX_RATIO = window.devicePixelRatio || 1;

$DE.ajax = function(url, callback, errback, method, headers) {
    var req;
    if (isIE9) {
        req = new window.XDomainRequest();
    } else {
        req = new window.XMLHttpRequest();
    }

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
    if (isIE9) {
        req.onload = function(){ callback(req); };
        req.onerror = function() {
            if(errback) errback(new Error('XDomainRequest Error'), req);
        };
    }
    req.open(method || 'GET', url, true);

    if (headers && !isIE9) {
        for (var header in headers) {
            req.setRequestHeader(header, headers[header]);
        }
    }

    req.send(null);
};

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
};

$DE.onDocReady = function(callback) {
    //check if the document isn't already ready (sorry for the wording)
    if ($doc.readyState === 'complete') {
      callback();
      return;
    }
    var listener;
    if ($doc.addEventListener) {
        listener = $doc.addEventListener('DOMContentLoaded', function() {
            $doc.removeEventListener('DOMContentLoaded', listener, false);
            callback();
        }, false);
    } else if ($doc.attachEvent) {
        listener = function() {
            if ($doc.readyState === 'complete') {
                $doc.detachEvent('onreadystatechange', listener);
                callback();
            }
        };
        $doc.attachEvent('onreadystatechange', listener);
    }
};


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
    infoInstance: function(rule, desc) { }
};

$DE.ensureGlobalStylesInjected = function() {
    if ($DE.__stylesTag) return;
    //if (!($doc.readyState === "complete")) return;
    var stylesTag = $DE.createStyle();

    // TODO: inject as first element?
    var head = $doc.getElementsByTagName("head")[0];
    if (!head) throw new Error('anm.Player requires <head> tag to exist in the document to inject CSS there');
    head.appendChild(stylesTag);
    // TODO: inject as first element?
    // var head = $doc.getElementsByTagName("head")[0];
    // head.insertBefore(stylesTag, head.firstChild);

    $DE.__stylesTag = stylesTag;
};

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
    var props = $DE.getAnmProps(elm);
    props.gen_class  = general_class;
    props.inst_class = instance_class;
    var general_rule_idx  = (styles.insertRule || styles.addRule).call(styles, '.' +general_class + '{}', rules.length),
        instance_rule_idx = (styles.insertRule || styles.addRule).call(styles, '.' +instance_class + '{}', rules.length);
    var elm_rules = [ rules[general_rule_idx],
                      rules[instance_rule_idx] ];
    props.gen_rule  = elm_rules[0];
    props.inst_rule = elm_rules[1];
    return elm_rules;
};

$DE.__textBuf = null;
$DE.createTextMeasurer = function() {
    var buff = $DE.__textBuf;
    if (!buff) {
        /* FIXME: dispose buffer when text is removed from animation */
        $DE.onDocReady(function(){
          var div = $doc.createElement('div');
          var span = $doc.createElement('span');
          div.style.visibility = 'hidden';
          div.style.position = 'absolute';
          div.style.top = -10000 + 'px';
          div.style.left = -10000 + 'px';
          div.appendChild(span);
          $doc.body.appendChild(div);
          $DE.__textBuf = span;
          buff = $DE.__textBuf;
        });

    }
    return function(text, lines_arg) {
        var has_arg = (typeof lines_arg !== 'undefined');
        var lines = has_arg ? lines_arg : text.lines;
        buff.style.font = text.$font;
        //buff.style.textAlign = text.align;
        //buff.style.verticalAlign = text.baseline || 'bottom';
        buff.style.whiteSpace = 'pre';
        if (Array.isArray(text.lines)) { // FIXME: replace with anm.is.arr()
            var maxWidth = 0, height = 0;
            for (var i = 0, ilen = lines.length; i < ilen; i++) {
                buff.textContent = lines[i] || " ";
                maxWidth = Math.max(buff.offsetWidth, maxWidth);
                height += buff.offsetHeight;
            }
            return [ maxWidth, height ];
        } else {
            buff.textContent = text.lines.toString() || "";
            return [ buff.offsetWidth,
                     buff.offsetHeight ];
        }
        // TODO: test if lines were changed, and if not,
        //       use cached value

    };
};

// Elements

$DE.getElementById = function(id) {
    return $doc.getElementById(id);
};
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
    } while ((elm = elm.offsetParent));
    return [ curleft, curtop ];
};

$DE.findScrollAwarePosition = function(elm) {
    var curleft = 0,
        curtop = 0;

    if (elm.getBoundingClientRect) {
        var rect = elm.getBoundingClientRect();
        do {
            curleft += ((elm !== $doc.body) ?
                        elm.scrollLeft
                        : $doc.documentElement.scrollLeft);
            curtop += ((elm !== $doc.body) ?
                        elm.scrollTop
                        : $doc.documentElement.scrollTop);
        } while ((elm = elm.offsetParent));
        return [ rect.left - curleft, rect.top - curtop ];
    }
    //var bound = elm.getBoundingClientRect();
    //return [ bound.left, bound.top ];
    do {
        curleft += elm.offsetLeft - ((elm !== $doc.body) ?
                                     elm.scrollLeft
                                     : $doc.documentElement.scrollLeft);
        curtop += elm.offsetTop - ((elm !== $doc.body) ?
                                     elm.scrollTop
                                     : $doc.documentElement.scrollTop);
    } while ((elm = elm.offsetParent));
    return [ curleft, curtop ];
};
/*$DE.getElementBounds = function(elm) {
    var rect = elm.getBoundingClientRect();
    return [ rect.left, rect.top, rect.width, rect.height, $DE.PX_RATIO ];
}*/
$DE.moveElementTo = function(elm, x, y) {
    var props = $DE.hasAnmProps(elm);
    ((props && props.inst_rule) || elm).style.left = (x === 0) ? '0' : (x + 'px');
    ((props && props.inst_rule) || elm).style.top  = (y === 0) ? '0' : (y + 'px');
};

$DE.__trashBin = null;
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
};

$DE.detachElement = function(parent, child) {
    (parent || child.parentNode).removeChild(child);
};

$DE.showElement = function(elm) {
    var props = $DE.hasAnmProps(elm);
    ((props && props.inst_rule) || elm).style.visibility = 'visible';
};

$DE.hideElement = function(elm) {
    var props = $DE.hasAnmProps(elm);
    ((props && props.inst_rule) || elm).style.visibility = 'hidden';
};

$DE.clearChildren = function(elm) {
    // much faster than innerHTML = '';
    while (elm.firstChild) { elm.removeChild(elm.firstChild); }
};

// Creating & Modifying Canvas

$DE.createCanvas = function(width, height, bg, ratio) {
    var cvs = $doc.createElement('canvas');
    $DE.setCanvasSize(cvs, width, height, ratio);
    if (bg) $DE.setCanvasBackground(cvs, bg);
    return cvs;
};

$DE.assignPlayerToWrapper = function(wrapper, player, backup_id) {
    if (!wrapper) throw new Error('Element passed to anm.Player initializer does not exists.');

    if (anm.utils.is.str(wrapper)) {
        wrapper = $doc.getElementById(wrapper);
    }

    var canvasWasPassed = (wrapper.tagName == 'canvas') || (wrapper.tagName == 'CANVAS');
    if (canvasWasPassed && window.console) {
        console.warn('NB: A <canvas> tag was passed to the anm.Player as an element to attach to. This is ' +
                     'not a recommended way since version 1.2; this <canvas> will be moved inside ' +
                     'a <div>-wrapper because of it, so it may break document flow and/or CSS styles. ' +
                     'Please pass any container such as <div> to a Player instead of <canvas> to fix it.');
    }

    var state_before = wrapper.cloneNode(false);

    var canvas = canvasWasPassed ? wrapper : $doc.createElement('canvas');
    wrapper = canvasWasPassed ? $doc.createElement('div') : wrapper;

    if (wrapper.getAttribute(MARKER_ATTR)) throw new Error('Player is already attached to element \'' + (wrapper.id || canvas.id) + '\'.');
    wrapper.setAttribute(MARKER_ATTR, true);
    if (wrapper.hasAttribute(AUTO_MARKER_ATTR)) wrapper.removeAttribute(AUTO_MARKER_ATTR);
    if (canvas.hasAttribute(AUTO_MARKER_ATTR))  canvas.removeAttribute(AUTO_MARKER_ATTR);

    var prev_cvs_id = canvas.id;
    canvas.id = ''; // to ensure no elements will have the same ID in DOM after the execution of next line
    if (!wrapper.id) wrapper.id = prev_cvs_id;
    canvas.id = wrapper.id + '-cvs';
    var props = $DE.getAnmProps(canvas);
    props.wrapper = wrapper;
    props.was_before = state_before;

    var id = wrapper.id; // the "main" id

    props.id = id;

    if (canvasWasPassed) {
        var parent = canvas.parentNode || $doc.body;
        if (parent) {
            parent.replaceChild(wrapper, canvas);
            wrapper.appendChild(canvas);
        } else throw new Error('Provided canvas tag has no parent');
    } else {
        wrapper.appendChild(canvas);
    }

    $DE.ensureGlobalStylesInjected();

    var wrapper_rules = $DE.injectElementStyles(wrapper,
                                                $DE.WRAPPER_CLASS,
                                                $DE.WRAPPER_INSTANCE_CLASS_PREFIX + (id || 'no-id'));
    var cvs_rules = $DE.injectElementStyles(canvas,
                                            $DE.PLAYER_CLASS,
                                            $DE.PLAYER_INSTANCE_CLASS_PREFIX + (id || 'no-id'));

    $DE.styling.playerGeneral(cvs_rules[0]);
    $DE.styling.playerInstance(cvs_rules[1]);
    $DE.styling.wrapperGeneral(wrapper_rules[0]);
    $DE.styling.wrapperInstance(wrapper_rules[1]);

    $DE.subscribeWrapperToStateChanges(wrapper, player);

    return { wrapper: wrapper,
             canvas: canvas,
             id: id };
};

$DE.playerAttachedTo = function(elm, player) {
    if ($DE.hasAnmProps(elm)) {
        var props = $DE.getAnmProps(elm);
        if (props.wrapper) return props.wrapper.hasAttribute(MARKER_ATTR);
    }
    return elm.hasAttribute(MARKER_ATTR);
};

$DE.findPotentialPlayers = function() {
    return $doc.querySelectorAll('[' + AUTO_MARKER_ATTR + ']');
};

$DE.hasAnmProps = function(elm) {
    return elm.__anm;
};

$DE.getAnmProps = function(elm) {
    if (!elm.__anm) elm.__anm = {};
    return elm.__anm;
};

$DE.clearAnmProps = function(elm) {
    if (!elm || !elm.__anm) return;
    var __anm = elm.__anm;
    if (__anm.gen_class && __anm.inst_class) {
        var styles = $DE.__stylesTag.sheet,
            rules = styles.cssRules || styles.rules;
        var to_remove = [];
        for (var i = 0, il = rules.length; i < il; i++) {
            if ((rules[i].selectorText == '.' + __anm.gen_class) ||
                (rules[i].selectorText == '.' + __anm.inst_class)) {
                to_remove.push(i); // not to conflict while iterating
            }
        }
        while (to_remove.length) { // remove from the end for safety
            (styles.deleteRule || styles.removeRule).call(styles, to_remove.pop());
        }
    }
    if (__anm.gen_class  && elm.classList) elm.classList.remove(__anm.gen_class);
    if (__anm.inst_class && elm.classList) elm.classList.remove(__anm.inst_class);
    delete elm.__anm;
};

$DE.detachPlayer = function(player) {
    var canvas = player.canvas,
        wrapper = player.wrapper;
    if (wrapper) wrapper.removeAttribute(MARKER_ATTR);
    var parent_node = wrapper.parentNode || $doc.body,
        next_node = wrapper.nextSibling;
    var props = $DE.getAnmProps(canvas);
    $DE.clearChildren(wrapper);
    if (props.was_before) {
        parent_node.removeChild(wrapper);
        parent_node.insertBefore(props.was_before, next_node);
    }
    $DE.clearAnmProps(wrapper);
    $DE.clearAnmProps(canvas);
    if (player.controls) {
        $DE.clearAnmProps(player.controls.canvas);
        if (player.controls.info) $DE.clearAnmProps(player.controls.info.canvas);
    }

    if (player.statImg) {
      $DE.detachElement(null, player.statImg);
    }
    //FIXME: should remove stylesTag when last player was deleted from page
    //$DE.detachElement(null, $DE.__stylesTag);
    //$DE.__stylesTag = null;
};

$DE.getContext = function(cvs, type) {
    return cvs.getContext(type);
};

$DE.extractUserOptions = function(elm) {

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
    var width = elm.getAttribute('anm-width');
    if (!width) {
        width = elm.hasAttribute('width') ? (elm.getAttribute('width') / ratio)
                                          : undefined;
    }
    var height = elm.getAttribute('anm-height');
    if (!height) {
        height = elm.hasAttribute('height') ? (elm.getAttribute('height') / ratio)
                                            : undefined;
    }
    return { 'debug': __boolAttr(elm.getAttribute('anm-debug')),
             'mode': elm.getAttribute('anm-mode'),
             'repeat': __boolAttr(elm.getAttribute('anm-repeat')),
             'zoom': elm.getAttribute('anm-zoom'),
             'speed': elm.getAttribute('anm-speed'),
             'width': width,
             'height': height,
             'autoPlay': __boolAttr(elm.getAttribute('anm-autoplay') || elm.getAttribute('anm-auto-play')),
             'bgColor': elm.getAttribute('anm-bgcolor') || elm.getAttribute('anm-bg-color'),
             'ribbonsColor': elm.getAttribute('anm-ribbons') || elm.getAttribute('anm-ribcolor') || elm.getAttribute('anm-rib-color'),
             'drawStill': __boolAttr(elm.getAttribute('anm-draw-still') ||
                              elm.getAttribute('anm-draw-thumbnail') ||
                              elm.getAttribute('anm-draw-thumb')),
             'imagesEnabled': __boolAttr(elm.getAttribute('anm-images') || elm.getAttribute('anm-images-enabled')),
             'shadowsEnabled': __boolAttr(elm.getAttribute('anm-shadows') || elm.getAttribute('anm-shadows-enabled')),
             'audioEnabled': __boolAttr(elm.getAttribute('anm-audio') || elm.getAttribute('anm-audio-enabled')),
             'controlsEnabled': __boolAttr(elm.getAttribute('anm-controls') || elm.getAttribute('anm-controls-enabled')),
             'infoEnabled': __boolAttr(elm.getAttribute('anm-info') || elm.getAttribute('anm-info-enabled')),
             'handleEvents': __boolAttr(elm.getAttribute('anm-events') || elm.getAttribute('anm-handle-events')),
             'infiniteDuration': __boolAttr(elm.getAttribute('anm-infinite') || elm.getAttribute('anm-infinite-duration')),
             'forceSceneSize': __boolAttr(elm.getAttribute('anm-scene-size') || elm.getAttribute('anm-force-scene-size')),
             'inParent': undefined, // TODO: check if we're in tag?
             'muteErrors': __boolAttr(elm.getAttribute('anm-mute-errors')),
             'loadingMode': elm.getAttribute('anm-loading-mode'),
             'thumbnail': elm.getAttribute('anm-thumbnail')
           };
};

$DE.checkPlayerCanvas = function(cvs) {
    return true;
};

$DE.hasUrlToLoad = function(elm) {
    return {
        url: elm.getAttribute(URL_ATTR) || elm.getAttribute(SNAPSHOT_URL_ATTR),
        importer_id: elm.getAttribute(IMPORTER_ATTR)
    };
};

$DE.setTabIndex = function(cvs, idx) {
    cvs.setAttribute('tabindex', idx);
};

$DE.getCanvasParameters = function(cvs) {
    // if canvas size was not initialized by player, will return null
    if (!$DE.hasAnmProps(cvs)) return null;
    var props = $DE.getAnmProps(cvs);
    if (!props.width || !props.height) return null;
    return [ props.width, props.height, $DE.PX_RATIO ];
};

$DE.getCanvasSize = function(cvs) {
    if (cvs.getBoundingClientRect) {
       var rect = cvs.getBoundingClientRect();
       return [ rect.width, rect.height ];
    }
    return [ /* cvs.getAttribute('offsetWidth') || cvs.offsetWidth || */
             cvs.getAttribute('clientWidth') || cvs.clientWidth,
             /* cvs.getAttribute('offsetHeight') || cvs.offsetHeight || */
             cvs.getAttribute('clientHeight') || cvs.clientHeight ];
};

$DE.getCanvasPosition = function(cvs) {
    return $DE.findScrollAwarePosition(cvs);
};

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
};

$DE.setCanvasSize = function(cvs, width, height, ratio) {
    //$log.debug('request to resize canvas ' + (cvs.id || cvs) + ' to ' + width + ' ' + height);
    ratio = ratio || $DE.PX_RATIO;
    var _w = width | 0, // to int
        _h = height | 0; // to int
    //$log.debug('resizing ' + (cvs.id || cvs) + ' to ' + _w + ' ' + _h);
    var props = $DE.getAnmProps(cvs);
    props.ratio = ratio;
    props.width = _w;
    props.height = _h;
    if (!cvs.style.width) { (props.inst_rule || cvs).style.width  = _w + 'px'; }
    if (!cvs.style.height) { (props.inst_rule || cvs).style.height = _h + 'px'; }
    cvs.setAttribute('width', _w * (ratio || 1));
    cvs.setAttribute('height', _h * (ratio || 1));
    $DE._saveCanvasPos(cvs);
    return [ _w, _h ];
};

$DE.setCanvasPosition = function(cvs, x, y) {
    var props = $DE.getAnmProps(cvs);
    props.usr_x = x;
    props.usr_y = y;
    // TODO: actually move canvas
    $DE._saveCanvasPos(cvs);
};

$DE.setCanvasBackground = function(cvs, bg) {
    ($DE.getAnmProps(cvs).inst_rule || cvs).style.backgroundColor = bg;
};

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
        } while ((elm = elm.offsetParent));
    }

    ol += cpl + cbl + htol;
    ot += cpt + cbt + htot;

    /* FIXME: find a method with no injection of custom properties
              (data-xxx attributes are stored as strings and may work
               a bit slower for events) */
    // FIXME: NOT USED ANYMORE
    var props = $DE.getAnmProps(cvs);
    props.offset_left = ol || props.usr_x;
    props.offset_top  = ot || props.usr_y;
};

$DE.addCanvasOverlay = function(id, player_cvs, conf, callback) {
    // conf should be: [ x, y, w, h ], all in percentage relative to parent
    // style may contain _class attr
    // if (!parent) throw new Error();
    var p_props = $DE.getAnmProps(player_cvs);
    var holder = p_props.wrapper || player_cvs.parentNode || $doc.body;
    var x = conf[0], y = conf[1],
        w = conf[2], h = conf[3];
    var pconf = $DE.getCanvasSize(player_cvs),
        pw = pconf[0], ph = pconf[1];
    var p_style = window.getComputedStyle ? window.getComputedStyle(player_cvs) : player_cvs.currentStyle;
    var x_shift = parseFloat(p_style.getPropertyValue('border-left-width')),
        y_shift = parseFloat(p_style.getPropertyValue('border-top-width'));
    var new_w = (w * pw),
        new_h = (h * ph);
    var cvs = $doc.createElement('canvas');
    cvs.id = (p_props.id) ? ('__' + p_props.id + '_' + id) : ('__anm_' + id);
    var props = $DE.getAnmProps(cvs);
    if (callback) callback(cvs, player_cvs);
    $DE.setCanvasSize(cvs, new_w, new_h);
    var new_x = (x * new_w) + x_shift,
        new_y = (y * new_h) - y_shift;
    $DE.moveElementTo(cvs, new_x, new_y);
    // .insertBefore() in combination with .nextSibling works as .insertAfter() simulation
    (holder || $doc.body).insertBefore(cvs, player_cvs.nextSibling);
    props.ref_canvas = player_cvs;
    if (!p_props.overlays) p_props.overlays = [];
    p_props.overlays.push(cvs);
    return cvs;
};

$DE.updateCanvasOverlays = function(player_cvs) {
    var p_props = $DE.getAnmProps(player_cvs);
    var overlays = p_props.overlays;
    if (overlays) { for (var i = 0, il = overlays.length; i < il; i++) {
        $DE.updateOverlay(player_cvs, overlays[i], p_props);
    } }
};

$DE.updateOverlay = function(player_cvs, overlay, p_props) {
    p_props = p_props || $DE.getAnmProps(player_cvs);
    $DE.setCanvasSize(overlay, p_props.width, p_props.height);
};

// Controls & Info

$DE.registerAsControlsElement = function(elm, player) {
    var rules = $DE.injectElementStyles(elm,
                                $DE.CONTROLS_CLASS,
                                $DE.CONTROLS_INSTANCE_CLASS_PREFIX + (player.id || 'no-id'));
    $DE.styling.controlsGeneral(rules[0]);
    $DE.styling.controlsInstance(rules[1]);
};

$DE.registerAsInfoElement = function(elm, player) {
    var rules = $DE.injectElementStyles(elm,
                                $DE.INFO_CLASS,
                                $DE.INFO_INSTANCE_CLASS_PREFIX + (player.id || 'no-id'));
    $DE.styling.infoGeneral(rules[0]);
    $DE.styling.infoInstance(rules[1]);
};

// Events

$DE.getEventPosition = function(evt, elm) {
    if (elm) {
        var shift = $DE.findElementPosition(elm); // $DE.findScrollAwarePosition(elm);
        return { x: evt.clientX - shift[0], y: evt.clientY - shift[1] };
    } else return { x: evt.x, y: evt.y };
};

$DE.subscribeElementEvents = function(elm, handlers) {
    for (var type in handlers) {
        elm.addEventListener(type, handlers[type], false);
    }
}

$DE.unsubscribeElementEvents = function(elm, handlers) {
    for (var type in handlers) {
        elm.removeEventListener(type, handlers[type], false);
    }
}

$DE.subscribeWindowEvents = function(handlers) {
    $DE.subscribeElementEvents(window, handlers);
};

$DE.subscribeCanvasEvents = $DE.subscribeElementEvents;
$DE.unsubscribeCanvasEvents = $DE.unsubscribeElementEvents;

$DE.keyEvent = function(e) {
    return { key: ((e.keyCode !== null) ? e.keyCode : e.which),
             ch: e.charCode };
};

$DE.mouseEvent = function(e, cvs) {
    return { pos: $DE.getEventPosition(e, cvs) };
};

$DE.preventDefault = function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
};

var _kevt = $DE.keyEvent,
    _mevt = $DE.mouseEvent;
$DE.subscribeAnimationToEvents = function(cvs, anim, map) {
    if (cvs.__anm.subscribed &&
        cvs.__anm.subscribed[anim.id]) {
        return;
    }
    //cvs.__anm_subscription_id = guid();
    if (!cvs.__anm.handlers)   cvs.__anm.handlers = {};
    if (!cvs.__anm.subscribed) cvs.__anm.subscribed = {};
    var handlers = cvs.__anm.subscribed[anim.id] || {
        click:     function(evt) { anim.fire(map.click,     _mevt(evt, cvs)); },
        dblclick:  function(evt) { anim.fire(map.dblclick,  _mevt(evt, cvs)); },
        mouseup:   function(evt) { anim.fire(map.mouseup,   _mevt(evt, cvs)); },
        mousedown: function(evt) { anim.fire(map.mousedown, _mevt(evt, cvs)); },
        mousemove: function(evt) { anim.fire(map.mousemove, _mevt(evt, cvs)); },
        keypress:  function(evt) { anim.fire(map.keypress,  _kevt(evt)); },
        keyup:     function(evt) { anim.fire(map.keyup,     _kevt(evt)); },
        keydown:   function(evt) { anim.fire(map.keydown,   _kevt(evt)); }
    };
    cvs.__anm.handlers[anim.id] = handlers;
    cvs.__anm.subscribed[anim.id] = true;
    $DE.subscribeCanvasEvents(cvs, handlers);
};

$DE.unsubscribeAnimationFromEvents = function(cvs, anim) {
    if (!cvs.__anm.handlers   ||
        !cvs.__anm.subscribed ||
        !cvs.__anm.subscribed[anim.id]) return;
    var handlers = cvs.__anm.handlers[anim.id];
    if (!handlers) return;
    $DE.unsubscribeCanvasEvents(cvs, handlers);
};

$DE.subscribeWrapperToStateChanges = function(wrapper, player) {
    if (!wrapper.classList) return;
    var C = anm.constants;
    player.on(C.S_CHANGE_STATE, function(new_state) {
        var css_classes = [];
        switch (new_state) {
            case C.NOTHING: css_classes = ['anm-state-nothing']; break;
            case C.STOPPED: css_classes = ['anm-state-stopped']; break;
            case C.PLAYING: css_classes = ['anm-state-playing']; break;
            case C.PAUSED:  css_classes = ['anm-state-paused']; break;
            case C.LOADING: css_classes = ['anm-state-loading']; break;
            case C.RES_LOADING: css_classes = ['anm-state-loading', 'anm-state-resources-loading']; break;
            case C.ERROR:   css_classes = ['anm-state-error']; break;
        }
        if (css_classes.length) {
            var classList = wrapper.classList, i, il;
            if (player.__prev_classes && player.__prev_classes.length) {
                var prev_classes = player.__prev_classes;
                for (i = 0, il = prev_classes.length; i < il; i++) {
                    classList.remove(prev_classes[i]);
                }
            } else {
                if (classList.contains('anm-state-nothing')) {
                    classList.remove('anm-state-nothing');
                }
            }
            for (i = 0, il = css_classes.length; i < il; i++) {
                classList.add(css_classes[i]);
            }
            player.__prev_classes = css_classes;
        }
    });
};

$DE.createStatImg = function() {
    var img = $doc.createElement('img');
    img.style.position = 'absolute';
    img.style.top = '-9999px';
    img.style.left = '-9999px';
    img.style.visibility = 'hidden';

    $doc.body.appendChild(img);

    return img;
};

$DE.createStyle = function() {
    var style = document.createElement('style');
    style.type = 'text/css';
    return style;
};

$DE.createAudio = function() {
    return document.createElement('audio');
};

$DE.createVideo = function() {
    return document.createElement('video');
};

$DE.createSource = function() {
    return document.createElement('source');
};

$DE.appendToBody = function(element) {
    document.body.appendChild(element);
};

var testCanvas = document.createElement('canvas');
$DE.canvasSupported = !!(testCanvas.getContext && testCanvas.getContext('2d'));

var https = window.location && window.location.protocol === 'https:';
$DE.isHttps = https;

var local = window.location && window.location.protocol === 'file:';
$DE.isLocal = local;

var isIE9 = navigator.userAgent.indexOf('MSIE 9.0') !== -1;
$DE.isIE9 = isIE9;

var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
  hidden = "mozHidden";
  visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

if (typeof document[hidden] !== 'undefined' ||
    typeof document.addEventListener !== 'undefined') {
        document.addEventListener(visibilityChange,
            function() {
                if (onDocumentHiddenChange) {
                    onDocumentHiddenChange(document[hidden]);
                }
            }, false);
}
var onDocumentHiddenChange = null;
$DE.onDocumentHiddenChange = function(cb){
    onDocumentHiddenChange = cb;
};

$DE.Path2D = global.Path2D;


$DE.isInIframe = function() {
    return global.self !== global.top;
};

var iframe = $DE.isInIframe() ? global : null;

var origin = iframe ? iframe.document.referrer.split('/', 3).join('/') : "*";

$DE.getIframeOrigin = function() {
    return origin;
};

$DE.getIframeSrc = function() {
    if (!iframe) {
        return null;
    }
    return iframe.location.href;
};

$DE.addMessageListener = function(listener) {
    if (!global.addEventListener) {
        return;
    }
    global.addEventListener('message', listener, false);
};

$DE.postToContentWindow = function(message) {
    if (!iframe) {
        return;
    }
    iframe.top.postMessage(JSON.stringify(message), origin);
};

module.exports = $DE;
return $DE;
