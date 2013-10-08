/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// Player Core
// =============================================================================

// This file contains only the Animatron Player core source code, without _Builder_ or any _modules_
// included. The player is written with as minimum publicily-visible classes as possible, but
// its internal structure hides more things, of course. Code in the file goes in
// natural order, mostly from general things to internal ones. However, to make
// code work properly it is not always possible to keep this principle.
//
// Here I'll give the actual order of things with few notes on each thing to make you have a good _view
// from above_.
//
// - **Utils** —
// - **Constants** —
// - **Modules** —
// - **Player** —
//     - _Player Control API_ —
// - **Scene** —
// - **Element** —
// - **Import** —
// - **Rendering** —
// - **Bands** —
// - **Tweens** —
// - **Easings** —
// - **Path** —
//     - _Segments_ —
// - **Text** —
// - **Sheet** -
// - **Brush** -
// - **Controls** —
// - **Info Block** —
// - **Strings** —
// - **Exports** —
//
// > While doing future refactorings, I may change this order a bit accidently or rename some sections and
// > forget to update this list (blame me), so please do not consider it to be the very strict
// > and representing something more than a general feel of file.
//
// > NB: Comments are in very early progress

// So, let's start

// Module Definition
// -----------------------------------------------------------------------------

(((typeof __anm !== 'undefined') && __anm.registerPlayer) || function() {
    throw new Error('Player namespace is not initialized');
})(function($glob, $wnd, $doc) {

// Utils
// -----------------------------------------------------------------------------

// ### Framing
/* ----------- */

/* http://www.html5canvastutorials.com/advanced/html5-canvas-start-and-stop-an-animation/
   http://www.w3.org/TR/animation-timing/
   https://gist.github.com/1579671 */

var __frameFunc = function() {
           return $wnd.requestAnimationFrame ||
                  $wnd.webkitRequestAnimationFrame ||
                  $wnd.mozRequestAnimationFrame ||
                  $wnd.oRequestAnimationFrame ||
                  $wnd.msRequestAnimationFrame ||
                  $wnd.__anm__frameGen ||
                  function(callback){
                    return $wnd.setTimeout(callback, 1000 / 60);
                  } };

var __clearFrameFunc = function() {
           return $wnd.cancelAnimationFrame ||
                  $wnd.webkitCancelAnimationFrame ||
                  $wnd.mozCancelAnimationFrame ||
                  $wnd.oCancelAnimationFrame ||
                  $wnd.msCancelAnimationFrame ||
                  $wnd.__anm__frameRem ||
                  function(id){
                    return $wnd.clearTimeout(id);
                  } };

// assigns to call a function on next animation frame
var __nextFrame;

// stops the animation
/* FIXME: remove, not used, __supressFrames is used */
var __stopAnim = function(requestId) {
    __clearFrameFunc()(requestId);
};

// ### Events
/* ---------- */

var provideEvents = __anm.provideEvents;
var registerEvent = __anm.registerEvent;

// ### Errors
/* ---------- */

var SystemError = __errorAs('SystemError');
var SysErr = SystemError;

var PlayerError = __errorAs('PlayerError');
var PlayerErr = PlayerError;

var AnimationError = __errorAs('AnimationError');
var AnimErr = AnimationError;

// ### Internal utilities
/* ---------------------- */

// collects all characters from string
// before specified char, starting from start
function __collect_to(str, start, ch) {
    var result = '';
    for (var i = start; str[i] !== ch; i++) {
        if (i === str.length) throw new SysErr('Reached end of string');
        result += str[i];
    }
    return result;
}

function guid() {
   return Math.random().toString(36).substring(2, 10) +
          Math.random().toString(36).substring(2, 10);
}
/*function _strhash() {
  var hash = 0;
  if (this.length == 0) return hash;
  for (i = 0; i < this.length; i++) {
    char = this.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}*/

function get_rgb(hex) {
  if (!hex || !hex.length) return [0, 0, 0];
  var _hex = hex.substring(1);
  if (_hex.length === 3) {
    _hex = _hex[0] + _hex[0] +
           _hex[1] + _hex[1] +
           _hex[2] + _hex[2];
  }
  var bigint = parseInt(_hex, 16);
  return [ (bigint >> 16) & 255,
           (bigint >> 8) & 255,
           bigint & 255 ];
}

function to_rgba(r, g, b, a) {
  return "rgba(" + Math.floor(r) + "," +
                   Math.floor(g) + "," +
                   Math.floor(b) + "," +
                   ((typeof a !== 'undefined')
                          ? a : 1) + ")";
}

function fmt_time(time) {
  var _time = Math.abs(time),
        _h = Math.floor(_time / 3600),
        _m = Math.floor((_time - (_h * 3600)) / 60),
        _s = Math.floor(_time - (_h * 3600) - (_m * 60));

  return ((time < 0) ? '-' : '') +
          ((_h > 0)  ? (((_h < 10) ? ('0' + _h) : _h) + ':') : '') +
          ((_m < 10) ? ('0' + _m) : _m) + ':' +
          ((_s < 10) ? ('0' + _s) : _s)
}

function ell_text(text, max_len) {
  if (!text) return '';
  var _len = text.length;
  if (_len <= max_len) return text;
  var _semilen = Math.floor(_len / 2) - 2;
  return text.slice(0, _semilen) + '...'
         + text.slice(_len - _semilen);
}

// ### Arrays
/* ---------- */

function StopIteration() {}

function iter(a) {
    if (a.__iter) {
        a.__iter.reset();
        return a.__iter;
    }
    var pos = 0,
        len = a.length;
    return (a.__iter = {
        next: function() {
                  if (pos < len) return a[pos++];
                  pos = 0;
                  throw new StopIteration();
              },
        hasNext: function() { return (pos < len); },
        remove: function() { len--; return a.splice(--pos, 1); },
        reset: function() { pos = 0; len = a.length; },
        get: function() { return a[pos]; },
        each: function(f, rf) {
                  this.reset();
                  while (this.hasNext()) {
                    if (f(this.next()) === false) {
                        if (rf) rf(this.remove()); else this.remove();
                    }
                  }
              }
    });
}

// ### DOM
/* ------- */

// for one-level objects, so no hasOwnProperty check
function obj_clone(what) {
    var dest = {};
    for (var prop in what) {
        dest[prop] = what[prop];
    }
    return dest;
}

/* FIXME: replace with elm.getBoundingClientRect();
   see http://stackoverflow.com/questions/8070639/find-elements-position-in-browser-scroll */
function find_pos(elm) {
    var curleft = 0,
        curtop = 0;
    do {
        curleft += elm.offsetLeft/* - elm.scrollLeft*/;
        curtop += elm.offsetTop/* - elm.scrollTop*/;
    } while (elm = elm.offsetParent);
    return [ curleft, curtop ];
}

// ### AJAX
/* -------- */

function ajax(url, callback/*, errback*/) {
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
                throw new SysErr('No AJAX/XMLHttp support');
            }
        }
    }

    /*if (req.overrideMimeType) {
        req.overrideMimeType('text/xml');
      } */

    if (!req) {
      throw new SysErr('Failed to create XMLHttp instance');
    }

    var whenDone = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                if (callback) callback(req);
            } else {
                throw new SysErr('AJAX request for ' + url +
                                 ' returned ' + req.status +
                                 ' instead of 200');
            }
        }
    };

    req.onreadystatechange = whenDone;
    req.open('GET', url, true);
    req.send(null);
}

// ### Canvas-related Utilities
/* ---------------------------- */

function getPxRatio() { return $wnd.devicePixelRatio || 1; }

var DEF_CNVS_WIDTH = 400;
var DEF_CNVS_HEIGHT = 250;
var DEF_CNVS_BG = '#fff';

function canvasOpts(canvas, opts, ratio) {
    var isObj = !(opts instanceof Array),
        _w = isObj ? opts.width : opts[0],
        _h = isObj ? opts.height : opts[1];
    if (isObj && opts.bgcolor && opts.bgcolor.color) {
        canvas.style.backgroundColor = opts.bgcolor.color;
    }
    canvas.__pxRatio = ratio;
    canvas.style.width = _w + 'px';
    canvas.style.height = _h + 'px';
    canvas.setAttribute('width', _w * (ratio || 1));
    canvas.setAttribute('height', _h * (ratio || 1));
}

function newCanvas(dimen, ratio) {
    var _canvas = $doc.createElement('canvas');
    canvasOpts(_canvas, dimen, ratio);
    return _canvas;
}

// ### Internal Helpers
/* -------------------- */

// #### value check

var __finite = isFinite || Number.isFinite || function(n) { return n !== Infinity; };

var __nan = isNaN || Number.isNaN || function(n) { n !== NaN; };

// #### typecheck

function __builder(obj) {
    return (typeof Builder !== 'undefined') &&
           (obj instanceof Builder);
}

var __arr = Array.isArray;

function __num(n) {
    return !__nan(parseFloat(n)) && __finite(n);
}

function __fun(fun) {
    return fun != null && typeof fun === 'function';
}

function __obj(obj) {
    return obj != null && typeof obj === 'object';
}

function __str(obj) {
    return obj != null && typeof obj === 'string';
}

// #### mathematics

function __close(n1, n2, precision) {
    if (!(precision === 0)) {
        precision = precision || 2;
    }
    var multiplier = Math.pow(10, precision);
    return Math.round(n1 * multiplier) ==
           Math.round(n2 * multiplier);
}

function __roundTo(n, precision) {
    if (!precision) return Math.round(n);
    //return n.toPrecision(precision);
    var multiplier = Math.pow(10, precision);
    return Math.round(n * multiplier) / multiplier;
}

// #### other

function __errorAs(name, _constructor, _toStr) {
  // FIXME: breaks instanceof due to re-using same constructor
  var _producer = _constructor ?
    function(message) {
      _constructor.apply(this, arguments);
      if (!this.message) this.message = message || '';
      Error.apply(this, arguments);
    } :
    function(message) {
      this.message = message || '';
      Error.apply(this, arguments);
    };
  /* var _constructor = function(msg) { this.message = msg; } */
  _producer.prototype = new Error(); //Error.prototype;
  _producer.prototype.constructor = _producer;
  _producer.prototype.name = name || 'Unknown';
  _producer.prototype.toString = _toStr || function() { return this.name + (this.message ? ': ' + this.message : ''); }
  return _producer;
}

function __paramsToObj(pstr) {
  var o = {}, ps = pstr.split('&'), i = ps.length, pair;
  while (i--) { pair = ps[i].split('='); o[pair[0]] = pair[1]; }
  return o;
}

function _mrg_obj(src, backup) {
    if (!backup) return src;
    var res = {};
    for (prop in backup) {
        res[prop] = (typeof src[prop] !== 'undefined') ? src[prop] : backup[prop]; };
    return res;
}

function _strf(str, subst) {
  var args = subst;
  return str.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};

var trashBin = null;
function disposeElm(domElm) {
    if (!trashBin) {
        trashBin = $doc.createElement('div');
        trashBin.id = 'trash-bin';
        trashBin.style.display = 'none';
        $doc.body.appendChild(trashBin);
    }
    trashBin.appendChild(domElm);
    trashBin.innerHTML = '';
}

/* TODO: Create custom `undefined`, consider changing Infinity to Number.POSITIVE_INIFINITY */


// Internal Constants
// -----------------------------------------------------------------------------

var TIME_PRECISION = 9; // the number of digits after the floating point
                        // to round the time when comparing with bands and so on;
                        // used to get rid of floating point-conversion issues

function __adjust(t) {
  return __roundTo(t, TIME_PRECISION);
}

function __t_cmp(t0, t1) {
  if (__adjust(t0) > __adjust(t1)) return 1;
  if (__adjust(t0) < __adjust(t1)) return -1;
  return 0;
}

// Constants
// -----------------------------------------------------------------------------

var C = __anm.C; // will be transferred to public namespace both from bottom of player.js

var _ResMan = __anm.resource_manager;
var _PlrMan = __anm.player_manager;

// ### Player states
/* ----------------- */

C.NOTHING = -1;
C.STOPPED = 0;
C.PLAYING = 1;
C.PAUSED = 2;
C.LOADING = 3;
C.RES_LOADING = 4;
C.ERROR = 5;

// public constants below are also appended to C object, but with `X_`-like prefix
// to indicate their scope, see through all file

// ### Player Modes constants
/* -------------------------- */

C.M_CONTROLS_ENABLED = 1;    C.M_CONTROLS_DISABLED = 2;
C.M_INFO_ENABLED = 4;        C.M_INFO_DISABLED = 8;
C.M_HANDLE_EVENTS = 16;      C.M_DO_NOT_HANDLE_EVENTS = 32;
C.M_DRAW_STILL = 64;         C.M_DO_NOT_DRAW_STILL = 128;
C.M_INFINITE_DURATION = 256; C.M_FINITE_DURATION = 512;

C.M_PREVIEW = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED
              | C.M_DO_NOT_HANDLE_EVENTS
              | C.M_DRAW_STILL
              | C.M_FINITE_DURATION;
C.M_DYNAMIC = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED
              | C.M_HANDLE_EVENTS
              | C.M_DO_NOT_DRAW_STILL
              | C.M_INFINITE_DURATION;
C.M_VIDEO = C.M_CONTROLS_ENABLED
            | C.M_INFO_ENABLED
            | C.M_DO_NOT_HANDLE_EVENTS
            | C.M_DRAW_STILL
            | C.M_FINITE_DURATION;
C.M_SANDBOX = C.M_CONTROLS_DISABLED
            | C.M_INFO_DISABLED
            | C.M_DO_NOT_HANDLE_EVENTS
            | C.M_DO_NOT_DRAW_STILL
            | C.M_FINITE_DURATION;

// ### Load targets
/* ---------------- */

C.LT_BUILDER = 1;
C.LT_SCENE = 2;
C.LT_CLIPS = 3;
C.LT_IMPORT = 4;
C.LT_URL = 5;

// ### Events
/* ---------- */

// NB: All of the events must have different values, or the flow will be broken
// FIXME: allow grouping events, i.e. value may a group_marker + name of an event
//        also, allow events to belong to several groups, it may replace a tests like
//        XT_MOUSE or XT_CONTROL or isPlayerEvent

// * mouse
registerEvent('X_MCLICK', 'mclick', 1);
registerEvent('X_MDCLICK', 'mdclick', 2);
registerEvent('X_MUP', 'mup', 4);
registerEvent('X_MDOWN', 'mdown', 8);
registerEvent('X_MMOVE', 'mmove', 16);
registerEvent('X_MOVER', 'mover', 32);
registerEvent('X_MOUT', 'mout', 64);

registerEvent('XT_MOUSE', 'mouse',
  (C.X_MCLICK | C.X_MDCLICK | C.X_MUP | C.X_MDOWN | C.X_MMOVE | C.X_MOVER | C.X_MOUT));

// * keyboard
registerEvent('X_KPRESS', 'kpress', 128);
registerEvent('X_KUP', 'kup', 256);
registerEvent('X_KDOWN', 'kdown', 1024);

registerEvent('XT_KEYBOARD', 'keyboard',
  (C.X_KPRESS | C.X_KUP | C.X_KDOWN));

// * controllers
registerEvent('XT_CONTROL', 'control', (C.XT_KEYBOARD | C.XT_MOUSE));

// * draw
registerEvent('X_DRAW', 'draw', 'draw');

// * bands
registerEvent('X_START', 'start', 'x_start');
registerEvent('X_STOP', 'stop', 'x_stop');

// * playing (player state)
registerEvent('S_PLAY', 'play', 'play');
registerEvent('S_PAUSE', 'pause', 'pause');
registerEvent('S_STOP', 'stop', 'stop');
registerEvent('S_LOAD', 'load', 'load');
registerEvent('S_RES_LOAD', 'res_load', 'res_load');
registerEvent('S_REPEAT', 'repeat', 'repeat');
registerEvent('S_ERROR', 'error', 'error');

/* X_ERROR, X_FOCUS, X_RESIZE, X_SELECT, touch events */

/* TODO: the problem with controls receiving events is that `handle_` method is now saved as 'handle_8' instead of 'handle_mclick' */

// Modules
// -----------------------------------------------------------------------------

var M = {};

C.MOD_PLAYER = 'player';

// ### Options
/* ----------- */

var global_opts = { 'liveDebug': false,
                    'autoFocus': true,
                    'setTabindex': true };

M[C.MOD_PLAYER] = global_opts;

// Player
// -----------------------------------------------------------------------------

function Player() {
    this.id = '';
    this.state = null;
    this.anim = null;
    this.canvas = null;
    this.ctx = null;
    this.controls = null;
    this.__canvasPrepared = false;
    this.__instanceNum = ++Player.__instances;
    this.__makeSafe(Player._SAFE_METHODS);
}
Player.__instances = 0;

Player.PREVIEW_POS = 0; // was 1/3
Player.PEFF = 0; // seconds to play more when reached end of movie
Player.NO_TIME = -1;

Player.MARKER_ATTR = 'anm-player'; // marks player existence on canvas element
Player.URL_ATTR = 'data-url';

Player.DEFAULT_CANVAS = { 'width': DEF_CNVS_WIDTH,
                          'height': DEF_CNVS_HEIGHT,
                          'bgcolor': null/*{ 'color': DEF_CNVS_BG }*/ };
Player.DEFAULT_CONFIGURATION = { 'debug': false,
                                 'inParent': false,
                                 'muteErrors': false,
                                 'repeat': false,
                                 'mode': C.M_VIDEO,
                                 'zoom': 1.0,
                                 'meta': { 'title': '',
                                           'author': 'Anonymous',
                                           'copyright': '',
                                           'version': null,
                                           'description': '' },
                                 'anim': { 'fps': 30,
                                           'width': DEF_CNVS_WIDTH,
                                           'height': DEF_CNVS_HEIGHT,
                                           'bgcolor': null,
                                           'duration': 0 }
                               };

// ### Playing Control API
/* ----------------------- */

// methods listed below are directly wrapped with try/catch to check
// which way of handling/suppressing errors is current one for this player
// and act with catched errors basing on this way

Player._SAFE_METHODS = [ 'init', 'load', 'play', 'stop', 'pause', 'drawAt' ];

/* TODO: add load/play/pause/stop events */

// `id` is canvas id

// you may pass null for options, but if you provide them, at least `mode` is required
// to be set (all other are optional).
//
// options format:
//
//     { "debug": false,
//       "inParent": false,
//       "muteErrors": false,
//       "mode": C.M_VIDEO,
//       "zoom": 1.0,
//       "meta": { "title": "Default",
//                 "author": "Anonymous",
//                 "copyright": "© NaN",
//                 "version": -1.0,
//                 "description":
//                         "Default project description",
//                 [ "modified": "2012-04-10T15:06:12.246Z" ] }, // not used
//       "anim": { "fps": 30,
//                 "width": 400,
//                 "height": 250,
//                 "bgcolor": { color: "#fff" },
//                 "duration": 0 } }

Player.prototype.init = function(cvs, opts) {
    if (this.canvas) throw new PlayerErr(Errors.P.INIT_TWICE);
    if (this.anim) throw new PlayerErr(Errors.P.INIT_AFTER_LOAD);
    this._initHandlers(); /* TODO: make automatic */
    this._prepare(cvs);
    this._loadOpts(opts);
    this._postInit();
    /* TODO: if (this.canvas.hasAttribute('data-url')) */

    _PlrMan.fire(C.S_NEW_PLAYER, this);
    return this;
}
Player.prototype.load = function(arg1, arg2, arg3, arg4) {
    var player = this;

    /* object */
    /* object, callback */
    /* object, importer */
    /* object, duration */
    /* object, importer, callback */
    /* object, duration, callback */
    /* object, duration, importer, callback */

    var object = arg1, duration, importer, callback;

    var durationPassed = false;

    if (__fun(arg2)) { callback = arg2 } /* object, callback */
    else if (__num(arg2)) { /* object, duration[, ...] */
        duration = arg2;
        durationPassed = true;
        if (__obj(arg3)) { /* object, duration, importer[, callback] */
          importer = arg3; callback = arg4;
        } else if (__fun(arg3)) { /* object, duration, callback */
          callback = arg3;
        }
    } else if (__obj(arg2)) { /* object, importer[, ...] */
        importer = arg2;
        callback = arg3;
    }

    if (!object) {
        player.anim = null;
        player._reset();
        player.stop();
        throw new PlayerErr(Errors.P.NO_SCENE_PASSED);
    }

    if ((player.state.happens === C.PLAYING) ||
        (player.state.happens === C.PAUSED)) {
        throw new PlayerErr(Errors.P.COULD_NOT_LOAD_WHILE_PLAYING);
    }

    if (!player.__canvasPrepared) throw new PlayerErr(Errors.P.CANVAS_NOT_PREPARED);

    player._reset();

    player.state.happens = C.LOADING;

    var whenDone = function(result) {
        var scene = player.anim;
        if (player.mode & C.M_HANDLE_EVENTS) {
            player.__subscribeDynamicEvents(scene);
        }
        var remotes = scene._collectRemoteResources();
        if (!remotes.length) {
            player.fire(C.S_LOAD, result);
            player.stop();
            if (callback) callback(result);
        } else {
            player.state.happens = C.RES_LOADING;
            player.fire(C.S_RES_LOAD, remotes);
            _ResMan.subscribe(remotes, [ function() {
                player.fire(C.S_LOAD, result);
                player.stop();
                if (callback) callback(result);
            } ]);
        }
    };

    /* TODO: configure canvas using clips bounds */

    if (object) {

        if (__builder(object)) {  // Builder instance
            player._loadTarget = C.LT_BUILDER;
            L.loadBuilder(player, object, whenDone);
        } else if (object instanceof Scene) { // Scene instance
            player._loadTarget = C.LT_SCENE;
            L.loadScene(player, object, whenDone);
        } else if (__arr(object)) { // array of clips
            player._loadTarget = C.LT_CLIPS;
            L.loadClips(player, object, whenDone);
        } else if (__str(object)) { // URL
            var controls = this.controls;
            player._loadTarget = C.LT_URL;
            player._loadSrc = object;
            if (controls) controls._scheduleLoading();
            L.loadFromUrl(player, object, importer, function(result) {
                if (controls) controls._stopLoading();
                whenDone(result);
            });
        } else { // any object with importer
            player._loadTarget = C.LT_IMPORT;
            L.loadFromObj(player, object, importer, whenDone);
        }

    } else {
        player._loadTarget = C.LT_SCENE;
        player.anim = new Scene();
        whenDone();
    }

    if (durationPassed) {
      player.anim.setDuration(duration);
      player.setDuration(duration);
    }

    return player;
}

Player.prototype.play = function(from, speed, stopAfter) {

    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.ALREADY_PLAYING);

    var player = this;

    // reassigns var to ensure proper function is used
    __nextFrame = __frameFunc();

    player._ensureHasAnim();
    player._ensureHasState();

    var state = player.state;

    state.__lastPlayConf = [ from, speed, stopAfter ];

    if (state.duration == undefined) throw new PlayerErr(Errors.P.DURATION_IS_NOT_KNOWN);

    state.from = from || state.from;
    state.speed = speed || state.speed;
    state.stop = (typeof stopAfter !== 'undefined') ? stopAfter : state.stop;

    state.__startTime = Date.now();
    state.__redraws = 0;
    state.__rsec = 0;

    state.__supressFrames = false;

    /*if (state.__drawInterval !== null) {
        clearInterval(player.state.__drawInterval);
    }*/

    state.happens = C.PLAYING;

    var scene = player.anim;
    scene.reset();
    player.setDuration(scene.duration);

    //if (state.from > 2) throw new Error('Test');

    state.__firstReq = __r_loop(player.ctx,
                                state, scene,
                                player.__beforeFrame(scene),
                                player.__afterFrame(scene),
                                player.__userBeforeRender,
                                player.__userAfterRender);

    player.fire(C.S_PLAY, state.from);

    return player;
}

Player.prototype.stop = function() {
    /* if (state.happens === C.STOPPED) return; */

    var player = this,
        scene = player.anim;

    player._ensureHasState();

    var state = player.state;

    if ((state.happens === C.PLAYING) ||
        (state.happens === C.PAUSED)) {
        player.__supressFrames = true;
        __stopAnim(state.__firstReq);
    }

    state.time = Player.NO_TIME;
    state.from = 0;
    state.stop = Player.NO_TIME;

    if (scene) {
        state.happens = C.STOPPED;
        if (player.mode & C.M_DRAW_STILL) {
            player.drawAt(state.duration * Player.PREVIEW_POS);
        }
        if (player.controls/* && !player.controls.hidden*/) {
            player._renderControlsAt(state.time);
        }
    } else if (state.happens !== C.ERROR) {
        state.happens = C.NOTHING;
        player._drawSplash();
    }

    player.fire(C.S_STOP);

    if (scene) scene.reset();

    return player;
}

Player.prototype.pause = function() {
    var player = this;

    player._ensureHasState();
    player._ensureHasAnim();

    var state = player.state;
    if (state.happens === C.STOPPED) {
        throw new PlayerErr(Errors.P.PAUSING_WHEN_STOPPED);
    }

    if (state.happens === C.PLAYING) {
        state.__supressFrames = true;
        __stopAnim(state.__firstReq);
    }

    if (state.time > state.duration) {
        state.time = state.duration;
    }

    state.from = state.time;
    state.happens = C.PAUSED;

    player.drawAt(state.time);

    player.fire(C.S_PAUSE, state.time);

    return player;
}

/*Player.prototype.reset = function() {

}*/

Player.prototype.onerror = function(callback) {
    this.__err_handler = callback;

    return this;
}

// ### Inititalization
/* ------------------- */

provideEvents(Player, [C.S_LOAD, C.S_RES_LOAD, C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_REPEAT, C.S_ERROR]);
Player.prototype._prepare = function(cvs) {
    if (__str(cvs)) {
        this.canvas = $doc.getElementById(cvs);
        if (!this.canvas) throw new PlayerErr(_strf(Errors.P.NO_CANVAS_WITH_ID, [cvs]));
        this.id = cvs;
    } else {
        if (!cvs) throw new PlayerErr(Errors.P.NO_CANVAS_PASSED);
        this.id = cvs.id;
        this.canvas = cvs;
    }
    var canvas = this.canvas;
    if (canvas.getAttribute(Player.MARKER_ATTR)) throw new PlayerErr(Errors.P.ALREADY_ATTACHED);
    canvas.setAttribute(Player.MARKER_ATTR, true);
    this.ctx = canvas.getContext("2d");
    this.state = Player.createState(this);
    this.subscribeEvents(canvas);
}
Player.prototype._loadOpts = function(opts) {
    var cvs_opts = Player._mergeOpts(Player._optsFromCvsAttrs(this.canvas),
                                     Player.DEFAULT_CONFIGURATION);
    var opts = opts ? Player._mergeOpts(opts, cvs_opts) : cvs_opts;
    this.inParent = opts.inParent;
    this.mode = (opts.mode != null) ? opts.mode : C.M_VIDEO;
    this.debug = opts.debug;
    this.state.zoom = opts.zoom || 1;
    this.state.repeat = opts.repeat;

    this.configureAnim(opts.anim || Player.DEFAULT_CONFIGURATION.anim);

    this._checkMode();

    this.configureMeta(opts.meta || Player.DEFAULT_CONFIGURATION.meta);
}
// initial state of the player, called from constuctor
Player.prototype._postInit = function() {
    this.stop();
    /* TODO: load some default information into player */
    Text._ensureHasBuffer(); /* so it will be performed onload */
    var mayBeUrl = this.canvas.getAttribute(Player.URL_ATTR);
    if (mayBeUrl) this.load(mayBeUrl/*,
                            this.canvas.getAttribute(Player.IMPORTER_ATTR)*/);
}
Player.prototype.changeRect = function(rect) {
    this._reconfigureCanvas({
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
        bgcolor: this.state.bgcolor
    });
}
Player.prototype._rectChanged = function(rect) {
    var cur = this._canvasConf;
    return (cur.width != rect.width) || (cur.height != rect.height) ||
           (cur.x != rect.x) || (cur.y != rect.y);
}
Player.prototype.forceRedraw = function() {
    if (this.controls) this.controls.forceNextRedraw();
    switch (this.state.happens) {
        case C.STOPPED: this.stop(); break;
        case C.PAUSED: if (this.anim) this.drawAt(this.state.time); break;
        case C.PLAYING: if (this.anim) { this._stopAndContinue(); } break;
        case C.NOTHING: case C.LOADING: case C.RES_LOADING: this._drawSplash(); break;
        //case C.ERROR: this._drawErrorSplash(); break;
    }
}
Player.prototype.changeZoom = function(ratio) {
    this.state.zoom = ratio;
}
// update player state with passed configuration, usually done before
// loading some scene or by importer, `conf` has the data about title,
// author/copyright, fps and width/height of the player
//
// Anim-info format:
//
//     { ["fps": 24.0,] // NB: currently not applied in any way, default is 30
//       "width": 640,
//       "height": 480,
//       ["bgcolor": { color: "#f00" },] // in canvas-friendly format
//       ["duration": 10.0] // in seconds
//     }
Player.prototype.configureAnim = function(conf) {
    this._animInfo = conf;
    var cnvs = this.canvas;

    if (!conf.width && cnvs.hasAttribute('width')) conf.width = cnvs.getAttribute('width');
    if (!conf.height && cnvs.hasAttribute('height')) conf.height = cnvs.getAttribute('height');

    this._reconfigureCanvas(conf);

    if (conf.bgcolor) this.state.bgcolor = conf.bgcolor;

    if (conf.fps) this.state.fps = conf.fps;
    if (conf.duration) this.state.duration = conf.duration;

}
// update player information block with passed configuration, usually done before
// loading some scene or by importer, `conf` has the data about title,
// author/copyright, version.
//
// Meta-info format:
//
//     { ["id": "......",]
//       "title": "Default",
//       "author": "Anonymous",
//       "copyright": "© 2011",
//       "version": 0.1,
//       "description": "Default project description"
//     }
Player.prototype.configureMeta = function(info) {
    this._metaInfo = info;
    if (this.controls) this.controls.inject(info, this._animInfo);
}
// draw current scene at specified time
Player.prototype.drawAt = function(time) {
    if (time === Player.NO_TIME) throw new PlayerErr(Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
    if ((time < 0) || (time > this.state.duration)) {
        throw new PlayerErr(_strf(Errors.P.PASSED_TIME_NOT_IN_RANGE, [time]));
    }
    var scene = this.anim,
        u_before = this.__userBeforeRender,
        u_after = this.__userAfterRender,
        after = function(gtime, ctx) {
            scene.reset();
            scene.__informEnabled = true;
            u_after(gtime, ctx);
        };

    scene.reset();
    scene.__informEnabled = false;
    // __r_at is the alias for Render.at, but a bit more quickly-accessible,
    // because it is a single function
    __r_at(time, this.ctx, this.state, this.anim, u_before, u_after);

    if (this.controls) this._renderControlsAt(time);

    return this;
}
// TODO: change to before/after for events?
Player.prototype.beforeFrame = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.BEFOREFRAME_BEFORE_PLAY);
    this.__userBeforeFrame = callback;
}
Player.prototype.afterFrame = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.AFTERFRAME_BEFORE_PLAY);
    this.__userAfterFrame = callback;
}
Player.prototype.beforeRender = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.BEFORENDER_BEFORE_PLAY);
    this.__userBeforeRender = callback;
}
Player.prototype.afterRender = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.AFTERRENDER_BEFORE_PLAY);
    this.__userAfterRender = callback;
}
Player.prototype.detach = function() {
    if (this.controls) this.controls.detach(this.canvas);
    this.canvas.removeAttribute(Player.MARKER_ATTR);
    this._reset();
    _PlrMan.fire(C.S_PLAYER_DETACH, this);
}
Player.attachedTo = function(canvas) {
    return (canvas.getAttribute(Player.MARKER_ATTR) == null) ||
           (canvas.getAttribute(Player.MARKER_ATTR) == undefined);
}
Player.__getPosAndRedraw = function(player) {
    return function(evt) {
        /*var canvas = player.canvas;
        var pos = find_pos(canvas),
            rect = {
                'width': canvas.clientWidth,
                'height': canvas.clientHeight,
                'x': pos[0],
                'y': pos[1]
            };
        if (player._rectChanged(rect)) player.changeRect(rect);*/
        /* if (player.controls) {
            player.controls.update(player.canvas);
            player.controls.handleAreaChange();
            //player._renderControls();
        } */
    };
}
Player.prototype.subscribeEvents = function(canvas) {
    $wnd.addEventListener('load', Player.__getPosAndRedraw(this), false);
    $wnd.addEventListener('scroll', Player.__getPosAndRedraw(this), false);
    $wnd.addEventListener('resize', Player.__getPosAndRedraw(this), false);
    this.canvas.addEventListener('mouseover', (function(player) {
                        return function(evt) {
                            if (global_opts.autoFocus &&
                                (player.mode & C.M_HANDLE_EVENTS) &&
                                player.canvas) {
                                player.canvas.focus();
                            }
                            return true;
                        };
                    })(this), false);
    this.canvas.addEventListener('mouseout', (function(player) {
                        return function(evt) {
                            if (global_opts.autoFocus &&
                                (player.mode & C.M_HANDLE_EVENTS) &&
                                player.canvas) {
                                player.canvas.blur();
                            }
                            return true;
                        };
                    })(this), false);
}
Player.prototype.setDuration = function(value) {
    this.state.duration = (value >= 0) ? value : 0;
    if (this.controls) this.controls.setDuration((value >= 0) ? value : 0);
}
Player.prototype._drawSplash = function() {
    var ctx = this.ctx,
        w = this.state.width,
        h = this.state.height;

    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    var ratio = this.state.ratio;
    if (ratio != 1) ctx.scale(ratio, ratio);

    // background
    ctx.fillStyle = '#ffe';
    ctx.fillRect(0, 0, w, h);

    if (this.controls) {
       ctx.restore();
       return;
    }

    // text
    ctx.fillStyle = '#999966';
    ctx.font = '18px sans-serif';
    ctx.fillText(Strings.COPYRIGHT, 20, h - 20);

    ctx.globalAlpha = .6;

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w / 2, h / 2) * .5, 0, 2 * Math.PI);
    ctx.fillStyle = '#a00';
    ctx.strokeStyle = '#ffe';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fill();

    ctx.globalAlpha = .9;

    ctx.restore();

    drawAnimatronGuy(ctx, w / 2, h / 2, Math.min(w, h) * .35,
                     [ '#fff', '#aa0' ]);

}
Player.prototype._drawLoadingSplash = function(text) {
    this._drawSplash();
    if (this.controls) return;
    var ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#006';
    ctx.font = '12px sans-serif';
    ctx.fillText(text || Strings.LOADING, 20, 25);
    ctx.restore();
}
Player.prototype._drawErrorSplash = function(e) {
    if (this.controls) {
        this.controls.forceNextRedraw();
        this.controls.render();
        return;
    }
    this._drawSplash();
    var ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#006';
    ctx.font = '14px sans-serif';
    ctx.fillText(Strings.ERROR +
                 (e ? ': ' + (e.message || (typeof Error))
                    : '') + '.', 20, 25);
    ctx.restore();
}
Player.prototype.toString = function() {
    return "[ Player '" + this.id + "' m-" + this.mode + " ]";
}
// reset player to initial state, called before loading any scene
Player.prototype._reset = function() {
    var state = this.state;
    state.debug = this.debug;
    state.happens = C.NOTHING;
    state.from = 0;
    state.time = Player.NO_TIME;
    /*state.zoom = 1;*/ // do not override the zoom
    state.duration = undefined;
    if (this.controls) this.controls.reset();
    this.ctx.clearRect(0, 0, state.width * state.ratio,
                             state.height * state.ratio);
    /*this.stop();*/
}
Player.prototype._stopAndContinue = function() {
  //state.__lastPlayConf = [ from, speed, stopAfter ];
  var state = this.state,
      last_conf = state.__lastPlayConf;
  var stoppedAt = state.time;
  this.stop();
  this.play(stoppedAt, last_conf[1], last_conf[2]);
}
// update player's canvas with configuration
Player.prototype._reconfigureCanvas = function(opts) {
    var canvas = this.canvas;
    var pxRatio = getPxRatio();
    this._canvasConf = opts;
    var _w = opts.width ? Math.floor(opts.width) : DEF_CNVS_WIDTH;
    var _h = opts.height ? Math.floor(opts.height) : DEF_CNVS_HEIGHT;
    opts.width = _w;
    opts.height = _h;
    this.state.width = _w;
    this.state.height = _h;
    this.state.ratio = pxRatio;
    if (opts.bgcolor) this.state.bgcolor = opts.bgcolor;
    canvasOpts(canvas, opts, pxRatio);
    Player._saveCanvasPos(canvas);
    if (this.controls) this.controls.update(canvas);
    this.__canvasPrepared = true;
    this.forceRedraw();
    return this;
}
Player.prototype._checkMode = function() {
    if (!this.canvas) return;

    if (this.mode & C.M_CONTROLS_ENABLED) {
        this._enableControls();
        if (this.mode & C.M_INFO_ENABLED) {
            this._enableInfo();
        } else {
            this._disableInfo();
        }
    } else {
        this._disableInfo();
        this._disableControls();
    }
}
// FIXME: methods below may be removed, but they are required for tests
Player.prototype._enableControls = function() {
    if (!this.controls) this.controls = new Controls(this);
    this.controls.enable();
}
Player.prototype._disableControls = function() {
    if (!this.controls) return;
    this.controls.disable();
    this.controls = null;
}
Player.prototype._enableInfo = function() {
    if (!this.controls) return;
    this.controls.enableInfo();
}
Player.prototype._disableInfo = function() {
    if (!this.controls) return;
    this.controls.disableInfo();
}
Player.prototype._renderControlsAt = function(time) {
    this.controls.render(time);
}
Player.prototype.__subscribeDynamicEvents = function(scene) {
    if (global_opts.setTabindex) {
        this.canvas.setAttribute('tabindex',this.__instanceNum);
    }
    if (scene && !scene.__subscribedEvts) {
        scene.subscribeEvents(this.canvas);
        scene.__subscribedEvts = true;
    }
}
Player.prototype._ensureHasState = function() {
    if (!this.state) throw new PlayerErr(Errors.P.NO_STATE);
}
Player.prototype._ensureHasAnim = function() {
    if (!this.anim) throw new PlayerErr(Errors.P.NO_SCENE);
}
Player.prototype.__beforeFrame = function(scene) {
    return (function(player, state, scene, callback) {
        return function(time) {
            if (state.happens !== C.PLAYING) return false;
            if (((state.stop !== Player.NO_TIME) &&
                 (time >= (state.from + state.stop))) ||
                 (time > (state.duration + Player.PEFF))) {
                state.time = 0;
                scene.reset();
                player.stop();
                if (state.repeat) {
                   player.play();
                   player.fire(C.S_REPEAT);
                } else if (!(player.mode & C.M_INFINITE_DURATION)
                       && __finite(state.duration)) {
                   player.drawAt(state.duration);
                }
                return false;
            }
            if (callback) callback(time, player.ctx);
            return true;
        }
    })(this, this.state, scene, this.__userBeforeFrame);
}
Player.prototype.__afterFrame = function(scene) {
    return (function(player, state, scene, callback) {
        return function(time) {
            if (player.controls && !player.controls.hidden) {
                player._renderControlsAt(time);
            }
            if (callback) callback(time);
            return true;
        }
    })(this, this.state, scene, this.__userAfterFrame);
}

// Called when any error happens during player initialization or animation
// Player should mute all non-system errors by default, and if it got a system error, it may show
// this error over itself
Player.prototype.__onerror = function(err) {
  var player = this;
  var doMute = (player.state && player.state.muteErrors);
      doMute = doMute && !(err instanceof SysErr);

  try {
    player.state.happens = C.ERROR;
    player.__lastError = err;
    player.fire(C.S_ERROR, err);

    player.anim = null;
    /*if (player.state)*/ player.__unsafe_stop();
  } catch(e) { throw new SysErr(_strf(Errors.S.ERROR_HANDLING_FAILED, [err.message || err])); }

  doMute = (this.__err_handler && this.__err_handler(err)) || doMute;

  if (!doMute) {
      this._drawErrorSplash(err);
      throw err;
  }
}
Player.prototype.__callSafe = function(f) {
  try {
    return f.call(this);
  } catch(err) {
    this.__onerror(err);
  }
}
Player.prototype.__makeSafe = function(methods) {
  var player = this;
  for (var i = 0, il = methods.length; i < il; i++) {
    var method = methods[i];
    if (!player[method]) throw new SysErr(_strf(Errors.S.NO_METHOD_FOR_PLAYER, [method]));
    player['__unsafe_'+method] = player[method];
    player[method] = (function(method_f) {
      return function() {
        var args = arguments;
        if (!this.__safe_ctx) {
          this.__safe_ctx = true;
          try {
            var ret_val = player.__callSafe(function() {
              return method_f.apply(player, args);
            });
            this.__safe_ctx = false;
            return ret_val;
          } catch(err) {
            this.__safe_ctx = false;
            throw err;
          }
        } else {
          return method_f.apply(player, args);
        }
      };
    })(player[method]);
  }
}
Player.prototype.handle__x = function(type, evt) {
  if (this.anim) this.anim.fire(type, this);
  return true;
}

/* Player.prototype.__originateErrors = function() {
    return (function(player) { return function(err) {
        return player._fireError(err);
    }})(this);
} */
Player._saveCanvasPos = function(cvs) {
    var gcs = ($doc.defaultView &&
               $doc.defaultView.getComputedStyle); // last is assigned

    // computed padding-left
    var cpl = gcs ?
          (parseInt(gcs(cvs, null).paddingLeft, 10) || 0) : 0,
    // computed padding-top
        cpt = gcs ?
          (parseInt(gcs(cvs, null).paddingTop, 10) || 0) : 0,
    // computed bodrer-left
        cbl = gcs ?
          (parseInt(gcs(cvs, null).borderLeftWidth,  10) || 0) : 0,
    // computed bodrer-top
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
    cvs.__rOffsetLeft = ol;
    cvs.__rOffsetTop = ot;
}

Player.createState = function(player) {
    return {
        'time': Player.NO_TIME, 'from': 0, 'stop': Player.NO_TIME,
        'speed': 1, 'fps': 30, 'afps': 0, 'duration': 0,
        'debug': false, 'iactive': false,
        /* TODO: use iactive to determine if controls/info should be init-zed */
        'width': player.canvas.offsetWidth,
        'height': player.canvas.offsetHeight,
        'zoom': 1.0, 'bgcolor': null,
        'happens': C.NOTHING,
        'duration': undefined,
        '__startTime': -1,
        '__redraws': 0, '__rsec': 0
        /*'__drawInterval': null*/
    };
}

Player._isPlayerEvent = function(type) {
    // TODO: make some marker to group types of events
    return ((type == C.S_PLAY) || (type == C.S_PAUSE) ||
            (type == C.S_STOP) || (type == C.S_REPEAT) ||
            (type == C.S_LOAD) || (type == C.S_RES_LOAD) ||
            (type == C.S_ERROR));
}
function __attrOr(canvas, attr, _default) {
    return canvas.hasAttribute(attr)
           ? canvas.getAttribute(attr)
           : _default;
}
Player._mergeOpts = function(what, where) {
    var res = _mrg_obj(what, where);
    res.meta = what.meta ? _mrg_obj(what.meta, where.meta || {}) : (where.meta || {});
    res.anim = what.anim ? _mrg_obj(what.anim, where.anim || {}) : (where.anim || {});
    return res;
}
Player._optsFromCvsAttrs = function(canvas) {
    var width, height,
        pxRatio = getPxRatio();
    return { 'debug': __attrOr(canvas, 'data-debug', undefined),
             'inParent': undefined,
             'muteErrors': __attrOr(canvas, 'data-mute-errors', false),
             'repeat': __attrOr(canvas, 'data-repeat', undefined),
             'mode': __attrOr(canvas, 'data-mode', undefined),
             'zoom': __attrOr(canvas, 'data-zoom', undefined),
             'meta': { 'title': __attrOr(canvas, 'data-title', undefined),
                       'author': __attrOr(canvas, 'data-author', undefined),
                       'copyright': undefined,
                       'version': undefined,
                       'description': undefined },
             'anim': { 'fps': undefined,
                       'width': (__attrOr(canvas, 'data-width',
                                (width = __attrOr(canvas, 'width', undefined),
                                 width ? (width / pxRatio) : undefined))),
                       'height': (__attrOr(canvas, 'data-height',
                                 (height = __attrOr(canvas, 'height', undefined),
                                  height ? (height / pxRatio) : undefined))),
                       'bgcolor': canvas.hasAttribute('data-bgcolor')
                                 ? { 'color': canvas.getAttribute('data-bgcolor') }
                                 : undefined,
                       'duration': undefined } };
};
Player._optsFromUrlParams = function(params/* as object */) {
    return { 'debug': params.debug,
             'inParent': undefined,
             'muteErrors': false,
             'repeat': params.r,
             'mode': params.m,
             'zoom': params.z,
             'anim': { 'fps': undefined,
                       'width': params.w,
                       'height': params.h,
                       'bgcolor': { color: params.bg ? "#" + params.bg : null },
                       'duration': undefined } };
}
Player.forSnapshot = function(canvasId, snapshotUrl, importer, callback) {
    var urlWithParams = snapshotUrl.split('?'),
        snapshotUrl = urlWithParams[0],
        urlParams = urlWithParams[1], // TODO: validate them?
        params = (urlParams && urlParams.length > 0) ? __paramsToObj(urlParams) : {},
        options = Player._optsFromUrlParams(params),
        player = new Player();
    player.init(canvasId, options);
    function updateWithParams() {
        if (typeof params.t !== 'undefined') {
            player.play(params.t / 100);
        } else if (typeof params.p !== 'undefined') {
            player.play(params.p / 100).pause();
        }
        if (params.w && params.h) {
            player._reconfigureCanvas({ width: params.w, height: params.h });
        }
        if (params.bg) player.canvas.style.backgroundColor = '#' + params.bg;
        if (callback) callback();
    }

    player.load(snapshotUrl, importer, updateWithParams);

    return player;
}

// Scene
// -----------------------------------------------------------------------------

// > Scene % ()
function Scene() {
    this.tree = [];
    this.hash = {};
    this.name = '';
    this.duration = undefined;
    this.bgfill = null;
    this.width = undefined;
    this.height = undefined;
    this.__informEnabled = true;
    this._initHandlers(); // TODO: make automatic
}

Scene.DEFAULT_LEN = 10;

// mouse/keyboard events are assigned in L.loadScene
/* TODO: move them into scene */
provideEvents(Scene, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                       C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                       C.X_KPRESS, C.X_KUP, C.X_KDOWN,
                       C.X_DRAW,
                       // player events
                       C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_REPEAT,
                       C.S_LOAD, C.S_RES_LOAD, C.S_ERROR ]);
Scene.prototype.setDuration = function(val) {
  this.duration = (val >= 0) ? val : 0;
}
/* TODO: add chaining to all external Scene methods? */
// > Scene.add % (elem: Element | Clip)
// > Scene.add % (elems: Array[Element]) => Clip
// > Scene.add % (draw: Function(ctx: Context),
//                onframe: Function(time: Float),
//                [ transform: Function(ctx: Context,
//                                      prev: Function(Context)) ])
//                => Element
// > Scene.add % (builder: Builder)
Scene.prototype.add = function(arg1, arg2, arg3) {
    if (arg2) { // element by functions mode
        var _elm = new Element(arg1, arg2);
        if (arg3) _elm.changeTransform(arg3);
        this._addToTree(_elm);
        return _elm;
    } else if (__arr(arg1)) { // elements array mode
        var _clip = new Clip();
        _clip.add(arg1);
        this._addToTree(_clip);
        return _clip;
    } else if (__builder(arg1)) { // builder instance
        this._addToTree(arg1.value);
    } else { // element object mode
        this._addToTree(arg1);
    }
}
/* addS allowed to add static element before, such as image, may be return it in some form? */
// > Scene.remove % (elm: Element)
Scene.prototype.remove = function(elm) {
    // error will be thrown in _unregister method
    //if (!this.hash[elm.id]) throw new AnimErr(Errors.A.ELEMENT_IS_NOT_REGISTERED);
    if (elm.parent) {
        // it will unregister element inside
        elm.parent.remove(elm);
    } else {
        this._unregister(elm);
    }
}
// > Scene.prototype.clear % ()
/* Scene.prototype.clear = function() {
    this.hash = {};
    this.tree = [];
    this.duration = 0;
    var hash = this.hash;
    this.hash = {};
    for (var elmId in hash) {
        hash[elm.id]._unbind(); // unsafe, because calls unregistering
    }
} */
// > Scene.visitElems % (visitor: Function(elm: Element))
Scene.prototype.visitElems = function(visitor, data) {
    for (var elmId in this.hash) {
        visitor(this.hash[elmId], data);
    }
}
// > Scene.visitRoots % (visitor: Function(elm: Element))
Scene.prototype.visitRoots = function(visitor, data) {
    for (var i = 0, tlen = this.tree.length; i < tlen; i++) {
        visitor(this.tree[i], data);
    }
}
Scene.prototype.render = function(ctx, time, zoom) {
    ctx.save();
    if (zoom != 1) {
        ctx.scale(zoom, zoom);
    }
    if (this.bgfill) {
        ctx.fillStyle = Brush.create(ctx, this.bgfill);
        ctx.fillRect(0, 0, this.width, this.height);
    }
    this.visitRoots(function(elm) {
        elm.render(ctx, time);
    });
    ctx.restore();
    this.fire(C.X_DRAW,ctx);
}
Scene.prototype.handle__x = function(type, evt) {
    this.visitElems(function(elm) {
        elm.fire(type, evt);
    });
    return true;
}
// TODO: test
Scene.prototype.getFittingDuration = function() {
    var max_pos = -Infinity;
    var me = this;
    this.visitRoots(function(elm) {
        var elm_tpos = elm._max_tpos();
        if (elm_tpos > max_pos) max_pos = elm_tpos;
    });
    return max_pos;
}
Scene.prototype.reset = function() {
    this.__informEnabled = true;
    this.visitRoots(function(elm) {
        elm.reset();
    });
}
Scene.prototype.dispose = function() {
    this.disposeHandlers();
    var me = this;
    /* FIXME: unregistering removes from tree, ensure it is safe */
    this.visitRoots(function(elm) {
        me._unregister(elm);
        elm.dispose();
    });
}
Scene.prototype.isEmpty = function() {
    return this.tree.length == 0;
}
Scene.prototype.toString = function() {
    return "[ Scene "+(this.name ? "'"+this.name+"'" : "")+"]";
}
Scene.prototype.subscribeEvents = function(canvas) {
    var anim = this;
    canvas.addEventListener('mouseup', function(evt) {
        anim.fire(C.X_MUP, mevt(evt, canvas));
    }, false);
    canvas.addEventListener('mousedown', function(evt) {
        anim.fire(C.X_MDOWN, mevt(evt, canvas));
    }, false);
    canvas.addEventListener('mousemove', function(evt) {
        anim.fire(C.X_MMOVE, mevt(evt, canvas));
    }, false);
    canvas.addEventListener('mouseover', function(evt) {
        anim.fire(C.X_MOVER, mevt(evt, canvas));
    }, false);
    canvas.addEventListener('mouseout', function(evt) {
        anim.fire(C.X_MOUT, mevt(evt, canvas));
    }, false);
    canvas.addEventListener('click', function(evt) {
        anim.fire(C.X_MCLICK, mevt(evt, canvas));
    }, false);
    canvas.addEventListener('dblclick', function(evt) {
        anim.fire(C.X_MDCLICK, mevt(evt, canvas));
    }, false);
    canvas.addEventListener('keyup', function(evt) {
        anim.fire(C.X_KUP, kevt(evt));
    }, false);
    canvas.addEventListener('keydown', function(evt) {
        anim.fire(C.X_KDOWN, kevt(evt));
    }, false);
    canvas.addEventListener('keypress', function(evt) {
        anim.fire(C.X_KPRESS, kevt(evt));
    }, false);
}
Scene.prototype._addToTree = function(elm) {
    if (!elm.children) {
        throw new AnimErr('It appears that it is not a clip object or element that you pass');
    }
    this._register(elm);
    /*if (elm.children) this._addElems(elm.children);*/
    this.tree.push(elm);
}
/*Scene.prototype._addElems = function(elems) {
    for (var ei = 0; ei < elems.length; ei++) {
        var _elm = elems[ei];
        this._register(_elm);
    }
}*/
Scene.prototype._register = function(elm) {
    if (this.hash[elm.id]) throw new AnimErr(Errors.A.ELEMENT_IS_REGISTERED);
    elm.registered = true;
    elm.scene = this;
    this.hash[elm.id] = elm;
    var me = this;
    elm.visitChildren(function(elm) {
        me._register(elm);
    });
}
Scene.prototype._unregister = function(elm) {
    if (!elm.registered) throw new AnimErr(Errors.A.ELEMENT_IS_NOT_REGISTERED);
    var me = this;
    elm.visitChildren(function(elm) {
        me._unregister(elm);
    });
    var pos = -1;
    while ((pos = this.tree.indexOf(elm)) >= 0) {
      this.tree.splice(pos, 1);
    }
    delete this.hash[elm.id];
    elm.registered = false;
    elm.scene = null;
    //elm.parent = null;
}
Scene.prototype._collectRemoteResources = function() {
    var remotes = [];
    this.visitElems(function(elm) {
        if (elm._hasRemoteResources()) {
           remotes = remotes.concat(elm._getRemoteResources());
        }
    });
    return remotes;
}

// Element
// -----------------------------------------------------------------------------

// repeat mode
C.R_ONCE = 0;
C.R_STAY = 1;
C.R_LOOP = 2;
C.R_BOUNCE = 3;

// composite operation
C.C_SRC_OVER = 1; // first (default) is 1, to pass if test
C.C_SRC_ATOP = 2;
C.C_SRC_IN = 3;
C.C_SRC_OUT = 4;
C.C_DST_OVER = 5;
C.C_DST_ATOP = 6;
C.C_DST_IN = 7;
C.C_DST_OUT = 8;
C.C_LIGHTER = 9;
C.C_DARKER = 10;
C.C_COPY = 11;
C.C_XOR = 12;

C.AC_NAMES = [];
C.AC_NAMES[C.C_SRC_OVER] = 'source-over';
C.AC_NAMES[C.C_SRC_ATOP] = 'source-atop';
C.AC_NAMES[C.C_SRC_IN] = 'source-in';
C.AC_NAMES[C.C_SRC_OUT] = 'source-out';
C.AC_NAMES[C.C_DST_OVER] = 'destination-over';
C.AC_NAMES[C.C_DST_ATOP] = 'destination-atop';
C.AC_NAMES[C.C_DST_IN] = 'destination-in';
C.AC_NAMES[C.C_DST_OUT] = 'destination-out';
C.AC_NAMES[C.C_LIGHTER] = 'lighter';
C.AC_NAMES[C.C_DARKER] = 'darker';
C.AC_NAMES[C.C_COPY] = 'copy';
C.AC_NAMES[C.C_XOR] = 'xor';

Element.DEFAULT_PVT = [ 0.5, 0.5 ];
Element.DEFAULT_REG = [ 0.0, 0.0 ];

Element.TYPE_MAX_BIT = 16;
Element.PRRT_MAX_BIT = 8; // used to calculate modifiers/painters id's:
    // they are: (type << TYPE_MAX_BIT) | (priot << PRRT_MAX_BIT) | i

// modifiers classes
// the order is also determined with value
Element.SYS_MOD = 0;
Element.TWEEN_MOD = 1;
Element.USER_MOD = 2;
/* TODO: JUMP_MOD */
Element.EVENT_MOD = 3;
// these two simplify checking in __mafter/__mbefore
Element.FIRST_MOD = Element.SYS_MOD;
Element.LAST_MOD = Element.EVENT_MOD;
// modifiers groups
Element.ALL_MODIFIERS = [ Element.SYS_MOD, Element.TWEEN_MOD,
                          Element.USER_MOD, Element.EVENT_MOD ];
Element.NOEVT_MODIFIERS = [ Element.SYS_MOD, Element.TWEEN_MOD,
                            Element.USER_MOD ];

// painters classes
// the order is also determined with value
Element.SYS_PNT = 0;
Element.USER_PNT = 1;
Element.DEBUG_PNT = 2;
// these two simplify checking in __mafter/__mbefore
Element.FIRST_PNT = Element.SYS_PNT;
Element.LAST_PNT = Element.DEBUG_PNT;
// painters groups
Element.ALL_PAINTERS = [ Element.SYS_PNT, Element.USER_PNT,
                         Element.DEBUG_PNT ];
Element.NODBG_PAINTERS = [ Element.SYS_PNT, Element.USER_PNT ];

// > Element % (draw: Function(ctx: Context),
//               onframe: Function(time: Float))
function Element(draw, onframe) {
    this.id = guid();
    this.name = '';
    this.bstate = Element.createBaseState();
    this.state = Element.createState(this);
    this.astate = null;
    this.xdata = Element.createXData(this);
    this.children = [];
    this.parent = null;
    this.scene = null;
    this.visible = true; // user flag, set by user
    this.shown = false; // system flag, set by engine
    this.registered = false;
    this.disabled = false;
    this.rendering = false;
    this.__data = null;
    this._modifiers = [];
    this._painters = [];
    if (onframe) this.__modify({ type: Element.USER_MOD }, onframe);
    if (draw) this.__paint({ type: Element.USER_PNT }, draw);
    this.__lastJump = null;
    this.__jumpLock = false;
    this.__modifying = null; // current modifiers class, if modifying
    this.__painting = null; // current painters class, if painting
    this.__evtCache = [];
    this.__detachQueue = [];
    this.__frameProcessors = [];
    this._initHandlers(); // TODO: make automatic
    var _me = this,
        default_on = this.on;
    this.on = function(type, handler) {
        if (type & C.XT_CONTROL) {
            this.m_on.call(_me, type, handler);
        } else default_on.call(_me, type, handler);
    };
    Element.__addSysModifiers(this);
    Element.__addSysPainters(this);
    if (global_opts.liveDebug) Element.__addDebugRender(this);
}
Element.NO_BAND = null;
Element.DEFAULT_LEN = Infinity;
provideEvents(Element, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                         C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                         C.X_KPRESS, C.X_KUP, C.X_KDOWN,
                         C.X_DRAW, C.X_START, C.X_STOP,
                         // player events
                         C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_REPEAT,
                         C.S_LOAD, C.S_RES_LOAD, C.S_ERROR ]);
// > Element.prepare % () => Boolean
Element.prototype.prepare = function() {
    this.state._matrix.reset();
    return true;
}
// > Element.onframe % (gtime: Float) => Boolean
Element.prototype.onframe = function(ltime) {
    return this.__callModifiers(Element.ALL_MODIFIERS, ltime);
}
// > Element.drawTo % (ctx: Context)
Element.prototype.drawTo = function(ctx) {
    return this.__callPainters(Element.ALL_PAINTERS, ctx);
}
// > Element.draw % (ctx: Context)
Element.prototype.draw = Element.prototype.drawTo
// > Element.transform % (ctx: Context)
Element.prototype.transform = function(ctx) {
    var s = this.state,
        bs = this.bstate,
        as = Element._mergeStates(bs, s);
    this.astate = as;
    s._matrix = Element._getMatrixOf(as, s._matrix);
    ctx.globalAlpha *= as.alpha;
    s._matrix.apply(ctx);
    as._matrix = s._matrix;
    // FIXME: do not store matrix in a state here,
    // but return it
}
// > Element.render % (ctx: Context, gtime: Float)
Element.prototype.render = function(ctx, gtime) {
    if (this.disabled) return;
    this.rendering = true;
    // context is saved even before decision, if we draw or not, for safety:
    // because context anyway may be changed with user functions,
    // like modifiers who return false (and we do not want to restrict
    // user to do that)
    ctx.save();
    var drawMe = false;

    // checks if any time jumps (including repeat
    // modes) were performed
    var ltime = this.ltime(gtime);
    drawMe = this.__preRender(gtime, ltime, ctx);
    // fire band start/end events
    // FIXME: may not fire STOP on low-FPS, move an additional check
    // FIXME: masks have no scene set to something, but should to (see masks tests)
    if (this.scene && this.scene.__informEnabled) this.inform(ltime);
    if (drawMe) {
        drawMe = this.fits(ltime)
                 && this.onframe(ltime)
                 && this.prepare()
                 && this.visible;
    }
    if (drawMe) {
        // update global time with new local time (it may've been
        // changed if there were jumps or something), so children will
        // get the proper value
        gtime = this.gtime(ltime);
        if (!this.__mask) {
            // draw directly to context, if has no mask
            this.transform(ctx);
            this.draw(ctx);
            this.visitChildren(function(elm) {
                elm.render(ctx, gtime);
            });
        } else {
            // draw to back canvas, if has
            this.__ensureHasMaskCanvas();
            var mcvs = this.__maskCvs,
                mctx = this.__maskCtx,
                bcvs = this.__backCvs,
                bctx = this.__backCtx;

            var scene_width = this.scene.width,
                scene_height = this.scene.height,
                dbl_scene_width = scene_width * 2,
                dbl_scene_height = scene_height * 2;

            // at this point:
            // mcvs.height is twice scene height
            // mcvs.width  is twice scene width

            bctx.save();
            bctx.clearRect(0, 0, dbl_scene_width,
                                 dbl_scene_height);

            bctx.save();
            bctx.translate(scene_width, scene_height);
            this.transform(bctx);
            this.visitChildren(function(elm) {
                elm.render(bctx, gtime);
            });
            this.draw(bctx);
            bctx.restore();
            bctx.globalCompositeOperation = 'destination-in';

            mctx.save();
            mctx.clearRect(0, 0, dbl_scene_width,
                                 dbl_scene_height);
            mctx.translate(scene_width, scene_height);
            this.__mask.render(mctx, gtime);
            mctx.restore();

            bctx.drawImage(mcvs, 0, 0, dbl_scene_width,
                                       dbl_scene_height);
            bctx.restore();

            ctx.drawImage(bcvs, -scene_width, -scene_height,
                          dbl_scene_width, dbl_scene_height);
        }
    }
    // immediately when drawn, element becomes shown,
    // it is reasonable
    this.shown = drawMe;
    ctx.restore();
    this.__postRender();
    this.rendering = false;
    if (drawMe) this.fire(C.X_DRAW,ctx);
}
// > Element.addModifier % (( configuration: Object,
//                            modifier: Function(time: Float,
//                                               data: Any) => Boolean)
//                        | ( modifier: Function(time: Float,
//                                             data: Any) => Boolean,
//                            [easing: Function()],
//                            [data: Any],
//                            [priority: Int]
//                         ) => Integer
Element.prototype.addModifier = function(modifier, easing, data, priority) {
    if (__obj(modifier)) {
      // modifier is configuration here and easing is modifier factually
      modifier.type = Element.USER_MOD; // here, type should always be user-modifier
      return this.__modify(modifier, easing);
    } else {
      return this.__modify({ type: Element.USER_MOD,
                             priority: priority,
                             easing: easing,
                             data: data }, modifier);
    }
}
// > Element.addTModifier % (restriction: Array[Float, 2] | Float,
//                           modifier: Function(time: Float,
//                                              data: Any) => Boolean,
//                           [easing: Function()],
//                           [data: Any],
//                           [priority: Int]
//                          ) => Integer
Element.prototype.addTModifier = function(time, modifier, easing, data, priority) {
    return this.__modify({ type: Element.USER_MOD,
                           priority: priority,
                           time: time,
                           easing: easing,
                           data: data }, modifier);
}
// > Element.addRModifier % (modifier: Function(time: Float,
//                                             data: Any) => Boolean,
//                           [easing: Function()],
//                           [data: Any],
//                           [priority: Int]
//                          ) => Integer
Element.prototype.addRModifier = function(modifier, easing, data, priority) {
    return this.__modify({ type: Element.USER_MOD,
                           priority: priority,
                           easing: easing,
                           relative: true,
                           data: data }, modifier);
}
// > Element.addRTModifier % (restriction: Array[Float, 2] | Float,
//                            modifier: Function(time: Float,
//                                               data: Any) => Boolean,
//                            [easing: Function()],
//                            [data: Any],
//                            [priority: Int]
//                           ) => Integer
Element.prototype.addRTModifier = function(time, modifier, easing, data, priority) {
    return this.__modify({ type: Element.USER_MOD,
                           priority: priority,
                           time: time,
                           easing: easing,
                           relative: true,
                           data: data }, modifier);
}
// > Element.removeModifier % (modifier: Function)
Element.prototype.removeModifier = function(modifier) {
    if (!modifier.__m_ids) throw new AnimErr(Errors.A.MODIFIER_NOT_ATTACHED);
    //if (this.__modifying) throw new AnimErr("Can't remove modifiers while modifying");
    var id = modifier.__m_ids[this.id];
    delete modifier.__m_ids[this.id];
    if (!id) throw new AnimErr('Modifier wasn\'t applied to this element');
    var TB = Element.TYPE_MAX_BIT,
        PB = Element.PRRT_MAX_BIT;
    var type = id >> TB,
        priority = (id - (type << TB)) >> PB,
        i = id - (type << TB) - (priority << PB);
    this._modifiers[type][priority][i] = null;
}
// > Element.addPainter % (painter: Function(ctx: Context))
//                         => Integer
Element.prototype.addPainter = function(painter, data, priority) {
    return this.__paint({ type: Element.USER_PNT,
                          priority: priority,
                          data: data }, painter);
}
// > Element.removePainter % (painter: Function)
Element.prototype.removePainter = function(painter) {
    if (!painter.__p_ids) throw new AnimErr('Painter wasn\'t applied to anything');
    //if (this.__painting) throw new AnimErr("Can't remove painters while painting");
    var id = painter.__p_ids[this.id];
    delete painter.__p_ids[this.id];
    var TB = Element.TYPE_MAX_BIT,
        PB = Element.PRRT_MAX_BIT;
    var type = id >> TB,
        priority = (id - (type << TB)) >> PB,
        i = id - (type << TB) - (priority << PB);
    this._painters[type][priority][i] = null;
}
// > Element.addTween % (tween: Tween)
Element.prototype.addTween = function(tween) {
    return Element.__addTweenModifier(this, tween);
}
// > Element.changeTransform % (transform: Function(ctx: Context,
//                                                   prev: Function(Context)))
Element.prototype.changeTransform = function(transform) {
    this.transform = (function(elm, new_, prev) {
        return function(ctx) {
           new_.call(elm, ctx, prev);
        }
    } )(this, transform, this.transform);
}
// > Element.add % (elem: Element | Clip)
// > Element.add % (elems: Array[Element])
// > Element.add % (draw: Function(ctx: Context),
//                   onframe: Function(time: Float),
//                   [ transform: Function(ctx: Context,
//                                         prev: Function(Context)) ])
//                   => Element
Element.prototype.add = function(arg1, arg2, arg3) {
    if (arg2) { // element by functions mode
        var _elm = new Element(arg1, arg2);
        if (arg3) _elm.changeTransform(arg3);
        this._addChild(_elm);
        return _elm;
    } else if (__arr(arg1)) { // elements array mode
        this._addChildren(arg1);
    } else if (__builder(arg1)) { // builder instance
        this._addChild(arg1.v);
    } else { // element object mode
        this._addChild(arg1);
    }
}
Element.prototype.__safeDetach = function(what, _cnt) {
    var pos = -1, found = _cnt || 0;
    var children = this.children;
    if ((pos = children.indexOf(what)) >= 0) {
        if (this.rendering || what.rendering) {
            this.__detachQueue.push(what/*pos*/);
        } else {
            if (this.__unsafeToRemove) throw new AnimErr(Errors.A.UNSAFE_TO_REMOVE);
            what._unbind();
            children.splice(pos, 1);
        }
        return 1;
    } else {
        this.visitChildren(function(ielm) {
            found += ielm.__safeDetach(what, found);
        });
        return found;
    }
}
// > Element.remove % (elm: Element)
Element.prototype.remove = function(elm) {
    if (!elm) throw new AnimErr(Errors.A.NO_ELEMENT_TO_REMOVE);
    if (this.__safeDetach(elm) == 0) throw new AnimErr(Errors.A.NO_ELEMENT);
}
Element.prototype._unbind = function() {
    if (this.parent.__unsafeToRemove ||
        this.__unsafeToRemove) throw new AnimErr(Errors.A.UNSAFE_TO_REMOVE);
    this.parent = null;
    if (this.scene) this.scene._unregister(this);
    // this.scene should be null after unregistering
}
// > Element.detach % ()
Element.prototype.detach = function() {
    if (this.parent.__safeDetach(this) == 0) throw new AnimErr(Errors.A.ELEMENT_NOT_ATTACHED);
}
/* make element band fit all children bands */
// > Element.makeBandFit % ()
Element.prototype.makeBandFit = function() {
    var wband = this.findWrapBand();
    this.xdata.gband = wband;
    this.xdata.lband[1] = wband[1] - wband[0];
}
// > Element.setBand % (band: Array[2, Float])
Element.prototype.setBand = function(band) {
    this.xdata.lband = band;
    Bands.recalc(this);
}
// > Element.fits % (ltime: Float) -> Boolean
Element.prototype.fits = function(ltime) {
    if (ltime < 0) return false;
    return __t_cmp(ltime, this.xdata.lband[1] - this.xdata.lband[0]) <= 0;
}
// > Element.gtime % (ltime: Float) -> Float
Element.prototype.gtime = function(ltime) {
    return this.xdata.gband[0] + ltime;
}
// > Element.ltime % (gtime: Float) -> Float
Element.prototype.ltime = function(gtime) {
    var x = this.xdata;
    if (!__finite(x.gband[1])) return this.__checkJump(gtime - x.gband[0]);
    switch (x.mode) {
        case C.R_ONCE:
            return this.__checkJump(gtime - x.gband[0]);
        case C.R_STAY:
            return (__t_cmp(gtime, x.gband[1]) <= 0)
                   ? this.__checkJump(gtime - x.gband[0])
                   : this.__checkJump(x.lband[1] - x.lband[0]);
        case C.R_LOOP: {
                var p = this.parent,
                    px = p ? p.xdata : null;
                var durtn = x.lband[1] -
                            x.lband[0],
                    pdurtn = p
                        ? (px.lband[1] -
                           px.lband[0])
                        : durtn;
                if (durtn < 0) return -1;
                var ffits = (gtime - x.gband[0]) / durtn,
                    fits = Math.floor(ffits);
                if ((fits < 0) || (ffits > x.nrep)) return -1;
                var t = (gtime - x.gband[0]) - (fits * durtn);
                return this.__checkJump(t);
            }
        case C.R_BOUNCE: {
                var p = this.parent,
                    px = p ? p.xdata : null;
                var durtn = x.lband[1] -
                            x.lband[0],
                    pdurtn = p
                        ? (px.lband[1] -
                           px.lband[0])
                        : durtn;
                if (durtn < 0) return -1;
                var ffits = (gtime - x.gband[0]) / durtn,
                    fits = Math.floor(ffits);
                if ((fits < 0) || (ffits > x.nrep)) return -1;
                var t = (gtime - x.gband[0]) - (fits * durtn),
                    t = ((fits % 2) === 0) ? t : durtn - t;
                return this.__checkJump(t);
            }
    }
}
// > Element.handlePlayerEvent % (event: C.S_*, handler: Function(player: Player))
Element.prototype.handlePlayerEvent = function(event, handler) {
    if (!Player._isPlayerEvent(event)) throw new Error('This method is intended to assign only player-related handles');
    this.on(event, handler);
}
// > Element.inform % (ltime: Float)
Element.prototype.inform = function(ltime) {
    if (__t_cmp(ltime, 0) >= 0) {
        var duration = this.xdata.lband[1] - this.xdata.lband[0],
            cmp = __t_cmp(ltime, duration);
        if (!this.__firedStart) {
            this.fire(C.X_START, ltime, duration);
            this.__firedStart = true; // (store the counters for fired events?)
            // TODO: handle START event by changing band to start at given time?
        }
        if (cmp >= 0) {
            if (!this.__firedStop) {
                this.fire(C.X_STOP, ltime, duration);
                this.__firedStop = true;
                // TODO: handle STOP event by changing band to end at given time?
            }
        };
    };
}
// > Element.duration % () -> Float
Element.prototype.duration = function() {
    return this.xdata.lband[1] - this.xdata.lband[0];
}
/* TODO: duration cut with global band */
/* Element.prototype.rel_duration = function() {
    return
} */
Element.prototype._max_tpos = function() {
    return (this.xdata.gband[1] >= 0) ? this.xdata.gband[1] : 0;
}
/* Element.prototype.neg_duration = function() {
    return (this.xdata.lband[0] < 0)
            ? ((this.xdata.lband[1] < 0) ? Math.abs(this.xdata.lband[0] + this.xdata.lband[1]) : Math.abs(this.xdata.lband[0]))
            : 0;
} */
Element.prototype.m_on = function(type, handler) {
    return this.__modify({ type: Element.EVENT_MOD },
      function(t) { /* FIXME: handlers must have priority? */
        if (this.__evt_st & type) {
          var evts = this.__evts[type];
          for (var i = 0, el = evts.length; i < el; i++) {
              if (handler.call(this,evts[i],t) === false) return false;
          }
        }
    });
}
/*Element.prototype.posAtStart = function(ctx) {
    var s = this.state;
    ctx.translate(s.lx, s.ly);
    ctx.scale(s.sx, s.sy);
    ctx.rotate(s.angle);
}*/
// calculates band that fits all child elements, recursively
/* FIXME: test */
Element.prototype.findWrapBand = function() {
    var children = this.children;
    if (children.length === 0) return this.xdata.gband;
    var result = [ Infinity, 0 ];
    this.visitChildren(function(elm) {
        result = Bands.expand(result, elm.xdata.gband);
        //result = Bands.expand(result, elm.findWrapBand());
    });
    return (result[0] !== Infinity) ? result : null;
}
Element.prototype.dispose = function() {
    this.disposeHandlers();
    this.disposeXData();
    this.visitChildren(function(elm) {
        elm.dispose();
    });
}
Element.prototype.disposeXData = function() {
    if (this.xdata.path) this.xdata.path.dispose();
    if (this.xdata.text) this.xdata.text.dispose();
    if (this.xdata.sheet) this.xdata.sheet.dispose();
}
Element.prototype.reset = function() {
    this.__resetState();
    this.__lastJump = null;
    this.__firedStart = false;
    this.__firedStop = false;
    if (this.__mask) this.__removeMaskCanvases();
    /*this.__clearEvtState();*/
    (function(elm) {
        elm.__forAllModifiers(function(modifier) {
            if (modifier.__wasCalled) modifier.__wasCalled[elm.id] = false;
            if (modifier.__wasCalledAt) modifier.__wasCalledAt[elm.id] = -1;
        });
    })(this);
    this.visitChildren(function(elm) {
        elm.reset();
    });
}
Element.prototype.visitChildren = function(func) {
    var children = this.children;
    this.__unsafeToRemove = true;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        func(children[ei]);
    };
    this.__unsafeToRemove = false;
}
Element.prototype.travelChildren = function(func) {
    var children = this.children;
    this.__unsafeToRemove = true;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        var elem = children[ei];
        func(elem);
        elem.travelChildren(func);
    };
    this.__unsafeToRemove = false;
}
Element.prototype.iterateChildren = function(func, rfunc) {
    this.__unsafeToRemove = true;
    iter(this.children).each(func, rfunc);
    this.__unsafeToRemove = false;
}
Element.prototype.hasChildren = function() {
    return this.children.length > 0;
}
Element.prototype.deepIterateChildren = function(func, rfunc) {
    this.__unsafeToRemove = true;
    iter(this.children).each(function(elem) {
        elem.deepIterateChildren(func, rfunc);
        return func(elem);
    }, rfunc);
    this.__unsafeToRemove = false;
}
Element.prototype.__performDetach = function() {
    var children = this.children;
    iter(this.__detachQueue).each(function(elm) {
        if ((idx = children.indexOf(elm)) >= 0) {
            children.splice(idx, 1);
            elm._unbind();
        }
    });
    this.__detachQueue = [];
}
Element.prototype.clear = function() {
    if (this.__unsafeToRemove) throw new AnimErr(Errors.A.UNSAFE_TO_REMOVE);
    if (!this.rendering) {
        var children = this.children;
        this.children = [];
        iter(children).each(function(elm) { elm._unbind(); });
    } else {
        this.__detachQueue = this.__detachQueue.concat(this.children);
    }
}
Element.prototype.lock = function() {
    this.__jumpLock = true;
    this.__lstate = obj_clone(this.state);
    this.__pstate = this._state ? obj_clone(this._state) : null;
}
Element.prototype.unlock = function() {
    var result = this.state;
    this.state = this.__lstate;
    this._state = this.__pstate;
    this.__lstate = null;
    this.__jumpLock = false;
    return result;
}
Element.prototype.stateAt = function(t) { /* FIXME: test */
    this.lock();
    var success = this.__callModifiers(Element.NOEVT_MODIFIERS, t);
    var state = this.unlock();
    return success ? Element._mergeStates(this.bstate, state) : null;
}
Element.prototype.getPosition = function() {
    return [ this.bstate.x + this.state.x,
             this.bstate.y + this.state.y ];
}
Element.prototype.offset = function() {
    var xsum = 0, ysum = 0;
    var p = this.parent;
    while (p) {
        var pbs = p.bstate,
            ps = p.state;
        xsum += pbs.x + ps.x;
        ysum += pbs.y + ps.y;
        p = p.parent;
    }
    return [ xsum, ysum ];
}
/*Element.prototype.local = function(pt) {
    var off = this.offset();
    return [ pt[0] - off[0], pt[1] - off[1] ];
}
Element.prototype.global = function(pt) {
    var off = this.offset();
    return [ pt[0] + off[0], pt[1] + off[1] ];
} */
Element.prototype.dimen = function() {
    // TODO: allow to set _dimen?
    if (this._dimen) return this._dimen;
    var x = this.xdata;
    var subj = x.path || x.text || x.sheet;
    if (subj) return subj.dimen();
}
Element.prototype.lbounds = function() {
    var x = this.xdata;
    var subj = x.path || x.text || x.sheet;
    if (subj) return subj.bounds();
}
Element.prototype.lrect = function() {
    var b = this.lbounds();
    if (!b) return null;
    // returns clockwise coordinates of the points
    // for easier drawing
          // minX, minY, maxX, minY,
    return [ b[0], b[1], b[2], b[1],
          // maxX, maxY, minX, maxY
             b[2], b[3], b[0], b[3] ];
}
Element.prototype.setMask = function(elm) {
    if (!elm) throw new AnimErr('No valid masking element was passed');
    if (this.scene) this.__ensureHasMaskCanvas();
    this.__mask = elm;
}
Element.prototype.__ensureHasMaskCanvas = function() {
    if (this.__maskCvs || this.__backCvs) return;
    //console.log('creating mask and back canvases for ' + this.id + ' ' + this.name);
    var scene = this.scene;
    if (!scene) throw new AnimErr('Element to be masked should be attached to scene when rendering');
    this.__maskCvs = newCanvas([scene.width * 2, scene.height * 2], this.state.ratio);
    this.__maskCtx = this.__maskCvs.getContext('2d');
    this.__backCvs = newCanvas([scene.width * 2, scene.height * 2], this.state.ratio);
    this.__backCtx = this.__backCvs.getContext('2d');
    /* $doc.body.appendChild(this.__maskCvs); */
    /* $doc.body.appendChild(this.__backCvs); */
}
Element.prototype.__removeMaskCanvases = function() {
    if (this.__maskCvs) {
        //console.log('removing mask canvas for ' + this.id + ' ' + this.name);
        disposeElm(this.__maskCvs);
        this.__maskCvs = null;
        this.__maskCtx = null;
    }
    if (this.__backCvs) {
        //console.log('removing back canvas for ' + this.id + ' ' + this.name);
        disposeElm(this.__backCvs);
        this.__backCvs = null;
        this.__backCtx = null;
    }
}
Element.prototype.clearMask = function() {
    this.__mask = null;
    this.__removeMaskCanvases();
}
Element.prototype.data = function(val) {
  if (typeof val !== 'undefined') return (this.__data = val);
  return this.__data;
}
Element.prototype.toString = function() {
    var buf = [ '[ Element ' ];
    buf.push('\'' + (this.name || this.id) + '\' ');
    /*if (this.children.length > 0) {
        buf.push('( ');
        this.visitChildren(function(child) {
            buf.push(child.toString() + ', ');
        });
        buf.push(') ');
    }
    if (this.parent) {
        buf.push('< \'' + (this.parent.name || this.parent.id) + '\' > ');
    }*/
    buf.push(']');
    return buf.join("");
}
Element.prototype.clone = function() {
    var clone = new Element();
    clone.name = this.name;
    clone.children = [].concat(this.children);
    clone._modifiers = [].concat(this._modifiers);
    clone._painters = [].concat(this._painters);
    clone.xdata = obj_clone(this.xdata);
    clone.xdata.$ = clone;
    clone.__data = this.__data;
    return clone;
}
Element.prototype.deepClone = function() {
    var clone = this.clone();
    clone.children = [];
    var src_children = this.children;
    var trg_children = clone.children;
    for (var sci = 0, scl = src_children.length; sci < scl; sci++) {
        var csrc = src_children[sci],
            cclone = csrc.deepClone();
        cclone.parent = clone;
        trg_children.push(cclone);
    }
    clone._modifiers = [];
    /* FIXME: use __forAllModifiers & __forAllPainters */
    // loop through type
    for (var mti = 0, mtl = this._modifiers.length; mti < mtl; mti++) {
        var type_group = this._modifiers[mti];
        if (!type_group) continue;
        clone._modifiers[mti] = [];
        // loop through priority
        for (var mpi = 0, mpl = type_group.length; mpi < mpl; mpi++) {
            var priority_group = type_group[mpi];
            if (!priority_group) continue;
            clone._modifiers[mti][mpi] = [].concat(priority_group);
            for (mi = 0, ml = priority_group.length; mi < ml; mi++) {
                var modifier = priority_group[mi];
                if (modifier && modifier.__m_ids) {
                    modifier.__m_ids[clone.id] = modifier.__m_ids[this.id];
                }
            }
        }
    }
    clone._painters = [];
    // loop through type
    for (var pti = 0, ptl = this._painters.length; pti < ptl; pti++) {
        var type_group = this._painters[pti];
        if (!type_group) continue;
        clone._painters[pti] = [];
        // loop through priority
        for (var ppi = 0, ppl = type_group.length; ppi < ppl; ppi++) {
            var priority_group = type_group[ppi];
            if (!priority_group) continue;
            clone._painters[pti][ppi] = [].concat(priority_group);
            for (pi = 0, pl = priority_group.length; pi < pl; pi++) {
                var painter = priority_group[pi];
                if (painter && painter.__p_ids) {
                    painter.__p_ids[clone.id] = painter.__p_ids[this.id];
                }
            }
        }
    }
    clone.__data = obj_clone(this.__data);
    var src_x = this.xdata,
        trg_x = clone.xdata;
    if (src_x.path) trg_x.path = src_x.path.clone();
    if (src_x.text) trg_x.text = src_x.text.clone();
    if (src_x.sheet) trg_x.sheet = src_x.sheet.clone();
    trg_x.pos = [].concat(src_x.pos);
    trg_x.pvt = [].concat(src_x.pvt);
    trg_x.reg = [].concat(src_x.reg);
    trg_x.lband = [].concat(src_x.lband);
    trg_x.gband = [].concat(src_x.gband);
    trg_x.keys = obj_clone(src_x.keys);
    return clone;
}
Element.prototype._addChild = function(elm) {
    elm.parent = this;
    this.children.push(elm); /* or add elem.id? */
    if (this.scene) this.scene._register(elm); /* TODO: rollback parent and child? */
    Bands.recalc(this);
}
Element.prototype._addChildren = function(elms) {
    for (var ei = 0, el = elms.length; ei < el; ei++) {
        this._addChild(elms[ei]);
    }
}
Element.prototype._stateStr = function() {
    var state = this.state;
    return "x: " + s.x + " y: " + s.y + '\n' +
           "sx: " + s.sx + " sy: " + s.sy + '\n' +
           "angle: " + s.angle + " alpha: " + s.alpha + '\n' +
           "p: " + s.p + " t: " + s.t + " key: " + s.key + '\n';
}
Element.prototype.__adaptModTime = function(ltime, conf, state, modifier) {
  var lband = this.xdata.lband,
      elm_duration = lband[1] - lband[0],
      easing = conf.easing,
      time = conf.time, // time or band of the modifier, if set
      relative = conf.relative;
  var _tpair = null;
  if (time == null) {
      _tpair = [ relative
                     ? __adjust(ltime) / __adjust(elm_duration)
                     : __adjust(ltime),
                 __adjust(elm_duration) ];
  } else if (__arr(time)) { // modifier is band-restricted
      var band = time;
      if (!relative) {
          var mod_duration = band[1] - band[0];
          if (__t_cmp(ltime, band[0]) < 0) return false;
          if (__t_cmp(ltime, band[1]) > 0) return false;
          _tpair = [ __adjust(ltime - band[0]),
                     __adjust(mod_duration) ];
      } else {
          var abs_band = [ band[0] * elm_duration,
                           band[1] * elm_duration ];
          var mod_duration = abs_band[1] - abs_band[0];
          if (__t_cmp(ltime, abs_band[0]) < 0) return false;
          if (__t_cmp(ltime, abs_band[1]) > 0) return false;
          _tpair = [ __adjust(ltime - abs_band[0]) / __adjust(mod_duration),
                     __adjust(mod_duration) ];
      }
  } else if (__num(time)) {
      if (modifier.__wasCalled && modifier.__wasCalled[this.id]) return false;
      var tpos = relative ? (time * elm_duration) : time;
      if (__t_cmp(ltime, tpos) >= 0) {
          if (!modifier.__wasCalled) modifier.__wasCalled = {};
          if (!modifier.__wasCalledAt) modifier.__wasCalledAt = {};
          modifier.__wasCalled[this.id] = true;
          modifier.__wasCalledAt[this.id] = ltime;
      } else return false;
      _tpair = [ relative
                     ? __adjust(ltime) / __adjust(elm_duration)
                     : __adjust(ltime),
                 __adjust(elm_duration) ];
  } else _tpair = [ relative
                        ? __adjust(ltime) / __adjust(elm_duration)
                        : __adjust(ltime),
                    __adjust(elm_duration) ];
  return !easing ? _tpair : [ easing(_tpair[0], _tpair[1]), _tpair[1] ];
}
Element.prototype.__callModifiers = function(order, ltime) {
    return (function(elm) {

        // save the previous state
        elm.state._ = null; // clear the pointer, so it will not be cloned
        elm._state = Element.createState(elm);
        elm._state._ = obj_clone(elm.state);

        // now it looks like:
        //
        //     this.
        //         .state    -> state from the last modifiers call
        //         ._state   -> clone of the last state, it is passed to modifiers as `this`
        //         ._state._ -> a pointer to the last state, so it will be accessible in
        //                      modifiers as `this._`

        elm.__loadEvts(elm._state);

        if (!elm.__forAllModifiers(order,
            function(modifier, conf) { /* each modifier */
                // lbtime is band-apadted time, if modifier has its own band
                var lbtime = elm.__adaptModTime(ltime, conf, elm._state, modifier);
                // `false` will be returned from `__adaptModTime`
                // for trigger-like modifier if it is required to skip current one,
                // on the other hand `true` in `forAllModifiers` means
                // "skip this one, but not finish the whole process",
                // FIXME: this unobvious line
                if (lbtime === false) return true;
                // modifier will return false if it is required to skip all next modifiers,
                // returning false from our function means the same
                return modifier.call(elm._state, lbtime[0], lbtime[1], conf.data);
            }, function(type) { /* before each new type */
                elm.__modifying = type;
                elm.__mbefore(type);
            }, function(type) { /* after each new type */
                elm.__mafter(ltime, type, true);
            })) { // one of modifiers returned false
                // forget things...
                elm.__mafter(ltime, elm.__modifying, false);
                elm.__modifying = null;
                elm.__clearEvts(elm._state);
                // NB: nothing happens to the state or element here,
                //     the modified things are not applied
                return false; // ...and get out of the function
            };

        elm.__modifying = null;
        elm._state._applied = true;
        elm._state._appliedAt = ltime;

        elm.__clearEvts(elm._state);

        // save modified state as last
        elm.state = elm._state;
        elm._state = null;
        // state._ keeps pointing to prev state

        // apply last state
        return true;
    })(this);
}
Element.prototype.__callPainters = function(order, ctx) {
    (function(elm) {
        elm.__forAllPainters(order,
            function(painter, conf) { /* each painter */
                painter.call(elm.xdata, ctx, conf.data);
            }, function(type) { /* before each new type */
                elm.__painting = type;
                elm.__pbefore(ctx, type);
            }, function(type) { /* after each new type */
                elm.__pafter(ctx, type);
            });
        elm.__painting = null;
    })(this);
}
//Element.prototype.__addTypedModifier = function(type, priority, band, modifier, easing, data) {
Element.prototype.__addTypedModifier = function(conf, modifier) {
    if (!modifier) throw new AnimErr(Errors.A.NO_MODIFIER_PASSED);
    var modifiers = this._modifiers;
    var elm_id = this.id;
    if (!modifier.__m_ids) modifier.__m_ids = {};
    else if (modifier.__m_ids[elm_id]) throw new AnimErr(Errors.A.MODIFIER_REGISTERED);
    var priority = conf.priority || 0,
        type = conf.type;
    if (!modifiers[type]) modifiers[type] = [];
    if (!modifiers[type][priority]) modifiers[type][priority] = [];
    modifiers[type][priority].push([ modifier, { type: type, // configuration is cloned for safety
                                                 priority: priority,
                                                 time: conf.time,
                                                 relative: conf.relative,
                                                 easing: Element.__convertEasing(conf.easing, null, conf.relative),
                                                 data: conf.data } ]);
    modifier.__m_ids[elm_id] = (type << Element.TYPE_MAX_BIT) | (priority << Element.PRRT_MAX_BIT) |
                               (modifiers[type][priority].length - 1);
    return modifier;
}
Element.prototype.__modify = Element.prototype.__addTypedModifier; // quick alias
Element.prototype.__forAllModifiers = function(order, f, before_type, after_type) {
    var modifiers = this._modifiers;
    var type, seq, cur;
    for (var typenum = 0, last = order.length;
         typenum < last; typenum++) {
        type = order[typenum];
        seq = modifiers[type];
        if (before_type) before_type(type);
        if (seq) {
          for (var pi = 0, pl = seq.length; pi < pl; pi++) { // by priority
            if (cur = seq[pi]) {
              for (var ci = 0, cl = cur.length; ci < cl; ci++) {
                var modifier;
                if (modifier = cur[ci]) {
                  if (f(modifier[0], modifier[1]) === false) return false;
                } /* if cur[ci] */
              } /* for var ci */
            } /* if cur = seq[pi] */
          } /* for var pi */
        } /* if seq */
        if (after_type) after_type(type);
    }
    return true;
}
Element.prototype.__addTypedPainter = function(conf, painter) {
    if (!painter) throw new AnimErr(Errors.A.NO_PAINTER_PASSED);
    var painters = this._painters;
    var elm_id = this.id;
    if (!painter.__p_ids) painter.__p_ids = {};
    else if (painter.__p_ids[elm_id]) throw new AnimErr(Errors.A.PAINTER_REGISTERED);
    var priority = conf.priority || 0,
        type = conf.type;
    if (!painters[type]) painters[type] = [];
    if (!painters[type][priority]) painters[type][priority] = [];
    painters[type][priority].push([ painter, { type: type, // configuration is cloned for safety
                                               priority: priority,
                                               data: conf.data } ]);
    painter.__p_ids[elm_id] = (type << Element.TYPE_MAX_BIT) | (priority << Element.PRRT_MAX_BIT) |
                              (painters[type][priority].length - 1);
    return painter;
}
Element.prototype.__paint = Element.prototype.__addTypedPainter; // quick alias
Element.prototype.__forAllPainters = function(order, f, before_type, after_type) {
    var painters = this._painters;
    var type, seq, cur;
    for (var typenum = 0, last = order.length;
         typenum < last; typenum++) {
        type = order[typenum];
        seq = painters[type];
        if (before_type) before_type(type);
        if (seq) {
          for (var pi = 0, pl = seq.length; pi < pl; pi++) { // by priority
            if (cur = seq[pi]) {
              for (var ci = 0, cl = cur.length; ci < cl; ci++) {
                if (cur[ci]) f(cur[ci][0], cur[ci][1]);
              }
            }
          }
        }
        if (after_type) after_type(type);
    }
    return true;
}
Element.prototype.__mbefore = function(t, type) {
    /*if (type === Element.EVENT_MOD) {
        this.__loadEvtsFromCache();
    }*/
}
Element.prototype.__mafter = function(t, type, result) {
    /*if (!result || (type === Element.USER_MOD)) {
        this.__lmatrix = Element._getIMatrixOf(this.bstate, this.state);
    }*/
    /*if (!result || (type === Element.EVENT_MOD)) {
        this.__clearEvtState();
    }*/
}
Element.prototype.__pbefore = function(ctx, type) { }
Element.prototype.__pafter = function(ctx, type) { }
Element.prototype.__checkJump = function(at) {
    // FIXME: test if jumping do not fails with floating points problems
    var x = this.xdata,
        s = this.state;
    if (x.tf) return x.tf(at);
    var t = null,
        duration = x.lband[1] - x.lband[0];
    // if jump-time was set either
    // directly or relatively or with key,
    // get its absolute local value
    t = (s.p !== null) ? s.p : null;
    t = ((t === null) && (s.t !== null))
        ? s.t * duration
        : t;
    t = ((t === null) && (s.key !== null))
        ? x.keys[s.key]
        : t;
    if (t !== null) {
        if ((t < 0) || (t > duration)) {
            throw new AnimErr('failed to calculate jump');
        }
        if (!this.__jumpLock) {
            // jump was performed if t or rt or key
            // were set:
            // save jump time and return it
            this.__lastJump = [ at, t ];
            s.p = null;
            s.t = null;
            s.key = null;
            return t;
        }
    }
    // set t to jump-time, and if no jump-time
    // was passed or it requires to be ignored,
    // just set it to actual local time
    t = (t !== null) ? t : at;
    if (this.__lastJump !== null) {
       /* return (jump_pos + (t - jumped_at)) */
       return this.__lastJump[1] + (t - this.__lastJump[0]);
       // overflow will be checked in fits() method,
       // or recalculated with loop/bounce mode
       // so if this clip longs more than allowed,
       // it will be just ended there
       /* return ((this.__lastJump + t) > x.gband[1])
             ? (this.__lastJump + t)
             : x.gband[1]; */
    }
    return t;
}
Element.prototype.handle__x = function(type, evt) {
    if (!Player._isPlayerEvent(type)
        && (type != C.X_START)
        && (type != C.X_STOP)) {
      if (this.shown) {
        this.__saveEvt(type, evt);
      } else {
        return false;
      }
    }
    return true;
}
Element.prototype.__saveEvt = function(type, evt) {
    this.__evtCache.push([type, evt]);
}
Element.prototype.__loadEvts = function(to) {
    var cache = this.__evtCache;
    var cache_len = cache.length;
    this.__clearEvts(to);
    if (cache_len > 0) {
        var edata, type, evts;
        for (var ei = 0; ei < cache_len; ei++) {
            edata = cache[ei];
            type = edata[0];
            to.__evt_st |= type;
            evts = to.__evts;
            if (!evts[type]) evts[type] = [];
            evts[type].push(edata[1]);
        }
        this.__evtCache = [];
    }
}
Element.prototype.__clearEvts = function(from) {
    from.__evt_st = 0; from.__evts = {};
}
Element.prototype.__preRender = function(gtime, ltime, ctx) {
    var cr = this.__frameProcessors;
    for (var i = 0, cl = cr.length; i < cl; i++) {
        if (cr[i].call(this, gtime, ltime, ctx) === false) return false;
    }
    return true;
}
Element.prototype.__postRender = function() {
    // clear detach-queue
    this.__performDetach();
}
Element.prototype.__resetState = function() {
    var s = this.state;
    s.x = 0; s.y = 0;
    s.angle = 0; s.alpha = 1;
    s.sx = 1; s.sy = 1;
    s.p = null; s.t = null; s.key = null;
    s._applied = false;
    s._appliedAt = null;
    s._matrix.reset();
}
Element.prototype._hasRemoteResources = function() {
    if (this.xdata.sheet) return true;
}
Element.prototype._getRemoteResources = function() {
    if (!this.xdata.sheet) return null;
    return [ this.xdata.sheet.src ];
}

// base (initial) state of the element
Element.createBaseState = function() {
    return { 'x': 0, 'y': 0,   // dynamic position
             'angle': 0,       // rotation angle
             'sx': 1, 'sy': 1, // scale by x / by y
             'hx': 0, 'hy': 0, // shear by x / by y
             'alpha': 1,       // opacity
             'p': null, 't': null, 'key': null };
                               // cur local time (p) or 0..1 time (t) or by key (p have highest priority),
                               // if both are null — stays as defined
}
// state of the element
Element.createState = function(owner) {
    return { 'x': 0, 'y': 0,   // dynamic position
             'angle': 0,       // rotation angle
             'sx': 1, 'sy': 1, // scale by x / by y
             'hx': 0, 'hy': 0, // shear by x / by y
             'alpha': 1,       // opacity
             'p': null, 't': null, 'key': null,
                               // cur local time (p) or 0..1 time (t) or by key (p have highest priority),
                               // if both are null — stays as defined
             '_matrix': new Transform(),
             '_evts': {},
             '_evt_st': 0,
             '$': owner };
};
// geometric data of the element
Element.createXData = function(owner) {
    return { 'pvt': Element.DEFAULT_PVT,      // pivot (relative to dimensions)
             'reg': Element.DEFAULT_REG,      // registration point (static values)
             'path': null,     // Path instanse, if it is a shape
             'text': null,     // Text data, if it is a text (`path` holds stroke and fill)
             'sheet': null,    // Sheet instance, if it is an image or a sprite sheet
             'mode': C.R_ONCE,            // playing mode,
             'nrep': Infinity,        // number of repetions for the mode
             'lband': [0, Element.DEFAULT_LEN], // local band
             'gband': [0, Element.DEFAULT_LEN], // global band
             'keys': {},       // aliases for time jumps
             'tf': null,       // time jumping function
             'acomp': null,    // alpha composition
             '_mpath': null,
             '$': owner };
}
Element.__addSysModifiers = function(elm) {
    // band check performed in checkJump
    /* if (xdata.gband) this.__modify(Element.SYS_MOD, 0, null, Render.m_checkBand, xdata.gband); */
    // elm.__modify({ type: Element.SYS_MOD }, Render.m_saveReg);
    // elm.__modify({ type: Element.SYS_MOD }, Render.m_applyPos);
}
Element.__addSysPainters = function(elm) {
    elm.__paint({ type: Element.SYS_PNT }, Render.p_usePivot);
    elm.__paint({ type: Element.SYS_PNT }, Render.p_useReg);
    elm.__paint({ type: Element.SYS_PNT }, Render.p_applyAComp);
    elm.__paint({ type: Element.SYS_PNT }, Render.p_drawXData);
}
Element.__addDebugRender = function(elm) {
    elm.__paint({ type: Element.DEBUG_PNT }, Render.p_drawPivot);
    elm.__paint({ type: Element.DEBUG_PNT }, Render.p_drawReg);
    elm.__paint({ type: Element.DEBUG_PNT }, Render.p_drawName);
    elm.__paint({ type: Element.DEBUG_PNT,
                     priority: 1 },
                   Render.p_drawMPath);
}
Element.__addTweenModifier = function(elm, conf) {
    //if (!conf.type) throw new AnimErr('Tween type is not defined');
    var tween_f = Tweens[conf.type](),
        m_tween;
    // all tweens functions actually work with 0..1 parameter, but modifiers
    // differ by 'relative' option
    if (conf.relative) {
      m_tween = tween_f;
    } else {
      m_tween = function(t, duration, data) {
        return tween_f.call(this, t / duration, duration, data);
      };
    }
    return elm.__modify({ type: Element.TWEEN_MOD,
                          priority: Tween.TWEENS_PRIORITY[conf.type],
                          time: conf.band || conf.time,
                          relative: conf.relative,
                          easing: conf.easing,
                          data: conf.data }, m_tween);
}
Element.__convertEasing = function(easing, data, relative) {
    if (!easing) return null;
    if (__str(easing)) {
        var f = EasingImpl[easing](data);
        return relative ? f : function(t, len) { return f(t / len, len) * len; }
    }
    if (__fun(easing) && !data) return easing;
    if (__fun(easing) && data) return easing(data);
    if (easing.type) {
        var f = EasingImpl[easing.type](easing.data || data);
        return relative ? f : function(t, len) { return f(t / len, len) * len; }
    }
    if (easing.f) return easing.f(easing.data || data);
}
Element._mergeStates = function(s1, s2) {
    return {
        x: s1.x + s2.x, y: s1.y + s2.y,
        sx: s1.sx * s2.sx, sy: s1.sy * s2.sy,
        hx: s1.hx + s2.hx, hy: s1.hy + s2.hy,
        angle: s1.angle + s2.angle,
        alpha: s1.alpha * s2.alpha
    }
}
Element._getMatrixOf = function(s, m) {
    var _t = (m ? (m.reset(), m)
                : new Transform());
    _t.translate(s.x, s.y);
    _t.rotate(s.angle);
    _t.scale(s.sx, s.sy);
    _t.shear(s.hx, s.hy);
    return _t;
}
Element._getIMatrixOf = function(s, m) {
    var _t = Element._getMatrixOf(s, m);
    _t.invert();
    return _t;
}
/* TODO: add createFromImgUrl?
 Element.imgFromURL = function(url) {
    return new Sheet(url);
}*/

var Clip = Element;

// Events
// -----------------------------------------------------------------------------

function kevt(e) {
    return { key: ((e.keyCode != null) ? e.keyCode : e.which),
             ch: e.charCode };
}

function mevt(e, cvs) {
    return { pos: [ e.pageX - cvs.__rOffsetLeft,
                    e.pageY - cvs.__rOffsetTop ] };
}

// Import
// -----------------------------------------------------------------------------

var L = {}; // means "Loading/Loader"

L.loadFromUrl = function(player, url, importer, callback) {
    if (!JSON) throw new SysErr(Errors.S.NO_JSON_PARSER);

    player._drawLoadingSplash(_strf(Strings.LOADING_ANIMATION, [url.substring(0, 50)]));

    ajax(url, function(req) {
        L.loadFromObj(player, JSON.parse(req.responseText), importer, callback);
    });
}
L.loadFromObj = function(player, object, importer, callback) {
    if (!importer) throw new PlayerErr(Errors.P.NO_IMPORTER_TO_LOAD_WITH);
    if (importer.configureAnim) {
        player.configureAnim(importer.configureAnim(object));
    }
    if (importer.configureMeta) {
        player.configureMeta(importer.configureMeta(object));
    }
    L.loadScene(player, importer.load(object), callback);
}
L.loadScene = function(player, scene, callback) {
    if (player.anim) player.anim.dispose();
    // add debug rendering
    if (player.state.debug
        && !global_opts.liveDebug)
        scene.visitElems(Element.__addDebugRender); /* FIXME: ensure not to add twice */
    // assign
    player.anim = scene;
    // update duration
    if (player.state.duration == undefined) {
        var _duration;
        if (scene.duration !== undefined) { _duration = scene.duration; }
        else {
          if (player.mode & C.M_INFINITE_DURATION) { _duration = Infinity; }
          else {
            if (scene.isEmpty()) { _duration = 0; }
            else { _duration = Scene.DEFAULT_LEN; }
          }
        }
        scene.setDuration(_duration);
        player.setDuration(_duration);
    }
    if ((scene.width === undefined) && (scene.height === undefined)) {
        scene.width = player.state.width;
        scene.height = player.state.height;
    }
    if (callback) callback.call(player, scene);
}
L.loadClips = function(player, clips, callback) {
    var _anim = new Scene();
    _anim.add(clips);
    L.loadScene(player, _anim, callback);
}
L.loadBuilder = function(player, builder, callback) {
    var _anim = new Scene();
    _anim.add(builder.v);
    if (builder.d != undefined) _anim.setDuration(builder.d);
    L.loadScene(player, _anim, callback);
}

// Rendering
// -----------------------------------------------------------------------------

var Render = {}; // means "Render", render loop + system modifiers & painters

// functions below, the ones named in a way like `__r_*` are the real functions
// acting under their aliases `Render.*`; it is done this way because probably
// the separate function which is not an object propertly, will be a bit faster to
// access during animation loop

// draws current state of animation on canvas and postpones to call itself for
// the next time period (so to start animation, you just need to call it once
// when the first time must occur and it will chain its own calls automatically)
function __r_loop(ctx, pl_state, scene, before, after, before_render, after_render) {
    if (pl_state.happens !== C.PLAYING) return;

    var msec = (Date.now() - pl_state.__startTime);
    var sec = msec / 1000;

    var time = (sec * pl_state.speed) + pl_state.from;
    pl_state.time = time;

    if (before) {
        if (!before(time)) return;
    }

    if (pl_state.__rsec === 0) pl_state.__rsec = msec;
    if ((msec - pl_state.__rsec) >= 1000) {
        pl_state.afps = pl_state.__redraws;
        pl_state.__rsec = msec;
        pl_state.__redraws = 0;
    }
    pl_state.__redraws++;

    __r_at(time, ctx, pl_state, scene, before_render, after_render);

    // show fps
    if (pl_state.debug) { // TODO: move to player.onrender
        __r_fps(ctx, pl_state.afps, time);
    }

    if (after) {
        if (!after(time)) return;
    }

    if (pl_state.__supressFrames) return;

    return __nextFrame(function() {
        __r_loop(ctx, pl_state, scene, before, after, before_render, after_render);
    })
}
function __r_at(time, ctx, pl_state, scene, before, after) {
    ctx.save();
    var ratio = pl_state.ratio;
    if (ratio != 1) ctx.scale(ratio, ratio);
    var size_differs = (pl_state.width  != scene.width) ||
                       (pl_state.height != scene.height);
    if (!size_differs) {
        ctx.clearRect(0, 0, scene.width,
                          scene.height);
        if (before) before(time, ctx);
        scene.render(ctx, time, pl_state.zoom/*, pl_state.afps*/);
        if (after) after(time, ctx);
        ctx.restore();
    } else {
        __r_with_ribbons(ctx, pl_state.width, pl_state.height,
                              scene.width, scene.height,
            function(_scale) {
              ctx.clearRect(0, 0, scene.width, scene.height);
              if (before) before(time, ctx);
              scene.render(ctx, time, pl_state.zoom/*, pl_state.afps*/);
              if (after) after(time, ctx);
              ctx.restore();
            });
    }
}
function __r_with_ribbons(ctx, pw, ph, sw, sh, draw_f) {
    var xw = pw / sw,
        xh = ph / sh;
    var x = Math.min(xw, xh);
    var hcoord = (pw - sw * x) / 2,
        vcoord = (ph - sh * x) / 2;
    var scaled = (xw != 1) || (xh != 1);
    if (scaled) {
        ctx.save();
        ctx.save();
        ctx.fillStyle = '#000';
        if (hcoord != 0) {
          ctx.fillRect(0, 0, hcoord, ph);
          ctx.fillRect(hcoord + (sw * x), 0, hcoord, ph);
        }
        if (vcoord != 0) {
          ctx.fillRect(0, 0, pw, vcoord);
          ctx.fillRect(0, vcoord + (sh * x), pw, vcoord);
        }
        ctx.restore();
        ctx.beginPath();
        ctx.rect(hcoord, vcoord, sw * x, sh * x);
        ctx.clip();
        ctx.translate(hcoord, vcoord);
        ctx.scale(x, x);
    }
    draw_f(x);
    if (scaled) {
        ctx.restore();
    }
}
function __r_fps(ctx, fps, time) {
    ctx.fillStyle = '#999';
    ctx.font = '20px sans-serif';
    ctx.fillText(Math.floor(fps), 8, 20);
    ctx.font = '10px sans-serif';
    ctx.fillText(Math.floor(time * 1000) / 1000, 8, 35);
}
Render.loop = __r_loop;
Render.at = __r_at;
Render._drawFPS = __r_fps;

Render.p_drawPivot = function(ctx, pvt) {
    if (!(pvt = pvt || this.pvt)) return;
    var dimen = this.$.dimen() || [ 0, 0 ];
    var stokeStyle = dimen ? '#600' : '#f00';
    ctx.save();
    // WHY it is required??
    ctx.translate(pvt[0] * dimen[0],
                  pvt[1] * dimen[1]);
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = stokeStyle;
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 0);
    ctx.moveTo(3, 0);
    //ctx.moveTo(0, 5);
    ctx.arc(0,0,3,0,Math.PI*2,true);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

Render.p_drawReg = function(ctx, reg) {
    if (!(reg = reg || this.reg)) return;
    ctx.save();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#00f';
    ctx.fillStyle = 'rgba(0,0,255,.3)';
    // WHY it is required??
    ctx.translate(reg[0], reg[1]);
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 0);
    ctx.moveTo(3, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}
// TODO: p_drawReg

Render.p_drawXData = function(ctx) {
    var subj = this.path || this.text || this.sheet;
    if (!subj) return;
    subj.apply(ctx); // apply does ctx.save/ctx.restore by itself
}

Render.p_drawName = function(ctx, name) {
    if (!(name = name || this.$.name)) return;
    ctx.save();
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText(name, 0, 10);
    ctx.restore();
}

Render.p_applyAComp = function(ctx) {
    if (this.acomp) ctx.globalCompositeOperation = C.AC_NAMES[this.acomp];
}

Render.p_useReg = function(ctx) {
    var reg = this.reg;
    if ((reg[0] === 0) && (reg[1] === 0)) return;
    ctx.translate(-reg[0], -reg[1]);
}

Render.p_usePivot = function(ctx) {
    var dimen = this.$.dimen(),
        pvt = this.pvt;
    if (!dimen) return;
    if ((pvt[0] === 0) && (pvt[1] === 0)) return;
    ctx.translate(-(pvt[0] * dimen[0]),
                  -(pvt[1] * dimen[1]));
}

Render.p_drawMPath = function(ctx, mPath) {
    if (!(mPath = mPath || this.$.state._mpath)) return;
    ctx.save();
    //var s = this.$.astate;
    mPath.cstroke('#600', 2.0);
    //ctx.translate(-s.x, -s.y);
    //ctx.rotate(-s.angle);
    ctx.beginPath();
    mPath.apply(ctx);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

Render.m_checkBand = function(time, duration, band) {
    if (band[0] > (duration * time)) return false; // exit
    if (band[1] < (duration * time)) return false; // exit
}

// Bands
// -----------------------------------------------------------------------------

var Bands = {};

// recalculate all global bands down to the very
// child, starting from given element
Bands.recalc = function(elm, in_band) {
    var x = elm.xdata;
    var in_band = in_band ||
                  ( elm.parent
                  ? elm.parent.xdata.gband
                  : [0, 0] );
    x.gband = [ in_band[0] + x.lband[0],
                in_band[0] + x.lband[1] ];
    elm.visitChildren(function(celm) {
        Bands.recalc(celm, x.gband);
    });
}

// makes inner band coords relative to outer space
Bands.wrap = function(outer, inner) {
    if (!outer) return inner;
    return [ outer[0] + inner[0],
             ((outer[0] + inner[1]) <= outer[1])
              ? (outer[0] + inner[1])
              : outer[1]
            ];
}
// makes band maximum wide to fith both bands
Bands.expand = function(from, to) {
    if (!from) return to;
    return [ ((to[0] < from[0])
              ? to[0] : from[0]),
             ((to[1] > from[1])
              ? to[1] : from[1])
           ];
}
// finds minimum intersection of the bands
Bands.reduce = function(from, to) {
    if (!from) return to;
    return [ ((to[0] > from[0])
              ? to[0] : from[0]),
             ((to[1] < from[1])
              ? to[1] : from[1])
           ];
}

// Tweens
// -----------------------------------------------------------------------------

// Tween constants

C.T_TRANSLATE   = 'TRANSLATE';
C.T_SCALE       = 'SCALE';
C.T_ROTATE      = 'ROTATE';
C.T_ROT_TO_PATH = 'ROT_TO_PATH';
C.T_ALPHA       = 'ALPHA';
C.T_SHEAR       = 'SHEAR';

var Tween = {}; // FIXME: make tween a class
var Easing = {};

// tween order
Tween.TWEENS_PRIORITY = {};

Tween.TWEENS_PRIORITY[C.T_TRANSLATE]   = 0;
Tween.TWEENS_PRIORITY[C.T_SCALE]       = 1;
Tween.TWEENS_PRIORITY[C.T_ROTATE]      = 2;
Tween.TWEENS_PRIORITY[C.T_ROT_TO_PATH] = 3;
Tween.TWEENS_PRIORITY[C.T_ALPHA]       = 4;
Tween.TWEENS_PRIORITY[C.T_SHEAR]       = 5;

Tween.TWEENS_COUNT = 6;

var Tweens = {};
Tweens[C.T_ROTATE] =
    function() {
      return function(t, duration, data) {
        this.angle = data[0] * (1 - t) + data[1] * t;
        //state.angle = (Math.PI / 180) * 45;
      };
    };
Tweens[C.T_TRANSLATE] =
    function() {
      return function(t, duration, data) {
          var p = data.pointAt(t);
          this._mpath = data;
          this.x = p[0];
          this.y = p[1];
      };
    };
Tweens[C.T_ALPHA] =
    function() {
      return function(t, duration, data) {
        this.alpha = data[0] * (1.0 - t) + data[1] * t;
      };
    };
Tweens[C.T_SCALE] =
    function() {
      return function(t, duration, data) {
        this.sx = data[0][0] * (1.0 - t) + data[1][0] * t;
        this.sy = data[0][1] * (1.0 - t) + data[1][1] * t;
      };
    };
Tweens[C.T_ROT_TO_PATH] =
    function() {
      return function(t, duration, data) {
        var path = this._mpath;
        if (path) this.angle = path.tangentAt(t); // Math.atan2(this.y, this.x);
      };
    };
Tweens[C.T_SHEAR] =
    function() {
      return function(t, duration, data) {
        this.hx = data[0][0] * (1.0 - t) + data[1][0] * t;
        this.hy = data[0][1] * (1.0 - t) + data[1][1] * t;
      };
    };

// Easings
// -----------------------------------------------------------------------------

// Easings constants

C.E_PATH = 'PATH'; // Path
C.E_FUNC = 'FUNC'; // Function
C.E_CSEG = 'CSEG'; // Function
/*C.E_CINOUT = 'CINOUT'; // Cubic InOut*/
/*....*/

// function-based easings

var EasingImpl = {};

EasingImpl[C.E_PATH] =
    function(path) {
        /*var path = Path.parse(str);*/
        return function(t) {
            return path.pointAt(t)[1];
        }
    };
EasingImpl[C.E_FUNC] =
    function(f) {
        return f;
    };
EasingImpl[C.E_CSEG] =
    function(seg) {
        return function(t) {
            return seg.atT([0, 0], t)[1];
        };
    };
/*EasingImpl[C.E_CINOUT] =
    function() {
        return function(t) {
            var t =  2 * t;
            if (t < 1) {
                return -1/2 * (Math.sqrt(1 - t*t) - 1);
            } else {
                return 1/2 * (Math.sqrt(1 - (t-2)*(t-2)) + 1);
            }
        }
    };*/

// segment-based easings

Easing.__SEGS = {}; // segments cache for easings

function __registerSegEasing(alias, points) {
    C['E_'+alias] = alias;
    var seg = new CSeg(points);
    Easing.__SEGS[alias] = seg;
    var func =
        function(t) {
            return seg.atT([0, 0], t)[1];
        };
    C['EF_'+alias] = func;
    EasingImpl[alias] = function() {
        return func;
    }
}

__registerSegEasing('DEF',    [0.250, 0.100, 0.250, 1.000, 1.000, 1.000]); // Default
__registerSegEasing('IN',     [0.420, 0.000, 1.000, 1.000, 1.000, 1.000]); // In
__registerSegEasing('OUT',    [0.000, 0.000, 0.580, 1.000, 1.000, 1.000]); // Out
__registerSegEasing('INOUT',  [0.420, 0.000, 0.580, 1.000, 1.000, 1.000]); // InOut
__registerSegEasing('SIN',    [0.470, 0.000, 0.745, 0.715, 1.000, 1.000]); // Sine In
__registerSegEasing('SOUT',   [0.390, 0.575, 0.565, 1.000, 1.000, 1.000]); // Sine Out
__registerSegEasing('SINOUT', [0.445, 0.050, 0.550, 0.950, 1.000, 1.000]); // Sine InOut
__registerSegEasing('QIN',    [0.550, 0.085, 0.680, 0.530, 1.000, 1.000]); // Quad In
__registerSegEasing('QOUT',   [0.250, 0.460, 0.450, 0.940, 1.000, 1.000]); // Quad Out
__registerSegEasing('QINOUT', [0.455, 0.030, 0.515, 0.955, 1.000, 1.000]); // Quad InOut
__registerSegEasing('CIN',    [0.550, 0.055, 0.675, 0.190, 1.000, 1.000]); // Cubic In
__registerSegEasing('COUT',   [0.215, 0.610, 0.355, 1.000, 1.000, 1.000]); // Cubic Out
__registerSegEasing('CINOUT', [0.645, 0.045, 0.355, 1.000, 1.000, 1.000]); // Cubic InOut
__registerSegEasing('QTIN',   [0.895, 0.030, 0.685, 0.220, 1.000, 1.000]); // Quart In
__registerSegEasing('QTOUT',  [0.165, 0.840, 0.440, 1.000, 1.000, 1.000]); // Quart Out
__registerSegEasing('QTINOUT',[0.770, 0.000, 0.175, 1.000, 1.000, 1.000]); // Quart InOut
__registerSegEasing('QIIN',   [0.755, 0.050, 0.855, 0.060, 1.000, 1.000]); // Quint In
__registerSegEasing('QIOUT',  [0.230, 1.000, 0.320, 1.000, 1.000, 1.000]); // Quart Out
__registerSegEasing('QIINOUT',[0.860, 0.000, 0.070, 1.000, 1.000, 1.000]); // Quart InOut
__registerSegEasing('EIN',    [0.950, 0.050, 0.795, 0.035, 1.000, 1.000]); // Expo In
__registerSegEasing('EOUT',   [0.190, 1.000, 0.220, 1.000, 1.000, 1.000]); // Expo Out
__registerSegEasing('EINOUT', [1.000, 0.000, 0.000, 1.000, 1.000, 1.000]); // Expo InOut
__registerSegEasing('CRIN',   [0.600, 0.040, 0.980, 0.335, 1.000, 1.000]); // Circ In
__registerSegEasing('CROUT',  [0.075, 0.820, 0.165, 1.000, 1.000, 1.000]); // Circ Out
__registerSegEasing('CRINOUT',[0.785, 0.135, 0.150, 0.860, 1.000, 1.000]); // Circ InOut
__registerSegEasing('BIN',    [0.600, -0.280, 0.735, 0.045, 1.000, 1.000]); // Back In
__registerSegEasing('BOUT',   [0.175, 0.885, 0.320, 1.275, 1.000, 1.000]); // Back Out
__registerSegEasing('BINOUT', [0.680, -0.550, 0.265, 1.550, 1.000, 1.000]); // Back InOut

// Paths
// -----------------------------------------------------------------------------

// M<X> <Y> - move to
// L<X> <Y> - line to
// C<X1> <Y1> <X2> <Y2> <X3> <Y3> - curve to
// Z - close path
// lowercase marker means relative coord
// Example: "M0 10 L20 20 C10 20 15 30 10 9 Z"

// all commands:
// V = vertical lineto
// C = curveto
// S = smooth curveto
// Q = quadratic Bézier curve
// T = smooth quadratic Bézier curveto
// A = elliptical Arc
// Z = closepath

// Currently our format differs in a number format:
// "M0.0 10.0 L20.0 20.0 C10.0 20.0 15.0 30.0 10.0 9.0 Z"

// path constants
C.P_MOVETO = 0;
C.P_LINETO = 1;
C.P_CURVETO = 2;

C.PC_ROUND = 'round';
C.PC_BUTT = 'butt';
C.PC_MITER = 'miter';
C.PC_SQUARE = 'square';
C.PC_BEVEL = 'bevel';

// > Path % (str: String)
function Path(str, fill, stroke, shadow) {
    this.str = str;
    this.fill = fill;
    this.stroke = stroke;
    this.shadow = shadow;
    this.segs = [];
    this.parse(str);
}

Path.DEFAULT_CAP = C.PC_ROUND;
Path.DEFAULT_JOIN = C.PC_ROUND;
Path.EMPTY_FILL = { 'color': 'transparent' };
Path.DEFAULT_FILL = Path.EMPTY_FILL;
Path.BASE_FILL = { 'color': '#fff666' };
Path.EMPTY_STROKE = { 'width': 0, color: 'transparent' };
Path.DEFAULT_STROKE = Path.EMPTY_STROKE;
Path.BASE_STROKE = { 'width': 1.0,
                     'color': '#000',
                     'cap': Path.DEFAULT_CAP,
                     'join': Path.DEFAULT_JOIN
                   };


// visits every chunk of path in array-form and calls
// visitor function, so visitor function gets
// chunk marker and positions sequentially
// data argument will be also passed to visitor if specified
// > Path.visit % (visitor: Function[Segment, Any], data: Any)
Path.prototype.visit = function(visitor, data) {
    var segments = this.segs;
    for (var si = 0, sl = segments.length; si < sl; si++) {
        visitor(segments[si], data);
    }
}
// path length, in points
// > Path.length % () => Double
Path.prototype.length = function() {
    var sum = 0;
    var p = this.start();
    this.visit(function(segment) {
        sum += segment.length(p);
        p = segment.last();
    });
    return sum;
}
// > Path.add % (seg: Segment)
Path.prototype.add = function(seg) {
    this.segs.push(seg);
}
// > Path.apply % (ctx: Context)
Path.prototype.apply = function(ctx) {
    var p = this;
    Path.applyF(ctx, p.fill || Path.DEFAULT_FILL,
                     p.stroke || Path.DEFAULT_STROKE,
                     p.shadow,
             function() { p.visit(Path._applyVisitor, ctx); });

    /* ctx.save();
    ctx.beginPath();
    Brush.fill(ctx, fill);
    Brush.stroke(ctx, stroke);
    this.visit(Path._applyVisitor, ctx);
    ctx.closePath();

    if (Brush._hasVal(fill)) ctx.fill();
    if (Brush._hasVal(stroke)) ctx.stroke();
    ctx.restore(); */
}
Path.prototype.cstroke = function(color, width, cap, join) {
    this.stroke = {
        'width': (width != null) ? width
                 : Path.DEFAULT_STROKE.width,
        'color': color,
        'cap': cap || Path.DEFAULT_CAP,
        'join': join || Path.DEFAULT_JOIN
    };
}
Path.prototype.cfill = function(color) {
    this.fill = {
        'color': color
    };
}
// > Path.parse % (str: String) => Path
Path.prototype.parse = function(str) {
    if (str) Path.parse(str, this);
    return this;
}
// find a segment data in a path that corresponds to specified distance (t)
// of the path (0..1),
// > Path.hitAt % (t: [0..1]) => Array[Int, 2]
Path.prototype.hitAt = function(t/*, func*/) {
    var startp = this.start();
    if (t === 0) return {
          'seg': this.segs[0], 'start': startp, 'slen': 0.0, 'segt': 0.0
        };
    var endp = this.end();
    /*if (t == 1) return func ? func(startp, endp) : endp;*/

    var plen = this.length(); // path length in pixels
    var nsegs = this.segs.length; // number of segments
    var distance = t * plen;
    var p = startp;
    var length = 0; // checked length in pixels
    var seg, slen;
    for (var si = 0; si < nsegs; si++) {
        seg = this.segs[si];
        slen = seg.length(p); // segment length
        if (distance <= (length + slen)) {
            // inside current segment
            var segdist = distance - length;
            return {
              'seg': seg, 'start': p, 'slen': slen, 'segt': (slen != 0) ? (segdist / slen) : 0
            };
        }
        length += slen;
        // end point of segment
        p = seg.last();
    };
    var lseg = this.segs[this.segs.length - 1];
    return {
      'seg': lseg, 'start': p, 'slen': lseg.length(p), 'segt': 1.0
    };
}
// find a point on a path at specified distance (t) of the path (0..1),
// a function that transforms the result point (using given start point of
// segment and a point on a segment) may be passed
// > Path.pointAt % (t: [0..1]) => Array[Int, 2]
Path.prototype.pointAt = function(t) {
    var hit = this.hitAt(t);
    return hit.seg.atT(hit.start, hit.segt);
}
// find a tangent on a path at specified distance (t) of the path (0..1)
// > Path.tangentAt % (t: [0..1]) => Double
Path.prototype.tangentAt = function(t) {
    var hit = this.hitAt(t);
    return hit.seg.tangentAt(hit.start, hit.segt);
}
Path.prototype.start = function() {
    if (this.segs.length < 1) return null;
    return [ this.segs[0].pts[0],   // first-x
             this.segs[0].pts[1] ]; // first-y
}
Path.prototype.end = function() {
    if (this.segs.length < 1) return null;
    var lastidx = this.segs.length - 1;
    var s = this.segs[lastidx].count; // size of the last segment
    return [ this.segs[lastidx].pts[s-2],   // last-x
             this.segs[lastidx].pts[s-1] ]; // last-y
}
Path.prototype.bounds = function() {
    // FIXME: it is not ok for curve path, possibly
    if (this.segs.length <= 0) return [0, 0, 0, 0];
    var minX = this.segs[0].pts[0], maxX = this.segs[0].pts[0],
        minY = this.segs[0].pts[1], maxY = this.segs[0].pts[1];
    this.visit(function(segment) {
        var pts = segment.pts,
            pnum = pts.length;
        for (var pi = 0; pi < pnum; pi+=2) {
            minX = Math.min(minX, pts[pi]);
            maxX = Math.max(maxX, pts[pi]);
        }
        for (var pi = 1; pi < pnum; pi+=2) {
            minY = Math.min(minY, pts[pi]);
            maxY = Math.max(maxY, pts[pi]);
        }
    });
    return [ minX, minY, maxX, maxY ];
}
Path.prototype.dimen = function() {
    var bounds = this.bounds();
    return [ bounds[2], bounds[3] ];
}
Path.prototype.rect = function() {
    var b = this.bounds();
    // returns clockwise coordinates of the points
    // for easier drawing
          // minX, minY, maxX, minY,
    return [ b[0], b[1], b[2], b[1],
          // maxX, maxY, minX, maxY
             b[2], b[3], b[0], b[3] ];
}
/* TODO: rename to `modify`? */
Path.prototype.vpoints = function(func) {
    this.visit(function(segment) {
        var pts = segment.pts,
            pnum = pts.length;
        for (var pi = 0; pi < pnum; pi+=2) {
            var res = func(pts[pi], pts[pi+1]);
            if (res) {
                pts[pi] = res[0];
                pts[pi+1] = res[1];
            }
        }
    });
}
Path.prototype.shift = function(pt) {
    this.vpoints(function(x, y) {
        return [ x + pt[0],
                 y + pt[1] ];
    });
};
Path.prototype.zoom = function(vals) {
    this.vpoints(function(x, y) {
        return [ x * vals[0],
                 y * vals[1] ];
    });
}
// moves path to be positioned at 0,0 and
// returns subtracted top-left point
// and a center point
Path.prototype.normalize = function() {
    var bounds = this.bounds();
    var w = (bounds[2]-bounds[0]),
        h = (bounds[3]-bounds[1]);
    var hw = Math.floor(w/2),
        hh = Math.floor(h/2);
    var min_x = bounds[0],
        min_y = bounds[1];
    this.vpoints(function(x, y) {
        return [ x - min_x - hw,
                 y - min_y - hh];
        });
    return [ hw, hh ];
}
Path.prototype.getPoints = function() {
    var points = [];
    this.visit(function(seg) {
        points = points.concat(seg.pts);
    });
    return points;
}
Path.prototype.toString = function() {
    return "[ Path '" + Path.toSVGString(this) + "' ]";
}
// not a clone, but only segments-copy
Path.prototype.duplicate = function() {
    var seg_copy = new Path();
    this.visit(function(seg) {
        seg_copy.add(Path.makeSeg(seg.type, [].concat(seg.pts)));
    });
    return seg_copy;
}
Path.prototype.clone = function() {
    var clone = this.duplicate();
    if (this.stroke) clone.stroke = obj_clone(this.stroke);
    if (this.fill) clone.fill = obj_clone(this.fill);
    return clone;
}
Path.prototype.dispose = function() { }


Path.applyF = function(ctx, fill, stroke, shadow, func) {
    ctx.save();
    ctx.beginPath();
    Brush.fill(ctx, fill);
    Brush.stroke(ctx, stroke);
    Brush.shadow(ctx, shadow);
    func();

    if (Brush._hasVal(fill)) ctx.fill();
    if (Brush._hasVal(stroke)) ctx.stroke();
    ctx.restore();
}
// visits every chunk of path in string-form and calls
// visitor function, so visitor function gets
// chunk marker and positions sequentially
// data argument will be also passed to visitor if specified
Path.visitStrPath = function(path, visitor, data) {
    var cur_pos = 0;
    while (true) {
        var marker = path[cur_pos];
        if (marker === 'Z') {
            visitor(marker, [], data);
            return;
        }
        var pos_data = null;
        if ((marker === 'M') || (marker === 'L')) {
            pos_data = Path._collectPositions(path, cur_pos, 2);
        } else if (marker === 'C') {
            pos_data = Path._collectPositions(path, cur_pos, 6);
        }
        cur_pos += pos_data[0];
        var positions = pos_data[1];
        visitor(marker, positions, data);
    }
}
Path.toSVGString = function(path) {
    var buffer = [];
    path.visit(Path._encodeVisitor, buffer);
    buffer.push('Z');
    return buffer.join(' ');
}
// parses `count` positions from path (string form),
// starting at `start`, returns a length of parsed data and
// positions array
Path._collectPositions = function(path, start, count) {
    var pos = start + 1;
    var positions = [];
    var got = 0;
    while (got != count) {
        var posstr = __collect_to(path, pos, ' ');
        pos += posstr.length + 1; got++;
        positions.push(parseFloat(posstr));
    }
    return [pos - start, positions];
}
// visitor to parse a string path into Path object
Path._parserVisitor = function(marker, positions, path) {
    if (marker === 'M') {
        path.add(new MSeg(positions));
    } else if (marker === 'L') {
        path.add(new LSeg(positions));
    } else if (marker === 'C') {
        path.add(new CSeg(positions));
    }
}
// visitor to apply string path to context
Path._strApplyVisitor = function(marker, positions, ctx) {
    if (marker === 'M') {
        ctx.moveTo(positions[0], positions[1]);
    } else if (marker === 'L') {
        ctx.lineTo(positions[0], positions[1]);
    } else if (marker === 'C') {
        ctx.bezierCurveTo(positions[0], positions[1],
                          positions[2], positions[3],
                          positions[4], positions[5]);
    }
};
Path._applyVisitor = function(segment, ctx) {
    var type = segment.type;
    var positions = segment.pts;
    if (type === C.P_MOVETO) {
        ctx.moveTo(positions[0], positions[1]);
    } else if (type === C.P_LINETO) {
        ctx.lineTo(positions[0], positions[1]);
    } else if (type === C.P_CURVETO) {
        ctx.bezierCurveTo(positions[0], positions[1],
                          positions[2], positions[3],
                          positions[4], positions[5]);
    }
}
Path._encodeVisitor = function(segment, buffer) {
    var type = segment.type;
    var positions = segment.pts;
    if (type === C.P_MOVETO) {
        buffer.push('M'+positions[0]+' '+positions[1]);
    } else if (type === C.P_LINETO) {
        buffer.push('L'+positions[0]+' '+positions[1]);
    } else if (type === C.P_CURVETO) {
        buffer.push('C'+positions[0]+' '+positions[1]+' '+
                        positions[2]+' '+positions[3]+' '+
                        positions[4]+' '+positions[5]);
    }
}

// converts path given in string form to array of segments
Path.parse = function(path, target) {
    var target = target || new Path();
    target.segs = [];
    Path.visitStrPath(path, Path._parserVisitor, target);
    target.str = path;
    return target;
}
// parses a path in string form and immediately applies it to context
Path.parseAndApply = function(ctx, path) {
    Path.visitStrPath(path, Path._strApplyVisitor, ctx);
}
Path.makeSeg = function(type, pts) {
    if (type === C.P_MOVETO) { return new MSeg(pts); }
    else if (type === C.P_LINETO) { return new LSeg(pts); }
    else if (type === C.P_CURVETO) { return new CSeg(pts); }
}

function MSeg(pts) {
    this.type = C.P_MOVETO;
    this.pts = pts;
    this.count = pts.length;
}
// > MSeg.length(start: Array[Int,2]) => Double
MSeg.prototype.length = function(start) {
    return 0;
}
// distance is specified in points
MSeg.prototype.atDist = function(start, dist) {
    return [ this.pts[0], this.pts[1] ];
}
MSeg.prototype.atT = function(start, t) {
    return this.atDist(start, null);
}
MSeg.prototype.tangentAt = function(start, t) {
    return Math.atan2(this.pts[0], this.pts[1]);
}
MSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
}

function LSeg(pts) {
    this.type = C.P_LINETO;
    this.pts = pts;
    this.count = pts.length;
}
LSeg.prototype.length = function(start) {
    var dx = this.pts[0] - start[0];
    var dy = this.pts[1] - start[1];
    return Math.sqrt(dx*dx + dy*dy);
}
LSeg.prototype.atDist = function(start, dist) {
    return this.atT(start, dist / this.length(start));
}
LSeg.prototype.atT = function(start, t) {
    var p0x = start[0];
    var p0y = start[1];
    var p1x = this.pts[0];
    var p1y = this.pts[1];
    return [
        p0x + (p1x - p0x) * t,
        p0y + (p1y - p0y) * t
    ];
}
LSeg.prototype.tangentAt = function(start, t) {
    return Math.atan2(this.pts[1] - start[1],
                      this.pts[0] - start[0]);
}
LSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
}

function CSeg(pts) {
    this.type = C.P_CURVETO;
    this.pts = pts;
    this.count = pts.length;
}
CSeg.prototype.length = function(start) {
    /* FIXME: cache length data and points somewhere */
    var positions = this.pts;
    var p0x = start[0];
    var p0y = start[1];
    var p1x = positions[0];
    var p1y = positions[1];
    var p2x = positions[2];
    var p2y = positions[3];
    var p3x = positions[4];
    var p3y = positions[5];

    var p0to1 = Math.sqrt(Math.pow(p1x-p0x, 2) + Math.pow(p1y-p0y, 2));
    var p1to2 = Math.sqrt(Math.pow(p2x-p1x, 2) + Math.pow(p2y-p1y, 2));
    var p2to3 = Math.sqrt(Math.pow(p3x-p2x, 2) + Math.pow(p3y-p2y, 2));

    var len = p0to1 + p1to2 + p2to3 + 1;

    var count = len * 3;

    // choose the step as 1/len
    var dt = 1.0 / len;

    var q1 = 3 * dt;
    var q2 = q1 * dt;
    var q3 = dt * dt * dt;
    var q4 = 2 * q2;
    var q5 = 6 * q3;

    var q6x = p0x - 2 * p1x + p2x;
    var q6y = p0y - 2 * p1y + p2y;

    var q7x = 3 * (p1x - p2x) - p0x + p3x;
    var q7y = 3 * (p1y - p2y) - p0y + p3y;

    var bx = p0x;
    var by = p0y;

    var dbx = (p1x - p0x) * q1 + q6x * q2 + q3 * q7x;
    var dby = (p1y - p0y) * q1 + q6y * q2 + q3 * q7y;

    var ddbx = q6x * q4 + q7x * q5;
    var ddby = q6y * q4 + q7y * q5;

    var dddbx = q7x * q5;
    var dddby = q7y * q5;

    var length = 0;
    for (var idx = 0; idx < count; idx += 3) {
        var px = bx;
        var py = by;

        bx += dbx;
        by += dby;

        dbx += ddbx;
        dby += ddby;

        ddbx += dddbx;
        ddby += dddby;

        length += Math.sqrt((bx - px) * (bx - px) + (by - py) * (by - py));
    }
    return length;
}
CSeg.prototype.atDist = function(start, dist) {
    return this.atT(start, dist / this.length(start));
}
CSeg.prototype.atT = function(start, t) {
    var tt = t * t,       // t^2
        ttt = tt * t,      // t^3
        t1 = 1 - t,       // 1-t
        tt1 = t1 * t1,     // (1-t)^2
        tt2 = tt1 * t1,    // (1-t)^3
        tt3 = 3 * t * tt1,   // 3*t*(1-t)^2
        tt4 = 3 * tt * t1;   // 3*t^2*(1-t)

    return [ start[0] * tt2 + this.pts[0] * tt3 + this.pts[2] * tt4 + this.pts[4] * ttt,
             start[1] * tt2 + this.pts[1] * tt3 + this.pts[3] * tt4 + this.pts[5] * ttt ];
}
CSeg.prototype.last = function() {
    return [ this.pts[4], this.pts[5] ];
}
CSeg.prototype.tangentAt = function(start, t) {
    this._ensure_params(start);
    var par = this._params;
    var tt = t * t; // t^2
    var p = [ 3 * par[0] * tt + 2 * par[1] * t + par[2],
              3 * par[4] * tt + 2 * par[5] * t + par[6] ];
    /*var p = this.atT(start, t);*/
    return Math.atan2(p[1], p[0]);
}
CSeg.prototype._ensure_params = function(start) {
    if (this._lstart &&
        (this._lstart[0] === start[0]) &&
        (this._lstart[1] === start[1])) return;
    this._lstart = start;
    this._params = this._calc_params(start);
}
CSeg.prototype._calc_params = function(start) {
    // See http://www.planetclegg.com/projects/WarpingTextToSplines.html
    var pts = this.pts;
    var params = [];
    var p0x = start[0];
    var p0y = start[1];
    var p1x = pts[0];
    var p1y = pts[1];
    var p2x = pts[2];
    var p2y = pts[3];
    var p3x = pts[4];
    var p3y = pts[5];

    params[0] = p3x - 3*p2x + 3*p1x - p0x;  // A = x3 - 3 * x2 + 3 * x1 - x0
    params[1] = 3*p2x - 6*p1x + 3*p0x;      // B = 3 * x2 - 6 * x1 + 3 * x0
    params[2] = 3*p1x - 3*p0x;              // C = 3 * x1 - 3 * x0
    params[3] = p0x;                        // D = x0

    params[4] = p3y - 3*p2y + 3*p1y - p0y;  // E = y3 - 3 * y2 + 3 * y1 - y0
    params[5] = 3*p2y - 6*p1y + 3*p0y;      // F = 3 * y2 - 6 * y1 + 3 * y0
    params[6] = 3*p1y - 3*p0y;              // G = 3 * y1 - 3 * y0
    params[7] = p0y;                        // H = y0

    return params;
}

// Text
// -----------------------------------------------------------------------------

function Text(lines, font,
              fill, stroke, shadow, align) {
    this.lines = lines;
    this.font = font || Text.DEFAULT_FONT;
    this.fill = fill || Text.DEFAULT_FILL;
    this.stroke = stroke || Text.DEFAULT_STROKE;
    this.shadow = shadow;
    this.align = align || Text.DEFAULT_ALIGN;
    this._bnds = null;
}

Text.DEFAULT_CAP = C.PC_ROUND;
Text.DEFAULT_JOIN = C.PC_ROUND;
Text.DEFAULT_FFACE = 'sans-serif';
Text.DEFAULT_FSIZE = 24;
Text.DEFAULT_FONT = Text.DEFAULT_FSIZE + 'px ' + Text.DEFAULT_FFACE;
Text.DEFAULT_FILL = { 'color': '#000' };
Text.DEFAULT_ALIGN = 'left';
Text.BASELINE_RULE = 'alphabetic';
Text.DEFAULT_STROKE = null/*Path.EMPTY_STROKE*/;

Text.prototype.apply = function(ctx, point, baseline) {
    ctx.save();
    var point = point || [0, 0],
        dimen = this.dimen(),
        accent = this.accent(dimen[1]);
    ctx.font = this.font;
    ctx.textBaseline = baseline || Text.BASELINE_RULE; // FIXME: store inside
    ctx.textAlign = this.align || Text.DEFAULT_ALIGN;
    ctx.translate(point[0]/* + (dimen[0] / 2)*/, point[1]);

    if (Brush._hasVal(this.fill)) {
        Brush.shadow(ctx, this.shadow);
        Brush.fill(ctx, this.fill);
        ctx.save();
        this.visitLines(function(line) {
            ctx.fillText(line, 0, accent);
            ctx.translate(0, 1.2 * accent);
        });
        ctx.restore();
    }
    if (Brush._hasVal(this.stroke)) {
        Brush.shadow(ctx, this.shadow);
        Brush.stroke(ctx, this.stroke);
        ctx.save();
        this.visitLines(function(line) {
            ctx.strokeText(line, 0, accent);
            ctx.translate(0, 1.2 * accent);
        });
        ctx.restore();
    }
    ctx.restore();
}
Text.prototype.dimen = function() {
    if (this._dimen) return this._dimen;
    if (!Text.__buff) throw new SysErr('no Text buffer, bounds call failed');
    var buff = Text.__buff;
    buff.style.font = this.font;
    buff.style.textAlign = this.align;
    //buff.style.verticalAlign = baseline
    if (__arr(this.lines)) {
        buff.textContent = this.lines.join('<br/>');
    } else {
        buff.textContent = this.lines.toString();
    }
    return (this._dimen = [ buff.offsetWidth,
                            buff.offsetHeight ]);

}
Text.prototype.bounds = function() {
    var dimen = this.dimen();
    return [ 0, 0, dimen[0], dimen[1] ];
}
Text.prototype.accent = function(height) {
    return height; /* FIXME */
}
Text._createBuffer = function() {
    /* FIXME: dispose buffer when text is removed from scene */
    var _div = $doc.createElement('div');
    _div.style.visibility = 'hidden';
    _div.style.position = 'absolute';
    _div.style.top = -10000 + 'px';
    _div.style.left = -10000 + 'px';
    var _span = $doc.createElement('span');
    _div.appendChild(_span);
    $doc.body.appendChild(_div);
    return _span;
}
Text.prototype.cstroke = function(color, width, cap, join) {
    this.stroke = {
        'width': (width != null) ? width : 0,
        'color': color,
        'cap': cap || Text.DEFAULT_CAP,
        'join': join || Text.DEFAULT_JOIN
    };
}
Text.prototype.cfill = function(color) {
    this.fill = {
        'color': color
    };
}
Text.prototype.visitLines = function(func, data) {
    var lines = this.lines;
    if (__arr(lines)) {
        var line;
        for (var i = 0, ilen = lines.length; i < ilen; i++) {
            line = lines[i];
            func(line, data);
        }
    } else {
        func(lines.toString(), data);
    }
}
Text.prototype.clone = function() {
    var c = new Text(this.lines, this.font,
                     this.fill, this.stroke, this.shadow);
    if (this.lines && Array.isArray(this.lines)) {
        c.lines = [].concat(this.lines);
    }
    if (this.stroke) c.stroke = obj_clone(this.stroke);
    if (this.fill) c.fill = obj_clone(this.fill);
    return c;
}
Text.prototype.dispose = function() { }
Text._ensureHasBuffer = function() {
  if (!Text.__buff) Text.__buff = Text._createBuffer();
}

// Brush
// -----------------------------------------------------------------------------

var Brush = {};
// cached creation, returns previous result
// if it was already created before
Brush.create = function(ctx, src) {
  // FIXME: check if brush is valid color for string
  if (__str(src)) return src;
  if (src._style) return src._style;
  src._style = Brush._create(ctx, src);
  return src._style;
}
// create canvas-compatible style from brush
Brush._create = function(ctx, brush) {
    if (brush.color) return brush.color;
    if (brush.lgrad) {
        var src = brush.lgrad,
            stops = src.stops,
            dir = src.dir,
            bounds = src.bounds;
        var grad = bounds
            ? ctx.createLinearGradient(
                            bounds[0] + dir[0][0] * bounds[2], // b.x + x0 * b.width
                            bounds[1] + dir[0][1] * bounds[3], // b.y + y0 * b.height
                            bounds[0] + dir[1][0] * bounds[2], // b.x + x1 * b.width
                            bounds[1] + dir[1][1] * bounds[3]) // b.y + y1 * b.height
            : ctx.createLinearGradient(
                            dir[0][0], dir[0][1],  // x0, y0
                            dir[1][0], dir[1][1]); // x1, y1
        for (var i = 0, slen = stops.length; i < slen; i++) {
            var stop = stops[i];
            grad.addColorStop(stop[0], stop[1]);
        }
        return grad;
    }
    if (brush.rgrad) {
        var src = brush.rgrad,
            stops = src.stops,
            dir = src.dir,
            r = src.r,
            bounds = src.bounds;
        var grad = bounds
            ? ctx.createRadialGradient(
                            bounds[0] + dir[0][0] * bounds[2], // b.x + x0 * b.width
                            bounds[1] + dir[0][1] * bounds[3], // b.y + y0 * b.height
                            Math.max(bounds[2], bounds[3]) * r[0], // max(width, height) * r0
                            bounds[0] + dir[1][0] * bounds[2], // b.x + x1 * b.width
                            bounds[1] + dir[1][1] * bounds[3], // b.y + y1 * b.height
                            Math.max(bounds[2], bounds[3]) * r[1]) // max(width, height) * r1
            : ctx.createRadialGradient(
                           dir[0][0], dir[0][1], r[0],  // x0, y0, r0
                           dir[1][0], dir[1][1], r[1]); // x1, y1, r1
        for (var i = 0, slen = stops.length; i < slen; i++) {
            var stop = stops[i];
            grad.addColorStop(stop[0], stop[1]);
        }
        return grad;
    }
    return null;
}
// TODO: move to instance methods
Brush.stroke = function(ctx, stroke) {
    if (!stroke) return;
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = Brush.create(ctx, stroke);
    ctx.lineCap = stroke.cap;
    ctx.lineJoin = stroke.join;
}
Brush.fill = function(ctx, fill) {
    if (!fill) return;
    ctx.fillStyle = Brush.create(ctx, fill);
}
Brush.shadow = function(ctx, shadow) {
    if (!shadow) return;
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blurRadius;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
}
Brush._hasVal = function(fsval) {
    return (fsval && (__str(fsval) || fsval.color || fsval.lgrad || fsval.rgrad));
}

// Sheet
// -----------------------------------------------------------------------------

Sheet.instances = 0;
/* TODO: rename to Static and take optional function as source? */
function Sheet(src, callback, start_region) {
    this.id = Sheet.instances++;
    this.src = src;
    this._dimen = /*dimen ||*/ [0, 0];
    this.regions = [ [ 0, 0, 1, 1 ] ]; // for image, sheet contains just one image
    this.regions_f = null;
    // this.aliases = {}; // map of names to regions (or regions ranges)
    /* use state property for region num? or conform with state jumps/positions */
    /* TODO: rename region to frame */
    this.cur_region = start_region || 0; // current region may be changed with modifier
    this.ready = false;
    this._image = null;
    this._cvs_cache = null;
    this.load(callback);
}
Sheet.prototype.load = function(callback) {
    if (this._image) throw new Error('Already loaded'); // just skip loading?
    var me = this;
    _ResMan.loadOrGet(me.src,
        function(onsuccess, onerror) { // loader
            var _img = new Image();
            _img.onload = function() {
                _img.__anm_ready = true;
                _img.isReady = true; /* FIXME: use 'image.complete' and
                                      '...' (network exist) combination,
                                      'complete' fails on Firefox */
                onsuccess(_img);
            };
            _img.onerror = onerror;
            try { _img.src = me.src; }
            catch(e) { if (onerror) onerror(e);
                       throw new SysErr('Image at ' + me.src + ' is not accessible'); }
        },
        function(image) {  // oncomplete
            me._image = image;
            // if (me.regions.length == 1) me._drawToCache();
            me._dimen = [ image.width, image.height ];
            me.ready = true;
            me._drawToCache();
            if (callback) callback.call(me, image);
        });
}
Sheet.prototype._drawToCache = function() {
    if (!this.ready) return;
    if (this._image.__cvs) {
        this._cvs_cache = this._image.__cvs;
        return;
    }
    var _canvas = newCanvas(this._dimen, 1 /* FIXME: use real ratio */);
    var _ctx = _canvas.getContext('2d');
    _ctx.drawImage(this._image, 0, 0, this._dimen[0], this._dimen[1]);
    this._image.__cvs = _canvas;
    this._cvs_cache = _canvas;
}
Sheet.prototype.apply = function(ctx) {
    if (!this.ready) return;
    if (this.cur_region < 0) return;
    var region;
    if (this.region_f) { region = this.region_f(this.cur_region); }
    else {
        var r = this.regions[this.cur_region],
            d = this._dimen;
        region = [ r[0] * d[0], r[1] * d[1],
                   r[2] * d[0], r[3] * d[1] ];
    }
    this._active_region = region;
    ctx.drawImage(this._cvs_cache, region[0], region[1],
                                   region[2], region[3], 0, 0, region[2], region[3]);
}
Sheet.prototype.dimen = function() {
    /* if (!this.ready || !this._active_region) return [0, 0];
    var r = this._active_region;
    return [ r[2], r[3] ]; */
    return this._dimen;
}
Sheet.prototype.bounds = function() {
    // TODO: when using current_region, bounds will depend on that region
    if (!this.ready || !this._active_region) return [0, 0, 0, 0];
    var r = this._active_region;
    return [ 0, 0, r[2], r[3] ];
}
Sheet.prototype.rect = function() {
    // TODO: when using current_region, bounds will depend on that region
    throw new Error('Not Implemented. Why?');
}
Sheet.prototype.clone = function() {
    return new Sheet(this.src);
}
Sheet.prototype.dispose = function() {
    this._cvs_cache = null;
}
// TODO: detach, dispose canvas
var _Image = Sheet; // Image is the same thing as Sheet, with only one [1, 1] region
                    // it will be exported as `Image`, but renamed here not to confuse
                    // with browser Image object

// Controls
// -----------------------------------------------------------------------------

function Controls(player) {
    this.player = player;
    this.canvas = null;
    this.ctx = null;
    this.ready = false;
    this.bounds = [];
    this.hidden = false;
    this.focused = false; // the current button is focused
    this.elapsed = false;
    this.theme = null;
    this.info = null;
    this._time = -1000;
    this._ratio = 1;
    this._lhappens = C.NOTHING;
    this._initHandlers(); /* TODO: make automatic */
    this._inParent = player.inParent;
}
Controls.DEFAULT_THEME = {
  'font': {
      'face': 'Arial, sans-serif',
      'weight': 'bold',
      'timesize': 27,
      'statussize': 17
  },
  'radius': { // all radius values are relative to (Math.min(width, height) / 2)
      'inner': .25,
      'outer': .28,
      'buttonv': .15, // height of a button
      'buttonh': .14, // width of a button
      'time': .5, // time text position
      'status': .8, // info text position
      'substatus': .9
  },
  'width': { // stroke width
      'inner': 3, // button stroke
      'outer': 3, // progress stroke
      'button': 7 // button stroke
  },
  'statuslimit': 40, // maximum length of status line
  'join': {
      'button': 'round' // join for button stroke
  },
  'colors': {
      'bggrad': { // back gradient start is at (0.1 * Math.max(width/height))
                  // and end is at (1.0 * Math.max(width/height))
          //'start': 'rgba(30,30,30,.7)',
          //'end': 'rgba(30,30,30,1)'
          'start': 'rgba(30,30,30,.95)',
          'end': 'rgba(30,30,30,.95)'
      },
      'progress': {
          'passed': 'rgba(255,255,255,.2)',
          'left': 'rgba(0,0,0,.05)'
      },
      'button': 'rgba(255,255,255,.95)',
      'stroke': 'rgba(180,180,180,.85)',
      'fill': 'rgba(255,255,255,0)',
      'hoverfill': 'rgba(255,255,255,.2)',
      'disabledfill': 'rgba(20,0,0,.2)',
      'text': 'rgba(255,255,255,.8)',
      'error': 'rgba(250,0,0,.8)',
      'infobg': 'rgba(128,0,0,.8)',
      'secondary': 'rgba(255,255,255,.1)'
  },
  'anmguy': {
      'colors': [ 'rgba(65,61,62,.7)', // black
                  'rgba(241,91,42,.7)' // orange
                ],
      'center_pos': [ .5, .8 ],
      'corner_pos': [ .9, .9 ],
      'center_alpha': 1,
      'corner_alpha': .4,
      'scale': .065 // relatively to minimum side
  }
};
Controls.THEME = Controls.DEFAULT_THEME;
provideEvents(Controls, [C.X_DRAW]);
Controls.prototype.update = function(parent) {
    var _ratio = parent.__pxRatio,
        _w = parent.width / _ratio,
        _h = parent.height / _ratio,
        _pp = find_pos(parent), // parent position
        _bp = [ _pp[0] + parent.clientLeft, _pp[1] + parent.clientTop ], // bounds position
        _cp = this._inParent ? [ parent.parentNode.offsetLeft + parent.clientLeft,
                                 parent.parentNode.offsetTop  + parent.clientTop + _hdiff ]
                             : _bp; // position to set in styles
    var _canvas = this.canvas;
    if (!_canvas) {
        _canvas = newCanvas([ _w, _h ], _ratio);
        if (parent.id) { _canvas.id = '__'+parent.id+'_ctrls'; }
        _canvas.className = 'anm-controls';
        _canvas.style.position = 'absolute';
        _canvas.style.opacity = Controls.OPACITY;
        _canvas.style.zIndex = 100;
        _canvas.style.cursor = 'pointer';
        _canvas.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        this.id = _canvas.id;
        this.canvas = _canvas;
        this.ctx = _canvas.getContext('2d');
        this.changeTheme(Controls.THEME);
        this.hide();
        this.subscribeEvents(_canvas);
    } else {
        canvasOpts(_canvas, [ _w, _h ], _ratio);
    }
    _canvas.style.left = _cp[0] + 'px';
    _canvas.style.top = _cp[1] + 'px';
    this._ratio = _ratio;
    if (!this.ready) {
        var appendTo = this._inParent ? parent.parentNode
                                      : $doc.body;
        /* FIXME: a dirty hack? */
        if (this._inParent) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(_canvas);
        this.ready = true;
    }
    this.page_bounds = [ _bp[0], _bp[1], _bp[0]+_w,
                                         _bp[1]+_h ];
    this.bounds = this.page_bounds;
    if (this.info) this.info.update(parent);
}
Controls.prototype.subscribeEvents = function(canvas/*, parent*/) {
    var player = this.player;
    /* $wnd.addEventListener('scroll', (function(controls) {
            return function(evt) {
                controls.handleAreaChange();
            };
        })(this), false); */
    $wnd.addEventListener('mousemove', (function(controls) {
            return function(evt) {
                controls.handleMouseMove(evt.pageX, evt.pageY, evt);
            };
        })(this), false);
    player.canvas.addEventListener('mouseover', (function(controls) {
            return function(evt) {
                controls.handleMouseOver();
            };
        })(this), false);
    canvas.addEventListener('mousemove', (function(controls) {
            return function(evt) {
                controls.handleMouseMove(evt.pageX, evt.pageY, evt);
            };
        })(this), false);
    canvas.addEventListener('mousedown', (function(controls) {
            return function(evt) {
                controls.handleClick();
            };
        })(this), false);
    canvas.addEventListener('mouseout', (function(controls) {
            return function(evt) {
               controls.handleMouseOut();
            };
        })(this), false);
}
Controls.prototype.render = function(time) {
    if (this.hidden && !this.__force) return;

    var player = this.player,
        state = player.state,
        _s = state.happens;
    //if (_s == C.NOTHING) return;

    var time = (time > 0) ? time : 0;
    if (!this.__force &&
        (time === this._time) &&
        (_s === this._lhappens)) return;
    this._time = time;
    this._lhappens = _s;

    var ctx = this.ctx,
        ratio = this._ratio, // pixelRatio (or use this.canvas.__pxRatio?)
        theme = this.theme,
        duration = state.duration,
        progress = time / ((duration !== 0) ? duration : 1);

    var _w = (this.bounds[2] - this.bounds[0]) * ratio,
        _h = (this.bounds[3] - this.bounds[1]) * ratio;

    ctx.save();
    //if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, _w, _h);

    if (_s === C.PLAYING) {
        Controls._drawBack(ctx, theme, _w, _h, ratio);
        Controls._drawProgress(ctx, theme, _w, _h, ratio, progress);
        Controls._drawPause(ctx, theme, _w, _h, ratio, this.focused);
        if (duration) {
            Controls._drawTime(ctx, theme, _w, _h, ratio, time, duration);
        }
    } else if (_s === C.STOPPED) {
        Controls._drawBack(ctx, theme, _w, _h, ratio);
        Controls._drawPlay(ctx, theme, _w, _h, ratio, this.focused);
    } else if (_s === C.PAUSED) {
        Controls._drawBack(ctx, theme, _w, _h, ratio);
        Controls._drawProgress(ctx, theme, _w, _h, ratio, progress);
        Controls._drawPlay(ctx, theme, _w, _h, ratio, this.focused);
        if (duration) {
            Controls._drawTime(ctx, theme, _w, _h, ratio, time, duration);
        }
    } else if (_s === C.NOTHING) {
        Controls._drawBack(ctx, theme, _w, _h, ratio);
        Controls._drawNoScene(ctx, theme, _w, _h, ratio, this.focused);
    } else if ((_s === C.LOADING) || (_s === C.RES_LOADING)) { // TODO: show resource loading progress
        Controls._drawBack(ctx, theme, _w, _h, ratio);
        var isRemoteLoading = (player._loadTarget === C.LT_URL);
        Controls._drawLoading(ctx, theme, _w, _h, ratio,
                              isRemoteLoading ? (((Date.now() / 100) % 60) / 60) : -1,
                              isRemoteLoading ? player._loadSrc : '');
    } else if (_s === C.ERROR) {
        Controls._drawBack(ctx, theme, _w, _h, ratio);
        Controls._drawError(ctx, theme, _w, _h, ratio, player.__lastError, this.focused);
    }

    ctx.restore();
    this.fire(C.X_DRAW, state);

    this.__force = false;

    if (this.info) this.info.render();
}
Controls.prototype.react = function(time) {
    if (this.hidden) return;

    var _p = this.player,
        _s = _p.state.happens;
    if ((_s === C.NOTHING) || (_s === C.LOADING) || (_s === C.ERROR)) return;
    if (_s === C.STOPPED) { /*console.log('play from start');*/ _p.play(0); return; }
    if (_s === C.PAUSED) { /*console.log('play from ' + this._time);*/ _p.play(this._time); return; }
    if (_s === C.PLAYING) { /*console.log('pause at' + time);*/ this._time = time; _p.pause(); return; }
}
Controls.prototype.refreshByMousePos = function(pageX, pageY) {
    var state = this.player.state,
        _lx = pageX - this.bounds[0],
        _ly = pageY - this.bounds[1],
        _w = this.bounds[2] - this.bounds[0],
        _h = this.bounds[3] - this.bounds[1],
        button_rad = Math.min(_w / 2, _h / 2) * this.theme.radius.inner;
    var lfocused = this.focused;
    this.focused = (_lx >= (_w / 2) - button_rad) &&
                   (_lx <= (_w / 2) + button_rad) &&
                   (_ly >= (_h / 2) - button_rad) &&
                   (_ly <= (_h / 2) + button_rad);
    if (lfocused !== this.focused) {
        this.forceNextRedraw();
    }
    this.render(state.time);
}
Controls.prototype.handleMouseMove = function(pageX, pageY, evt) {
    if (evt) this._last_mevt = evt;
    if (this.inBounds(pageX, pageY)) {
        this.show();
        this.refreshByMousePos(pageX, pageY);
    } else {
        this.handleMouseOut();
    }
}
Controls.prototype.handleClick = function() {
    var state = this.player.state;
    this.forceNextRedraw();
    this.react(state.time);
    this.render(state.time);
}
Controls.prototype.handleMouseOver = function() {
    if (this.hidden) this.show();
    this.forceNextRedraw();
    this.render(this.player.state.time);
}
Controls.prototype.handleMouseOut = function() {
    var state = this.player.state;
    if ((state.happens === C.NOTHING) ||
        (state.happens === C.LOADING) ||
        (state.happens === C.RES_LOADING) ||
        (state.happens === C.ERROR)) {
        this.forceNextRedraw();
        this.render(state.time);
    } else {
        this.hide();
    }
}
Controls.prototype.forceRefresh = function() {
    this.forceNextRedraw();
    this.render(this.player.state.time);
}
/* TODO: take initial state from imported project */
Controls.prototype.hide = function() {
    this.hidden = true;
    this.canvas.style.display = 'none';
    if (this.info) this.info.hide();
}
Controls.prototype.show = function() {
    this.hidden = false;
    this.canvas.style.display = 'block';
    if (this.info) this.info.show();
}
Controls.prototype.reset = function() {
    this._time = -1000;
    this.elapsed = false;
    if (this.info) this.info.reset();
}
Controls.prototype.detach = function(parent) {
    (this._inParent ? parent.parentNode
                    : $doc.body).removeChild(this.canvas);
    if (this.info) this.info.detach(parent);
}
Controls.prototype.inBounds = function(pageX, pageY) {
    //if (this.hidden) return false;
    var _b = this.bounds,
        _ratio = this._ratio;
    return (pageX >= _b[0]) &&
           (pageX <= _b[2]) &&
           (pageY >= _b[1]) &&
           (pageY <= _b[3]);
}
Controls.prototype.evtInBounds = function(evt) {
    if (this.hidden) return false;
    return this.inBounds([evt.pageX, evt.pageY]);
}
Controls.prototype.changeTheme = function(to) {
    this.theme = to;
    // TODO: redraw
}
Controls.prototype.forceNextRedraw = function() {
    this.__force = true;
}
Controls.prototype._scheduleLoading = function() {
    var controls = this;
    this._loadingInterval = setInterval(function() {
         controls.forceNextRedraw();
         controls.render();
    }, 50);
}
Controls.prototype._stopLoading = function() {
    clearInterval(this._loadingInterval);
}
Controls.prototype.enable = function() {
    var player = this.player,
        state = player.state;
    this.update(this.player.canvas);
    if ((state.happens === C.NOTHING) ||
        (state.happens === C.LOADING) ||
        (state.happens === C.RES_LOADING) ||
        (state.happens === C.ERROR)) {
      this.show();
      this.forceNextRedraw();
      this.render();
    }
}
Controls.prototype.disable = function() {
    this.hide();
    this.detach(this.canvas);
}
Controls.prototype.enableInfo = function() {
    if (!this.info) this.info = new InfoBlock(this.player);
    this.info.update(this.player.canvas);
}
Controls.prototype.disableInfo = function() {
    if (this.info) this.info.detach(this.player.canvas);
    /*if (this.info) */this.info = null;
}
Controls.prototype.setDuration = function(value) {
    if (this.info) this.info.setDuration(value);
}
Controls.prototype.inject = function(meta, anim) {
    if (this.info) this.info.inject(meta, anim);
}
Controls._drawBack = function(ctx, theme, w, h, ratio) {
    ctx.save();
    var cx = w / 2,
        cy = h / 2;

    var grd = ctx.createRadialGradient(cx, cy, 0,
                                       cx, cy, Math.max(cx, cy) * 1.2);
    grd.addColorStop(.1, theme.colors.bggrad.start);
    grd.addColorStop(1, theme.colors.bggrad.end);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
}
Controls._drawProgress = function(ctx, theme, w, h, ratio, progress) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        progress_rad = Math.min(cx, cy) * theme.radius.outer;

    ctx.beginPath();
    ctx.arc(cx, cy, progress_rad, (1.5 * Math.PI), (1.5 * Math.PI) + ((2 * Math.PI) * progress));
    ctx.strokeStyle = theme.colors.progress.passed;
    ctx.lineWidth = theme.width.outer;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, progress_rad, (1.5 * Math.PI), (1.5 * Math.PI) + ((2 * Math.PI) * progress), true);
    ctx.strokeStyle = theme.colors.progress.left;
    ctx.lineWidth = theme.width.outer;
    ctx.stroke();

    ctx.restore();

}
Controls._drawPause = function(ctx, theme, w, h, ratio, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        inner_rad = Math.min(cx, cy) * theme.radius.inner,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.beginPath();
    ctx.arc(cx, cy, inner_rad, 0, 2 * Math.PI);
    ctx.fillStyle = focused ? theme.colors.hoverfill : theme.colors.fill;
    ctx.strokeStyle = theme.colors.stroke;
    ctx.lineWidth = theme.width.inner;
    ctx.stroke();
    ctx.fill();

    var x = cx - (button_width / 2),
        y = cy - (button_height / 2),
        bar_width = 1 / 4,
        between = 2 / 4;

    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.button;
    ctx.strokeStyle = theme.colors.button;
    ctx.strokeRect(x, y, bar_width * button_width, button_height);
    ctx.strokeRect(x + ((bar_width + between) * button_width), y,
                   bar_width * button_width, button_height);
    ctx.fillRect(x, y, bar_width * button_width, button_height);
    ctx.fillRect(x + (bar_width + between) * button_width, y,
                 bar_width * button_width, button_height);

    ctx.restore();

    Controls._drawGuyInCorner(ctx, theme, w, h, ratio);
}
Controls._drawPlay = function(ctx, theme, w, h, ratio, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        inner_rad = Math.min(cx, cy) * theme.radius.inner,
        // play button should be thinner than standard button
        button_width = Math.min(cx, cy) * theme.radius.buttonh * 0.8,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.beginPath();
    ctx.arc(cx, cy, inner_rad, 0, 2 * Math.PI);
    ctx.fillStyle = focused ? theme.colors.hoverfill : theme.colors.fill;
    ctx.strokeStyle = theme.colors.stroke;
    ctx.lineWidth = theme.width.inner;
    ctx.stroke();
    ctx.fill();

    // this way play button "weight" looks more centered
    ctx.translate(button_width / (((button_width > button_height)
                                   ? (button_width / button_height)
                                   : (button_height / button_width)) * 4), 0);

    ctx.beginPath();
    ctx.moveTo(cx - (button_width / 2), cy - (button_height / 2));
    ctx.lineTo(cx + (button_width / 2), cy);
    ctx.lineTo(cx - (button_width / 2), cy + (button_height / 2));
    ctx.closePath();
    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.button;
    ctx.strokeStyle = theme.colors.button;
    ctx.stroke();
    ctx.fill();

    ctx.restore();

    Controls._drawGuyInCorner(ctx, theme, w, h, ratio);
}
Controls._drawLoading = function(ctx, theme, w, h, ratio, hilite_pos, src) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        circles = 15,
        outer_rad = Math.min(cx, cy) * theme.radius.outer,
        circle_rad = Math.min(cx, cy) / 25,
        two_pi = 2 * Math.PI,
        hilite_idx = Math.ceil(circles * hilite_pos);

    ctx.translate(cx, cy);
    for (var i = 0; i <= circles; i++) {
        ctx.beginPath();
        ctx.arc(0, outer_rad, circle_rad, 0, two_pi);
        ctx.fillStyle = (i != hilite_idx) ? theme.colors.stroke : theme.colors.text;
        ctx.fill();
        ctx.rotate(two_pi / circles);
    }
    ctx.restore();

    if (src) {
        Controls._drawText(ctx, theme,
                     w / 2, ((h / 2) * (1 + theme.radius.status)),
                     theme.font.statussize,
                     ell_text(src, theme.statuslimit));
    } else if (hilite_pos == -1) {
        Controls._drawText(ctx, theme,
                     w / 2, ((h / 2) * (1 + theme.radius.status)),
                     theme.font.statussize,
                     '...');
    }

    Controls._drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.substatus)),
                   theme.font.statussize,
                   Strings.COPYRIGHT);

    Controls._drawGuyInCenter(ctx, theme, w, h, ratio);
}
Controls._drawNoScene = function(ctx, theme, w, h, ratio, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        inner_rad = Math.min(cx, cy) * theme.radius.inner,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.beginPath();
    ctx.arc(cx, cy, inner_rad, 0, 2 * Math.PI);
    ctx.fillStyle = focused ? theme.colors.disabledfill : theme.colors.fill;
    ctx.strokeStyle = theme.colors.stroke;
    ctx.lineWidth = theme.width.inner;
    ctx.stroke();
    ctx.fill();

    ctx.translate(cx, cy);

    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.button;
    ctx.strokeStyle = theme.colors.button;
    ctx.rotate(-Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.rotate(2 * Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.restore();

    Controls._drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.status)),
                   theme.font.statussize,
                   Strings.COPYRIGHT);

    Controls._drawGuyInCenter(ctx, theme, w, h, ratio);

}
Controls._drawError = function(ctx, theme, w, h, ratio, error, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        inner_rad = Math.min(cx, cy) * theme.radius.inner,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.beginPath();
    ctx.arc(cx, cy, inner_rad, 0, 2 * Math.PI);
    ctx.fillStyle = focused ? theme.colors.disabledfill : theme.colors.fill;
    ctx.strokeStyle = theme.colors.stroke;
    ctx.lineWidth = theme.width.inner;
    ctx.stroke();
    ctx.fill();

    ctx.translate(cx, cy);

    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.error;
    ctx.strokeStyle = theme.colors.error;
    ctx.rotate(-Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.rotate(2 * Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.restore();

    Controls._drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.status)),
                   Math.floor(theme.font.statussize * 1.2),
                   (error && error.message) ? ell_text(error.message, theme.statuslimit)
                                            : error, theme.colors.error);

    Controls._drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.substatus)),
                   theme.font.statussize,
                   Strings.COPYRIGHT);

    Controls._drawGuyInCenter(ctx, theme, w, h, ratio, [ theme.colors.button,
                                                         theme.colors.error ]);
}
Controls._drawTime = function(ctx, theme, w, h, ratio, time, duration) {
    Controls._drawText(ctx, theme,
                       w / 2, ((h / 2) * (1 + theme.radius.time)),
                       theme.font.timesize,
                       fmt_time(time) + ' / ' + fmt_time(duration));

}
Controls._drawText = function(ctx, theme, x, y, size, text, color) {
    ctx.save();
    ctx.font = theme.font.weight + ' ' + (size || 15) + 'pt ' + theme.font.face;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || theme.colors.text;
    ctx.fillText(text, x, y);
    ctx.restore();
}
Controls._drawGuyInCorner = function(ctx, theme, w, h, scale, colors) {
    drawAnimatronGuy(ctx, theme.anmguy.corner_pos[0] * w,
                          theme.anmguy.corner_pos[1] * h,
                     scale ? scale * theme.anmguy.scale * Math.min(w, h) : 1,
                     colors || theme.anmguy.colors, theme.anmguy.corner_alpha);

    // FIXME: place COPYRIGHT text directly under the guy in drawAnimatronGuy function
    Controls._drawText(ctx, theme,
                       w * .91, h * .98,
                       theme.font.statussize * .8,
                       Strings.COPYRIGHT, theme.colors.secondary);
}
Controls._drawGuyInCenter = function(ctx, theme, w, h, scale, colors) {
    drawAnimatronGuy(ctx, theme.anmguy.center_pos[0] * w,
                          theme.anmguy.center_pos[1] * h,
                     scale ? scale * theme.anmguy.scale * Math.min(w, h) : 1,
                     colors || theme.anmguy.colors, theme.anmguy.center_alpha);

    // FIXME: place COPYRIGHT text directly under the guy in drawAnimatronGuy function
}

// Info Block
// -----------------------------------------------------------------------------

function InfoBlock(player) {
    this.canvas = null;
    this.ctx = null;
    this.ready = false;
    this.hidden = false;
    this._inParent = player.inParent;
    this.attached = false;
}
/* FIXME: merge Info Block and Controls? */
InfoBlock.BASE_BGCOLOR = Controls.THEME.colors.infobg;
InfoBlock.BASE_FGCOLOR = Controls.THEME.colors.text;
InfoBlock.OPACITY = 0.75;
InfoBlock.PADDING = 6;
InfoBlock.MARGIN = 5;
InfoBlock.FONT = Controls.THEME.font.face;
InfoBlock.DEFAULT_WIDTH = 0;
InfoBlock.DEFAULT_HEIGHT = 60;
InfoBlock.prototype.detach = function(parent) {
    if (!this.attached) return;
    (this._inParent ? parent.parentNode
                    : $doc.body).removeChild(this.canvas);
    this.attached = false;
}
InfoBlock.prototype.update = function(parent) {
    var _ratio = parent.__pxRatio,
        _p = InfoBlock.PADDING,
        _m = InfoBlock.MARGIN,
        _w = InfoBlock.DEFAULT_WIDTH,
        _h = InfoBlock.DEFAULT_HEIGHT - (_p + _p),
        _pp = this._inParent ? [ parent.parentNode.offsetLeft + parent.clientLeft,
                                 parent.parentNode.offsetTop + parent.clientTop ]
                             : find_pos(parent),
        _l = _pp[0] + parent.clientLeft + _m,
        _t = _pp[1] + parent.clientTop + _m;
    var _canvas = this.canvas;
    if (!_canvas) {
        _canvas = newCanvas([ _w, _h ], _ratio);
        if (parent.id) { _canvas.id = '__'+parent.id+'_info'; }
        _canvas.className = 'anm-info';
        _canvas.style.position = 'absolute';
        _canvas.style.opacity = InfoBlock.OPACITY;
        _canvas.style.zIndex = 100;
        _canvas.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        this.canvas = _canvas;
        this.ctx = _canvas.getContext('2d');
        this.id = _canvas.id;
        this.hide();
        this.changeTheme(InfoBlock.BASE_FGCOLOR, InfoBlock.BASE_BGCOLOR);
    }
    // width and height will be calculated on update
    /* _canvas.style.width = _w + 'px';
       _canvas.style.height = _h + 'px'; */
    _canvas.style.top = _t + 'px';
    _canvas.style.left = _l + 'px';
    this.bounds = [ _l, _t, _l+_w, _t+_h ];
    this.canvas = _canvas;
    if (!this.ready) {
        var appendTo = this._inParent ? parent.parentNode
                                      : $doc.body;
        /* FIXME: a dirty hack */
        if (this._inParent) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(_canvas);
        this.attached = true;
        this.ready = true;
    }
    this.render();
}
InfoBlock.prototype.render = function() {
    if (!this.__data) return;
    var meta = this.__data[0],
        anim = this.__data[1],
        duration = this.__data[2] || meta.duration,
        ratio = this.canvas.__pxRatio;
    Text._ensureHasBuffer();
    /* TODO: show speed */
    var _tl = new Text(meta.title || '[No title]', 'bold ' + (12 * ratio) + 'px ' + InfoBlock.FONT, { color: this.__fgcolor }),
        _bl = new Text((meta.author || '[Unknown]') + ' ' + (duration ? (duration + 's') : '?s') +
                       ' ' + (anim.width || 0) + 'x' + (anim.height || 0),
                      (9 * ratio) + 'px ' + InfoBlock.FONT, { color: this.__fgcolor }),  // meta.version, meta.description, meta.copyright
        _p = InfoBlock.PADDING,
        _td = _tl.dimen(),
        _bd = _bl.dimen(),
        _nw = Math.max(_td[0], _bd[0]) + _p + _p,
        _nh = _td[1] + _bd[1] + (_p * 3),
        ctx = this.ctx;
    canvasOpts(this.canvas, [ _nw, _nh ], this.canvas.__pxRatio);
    ctx.save();
    ctx.clearRect(0, 0, _nw, _nh);
    ctx.fillStyle = this.__bgcolor;
    //Controls.__roundRect(ctx, 0, 0, _nw, _nh, 5);
    ctx.fill();
    ctx.fillStyle = this.__fgcolor;
    ctx.translate(_p, _p);
    _tl.apply(ctx);
    ctx.globalAlpha = .8;
    ctx.translate(0, _bd[1] + _p * 2);
    _bl.apply(ctx);
    ctx.restore();
}
InfoBlock.prototype.inject = function(meta, anim, duration) {
    this.__data = [ meta, anim, duration || meta.duration ];
    if (this.ready) this.render();
}
InfoBlock.prototype.inBounds = function(point) {
    if (this.hidden || !this.bounds) return false;
    var _b = this.bounds;
    return (point[0] >= _b[0]) &&
           (point[0] <= _b[2]) &&
           (point[1] >= _b[1]) &&
           (point[1] <= _b[3]);
}
InfoBlock.prototype.evtInBounds = function(evt) {
    if (this.hidden) return false;
    return this.inBounds([evt.pageX, evt.pageY]);
}
InfoBlock.prototype.reset = function() {

}
InfoBlock.prototype.hide = function() {
    this.hidden = true;
    this.canvas.style.display = 'none';
}
InfoBlock.prototype.show = function() {
    this.hidden = false;
    this.canvas.style.display = 'block';
}
InfoBlock.prototype.setDuration = function(value) {
    if (this.__data) this.inject(this.__data[0], this.__data[1], value);
}
InfoBlock.prototype.changeTheme = function(front, back) {
    this.__fgcolor = front;
    this.__bgcolor = back;
    // TODO: redraw
}

// Strings
// -----------------------------------------------------------------------------

var Strings = {};

Strings.COPYRIGHT = '© Animatron Player';
Strings.LOADING = 'Loading...';
Strings.LOADING_ANIMATION = 'Loading {0}...';

// ### Errors Strings
/* ------------------ */

/* TODO: Move Scene and Element errors here */

var Errors = {};
Errors.S = {}; // System Errors
Errors.P = {}; // Player Errors
Errors.A = {}; // Animation Errors

Errors.S.NO_JSON_PARSER = 'JSON parser is not accessible';
Errors.S.ERROR_HANDLING_FAILED = 'Error-handling mechanics were broken with error {0}';
Errors.S.NO_METHOD_FOR_PLAYER = 'No method \'{0}\' exist for player.';
Errors.P.NO_IMPORTER_TO_LOAD_WITH = 'Cannot load project without importer. Please define it';
Errors.P.NO_CANVAS_WITH_ID = 'No canvas found with given id: {0}';
Errors.P.NO_CANVAS_WAS_PASSED = 'No canvas was passed';
Errors.P.CANVAS_NOT_PREPARED = 'Canvas is not prepared, don\'t forget to call \'init\' method';
Errors.P.ALREADY_PLAYING = 'Player is already in playing mode, please call ' +
                           '\'stop\' or \'pause\' before playing again';
Errors.P.PAUSING_WHEN_STOPPED = 'Player is stopped, so it is not allowed to pause';
Errors.P.NO_SCENE_PASSED = 'No scene passed to load method';
Errors.P.NO_STATE = 'There\'s no player state defined, nowhere to draw, ' +
                    'please load something in player before ' +
                    'calling its playing-related methods';
Errors.P.NO_SCENE = 'There\'s nothing at all to manage with, ' +
                    'please load something in player before ' +
                    'calling its playing-related methods';
Errors.P.COULD_NOT_LOAD_WHILE_PLAYING = 'Could not load any scene while playing or paused, ' +
                    'please stop player before loading';
Errors.P.BEFOREFRAME_BEFORE_PLAY = 'Please assign beforeFrame callback before calling play()';
Errors.P.AFTERFRAME_BEFORE_PLAY = 'Please assign afterFrame callback before calling play()';
Errors.P.BEFORERENDER_BEFORE_PLAY = 'Please assign beforeRender callback before calling play()';
Errors.P.AFTERRENDER_BEFORE_PLAY = 'Please assign afterRender callback before calling play()';
Errors.P.PASSED_TIME_VALUE_IS_NO_TIME = 'Given time is not allowed, it is treated as no-time';
Errors.P.PASSED_TIME_NOT_IN_RANGE = 'Passed time ({0}) is not in scene range';
Errors.P.DURATION_IS_NOT_KNOWN = 'Duration is not known';
Errors.P.ALREADY_ATTACHED = 'Player is already attached to this canvas, please use another one';
Errors.P.INIT_TWICE = 'Initialization was called twice';
Errors.P.INIT_AFTER_LOAD = 'Initialization was called after loading a scene';
Errors.A.ELEMENT_IS_REGISTERED = 'This element is already registered in scene';
Errors.A.ELEMENT_IS_NOT_REGISTERED = 'There is no such element registered in scene';
Errors.A.UNSAFE_TO_REMOVE = 'Unsafe to remove, please use iterator-based looping (with returning false from iterating function) to remove safely';
Errors.A.NO_ELEMENT_TO_REMOVE = 'Please pass some element or use detach() method';
Errors.A.NO_ELEMENT = 'No such element found';
Errors.A.ELEMENT_NOT_ATTACHED = 'Element is not attached to something at all';
Errors.A.MODIFIER_NOT_ATTACHED = 'Modifier wasn\'t applied to anything';
Errors.A.NO_MODIFIER_PASSED = 'No modifier was passed';
Errors.A.NO_PAINTER_PASSED = 'No painter was passed';
Errors.A.MODIFIER_REGISTERED = 'Modifier was already added to this element';
Errors.A.PAINTER_REGISTERED = 'Painter was already added to this element';

var _anmGuySpec = [
  [ 180, 278 ], // origin
  [ 235, 290 ], // dimensions
  [ "rgba(35,31,32,1.0)",
    "rgba(241,91,42,1.0)" ], // colors
  [
    // before the mask
    // [ color-id, path ]
    [ 0, "M206.367 561.864 L210.181 558.724 C228.037 544.497 253.515 532.989 280.474 527.013 C310.171 520.432 331.881 522.276 352.215 531.595 L357.041 534.028 C357.35 534.198 357.661 534.362 357.965 534.536 C358.084 534.603 358.207 534.646 358.333 534.68 L358.358 534.693 C358.38 534.698 358.404 534.697 358.427 534.701 C358.499 534.716 358.572 534.723 358.644 534.726 C358.665 534.727 358.687 534.734 358.708 534.734 C358.718 534.734 358.727 534.729 358.736 534.729 C358.901 534.725 359.061 534.695 359.214 534.639 C359.235 534.631 359.255 534.624 359.275 534.617 C359.427 534.555 359.568 534.468 359.694 534.357 C359.703 534.35 359.713 534.347 359.72 534.34 C359.734 534.327 359.742 534.312 359.755 534.299 C359.812 534.242 359.864 534.182 359.911 534.115 C359.934 534.084 359.958 534.054 359.977 534.022 C359.987 534.005 360.0 533.993 360.01 533.976 C360.042 533.919 360.063 533.859 360.088 533.8 C360.099 533.773 360.113 533.747 360.123 533.719 C360.16 533.612 360.185 533.502 360.197 533.393 C360.199 533.372 360.197 533.352 360.197 533.331 C360.204 533.239 360.202 533.147 360.191 533.057 C360.189 533.042 360.192 533.029 360.19 533.014 C357.081 511.941 353.944 495.52 351.031 482.785 C357.244 479.02 363.189 474.743 368.789 469.964 C393.406 448.956 409.766 419.693 414.851 387.568 C414.984 386.729 414.572 385.898 413.824 385.495 C413.078 385.094 412.154 385.206 411.528 385.778 C411.211 386.068 379.366 414.738 343.77 414.738 C342.291 414.738 340.805 414.687 339.353 414.59 C337.351 414.454 335.324 414.175 333.283 413.779 C331.964 409.499 330.461 404.804 328.77 399.802 C359.392 384.303 365.286 347.489 365.523 345.916 L365.673 344.918 L364.958 344.204 C343.833 323.079 316.491 319.925 302.074 319.925 C297.818 319.925 294.309 320.184 292.346 320.397 C292.057 319.943 291.367 318.531 291.075 318.082 L291.075 318.082 L289.93 318.134 C288.782 318.186 262.998 319.502 240.402 333.108 C240.257 332.844 240.11 332.58 239.97 332.321 C239.519 331.483 238.543 331.077 237.63 331.355 C237.138 331.503 188.319 346.777 182.558 392.748 C179.346 418.379 183.819 442.529 195.154 460.749 C198.743 466.519 202.966 471.691 207.797 476.277 C205.628 493.159 199.308 523.779 199.131 560.445 C199.131 560.448 199.131 560.449 199.131 560.449 C199.103 560.84 199.374 561.582 199.61 561.929 C200.857 563.749 203.878 563.485 206.367 561.864 L206.367 561.864 M329.861 356.921 C337.152 356.921 343.681 355.511 347.423 354.501 C343.397 371.078 329.711 383.191 323.809 387.651 C319.732 376.532 315.353 363.711 309.755 351.798 C315.197 355.032 321.929 356.921 329.861 356.921 L329.861 356.921 M274.473 524.377 C255.607 528.559 237.545 535.219 222.207 543.738 C226.13 536.158 235.429 517.686 244.087 496.592 C250.783 498.607 257.965 500.123 265.665 501.096 C271.15 501.789 276.723 502.14 282.228 502.14 C295.39 502.14 308.416 500.139 320.898 496.304 C330.401 510.462 338.24 520.043 342.222 524.674 C323.029 518.972 299.648 518.8 274.473 524.377 L274.473 524.377 M206.367 561.864 Z" ]
  ], [
    // masking
    "M228.106 361.104 L235.292 339.707 C220.431 347.023 207.762 353.681 193.499 382.89 L193.371 383.129 C193.335 383.196 193.081 398.216 215.426 411.593 L217.722 398.247 C213.866 395.442 209.922 392.815 203.684 382.392 L203.684 382.392 L206.09 382.041 C206.795 381.993 223.527 380.653 227.963 361.515 L228.106 361.104 L228.106 361.104 M228.106 361.104 Z",
    "M335.139 434.771 C330.899 418.584 314.627 362.091 288.434 321.155 C282.932 321.595 258.458 326.742 239.48 337.752 C237.387 342.508 222.985 385.396 214.605 457.106 C223.094 451.426 246.173 437.705 278.306 432.083 C289.482 430.127 298.912 429.177 307.136 429.177 C318.52 429.176 327.736 431.012 335.139 434.771 L335.139 434.771 M335.139 434.771 Z",
    "M261.669 283.483 C261.122 283.608 260.536 283.529 259.968 283.62 C259.175 283.855 244.69 288.784 240.497 330.304 L252.545 325.896 C252.958 325.746 253.41 325.735 253.829 325.865 C254.189 325.977 262.588 328.605 265.889 329.881 C265.942 329.886 266.001 329.886 266.067 329.886 C268.22 329.886 273.176 328.592 274.266 327.977 C274.929 327.028 277.335 323.153 279.406 319.753 C279.715 319.246 280.233 318.902 280.82 318.815 L287.047 317.888 C283.65 306.582 275.276 280.377 261.669 283.483 L261.669 283.483 M261.669 283.483 Z"
  ],
  [
    // after the mask
    // [ color-id, path ]
    [ 0, "M258.16 316.686 L260.482 319.943 C260.531 319.909 265.533 316.427 272.469 316.574 L272.549 312.574 C264.239 312.415 258.404 316.512 258.16 316.686 L258.16 316.686 M258.16 316.686 Z" ],
    [ 0, "M291.524 319.015 C290.269 315.412 275.55 278.38 261.669 279.484 C260.863 279.548 259.839 279.603 258.948 279.754 C258.183 279.914 240.364 284.186 236.22 333.101 C236.162 333.782 236.456 334.445 236.999 334.86 C237.353 335.13 237.78 335.27 238.213 335.27 C238.444 335.27 238.677 335.23 238.9 335.148 L253.28 329.887 C255.368 330.545 261.949 332.636 264.544 333.651 C264.954 333.811 265.438 333.886 266.065 333.886 C266.065 333.886 266.065 333.886 266.065 333.886 C268.166 333.886 275.679 332.241 277.179 330.305 C277.858 329.427 281.074 323.856 282.394 321.697 L289.246 321.084 C289.809 321.0 290.95 321.105 291.263 320.63 C291.575 320.151 291.711 319.553 291.524 319.015 L291.524 319.015 M280.818 318.813 C280.231 318.901 279.713 319.245 279.404 319.751 C277.333 323.15 274.927 327.025 274.264 327.975 C273.174 328.59 268.218 329.884 266.065 329.884 C265.999 329.884 265.94 329.884 265.887 329.879 C262.586 328.604 254.187 325.976 253.827 325.863 C253.408 325.733 252.956 325.744 252.543 325.894 L240.495 330.302 C241.15 323.815 242.058 318.233 243.124 313.412 C246.317 310.925 256.071 305.486 274.186 302.326 L272.507 297.31 C256.366 300.166 248.436 303.975 245.019 306.105 C246.927 299.814 249.104 295.257 251.197 291.967 C253.956 288.64 261.686 281.937 265.486 288.565 C266.311 290.004 265.915 293.995 261.883 294.298 C261.883 294.298 271.143 298.247 272.283 289.079 C277.986 295.21 284.709 310.11 287.043 317.884 L280.818 318.813 L280.818 318.813 M291.524 319.015 Z" ],
    [ 1, "M232.358 389.656 C232.358 389.656 247.035 382.551 257.026 379.59 L272.548 358.341 L289.591 374.478 C289.591 374.478 302.954 372.629 311.024 374.716 C311.024 374.716 291.608 351.323 279.443 344.346 L261.899 346.255 C256.74 352.255 242.601 369.901 232.358 389.656 L232.358 389.656 M232.358 389.656 Z" ]
  ]
];

var anmGuyCanvas,
    anmGuyCtx;
function drawAnimatronGuy(ctx, x, y, size, colors, opacity) {
    var spec = _anmGuySpec,
        origin = spec[0],
        dimensions = spec[1],
        scale = size ? (size / Math.max(dimensions[0], dimensions[1])) : 1,
        colors = colors || spec[2],
        shapes_before = spec[3]
        masking_shapes = spec[4],
        shapes_after = spec[5];

    var w = dimensions[0] * scale,
        h = dimensions[1] * scale;

    if (!anmGuyCanvas) {
        // FIXME: change to engine code
        anmGuyCanvas = newCanvas([ w, h ]);
        anmGuyCtx = anmGuyCanvas.getContext('2d');
    } else {
        anmGuyCanvas.width = w;
        anmGuyCanvas.height = h;
    }

    var maskCanvas = anmGuyCanvas;
    var maskCtx = anmGuyCtx;

    // prepare
    maskCtx.clearRect(0, 0, w, h);
    if (scale != 1) maskCtx.scale(scale, scale);
    maskCtx.translate(-origin[0], -origin[1]);
    maskCtx.save();

    // draw masked shapes
    for (var i = 0; i < shapes_before.length; i++) {
        var shape = shapes_before[i],
            fill = colors[shape[0]],
            path = new Path(shape[1], fill);

        path.apply(maskCtx);
    }

    // draw and apply mask
    maskCtx.save();
    maskCtx.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < masking_shapes.length; i++) {
        var shape = masking_shapes[i],
            path = new Path(shape, '#fff');

        path.apply(maskCtx);
    }
    maskCtx.restore();

    // draw shapes after
    for (var i = 0; i < shapes_after.length; i++) {
        var shape = shapes_after[i],
            fill = colors[shape[0]],
            path = new Path(shape[1], fill);

        path.apply(maskCtx);
    }

    // draw over the main context
    maskCtx.restore();

    ctx.save();
    if (opacity) ctx.globalAlpha = opacity;
    ctx.drawImage(maskCanvas, x - (w / 2), y - (h / 2));
    ctx.restore();
}

// Exports
// -----------------------------------------------------------------------------

return function($trg) {

    if (!$trg) $trg = {};

    if (!$trg.MODULES)  $trg.MODULES = {};
    if (!$trg._globals) $trg._globals = {};

    function __createPlayer(cvs, opts) { var p = new Player();
                                         p.init(cvs, opts); return p; }

    var __globals = {
        'createPlayer': __createPlayer
    }
    for (prop in __globals) {
        $trg._globals[prop] = __globals[prop];
        $glob[prop] = __globals[prop];
    }

    /*$trg.__js_pl_all = this;*/

    $trg.createPlayer = __createPlayer;
    $trg._$ = __createPlayer;

    $trg.C = C; // constants
    $trg.M = M; // modules
    $trg.Player = Player;
    $trg.Scene = Scene; $trg.Element = Element; $trg.Clip = Clip;
    $trg.Path = Path; $trg.Text = Text; $trg.Sheet = Sheet; $trg.Image = _Image;
    $trg.Tweens = Tweens; $trg.Tween = Tween; $trg.Easing = Easing;
    $trg.MSeg = MSeg; $trg.LSeg = LSeg; $trg.CSeg = CSeg;
    $trg.Render = Render; $trg.Bands = Bands;  // why Render and Bands classes are visible to pulic?
    $trg.Errors = Errors; $trg.SystemError = SystemError;
                          $trg.PlayerError = PlayerError;
                          $trg.AnimationError = AnimationError;

    $trg.obj_clone = obj_clone; $trg.ajax = ajax;

    $trg._typecheck = { builder: __builder,
                        arr: __arr,
                        num: __num,
                        obj: __obj,
                        fun: __fun,
                        str: __str };
    $trg._valcheck = { finite: __finite,
                       nan: __nan };
    $trg.__dev = { '_win': function() { return $wnd },
                   '_winf': function(w) { $wnd = w; },
                   'strf': _strf,
                   'adjust': __adjust,
                   't_cmp': __t_cmp,
                   'TIME_PRECISION': TIME_PRECISION/*,
                   'Controls': Controls, 'Info': InfoBlock*/ };

    return $trg;

}

});
