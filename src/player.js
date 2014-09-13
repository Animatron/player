/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */
// Player Core
// =============================================================================

// This file contains only the Animatron Player core source code, without any _modules_
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
// - **Animation** —
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

if (typeof __anm_engine === 'undefined') throw new Error('No engine found!');

__anm_engine.define('anm/Player', ['anm'], function(anm) {

var $engine = anm.engine;
var $conf = anm.conf;
var $log = anm.log;

// Utils
// -----------------------------------------------------------------------------

// ### Events
/* ---------- */

var provideEvents = anm.provideEvents;
var registerEvent = anm.registerEvent;

// ### Other External utilities
/* ---------- */

var getGlobal = anm.getGlobal;
var registerGlobally = anm.registerGlobally;

var iter = anm.iter;
var guid = anm.guid;

// value/typecheck
var is = anm.is;
var __defined = is.defined,
    __finite  = is.finite,
    __nan     = is.nan,
    __arr     = is.arr,
    __num     = is.num,
    __fun     = is.fun,
    __obj     = is.obj,
    __str     = is.str,

    __modifier = is.modifier;
    __painter  = is.painter;

// ### Strings & Errors
/* ---------- */

var Strings = anm.Strings,
    Errors = anm.Errors;

var SystemError = anm.SystemError,
    SysErr = SystemError;

var PlayerError = anm.PlayerError,
    PlayerErr = PlayerError;

var AnimationError = anm.AnimationError,
    AnimErr = AnimationError;

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

// TODO: move to Color class

function fmt_time(time) {
  if (!__finite(time)) return '∞';
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

// ### Internal Helpers
/* -------------------- */

// map back to functions for faster access (is it really so required?)

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

function __interpolateFloat(a, b, t) {
    return a*(1-t)+b*t;
}

// #### other

function __paramsToObj(pstr) {
    var o = {}, ps = pstr.split('&'), i = ps.length, pair;
    while (i--) { pair = ps[i].split('='); o[pair[0]] = pair[1]; }
    return o;
}

// for one-level objects, so no hasOwnProperty check
function obj_clone(what) {
    var dest = {};
    for (var prop in what) {
        dest[prop] = what[prop];
    }
    return dest;
}

function _mrg_obj(src, backup, trg) {
    if (!backup) return src;
    var res = trg || {};
    for (var prop in backup) {
        res[prop] = __defined(src[prop]) ? src[prop] : backup[prop]; };
    return res;
}

function _strf(str, subst) {
    var args = subst;
    return str.replace(/{(\d+)}/g, function(match, number) {
      return __defined(args[number])
        ? args[number]
        : match
      ;
    });
};

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

var C = anm.C; // will be transferred to public namespace both from bottom of player.js

var _ResMan = anm.resource_manager;
var _PlrMan = anm.player_manager;

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
            | C.M_INFO_DISABLED
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

C.LT_ANIMATION = 1;
C.LT_ELEMENTS = 2;
C.LT_IMPORT = 3;
C.LT_URL = 4;

// ### Loading modes
/* ---------------- */

C.LM_ONREQUEST = 'onrequest';
C.LM_ONPLAY = 'onplay';
// C.LM_ONSCROLL
// C.LM_ONSCROLLIN

C.LM_DEFAULT = C.LM_ONREQUEST;

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
registerEvent('S_COMPLETE', 'complete', 'complete');
registerEvent('S_REPEAT', 'repeat', 'repeat');
registerEvent('S_IMPORT', 'import', 'import');
registerEvent('S_LOAD', 'load', 'load');
registerEvent('S_RES_LOAD', 'res_load', 'res_load');
registerEvent('S_ERROR', 'error', 'error');

/* X_ERROR, X_FOCUS, X_RESIZE, X_SELECT, touch events */

var DOM_TO_EVT_MAP = {
  'mouseup':   C.X_MUP,
  'mousedown': C.X_MDOWN,
  'mousemove': C.X_MMOVE,
  'mouseover': C.X_MOVER,
  'mouseout':  C.X_MOUT,
  'click':     C.X_MCLICK,
  'dblclick':  C.X_MDCLICK,
  'keyup':     C.X_KUP,
  'keydown':   C.X_KDOWN,
  'keypress':  C.X_KPRESS
};

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

// Importers
// -----------------------------------------------------------------------------

var I = {};

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

Player.DEFAULT_CONFIGURATION = { 'debug': false,
                                 'repeat': false,
                                 'autoPlay': false,
                                 'mode': C.M_VIDEO,
                                 'zoom': 1.0,
                                 'speed': 1.0,
                                 'width': undefined,
                                 'height': undefined,
                                 //'fps': undefined,
                                 'infiniteDuration': undefined, // undefined means 'auto'
                                 'drawStill': undefined, // undefined means 'auto'
                                 'audioEnabled': true,
                                 'imagesEnabled': true,
                                 'shadowsEnabled': true,
                                 'handleEvents': undefined, // undefined means 'auto'
                                 'controlsEnabled': undefined, // undefined means 'auto'
                                 'infoEnabled': undefined, // undefined means 'auto'
                                 'loadingMode': C.LM_DEFAULT, // undefined means 'auto'
                                 'thumbnail': undefined,
                                 'bgColor': undefined,
                                 'ribbonsColor': undefined,
                                 'forceAnimationSize': false,
                                 'muteErrors': false
                               };

Player.EMPTY_BG = 'rgba(0,0,0,.05)';
Player.EMPTY_STROKE = 'rgba(50,158,192,.5)';
Player.EMPTY_STROKE_WIDTH = 3;

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
//     { 'debug': false,
//       'autoPlay': false,
//       'repeat': false,
//       'mode': C.M_VIDEO,
//       'zoom': 1.0,
//       'speed': 1.0,
//       'width': undefined,
//       'height': undefined,
//       'bgColor': undefined,
//       'ribbonsColor': undefined,
//       'audioEnabled': true,
//       'inifiniteDuration': false,
//       'drawStill': false,
//       'controlsEnabled': undefined, // undefined means 'auto'
//       'infoEnabled': undefined, // undefined means 'auto'
//       'handleEvents': undefined, // undefined means 'auto'
//       'loadingMode': undefined, // undefined means 'auto'
//       'thumbnail': undefined,
//       'forceAnimationSize': false,
//       'muteErrors': false
//     }

Player.prototype.init = function(elm, opts) {
    if (this.canvas || this.wrapper) throw new PlayerErr(Errors.P.INIT_TWICE);
    if (this.anim) throw new PlayerErr(Errors.P.INIT_AFTER_LOAD);
    this._initHandlers(); /* TODO: make automatic */
    this._prepare(elm);
    this._addOpts(Player.DEFAULT_CONFIGURATION);
    this._addOpts($engine.extractUserOptions(this.canvas));
    this._addOpts($engine.extractUserOptions(this.wrapper));
    this._addOpts(opts || {});
    this._postInit();
    this._checkOpts();
    /* TODO: if (this.canvas.hasAttribute('data-url')) */

    _PlrMan.fire(C.S_NEW_PLAYER, this);
    return this;
}
Player.prototype.load = function(arg1, arg2, arg3, arg4) {

    var player = this,
        state = player.state;

    if ((state.happens === C.PLAYING) ||
        (state.happens === C.PAUSED)) {
        throw new PlayerErr(Errors.P.COULD_NOT_LOAD_WHILE_PLAYING);
    }

    /* object */
    /* object, callback */
    /* object, importer */
    /* object, duration */
    /* object, importer, callback */
    /* object, duration, callback */
    /* object, duration, importer, callback */

    var object = arg1,
        duration, importer, callback;

    if (object && object.id && player.anim && (player.anim.id == object.id)) {
        $log.info('Animation with ID=' + object.id + ' is already loaded in player, skipping the call');
        return;
    }

    var durationPassed = false;

    // FIXME: it is possible that importer constructor function will be passed
    //        as importer (it will have IMPORTER_ID property as a marker),
    //        since `anm.getImporter` name is not obvious;
    //        we can't let ourselves create an importer instance manually here,
    //        so it's considered a problem of naming.
    if ((arg2 && arg2.IMPORTER_ID) || (arg3 && arg3.IMPORTER_ID)) {
        throw new Error(Errors.P.IMPORTER_CONSTRUCTOR_PASSED);
    }

    if (__fun(arg2)) { callback = arg2 } /* object, callback */
    else if (__num(arg2) || !arg2) { /* object, duration[, ...] */
        if (__num(arg2)) {
          duration = arg2;
          durationPassed = true;
        }
        if (__obj(arg3)) { /* object, duration, importer[, callback] */
          importer = arg3; callback = arg4;
        } else if (__fun(arg3)) { /* object, duration, callback */
          callback = arg3;
        }
    } else if (__obj(arg2)) { /* object, importer[, ...] */
        importer = arg2;
        callback = arg3;
    }

    if ((player.loadingMode == C.LM_ONPLAY) &&
        !player._playLock) { // if play lock is set, we should just load an animation normally, since
                             // it was requested after the call to 'play', or else it was called by user
                             // FIXME: may be playLock was set by player and user calls this method
                             //        while some animation is already loading
        if (player._postponedLoad) throw new PlayerErr(Errors.P.LOAD_WAS_ALREADY_POSTPONED);
        player._lastReceivedAnimationId = null;
        // this kind of postponed call is different from the ones below (_clearPostpones and _postpone),
        // since this one is related to loading mode, rather than calling later some methods which
        // were called during the process of loading (and were required to be called when it was finished).
        player._postponedLoad = [ object, duration, importer, callback ];
        player.stop();
        return;
    }

    // if player was loading resources already when .load() was called, inside the ._reset() method
    // postpones will be cleared and loaders cancelled

    if (!object) {
        player.anim = null;
        player._reset();
        player.stop();
        throw new PlayerErr(Errors.P.NO_ANIMATION_PASSED);
    }

    if (!player.__canvasPrepared) throw new PlayerErr(Errors.P.CANVAS_NOT_PREPARED);

    player._reset();

    state.happens = C.LOADING;
    player.fire(C.S_CHANGE_STATE, C.LOADING);
    player._runLoadingAnimation();

    var whenDone = function(result) {
        var anim = player.anim;
        if (player.handleEvents) {
            // checks inside if was already subscribed before, skips if so
            player.__subscribeDynamicEvents(anim);
        }
        var remotes = anim._collectRemoteResources(player);
        if (!remotes.length) {
            player._stopLoadingAnimation();
            if (player.controls) player.controls.inject(anim);
            player.fire(C.S_LOAD, result);
            if (!player.handleEvents) player.stop();
            if (callback) callback.call(player, result);
            // player may appear already playing something if autoPlay or a similar time-jump
            // flag was set from some different source of options (async, for example),
            // then the rule (for the moment) is: last one wins
            if (player.autoPlay) {
                if (player.state.happens === C.PLAYING) player.stop();
                player.play();
            }
        } else {
            state.happens = C.RES_LOADING;
            player.fire(C.S_CHANGE_STATE, C.RES_LOADING);
            player.fire(C.S_RES_LOAD, remotes);
            // subscribe to wait until remote resources will be ready or failed
            _ResMan.subscribe(player.id, remotes, [ player.__defAsyncSafe(
                function(res_results, err_count) {
                    //if (err_count) throw new AnimErr(Errors.A.RESOURCES_FAILED_TO_LOAD);
                    if (player.anim === result) { // avoid race condition when there were two requests
                        // to load different animations and first one finished loading
                        // after the second one
                        player._stopLoadingAnimation();
                        if (player.controls) player.controls.inject(result);
                        player.state.happens = C.LOADING;
                        player.fire(C.S_CHANGE_STATE, C.LOADING);
                        player.fire(C.S_LOAD, result);
                        if (!player.handleEvents) player.stop();
                        player._callPostpones();
                        if (callback) callback.call(player, result);
                        // player may appear already playing something if autoPlay or a similar time-jump
                        // flag was set from some different source of options (async, for example),
                        // then the rule (for the moment) is: last one wins
                        if (player.autoPlay) {
                            if (player.state.happens === C.PLAYING) player.stop();
                            player.play();
                        }
                    }
                }
            ) ]);
            // actually start loading remote resources
            anim._loadRemoteResources(player);
        }

    };
    whenDone = player.__defAsyncSafe(whenDone);

    /* TODO: configure canvas using clips bounds? */

    if (player.anim) {
        player.__unsubscribeDynamicEvents(player.anim);
        player.anim.__removeMaskCanvases();
    }

    if (object) {

        if (object instanceof Animation) { // Animation instance
            player._loadTarget = C.LT_ANIMATION;
            L.loadAnimation(player, object, whenDone);
        } else if (__arr(object) || (object instanceof Element)) { // array of elements
            player._loadTarget = C.LT_ELEMENTS;
            L.loadElements(player, object, whenDone);
        } else if (__str(object)) { // URL
            var controls = player.controls;
            player._loadTarget = C.LT_URL;
            player._loadSrc = object;
            L.loadFromUrl(player, object, importer, whenDone);
        } else { // any object with importer
            player._loadTarget = C.LT_IMPORT;
            L.loadFromObj(player, object, importer, whenDone);
        }

    } else {
        player._loadTarget = C.LT_ANIMATION;
        player.anim = new Animation();
        whenDone(player.anim);
    }

    if (durationPassed) { // FIXME: move to whenDone?
        player.anim.duration = duration;
        if (player.controls) player.controls.setDuration(duration);
    }

    return player;
}

var __nextFrame = $engine.getRequestFrameFunc(),
    __stopAnim  = $engine.getCancelFrameFunc();
Player.prototype.play = function(from, speed, stopAfter) {

    var player = this;

    player._ensureHasState();

    var state = player.state;

    if (state.happens === C.PLAYING) {
        if (player.infiniteDuration) return; // it's ok to skip this call if it's some dynamic animation (FIXME?)
        else throw new PlayerErr(Errors.P.ALREADY_PLAYING);
    }

    if ((player.loadingMode === C.LM_ONPLAY) && !player._lastReceivedAnimationId) {
        if (player._playLock) return; // we already loading something
        // use _postponedLoad with _playLock flag set
        // call play when loading was finished
        player._playLock = true;
        var loadArgs = player._postponedLoad,
            playArgs = arguments;
        if (!loadArgs) throw new PlayerErr(Errors.P.NO_LOAD_CALL_BEFORE_PLAY);
        var loadCallback = loadArgs[3];
        function afterLoad() {
            if (loadCallback) loadCallback.call(player, arguments);
            player._postponedLoad = null;
            player._playLock = false;
            player._lastReceivedAnimationId = player.anim.id;
            Player.prototype.play.apply(player, playArgs);
        };
        loadArgs[3] = afterLoad; // substitute callback with our variant which calls the previous one
        Player.prototype.load.apply(player, loadArgs);
        return;
    }

    if ((player.loadingMode === C.LM_ONREQUEST) &&
        (state.happens === C.RES_LOADING)) { player._postpone('play', arguments);
                                             return; } // if player loads remote resources just now,
                                                       // postpone this task and exit. postponed tasks
                                                       // will be called when all remote resources were
                                                       // finished loading

    // reassigns var to ensure proper function is used
    //__nextFrame = $engine.getRequestFrameFunc();
    //__stopAnim = $engine.getCancelFrameFunc();

    player._ensureHasAnim();

    var anim = player.anim;
    anim.reset();

    // used to resume playing in some special cases
    state.__lastPlayConf = [ from, speed, stopAfter ];

    state.from = from || 0;
    state.time = Player.NO_TIME;
    state.speed = (speed || 1) * (player.speed || 1) * (anim.speed || 1);
    state.stop = (typeof stopAfter !== 'undefined') ? stopAfter : state.stop;
    state.duration = player.inifiniteDuration ? Infinity
                     : (anim.duration || (anim.isEmpty() ? 0
                                                           : Animation.DEFAULT_DURATION));

    if (state.duration == undefined) throw new PlayerErr(Errors.P.DURATION_IS_NOT_KNOWN);

    state.__startTime = Date.now();
    state.__redraws = 0;
    state.__rsec = 0;
    state.__prevt = 0;

    // this flags actually stops the animation,
    // __stopAnim is called just for safety reasons :)
    state.__supressFrames = false;

    /*if (state.__drawInterval !== null) {
        clearInterval(player.state.__drawInterval);
    }*/

    player._notifyAPI(); // checks if it's really required just inside

    state.happens = C.PLAYING;


    //if (state.from > 2) throw new Error('Test');

    // FIXME: W3C says to call stopAnim (cancelAnimationFrame) with ID
    //        of the last call of nextFrame (requestAnimationFrame),
    //        not the first one, but some Mozilla / HTML5tutorials examples use ID
    //        of the first call. Anyway, __supressFrames stops our animation in fact,
    //        __stopAnim is called "to ensure", may be it's not a good way to ensure,
    //       though...
    state.__firstReq = __r_loop(player.ctx,
                                player, anim,
                                player.__beforeFrame(anim),
                                player.__afterFrame(anim),
                                player.__userBeforeRender,
                                player.__userAfterRender);

    player.fire(C.S_CHANGE_STATE, C.PLAYING);
    player.fire(C.S_PLAY, state.from);

    return player;
}

Player.prototype.stop = function() {
    /* if (state.happens === C.STOPPED) return; */

    var player = this;

    player._ensureHasState();

    var state = player.state;

    // if player loads remote resources just now,
    // postpone this task and exit. postponed tasks
    // will be called when all remote resources were
    // finished loading
    if ((state.happens === C.RES_LOADING) &&
        (player.loadingMode === C.LM_ONREQUEST)) {
        player._postpone('stop', arguments);
        return;
    }

    if ((state.happens === C.PLAYING) ||
        (state.happens === C.PAUSED)) {
        // this flags actually stops the animation,
        // __stopAnim is called just for safety reasons :)
        state.__supressFrames = true;
        __stopAnim(state.__firstReq);
    }

    state.time = Player.NO_TIME;
    state.from = 0;
    state.stop = Player.NO_TIME;

    var anim = player.anim;

    if (anim || ((player.loadingMode == C.LM_ONPLAY) &&
                   player._postponedLoad)) {
        state.happens = C.STOPPED;
        player._drawStill();
        if (player.controls/* && !player.controls.hidden*/) {
            // FIXME: subscribe controls to S_STOP event instead
            player.controls.show();
            player.controls.forceNextRedraw();
            player.controls.render(state.time);
        }
        player.fire(C.S_CHANGE_STATE, C.STOPPED);
    } else if (state.happens !== C.ERROR) {
        state.happens = C.NOTHING;
        if (!player.controls) player._drawSplash();
        player.fire(C.S_CHANGE_STATE, C.NOTHING);
    }

    player.fire(C.S_STOP);

    if (anim) anim.reset();

    return player;
}

Player.prototype.pause = function() {
    var player = this;

    // if player loads remote resources just now,
    // postpone this task and exit. postponed tasks
    // will be called when all remote resources were
    // finished loading
    if ((player.state.happens === C.RES_LOADING) &&
        (player.loadingMode === C.LM_ONREQUEST)) {
        player._postpone('pause', arguments);
        return;
    }

    player._ensureHasState();
    player._ensureHasAnim();

    var state = player.state;
    if (state.happens === C.STOPPED) {
        throw new PlayerErr(Errors.P.PAUSING_WHEN_STOPPED);
    }

    if (state.happens === C.PLAYING) {
        // this flags actually stops the animation,
        // __stopAnim is called just for safety reasons :)
        state.__supressFrames = true;
        __stopAnim(state.__firstReq);
    }

    if (state.time > state.duration) {
        state.time = state.duration;
    }

    state.from = state.time;
    state.happens = C.PAUSED;

    player.drawAt(state.time);

    player.fire(C.S_CHANGE_STATE, C.PAUSED);
    player.fire(C.S_PAUSE, state.time);

    return player;
}


Player.prototype.onerror = function(callback) {
    this.__err_handler = callback;

    return this;
}

// ### Inititalization
/* ------------------- */

provideEvents(Player, [ C.S_IMPORT, C.S_CHANGE_STATE, C.S_LOAD, C.S_RES_LOAD,
                        C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_COMPLETE, C.S_REPEAT,
                        C.S_ERROR ]);
Player.prototype._prepare = function(elm) {
    if (!elm) throw new PlayerErr(Errors.P.NO_WRAPPER_PASSED);
    var wrapper_id, wrapper;
    if (__str(elm)) {
        wrapper_id = elm;
        wrapper = $engine.getElementById(wrapper_id);
        if (!wrapper_id) throw new PlayerErr(_strf(Errors.P.NO_WRAPPER_WITH_ID, [wrapper_id]));
    } else {
        if (!elm.id) elm.id = ('anm-player-' + Player.__instances);
        wrapper_id = elm.id;
        wrapper = elm;
    }
    var assign_data = $engine.assignPlayerToWrapper(wrapper, this, 'anm-player-' + Player.__instances);
    this.id = assign_data.id;
    this.wrapper = assign_data.wrapper;
    this.canvas = assign_data.canvas;
    if (!$engine.checkPlayerCanvas(this.canvas)) throw new PlayerErr(Errors.P.CANVAS_NOT_VERIFIED);
    this.ctx = $engine.getContext(this.canvas, '2d');
    this.state = Player.createState(this);
    this.fire(C.S_CHANGE_STATE, C.NOTHING);

    this.subscribeEvents(this.canvas);

    this.__canvasPrepared = true;
}
Player.prototype._addOpts = function(opts) {
    // TODO: use addOpts to add any additional options to current ones
    // will move all options directly in the player object
    this.debug =    __defined(opts.debug)    ? opts.debug    : this.debug;
    this.mode =     __defined(opts.mode)     ? opts.mode     : this.mode;
    this.repeat =   __defined(opts.repeat)   ? opts.repeat   : this.repeat;
    this.autoPlay = __defined(opts.autoPlay) ? opts.autoPlay : this.autoPlay;
    this.zoom =    opts.zoom || this.zoom;
    this.speed =   opts.speed || this.speed;
    this.width =   opts.width || this.width;
    this.height =  opts.height || this.height;
    this.bgColor = opts.bgColor || this.bgColor;
    this.ribbonsColor =
                   opts.ribbonsColor || this.ribbonsColor;
    this.thumbnail = opts.thumbnail || this.thumbnail;
    this.loadingMode = __defined(opts.loadingMode)
                        ? opts.loadingMode : this.loadingMode;
    this.audioEnabled = __defined(opts.audioEnabled)
                        ? opts.audioEnabled : this.audioEnabled;
    this.imagesEnabled = __defined(opts.imagesEnabled)
                        ? opts.imagesEnabled : this.imagesEnabled;
    this.shadowsEnabled = __defined(opts.shadowsEnabled)
                        ? opts.shadowsEnabled : this.shadowsEnabled;
    this.controlsEnabled = __defined(opts.controlsEnabled)
                        ? opts.controlsEnabled : this.controlsEnabled;
    this.infoEnabled = __defined(opts.infoEnabled)
                        ? opts.infoEnabled : this.infoEnabled;
    this.handleEvents = __defined(opts.handleEvents)
                        ? opts.handleEvents : this.handleEvents;
    this.drawStill = __defined(opts.drawStill)
                        ? opts.drawStill : this.drawStill;
    this.infiniteDuration = __defined(opts.infiniteDuration)
                        ? opts.infiniteDuration : this.infiniteDuration;
    this.forceAnimationSize = __defined(opts.forceAnimationSize)
                        ? opts.forceAnimationSize : this.forceAnimationSize;
    this.muteErrors = __defined(opts.muteErrors)
                        ? opts.muteErrors : this.muteErrors;
}
Player.prototype._checkOpts = function() {
    if (!this.canvas) return;

    this.infiniteDuration = __defined(this.infiniteDuration)
                            ? this.infiniteDuration
                            : (this.mode ? (this.mode & C.M_INFINITE_DURATION) : undefined);
    this.handleEvents = __defined(this.handleEvents)
                            ? this.handleEvents
                            : (this.mode ? (this.mode & C.M_HANDLE_EVENTS) : undefined);
    this.controlsEnabled = __defined(this.controlsEnabled)
                            ? this.controlsEnabled
                            : (this.mode ? (this.mode & C.M_CONTROLS_ENABLED) : undefined);
    this.infoEnabled = __defined(this.infoEnabled)
                            ? this.infoEnabled
                            : (this.mode ? (this.mode & C.M_INFO_ENABLED) : undefined);
    this.drawStill = __defined(this.drawStill)
                            ? this.drawStill
                            : (this.mode ? (this.mode & C.M_DRAW_STILL) : undefined);

    if (!this.width || !this.height) {
        var cvs_size = $engine.getCanvasSize(this.canvas);
        this.width = cvs_size[0];
        this.height = cvs_size[1];
    }

    this._resize(this.width, this.height);

    if (this.bgColor) $engine.setCanvasBackground(this.canvas, this.bgColor);

    if (this.anim && this.handleEvents) {
        // checks inside if was already subscribed before, skips if so
        this.__subscribeDynamicEvents(this.anim);
    }

    if (this.controlsEnabled && !this.controls) {
        this._enableControls();
        if (this.infoEnabled) { // FIXME: allow using info without controls
            this._enableInfo();
        } else {
            this._disableInfo();
        }
    } else if (!this.controlsEnabled && this.controls) {
        this._disableInfo();
        this._disableControls();
    }

    if (this.ctx) {
        var props = $engine.getAnmProps(this.ctx);
        props.skip_shadows = !this.shadowsEnabled;
    }

    this.__appliedMode = this.mode;

    if (this.thumbnail) this.setThumbnail(this.thumbnail);
}
Player.prototype._updateMode = function() {
    if (!this.canvas || !this.mode) return;
    if (!this.__appliedMode == this.mode) return;

    // force to re-use the mode value in _checkOpts
    this.infiniteDuration = undefined;
    this.handleEvents = undefined;
    this.controlsEnabled = undefined;
    this.infoEnabled = undefined;
    this.drawStill = undefined;

    this._checkOpts();
}
// initial state of the player, called from constuctor
Player.prototype._postInit = function() {
    this.stop();
    Text.__measuring_f = $engine.createTextMeasurer();
    /* TODO: load some default information into player */
    var to_load = $engine.hasUrlToLoad(this.wrapper);
    if (!to_load.url) to_load = $engine.hasUrlToLoad(this.canvas);
    if (to_load.url) {
        this.load(to_load.url,
                  (to_load.importer_id) && anm.isImporterAccessible(to_load.importer_id)
                  ? anm.createImporter(to_load.importer_id) : null);
    }
}
Player.prototype.changeRect = function(rect) {
    this.x = rect.x; this.y = rect.y;
    this.width = rect.width; this.height = rect.height;
    this._moveTo(rect.x, rect.y);
    this._resize(rect.width, rect.height);
}
/* Player.prototype._rectChanged = function(rect) {
    var cur_w = this.state.width,
        cur_h = this.state.height;
    return (cur_w != rect.width) || (cur_w != rect.height) ||
           (cur.x != rect.x) || (cur.y != rect.y);
} */
Player.prototype.forceRedraw = function() {
    if (this.controls) this.controls.forceNextRedraw();
    switch (this.state.happens) {
        case C.STOPPED: this.stop(); break;
        case C.PAUSED: if (this.anim) this.drawAt(this.state.time); break;
        case C.PLAYING: if (this.anim) { this._stopAndContinue(); } break;
        case C.NOTHING: if (!this.controls) this._drawSplash(); break;
        //case C.LOADING: case C.RES_LOADING: this._drawSplash(); break;
        //case C.ERROR: this._drawErrorSplash(); break;
    }
    if (this.controls) this.controls.render(this.state.time);
}
Player.prototype.changeZoom = function(zoom) {
    this.zoom = zoom;
}
// draw current animation at specified time
Player.prototype.drawAt = function(time) {
    if (time === Player.NO_TIME) throw new PlayerErr(Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
    if ((this.state.happens === C.RES_LOADING) &&
        (player.loadingMode === C.LM_ONREQUEST)) { this._postpone('drawAt', arguments);
                                                   return; } // if player loads remote resources just now,
                                                             // postpone this task and exit. postponed tasks
                                                             // will be called when all remote resources were
                                                             // finished loading
    if ((time < 0) || (time > this.anim.duration)) {
        throw new PlayerErr(_strf(Errors.P.PASSED_TIME_NOT_IN_RANGE, [time]));
    }
    var anim = this.anim,
        u_before = this.__userBeforeRender,
        u_after = this.__userAfterRender/*,
        after = function(gtime, ctx) {  // not used
            anim.reset();
            anim.__informEnabled = true;
            u_after(gtime, ctx);
        }*/;

    anim.reset();
    anim.__informEnabled = false;
    // __r_at is the alias for Render.at, but a bit more quickly-accessible,
    // because it is a single function
    __r_at(time, 0, this.ctx, this.anim, this.width, this.height, this.zoom, this.ribbonsColor, u_before, u_after);

    if (this.controls) this.controls.render(time);

    return this;
}
Player.prototype.setSize = function(width, height) {
    this.__userSize = [ width, height ];
    this._resize();
}
// it's optional to specify target_width/target_height, especially if aspect ratio
// of animation(s) that will be loaded into player matches to aspect ratio of player itself.
// if not, target_width and target_height, if specified, are recommended to be equal
// to a size of an animation(s) that will be loaded into player with this thumbnail;
// so, since animation will be received later, and if aspect ratios of animation and player
// does not match, both thumbnail and the animation will be drawn at a same position
// with same black ribbons applied;
// if size will not be specified, player will try to match aspect ratio of an image to
// show it without stretches, so if thumbnail image size matches to animation size has
// the same aspect ratio as an animation, it is also ok to omit the size data here
Player.prototype.setThumbnail = function(url, target_width, target_height) {
    if (!url) return;
    var player = this;
    if (player.__thumb &&
        player.__thumb.src == url) return;
    if (player.ctx) { // FIXME: make this a function
      var ratio = $engine.PX_RATIO,
          ctx = player.ctx;
      ctx.save();
      ctx.clearRect(0, 0, player.width * ratio, player.height * ratio);
      player._drawEmpty();
      ctx.restore();
    }
    var thumb = new Sheet(url);
    player.__thumbLoading = true;
    thumb.load(player.id, function() {
        player.__thumbLoading = false;
        player.__thumb = thumb;
        if (target_width || target_height) {
            player.__thumbSize = [ target_width, target_height ];
        }
        if ((player.state.happens !== C.PLAYING) &&
            (player.state.happens !== C.PAUSED)) {
            player._drawStill();
        }
    });
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
    if (!$engine.playerAttachedTo(this.wrapper, this)) return; // throw error?
    if (this.controls) this.controls.detach(this.wrapper);
    $engine.detachPlayer(this);
    if (this.ctx) {
        $engine.clearAnmProps(this.ctx);
    }
    this._reset();
    _PlrMan.fire(C.S_PLAYER_DETACH, this);
}
Player.prototype.attachedTo = function(canvas_or_wrapper) {
    return $engine.playerAttachedTo(canvas_or_wrapper, this);
}
Player.prototype.isAttached = function() {
    return $engine.playerAttachedTo(this.wrapper, this);
}
Player.attachedTo = function(canvas_or_wrapper, player) {
    return $engine.playerAttachedTo(canvas_or_wrapper, player);
}
Player.prototype.invalidate = function() {
    // TODO: probably, there's more to invalidate
    if (this.controls) this.controls.update(this.canvas);
}
Player.__invalidate = function(player) {
    return function(evt) {
        player.invalidate();
    };
}
Player.prototype.subscribeEvents = function(canvas) {
    var doRedraw = Player.__invalidate(this);
    $engine.subscribeWindowEvents({
        load: doRedraw
    });
    $engine.subscribeCanvasEvents(canvas, {
        mouseover: (function(player) {
                        return function(evt) {
                            if (global_opts.autoFocus &&
                                (player.handleEvents) &&
                                player.canvas) {
                                player.canvas.focus();
                            }
                            return true;
                        };
                    })(this),
        mouseout:   (function(player) {
                        return function(evt) {
                            if (global_opts.autoFocus &&
                                (player.handleEvents) &&
                                player.canvas) {
                                player.canvas.blur();
                            }
                            return true;
                        };
                    })(this)
    });
}
Player.prototype._drawEmpty = function() {
    var ctx = this.ctx,
        w = this.width,
        h = this.height;

    ctx.save();

    var ratio = $engine.PX_RATIO;
    // FIXME: somehow scaling context by ratio here makes all look bad

    // background
    ctx.fillStyle = Player.EMPTY_BG;
    ctx.fillRect(0, 0, w * ratio, h * ratio);
    ctx.strokeStyle = Player.EMPTY_STROKE;
    ctx.strokeWidth = Player.EMPTY_STROKE_WIDTH;
    ctx.strokeRect(0, 0, w * ratio, h * ratio);

    ctx.restore();
}
// _drawStill decides if current player condition matches either to draw
// thumbnail image or a still frame at some time point
Player.prototype._drawStill = function() {
    // drawStill is a flag, while _drawStill is a method
    // since we have no hungarian notation is't treated as ok (for now)
    var player = this,
        state = player.state,
        anim = player.anim;
    if (player.drawStill) { // it's a flag!
        if (player.__thumb) {
            player._drawThumbnail();
        } else if (anim) {
            if (!player.infiniteDuration && __finite(anim.duration)) {
                player.drawAt(anim.duration * Player.PREVIEW_POS);
            } else {
                player.drawAt(state.from);
            }
        }
    } else {
        player._drawEmpty();
    }
}
// _drawThumbnail draws a prepared thumbnail image, which is set by user
Player.prototype._drawThumbnail = function() {
    var thumb_dimen   = this.__thumbSize || this.__thumb.dimen(),
        thumb_width   = thumb_dimen[0],
        thumb_height  = thumb_dimen[1],
        player_width  = this.width,
        player_height = this.height,
        px_ratio      = $engine.PX_RATIO;
    var ctx = this.ctx;
    ctx.save();
    if (px_ratio != 1) ctx.scale(px_ratio, px_ratio);
    if ((thumb_width  == player_width) &&
        (thumb_height == player_height)) {
        this.__thumb.apply(ctx);
    } else {
        var f_rects    = __fit_rects(player_width, player_height,
                                     thumb_width,  thumb_height),
            factor     = f_rects[0],
            thumb_rect = f_rects[1],
            rect1      = f_rects[2],
            rect2      = f_rects[3];
        if (rect1 || rect2) {
            ctx.fillStyle = this.ribbonsColor || '#000';
            if (rect1) ctx.fillRect(rect1[0], rect1[1],
                                    rect1[2], rect1[3]);
            if (rect2) ctx.fillRect(rect2[0], rect2[1],
                                    rect2[2], rect2[3]);
        }
        if (thumb_rect && (factor != 1)) {
            ctx.beginPath();
            ctx.rect(thumb_rect[0], thumb_rect[1],
                     thumb_rect[2], thumb_rect[3]);
            ctx.clip();
            ctx.translate(thumb_rect[0], thumb_rect[1]);
        }
        if (factor != 1) ctx.scale(factor, factor);
        this.__thumb.apply(ctx);
    }
    ctx.restore();
}
// _drawSplash draws splash screen if there is no animation loaded in the player
// or the animation is inaccessible; if there is a preloaded thumbnail accessible,
// it applies the thumbnail instead
Player.prototype._drawSplash = function() {
    if (this.controls) return;

    if (this.__thumbLoading) return;

    if (this.__thumb && this.drawStill) {
        this._drawThumbnail();
        return;
    }

    var ctx = this.ctx,
        w = this.width,
        h = this.height;

    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    var ratio = $engine.PX_RATIO;

    // background
    ctx.fillStyle = this.bgColor || Player.EMPTY_BG;
    ctx.fillRect(0, 0, w * ratio, h * ratio);
    ctx.strokeStyle = Player.EMPTY_STROKE;
    ctx.strokeWidth = Player.EMPTY_STROKE_WIDTH;
    ctx.strokeRect(0, 0, w * ratio, h * ratio);

    if (this.controls) {
       ctx.restore();
       return;
    }

    // text
    ctx.fillStyle = '#999966';
    ctx.font = '10px sans-serif';
    ctx.fillText(Strings.COPYRIGHT, 20 * ratio, (h - 20) * ratio);

    /* ctx.globalAlpha = .6;

    ctx.beginPath();
    ctx.arc(w / 2 * ratio, h / 2 * ratio,
            Math.min(w / 4, h / 4) * ratio,
            0, 2 * Math.PI);
    ctx.fillStyle = '#a00';
    ctx.strokeStyle = '#ffe';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fill();

    ctx.globalAlpha = .9;

    ctx.restore();

    Controls._drawGuyInCenter(ctx, Controls.THEME, w * ratio, h * ratio, [ '#fff', '#900' ],
                              [ 0.5, 0.5 ], .2); */

    /* drawAnimatronGuy(ctx, w / 2, h / 2, Math.min(w, h) * .35,
                     [ '#fff', '#aa0' ]); */

}
Player.prototype._drawLoadingSplash = function(text) {
    if (this.controls) return;
    this._drawSplash();
    var ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#006';
    ctx.font = '12px sans-serif';
    ctx.fillText(text || Strings.LOADING, 20, 25);
    ctx.restore();
}
Player.prototype._drawLoadingProgress = function() {
    // Temporarily, do nothing.
    // Later we will show a line at the top, may be

    /* if (this.controls) return;
    var theme = Controls.THEME;
    Controls._runLoadingAnimation(this.ctx, function(ctx) {
        var w = ctx.canvas.clientWidth,
            h = ctx.canvas.clientHeight;
        // FIXME: render only changed circles
        ctx.clearRect(0, 0, w, h);
        //Controls._drawBack(ctx, theme, w, h);
        Controls._drawLoadingProgress(ctx, w, h,
                                      (((Date.now() / 100) % 60) / 60),
                                      theme.radius.loader,
                                      theme.colors.progress.left, theme.colors.progress.passed);
    }); */
}
Player.prototype._stopDrawingLoadingCircles = function() {
    if (this.controls) return;
    Controls._stopLoadingAnimation(this.ctx);
    this._drawEmpty();
}
Player.prototype._drawErrorSplash = function(e) {
    if (!this.canvas || !this.ctx) return;
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
Player.prototype._runLoadingAnimation = function(what) {
    if (this.controls) {
        this._drawLoadingSplash(what);
        this.controls._scheduleLoading();
    } else {
        this._drawLoadingProgress();
    }
}
Player.prototype._stopLoadingAnimation = function() {
    if (this.controls) {
        this.controls._stopLoading();
    } else {
        this._stopDrawingLoadingCircles();
    }
}
Player.prototype.toString = function() {
    return "[ Player '" + this.id + "' m-" + this.mode + " ]";
}
// reset player to initial state, called before loading any animation
Player.prototype._reset = function() {
    var state = this.state;
    // clear postponed tasks if player started to load remote resources,
    // they are not required since new animation is loading in the player now
    // or it is being detached
    if ((this.loadingMode === C.LM_ONREQUEST) &&
        (state.happens === C.RES_LOADING)) {
        this._clearPostpones();
        _ResMan.cancel(this.id);
    }
    state.happens = C.NOTHING;
    state.from = 0;
    state.time = Player.NO_TIME;
    state.duration = undefined;
    this.fire(C.S_CHANGE_STATE, C.NOTHING);
    if (this.controls) this.controls.reset();
    this.ctx.clearRect(0, 0, this.width * $engine.PX_RATIO,
                             this.height * $engine.PX_RATIO);
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
// FIXME: moveTo is not moving anything for the moment
Player.prototype._moveTo = function(x, y) {
    $engine.setCanvasPosition(this.canvas, x, y);
}
Player.prototype._resize = function(width, height) {
    var cvs = this.canvas,
        new_size = this.__userSize || [ width, height ],
        cur_size = $engine.getCanvasParameters(cvs);
    if (cur_size && (cur_size[0] === new_size[0]) && (cur_size[1] === new_size[1])) return;
    if (!new_size[0] || !new_size[1]) {
        new_size = cur_size;
    };
    $engine.setCanvasSize(cvs, new_size[0], new_size[1]);
    this.width = new_size[0];
    this.height = new_size[1];
    $engine.updateCanvasOverlays(cvs);
    if (this.controls) this.controls.handleAreaChange();
    this.forceRedraw();
    return new_size;
};
Player.prototype._restyle = function(bg) {
    $engine.setCanvasBackground(this.canvas, bg);
    this.forceRedraw();
};
// FIXME: methods below may be removed, but they are required for tests
Player.prototype._enableControls = function() {
    if (!this.controls) this.controls = new Controls(this);
    // if (this.state.happens === C.NOTHING) { this._drawSplash(); }
    // if ((this.state.happens === C.LOADING) ||
    //     (this.state.happens === C.RES_LOADING)) { this._drawLoadingSplash(); }
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
Player.prototype.__subscribeDynamicEvents = function(anim) {
    if (global_opts.setTabindex) {
        $engine.setTabIndex(this.canvas, this.__instanceNum);
    }
    if (anim) {
        var subscribed = false;
        if (!this.__boundTo) {
            this.__boundTo = [];
        } else {
            for (var i = 0, ix = this.__boundTo, il = ix.length; i < il; i++) {
                if ((anim.id === ix[i][0]) &&
                    (this.canvas === ix[i][1])) {
                    subscribed = true;
                }
            }
        }
        if (!subscribed) {
            this.__boundTo.push([ anim.id, this.canvas ]);
            anim.subscribeEvents(this.canvas);
        }
    }
}
Player.prototype.__unsubscribeDynamicEvents = function(anim) {
    if (global_opts.setTabindex) {
        $engine.setTabIndex(this.canvas, undefined);
    }
    if (anim) {
        if (!this.__boundTo) return;
        var toRemove = -1;
        for (var i = 0, ix = this.__boundTo, il = ix.length; i < il; i++) {
            if (anim.id === ix[i][0]) {
                toRemove = i;
                anim.unsubscribeEvents(ix[i][1]);
            }
        }
        if (toRemove >= 0) {
            this.__boundTo.splice(toRemove, 1);
        }
    }
}
Player.prototype._ensureHasState = function() {
    if (!this.state) throw new PlayerErr(Errors.P.NO_STATE);
}
Player.prototype._ensureHasAnim = function() {
    if (!this.anim) throw new PlayerErr(Errors.P.NO_ANIMATION);
}
Player.prototype.__beforeFrame = function(anim) {
    return (function(player, state, anim, callback) {
        return function(time) {
            anim.clearAllLaters();
            if (state.happens !== C.PLAYING) return false;
            if (((state.stop !== Player.NO_TIME) &&
                 (time >= (state.from + state.stop))) ||
                 (__finite(state.duration) &&
                    (time > (state.duration + Player.PEFF)))) {
                player.fire(C.S_COMPLETE);
                state.time = 0;
                anim.reset();
                player.stop();
                if (player.repeat || anim.repeat) {
                   player.play();
                   player.fire(C.S_REPEAT);
                } else if (!player.infiniteDuration
                       && __finite(state.duration)) {
                   player.drawAt(state.duration);
                }
                return false;
            }
            if (callback) callback(time, player.ctx);
            return true;
        }
    })(this, this.state, anim, this.__userBeforeFrame);
}
Player.prototype.__afterFrame = function(anim) {
    return (function(player, state, anim, callback) {
        return function(time) {
            if (player.controls && !player.controls.hidden) {
                player.controls.render(time);
            }
            if (callback) callback(time);

            anim.invokeAllLaters();
            return true;
        }
    })(this, this.state, anim, this.__userAfterFrame);
}

// Called when any error happens during player initialization or animation
// Player should mute all non-system errors by default, and if it got a system error, it may show
// this error over itself
Player.prototype.__onerror = function(err) {
  var player = this;
  var doMute = player.muteErrors;
      doMute = doMute && !(err instanceof SysErr);

  if (player.state &&
      ((player.state.happens == C.LOADING) ||
       (player.state.happens == C.RES_LOADING))) {
      player._stopLoadingAnimation();
  }

  try {
      if (player.state) player.state.happens = C.ERROR;
      player.__lastError = err;
      player.fire(C.S_CHANGE_STATE, C.ERROR);
      player.fire(C.S_ERROR, err);

      player.anim = null;
      // was here: /*if (player.state)*/ player.__unsafe_stop();
  } catch(e) { throw new SysErr(_strf(Errors.S.ERROR_HANDLING_FAILED, [err.message || err])); }

  try {
      if (player.state &&
          ((player.state.happens != C.NOTHING) ||
           (player.state.happens != C.STOPPED))) {
          player.__unsafe_stop();
      }
  } catch(e) { /* skip this error, it's ok just to fail to stop */ }

  doMute = (this.__err_handler && this.__err_handler(err)) || doMute;

  if (!doMute) {
      try { this._drawErrorSplash(err); } catch(e) { /* skip errors in splash */ }
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
// safe call generator for player method (synchronous calls)
Player.prototype.__defSafe = function(method_f) {
  var player = this;
  return function() {
    var args = arguments;
    if (!this.__safe_ctx) { // already in safe context
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
}
// safe call generator for asycnhronous function
Player.prototype.__defAsyncSafe = function(func) {
  var player = this;
  return function() {
    var args = arguments;
    try {
      var ret_val = player.__callSafe(function() {
        return func.apply(player, args);
      });
      return ret_val;
    } catch(err) {
      throw err;
    }
  };
}
Player.prototype.__makeSafe = function(methods) {
  var player = this;
  for (var i = 0, il = methods.length; i < il; i++) {
    var method = methods[i];
    if (!player[method]) throw new SysErr(_strf(Errors.S.NO_METHOD_FOR_PLAYER, [method]));
    player['__unsafe_'+method] = player[method];
    player[method] = player.__defSafe(player[method]);
  }
}
Player.prototype.handle__x = function(type, evt) {
    if (this.anim) this.anim.fire(type, this);
    return true;
}
Player.prototype._clearPostpones = function() {
    this._queue = [];
}
Player.prototype._postpone = function(method, args) {
    if (!this._queue) this._queue = [];
    this._queue.push([ method, args ]);
}
Player.prototype._callPostpones = function() {
    if (this._queue && this._queue.length) {
        var q = this._queue, spec;
        for (var i = 0, il = q.length; i < il; i++) {
          spec = q[i]; this[spec[0]].apply(this, spec[1]);
        }
    }
    this._queue = [];
}
Player.prototype._notifyAPI = function() {
    // currently, notifies only about playing start
    if (this._loadTarget !== C.LT_URL) return;
    if (!this._loadSrc || !this.anim || !this.anim.meta || !this.anim.meta._anm_id) return;
    if (!this.statImg) {
      this.statImg = $engine.createStatImg();
    };
    var loadSrc = this._loadSrc,
        id = this.anim.meta._anm_id,
        locatedAtTest = false,
        locatedAtProd = false;
    locatedAtTest = (loadSrc.indexOf('/animatron-snapshots-dev') > 0) ||
                    (loadSrc.indexOf('.animatron-test.com') > 0); // it's not so ok to be 0 in these cases
    locatedAtTest = locatedAtTest || (((loadSrc.indexOf('./') == 0) ||
                                       (loadSrc.indexOf('/') == 0)) &&
                                      (window.location && (window.location.hostname == 'animatron-test.com')));
    locatedAtProd = (loadSrc.indexOf('/animatron-snapshots') > 0) ||
                    (loadSrc.indexOf('.animatron.com') > 0); // it's not so ok to be 0 in these cases
    locatedAtProd = locatedAtProd || (((loadSrc.indexOf('./') == 0) ||
                                       (loadSrc.indexOf('/') == 0)) &&
                                      (window.location && (window.location.hostname == 'animatron.com')));
    if (locatedAtTest) {
        this.statImg.src = 'http://api.animatron-test.com/stats/report/' + id + '?' + Math.random();
    } else if (locatedAtProd) {
        this.statImg.src = 'http://api.animatron.com/stats/report/' + id + '?' + Math.random();
    }
};

/* Player.prototype.__originateErrors = function() {
    return (function(player) { return function(err) {
        return player._fireError(err);
    }})(this);
} */

Player.createState = function(player) {
    // Player state contains only things that actually change while playing an animation,
    // it's current time, time when player started to play or was stopped at,
    // happens reflects what player does now, `afps` is actual FPS.
    return {
        'happens': C.NOTHING,
        'time': Player.NO_TIME, 'from': 0, 'stop': Player.NO_TIME,
        'afps': 0, 'speed': 1,
        'duration': undefined,
        '__startTime': -1,
        '__redraws': 0, '__rsec': 0
        /*'__drawInterval': null*/
    };
}

Player._isPlayerEvent = function(type) {
    // FIXME: make some marker to group types of events
    return ((type == C.S_CHANGE_STATE) ||
            (type == C.S_PLAY)  || (type == C.S_PAUSE)    ||
            (type == C.S_STOP)  || (type == C.S_REPEAT)   ||
            (type == C.S_LOAD)  || (type == C.S_RES_LOAD) ||
            (type == C.S_ERROR) || (type == C.S_IMPORT)   ||
            (type == C.S_COMPLETE));
}
Player._optsFromUrlParams = function(params/* as object */) {
    function __boolParam(val) {
        if (!val) return false;
        if (val == 0) return false;
        if (val == 1) return true;
        if (val == 'false') return false;
        if (val == 'true') return true;
        if (val == 'off') return false;
        if (val == 'on') return true;
        if (val == 'no') return false;
        if (val == 'yes') return true;
    }
    function __extractBool() {
        var variants = arguments;
        for (var i = 0; i < variants.length; i++) {
            if (__defined(params[variants[i]])) return __boolParam(params[variants[i]]);
        }
        return undefined;
    }
    var opts = {};
    opts.debug = __defined(params.debug) ? __boolParam(params.debug) : undefined;
    opts.muteErrors = __extractBool('me', 'muterrors');
    opts.repeat = __extractBool('r', 'repeat');
    opts.autoPlay = __extractBool('a', 'auto', 'autoplay');
    opts.mode = params.m || params.mode || undefined;
    opts.zoom = params.z || params.zoom;
    opts.speed = params.v || params.speed;
    opts.width = params.w || params.width;
    opts.height = params.h || params.height;
    opts.infiniteDuration = __extractBool('i', 'inf', 'infinite');
    opts.audioEnabled = __extractBool('s', 'snd', 'sound', 'audio');
    opts.controlsEnabled = __extractBool('c', 'controls');
    opts.infoEnabled = __extractBool('info');
    opts.loadingMode = params.lm || params.lmode || params.loadingmode || undefined;
    opts.thumbnail = params.th || params.thumb || undefined;
    opts.bgColor = params.bg || params.bgcolor;
    opts.ribbonsColor = params.ribbons || params.ribcolor;
    return opts;
}
Player.forSnapshot = function(elm_id, snapshot_url, importer, callback, alt_opts) {
    var player = new Player();
    player.init(elm_id, alt_opts);
    player.load(snapshot_url, importer, callback);
    return player;
}
Player.prototype._applyUrlParamsToAnimation = function(params) {
    // NB: this metod is intended to be called only after some animation was loaded completely
    //     into player, some URL parameters are loaded into player `options` object and applied
    //     before getting any animation, but it's done using `_optsFromUrlParams` method.

    // these values (t, from, p, still) may be 0 and it's a proper value,
    // so they require a check for undefined separately

    // player may appear already playing something if autoPlay or a similar time-jump
    // flag was set from some different source of options (async, for example),
    // then the rule (for the moment) is: last one wins

    if (__defined(params.t)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.t / 100);
    } else if (__defined(params.from)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.from / 100);
    } else if (__defined(params.p)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.p / 100).pause();
    } else if (__defined(params.still)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.still / 100).pause();
    }
}

// Animation
// -----------------------------------------------------------------------------

// > Animation % ()
function Animation() {
    this.id = guid();
    this.tree = [];
    this.hash = {};
    this.name = '';
    this.duration = undefined;
    this.bgfill = null;
    this.width = undefined;
    this.height = undefined;
    this.zoom = 1.0;
    this.speed = 1.0;
    this.repeat = false;
    this.meta = {};
    //this.fps = undefined;
    this.__informEnabled = true;
    this._laters = [];
    this._initHandlers(); // TODO: make automatic
}

Animation.DEFAULT_DURATION = 10;

// mouse/keyboard events are assigned in L.loadAnimation
/* TODO: move them into animation */
provideEvents(Animation, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                           C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                           C.X_KPRESS, C.X_KUP, C.X_KDOWN,
                           C.X_DRAW,
                           // player events
                           C.S_CHANGE_STATE,
                           C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_COMPLETE, C.S_REPEAT,
                           C.S_IMPORT, C.S_LOAD, C.S_RES_LOAD, C.S_ERROR ]);
/* TODO: add chaining to all external Animation methods? */
// > Animation.add % (elem: Element | Clip)
// > Animation.add % (elems: Array[Element]) => Clip
// > Animation.add % (draw: Function(ctx: Context),
//                onframe: Function(time: Float),
//                [ transform: Function(ctx: Context,
//                                      prev: Function(Context)) ])
//                => Element
// > Animation.add % (element: Element)
Animation.prototype.add = function(arg1, arg2, arg3) {
    // this method only adds an element to a top-level
    // FIXME: allow to add elements deeper or rename this
    //        method to avoid confusion?
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
    } else { // element object mode
        this._addToTree(arg1);
    }
}
/* addS allowed to add static element before, such as image, may be return it in some form? */
// > Animation.remove % (elm: Element)
Animation.prototype.remove = function(elm) {
    // error will be thrown in _unregister method
    //if (!this.hash[elm.id]) throw new AnimErr(Errors.A.ELEMENT_IS_NOT_REGISTERED);
    if (elm.parent) {
        // it will unregister element inside
        elm.parent.remove(elm);
    } else {
        this._unregister(elm);
    }
}
// > Animation.prototype.clear % ()
/* Animation.prototype.clear = function() {
    this.hash = {};
    this.tree = [];
    this.duration = 0;
    var hash = this.hash;
    this.hash = {};
    for (var elmId in hash) {
        hash[elm.id]._unbind(); // unsafe, because calls unregistering
    }
} */
// > Animation.visitElems % (visitor: Function(elm: Element))
Animation.prototype.visitElems = function(visitor, data) {
    for (var elmId in this.hash) {
        visitor(this.hash[elmId], data);
    }
}
Animation.prototype.travelChildren = Animation.prototype.visitElems;
// > Animation.visitRoots % (visitor: Function(elm: Element))
Animation.prototype.visitRoots = function(visitor, data) {
    for (var i = 0, tlen = this.tree.length; i < tlen; i++) {
        visitor(this.tree[i], data);
    }
}
Animation.prototype.visitChildren = Animation.prototype.visitRoots;
Animation.prototype.iterateRoots = function(func, rfunc) {
    iter(this.tree).each(func, rfunc);
}
Animation.prototype.render = function(ctx, time, dt) {
    ctx.save();
    var zoom = this.zoom;
    try {
        if (zoom != 1) {
            ctx.scale(zoom, zoom);
        }
        if (this.bgfill) {
            ctx.fillStyle = Brush.adapt(ctx, this.bgfill);
            ctx.fillRect(0, 0, this.width, this.height);
        }
        this.visitRoots(function(elm) {
            elm.render(ctx, time, dt);
        });
    } finally { ctx.restore(); }
    this.fire(C.X_DRAW,ctx);
}
Animation.prototype.handle__x = function(type, evt) {
    this.visitElems(function(elm) {
        elm.fire(type, evt);
    });
    return true;
}
// TODO: test
Animation.prototype.getFittingDuration = function() {
    var max_pos = -Infinity;
    var me = this;
    this.visitRoots(function(elm) {
        var elm_tpos = elm._max_tpos();
        if (elm_tpos > max_pos) max_pos = elm_tpos;
    });
    return max_pos;
}
Animation.prototype.reset = function() {
    this.__informEnabled = true;
    this.visitRoots(function(elm) {
        elm.reset();
    });
}
Animation.prototype.dispose = function() {
    this.disposeHandlers();
    var me = this;
    /* FIXME: unregistering removes from tree, ensure it is safe */
    this.iterateRoots(function(elm) {
        me._unregister_no_rm(elm);
        elm.dispose();
        return false;
    });
}
Animation.prototype.isEmpty = function() {
    return this.tree.length == 0;
}
Animation.prototype.toString = function() {
    return "[ Animation "+(this.name ? "'"+this.name+"'" : "")+"]";
}
Animation.prototype.subscribeEvents = function(canvas) {
    $engine.subscribeAnimationToEvents(canvas, this, DOM_TO_EVT_MAP);
}
Animation.prototype.unsubscribeEvents = function(canvas) {
    $engine.unsubscribeAnimationFromEvents(canvas, this);
}
Animation.prototype._addToTree = function(elm) {
    if (!elm.children) {
        throw new AnimErr('It appears that it is not a clip object or element that you pass');
    }
    this._register(elm);
    /*if (elm.children) this._addElems(elm.children);*/
    this.tree.push(elm);
}
/*Animation.prototype._addElems = function(elems) {
    for (var ei = 0; ei < elems.length; ei++) {
        var _elm = elems[ei];
        this._register(_elm);
    }
}*/
Animation.prototype._register = function(elm) {
    if (this.hash[elm.id]) throw new AnimErr(Errors.A.ELEMENT_IS_REGISTERED);
    elm.registered = true;
    elm.anim = this;
    this.hash[elm.id] = elm;
    var me = this;
    elm.visitChildren(function(elm) {
        me._register(elm);
    });
}
Animation.prototype._unregister_no_rm = function(elm) {
    this._unregister(elm, true);
}
Animation.prototype._unregister = function(elm, save_in_tree) { // save_in_tree is optional and false by default
    if (!elm.registered) throw new AnimErr(Errors.A.ELEMENT_IS_NOT_REGISTERED);
    var me = this;
    elm.visitChildren(function(elm) {
        me._unregister(elm);
    });
    var pos = -1;
    if (!save_in_tree) {
      while ((pos = this.tree.indexOf(elm)) >= 0) {
        this.tree.splice(pos, 1); // FIXME: why it does not goes deeply in the tree?
      }
    }
    delete this.hash[elm.id];
    elm.registered = false;
    elm.anim = null;
    //elm.parent = null;
}
Animation.prototype._collectRemoteResources = function(player) {
    var remotes = [],
        anim = this;
    this.visitElems(function(elm) {
        if (elm._hasRemoteResources(anim, player)) {
           remotes = remotes.concat(elm._collectRemoteResources(anim, player)/* || []*/);
        }
    });
    if(this.fonts && this.fonts.length) {
        remotes = remotes.concat(this.fonts.map(function(f){return f.url;}));
    }
    return remotes;
}
Animation.prototype._loadRemoteResources = function(player) {
    var anim = this;
    this.visitElems(function(elm) {
        if (elm._hasRemoteResources(anim, player)) {
           elm._loadRemoteResources(anim, player);
        }
    });
    anim.loadFonts(player);
}
Animation.prototype.__ensureHasMaskCanvas = function(lvl) {
    if (this.__maskCvs && this.__backCvs &&
        this.__maskCvs[lvl] && this.__backCvs[lvl]) return;
    if (!this.__maskCvs) { this.__maskCvs = []; this.__maskCtx = []; }
    if (!this.__backCvs) { this.__backCvs = []; this.__backCtx = []; }
    this.__maskCvs[lvl] = $engine.createCanvas(this.width * 2, this.height * 2);
    this.__maskCtx[lvl] = $engine.getContext(this.__maskCvs[lvl], '2d');
    this.__backCvs[lvl] = $engine.createCanvas(this.width * 2, this.height * 2);
    this.__backCtx[lvl] = $engine.getContext(this.__backCvs[lvl], '2d');
    //document.body.appendChild(this.__maskCvs[lvl]);
    //document.body.appendChild(this.__backCvs[lvl]);
}
Animation.prototype.__removeMaskCanvases = function() {
    if (!this.__maskCvs && !this.__backCvs) return;
    if (this.__maskCvs) {
        for (var i = 0, il = this.__maskCvs.length; i < il; i++) {
            if (this.__maskCvs[i]) { // use `continue`?
                $engine.disposeElement(this.__maskCvs[i]);
                this.__maskCvs[i] = null; // is it required?
                this.__maskCtx[i] = null; // is it required?
            }
        }
        this.__maskCvs = null;
        this.__maskCtx = null;
    }
    if (this.__backCvs) {
        for (var i = 0, il = this.__backCvs.length; i < il; i++) {
            if (this.__backCvs[i]) { // use `continue`?
                $engine.disposeElement(this.__backCvs[i]);
                this.__backCvs[i] = null; // is it required?
                this.__backCtx[i] = null; // is it required?
            }
        }
        this.__maskCvs = null;
        this.__backCtx = null;
    }
}
Animation.prototype.findById = function(id) {
    return this.hash[id];
}
Animation.prototype.findByName = function(name, where) {
    var where = where || this;
    var found = [];
    if (where.name == name) found.push(name);
    where.travelChildren(function(elm)  {
        if (elm.name == name) found.push(elm);
    });
    return found;
}
Animation.prototype.invokeAllLaters = function() {
    for (var i = 0; i < this._laters.length; i++) {
        this._laters[i].call(this);
    };
}
Animation.prototype.clearAllLaters = function() {
    this._laters = [];
}
// > Animation.invokeLater % (f: Function())
Animation.prototype.invokeLater = function(f) {
    this._laters.push(f);
}
Animation.prototype.loadFonts = function(player) {
    if (!this.fonts || !this.fonts.length) {
        return;
    }

    var fonts = this.fonts,
        style = document.createElement('style'),
        css = '',
        fontsToLoad = [],
        detector = new Detector();
    style.type = 'text/css';

    for (var i = 0; i < fonts.length; i++) {
        var font = fonts[i];
        if (!font.url || !font.face || detector.detect(font.face)) {
            //no font name or url || font already available
            continue;
        }
        fontsToLoad.push(font);
        css += '@font-face {' +
            'font-family: "' + font.face + '"; ' +
            'src: url(' + font.url + '); ' +
            (font.style ? 'style: ' + font.style +'; ' : '') +
            (font.weight ? 'weight: ' + font.weight + '; ' : '') +
            '}\n';
    }

    if (fontsToLoad.length == 0) {
        return;
    };

    style.innerHTML = css;
    document.head.appendChild(style);

    for (var i = 0; i < fontsToLoad.length; i++) {
        _ResMan.loadOrGet(player.id, fontsToLoad[i].url, function(success) {
            var face = fontsToLoad[i].face,
                interval = 100,
                intervalId,
                checkLoaded = function() {
                    var loaded = detector.detect(face);
                    if (loaded) {
                        clearInterval(intervalId);
                        success();
                    }
                };
            intervalId = setInterval(checkLoaded, interval)
        });
    }

};
// Element
// -----------------------------------------------------------------------------

// type
C.ET_EMPTY = 'empty';
C.ET_PATH = 'path';
C.ET_TEXT = 'text';
C.ET_SHEET = 'image';

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
C.AC_NAMES[C.C_SRC_IN]   = 'source-in';
C.AC_NAMES[C.C_SRC_OUT]  = 'source-out';
C.AC_NAMES[C.C_DST_OVER] = 'destination-over';
C.AC_NAMES[C.C_DST_ATOP] = 'destination-atop';
C.AC_NAMES[C.C_DST_IN]   = 'destination-in';
C.AC_NAMES[C.C_DST_OUT]  = 'destination-out';
C.AC_NAMES[C.C_LIGHTER]  = 'lighter';
C.AC_NAMES[C.C_DARKER]   = 'darker';
C.AC_NAMES[C.C_COPY]     = 'copy';
C.AC_NAMES[C.C_XOR]      = 'xor';

Element.DEFAULT_PVT = [ 0.5, 0.5 ];
Element.DEFAULT_REG = [ 0.0, 0.0 ];

// > Element % (name: String,
//              draw: Function(ctx: Context),
//              onframe: Function(time: Float))
function Element(name, draw, onframe) {
    this.id = guid();
    this.name = name || '';
    this.type = C.ET_EMPTY;
    this.children = [];
    this.parent = null;
    this.level = 0;
    this.anim = null; // the animation it belongs to / registered in
    this.visible = true; // user flag, set by user
    this.shown = false; // system flag, set by engine
    this.registered = false; // is registered in animation or not
    this.disabled = false;
    this.rendering = false; // in process of rendering or not
    this.initState(); // initializes matrix, values for transformations
    this.initVisuals(); // initializes visual representation storage and data
    this.initTime(); // initialize time position and everything related to time jumps
    this.initEvents(); // initialize events storage and mechanics
    this.$modifiers = {};
    this.$painters = {};
    if (onframe) this.modify(onframe);
    if (draw) this.paint(draw);
    this.__modifying = null; // current modifiers class, if modifying
    this.__painting = null; // current painters class, if painting
    this.__modifiers_hash = {}; // applied modifiers, by id
    this.__painters_hash = {}; // applied painters, by id
    this.__detachQueue = [];
    this.__frameProcessors = [];
    this.data = {}; // user data
    this._initHandlers(); // assign handlers for all of the events. TODO: make automatic with provideEvents
    // TODO: call '.reset() here?'
    var _me = this,
        default_on = this.on;
    this.on = function(type, handler) {
        if (type & C.XT_CONTROL) {
            return this.m_on.call(_me, type, handler);
        } else return default_on.call(_me, type, handler);
        // return this; // FIXME: make chainable
    };
    Element.__addSysModifiers(this);
    Element.__addSysPainters(this);
    if (global_opts.liveDebug) Element.__addDebugRender(this);
}
Element._$ = function(name, draw, onframe) { return new Element(name, draw, onframe); }
Element.NO_BAND = null;
Element.DEFAULT_LEN = Infinity;
Element._customImporters = [];
provideEvents(Element, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                         C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                         C.X_KPRESS, C.X_KUP, C.X_KDOWN,
                         C.X_DRAW, C.X_START, C.X_STOP,
                         // player events
                         C.S_CHANGE_STATE,
                         C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_COMPLETE, C.S_REPEAT,
                         C.S_IMPORT, C.S_LOAD, C.S_RES_LOAD, C.S_ERROR ]);
Element.prototype.is = function(type) {
    return this.type == type;
}
Element.prototype.initState = function() {

    // current state
    this.x = 0; this.y = 0;   // dynamic position
    this.sx = 1; this.sy = 1; // scale by x / by y
    this.hx = 1; this.hy = 1; // shear by x / by y
    this.angle = 0;           // rotation angle
    this.alpha = 1;           // opacity
    // these values are for user to set
    this.dt = null;
    this.t = null; this.rt = null; this.key = null;
                               // cur local time (t) or 0..1 time (rt) or by key (t have highest priority),
                               // if both are null — stays as defined
    if (this.matrix) { this.matrix.reset() }
    else { this.matrix = $engine.createTransform(); }

    // previous state
    // FIXME: get rid of previous state completely?
    //        of course current state should contain previous values before executing
    //        modifiers on current frame, but they may happen to be overwritten by other modifiers,
    //        so sometimes it'd be nice to know what was there at previous time for sure;
    //        though user may modify time value also through this.t, and it should contain
    //        current time (probably), but not the last one.
    //        pros: it is useful for collisions, and user can't store it himself
    //        because modifiers modify the state in their order and there will be
    //        no exact moment when it is 'previous', since there always will be
    //        some system modifiers which will work before the user's ones
    //        (or it's ok?)
    //        cons: it's unreadable and may confuse users (with what?)
    this._x = 0; this._y = 0;   // dynamic position
    this._sx = 1; this._sy = 1; // scale by x / by y
    this._hx = 1; this._hy = 1; // shear by x / by y
    this._angle = 0;            // rotation angle
    this._alpha = 1;            // opacity
    // these values are set by engine to provide user with information
    // when previous state was rendered
    this._dt = null;
    this._t = null; this._rt = null; this._key = null;
                                // cur local time (t) and 0..1 time (rt) and,
                                // if it was ever applied, the last applied key
    if (this._matrix) { this._matrix.reset() }
    else { this._matrix = $engine.createTransform(); }

    return this;
}
Element.prototype.resetState = Element.prototype.initState;
Element.prototype.initVisuals = function() {

    this.reg = Element.DEFAULT_REG;   // registration point (static values)
    this.pvt = Element.DEFAULT_PVT; // pivot (relative to dimensions)

    // since properties below will conflict with getters/setters having same names,
    // they're renamed with dollar-sign. this way also allows methods to be replaced
    // with native JS 1.5 getters/setters just in few steps. (TODO)

    this.$fill = null;   // Fill instance
    this.$stroke = null; // Stroke instance
    this.$shadow = null; // Shadow instance

    this.$path = null;  // Path instanse, if it is a shape
    this.$text = null;  // Text data, if it is a text
    this.$image = null; // Sheet instance, if it is an image or a sprite sheet

    this.composite_op = null; // composition operation

    this.$mpath = null; // move path, though it's not completely "visual"

    return this;
}
Element.prototype.resetVisuals = Element.prototype.initVisuals;
Element.prototype.initTime = function() {
    this.mode = C.R_ONCE; // playing mode
    this.nrep = Infinity; // number of repetions for the mode
    // FIXME: rename to "$band"?
    this.lband = [0, Element.DEFAULT_LEN]; // local band
    this.gband = [0, Element.DEFAULT_LEN]; // global band

    this.keys = {}; // aliases for time jumps
    this.tf = null; // time jumping function

    this.__resetTimeFlags();

    return this;
}
Element.prototype.resetTime = Element.prototype.initTime;
Element.prototype.__resetTimeFlags = function() {
    this.__lastJump = null; // a time of last jump in time
    this.__jumpLock = false; // set to turn off jumping in time
    this.__firedStart = false; // fired start event
    this.__firedStop = false;  // fired stop event
};
Element.prototype.initEvents = function() {
    this.evts = {}; // events cache
    this.__evt_st = 0; // events state
    this.__evtCache = [];
    return this;
}
Element.prototype.resetEvents = Element.prototype.initEvents;
// > Element.prepare % () => Boolean
Element.prototype.prepare = function() {
    this.matrix.reset();
    return true;
}
// > Element.modifiers % (ltime: Float, dt: Float[, types: Array]) => Boolean
Element.prototype.modifiers = function(ltime, dt, types) {
    return this.__callModifiers(types || Modifier.ALL_MODIFIERS, ltime, dt);
}
// > Element.painters % (ctx: Context, t: Float, dt: Float[, types: Array]) => Boolean
Element.prototype.painters = function(ctx, t, dt, types) {
    return this.__callPainters(types || Painter.ALL_PAINTERS, ctx, t, dt);
}
// > Element.draw % (ctx: Context)
Element.prototype.draw = Element.prototype.painters;
// > Element.transform % (ctx: Context)
Element.prototype.transform = function(ctx) {
    this.matrix = Element.getMatrixOf(this, this.matrix);
    ctx.globalAlpha *= this.alpha;
    this.matrix.apply(ctx);
    return this.matrix;
}
// > Element.render % (ctx: Context, gtime: Float, dt: Float)
Element.prototype.render = function(ctx, gtime, dt) {
    if (this.disabled) return;
    this.rendering = true;
    // context is saved even before decision, if we draw or not, for safety:
    // because context anyway may be changed with user functions,
    // like modifiers who return false (and we do not want to restrict
    // user to do that)
    var drawMe = false;

    // checks if any time jumps (including repeat modes) were performed and justifies the global time
    // to be locally retative to element's `lband`.
    // NB: the local time returned is NOT in the same 'coordinate system' as the element's
    // `xdata.lband`. `xdata.gband` is completely global and `xdata.lband` is local in
    // relation to element's parent, so `lband == [10, 20]`, means that element starts after
    // 10 second will pass in a parent band. So it is right to have `gband == [10, 20]`
    // and `lband == [10, 20]` on the same element if it has no parent (located on a root level)
    // or its parent's band starts from global zero.
    // So, the `ltime` returned from `ltime()` method is local _relatively to_ `lband` the same way
    // as `state.t` and `state.rt` (and it is why time-jumps are calculated this way), so it means
    // that if the element is on the top level and has `lband` equal to `[10, 20]` like described before,
    // and it has no jumps or end-modes, global time of `5` here will be converted to `ltime == -5` and
    // global time of `12` will be converted to `ltime == 2` and global time of `22` to `ltime == 12`, which
    // will fail the `fits()` test, described somewhere above. If there is a end-mode, say, `loop()`,
    // then global time of `22` will be converted to `ltime == 2` again, so the element will treat it just
    // exactly the same way as it treated the global time of `12`.
    var ltime = this.ltime(gtime);
    drawMe = this.__preRender(gtime, ltime, ctx);
    // fire band start/end events
    // FIXME: may not fire STOP on low-FPS, move an additional check
    // FIXME: masks have no scene set to something, but should to (see masks tests)
    if (this.anim && this.anim.__informEnabled) this.inform(ltime);
    if (drawMe) {
        drawMe = this.fits(ltime)
                 && this.modifiers(ltime, dt)
                 && this.prepare() // FIXME: rename to .reset(), move before transform
                                   //        or even inside it, move out of condition
                 && this.visible;
    }
    if (drawMe) {
        ctx.save();
        try {
            // update global time with new local time (it may've been
            // changed if there were jumps or something), so children will
            // get the proper value
            gtime = this.gtime(ltime);
            if (!this.__mask) {
                // draw directly to context, if has no mask
                this.transform(ctx);
                this.painters(ctx, ltime, dt);
                this.visitChildren(function(elm) {
                    elm.render(ctx, gtime, dt);
                });
            } else {
                var anim = this.anim;
                if (!anim) throw new AnimErr(Errors.A.MASK_SHOULD_BE_ATTACHED_TO_ANIMATION);
                var level = this.level;
                anim.__ensureHasMaskCanvas(level);
                var mcvs = anim.__maskCvs[level],
                    mctx = anim.__maskCtx[level],
                    bcvs = anim.__backCvs[level],
                    bctx = anim.__backCtx[level];

                var anim_width = anim.width,
                    anim_height = anim.height,
                    dbl_anim_width = anim.width * 2,
                    dbl_anim_height = anim.height * 2,
                    ratio = $engine.PX_RATIO;

                /* FIXME: configure mask canvas using clips bounds (incl. children) */

                // double size of the canvases ensures that the
                // element will fit into canvas if its point was

                bctx.save(); // bctx first open
                if (ratio !== 1) bctx.scale(ratio, ratio);
                bctx.clearRect(0, 0, dbl_anim_width,
                                     dbl_anim_height);

                bctx.save(); // bctx second open

                bctx.translate(anim_width, anim_height);
                this.transform(bctx);
                this.visitChildren(function(elm) {
                    elm.render(bctx, gtime, dt);
                });
                this.draw(bctx, ltime, dt);

                bctx.restore(); // bctx second closed
                bctx.globalCompositeOperation = 'destination-in';

                mctx.save(); // mctx first open
                if (ratio !== 1) mctx.scale(ratio, ratio);
                mctx.clearRect(0, 0, dbl_anim_width,
                                     dbl_anim_height);

                mctx.translate(anim_width, anim_height);
                this.__mask.render(mctx, gtime, dt);

                mctx.restore(); // mctx first close

                //bctx.setTransform(1, 0, 0, 1, 0, 0);
                bctx.drawImage(mcvs, 0, 0,
                                     dbl_anim_width, dbl_anim_height);
                bctx.restore(); // bctx first closed

                ctx.drawImage(bcvs, -anim_width, -anim_height,
                                    dbl_anim_width, dbl_anim_height);
            }
        } catch(e) { $log.error(e); }
          finally { ctx.restore(); }
    }
    // immediately when drawn, element becomes shown,
    // it is reasonable
    this.shown = drawMe;
    this.__postRender();
    this.rendering = false;
    if (drawMe) this.fire(C.X_DRAW,ctx);
    return this;
}
// FIXME!!!: do not pass time, dt and duration neither to modifiers
//           nor painters, they should be accessible through this.t / this.dt
// > Element.modify % (modifier: Function(t: Float,
//                                        dt: Float,
//                                        duration: Float,
//                                        data: Any
//                                       ) => Boolean
//                               | Modifier) => Modifier
Element.prototype.modify = function(band, modifier) {
    if (!__arr(band)) { modifier = band;
                        band = null; }
    if (!__modifier(modifier) && __fun(modifier)) {
        modifier = new Modifier(modifier, C.MOD_USER);
    } else if (!__modifier(modifier)) {
        throw new AnimErr('Modifier should be either a function or a Modifier instance');
    }
    if (!modifier.type) throw new AnimErr('Modifier should have a type defined');
    if (band) modifier.band = band;
    if (modifier.__applied_to &&
        modifier.__applied_to[this.id]) throw new AnimErr('This modifier is already applied to this Element');
    if (!this.$modifiers[modifier.type]) this.$modifiers[modifier.type] = [];
    this.$modifiers[modifier.type].push(modifier);
    this.__modifiers_hash[modifier.id] = modifier;
    if (!modifier.__applied_to) modifier.__applied_to = {};
    modifier.__applied_to[this.id] = this.$modifiers[modifier.type].length; // the index in the array by type
    return modifier;
}
// > Element.removeModifier % (modifier: Function)
Element.prototype.removeModifier = function(modifier) {
    if (!__modifier(modifier)) throw new AnimErr('Please pass Modifier instance to removeModifier');
    if (!this.__modifiers_hash[modifier.id]) throw new AnimErr('Modifier wasn\'t applied to this element');
    if (!modifier.__applied_to || !modifier.__applied_to[this.id]) throw new AnimErr(Errors.A.MODIFIER_NOT_ATTACHED);
    //if (this.__modifying) throw new AnimErr("Can't remove modifiers while modifying");
    delete this.__modifiers_hash[modifier.id];
    delete this.$modifiers[modifier.type].splice(modifier.__applied_to[this.id], 1); // delete by index
    delete modifier.__applied_to[this.id];
}
// > Element.paint % (painter: Function(ctx: Context,
//                                           data: Any,
//                                           t: Float,
//                                           dt: Float)
//                                  | Painter)
//                         => Integer
Element.prototype.paint = function(painter) {
    if (!__painter(painter) && __fun(painter)) {
        painter = new Painter(painter, C.MOD_USER);
    } else if (!__painter(painter)) {
        throw new AnimErr('Painter should be either a function or a Painter instance');
    }
    if (!painter.type) throw new AnimErr('Painter should have a type defined');
    if (painter.__applied_to &&
        painter.__applied_to[this.id]) throw new AnimErr('This painter is already applied to this Element');
    if (!this.$painters[painter.type]) this.$painters[painter.type] = [];
    this.$painters[painter.type].push(painter);
    this.__painters_hash[painter.id] = painter;
    if (!painter.__applied_to) painter.__applied_to = {};
    painter.__applied_to[this.id] = this.$painters[painter.type].length; // the index in the array by type
    return painter;
}
// > Element.removePainter % (painter: Function | Painter)
Element.prototype.removePainter = function(painter) {
    if (!__painter(painter)) throw new AnimErr('Please pass Painter instance to removePainter');
    if (!this.__painters_hash[painter.id]) throw new AnimErr('Painter wasn\'t applied to this element');
    if (!painter.__applied_to || !painter.__applied_to[this.id]) throw new AnimErr(Errors.A.PAINTER_NOT_ATTACHED);
    //if (this.__modifying) throw new AnimErr("Can't remove modifiers while modifying");
    delete this.__painters_hash[painter.id];
    delete this.$painters[painter.type].splice(painter.__applied_to[this.id], 1); // delete by index
    delete painter.__applied_to[this.id];
}
// > Element.tween % (tween: Tween)
Element.prototype.tween = function(tween) {
    if (!(tween instanceof Tween)) throw new AnimErr('Please pass Tween instance to .tween() method');
    tween.as_tween = true;
    // tweens are always receiving time as relative time
    // __finite(duration) && duration ? (t / duration) : 0
    return this.modify(tween);
}
// > Element.add % (elem: Element | Clip)
// > Element.add % (elems: Array[Element])
// > Element.add % (draw: Function(ctx: Context),
//                  onframe: Function(time: Float),
//                  [ transform: Function(ctx: Context,
//                                        prev: Function(Context)) ])
//                  => Element
Element.prototype.add = function(arg1, arg2, arg3) {
    if (arg2) { // element by functions mode
        var _elm = new Element(arg1, arg2);
        if (arg3) _elm.changeTransform(arg3);
        this._addChild(_elm);
        return _elm;
    } else if (__arr(arg1)) { // elements array mode
        this._addChildren(arg1);
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
    if (this.anim) this.anim._unregister(this);
    // this.anim should be null after unregistering
}
// > Element.detach % ()
Element.prototype.detach = function() {
    if (this.parent.__safeDetach(this) == 0) throw new AnimErr(Errors.A.ELEMENT_NOT_ATTACHED);
}
/* make element band fit all children bands */
// > Element.makeBandFit % ()
Element.prototype.makeBandFit = function() {
    var wband = this.findWrapBand();
    this.gband = wband;
    this.lband[1] = wband[1] - wband[0];
}
// > Element.setBand % (band: Array[2, Float])
Element.prototype.setBand = function(band) {
    // TODO: change to .band([start, end]) -> Element
    this.lband = band;
    Bands.recalc(this);
}
// > Element.fits % (ltime: Float) -> Boolean
Element.prototype.fits = function(ltime) {
    // NB: the local time passed inside is not relative to parent element's
    // band, but relative to local band of this element. So it's ok not to check
    // starting point of lband, since it was already corrected in `ltime()`
    // method. So if this value is less than 0 here, it means that current local
    // time is before the actual band of the element. See a comment in `render`
    // method or `ltime` method for more details.
    if (ltime < 0) return false;
    return __t_cmp(ltime, this.lband[1] - this.lband[0]) <= 0;
}
// > Element.gtime % (ltime: Float) -> Float
Element.prototype.gtime = function(ltime) {
    return this.gband[0] + ltime;
}
// > Element.ltime % (gtime: Float) -> Float
Element.prototype.ltime = function(gtime) {
    // NB: the `ltime` this method returns is relative to local band of this element
    // and not the band of the parent element, as `lband` does. So having the `0` returned
    // from this method while `lband` of the element is `[10, 20]` (relatively to its
    // parent element) means that it is at position of `10` seconds relatively to parent
    // element. Negative value returned from this method means the passed time is that amount
    // of seconds before the start of `lband` or `gband`, no matter. Positive value means that
    // amount of seconds were passed after the start of `lband`. It is done to make `state.t`/`state.rt`-based
    // jumps easy (`state.t` has the same principle and its value is in the same "coord. system" as the
    // value returned here). See `render()` method comment regarding `ltime` for more details.
    var gband = this.gband, lband = this.lband;
    if (!__finite(gband[1])) return this.__checkJump(gtime - gband[0]);
    switch (this.mode) {
        case C.R_ONCE:
            return this.__checkJump(gtime - gband[0]);
        case C.R_STAY:
            return (__t_cmp(gtime, gband[1]) <= 0)
                   ? this.__checkJump(gtime - gband[0])
                   : this.__checkJump(lband[1] - lband[0]);
        case C.R_LOOP: {
                var durtn = lband[1] -
                            lband[0];
                if (durtn < 0) return -1;
                var ffits = (gtime - gband[0]) / durtn,
                    fits = Math.floor(ffits);
                if ((fits < 0) || (ffits > this.nrep)) return -1;
                var t = (gtime - gband[0]) - (fits * durtn);
                return this.__checkJump(t);
            }
        case C.R_BOUNCE: {
                var durtn = lband[1] -
                            lband[0];
                if (durtn < 0) return -1;
                var ffits = (gtime - gband[0]) / durtn,
                    fits = Math.floor(ffits);
                if ((fits < 0) || (ffits > this.nrep)) return -1;
                var t = (gtime - gband[0]) - (fits * durtn),
                    t = ((fits % 2) === 0) ? t : (durtn - t);
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
        var duration = this.lband[1] - this.lband[0],
            cmp = __t_cmp(ltime, duration);
        if (!this.__firedStart) {
            this.fire(C.X_START, ltime, duration);
            // FIXME: it may fire start before the child band starts, do not do this!
            /* this.travelChildren(function(elm) { // TODO: implement __fireDeep
                if (!elm.__firedStart) {
                    elm.fire(C.X_START, ltime, duration);
                    elm.__firedStart = true;
                }
            }); */
            this.__firedStart = true; // (store the counters for fired events?)
            // TODO: handle START event by changing band to start at given time?
        }
        if (cmp >= 0) {
            if (!this.__firedStop) {
                this.fire(C.X_STOP, ltime, duration);
                this.travelChildren(function(elm) { // TODO: implement __fireDeep
                    if (!elm.__firedStop) {
                        elm.fire(C.X_STOP, ltime, duration);
                        elm.__firedStop = true;
                    }
                });
                this.__firedStop = true;
                // TODO: handle STOP event by changing band to end at given time?
            }
        };
    };
}
// > Element.duration % () -> Float
Element.prototype.duration = function() {
    return this.lband[1] - this.lband[0];
}
/* TODO: duration cut with global band */
/* Element.prototype.rel_duration = function() {
    return
} */
Element.prototype._max_tpos = function() {
    return (this.gband[1] >= 0) ? this.gband[1] : 0;
}
/* Element.prototype.neg_duration = function() {
    return (this.xdata.lband[0] < 0)
            ? ((this.xdata.lband[1] < 0) ? Math.abs(this.xdata.lband[0] + this.xdata.lband[1]) : Math.abs(this.xdata.lband[0]))
            : 0;
} */
Element.prototype.m_on = function(type, handler) {
    this.modify(new Modifier(
        function(t) { /* FIXME: handlers must have priority? */
            if (this.__evt_st & type) {
                var evts = this.evts[type];
                for (var i = 0, el = evts.length; i < el; i++) {
                    if (handler.call(this, evts[i], t) === false) return false;
                }
            }
        }, C.MOD_EVENT));
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
    if (children.length === 0) return this.gband;
    var result = [ Infinity, 0 ];
    this.visitChildren(function(elm) {
        result = Bands.expand(result, elm.gband);
        //result = Bands.expand(result, elm.findWrapBand());
    });
    return (result[0] !== Infinity) ? result : null;
}
Element.prototype.dispose = function() {
    this.disposeHandlers();
    this.disposeVisuals();
    this.visitChildren(function(elm) {
        elm.dispose();
    });
}
// FIXME: what's the difference with resetVisuals?
Element.prototype.disposeVisuals = function() {
    if (this.$path)  this.$path.dispose();
    if (this.$text)  this.$text.dispose();
    if (this.$image) this.$image.dispose();
    if (this.$mpath) this.$mpath.dispose();
}
Element.prototype.reset = function() {
    this.resetState();
    this.resetEvents();
    this.__resetTimeFlags();
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
    this.__jumpLock = true; // disable jumps in time
    this.__state = this.extractState();
    this.__pstate = this.extractPrevState();
}
Element.prototype.unlock = function(collect_res) { // collect_res flag is optional
    var result = collect_res ? this.extractState() : undefined;
    this.applyState(this.__state);
    this.applyPrevState(this.__pstate);
    this.__state = null;
    this.__pstate = null;
    this.__jumpLock = false;
    return result;
}
// FIXME: rename and merge get/set into .state() & .prev_state() ?
Element.prototype.extractState = function() {
    // see .initState() for values definition
    return {
      x: this.x, y: this.y,
      sx: this.sx, sy: this.sy,
      hx: this.hx, hy: this.hy,
      angle: this.angle,
      alpha: this.alpha,
      t: this.t, rt: this.rt, key: this.key
    }
}
Element.prototype.extractPrevState = function() {
    // see .initState() for values definition
    return {
      x: this._x, y: this._y,
      sx: this._sx, sy: this._sy,
      hx: this._hx, hy: this._hy,
      angle: this._angle,
      alpha: this._alpha,
      t: this._t, rt: this._rt, key: this._key
    }
}
Element.prototype.applyState = function(s) {
    this.x = s.x; this.y = s.y;
    this.sx = s.sx; this.sy = s.sy;
    this.hx = s.hx; this.hy = s.hy;
    this.angle = s.angle;
    this.alpha = s.alpha;
    this.t = s.t; this.rt = s.rt; this.key = s.key;
}
Element.prototype.applyPrevState = function(s) {
    this._x = s.x; this._y = s.y;
    this._sx = s.sx; this._sy = s.sy;
    this._hx = s.hx; this._hy = s.hy;
    this._angle = s.angle;
    this._alpha = s.alpha;
    this._t = s.t; this._rt = s.rt; this._key = s.key;
}
Element.prototype.stateAt = function(t) { /* FIXME: test */
    this.lock();
    // calls all modifiers with given time and then unlocks the element
    // and returns resulting state if modifiers succeeded
    // (unlock should be performed independently of success)
    return this.unlock(/* success => return previous state */
              this.__callModifiers(Element.NOEVT_MODIFIERS, t, 0) // returns true if succeeded
           );
}
Element.prototype.getPosition = function() {
    return [ this.x, this.y ];
}
Element.prototype.offset = function() {
    var xsum = 0, ysum = 0;
    var p = this.parent;
    while (p) {
        xsum += p.x;
        ysum += p.y;
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
    var subj = this.$path || this.$text || this.$image;
    if (subj) return subj.dimen();
}
Element.prototype.bounds = function() {
    var subj = this.$path || this.$text || this.$image;
    if (subj) return subj.bounds();
}
Element.prototype.rect = function() {
    var b = this.bounds();
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
    if (this.anim) this.anim.__ensureHasMaskCanvas(this.level);
    this.__mask = elm;
}
Element.prototype.clearMask = function() {
    this.__mask = null;
}
Element.prototype.data = function(val) {
  if (typeof val !== 'undefined') return (this.__u_data = val);
  return this.__u_data;
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
Element.prototype.findByName = function(name) {
    this.anim.findByName(name, this);
}
Element.prototype.clone = function() {
    var clone = new Element();
    clone.name = this.name;
    clone.children = [].concat(this.children);
    clone.$modifiers = [].concat(this.$modifiers);
    clone.$painters = [].concat(this.$painters);
    clone.level = this.level;
    //clone.visible = this.visible;
    //clone.disabled = this.disabled;
    // .anim pointer, .parent pointer & PNT_SYSTEMistered flag
    // are not transferred because the clone is another
    // element that should be separately added to some animation
    // in its own time to start working properly
    Element.transferState(this, clone);
    Element.transferVisuals(this, clone);
    Element.transferTime(this, clone);
    // FIXME: What else?
    clone.__u_data = this.__u_data;
    return clone;
}
Element.prototype.shallow = function() {
    var clone = this.clone();
    clone.children = [];
    var src_children = this.children;
    var trg_children = clone.children;
    for (var sci = 0, scl = src_children.length; sci < scl; sci++) {
        var csrc = src_children[sci],
            cclone = csrc.shallow();
        cclone.parent = clone;
        trg_children.push(cclone);
    }
    clone.$modifiers = [];
    /* FIXME: use __forAllModifiers & __forAllPainters */
    // loop through type
    for (var mti = 0, mtl = this.$modifiers.length; mti < mtl; mti++) {
        var type_group = this.$modifiers[mti];
        if (!type_group) continue;
        clone.$modifiers[mti] = [];
        // loop through priority
        for (var mpi = 0, mpl = type_group.length; mpi < mpl; mpi++) {
            var priority_group = type_group[mpi];
            if (!priority_group) continue;
            clone.$modifiers[mti][mpi] = [].concat(priority_group);
            for (var mi = 0, ml = priority_group.length; mi < ml; mi++) {
                var modifier = priority_group[mi];
                if (modifier && modifier.__m_ids) {
                    modifier.__m_ids[clone.id] = modifier.__m_ids[this.id];
                }
            }
        }
    }
    clone.$painters = [];
    // loop through type
    for (var pti = 0, ptl = this.$painters.length; pti < ptl; pti++) {
        var type_group = this.$painters[pti];
        if (!type_group) continue;
        clone.$painters[pti] = [];
        // loop through priority
        for (var ppi = 0, ppl = type_group.length; ppi < ppl; ppi++) {
            var priority_group = type_group[ppi];
            if (!priority_group) continue;
            clone.$painters[pti][ppi] = [].concat(priority_group);
            for (var pi = 0, pl = priority_group.length; pi < pl; pi++) {
                var painter = priority_group[pi];
                if (painter && painter.__p_ids) {
                    painter.__p_ids[clone.id] = painter.__p_ids[this.id];
                }
            }
        }
    }
    clone.__u_data = obj_clone(this.__u_data);
    return clone;
}
Element.prototype._addChild = function(elm) {
    elm.parent = this;
    elm.level = this.level + 1;
    this.children.push(elm); /* or add elem.id? */
    if (this.anim) this.anim._register(elm); /* TODO: rollback parent and child? */
    Bands.recalc(this);
}
Element.prototype._addChildren = function(elms) {
    for (var ei = 0, el = elms.length; ei < el; ei++) {
        this._addChild(elms[ei]);
    }
}
Element.prototype._stateStr = function() {
    return "x: " + this.x + " y: " + this.y + '\n' +
           "sx: " + this.sx + " sy: " + this.sy + '\n' +
           "angle: " + this.angle + " alpha: " + this.alpha + '\n' +
           "p: " + this.p + " t: " + this.t + " key: " + this.key + '\n';
}
Element.prototype.__callModifiers = function(order, ltime, dt) {
    var elm = this;

    // copy current state as previous one
    elm.applyPrevState(elm);

    // FIXME: checkJump is performed before, may be it should store its values inside here?
    if (__num(elm.__appliedAt)) {
      elm._t   = elm.__appliedAt;
      elm._rt  = elm.__appliedAt * (elm.lband[1] - elm.lband[0]);
    }
    // FIXME: elm.t and elm.dt both should store real time for this moment.
    //        modifier may have its own time, though, but not painter, so painters probably
    //        don't need any additional time/dt and data

    // `elm.key` will be copied to `elm._key` inside `applyPrevState` call

    // TODO: think on sorting tweens/band-restricted-modifiers by time

    elm.__loadEvents();

    var modifiers = this.$modifiers;
    var type, typed_modifiers, modifier, lbtime;
    for (var i = 0, il = order.length; i < il; i++) { // for each type
        type = order[i];

        elm.__modifying = type;
        elm.__mbefore(type);

        typed_modifiers = modifiers[type];

        for (var j = 0, jl = typed_modifiers.length; j < jl; j++) {
            modifier = typed_modifiers[j];
            // lbtime is band-apadted time, if modifier has its own band
            lbtime = elm.__adaptModTime(modifier, ltime);
            // `false` will be returned from `__adaptModTime`
            // for trigger-like modifier if it is required to skip current one,
            // on the other hand `true` means
            // "skip this one, but not finish the whole process",
            if (lbtime === false) continue;
            // modifier will return false if it is required to skip all next modifiers,
            // returning false from our function means the same
            //                  // time,      dt, duration
            if (modifier.call(elm, lbtime[0], dt, lbtime[1]) === false) {
                elm.__mafter(ltime, elm.__modifying, false);
                elm.__modifying = null;
                return false; // exit the method
            }
        }

        elm.__mafter(ltime, type, true);
    } // for each type

    elm.__modifying = null;

    elm.__appliedAt = ltime;

    elm.resetEvents();
}
Element.prototype.__callPainters = function(order, ctx, t, dt) {
    var elm = this;

    var painters = this.$painters;
    var type, typed_painters, painter;
    for (var i = 0, il = order.length; i < il; i++) { // for each type
        type = order[i];

        elm.__painting = type;
        elm.__pbefore(ctx, type);

        typed_painters = painters[type];

        for (var j = 0, jl = typed_modifiers.length; j < jl; j++) {
            painter = typed_painters[j];
            painter.call(elm, ctx, t, dt);
        }

        elm.__pafter(ctx, type);
    } // for each type

    elm.__painting = null;
}
Element.prototype.__addPainter = function(conf, painter) {
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
Element.prototype.__mbefore = function(t, type) {
    /*if (type === C.MOD_EVENT) {
        this.__loadEvtsFromCache();
    }*/
}
Element.prototype.__mafter = function(t, type, result) {
    /*if (!result || (type === C.MOD_USER)) {
        this.__lmatrix = Element._getIMatrixOf(this.bstate, this.state);
    }*/
    /*if (!result || (type === C.MOD_EVENT)) {
        this.__clearEvtState();
    }*/
}
Element.prototype.__adaptModTime = function(modifier, ltime) {

    // TODO: move to modifier class?

    var elm = this,
        elm_duration = elm.lband[1] - elm.lband[0], // duration of the element's local band
        mod_easing = modifier.easing, // modifier easing
        mod_time = modifier.band || modifier.time, // time (or band) of the modifier, if set
        mod_relative = modifier.relative, // is modifier time or band relative to elm duration or not
        mod_as_tween = modifier.as_tween; // should time be passed in relative time or not

    var res_time,
        res_duration;

    // modifier takes the whole element time
    if (mod_time == null) {

        res_time = ltime;
        res_duration = elm_duration;

    // modifier is band-restricted
    } else if (__arr(mod_time)) {

        var mod_band = mod_time,
            mod_duration;

        // this band is specified relatively to local band in absolute time values
        // (like [0, 7] modifier band for [0, 10] element band)
        if (!mod_relative) {
            mod_duration = mod_band[1] - mod_band[0];
            if (__t_cmp(ltime, mod_band[0]) < 0) return false;
            if (__t_cmp(ltime, mod_band[1]) > 0) return false;
        // this band is specified relatively to local band in relative time values
        // (like [0, 0.7] modifier band for [0, 10] element band means [0, 7], as above)
        } else {
            mod_band = [ mod_band[0] * elm_duration,
                         mod_band[1] * elm_duration ];
            mod_duration = mod_band[1] - mod_band[0];
            if (__t_cmp(ltime, mod_band[0]) < 0) return false;
            if (__t_cmp(ltime, mod_band[1]) > 0) return false;
        }

        res_time = ltime - mod_band[0];
        res_duration = mod_duration;

    // modifier is assigned to trigger at some specific time moment
    } else if (__num(mod_time)) {

        if (modifier.__wasCalled && modifier.__wasCalled[elm.id]) return false;
        var tpos = mod_relative ? (mod_time * elm_duration) : mod_time;
        if (__t_cmp(ltime, tpos) >= 0) {
            if (!modifier.__wasCalled) modifier.__wasCalled = {};
            if (!modifier.__wasCalledAt) modifier.__wasCalledAt = {};
            modifier.__wasCalled[elm.id] = true;
            modifier.__wasCalledAt[elm.id] = ltime;
        } else return false;

        res_time = ltime;
        res_duration = elm_duration;

    // if it's something else, do the same as in mod_time == null
    } else {

        res_time = ltime;
        res_duration = elm_duration;

    }

    // correct time/duration if required
    if (mod_relative || mod_as_tween) {
        // tweens and relative modifiers should receive relative time inside
        if (__finite(res_duration)) {
            res_time = __adjust(res_time) / __adjust(elm_duration);
            res_duration = __adjust(res_duration);
        } else {
            res_time = 0;
        }
    } else {
        res_time = __adjust(res_time);
        res_duration = __adjust(res_duration);
    }

    // apply easing, if it's there
    return !mod_easing ? [ res_time, res_duration ]
                       : [ mod_easing(res_time, res_duration),
                           res_duration ];
}
Element.prototype.__pbefore = function(ctx, type) { }
Element.prototype.__pafter = function(ctx, type) { }
Element.prototype.__checkJump = function(at) {
    // FIXME: test if jumping do not fails with floating points problems
    if (this.tf) return this.tf(at);
    var t = null,
        duration = this.lband[1] - this.lband[0];
    // if jump-time was set either
    // directly or relatively or with key,
    // get its absolute local value
    t = (this.p !== null) ? this.p : null;
    t = ((t === null) && (this.t !== null))
        ? this.t * duration
        : t;
    t = ((t === null) && (this.key !== null))
        ? this.keys[this.key]
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
            this.p = null;
            this.t = null;
            this.key = null;
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
       /* return ((this.__lastJump + t) > this.gband[1])
             ? (this.__lastJump + t)
             : this.gband[1]; */
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
Element.prototype.__loadEvents = function() {
    var cache = this.__evtCache;
    var cache_len = cache.length;
    this.resetEvents();
    if (cache_len > 0) {
        var edata, type, evts;
        for (var ei = 0; ei < cache_len; ei++) {
            edata = cache[ei];
            type = edata[0];
            this.__evt_st |= type;
            evts = this.evts;
            if (!evts[type]) evts[type] = [];
            evts[type].push(edata[1]);
        }
        this.__evtCache = [];
    }
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
Element.prototype._hasRemoteResources = function(anim, player) {
    if (player.imagesEnabled && this.$image) return true;
}
Element.prototype._collectRemoteResources = function(anim, player) {
    if (!player.imagesEnabled) return null;
    if (!this.$image) return null;
    return [ this.$image.src ];
}
Element.prototype._loadRemoteResources = function(anim, player) {
    if (!player.imagesEnabled) return;
    if (!this.$image) return;
    this.$image.load(player.id);
}
Element.mergeStates = function(src1, src2, trg) {
    trg.x  = src1.x  + src2.x;  trg.y  = src1.y  + src2.y;
    trg.sx = src1.sx * src2.sx; trg.sy = src1.sy * src2.sy;
    trg.hx = src1.hx + src2.hx; trg.hy = src1.hy + src2.hy;
    trg.angle = src1.angle + src2.angle;
    trg.alpha = src1.alpha + src2.alpha;
}
Element.transferState = function(src, trg) {
    trg.x = src.x; trg.y = src.y;
    trg.sx = src.sx; trg.sy = src.sy;
    trg.hx = src.hx; trg.hy = src.hy;
    trg.angle = src.angle;
    trg.alpha = src.alpha;
}
Element.transferVisuals = function(src, trg) {
    trg.reg = [].concat(src.reg); trg.pvt = [].concat(src.pvt);
    trg.$fill = Brush.clone(src.$fill);
    trg.$stroke = Brush.clone(src.$stroke);
    trg.$shadow = Brush.clone(src.$shadow);
    trg.$path = src.$path ? src.$path.clone() : null;
    trg.$text = src.$text ? src.$text.clone() : null;
    trg.$image = src.$image ? src.$image.clone() : null;
    trg.$mpath = src.$mpath ? src.$mpath.clone() : null;
    trg.composite_op = src.composite_op;
}
Element.transferTime = function(src, trg) {
    trg.mode = src.mode; trg.nrep = src.nrep;
    trg.lband = [].concat(src.lband);
    trg.gband = [].concat(src.gband);
    trg.keys = [].concat(src.keys);
    trg.tf = src.tf;
}
// TODO: rename to matrixOf ?
Element.getMatrixOf = function(elm, m) {
    var _t = (m ? (m.reset(), m)
                : new Transform());
    _t.translate(elm.x, elm.y);
    _t.rotate(elm.angle);
    _t.shear(elm.hx, elm.hy);
    _t.scale(elm.sx, elm.sy);
    //_t.translate(-elm.reg[0], -elm.reg[1]);
    return _t;
}
Element.getIMatrixOf = function(elm, m) {
    var _t = Element.getMatrixOf(elm, m);
    _t.invert();
    return _t;
}
/* TODO: add createFromImgUrl?
 Element.imgFromURL = function(url) {
    return new Sheet(url);
}*/

Element.__addSysModifiers = function(elm) {
    // band check performed in checkJump
    // Render.m_checkBand
    // Render.m_saveReg
    // Render.m_applyPos
}
Element.__addSysPainters = function(elm) {
    elm.paint(Render.p_usePivot);
    elm.paint(Render.p_useReg);
    elm.paint(Render.p_applyAComp);
    elm.paint(Render.p_drawVisuals);
}
Element.__addDebugRender = function(elm) {
    elm.paint(Render.p_drawPivot);
    elm.paint(Render.p_drawReg);
    elm.paint(Render.p_drawName);
    elm.paint(Render.p_drawMPath);
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

var Clip = Element;

// Modifier & Painter
// -----------------------------------------------------------------------------

// modifiers classes
C.MOD_SYSTEM = 'system';
C.MOD_TWEEN = 'tween';
C.MOD_USER = 'user';
C.MOD_EVENT = 'event';

// FIXME: order should not be important, system should add modifiers in proper order
//        by itself.

Modifier.ORDER = [ C.MOD_SYSTEM, C.MOD_TWEEN, C.MOD_USER, C.MOD_EVENT ];
// these two simplify checking in __mafter/__mbefore
Modifier.FIRST_MOD = C.MOD_SYSTEM;
Modifier.LAST_MOD = C.MOD_EVENT;
// modifiers groups
Modifier.ALL_MODIFIERS = [ C.MOD_SYSTEM, C.MOD_TWEEN, C.MOD_USER, C.MOD_EVENT ];
Modifier.NOEVT_MODIFIERS = [ C.MOD_SYSTEM, C.MOD_TWEEN, C.MOD_USER ];

// It's not a common constructor below, but the function (though still pretending to
// be a constructor), which adds custom properties to a given Function instance
// (and it is almost ok, since no `Function.prototype` is harmed this way, but only an instance).
// For user it looks and acts as a common constructor, the difference is just in internals.
// This allows us to store modifiers as plain functions and give user ability to add them
// by just pushing into array.

// FIXME: `t` should be a property of an element, even `dt` also may appear like so,
//        duration is accessible through this.duration() inside the modifier

// Modifier % (func: Function(t, dt, elm_duration)[, type: C.MOD_*])
function Modifier(func, type) {
    func.id = guid();
    func.type = type || C.MOD_USER;
    func.band = func.band || null; // either band or time is specified
    func.time = __defined(func.time) ? func.time : null; // either band or time is specified
    func.relative = __defined(func.relative) ? func.relative : false; // is time or band are specified relatively to element
    func.as_tween = func.relative ? true // should modifier receive relative time or not (like tweens)
                                  : (__defined(func.as_tween) ? func.as_tween
                                                              : false);
    func.easing = func.easing || null;
    // TODO: may these properties interfere with something? they are assigned to function instances
    // TODO: add chainable methods to set band, easing, etc... ?
    anm.registerModifier(func);
    return func;
}

function Tween(tween_type, data) {
    if (!tween_type) throw new Error('Tween type is required to be specified or function passed');
    var func;
    if (__fun(tween_type)) {
        func = tween_type;
    } else {
        func = Tweens[tween_type](data);
        func.tween = tween_type;
    }
    return Modifier(func, C.MOD_TWEEN);
}

// painters classes
C.PNT_SYSTEM = 'system';
C.PNT_USER = 'user';
C.PNT_DEBUG = 'debug';

// FIXME: order should not be important, system should add painters in proper order
//        by itself.

Painter.ORDER = [ C.PNT_SYSTEM, C.PNT_USER, C.PNT_DEBUG ];
// these two simplify checking in __mafter/__mbefore
Painter.FIRST_PNT = C.PNT_SYSTEM;
Painter.LAST_PNT = C.PNT_DEBUG;
// painters groups
Painter.ALL_PAINTERS = [ C.PNT_SYSTEM, C.PNT_USER, C.PNT_DEBUG ];
Painter.NODBG_PAINTERS = [ C.PNT_SYSTEM, C.PNT_USER ];

// See description above for Modifier constructor for details, same technique

// Painter % (func: Function(ctx, data[ctx, t, dt])[, type: C.PNT_*])
function Painter(func, type) {
    func.id = guid();
    func.type = type || C.PNT_USER;
    anm.registerPainter(func);
    return func;
}

// TODO:
/* function ModBuilder() {

} */
// new Modifier().band(0, 2).normalBand(0, 0.5).
//   easing(..).priority(..).data(..);

/* function TweenBuilder() {
    this.value = Tween();
} */
// new TweenBuilder().band(...).type("scale").from(10, 20).to(30, 40).scale(band, 10).build()


// Import
// -----------------------------------------------------------------------------

var L = {}; // means "Loading/Loader"

L.loadFromUrl = function(player, url, importer, callback) {
    if (!JSON) throw new SysErr(Errors.S.NO_JSON_PARSER);

    var importer = importer || anm.createImporter('animatron');

    var url_with_params = url.split('?'),
        url = url_with_params[0],
        url_params = url_with_params[1], // TODO: validate them?
        params = (url_params && url_params.length > 0) ? __paramsToObj(url_params) : {},
        options = Player._optsFromUrlParams(params);

    if (options) {
        player._addOpts(options);
        player._checkOpts();
    }

    var failure = player.__defAsyncSafe(function(err) {
        throw new SysErr(_strf(Errors.P.SNAPSHOT_LOADING_FAILED,
                               [ (err ? (err.message || err) : '¿Por qué?') ]));
    });

    var success = function(req) {
        try {
            L.loadFromObj(player, JSON.parse(req.responseText), importer, function(anim) {
                player._applyUrlParamsToAnimation(params);
                if (callback) callback.call(player, anim);
            });
        } catch(e) { failure(e); }
    };

    var anm_cookie = $engine.getCookie('_animatronauth');

    $engine.ajax(url, success, failure, 'GET', anm_cookie ? { 'Animatron-Security-Token': anm_cookie } : null);
}
L.loadFromObj = function(player, object, importer, callback) {
    if (!importer) throw new PlayerErr(Errors.P.NO_IMPORTER_TO_LOAD_WITH);
    var anim = importer.load(object);
    player.fire(C.S_IMPORT, importer, anim, object);
    L.loadAnimation(player, anim, callback);
}
L.loadAnimation = function(player, anim, callback) {
    if (player.anim) player.anim.dispose();
    // add debug rendering
    if (player.debug
        && !global_opts.liveDebug)
        anim.visitElems(Element.__addDebugRender); /* FIXME: ensure not to add twice */
    if (!anim.width || !anim.height) {
        anim.width = player.width;
        anim.height = player.height;
    } else if (player.forceAnimationSize) {
        player._resize(anim.width, anim.height);
    }
    // assign
    player.anim = anim;
    if (callback) callback.call(player, anim);
}
L.loadElements = function(player, elms, callback) {
    var anim = new Animation();
    anim.add(elms);
    L.loadAnimation(player, anim, callback);
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
function __r_loop(ctx, player, anim, before, after, before_render, after_render) {

    var pl_state = player.state;

    if (pl_state.happens !== C.PLAYING) return;

    var msec = (Date.now() - pl_state.__startTime);
    var sec = msec / 1000;

    var time = (sec * pl_state.speed) + pl_state.from,
        dt = time - pl_state.__prevt;
    pl_state.time = time;
    pl_state.__dt = dt;
    pl_state.__prevt = time;

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

    __r_at(time, dt, ctx, anim,
           player.width, player.height, player.zoom, player.ribbonsColor,
           before_render, after_render);

    // show fps
    if (player.debug) {
        __r_fps(ctx, pl_state.afps, time);
    }

    if (after) {
        if (!after(time)) return;
    }

    if (pl_state.__supressFrames) return;

    return __nextFrame(function() {
        __r_loop(ctx, player, anim, before, after, before_render, after_render);
    })
}
function __r_at(time, dt, ctx, anim, width, height, zoom, rib_color, before, after) {
    ctx.save();
    var ratio = $engine.PX_RATIO;
    if (ratio !== 1) ctx.scale(ratio, ratio);
    var width = width | 0,
        height = height | 0;
    var size_differs = (width  != anim.width) ||
                       (height != anim.height);
    if (!size_differs) {
        try {
            ctx.clearRect(0, 0, anim.width,
                                anim.height);
            if (before) before(time, ctx);
            if (zoom != 1) ctx.scale(zoom, zoom);
            anim.render(ctx, time, dt);
            if (after) after(time, ctx);
        } finally { ctx.restore(); }
    } else {
        __r_with_ribbons(ctx, width, height,
                              anim.width, anim.height,
                              rib_color,
            function(_scale) {
                try {
                  ctx.clearRect(0, 0, anim.width, anim.height);
                  if (before) before(time, ctx);
                  if (zoom != 1) ctx.scale(zoom, zoom);
                  anim.render(ctx, time, dt);
                  if (after) after(time, ctx);
                } finally { ctx.restore(); }
            });
    }
}
function __r_with_ribbons(ctx, pw, ph, sw, sh, color, draw_f) {
    // pw == player width, ph == player height
    // sw == anim width,  sh == anim height
    var f_rects    = __fit_rects(pw, ph, sw, sh),
        factor     = f_rects[0],
        anim_rect = f_rects[1],
        rect1      = f_rects[2],
        rect2      = f_rects[3];
    ctx.save();
    if (rect1 || rect2) { // anim_rect is null if no
        ctx.save(); // second open
        ctx.fillStyle = color || '#000';
        if (rect1) {
            ctx.clearRect(rect1[0], rect1[1],
                          rect1[2], rect1[3]);
            ctx.fillRect(rect1[0], rect1[1],
                         rect1[2], rect1[3]);
        }
        if (rect2) {
            ctx.clearRect(rect2[0], rect2[1],
                          rect2[2], rect2[3]);
            ctx.fillRect(rect2[0], rect2[1],
                         rect2[2], rect2[3]);
        }
        ctx.restore();
    }
    if (anim_rect && (factor != 1)) {
        ctx.beginPath();
        ctx.rect(anim_rect[0], anim_rect[1],
                 anim_rect[2], anim_rect[3]);
        ctx.clip();
        ctx.translate(anim_rect[0], anim_rect[1]);
    }
    if (factor != 1) ctx.scale(factor, factor);
    draw_f(factor);
    ctx.restore();
}
function __r_fps(ctx, fps, time) {
    ctx.fillStyle = '#999';
    ctx.font = '20px sans-serif';
    ctx.fillText(Math.floor(fps), 8, 20);
    ctx.font = '10px sans-serif';
    ctx.fillText(Math.floor(time * 1000) / 1000, 8, 35);
}
function __fit_rects(pw, ph, sw, sh) {
    // pw == player width, ph == player height
    // aw == anim width,   ah == anim height
    var xw = pw / aw,
        xh = ph / ah;
    var factor = Math.min(xw, xh);
    var hcoord = (pw - aw * factor) / 2,
        vcoord = (ph - ah * factor) / 2;
    if ((xw != 1) || (xh != 1)) {
        var anim_rect = [ hcoord, vcoord, aw * factor, ah * factor ];
        if (hcoord != 0) {
            return [ factor,
                     anim_rect,
                     [ 0, 0, hcoord, ph ],
                     [ hcoord + (aw * factor), 0, hcoord, ph ] ];
        } else if (vcoord != 0) {
            return [ factor,
                     anim_rect,
                     [ 0, 0, aw, vcoord ],
                     [ 0, vcoord + (ah * factor), aw, vcoord ] ];
        } else return [ factor, anim_rect ];
    } else return [ 1, [ 0, 0, aw, ah ] ];
}
Render.loop = __r_loop;
Render.at = __r_at;
Render._drawFPS = __r_fps;

// SYSTEM PAINTERS

Render.p_useReg = new Painter(function(ctx) {
    var reg = this.reg;
    if ((reg[0] === 0) && (reg[1] === 0)) return;
    ctx.translate(-reg[0], -reg[1]);
}, C.PNT_SYSTEM);

Render.p_usePivot = new Painter(function(ctx) {
    var dimen = this.dimen(),
        pvt = this.pvt;
    if (!dimen) return;
    if ((pvt[0] === 0) && (pvt[1] === 0)) return;
    ctx.translate(-(pvt[0] * dimen[0]),
                  -(pvt[1] * dimen[1]));
}, C.PNT_SYSTEM);

Render.p_drawVisuals = new Painter(function(ctx) {
    var subj = this.$path || this.$text || this.$image;
    if (!subj) return;

    ctx.save();
    Brush.fill(ctx, this.$fill);
    Brush.shadow(ctx, this.$shadow);
    Brush.stroke(ctx, this.$stroke);
    subj.apply(ctx);
    ctx.restore();
}, C.PNT_SYSTEM);

Render.p_applyAComp = new Painter(function(ctx) {
    if (this.composite_op) ctx.globalCompositeOperation = C.AC_NAMES[this.composite_op];
}, C.PNT_SYSTEM);

// DEBUG PAINTERS

Render.p_drawPivot = new Painter(function(ctx, pvt) {
    if (!(pvt = pvt || this.pvt)) return;
    var dimen = this.dimen() || [ 0, 0 ];
    var stokeStyle = dimen ? '#600' : '#f00';
    ctx.save();
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
}, C.PNT_DEBUG);

Render.p_drawReg = new Painter(function(ctx, reg) {
    if (!(reg = reg || this.reg)) return;
    ctx.save();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#00f';
    ctx.fillStyle = 'rgba(0,0,255,.3)';
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
}, C.PNT_DEBUG);

Render.p_drawName = new Painter(function(ctx, name) {
    if (!(name = name || this.name)) return;
    ctx.save();
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText(name, 0, 10);
    ctx.restore();
}, C.PNT_DEBUG);

Render.p_drawMPath = new Painter(function(ctx, mPath) {
    if (!(mPath = mPath || this.$mpath)) return;
    ctx.save();
    //var s = this.$.astate;
    //Render.p_usePivot.call(this.xdata, ctx);
    mPath.cstroke('#600', 2.0);
    //ctx.translate(-s.x, -s.y);
    //ctx.rotate(-s.angle);
    ctx.beginPath();
    mPath.apply(ctx);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}, C.PNT_DEBUG);

Render.m_checkBand = new Modifier(function(time, duration, band) {
    if (band[0] > (duration * time)) return false; // exit
    if (band[1] < (duration * time)) return false; // exit
}, C.MOD_SYSTEM);

// Bands
// -----------------------------------------------------------------------------

var Bands = {};

// recalculate all global bands down to the very
// child, starting from given element
Bands.recalc = function(elm, in_band) {
    var in_band = in_band ||
                  ( elm.parent
                  ? elm.parent.gband
                  : [0, 0] );
    elm.gband = [ in_band[0] + elm.lband[0],
                  in_band[0] + elm.lband[1] ];
    elm.visitChildren(function(celm) {
        Bands.recalc(celm, elm.gband);
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
// makes band maximum wide to fit both bands
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
C.T_FILL        = 'FILL';
C.T_STROKE      = 'STROKE';

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
Tween.TWEENS_PRIORITY[C.T_FILL]        = 6;
Tween.TWEENS_PRIORITY[C.T_STROKE]      = 7;

Tween.TWEENS_COUNT = 8;

var Tweens = {};
// FIXME: always pass data at first call as in C.T_FILL, C.T_STROKE
Tweens[C.T_ROTATE] =
    function(data) {
      return function(t, dt, duration) {
        this.angle = data[0] * (1.0 - t) + data[1] * t;
        //state.angle = (Math.PI / 180) * 45;
      };
    };
Tweens[C.T_TRANSLATE] =
    function(data) {
      return function(t, dt, duration) {
          var p = data.pointAt(t);
          if (!p) return;
          this.$mpath = data;
          this.x = p[0];
          this.y = p[1];
      };
    };
Tweens[C.T_ALPHA] =
    function(data) {
      return function(t, dt, duration) {
        this.alpha = data[0] * (1.0 - t) + data[1] * t;
      };
    };
Tweens[C.T_SCALE] =
    function(data) {
      return function(t, dt, duration) {
        this.sx = data[0][0] * (1.0 - t) + data[1][0] * t;
        this.sy = data[0][1] * (1.0 - t) + data[1][1] * t;
      };
    };
Tweens[C.T_ROT_TO_PATH] =
    function() {
      return function(t, dt, duration) {
        var path = this.$mpath;
        if (path) this.angle += path.tangentAt(t); // Math.atan2(this.y, this.x);
      };
    };
Tweens[C.T_SHEAR] =
    function(data) {
      return function(t, dt, duration) {
        this.hx = data[0][0] * (1.0 - t) + data[1][0] * t;
        this.hy = data[0][1] * (1.0 - t) + data[1][1] * t;
      };
    };
Tweens[C.T_FILL] =
    function(data) {
        var from = data[0], to = data[1];
        return function(t, dt, duration) {
            // will write changes directly inside this.$fill
            Brush.interpolate(from, to, t, this.$fill);
            Brush.invalidate(this.$fill);
        }
    };
Tweens[C.T_STROKE] =
    function(data) {
        var from = data[0], to = data[1];
        return function (t, dt, duration) {
            // will write changes directly inside this.$stroke
            Brush.interpolate(from, to, t, this.$stroke);
            Brush.invalidate(this.$stroke);
        }
    };



// Easings
// -----------------------------------------------------------------------------

// Easings constants

C.E_PATH = 'PATH'; // Path
C.E_FUNC = 'FUNC'; // Function
C.E_CSEG = 'CSEG'; // Segment
C.E_STDF = 'STDF'; // Standard function from editor

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
EasingImpl[C.E_STDF] =
    function(num) {
        return Easing.__STD_EASINGS[num];
    };

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

Easing.__STD_EASINGS = [
    function(t) { return C['EF_DEF'](t); }, // Default
    function(t) { return C['EF_IN'](t); },  // In
    function(t) { return C['EF_OUT'](t); }, // Out
    function(t) { return C['EF_INOUT'](t); }, // InOut
    function(t) { return t*t; },    // 4    In Quad
    function(t) { return t*(2-t); },// 5    Out Quad
    function(t) {                   // 6    In/Out Quad
        if (t < 0.5) return 2*t*t;
        else {
            t = (t-0.5)*2;
            return -(t*(t-2)-1)/2;
        }
    },
    function(t) {                   // 7    In Cubic
        return t*t*t;
    },
    function(t) {                  // 8     Out Cubic
        t = t-1;
        return t*t*t + 1;
    },
    function(t) {                  // 9     In/Out Cubic
        if (t < 0.5) {
            t = t*2;
            return t*t*t/2;
        } else {
            t = (t-0.5)*2-1;
            return (t*t*t+2)/2;
        }
    },
    function(t) {                  // 10   In Sine
        return 1 - Math.cos(t * (Math.PI/2));
    },
    function(t) {                 // 11    Out Sine
        return Math.sin(t * (Math.PI/2));
    },
    function(t) {                 // 12    In/Out Sine
        return -(Math.cos(Math.PI*t) - 1)/2;
    },
    function(t) {                 // 13   In Expo
        return (t<=0) ? 0 : Math.pow(2, 10 * (t - 1));
    },
    function(t) {                // 14    Out Expo
        return t>=1 ? 1 : (-Math.pow(2, -10 * t) + 1);
    },
    function(t) {                // 15    In/Out Expo
        if (t<=0) return 0;
        if (t>=1) return 1;
        if (t < 0.5) return Math.pow(2, 10 * (t*2 - 1))/2;
        else {
            return (-Math.pow(2, -10 * (t-0.5)*2) + 2)/2;
        }
    },
    function(t) {               // 16    In Circle
        return 1-Math.sqrt(1 - t*t);
    },
    function(t) {              // 17     Out Circle
        t = t-1;
        return Math.sqrt(1 - t*t);
    },
    function(t) {              // 18     In/Out Cicrle
        if ((t*=2) < 1) return -(Math.sqrt(1 - t*t) - 1)/2;
        return (Math.sqrt(1 - (t-=2)*t) + 1)/2;
    },
    function(t) {              // 19    In Back
        var s = 1.70158;
        return t*t*((s+1)*t - s);
    },
    function(t) {             // 20     Out Back
        var s = 1.70158;
        return ((t-=1)*t*((s+1)*t + s) + 1);
    },
    function(t) {             // 21     In/Out Back
        var s = 1.70158;
        if ((t*=2) < 1) return (t*t*(((s*=(1.525))+1)*t - s))/2;
        return ((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2)/2;
    },
    function(t) {             // 22     In Bounce
        return 1 - Easing.__STD_EASINGS[23](1-t);
    },
    function(t) {              // 23    Out Bounce
        if (t < (1/2.75)) {
            return (7.5625*t*t);
        } else if (t < (2/2.75)) {
            return (7.5625*(t-=(1.5/2.75))*t + .75);
        } else if (t < (2.5/2.75)) {
            return (7.5625*(t-=(2.25/2.75))*t + .9375);
        } else {
            return (7.5625*(t-=(2.625/2.75))*t + .984375);
        }
    },
    function(t) {             // 24     In/Out Bounce
        if (t < 0.5) return Easing.__STD_EASINGS[22](t*2) * .5 ;
        return Easing.__STD_EASINGS[23](t*2-1) * .5 + .5;
    }
];

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

// > Path % (val: String | Array)
function Path(val) {
    this.segs = [];

    if (__str(val)) {
        this.parse(val);
    } else if (__arr(val)) {
        this.segs = val;
    }
}


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
    // TODO: every segment should apply itself
    //       simplify this to call seg.apply for every segment
    ctx.beginPath();
    this.visit(Path._applyVisitor, ctx);
    ctx.closePath();
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
// find a segment hit data in a path that corresponds
// to specified distance (t) of the path (0..1),
// > Path.hitAt % (t: [0..1]) => Array[Int, 2]
Path.prototype.hitAt = function(t) {
    var plen = this.length(); // path length in pixels
    if (plen == 0) return null;
    if (t < 0 || t > 1.0) return null;

    var startp = this.start(); // start point of segment

    if (t === 0) return {
          'seg': this.segs[0], 'start': startp, 'slen': 0.0, 'segt': 0.0
        };

    /*var endp = this.end();
      if (t == 1) return func ? func(startp, endp) : endp;*/

    var nsegs = this.segs.length; // number of segments
    if (nsegs == 0) return null;

    var distance = t * plen;
    var p = startp;
    var length = 0; // checked length in pixels
    var seg, slen;
    for (var si = 0; si < nsegs; si++) {
        seg = this.segs[si];
        if (seg.type !== C.P_MOVE_TO) {
          slen = seg.length(p); // segment length
          if (distance <= (length + slen)) {
              // inside current segment
              var segdist = distance - length;
              return {
                'seg': seg, 'start': p, 'slen': slen, 'segt': (slen != 0) ? (segdist / slen) : 0
              };
          }
          length += slen;
        }
        // end point of segment
        p = seg.last();
    };

    /*var lseg = this.segs[nsegs - 1];
      return {
        'seg': lseg, 'start': p, 'slen': lseg.length(p), 'segt': 1.0
      };*/
    return null;
}
// find a point on a path at specified distance (t) of the path (0..1),
// a function that transforms the result point (using given start point of
// segment and a point on a segment) may be passed
// > Path.pointAt % (t: [0..1]) => Array[Int, 2]
Path.prototype.pointAt = function(t) {
    var hit = this.hitAt(t);
    if (!hit) return this.start();
    return hit.seg.atT(hit.start, hit.segt);
}
// find a tangent on a path at specified distance (t) of the path (0..1)
// > Path.tangentAt % (t: [0..1]) => Double
Path.prototype.tangentAt = function(t) {
    var hit = this.hitAt(t);
    if (!hit) return 0;
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
Path.prototype.clone = function() {
    var _clone = new Path();
    this.visit(function(seg) {
        _clone.add(Path.makeSeg(seg.type, [].concat(seg.pts)));
    });
    return _clone;
}
Path.prototype.dispose = function() { }

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
    return 0;
}
MSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
}
MSeg.prototype.toString = function() {
    return "M " + this.pts.join(" ");
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
LSeg.prototype.toString = function() {
    return "L " + this.pts.join(" ");
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
    if ((t < 0) || (t > 1)) return 0;

    var p1 = this.atT(start, t),
        p2 = this.atT(start, t + 0.001);

    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);

    /*     this._ensure_params(start);
    var par = this._params;
    var t1 = t,
        t2 = t + 0.001;
    var tt1 = t1 * t1, // t1^2
        tt2 = t2 * t2; // t1^2
    var p1 = [ 3 * par[0] * tt1 + 2 * par[1] * t1 + par[2],
               3 * par[4] * tt1 + 2 * par[5] * t1 + par[6] ],
        p2 = [ 3 * par[0] * tt2 + 2 * par[1] * t2 + par[2],
               3 * par[4] * tt2 + 2 * par[5] * t2 + par[6] ];

    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]); */
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

// text contsants

// align
C.TA_LEFT = 'left';
C.TA_CENTER = 'center';
C.TA_RIGHT = 'right';

// baseline
C.BL_TOP = 'top';
C.BL_MIDDLE = 'middle';
C.BL_BOTTOM = 'bottom';
C.BL_ALPHABETIC = 'alphabetic';
C.BL_HANGING = 'hanging';
C.BL_IDEOGRAPHIC = 'ideographic';

function Text(lines, font, align, baseline, underlined) {
    this.lines = lines;
    this.font = font || Text.DEFAULT_FONT;
    this.align = align || Text.DEFAULT_ALIGN;
    this.baseline = baseline || Text.DEFAULT_BASELINE;
    this.underlined = __defined(underlined) ? underlined : Text.DEFAULT_UNDERLINE;
    this._bnds = null;
}

Text.DEFAULT_FFACE = 'sans-serif';
Text.DEFAULT_FSIZE = 24;
Text.DEFAULT_FONT = Text.DEFAULT_FSIZE + 'px ' + Text.DEFAULT_FFACE;
Text.DEFAULT_ALIGN = C.TA_LEFT;
Text.DEFAULT_BASELINE = C.BL_BOTTOM; // FIXME: also change to middle?
Text.DEFAULT_UNDERLINE = false;

Text.prototype.apply = function(ctx) {
    ctx.save();
    var dimen = this.dimen(),
        height = (dimen[1] / this.lineCount()),
        underlined = this.underlined;
    ctx.font = this.font;
    ctx.textBaseline = this.baseline || Text.DEFAULT_BASELINE;

    var ascent = this.ascent(height, ctx.textBaseline);

    ctx.textAlign = this.align || Text.DEFAULT_ALIGN;
    var y = 0;
    this.visitLines(function(line) {
        ctx.fillText(line, 0, y+ascent);
        y += height;
    });
    Brush.clearShadow(ctx);
    y = 0;
    this.visitLines(function(line) {
        ctx.strokeText(line, 0, y+ascent);
        y += height;
    });
    if (underlined) { // FIXME: no this.fill anymore
        var stroke = this.fill,
            me = this; //obj_clone(this.fill);
        y = 0;
        Brush.stroke(ctx, stroke);
        ctx.lineWidth = 1;
        this.visitLines(function(line) {
            var width = me.dimen(line)[0];
            ctx.beginPath();
            ctx.moveTo(0, y + height);      // not entirely correct
            ctx.lineTo(width, y + height);
            ctx.stroke();

            y += height;
        });
    }
    ctx.restore();
}
Text.prototype.dimen = function(/*optional: */lines) {
    //if (this._dimen) return this._dimen;
    if (!Text.__measuring_f) throw new SysErr('no Text buffer, bounds call failed');
    return Text.__measuring_f(this, lines);
}
Text.prototype.bounds = function() {
    var dimen = this.dimen();
    return [ 0, 0, dimen[0], dimen[1] ];
}
// should be static
Text.prototype.ascent = function(height, baseline) {
    return (baseline == C.BL_MIDDLE) ? (height / 2) : height;
}
/* FIXME: move to element
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
} */
Text.prototype.lineCount = function() {
    var lines = this.lines;
    return __arr(lines) ? lines.length : 1;
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
    var c = new Text(this.lines, this.font);
    if (this.lines && Array.isArray(this.lines)) {
        c.lines = [].concat(this.lines);
    }
    return c;
}
Text.prototype.dispose = function() { }

// Brush
// -----------------------------------------------------------------------------

// Brush format, general properties:
//
// { color: '#ffaa0b' }
// { color: 'rgb(255,170,11)' }
// { color: 'rgba(255,170,11,0.8)' }
// { color: { r: 255, g: 170, b: 11 } }
// { color: { r: 255, g: 170, b: 11, a: 0.8 } }
// { grad: { stops: [ [ t, color ], ... ],
//           dir: [ [ x0, y0 ], [ x1, y1] ]
//           bounds: [ x, y, width, height ] } }
// { grad: { stops: [ [ t, color ], ... ],
//           dir: [ [ x0, y0 ], [ x1, y1] ]
//           bounds: [ x, y, width, height ],
//           r: [ r0, r1 ] } }

// Fill Brush format == Brush

// Stroke Brush format
// { (color: ... || grad: ...),
//   width: 2,
//   cap: 'round',
//   join: 'round' }

// Shadow Brush format:
// { color: ...,
//   blurRadius: 0.1,
//   offsetX: 5,
//   offsetY: 15 }

var Brush = {};
// Constants
Brush.DEFAULT_CAP = C.PC_ROUND;
Brush.DEFAULT_JOIN = C.PC_ROUND;
Brush.DEFAULT_FILL = '#000';
Brush.DEFAULT_STROKE = null;
// cached creation, returns previous result
// if it was already created before
Brush.adapt = function(ctx, src) {
  // FIXME: check if brush is valid color for string
  if (__str(src)) return src; // FIXME: brush should always be an object
  if (!src._style) { src._style = Brush._adapt(ctx, src); }
  return src._style;
}
// create canvas-compatible style from brush
Brush._adapt = function(ctx, brush) {
    if (brush.color && __str(brush.color)) return brush.color;
    if (brush.color) return Color.toRgbaStr(brush.color);
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
            grad.addColorStop(stop[0], Color.from(stop[1]));
        }
        return grad;
    }
    return null;
}
// TODO: move to instance methods
Brush.fill = function(ctx, fill) {
    ctx.fillStyle = fill ? Brush.adapt(ctx, fill) : Brush.DEFAULT_FILL;
}
Brush.stroke = function(ctx, stroke) {
    ctx.lineWidth = stroke ? stroke.width : 0;
    ctx.strokeStyle = stroke ? Brush.adapt(ctx, stroke) : Brush.DEFAULT_STROKE;
    ctx.lineCap = stroke ? stroke.cap : Brush.DEFAULT_CAP;
    ctx.lineJoin = stroke ? stroke.join : Brush.DEFAULT_JOIN;
}
Brush.shadow = function(ctx, shadow) {
    var props = $engine.getAnmProps(ctx);
    if (!shadow || $conf.doNotRenderShadows || (props.skip_shadows)) return;
    ctx.shadowColor = shadow ? Brush.adapt(shadow) : null;
    ctx.shadowBlur = shadow ? shadow.blurRadius : 0;
    ctx.shadowOffsetX = shadow ? shadow.offsetX : 0;
    ctx.shadowOffsetY = shadow ? shadow.offsetY : 0;
}
Brush.clearShadow = function(ctx) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}
Brush._hasVal = function(fsval) {
    return (fsval && (__str(fsval) || fsval.color || fsval.lgrad || fsval.rgrad));
}
Brush.interpolate = function(from, to, t, trg) {
    if (!from._converted) { Brush.convertColorsToRgba(from); from._converted = true; }
    if   (!to._converted) { Brush.convertColorsToRgba(to);     to._converted = true; }
    var result = trg || {};
    if (__defined(from.width) && __defined(to.width)) {
        result.width = __interpolateFloat(from.width, to.width, t);
    }
    if (from.color) {
        result.grad = null;
        result.color = Color.toRgbaStr(Color.interpolate(from.color, to.color, t));
    } else if (from.grad) {
        result.color = null;
        if (!result.grad) result.grad = {};
        var trgg = result.grad, fromg = from.grad, tog = to.grad, i;
        // direction
        for (i = 0; i < fromg.dir.length; i++) {
            if (!trgg.dir[i]) trgg.dir[i] = [];
            trgg.dir[0] = __interpolateFloat(fromg.dir[i][0], tog.dir[i][0], t);
            trgg.dir[1] = __interpolateFloat(fromg.dir[i][1], tog.dir[i][1], t);
        };
        // stops
        if (!trgg.stops ||
            (trgg.stops.length !== fromg.stops.length)) trgg.stops = [];
        for (i = 0; i < fromg.stops.length; i++) {
            if (!trgg.stops[i]) trgg.stops[i] = [];
            trgg.stops[i][0] = __interpolateFloat(fromg.stops[i][0], tog.stops[i][0], t);
            trgg.stops[i][1] = Color.toRgbaStr(Color.interpolate(fromg.stops[i][1], tog.stops[i][1]), t);
        };
        // radius
        if (fromg.r) {
            if (!trgg.r) trgg.r = [];
            trgg.r[0] = __interpolateFloat(fromg.r[0], tog.r[0], t);
            trgg.r[1] = __interpolateFloat(fromg.r[1], tog.r[1], t);
        } else { trgg.r = null; }
    }
    return result;
}
Brush.convertColorsToRgba = function(src) {
    if (src._converted) return;
    if (src.color && __str(src.color)) {
        src.color = Color.fromStr(data[0].color);
    } else if (src.grad) {
        var stops = src.grad.stops;
        for (var i = 0, il = stops.length; i < il; i++) {
            if (__str(stops[i][1])) {
                stops[i][1] = Color.from(stops[i][1]);
            }
        }
    }
    src._converted = true;
}
Brush.clone = function(src) {
    if (!src) return null;
    var trg = {};
    if (src.color && is_str(src.color)) { trg.color = src.color }
    else if (src.color) {
        trg.color = { r: src.color.r, g: src.color.g, b: src.color.b, a: src.color.a || 1 };
    };
    if (src.grad) {
        var src_grad = src.grad,
            trg_grad = {};
        trg_grad.stops = [];
        for (i = 0; i < src_grad.stops.length; i++) {
            trg_grad.stops[i] = [].concat(src_grad.stops[i]);
        }
        trg_grad.dir = [].concat(src_grad.dir);
        if (src_grad.r) trg_grad.r = [].concat(src_grad.r);
        trg.grad = trg_grad;
    }
    // stroke
    if (src.hasOwnProperty('width')) trg.width = src.width;
    if (src.hasOwnProperty('cap')) trg.cap = src.cap;
    if (src.hasOwnProperty('join')) trg.join = src.join;
    // shadow
    if (src.hasOwnProperty('blurRadius')) trg.blurRadius = src.blurRadius;
    if (src.hasOwnProperty('offsetX')) trg.offsetX = src.offsetX;
    if (src.hasOwnProperty('offsetY')) trg.offsetY = src.offsetY;
}
Brush.invalidate = function(brush) {
    brush._converted = false;
    brush._style = null;
}

//a set of functions for parsing and intepolating color values
var Color = {};
Color.HEX_RE       = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i;
Color.HEX_SHORT_RE = /^#?([a-fA-F\d][a-fA-F\d][a-fA-F\d])$/i;
Color.RGB_RE       = /^rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i;
Color.RGBA_RE      = /^rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*(\d*[.]?\d+)\s*\)$/i;
Color.from = function(test) {
    return __str(test) ? Color.fromStr(test) : (test.r && test);
}
Color.fromStr = function(str) {
    return Color.fromHex(str)
        || Color.fromRgb(str)
        || Color.fromRgba(str)
        || { r: 0, g: 0, b: 0, a: 0};
}
Color.fromHex = function(hex) {
    if (hex[0] !== '#') return null;
    var result = Color.HEX_RE.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 1
        };
    }
    result = Color.HEX_SHORT_RE.exec(hex);
    return result ? {
        r: parseInt(result[1] + result[1], 16),
        g: parseInt(result[2] + result[2], 16),
        b: parseInt(result[3] + result[3], 16),
        a: 1
    } : null;
};
Color.fromRgb = function(rgb) {
    if (rgb.indexOf('rgb(') !== 0) return null;
    var result = Color.RGB_RE.exec(rgb);
    return result ? {
        r: parseInt(result[1]),
        g: parseInt(result[2]),
        b: parseInt(result[3]),
        a: 1
    } : null;
};
Color.fromRgba = function(rgba) {
    if (rgba.indexOf('rgba(') !== 0) return null;
    var result = Color.RGBA_RE.exec(rgba);
    return result ? {
        r: parseInt(result[1]),
        g: parseInt(result[2]),
        b: parseInt(result[3]),
        a: parseFloat(result[4])
    } : null;
};
Color.toRgbaStr = function(color) {
    return 'rgba('+color.r+','+color.g+','+color.b+','+(color.a?color.a.toFixed(2):1.0)+')';
};
Color.interpolate = function(c1, c2, t) {
    return {
        r: Math.round(__interpolateFloat(c1.r, c2.r, t)),
        g: Math.round(__interpolateFloat(c1.g, c2.g, t)),
        b: Math.round(__interpolateFloat(c1.b, c2.b, t)),
        a: __interpolateFloat(c1.a, c2.a, t)
    };
};


Sheet.instances = 0;
Sheet.MISSED_SIDE = 50;
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
    this.wasError = false;
    this._image = null;
    this._cvs_cache = null;
    this._callback = callback;
    this._thumbnail = false; // internal flag, used to load a player thumbnail
}
Sheet.prototype.load = function(player_id, callback, errback) {
    var callback = callback || this._callback;
    if (this._image) throw new Error('Already loaded'); // just skip loading?
    var me = this;
    if (!me.src) {
        $log.error('Empty source URL for image');
        me.ready = true; me.wasError = true;
        if (errback) errback.call(me, 'Empty source');
        return;
    }
    _ResMan.loadOrGet(player_id, me.src,
        function(notify_success, notify_error) { // loader
            if (!me._thumbnail && $conf.doNotLoadImages) {
              notify_error('Loading images is turned off');
              return; }
            var _img = new Image();
            var props = $engine.getAnmProps(_img);
            _img.onload = _img.onreadystatechange = function() {
                if (props.ready) return;
                if (this.readyState && (this.readyState !== 'complete')) {
                    notify_error(this.readyState);
                }
                props.ready = true; // this flag is to check later if request succeeded
                // this flag is browser internal
                _img.isReady = true; /* FIXME: use 'image.complete' and
                                      '...' (network exist) combination,
                                      'complete' fails on Firefox */
                notify_success(_img);
            };
            _img.onerror = notify_error;
            _img.addEventListener('error', notify_error, false);
            try { _img.src = me.src; }
            catch(e) { notify_error(e); }
        },
        function(image) {  // oncomplete
            me._image = image;
            // if (me.regions.length == 1) me._drawToCache();
            me._dimen = [ image.width, image.height ];
            me.ready = true; // this flag is for users of the Sheet class
            me._drawToCache();
            if (callback) callback.call(me, image);
        },
        function(err) { $log.error(err.srcElement || err.path, err.message || err);
                        me.ready = true;
                        me.wasError = true;
                        if (errback) errback.call(me, err); });
}
Sheet.prototype._drawToCache = function() {
    if (!this.ready || this.wasError) return;
    if (this._image.__cvs) {
        this._cvs_cache = this._image.__cvs;
        return;
    }
    var _canvas = $engine.createCanvas(this._dimen[0], this._dimen[1], null, 1 /* FIXME: use real ratio */);
    var _ctx = $engine.getContext(_canvas, '2d');
    _ctx.drawImage(this._image, 0, 0, this._dimen[0], this._dimen[1]);
    this._image.__cvs = _canvas;
    this._cvs_cache = _canvas;
}
Sheet.prototype.apply = function(ctx) {
    if (!this.ready) return;
    if (this.wasError) { this.applyMissed(ctx); return; }
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
Sheet.prototype.applyMissed = function(ctx) {
    ctx.save();
    ctx.strokeStyle = '#900';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var side = Sheet.MISSED_SIDE;
    ctx.moveTo(0, 0);
    ctx.lineTo(side, 0);
    ctx.lineTo(0, side);
    ctx.lineTo(side, side);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, side);
    ctx.lineTo(side, 0);
    ctx.lineTo(side, side);
    ctx.stroke();
    ctx.restore();
}
Sheet.prototype.dimen = function() {
    if (this.wasError) return [ Sheet.MISSED_SIDE, Sheet.MISSED_SIDE ];
    /* if (!this.ready || !this._active_region) return [0, 0];
    var r = this._active_region;
    return [ r[2], r[3] ]; */
    return this._dimen;
}
Sheet.prototype.bounds = function() {
    if (this.wasError) return [ 0, 0, Sheet.MISSED_SIDE, Sheet.MISSED_SIDE ];
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
    this._lhappens = C.NOTHING;
    this._initHandlers(); /* TODO: make automatic */
}
Controls.DEFAULT_THEME = {
  'font': {
      'face': 'Arial, sans-serif',
      'weight': 'bold',
      'timesize': 13.5,
      'statussize': 8.5,
      'infosize_a': 10,
      'infosize_b': 8
  },
  'radius': { // all radius values are relative to (Math.min(width, height) / 2)
      'inner': .25,
      'outer': .28,
      'loader': .25,
      'buttonv': .15, // height of a button
      'buttonh': .14, // width of a button
      'time': .5, // time text position
      'status': .8, // info text position
      'substatus': .9
  },
  'width': { // stroke width
      'inner': 5, // button stroke
      'outer': 3, // progress stroke
      'button': 7 // button stroke
  },
  'statuslimit': 40, // maximum length of status line
  'join': {
      'button': 'round' // join for button stroke
  },
  'colors': {
      /* 'bggrad': { // back gradient start is at (0.1 * Math.max(width/height))
                  // and end is at (1.0 * Math.max(width/height))
          //'start': 'rgba(30,30,30,.7)',
          //'end': 'rgba(30,30,30,1)'
          //'start': 'rgba(30,30,30,.20)', // fefbf2
          //'end': 'rgba(30,30,30,.05)' // eae5d8
          'start': 'rgba(234,229,216,.8)',
          'end': 'rgba(234,229,216,.8)'
      }, */
      'bggrad': [ // back gradient start is at (0.1 * Math.max(width/height))
                  // and end is at (1.0 * Math.max(width/height))
          [ .2,  .2 ],  // [ stop position, alpha ]
          [ .24, .15 ], // [ stop position, alpha ]
          [ .27, .1 ], // [ stop position, alpha ]
          [ .4, 0 ]    // [ stop position, alpha ]
      ],
      'progress': {
          //'passed': 'rgba(0,0,0,.05)',
          //'left': 'rgba(255,255,255,1)'
          //'passed': 'rgba(50,158,192,.85)',
          //'passed': 'rgba(203,86,49,1)',
          'passed': 'rgba(241,91,42,1.0)',
          'left': 'rgba(255,255,255,1)'
      },
      //'button': 'rgba(180,180,180,.85)',
      'button': 'rgba(50,158,192,1)',
      //'stroke': 'rgba(180,180,180,.85)'
      'stroke': 'rgba(50,158,192,.85)',
      'fill': 'rgba(255,255,255,1)',
      'hoverfill': 'rgba(255,255,255,1)',
      'disabledfill': 'rgba(124,30,30,0)',
      'text': 'rgba(50,158,192,.85)',
      'error': 'rgba(250,0,0,.8)',
      'infobg': 'rgba(128,0,0,.8)',
      'secondary': 'rgba(255,255,255,.6)'
  },
  'anmguy': {
      'colors': [ 'rgba(65,61,62,1)', // black
                  'rgba(241,91,42,1)' // orange
                ],
      'center_pos': [ .5, .8 ],
      'corner_pos': [ .825, .9692 ],
      //'corner_pos': [ .77, .9692 ],
      'copy_pos': [ .917, .98 ],
      //'copy_pos': [ .89, .98 ],
      'center_alpha': 1,
      'corner_alpha': .3,
      'center_scale': .07,
      'corner_scale': .04 // relatively to minimum side
  }
};
Controls.THEME = Controls.DEFAULT_THEME;
Controls.LAST_ID = 0;
provideEvents(Controls, [C.X_DRAW]);
Controls.prototype.update = function(parent) {
    var cvs = this.canvas;
    if (!cvs) {
        cvs = $engine.addCanvasOverlay('ctrls-' + Controls.LAST_ID, parent,
                 [ 0, 0, 1, 1 ],
                 function(cvs) {
                    $engine.registerAsControlsElement(cvs, parent);
                 });
        Controls.LAST_ID++;
        this.id = cvs.id;
        this.canvas = cvs;
        this.ctx = $engine.getContext(cvs, '2d');
        this.subscribeEvents(cvs, parent);
        this.hide();
        this.changeTheme(Controls.THEME);
    } else {
        $engine.updateOverlay(parent, cvs);
    }
    this.handleAreaChange();
    if (this.info) this.info.update(parent);
}
Controls.prototype.subscribeEvents = function(canvas, parent) {
    $engine.subscribeCanvasEvents(parent, {
        mouseenter: (function(controls) {
                return function(evt) { controls.handleMouseEnter(); };
            })(this),
        mouseleave: (function(controls) {
                return function(evt) { controls.handleMouseLeave(); };
            })(this),
        click: (function(controls) {
                return function(evt) { controls.handlePlayerClick(); };
            })(this)
    });
    $engine.subscribeCanvasEvents(canvas, {
        mouseenter: (function(controls) {
                return function(evt) { controls.handleMouseEnter(); };
            })(this),
        mouseleave: (function(controls) {
                return function(evt) { controls.handleMouseLeave(); };
            })(this),
        mousemove: (function(controls) {
                return function(evt) { controls.handleMouseMove(evt); };
            })(this),
        mousedown: (function(controls) {
                return function(evt) { controls.handleClick(); };
            })(this)
    });
}
Controls.prototype.render = function(time) {
    if (this.hidden && !this.__force) return;

    if (!this.bounds) return;

    // TODO: may be this function should check player mode by itself and create canvas
    //       only in case it is required, but player should create Controls instance
    //       all the time, independently of the mode.

    var player = this.player,
        state = player.state,
        _s = state.happens;
    //if (_s == C.NOTHING) return;

    var time = (time > 0) ? time : 0;
    if (!this.__force &&
        (time === this._time) &&
        (_s === this._lhappens)) return;

    // these states do not change controls visually between frames
    if (__defined(this._lastDrawn) &&
        (this._lastDrawn === _s) &&
        ((_s === C.STOPPED) ||
         (_s === C.NOTHING) ||
         (_s === C.ERROR))
       ) return;

    this.rendering = true;

    if (((this._lhappens === C.LOADING) || (this._lhappens === C.RES_LOADING)) &&
        ((_s !== C.LOADING) && (_s !== C.RES_LOADING))) {
        Controls._stopLoadingAnimation(this.ctx);
    }

    this._time = time;
    this._lhappens = _s;

    var ctx = this.ctx,
        theme = this.theme,
        duration = state.duration,
        progress = time / ((duration !== 0) ? duration : 1);

    var _w = this.bounds[2],
        _h = this.bounds[3],
        ratio = $engine.PX_RATIO;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, _w, _h);

    if (_s === C.PLAYING) {
        /* Controls._drawBack(ctx, theme, _w, _h);
        Controls._drawProgress(ctx, theme, _w, _h, progress);
        Controls._drawPause(ctx, theme, _w, _h, this.focused);
        if (duration) {
            Controls._drawTime(ctx, theme, _w, _h, time, duration);
        } */
    } else if (_s === C.STOPPED) {
        Controls._drawBack(ctx, theme, _w, _h);
        Controls._drawPlay(ctx, theme, _w, _h, this.focused);
    } else if (_s === C.PAUSED) {
        Controls._drawBack(ctx, theme, _w, _h);
        Controls._drawProgress(ctx, theme, _w, _h, progress);
        Controls._drawPlay(ctx, theme, _w, _h, this.focused);
        if (duration) {
            Controls._drawTime(ctx, theme, _w, _h, time, duration);
        }
    } else if (_s === C.NOTHING) {
        Controls._drawBack(ctx, theme, _w, _h);
        Controls._drawNoAnimation(ctx, theme, _w, _h, this.focused);
    } else if ((_s === C.LOADING) || (_s === C.RES_LOADING)) { // TODO: show resource loading progress
        Controls._runLoadingAnimation(ctx, function(ctx) {
            ctx.clearRect(0, 0, _w, _h);
            //Controls._drawBack(ctx, theme, _w, _h);
            Controls._drawLoading(ctx, theme, _w, _h,
                                  (((Date.now() / 100) % 60) / 60), '');
                                  // isRemoteLoading ? player._loadSrc '...' : '');
        });
    } else if (_s === C.ERROR) {
        Controls._drawError(ctx, theme, _w, _h, player.__lastError, this.focused);
    }
    this._lastDrawn = _s;

    ctx.restore();
    this.fire(C.X_DRAW, state);

    this.__force = false;

    if (this.info) {
      if (_s !== C.NOTHING) { this._infoShown = true; this.info.render(); }
      else { this._infoShown = false; }
    }

    this.rendering = false;
}
Controls.prototype.react = function(time) {
    if (this.hidden) return;

    var _p = this.player,
        _s = _p.state.happens;
    if ((_s === C.NOTHING) || (_s === C.LOADING) || (_s === C.ERROR)) return;
    if (_s === C.STOPPED) { /*$log.debug('play from start');*/ _p.play(0); return; }
    if (_s === C.PAUSED) { /*$log.debug('play from ' + this._time);*/ _p.play(this._time); return; }
    if (_s === C.PLAYING) { /*$log.debug('pause at' + time);*/ this._time = time; _p.pause(); return; }
}
Controls.prototype.refreshByMousePos = function(pos) {
    if (!this.bounds) return;
    var state = this.player.state,
        _lx = pos[0],
        _ly = pos[1],
        _w = this.bounds[2],
        _h = this.bounds[3],
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
Controls.prototype.handleAreaChange = function() {
    if (!this.player || !this.player.canvas) return;
    this.bounds = $engine.getCanvasBounds(this.canvas);
}
Controls.prototype.handleMouseMove = function(evt) {
    if (!evt) return;
    this._last_mevt = evt;
    //var pos = $engine.getEventPosition(evt, this.canvas);
    //if (this.localInBounds(pos) && (this.player.state.happens !== C.PLAYING)) {
        if (this.hidden) this.show();
        this.refreshByMousePos($engine.getEventPosition(evt, this.canvas));
    //} else {
    //    this.handleMouseOut();
    //}
}
Controls.prototype.handleClick = function() {
    var state = this.player.state;
    this.forceNextRedraw();
    this.react(state.time);
    this.render(state.time);
    if (state.happens === C.PLAYING) this.hide();
}
Controls.prototype.handlePlayerClick = function() {
    if (this.player.handleEvents) return;
    var state = this.player.state;
    if (state.happens === C.PLAYING) {
        this.show();
        this.forceNextRedraw();
        this.react(state.time);
        this.render(state.time);
    }
}
Controls.prototype.handleMouseEnter = function() {
    var state = this.player.state;
    if (state.happens !== C.PLAYING) {
        if (this.hidden) this.show();
        this.forceNextRedraw();
        this.render(state.time);
    }
}
Controls.prototype.handleMouseLeave = function() {
    var state = this.player.state;
    if ((state.happens === C.NOTHING) ||
        (state.happens === C.LOADING) ||
        (state.happens === C.RES_LOADING) ||
        (state.happens === C.ERROR) ||
        (state.happens === C.STOPPED)) {
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
    $engine.hideElement(this.canvas);
    this.hidden = true;
    if (this.info) this.info.hide();
}
Controls.prototype.show = function() {
    $engine.showElement(this.canvas);
    this.hidden = false;
    if (this.info && this._infoShown) this.info.show();
}
Controls.prototype.reset = function() {
    this._time = -1000;
    this.elapsed = false;
    if (this.info) this.info.reset();
}
Controls.prototype.detach = function(parent) {
    $engine.detachElement(parent, this.canvas);
    if (this.info) this.info.detach(parent);
    if (this.ctx) $engine.clearAnmProps(this.ctx);
}
Controls.prototype.inBounds = function(pos) {
    //if (this.hidden) return false;
    var _b = this.bounds;
    return (pos[0] >= _b[0]) &&
           (pos[0] <= _b[0] + _b[2]) &&
           (pos[1] >= _b[1]) &&
           (pos[1] <= _b[1] + _b[3]);
}
Controls.prototype.localInBounds = function(pos) {
    //if (this.hidden) return false;
    var _b = this.bounds;
    if (!_b) return false;
    return (pos[0] >= 0) &&
           (pos[0] <= _b[2]) &&
           (pos[1] >= 0) &&
           (pos[1] <= _b[3]);
}
Controls.prototype.changeTheme = function(to) {
    this.theme = to;
    // TODO: redraw
}
Controls.prototype.forceNextRedraw = function() {
    this.__force = true;
}
Controls.prototype._scheduleLoading = function() {
    if (this._loadingInterval) return;
    var controls = this;
    this._loadingInterval = setInterval(function() {
         controls.forceNextRedraw();
         controls.render();
    }, 50);
}
Controls.prototype._stopLoading = function() {
    if (!this._loadingInterval) return;
    clearInterval(this._loadingInterval);
    this._loadingInterval = 0;
    this.forceNextRedraw();
    this.render(this.player.state.time);
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
    // FIXME: unsubscribe events!
    this.detach(this.player.wrapper);
}
Controls.prototype.enableInfo = function() {
    if (!this.info) this.info = new InfoBlock(this.player);
    this.info.update(this.player.canvas);
}
Controls.prototype.disableInfo = function() {
    if (this.info) this.info.detach(this.player.wrapper);
    /*if (this.info) */this.info = null;
}
Controls.prototype.setDuration = function(value) {
    if (this.info) this.info.setDuration(value);
}
Controls.prototype.inject = function(anim, duration) {
    if (this.info) this.info.inject(anim, duration);
}
Controls._drawBack = function(ctx, theme, w, h, bgcolor) {
    ctx.save();
    var cx = w / 2,
        cy = h / 2;

    var rgb = [ 175, 200, 200 ],
        bgcolor = bgcolor || '#fff';

    // FIXME: use color parser here!
    //if ((bgcolor == '#000') ||
    //    (bgcolor == '#000000')) rgb = [ 0, 0, 0 ];

    var grd = ctx.createRadialGradient(cx, cy, 0,
                                       cx, cy, Math.max(cx, cy) * 1.2);
    var stops = theme.colors.bggrad;
    for (var i = 0, il = stops.length; i < il; i++) {
        grd.addColorStop(stops[i][0], 'rgba(' + rgb[0] + ','
                                              + rgb[1] + ','
                                              + rgb[2] + ','
                                              + stops[i][1] + ')');
    }

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
}
Controls._drawProgress = function(ctx, theme, w, h, progress) {
    if (!__finite(progress)) return;

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
Controls._drawPause = function(ctx, theme, w, h, focused) {
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

    Controls._drawGuyInCorner(ctx, theme, w, h);
}
Controls._drawPlay = function(ctx, theme, w, h, focused) {
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

    Controls._drawGuyInCorner(ctx, theme, w, h);
}
Controls._drawLoading = function(ctx, theme, w, h, hilite_pos, src) {
    Controls._drawLoadingProgress(ctx, w, h, hilite_pos, theme.radius.loader,
                                             theme.colors.progress.left, theme.colors.progress.passed);

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

    Controls._drawGuyInCenter(ctx, theme, w, h);
}
Controls._drawLoadingProgress = function(ctx, w, h, hilite_pos, radius, normal_color, hilite_color) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        circles = 15,
        outer_rad = Math.min(cx, cy) * radius,
        circle_rad = Math.min(cx, cy) / 25,
        two_pi = 2 * Math.PI,
        hilite_idx = Math.ceil(circles * hilite_pos);

    ctx.translate(cx, cy);
    for (var i = 0; i <= circles; i++) {
        ctx.beginPath();
        ctx.arc(0, outer_rad, circle_rad, 0, two_pi);
        ctx.fillStyle = (i != hilite_idx) ? normal_color : hilite_color;
        ctx.fill();
        ctx.rotate(two_pi / circles);
    }
    ctx.restore();
}
Controls._drawNoAnimation = function(ctx, theme, w, h, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.fillStyle = '#eee';
    ctx.fillRect(3, 3, w - 3, h - 3);

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

    Controls._drawGuyInCenter(ctx, theme, w, h);

}
Controls._drawError = function(ctx, theme, w, h, error, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.fillStyle = '#eee';
    ctx.fillRect(3, 3, w - 3, h - 3);

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
                   theme.font.statussize * 1.2,
                   (error && error.message) ? ell_text(error.message, theme.statuslimit)
                                            : error, theme.colors.error);

    Controls._drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.substatus)),
                   theme.font.statussize,
                   Strings.COPYRIGHT);

    Controls._drawGuyInCenter(ctx, theme, w, h, [ theme.colors.button,
                                                  theme.colors.error ]);
}
Controls._drawTime = function(ctx, theme, w, h, time, duration) {
    Controls._drawText(ctx, theme,
                       w / 2, ((h / 2) * (1 + theme.radius.time)),
                       theme.font.timesize,
                       fmt_time(time) + ' / ' + fmt_time(duration));

}
Controls._drawText = function(ctx, theme, x, y, size, text, color, align) {
    ctx.save();
    ctx.font = theme.font.weight + ' ' + Math.floor(size || 15) + 'pt ' + theme.font.face;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || theme.colors.text;
    ctx.fillText(text, x, y);
    ctx.restore();
}
Controls._drawGuyInCorner = function(ctx, theme, w, h, colors, pos, scale) {
    // FIXME: place COPYRIGHT text directly under the guy in drawAnimatronGuy function
    // Controls._drawText(ctx, theme,
    //                    w - 10,
    //                    theme.anmguy.copy_pos[1] * h,
    //                    (theme.font.statussize - (1600 / w)),
    //                    Strings.COPYRIGHT, theme.colors.secondary, 'right');

    /* if ((w / ratio) >= 400) {
      drawAnimatronGuy(ctx, (pos ? pos[0] : theme.anmguy.corner_pos[0]) * w,
                            //theme.anmguy.copy_pos[0] * w,
                            (pos ? pos[1] : theme.anmguy.corner_pos[1]) * h,
                       (scale || theme.anmguy.corner_scale) * Math.min(w, h),
                       colors || theme.anmguy.colors, theme.anmguy.corner_alpha);
    } */
}
Controls._drawGuyInCenter = function(ctx, theme, w, h, colors, pos, scale) {
    drawAnimatronGuy(ctx, (pos ? pos[0] : theme.anmguy.center_pos[0]) * w,
                          (pos ? pos[1] : theme.anmguy.center_pos[1]) * h,
                     (scale || theme.anmguy.center_scale) * Math.min(w, h),
                     colors || theme.anmguy.colors, theme.anmguy.center_alpha);

    // FIXME: place COPYRIGHT text directly under the guy in drawAnimatronGuy function
}
Controls._runLoadingAnimation = function(ctx, paint) {
    // FIXME: unlike player's _runLoadingAnimation, this function is more private/internal
    //        and Contols._scheduleLoading() should be used to start all the drawing process
    var props = $engine.getAnmProps(ctx);
    if (props.loading_req) return;
    var ratio = $engine.PX_RATIO;
    // var isRemoteLoading = (_s === C.RES_LOADING); /*(player._loadTarget === C.LT_URL)*/
    props.supress_loading = false;
    function loading_loop() {
        if (props.supress_loading) return;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (ratio != 1) ctx.scale(ratio, ratio);
        // FIXME: redraw only the changed circles
        paint(ctx);
        ctx.restore();
        return __nextFrame(loading_loop);
    }
    props.loading_req = __nextFrame(loading_loop);
}
Controls._stopLoadingAnimation = function(ctx, paint) {
    // FIXME: unlike player's _stopLoadingAnimation, this function is more private/internal
    //        and Contols._stopLoading() should be used to stop the drawing process
    var props = $engine.getAnmProps(ctx);
    if (!props.loading_req) return;
    props.supress_loading = true;
    __stopAnim(props.loading_req);
    props.loading_req = null;
}

// Info Block
// -----------------------------------------------------------------------------

function InfoBlock(player) {
    this.canvas = null;
    this.ctx = null;
    this.ready = false;
    this.hidden = false;
    this.attached = false;
}
/* FIXME: merge Info Block and Controls? */
InfoBlock.BASE_BGCOLOR = Controls.THEME.colors.infobg;
InfoBlock.BASE_FGCOLOR = Controls.THEME.colors.text;
InfoBlock.OPACITY = 1;
InfoBlock.PADDING = 6;
InfoBlock.OFFSET_X = 0.03; // percents of canvas height
InfoBlock.OFFSET_Y = 0.02; // percents of canvas width
InfoBlock.FONT = Controls.THEME.font.face;
InfoBlock.FONT_SIZE_A = Controls.THEME.font.infosize_a;
InfoBlock.FONT_SIZE_B = Controls.THEME.font.infosize_b;
InfoBlock.DEFAULT_WIDTH = 0.3; // percents of canvas height
InfoBlock.DEFAULT_HEIGHT = 0.1; // percents of canvas height
InfoBlock.LAST_ID = 0;
InfoBlock.prototype.detach = function(parent) {
    if (!this.attached) return;
    $engine.detachElement(parent, this.canvas);
    this.attached = false;
}
// TODO: move to engine
InfoBlock.prototype.update = function(parent) {
    var cvs = this.canvas,
        pconf = $engine.getCanvasSize(parent),
        _m = InfoBlock.MARGIN,
        _w = InfoBlock.DEFAULT_WIDTH, _h = InfoBlock.DEFAULT_HEIGHT;
    if (!cvs) {
        cvs = $engine.addCanvasOverlay('info-' + InfoBlock.LAST_ID, parent,
                 [ InfoBlock.OFFSET_X, InfoBlock.OFFSET_Y,
                   InfoBlock.DEFAULT_WIDTH, InfoBlock.DEFAULT_HEIGHT ],
                 function(cvs) {
                    $engine.registerAsInfoElement(cvs, parent);
                 });
        InfoBlock.LAST_ID++;
        this.id = cvs.id;
        this.canvas = cvs;
        this.attached = true;
        this.ctx = $engine.getContext(cvs, '2d');
        this.hide();
        this.changeTheme(InfoBlock.BASE_FGCOLOR, InfoBlock.BASE_BGCOLOR);
    } else {
        $engine.updateOverlay(parent, cvs);
    }
    //var cconf = $engine.getCanvasParameters(cvs);
    // _canvas.style.left = _cp[0] + 'px';
    // _canvas.style.top = _cp[1] + 'px';
    //this._ratio = cconf[2];
    //this.ctx.font = Controls.FONT_WEIGHT + ' ' + Math.floor(Controls._TS) + 'px ' + Controls.FONT;
    this.bounds = $engine.getCanvasBounds(cvs);
}
InfoBlock.prototype.render = function() {
    if (!this.__data) return;
    var meta = this.__data[0],
        anim = this.__data[1],
        duration = this.__data[2] || meta.duration;
    var ratio = $engine.PX_RATIO;
    /* TODO: show speed */
    var _tl = new Text(meta.title || '[No title]', 'bold ' + Math.floor(InfoBlock.FONT_SIZE_A) + 'px ' + InfoBlock.FONT, { color: this.__fgcolor }),
        _bl = new Text((meta.author || '[Unknown]') + ' ' + (duration ? (duration + 's') : '?s') +
                       ' ' + (anim.width || 0) + 'x' + (anim.height || 0),
                      Math.floor(InfoBlock.FONT_SIZE_B) + 'px ' + InfoBlock.FONT, { color: this.__fgcolor }),  // meta.version, meta.description, meta.copyright
        _p = InfoBlock.PADDING,
        _td = _tl.dimen(),
        _bd = _bl.dimen(),
        _nw = Math.max(_td[0], _bd[0]) + _p + _p,
        _nh = _td[1] + _bd[1] + (_p * 3),
        ctx = this.ctx;
    $engine.setCanvasSize(this.canvas, _nw, _nh);
    ctx.save();
    if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, _nw, _nh);
    ctx.fillStyle = this.__bgcolor;
    //Controls.__roundRect(ctx, 0, 0, _nw, _nh, 5);
    ctx.fill();
    ctx.fillStyle = this.__fgcolor;
    ctx.translate(_p, _p);
    _tl.apply(ctx);
    ctx.globalAlpha = .8;
    ctx.translate(0, _bd[1] + _p);
    _bl.apply(ctx);
    ctx.restore();
}
InfoBlock.prototype.inject = function(anim, duration) {
    if (!anim) return;
    var meta = anim.meta;
    this.__data = [ anim, meta, duration || (meta && meta.duration) || anim.duration || 0 ];
    if (this.ready) this.render();
}
InfoBlock.prototype.reset = function() {

}
InfoBlock.prototype.hide = function() {
    $engine.hideElement(this.canvas);
    this.hidden = true;
}
InfoBlock.prototype.show = function() {
    $engine.showElement(this.canvas);
    this.hidden = false;
}
InfoBlock.prototype.setDuration = function(value) {
    if (this.__data) this.inject(this.__data[0], value);
}
InfoBlock.prototype.changeTheme = function(front, back) {
    this.__fgcolor = front;
    this.__bgcolor = back;
    // TODO: redraw
}

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
    /* var spec = _anmGuySpec,
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
        anmGuyCanvas = $engine.createCanvas(w, h);
        anmGuyCtx = $engine.getContext(anmGuyCanvas, '2d');
    } else {
        // FIXME: resize only if size was changed
        $engine.setCanvasSize(anmGuyCanvas, w, h);
    }

    var maskCanvas = anmGuyCanvas;
    var maskCtx = anmGuyCtx;

    maskCtx.save();

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
    maskCtx.restore();

    ctx.save();
    if (opacity) ctx.globalAlpha = opacity;
    ctx.drawImage(maskCanvas, x - (w / 2), y - (h / 2));
    ctx.restore(); */
}

// Exports
// -----------------------------------------------------------------------------

return (function($trg) {

    function __createPlayer(elm, opts) { var p = new Player();
                                         p.init(elm, opts); return p; }
    function __findAndInitPotentialPlayers() {
        var matches = $engine.findPotentialPlayers();
        for (var i = 0, il = matches.length; i < il; i++) {
            __createPlayer(matches[i]);
        }
    }

    //registerGlobally('createPlayer', __createPlayer);

    /*$trg.__js_pl_all = this;*/

    $trg.createPlayer = __createPlayer;
    $trg.findById = function(where, id) {
        var found = [];
        if (where.name == name) found.push(name);
        where.travelChildren(function(elm)  {
            if (elm.id == id) found.push(elm);
        });
        return found;
    }
    $trg.findByName = function(where, name) {
        where.findByName(name);
    }

    $trg._$ = __createPlayer;

    $trg.Player = Player;
    $trg.Animation = Animation; $trg.Element = Element; $trg.Clip = Clip;
    $trg.Path = Path; $trg.Text = Text; $trg.Sheet = Sheet; $trg.Image = _Image;
    $trg.Modifier = Modifier; $trg.Painter = Painter;
    $trg.Tweens = Tweens; $trg.Tween = Tween; $trg.Easing = Easing;
    $trg.MSeg = MSeg; $trg.LSeg = LSeg; $trg.CSeg = CSeg;
    $trg.Color = Color;
    $trg.Render = Render; $trg.Bands = Bands;  // why Render and Bands classes are visible to pulic?

    $trg.obj_clone = obj_clone; /*$trg.ajax = $engine.ajax;*/

    $trg.__dev = { 'strf': _strf,
                   'adjust': __adjust,
                   't_cmp': __t_cmp,
                   'TIME_PRECISION': TIME_PRECISION/*,
                   'Controls': Controls, 'Info': InfoBlock*/ };

    $engine.onDocReady(__findAndInitPotentialPlayers);

    return Player;

})(anm);

});
