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

var anm = require('./anm.js'),
    utils = require('./anm/utils.js');

var $engine = anm.engine;
var $conf = anm.conf;
var $log = anm.log;

// Utils
// -----------------------------------------------------------------------------

// ### Events
/* ---------- */

var provideEvents = anm.events.provideEvents;
var registerEvent = anm.events.registerEvent;

// Classes
var Controls = require('./anm/controls.js');


// ### Other External utilities
/* ---------- */

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
    __tween    = is.tween;

// ### Strings & Errors
/* ---------- */

var Strings = anm.loc.Strings,
    Errors = anm.loc.Errors;

var SystemError = anm.errors.SystemError,
    SysErr = SystemError;

var PlayerError = anm.errors.PlayerError,
    PlayerErr = PlayerError;

var AnimationError = anm.errors.AnimationError,
    AnimErr = AnimationError;


// Internal Constants
// -----------------------------------------------------------------------------

var TIME_PRECISION = 9; // the number of digits after the floating point
                        // to round the time when comparing with bands and so on;
                        // used to get rid of floating point-conversion issues

function __adjust(t) {
    return utils.roundTo(t, TIME_PRECISION);
}

function __t_cmp(t0, t1) {
    if (__adjust(t0) > __adjust(t1)) return 1;
    if (__adjust(t0) < __adjust(t1)) return -1;
    return 0;
}

// Constants
// -----------------------------------------------------------------------------

var C = anm.constants; // will be transferred to public namespace both from bottom of player.js

var _ResMan = anm.resource_manager;
var _PlrMan = anm.player_manager;



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

// Player
// -----------------------------------------------------------------------------

/**
 * @class anm.Player
 *
 * The Player is the one who rules them all.
 *
 * The easiest way to create a Player class instance (among dozens of ways to
 * init the Player without any JS code) is to call `var player = new Player();
 * player.init(...)`. If you want to initialize a player in one step, call
 * `anm.createPlayer(...)` instead.
 *
 * If you have an URL to Animatron-compatible JSON snapshot, you may load a Player
 * without any JS, with:
 *
 * `<div id="my-precious-player" anm-src="http://example.com/animation.json" anm-width="100" anm-height="200"/></div>`
 *
 * It is recommended to always specify both width and height of a Player, if you know
 * them before. If the scene is loaded synchronously and it has some size specified in
 * any way, this doesn't changes a lot, since Player takes its size from these values.
 * But if the scene is loaded asynhronously, a noticable value of time is spent on request,
 * so it's better to resize Player before the loading will start, so no creepy resize effect
 * will appear.
 *
 * For details on loading, see {@link anm.Player#load} method. For the list
 * of possible attribute options and other ways to initialize, see
 * {@link anm.Player#init} method.
 *
 * To load some remote Animatron snapshot in one step, use {@link anm.Player#forSnapshot}.
 *
 * Playing control:
 *
 * * {@link anm.Player#play}
 * * {@link anm.Player#stop}
 * * {@link anm.Player#pause}
 * * {@link anm.Player#drawAt}
 *
 * To set thumbnail to show while animation loads or wasn't started, use {@link anm.Player#setThumbnail}.
 *
 * @constructor
 */

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

/**
  * @private @static @property
  *
  * Methods listed below are directly wrapped with try/catch to check
  * which way of handling/suppressing errors is current one for this player
  * and act with catched errors basing on this way
  */
Player._SAFE_METHODS = [ 'init', 'load', 'play', 'stop', 'pause', 'drawAt' ];

/* TODO: add load/play/pause/stop events */

/**
 * @method init
 * @chainable
 *
 * Initializes player.
 *
 * @param {HTMLElement|String} elm DOM Element or ID of existing DOM Element to init from.
 *
 * This one shouldn't be a `canvas` element, but rather a block element like
 * `div`, since Player will put its own structure of one or more canvases inside it.
 *
 * @param {Object} [opts] Initialization options.
 *
 * Options format:
 *
 *     { debug: false,
 *       autoPlay: false,
 *       repeat: false,
 *       mode: C.M_VIDEO,
 *       zoom: 1.0,
 *       speed: 1.0,
 *       width: undefined,
 *       height: undefined,
 *       bgColor: undefined,
 *       ribbonsColor: undefined,
 *       audioEnabled: true,
 *       inifiniteDuration: false,
 *       drawStill: false,
 *       controlsEnabled: undefined, // undefined means 'auto'
 *       infoEnabled: undefined, // undefined means 'auto'
 *       handleEvents: undefined, // undefined means 'auto'
 *       loadingMode: undefined, // undefined means 'auto'
 *       thumbnail: undefined,
 *       forceAnimationSize: false,
 *       muteErrors: false
 *     }
 *
 * First, Player initializes itself with default options. Then it scans the given `elm`
 * DOM Element for the attributes named with `anm-` prefix and applies them over the
 * default values. Then, it applies the `opts` you passed here, so they have the highest
 * priority.
 *
 * `anm`-attributes have the same names as in the given example, with camel-casing changed
 * to dashing, i.e.:
 *
 * `<div id="player" anm-width="200" anm-height="100" anm-auto-play="true" anm-ribbons-color="#f00" />`
 *
 * @param {Boolean} [opts.debug=false] Enables showing FPS and shapes paths, at least
 * @param {Boolean} [opts.autoPlay=false] If Player automatically starts playing just after the
 *                                        {@link anm.Animation Animation} was loaded inside.
 * @param {Boolean} [opts.repeat=false] If Player automatically starts playing the Animation again
 *                                      when it's finished the time before. A.K.A. "Infinite Loop".
 * @param {Mixed} [opts.mode=C.M_VIDEO]
 *
 * The Player mode, which actually just specifies a combination of other options:
 *
 * * `C.M_PREVIEW` — `controlsEnabled=false` + `infoEnabled=false` + `handleEvents=false`
 *    + `drawStill=false` + `infiniteDuration=false` — used for Editor Preview by F10;
 * * `C.M_DYNAMIC` — `controlsEnabled=false` + `infoEnabled=false` + `handleEvents=true`
 *    + `drawStill=false` + `infiniteDuration=true` — used for games or interactive animations, mostly;
 * * `C.M_VIDEO` — `controlsEnabled=true` + `infoEnabled=false` (temporarily) + `handleEvents=false`
 *    + `drawStill=true` + `infiniteDuration=false` — used for non-interactive animations;
 * * `C.M_SANDBOX` — `controlsEnabled=false` + `infoEnabled=false` `handleEvents=false`
 *    + `drawStill=false` + `infiniteDuration=false` — used in Sandbox;
 *
 * @param {Number} [opts.zoom=1.0] Force scene zoom. Player will not resize itself, though, but will act
 *                                 as a magnifying/minifying glass for all values except `1.0`.
 * @param {Number} [opts.speed=1.0] Increase/decrease playing speed.
 * @param {Number} [opts.bgColor='transparent'] The color to use as a background.
 *
 * // TODO
 */

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

/**
 * @method load
 * @chainable
 *
 * This method may be called in several ways:
 *
 * * `load(animation)`;
 * * `load(animation, callback)`;
 * * `load(animation, importer)`;
 * * `load(animation, duration)`;
 * * `load(animation, importer, callback)`;
 * * `load(animation, duration, callback)`;
 * * `load(animation, duration, importer, callback)`;
 *
 * @param {anm.Animation|Object} animation
 * @param {Number} [duration]
 * @param {anm.Importer} [importer]
 * @param {Function} [callback]
 * @param {anm.Animation} callback.animation The resulting Animation, was it adapted with Importer or not
 *
 * TODO
 */
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
/**
 * @method play
 * @chainable
 *
 * @param {Number} [from]
 * @param {Number} [speed]
 * @param {Number} [stopAfter]
 *
 **/
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

/**
 * @method stop
 * @chainable
 */
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

/**
 * @method pause
 * @chainable
 */
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

/**
 * @method onerror
 *
 * @param {Function} callback
 * @param {Error} callback.error
 */
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
        if (!wrapper_id) throw new PlayerErr(utils.strf(Errors.P.NO_WRAPPER_WITH_ID, [wrapper_id]));
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
                  (to_load.importer_id) && anm.importers.isAccessible(to_load.importer_id)
                  ? anm.importers.create(to_load.importer_id) : null);
    }
}
/**
 * @method changeRect
 *
 * @param {Object} rect
 * @param {Number} rect.x
 * @param {Number} rect.y
 * @param {Number} rect.width
 * @param {Number} rect.height
 */
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
/**
 * @method forceRedraw
 */
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
/**
 * @method changeZoom
 *
 * @param {Number} zoom
 */
Player.prototype.changeZoom = function(zoom) {
    this.zoom = zoom;
}
/**
 * @method drawAt
 *
 * @param {Number} time
 * draw current {@link anm.Animation animation} at specified time
 */
Player.prototype.drawAt = function(time) {
    if (time === Player.NO_TIME) throw new PlayerErr(Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
    if ((this.state.happens === C.RES_LOADING) &&
        (player.loadingMode === C.LM_ONREQUEST)) { this._postpone('drawAt', arguments);
                                                   return; } // if player loads remote resources just now,
                                                             // postpone this task and exit. postponed tasks
                                                             // will be called when all remote resources were
                                                             // finished loading
    if ((time < 0) || (time > this.anim.duration)) {
        throw new PlayerErr(utils.strf(Errors.P.PASSED_TIME_NOT_IN_RANGE, [time]));
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
/**
 * @method setSize
 *
 * @param {Number} width
 * @param {Number} height
 **/
Player.prototype.setSize = function(width, height) {
    this.__userSize = [ width, height ];
    this._resize();
}
/**
 * @method setThumbnail
 *
 * TODO
 *
 * ...It's optional to specify `target_width`/`target_height`, especially if aspect ratio
 * of animation(s) that will be loaded into player matches to aspect ratio of player itself.
 * If not, `target_width` and `target_height`, if specified, are recommended to be equal
 * to a size of an animation(s) that will be loaded into player with this thumbnail;
 * so, since animation will be received later, and if aspect ratios of animation and player
 * does not match, both thumbnail and the animation will be drawn at a same position
 * with same black ribbons applied;
 * If size will not be specified, player will try to match aspect ratio of an image to
 * show it without stretches, so if thumbnail image size matches to animation size has
 * the same aspect ratio as an animation, it is also ok to omit the size data here
 *
 * @param {String} url
 * @param {Number} [target_width]
 * @param {Number} [target_height]
 */
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
/**
 * @method detach
 */
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
/**
 * @method attachedTo
 *
 * @param {HTMLElement} canvas_or_wrapper
 */
Player.prototype.attachedTo = function(canvas_or_wrapper) {
    return $engine.playerAttachedTo(canvas_or_wrapper, this);
}
/**
 * @method isAttached
 */
Player.prototype.isAttached = function() {
    return $engine.playerAttachedTo(this.wrapper, this);
}
/**
 * @static @method attachedTo
 *
 * @param {HTMLElement} canvas_or_wrapper
 * @param {anm.Player} player
 */
Player.attachedTo = function(canvas_or_wrapper, player) {
    return $engine.playerAttachedTo(canvas_or_wrapper, player);
}
/**
 * @method invalidate
 *
 * Invalidates Player position in document
 */
Player.prototype.invalidate = function() {
    // TODO: probably, there's more to invalidate
    if (this.controls) this.controls.update(this.canvas);
}
Player.__invalidate = function(player) {
    return function(evt) {
        player.invalidate();
    };
}
/**
 * @method beforeFrame
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Boolean} callback.return
 */
// TODO: change to before/after for events?
Player.prototype.beforeFrame = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.BEFOREFRAME_BEFORE_PLAY);
    this.__userBeforeFrame = callback;
}
/**
 * @method afterFrame
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Boolean} callback.return
 */
Player.prototype.afterFrame = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.AFTERFRAME_BEFORE_PLAY);
    this.__userAfterFrame = callback;
}
/**
 * @method beforeRender
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Canvas2DContext} callback.ctx
 */
Player.prototype.beforeRender = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.BEFORENDER_BEFORE_PLAY);
    this.__userBeforeRender = callback;
}
/**
 * @method afterRender
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Canvas2DContext} callback.ctx
 */
Player.prototype.afterRender = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.AFTERRENDER_BEFORE_PLAY);
    this.__userAfterRender = callback;
}
/**
 * @method subscribeEvents
 *
 * @param {Canvas} canvas
 */
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
    ctx.lineWidth = Player.EMPTY_STROKE_WIDTH;
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
    ctx.lineWidth = Player.EMPTY_STROKE_WIDTH;
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
/**
 * @method toString
 *
 * @return a nice string
 */
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
  } catch(e) { throw new SysErr(utils.strf(Errors.S.ERROR_HANDLING_FAILED, [err.message || err])); }

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
    if (!player[method]) throw new SysErr(utils.strf(Errors.S.NO_METHOD_FOR_PLAYER, [method]));
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

/**
 * @deprecated
 * @static @method createState
 *
 * @return {Object} Player state
 */
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
/**
 * @static @method forSnapshot
 *
 * @param {HTMLElement|String} elm DOM Element ID or the DOM Element itself
 * @param {String} snapshot_url
 * @param {anm.Importer} importer
 * @param {Function} [callback]
 * @param {anm.Animation} callback.animation
 * @param {Object} [opts] see {@link anm.Player#init} for the description of possible options
 */
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

/**
 * @class anm.Animation
 *
 * @constructor
 */
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
            if (!this.bgfill instanceof Brush) this.bgfill = Brush.fill(this.bgfill);
            ctx.fillStyle = this.bgfill.apply(ctx);
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
        detector = new FontDetector();
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
    this.$data = null; // user data
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
    this.hx = 0; this.hy = 0; // shear by x / by y
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

    this.$reg = Element.DEFAULT_REG;   // registration point (static values)
    this.$pivot = Element.DEFAULT_PVT; // pivot (relative to dimensions)

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

    this.key = null;
    this.t = null;

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
// > Element.path % ([value: Path]) => Path | Element
Element.prototype.path = function(value) {
    if (value) {
        this.type = C.ET_PATH;
        this.$path = value;
        return this;
    } else return this.$path;
}
// > Element.text % ([value: Text]) => Text | Element
Element.prototype.text = function(value) {
    if (value) {
        this.type = C.ET_TEXT;
        this.$text = value;
        return this;
    } else return this.$text;
}
// > Element.image % ([value: Sheet]) => Sheet | Element
Element.prototype.image = function(value) {
    if (value) {
        this.type = C.ET_SHEET;
        this.$image = value;
        return this;
    } else return this.$image;
}
// > Element.sheet % ([value: Sheet]) => Sheet | Element
Element.prototype.sheet = Element.prototype.image;
// > Element.fill % ([value: Brush | String]) => Brush | Element
Element.prototype.fill = function(value) {
    if (value) {
        this.$fill = (value instanceof Brush) ? value : Brush.fill(value);
        return this;
    } else return this.$fill;
}
// > Element.noFill % () => Element
Element.prototype.noFill = function() {
    this.$fill = Color.TRANSPARENT;
    return this;
}
// > Element.stroke % ([value: Brush | String] | [color: String, width: int]) => Brush | Element
Element.prototype.stroke = function(value, width) {
    if (value) {
        this.$stroke = (value instanceof Brush) ? value : Brush.stroke(value, width);
        return this;
    } else return this.$stroke;
}
// > Element.noStroke % () => Element
Element.prototype.noStroke = function() {
    this.$stroke = null;
    return this;
}
// > Element.prepare % () => Boolean
Element.prototype.prepare = function() {
    this.matrix.reset();
    return true;
}
// > Element.modifiers % (ltime: Float, dt: Float[, types: Array]) => Boolean
Element.prototype.modifiers = function(ltime, dt, types) {
    var elm = this;
    var order = types || Modifier.ALL_MODIFIERS;

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
        if (typed_modifiers) {

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

        }

        elm.__mafter(ltime, type, true);
    } // for each type

    elm.__modifying = null;

    elm.__appliedAt = ltime;

    elm.resetEvents();

    return true;
}
// > Element.painters % (ctx: Context[, types: Array]) => Boolean
Element.prototype.painters = function(ctx, types) {
    var elm = this;
    var order = types || Painter.ALL_PAINTERS;

    var painters = this.$painters;
    var type, typed_painters, painter;
    for (var i = 0, il = order.length; i < il; i++) { // for each type
        type = order[i];

        elm.__painting = type;
        elm.__pbefore(ctx, type);

        typed_painters = painters[type];
        if (typed_painters) {
            for (var j = 0, jl = typed_painters.length; j < jl; j++) {
                painter = typed_painters[j];
                painter.call(elm, ctx);
            }
        }

        elm.__pafter(ctx, type);
    } // for each type

    elm.__painting = null;
}
// > Element.forAllModifiers % (fn: Function(Modifier, type))
Element.prototype.forAllModifiers = function(f) {
    var order = Modifier.ALL_MODIFIERS;
    var modifiers = this.$modifiers;
    var type, typed_modifiers, modifier;
    for (var i = 0, il = order.length; i < il; i++) { // for each type
        type = order[i];

        typed_modifiers = modifiers[type];
        if (typed_modifiers) {
            for (var j = 0, jl = typed_modifiers.length; j < jl; j++) {
                f(typed_modifiers[j], type);
            }
        }

    }
}
// > Element.forAllPainters % (fn: Function(Painter, type))
Element.prototype.forAllPainters = function(f) {
    var order = Painter.ALL_PAINTERS;
    var painters = this.$painters;
    var type, typed_painters, painter;
    for (var i = 0, il = order.length; i < il; i++) { // for each type
        type = order[i];
        typed_painters = painters[type];
        if (typed_painters) {
            for (var j = 0, jl = typed_painters.length; j < jl; j++) {
                f(typed_painters[j], type);
            }
        }
    }
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
                this.painters(ctx);
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
Element.prototype.pivot = function(x, y) {
    this.$pivot = [ x, y ];
    return this;
}
Element.prototype.reg = function(x, y) {
    this.$reg = [ x, y ];
    return this;
}
Element.prototype.move = function(x, y) {
    this.x = x;
    this.y = y;
    return this;
}
Element.prototype.rotate = function(angle) {
    this.angle = angle;
    return this;
}
Element.prototype.rotateInDeg = function(angle) {
    return this.rotate(angle / 180 * Math.PI);
}
Element.prototype.scale = function(sx, sy) {
    this.sx = sx;
    this.sy = sy;
    return this;
}
Element.prototype.skew = function(hx, hy) {
    this.hx = hx;
    this.hy = hy;
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
    if (!modifier) throw new AnimErr('No modifier was passed to .modify() method');
    if (!__modifier(modifier) && __fun(modifier)) {
        modifier = new Modifier(modifier, C.MOD_USER);
    } else if (!__modifier(modifier)) {
        throw new AnimErr('Modifier should be either a function or a Modifier instance');
    }
    if (!modifier.type) throw new AnimErr('Modifier should have a type defined');
    if (band) modifier.$band = band;
    if (modifier.__applied_to &&
        modifier.__applied_to[this.id]) throw new AnimErr('This modifier is already applied to this Element');
    if (!this.$modifiers[modifier.type]) this.$modifiers[modifier.type] = [];
    this.$modifiers[modifier.type].push(modifier);
    this.__modifiers_hash[modifier.id] = modifier;
    if (!modifier.__applied_to) modifier.__applied_to = {};
    modifier.__applied_to[this.id] = this.$modifiers[modifier.type].length; // the index in the array by type + 1 (so 0 means not applied)
    return this;
}
// > Element.removeModifier % (modifier: Function)
Element.prototype.removeModifier = function(modifier) {
    if (!__modifier(modifier)) throw new AnimErr('Please pass Modifier instance to removeModifier');
    if (!this.__modifiers_hash[modifier.id]) throw new AnimErr('Modifier wasn\'t applied to this element');
    if (!modifier.__applied_to || !modifier.__applied_to[this.id]) throw new AnimErr(Errors.A.MODIFIER_NOT_ATTACHED);
    //if (this.__modifying) throw new AnimErr("Can't remove modifiers while modifying");
    delete this.__modifiers_hash[modifier.id];
    delete this.$modifiers[modifier.type].splice(modifier.__applied_to[this.id] - 1, 1); // delete by index
    delete modifier.__applied_to[this.id];
    return this;
}
// > Element.paint % (painter: Function(ctx: Context,
//                                           data: Any,
//                                           t: Float,
//                                           dt: Float)
//                                  | Painter)
//                         => Integer
Element.prototype.paint = function(painter) {
    if (!painter) throw new AnimErr('No painter was passed to .paint() method');
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
    painter.__applied_to[this.id] = this.$painters[painter.type].length; // the index in the array by type + 1 (so 0 means not applied)
    return this;
}
// > Element.removePainter % (painter: Function | Painter)
Element.prototype.removePainter = function(painter) {
    if (!__painter(painter)) throw new AnimErr('Please pass Painter instance to removePainter');
    if (!this.__painters_hash[painter.id]) throw new AnimErr('Painter wasn\'t applied to this element');
    if (!painter.__applied_to || !painter.__applied_to[this.id]) throw new AnimErr(Errors.A.PAINTER_NOT_ATTACHED);
    //if (this.__modifying) throw new AnimErr("Can't remove modifiers while modifying");
    delete this.__painters_hash[painter.id];
    delete this.$painters[painter.type].splice(painter.__applied_to[this.id] - 1, 1); // delete by index
    delete painter.__applied_to[this.id];
    return this;
}
// > Element.tween % (tween: Tween)
Element.prototype.tween = function(tween) {
    if (!__tween(tween)) throw new AnimErr('Please pass Tween instance to .tween() method');
    tween.is_tween = true;
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
        for (var ei = 0, el = elms.length; ei < el; ei++) {
            this._addChild(elms[ei]);
        }
    } else { // element object mode
        this._addChild(arg1);
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
Element.prototype.band = function(band) {
    if (!__defined(start)) return this.lband;
    // FIXME: array bands should not pass
    // if (__arr(start)) throw new AnimErr('Band is specified with two numbers, not an array');
    if (__arr(start)) {
        stop = start[1];
        start = start[0];
    }
    if (!__defined(stop)) { stop = Infinity; }
    this.lband = [ start, stop ];
    if (this.parent) {
        var parent = this.parent;
        this.gband = [ parent.gband[0] + start, parent.gband[0] + stop ];
    }
    return this;
}
// > Element.duration % () -> Float
Element.prototype.duration = function(value) {
    if (!__defined(value)) return this.lband[1] - this.lband[0];
    this.gband = [ this.gband[0], this.gband[0] + value ];
    this.lband = [ this.lband[0], this.lband[0] + value ];
    return this;
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
    // if positions were set before loading a scene, we don't need to reset them
    //this.resetState();
    this.resetEvents();
    this.__resetTimeFlags();
    /*this.__clearEvtState();*/
    var elm = this;
    this.forAllModifiers(function(modifier) {
        if (modifier.__wasCalled) modifier.__wasCalled[elm.id] = false;
        if (__defined(modifier.__wasCalledAt)) modifier.__wasCalledAt[elm.id] = -1;
    });
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
              this.modifiers(t, 0, Element.NOEVT_MODIFIERS) // returns true if succeeded
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
Element.prototype.invalidate = function() {
    //this._dimen = null;
    //TODO: replace with this['$' + this.type].invalidate() ?
    var subj = this.$path || this.$text || this.$image;
    if (subj) subj.invalidate();
}
Element.prototype.dimen = function() {
    // _dimen value is not cached, it's just a user object allowing
    // to set custom dimensions (though may be we also need to cache
    // dimensions not relative to type)
    if (this._dimen) return this._dimen;
    var subj = this.$path || this.$text || this.$image;
    if (subj) return subj.dimen();
}
Element.prototype.bounds = function() {
    if (this._bounds) return this._bounds;
    var subj = this.$path || this.$text || this.$image;
    if (subj) return (this._bounds = subj.bounds());
}
Element.prototype.boundsRect = function() {
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
  if (!__defined(val)) return this.$data;
  this.$data = val;
  return this;
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
    clone.$modifiers = {};
    this.forAllModifiers(function(modifier, type) {
        clone.modify(modifier);
    });
    clone.$painters = {};
    this.forAllPainters(function(painter, type) {
        clone.paint(painter);
    });
    clone.__u_data = utils.obj_clone(this.__u_data);
    return clone;
}
Element.prototype._addChild = function(elm) {
    elm.parent = this;
    elm.level = this.level + 1;
    this.children.push(elm); /* or add elem.id? */
    if (this.anim) this.anim._register(elm); /* TODO: rollback parent and child? */
    Bands.recalc(this);
}
Element.prototype._stateStr = function() {
    return "x: " + this.x + " y: " + this.y + '\n' +
           "sx: " + this.sx + " sy: " + this.sy + '\n' +
           "angle: " + this.angle + " alpha: " + this.alpha + '\n' +
           "p: " + this.p + " t: " + this.t + " key: " + this.key + '\n';
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

    // gets element local time (relative to its local band) and
    // returns modifier local time (relative to its local band)

    // TODO: move to modifier class?

    var elm = this,
        elm_duration = elm.lband[1] - elm.lband[0], // duration of the element's local band
        mod_easing = modifier.$easing, // modifier easing
        mod_time = modifier.$band || modifier.$time, // time (or band) of the modifier, if set
        mod_relative = modifier.relative, // is modifier time or band relative to elm duration or not
        mod_is_tween = modifier.is_tween; // should time be passed in relative time or not

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
    if (mod_relative || mod_is_tween) {
        // tweens and relative modifiers should receive relative time inside
        if (__finite(res_duration)) {
            res_time = __adjust(res_time) / __adjust(res_duration);
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
    t = (__defined(this.p)) ? this.p : null;
    t = ((t === null) && (this.t !== null) && __finite(duration))
        ? this.t * duration
        : t;
    t = ((t === null) && (__defined(this.key)))
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
    if (__defined(this.__lastJump)) {
       /* return (jump_pos + (t - jumped_at)) */
       return (__finite(this.__lastJump[1])
                      ? this.__lastJump[1] : 0) + (t - this.__lastJump[0]);
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
    trg.$reg = [].concat(src.$reg); trg.$pivot = [].concat(src.$pivot);
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
    func.$data = null;
    func.$band = func.$band || null; // either band or time is specified
    func.$time = __defined(func.$time) ? func.$time : null; // either band or time is specified
    func.$easing = func.$easing || null;
    func.relative = __defined(func.relative) ? func.relative : false; // is time or band are specified relatively to element
    func.is_tween = (func.is_tween || (func.type == C.MOD_TWEEN) || false); // should modifier receive relative time or not (like tweens)
    // TODO: may these properties interfere with something? they are assigned to function instances
    anm.registerAsModifier(func);
    func.band = function(start, stop) { if (!__defined(start)) return func.$band;
                                        // FIXME: array bands should not pass
                                        // if (__arr(start)) throw new AnimErr('Band is specified with two numbers, not an array');
                                        if (__arr(start)) {
                                            stop = start[1];
                                            start = start[0];
                                        }
                                        if (!__defined(stop)) { stop = Infinity; }
                                        func.$band = [ start, stop ];
                                        return func; }
    func.time = function(value) { if (!__defined(value)) return func.$time;
                                  func.$time = value;
                                  return func; }
    func.easing = function(f, data) { if (!f) return func.$easing;
                                      func.$easing = Element.__convertEasing(f, data,
                                                     func.relative || func.is_tween);
                                      return func; }
    func.data = function(data) { if (!__defined(data)) return func.$data;
                                 func.$data = data;
                                 return func; }
    return func;
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
    anm.registerAsPainter(func);
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

    var importer = importer || anm.importers.create('animatron');

    var url_with_params = url.split('?'),
        url = url_with_params[0],
        url_params = url_with_params[1], // TODO: validate them?
        params = (url_params && url_params.length > 0) ? utils.paramsToObj(url_params) : {},
        options = Player._optsFromUrlParams(params);

    if (options) {
        player._addOpts(options);
        player._checkOpts();
    }

    var failure = player.__defAsyncSafe(function(err) {
        throw new SysErr(utils.strf(Errors.P.SNAPSHOT_LOADING_FAILED,
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
function __r_with_ribbons(ctx, pw, ph, aw, ah, color, draw_f) {
    // pw == player width, ph == player height
    // aw == anim width,   ah == anim height
    var f_rects   = __fit_rects(pw, ph, aw, ah),
        factor    = f_rects[0],
        anim_rect = f_rects[1],
        rect1     = f_rects[2],
        rect2     = f_rects[3];
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
function __fit_rects(pw, ph, aw, ah) {
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
    var reg = this.$reg;
    if ((reg[0] === 0) && (reg[1] === 0)) return;
    ctx.translate(-reg[0], -reg[1]);
}, C.PNT_SYSTEM);

Render.p_usePivot = new Painter(function(ctx) {
    var pivot = this.$pivot;
    if ((pivot[0] === 0) && (pivot[1] === 0)) return;
    var dimen = this.dimen();
    if (!dimen) return;
    ctx.translate(-(pivot[0] * dimen[0]),
                  -(pivot[1] * dimen[1]));
}, C.PNT_SYSTEM);

Render.p_drawVisuals = new Painter(function(ctx) {
    var subj = this.$path || this.$text || this.$image;
    if (!subj) return;

    ctx.save();
    // FIXME: split into p_applyBrush and p_drawVisuals,
    //        so user will be able to use brushes with
    //        his own painters
    if (this.$fill)   { this.$fill.apply(ctx);   } else { Brush.clearFill(ctx);   };
    if (this.$stroke) { this.$stroke.apply(ctx); } else { Brush.clearStroke(ctx); };
    if (this.$shadow) { this.$shadow.apply(ctx); } else { Brush.clearShadow(ctx); };
    subj.apply(ctx);
    ctx.restore();
}, C.PNT_SYSTEM);

Render.p_applyAComp = new Painter(function(ctx) {
    if (this.composite_op) ctx.globalCompositeOperation = C.AC_NAMES[this.composite_op];
}, C.PNT_SYSTEM);

// DEBUG PAINTERS

Render.p_drawPivot = new Painter(function(ctx, pivot) {
    if (!(pivot = pivot || this.$pivot)) return;
    var dimen = this.dimen() || [ 0, 0 ];
    var stokeStyle = dimen ? '#600' : '#f00';
    ctx.save();
    ctx.translate(pivot[0] * dimen[0],
                  pivot[1] * dimen[1]);
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
    if (!(reg = reg || this.$reg)) return;
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
    Brush.qstroke(ctx, '#600', 2.0);
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

function Tween(tween_type, data) {
    if (!tween_type) throw new Error('Tween type is required to be specified or function passed');
    var func;
    if (__fun(tween_type)) {
        func = tween_type;
    } else {
        func = Tweens[tween_type](data);
        func.tween = tween_type;
    }
    func.is_tween = true;
    var mod = Modifier(func, C.MOD_TWEEN);
    mod.$data = data;
    mod.data = Tween.__data_block_fn; // FIXME
    return mod;
}
Tween.__data_block_fn = function() { throw new AnimErr("Data should be passed to tween in a constructor"); };

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
        var interp_func = interpolateBrushes(data[0], data[1]);
        return function(t, dt, duration) {
            this.$fill = interp_func(t);
        }
    };
Tweens[C.T_STROKE] =
    function(data) {
        var interp_func = interpolateBrushes(data[0], data[1]);
        return function (t, dt, duration) {
            this.$stroke = interp_func(t);
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
    // ctx.closePath();
    ctx.fill();
    ctx.stroke();
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
    // FIXME: cache bounds and dimen, reset on invalidate
    var bounds = this.bounds();
    return [ bounds[2] - bounds[0], bounds[3] - bounds[1] ];
}
Path.prototype.boundsRect = function() {
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
Path.prototype.invalidate = function() { }
Path.prototype.reset = function() {
    this.segs = [];
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
        var posstr = utils.collect_to(path, pos, ' ');
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
Text.prototype.invalidate = function() { }
Text.prototype.reset = function() { }
Text.prototype.dispose = function() { }

// Brush
// -----------------------------------------------------------------------------

//a set of functions for parsing, converting and intepolating color values
var Color = {};
Color.TRANSPARENT  = 'transparent';
// TODO: Color.RED, Color.BLUE, ....
Color.HEX_RE       = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i;
Color.HEX_SHORT_RE = /^#?([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])$/i;
Color.RGB_RE       = /^rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i;
Color.RGBA_RE      = /^rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*(\d*[.]?\d+)\s*\)$/i;
Color.HSL_RE       = /^hsl\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*%\s*,\s*([0-9]{1,3})\s*%\s*\)$/i;
Color.HSLA_RE      = /^hsla\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*%\s*,\s*([0-9]{1,3})\s*%\s*,\s*(\d*[.]?\d+)\s*\)$/i;
Color.from = function(test) {
    return __str(test) ? Color.fromStr(test) : (test.r && test);
};
Color.fromStr = function(str) {
    return Color.fromHex(str)
        || Color.fromRgb(str)
        || Color.fromRgba(str)
        || Color.fromHsl(str)
        || { r: 0, g: 0, b: 0, a: 0};
};
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
Color.fromHslVal = function(hue, sat, light) {
    var hueToRgb = Color.hueToRgb;
    var t2;
    if (light <= 0.5) {
        t2 = light * (sat + 1);
    } else {
        t2 = light + sat - (light * sat);
    }
    var t1 = light * 2 - t2;
    return { r: hueToRgb(t1, t2, hue + 2),
             g: hueToRgb(t1, t2, hue),
             b: hueToRgb(t1, t2, hue - 2),
             a: 1 };

};
Color.fromHsl = function(hsl) {
    return null;
    if (hsl.indexOf('hsl(') !== 0) return null;
    var result = Color.HSL_RE.exec(hsl);
    return result ? Color.fromHslVal(
        parseInt(result[1]) / 180 * Math.PI,
        parseInt(result[2]) / 100,
        parseInt(result[3]) / 100
    ) : null;
};
Color.fromHsla = function(hsla) {
    if (hsla.indexOf('hsla(') !== 0) return null;
    var result = Color.HSLA_RE.exec(hsl);
    if (!result) return null;
    result = Color.fromHslVal(
        parseInt(result[1]) / 180 * Math.PI,
        parseInt(result[2]) / 100,
        parseInt(result[3]) / 100
    );
    result.a = parseFloat(result[4]);
    return result;
};
Color.hueToRgb = function(t1, t2, hue) {
    if (hue < 0) hue += 6;
    if (hue >= 6) hue -= 6;
    if (hue < 1) return (t2 - t1) * hue + t1;
    else if (hue < 3) return t2;
    else if (hue < 4) return (t2 - t1) * (4 - hue) + t1;
    else return t1;
};
Color.rgb = function(r, g, b) {
    return 'rgb(' + (r * 255) + ',' + (g * 255) + ',' + (b * 255) + ')';
};
Color.rgba = function(r, g, b, a) {
    return 'rgba(' + (r * 255) + ',' + (g * 255) + ',' + (b * 255) + ','
                               + (__defined(a) ? a.toFixed(2) : 1.0) + ')';
};
Color.hsl = function(h, s, l) {
    return Color.dhsl(h / Math.PI * 180, s, l);
};
Color.dhsl = function(dh, s, l) {
    return 'hsl(' + Math.floor(dh) + ',' +
                    Math.floor(s * 100) + '%,' +
                    Math.floor(l * 100) + '%)';
};
Color.hsla = function(h, s, l, a) {
    return Color.dhsla(h / Math.PI * 180, s, l, a);
};
Color.dhsla = function(dh, s, l, a) {
    return 'hsla('+ Math.floor(dh) + ',' +
                    Math.floor(s * 100) + '%,' +
                    Math.floor(l * 100) + '%,' +
                    (__defined(a) ? a.toFixed(2) : 1.0) + ')';
};
Color.adapt = function(color) {
    if (!color) return null;
    if (__str(color)) return color;
    // "r" is reserved for gradients, so we test for "g" to be sure
    if (__defined(color.g)) return Color.toRgbaStr(color);
    if (__defined(color.h)) return Color.toHslaStr(color);
}
Color.toRgbaStr = function(color) {
    return Color.rgba(color.r,
                      color.g,
                      color.b,
                      color.a);
};
Color.toHslaStr = function(color) {
    return Color.hsla(color.h,
                      color.s,
                      color.l,
                      color.a);
};
Color.interpolate = function(c1, c2, t) {
    return {
        r: Math.round(utils.interpolateFloat(c1.r, c2.r, t)),
        g: Math.round(utils.interpolateFloat(c1.g, c2.g, t)),
        b: Math.round(utils.interpolateFloat(c1.b, c2.b, t)),
        a: utils.interpolateFloat(c1.a, c2.a, t)
    };
};


// Brush
// -----------------------------------------------------------------------------

// Brush format, general properties:
//
// everything below is parsed by Brush.value():
//
// '#ffaa0b'
// 'rgb(255,170,11)'
// 'rgba(255,170,11,0.8)'
// 'hsl(120, 50%, 100%)'
// 'hsla(120, 50%, 100%,0.8)'
// { r: 255, g: 170, b: 11 }
// { r: 255, g: 170, b: 11, a: 0.8 }
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

function Brush() {
    this.type = C.BT_NONE;
}
Brush.DEFAULT_CAP = C.PC_ROUND;
Brush.DEFAULT_JOIN = C.PC_ROUND;
Brush.DEFAULT_FILL = '#ffbc05';
Brush.DEFAULT_STROKE = Color.TRANSPARENT;
Brush.DEFAULT_SHADOW = Color.TRANSPARENT;
C.BT_NONE = 'none';
C.BT_FILL = 'fill';
C.BT_STROKE = 'stroke';
C.BT_SHADOW = 'shadow';
Brush.prototype.apply = function(ctx) {
    if (this.type == C.BT_NONE) return;
    var style = this._style || (this._style = this.adapt(ctx));
    if (this.type == C.BT_FILL) {
        ctx.fillStyle = style;
    } else if (this.type == C.BT_STROKE) {
        ctx.lineWidth = this.width || 0;
        ctx.strokeStyle = style || Brush.DEFAULT_STROKE;
        ctx.lineCap = this.cap || Brush.DEFAULT_CAP;
        ctx.lineJoin = this.join || Brush.DEFAULT_JOIN;
        // TODO: mitter
    } else if (this.type == C.BT_SHADOW) {
        if ($conf.doNotRenderShadows) return;
        var props = $engine.getAnmProps(ctx);
        if (props.skip_shadows) return;
        ctx.shadowColor = style;
        ctx.shadowBlur = this.blurRadius || 0;
        ctx.shadowOffsetX = this.offsetX || 0;
        ctx.shadowOffsetY = this.offsetY || 0;
    }
}
Brush.prototype.invalidate = function() {
    //this.type = C.BT_NONE;
    this._converted = false;
    this._style = null;
}
Brush.prototype.convertColorsToRgba = function() {
    if (this._converted) return;
    if (this.color && __str(this.color)) {
        this.color = Color.fromStr(this.color);
    } else if (this.grad) {
        var stops = this.grad.stops;
        for (var i = 0, il = stops.length; i < il; i++) {
            if (__str(stops[i][1])) {
                stops[i][1] = Color.from(stops[i][1]);
            }
        }
    }
    this._converted = true;
}
// create canvas-compatible style from brush
Brush.prototype.adapt = function(ctx) {
    if (this.color && __str(this.color)) return this.color;
    if (this.color) return Color.toRgbaStr(this.color);
    if (this.grad) {
        var src = this.grad,
            stops = src.stops,
            dir = src.dir,
            r = src.r;
            bounds = src.bounds;
        var grad;
        if (__defined(src.r)) {
            grad = bounds
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
        } else {
            grad = bounds
                ? ctx.createLinearGradient(
                                bounds[0] + dir[0][0] * bounds[2], // b.x + x0 * b.width
                                bounds[1] + dir[0][1] * bounds[3], // b.y + y0 * b.height
                                bounds[0] + dir[1][0] * bounds[2], // b.x + x1 * b.width
                                bounds[1] + dir[1][1] * bounds[3]) // b.y + y1 * b.height
                : ctx.createLinearGradient(
                                dir[0][0], dir[0][1],  // x0, y0
                                dir[1][0], dir[1][1]); // x1, y1
        }
        for (var i = 0, slen = stops.length; i < slen; i++) {
            var stop = stops[i];
            grad.addColorStop(stop[0], Color.adapt(stop[1]));
        }
        return grad;
    }
    return null;
}
Brush.prototype.clone = function()  {
    var src = this,
        trg = new Brush();
    trg.type = src.type;
    if (src.color && is_str(src.color)) { trg.color = src.color; }
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
    return trg;
}
Brush.fill = function(value) {
    var brush = new Brush();
    brush.type = C.BT_FILL;
    if (__obj(value) && value.stops) {
        brush.grad = value;
    } else {
        brush.color = value;
    }
    return brush;
}
Brush.stroke = function(color, width, cap, join, mitter) {
    var brush = Brush.fill(color);
    brush.type = C.BT_STROKE;
    brush.width = width || 0;
    brush.cap = cap || Brush.DEFAULT_CAP;
    brush.join = join || Brush.DEFAULT_JOIN;
    brush.mitter = mitter;
    return brush;
}
Brush.shadow = function(color, blurRadius, offsetX, offsetY) {
    var brush = Brush.fill(color);
    brush.type = C.BT_SHADOW;
    brush.blurRadius = blurRadius || 0;
    brush.offsetX = offsetX || 0;
    brush.offsetY = offsetY || 0;
    return brush;
}
Brush.value = function(value) {
    var brush = new Brush();
    if (!value) {
        brush.type = C.BT_NONE;
    } else if (__str(value)) {
        brush.type = C.BT_FILL;
        brush.color = value;
    } else if (__obj(value)) {
        if (__defined(value.r) && __defined(value.g) && __defined(value.b)) {
            brush.type = C.BT_FILL;
            brush.color = value;
        } else if (value.color || value.grad) {
            if (__defined(value.width)) {
                brush.type = C.BT_STROKE;
            } else if (__defined(value.blurRadius) ||
                       __defined(value.offsetX)) {
                brush.type = C.BT_SHADOW;
            } else {
                brush.type = C.BT_FILL;
            }
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    brush[key] = value[key];
                }
            }
        } else throw new AnimErr('Unknown type of brush');
    } else throw new AnimErr('Use Brush.fill, Brush.stroke or Brush.shadow to create brush from values');
}
Brush.qfill = function(ctx, color) {
    ctx.fillStyle = color;
}
Brush.qstroke = function(ctx, color, width) {
    ctx.lineWidth = width || 1;
    ctx.strokeStyle = color;
    ctx.lineCap = Brush.DEFAULT_CAP;
    ctx.lineJoin = Brush.DEFAULT_JOIN;
}
Brush.clearFill = function(ctx) {
    ctx.fillStyle = Brush.DEFAULT_FILL;
}
Brush.clearStroke = function(ctx) {
    ctx.strokeStyle = Brush.DEFAULT_STROKE;
    ctx.lineWidth = 0;
    ctx.lineCap = Brush.DEFAULT_CAP;
    ctx.lineJoin = Brush.DEFAULT_JOIN;
}
Brush.clearShadow = function(ctx) {
    ctx.shadowColor = Brush.DEFAULT_SHADOW;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function interpolateBrushes(from, to) {
    var from = (from instanceof Brush) ? from : Brush.value(from),
        to   = (to   instanceof Brush) ? to   : Brush.value(to);
    if (!from._converted) { from.convertColorsToRgba(); }
    if (!to._converted)   { to.convertColorsToRgba();   }
    var result = from.clone();
    return function(t) {
        if (__defined(from.width) && __defined(to.width)) { // from.type && to.type == C.BT_STROKE
            result.width = utils.interpolateFloat(from.width, to.width, t);
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
                trgg.dir[0] = utils.interpolateFloat(fromg.dir[i][0], tog.dir[i][0], t);
                trgg.dir[1] = utils.interpolateFloat(fromg.dir[i][1], tog.dir[i][1], t);
            };
            // stops
            if (!trgg.stops ||
                (trgg.stops.length !== fromg.stops.length)) trgg.stops = [];
            for (i = 0; i < fromg.stops.length; i++) {
                if (!trgg.stops[i]) trgg.stops[i] = [];
                trgg.stops[i][0] = utils.interpolateFloat(fromg.stops[i][0], tog.stops[i][0], t);
                trgg.stops[i][1] = Color.toRgbaStr(Color.interpolate(fromg.stops[i][1], tog.stops[i][1]), t);
            };
            // radius
            if (fromg.r) {
                if (!trgg.r) trgg.r = [];
                trgg.r[0] = utils.interpolateFloat(fromg.r[0], tog.r[0], t);
                trgg.r[1] = utils.interpolateFloat(fromg.r[1], tog.r[1], t);
            } else { trgg.r = null; }
        }
        result.invalidate();
        return result;
    }
}


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
            me._dimen = [ image.width, image.height ];
            me.ready = true; // this flag is for users of the Sheet class
            if (callback) callback.call(me, image);
        },
        function(err) { $log.error(err.srcElement || err.path, err.message || err);
                        me.ready = true;
                        me.wasError = true;
                        if (errback) errback.call(me, err); });
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
    ctx.drawImage(this._image, region[0], region[1],
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
Sheet.prototype.boundsRect = function() {
    // TODO: when using current_region, bounds will depend on that region
    throw new Error('Not Implemented. Why?');
}
Sheet.prototype.clone = function() {
    return new Sheet(this.src);
}
Sheet.prototype.invalidate = function() {
    this._cvs_cache = null;
}
Sheet.prototype.reset = function() { }
Sheet.prototype.dispose = function() {
    this._cvs_cache = null;
}
// TODO: detach, dispose canvas
var _Image = Sheet; // Image is the same thing as Sheet, with only one [1, 1] region
                    // it will be exported as `Image`, but renamed here not to confuse
                    // with browser Image object



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

return (function(anm) {

    function __createPlayer(elm, opts) { var p = new Player();
                                         p.init(elm, opts); return p; }
    function __findAndInitPotentialPlayers() {
        var matches = $engine.findPotentialPlayers();
        for (var i = 0, il = matches.length; i < il; i++) {
            __createPlayer(matches[i]);
        }
    }

    //registerGlobally('createPlayer', __createPlayer);

    /*anm.__js_pl_all = this;*/

    anm.createPlayer = __createPlayer;
    anm.findById = function(where, id) {
        var found = [];
        if (where.name == name) found.push(name);
        where.travelChildren(function(elm)  {
            if (elm.id == id) found.push(elm);
        });
        return found;
    }
    anm.findByName = function(where, name) {
        where.findByName(name);
    }

    anm._$ = __createPlayer;

    anm.Player = Player;
    anm.Animation = Animation; anm.Element = Element; anm.Clip = Clip;
    anm.Path = Path; anm.Text = Text; anm.Sheet = Sheet; anm.Image = _Image;
    anm.Modifier = Modifier; anm.Painter = Painter;
    anm.Brush = Brush; anm.interpolateBrushes = interpolateBrushes;
    anm.Color = Color;
    anm.Tweens = Tweens; anm.Tween = Tween; anm.Easing = Easing;
    anm.MSeg = MSeg; anm.LSeg = LSeg; anm.CSeg = CSeg;
    anm.Render = Render; anm.Bands = Bands;  // why Render and Bands classes are visible to pulic?
    anm.__dev = { 'strf': utils.strf,
                   'adjust': __adjust,
                   't_cmp': __t_cmp,
                   'TIME_PRECISION': TIME_PRECISION/*,
                   'Controls': Controls, 'Info': InfoBlock*/ };

    $engine.onDocReady(__findAndInitPotentialPlayers);
    return Player;

})(anm);
