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
// Module Definition
// -----------------------------------------------------------------------------

var C = require('./constants.js');

var utils = require('./utils.js'),
    is = utils.is,
    global_opts = require('./global_opts.js'),
    conf = require('./conf.js'),
    log = require('./log.js'),
    events = require('./events.js'),
    provideEvents = events.provideEvents;

var loc = require('./loc.js'),
    StrLoc = loc.Strings,
    ErrLoc = loc.Errors,
    errors = require('./errors.js');

var engine = require('engine'),
    resourceManager = require('./resource_manager.js'),
    playerManager = require('./player_manager.js');

var Loader = require('./loader.js'),
    Controls = require('./ui/controls.js');

var Animation = require('./animation/animation.js'),
    Element = require('./animation/element.js'),
    Render = require('./render.js'),
    Sheet = require('./graphics/sheet.js');


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
 * them before. If animation is loaded synchronously and it has some size specified in
 * any way, this doesn't changes a lot, since Player takes its size from these values.
 * But if animation is loaded asynhronously, a noticable value of time is spent on request,
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
 * To set thumbnail to show while animation loads or wasn't started, use {@link anm.Player#thumbnail}.
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
    this.muted = false;
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
                                 'drawStill': undefined, // undefined means 'auto',
                                 'audioEnabled': true,
                                 'audioGlobalVolume': 1.0,
                                 'imagesEnabled': true,
                                 'videoEnabled': true,
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
  * and act with caught errors basing on this way
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
    if (this.canvas || this.wrapper) errors.player(ErrLoc.P.INIT_TWICE);
    if (this.anim) errors.player(ErrLoc.P.INIT_AFTER_LOAD);
    this._initHandlers(); /* TODO: make automatic */
    this._prepare(elm);
    this._addOpts(Player.DEFAULT_CONFIGURATION);
    this._addOpts(engine.extractUserOptions(this.canvas));
    this._addOpts(engine.extractUserOptions(this.wrapper));
    try {
        if (window && window.frameElement) {
            this._addOpts(engine.extractUserOptions(window.frameElement));
        }
    } catch(e) {}
    this._addOpts(opts || {});
    this._postInit();
    this._checkOpts();
    /* TODO: if (this.canvas.hasAttribute('data-url')) */

    playerManager.fire(C.S_NEW_PLAYER, this);
    return this;
};

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
 * TODO
 *
 * @param {anm.Animation|Object} animation
 * @param {Number} [duration]
 * @param {anm.Importer} [importer]
 * @param {Function} [callback]
 * @param {anm.Animation} callback.animation The resulting {@link anm.Animation animation}, was it adapted with {@link anm.Importer importer} or not
 */
Player.prototype.load = function(arg1, arg2, arg3, arg4) {

    var player = this,
        state = player.state;

    if ((state.happens === C.PLAYING) ||
        (state.happens === C.PAUSED)) {
        errors.player(ErrLoc.P.COULD_NOT_LOAD_WHILE_PLAYING);
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
        log.info('Animation with ID=' + object.id + ' is already loaded in player, skipping the call');
        return;
    }

    var durationPassed = false;

    // FIXME: it is possible that importer constructor function will be passed
    //        as importer (it will have IMPORTER_ID property as a marker),
    //        since `anm.getImporter` name is not obvious;
    //        we can't let ourselves create an importer instance manually here,
    //        so it's considered a problem of naming.
    if ((arg2 && arg2.IMPORTER_ID) || (arg3 && arg3.IMPORTER_ID)) {
        errors.player(ErrLoc.P.IMPORTER_CONSTRUCTOR_PASSED);
    }

    if (is.fun(arg2)) { callback = arg2; } /* object, callback */
    else if (is.num(arg2) || !arg2) { /* object, duration[, ...] */
        if (is.num(arg2)) {
          duration = arg2;
          durationPassed = true;
        }
        if (is.obj(arg3)) { /* object, duration, importer[, callback] */
          importer = arg3; callback = arg4;
        } else if (is.fun(arg3)) { /* object, duration, callback */
          callback = arg3;
        }
    } else if (is.obj(arg2)) { /* object, importer[, ...] */
        importer = arg2;
        callback = arg3;
    }

    if ((player.loadingMode == C.LM_ONPLAY) &&
        !player._playLock) { // if play lock is set, we should just load an animation normally, since
                             // it was requested after the call to 'play', or else it was called by user
                             // FIXME: may be playLock was set by player and user calls this method
                             //        while some animation is already loading
        if (player._postponedLoad) errors.player(ErrLoc.P.LOAD_WAS_ALREADY_POSTPONED);
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
        errors.player(ErrLoc.P.NO_ANIMATION_PASSED);
    }

    if (!player.__canvasPrepared) errors.player(ErrLoc.P.CANVAS_NOT_PREPARED);

    player._reset();

    state.happens = C.LOADING;
    player.fire(C.S_CHANGE_STATE, C.LOADING);

    var whenDone = function(result) {
        var anim = player.anim;
        if (player.handleEvents) {
            // checks inside if was already subscribed before, skips if so
            player.__subscribeDynamicEvents(anim);
        }
        var remotes = anim._collectRemoteResources(player);
        if (!remotes.length) {
            player.playedOnce = false;
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
            resourceManager.subscribe(player.id, remotes, [ player.__defAsyncSafe(
                function(res_results, err_count) {
                    //if (err_count) errors.animation(ErrLoc.A.RESOURCES_FAILED_TO_LOAD);
                    if (player.anim === result) { // avoid race condition when there were two requests
                        // to load different animations and first one finished loading
                        // after the second one
                        player.playedOnce = false;
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
            ) ], (player.controlsEnabled && player.controls) ? function(url, factor, progress, errors) {
                player.controls.loadingProgress = progress;
                player.controls.loadingErrors = errors;
            } : null);
            // actually start loading remote resources
            anim._loadRemoteResources(player);
        }

    };
    whenDone = player.__defAsyncSafe(whenDone);

    /* TODO: configure canvas using clips bounds? */

    if (player.anim) {
        player.__unsubscribeDynamicEvents(player.anim);
        player.anim.traverse(function(elm) {
            elm.removeMaskCanvases();
        });
    }

    if (object) {

        if (object instanceof Animation) { // Animation instance
            player._loadTarget = C.LT_ANIMATION;
            Loader.loadAnimation(player, object, whenDone);
        } else if (is.arr(object) || (object instanceof Element)) { // array of elements
            player._loadTarget = C.LT_ELEMENTS;
            Loader.loadElements(player, object, whenDone);
        } else if (is.str(object)) { // URL
            var controls = player.controls;
            player._loadTarget = C.LT_URL;
            player._loadSrc = object;
            Loader.loadFromUrl(player, object, importer, whenDone);
        } else { // any object with importer
            player._loadTarget = C.LT_IMPORT;
            Loader.loadFromObj(player, object, importer, whenDone);
        }

    } else {
        player._loadTarget = C.LT_ANIMATION;
        player.anim = new Animation();
        whenDone(player.anim);
    }

    if (durationPassed) { // FIXME: move to whenDone?
        player.anim.duration = duration;
    }

    return player;
}

var __nextFrame = engine.getRequestFrameFunc(),
    __stopAnim  = engine.getCancelFrameFunc();
/**
 * @method play
 * @chainable
 *
 * Start playing current {@link anm.Animation animation} from the very start, or, if specified, some given time.
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
        else errors.player(ErrLoc.P.ALREADY_PLAYING);
    }

    if ((player.loadingMode === C.LM_ONPLAY) && !player._lastReceivedAnimationId) {
        if (player._playLock) return; // we already loading something
        // use _postponedLoad with _playLock flag set
        // call play when loading was finished
        player._playLock = true;
        var loadArgs = player._postponedLoad,
            playArgs = arguments;
        if (!loadArgs) errors.player(ErrLoc.P.NO_LOAD_CALL_BEFORE_PLAY);
        var loadCallback = loadArgs[3];
        var afterLoad = function() {
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
    //__nextFrame = engine.getRequestFrameFunc();
    //__stopAnim = engine.getCancelFrameFunc();

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

    if (state.duration === undefined) ErrLoc. new PlayerError(ErrLoc.P.DURATION_IS_NOT_KNOWN);

    state.__startTime = Date.now();
    state.__redraws = 0;
    state.__rsec = 0;
    state.__prevt = 0;

    // this flags actually stops the animation,
    // __stopAnim is called just for safety reasons :)
    state.__supressFrames = false;

    if (state.happens === C.STOPPED && !player.repeating) {
        player.reportStats();
    }

    var ctx_props = engine.getAnmProps(player.ctx);
    ctx_props.factor = this.factor();

    state.happens = C.PLAYING;

    // FIXME: W3C says to call stopAnim (cancelAnimationFrame) with ID
    //        of the last call of nextFrame (requestAnimationFrame),
    //        not the first one, but some Mozilla / HTML5tutorials examples use ID
    //        of the first call. Anyway, __supressFrames stops our animation in fact,
    //        __stopAnim is called "to ensure", may be it's not a good way to ensure,
    //       though...
    state.__firstReq = Render.loop(player.ctx,
                                   player, anim,
                                   player.__beforeFrame(anim),
                                   player.__afterFrame(anim),
                                   player.__userBeforeRender,
                                   player.__userAfterRender);

    player.fire(C.S_CHANGE_STATE, C.PLAYING);
    player.fire(C.S_PLAY, state.from);

    return player;
};

/**
 * @method stop
 * @chainable
 *
 * Stop playing an {@link anm.Animation animation}.
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
        player.fire(C.S_CHANGE_STATE, C.STOPPED);
    } else if (state.happens !== C.ERROR) {
        state.happens = C.NOTHING;
        if (!player.controls) player._drawSplash();
        player.fire(C.S_CHANGE_STATE, C.NOTHING);
    }

    player.fire(C.S_STOP);

    if (anim) anim.reset();

    return player;
};

/**
 * @method pause
 * @chainable
 *
 * Pause the {@link anm.Animation animation}, if playing.
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
        errors.player(ErrLoc.P.PAUSING_WHEN_STOPPED);
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
};

/**
 * @method onerror
 *
 * Set a callback to be called on every error happened
 *
 * @param {Function} callback
 * @param {Error} callback.error
 */
Player.prototype.onerror = function(callback) {
    this.__err_handler = callback;

    return this;
};

// ### Inititalization
/* ------------------- */

provideEvents(Player, [ C.S_IMPORT, C.S_CHANGE_STATE, C.S_LOAD, C.S_RES_LOAD,
                        C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_COMPLETE, C.S_REPEAT,
                        C.S_ERROR ]);
Player.prototype._prepare = function(elm) {
    if (!elm) errors.player(ErrLoc.P.NO_WRAPPER_PASSED);
    var wrapper_id, wrapper;
    if (is.str(elm)) {
        wrapper_id = elm;
        wrapper = engine.getElementById(wrapper_id);
        if (!wrapper_id) errors.player(utils.strf(ErrLoc.P.NO_WRAPPER_WITH_ID, [wrapper_id]));
    } else {
        if (!elm.id) elm.id = ('anm-player-' + Player.__instances);
        wrapper_id = elm.id;
        wrapper = elm;
    }
    var assign_data = engine.assignPlayerToWrapper(wrapper, this, 'anm-player-' + Player.__instances);
    this.id = assign_data.id;
    this.wrapper = assign_data.wrapper;
    this.canvas = assign_data.canvas;
    if (!engine.checkPlayerCanvas(this.canvas)) errors.player(ErrLoc.P.CANVAS_NOT_VERIFIED);
    this.ctx = engine.getContext(this.canvas, '2d');
    this.state = Player.createState(this);
    this.fire(C.S_CHANGE_STATE, C.NOTHING);

    this.subscribeEvents(this.canvas);

    this.__canvasPrepared = true;
};

Player.prototype._addOpts = function(opts) {
    this.debug =    is.defined(opts.debug)    ? opts.debug    : this.debug;
    this.repeat =   is.defined(opts.repeat)   ? opts.repeat   : this.repeat;
    this.autoPlay = is.defined(opts.autoPlay) ? opts.autoPlay : this.autoPlay;

    this.zoom =    opts.zoom || this.zoom;
    this.speed =   opts.speed || this.speed;
    this.bgColor = opts.bgColor || this.bgColor;
    this.width = opts.width || this.width;
    this.height = opts.height || this.height;

    this.ribbonsColor =
                   opts.ribbonsColor || this.ribbonsColor;
    this.thumbnailSrc = opts.thumbnail || this.thumbnailSrc;

    this.loadingMode = is.defined(opts.loadingMode) ?
                        opts.loadingMode : this.loadingMode;
    this.audioEnabled = is.defined(opts.audioEnabled) ?
                        opts.audioEnabled : this.audioEnabled;
    this.globalAudioVolume = is.defined(opts.globalAudioVolume) ?
                        opts.globalAudioVolume : this.globalAudioVolume;
    this.imagesEnabled = is.defined(opts.imagesEnabled) ?
                        opts.imagesEnabled : this.imagesEnabled;
    this.videoEnabled = is.defined(opts.videoEnabled) ?
                        opts.videoEnabled : this.videoEnabled;
    this.shadowsEnabled = is.defined(opts.shadowsEnabled) ?
                        opts.shadowsEnabled : this.shadowsEnabled;
    this.controlsEnabled = is.defined(opts.controlsEnabled) ?
                        opts.controlsEnabled : this.controlsEnabled;
    this.infoEnabled = is.defined(opts.infoEnabled) ?
                        opts.infoEnabled : this.infoEnabled;
    this.handleEvents = is.defined(opts.handleEvents) ?
                        opts.handleEvents : this.handleEvents;
    this.drawStill = is.defined(opts.drawStill) ?
                        opts.drawStill : this.drawStill;
    this.infiniteDuration = is.defined(opts.infiniteDuration) ?
                        opts.infiniteDuration : this.infiniteDuration;
    this.forceAnimationSize = is.defined(opts.forceAnimationSize) ?
                        opts.forceAnimationSize : this.forceAnimationSize;
    this.muteErrors = is.defined(opts.muteErrors) ?
                        opts.muteErrors : this.muteErrors;

    if (is.defined(opts.mode)) { this.mode(opts.mode); }
}
Player.prototype._checkOpts = function() {
    if (!this.canvas) return;

    if (!this.width || !this.height) {
        var cvs_size = engine.getCanvasSize(this.canvas);
        this.width = cvs_size[0];
        this.height = cvs_size[1];
    }

    this._resize(this.width, this.height);

    if (this.bgColor) engine.setCanvasBackground(this.canvas, this.bgColor);

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
        var props = engine.getAnmProps(this.ctx);
        props.skip_shadows = !this.shadowsEnabled;
    }

    if (this.thumbnailSrc) this.thumbnail(this.thumbnailSrc);
};

// initial state of the player, called from constuctor
Player.prototype._postInit = function() {
    this.stop();
    /* TODO: load some default information into player */
    var to_load = engine.hasUrlToLoad(this.wrapper);
    if (!to_load.url) to_load = engine.hasUrlToLoad(this.canvas);
    if (to_load.url) {
        var importer = null;
        if (to_load.importer_id && anm.importers.isAccessible(to_load.importer_id)) {
            importer = anm.importers.create(to_load.importer_id);
        }
        this.load(to_load.url, importer);
    }
};

/**
 * @method mode
 * @chainable
 *
 * Set player mode. Since it splits mode to separate properties, this method doesn't work
 * as getter.
 *
 * @param {Number} val `C.M_*` constant
 */
Player.prototype.mode = function(val) {
    if (!is.defined(val)) { errors.player("Please define a mode to set"); }
    this.infiniteDuration = (val & C.M_INFINITE_DURATION) || undefined;
    this.handleEvents = (val & C.M_HANDLE_EVENTS) || undefined;
    this.controlsEnabled = (val & C.M_CONTROLS_ENABLED) || undefined;
    this.infoEnabled = (val & C.M_INFO_ENABLED) || undefined;
    this.drawStill = (val & C.M_DRAW_STILL) || undefined;
    return this;
};

/**
 * @method rect
 * @chainable
 *
 * Get or change the rectangle Player owns at a page.
 *
 * @param {Object} [rect]
 * @param {Number} rect.x
 * @param {Number} rect.y
 * @param {Number} rect.width
 * @param {Number} rect.height
 *
 * @return {Object|anm.Player}
 */
Player.prototype.rect = function(rect) {
    if (!rect) return { x: this.x, y: this.y,
                        width: this.width, height: this.height };
    this.x = rect.x; this.y = rect.y;
    this.width = rect.width; this.height = rect.height;
    this._moveTo(rect.x, rect.y);
    this._resize(rect.width, rect.height);
    return this;
};

/* Player.prototype._rectChanged = function(rect) {
    var cur_w = this.state.width,
        cur_h = this.state.height;
    return (cur_w != rect.width) || (cur_w != rect.height) ||
           (cur.x != rect.x) || (cur.y != rect.y);
} */
/**
 * @method forceRedraw
 *
 * Force player to redraw controls and visuals according to current state
 */
Player.prototype.forceRedraw = function() {
    switch (this.state.happens) {
        case C.STOPPED: this.stop(); break;
        case C.PAUSED: if (this.anim) this.drawAt(this.state.time); break;
        case C.PLAYING: if (this.anim) { this._stopAndContinue(); } break;
        case C.NOTHING: if (!this.controls) this._drawSplash(); break;
        //case C.LOADING: case C.RES_LOADING: this._drawSplash(); break;
        //case C.ERROR: this._drawErrorSplash(); break;
    }
};

/**
 * @method drawAt
 *
 * Draw current {@link anm.Animation animation} at specified time
 *
 * @param {Number} time
 */
Player.prototype.drawAt = function(time) {
    if (time === Player.NO_TIME) errors.player(ErrLoc.P.PASSED_TIME_VALUE_IS_NO_TIME);
    if ((this.state.happens === C.RES_LOADING) &&
        (this.loadingMode === C.LM_ONREQUEST)) { this._postpone('drawAt', arguments);
                                                   return; } // if player loads remote resources just now,
                                                             // postpone this task and exit. postponed tasks
                                                             // will be called when all remote resources were
                                                             // finished loading
    if ((time < 0) || (time > this.anim.duration)) {
        errors.player(utils.strf(ErrLoc.P.PASSED_TIME_NOT_IN_RANGE, [time]));
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

    var ctx_props = engine.getAnmProps(this.ctx);
    ctx_props.factor = this.factor();

    anim.__informEnabled = false;
    Render.at(time, 0, this.ctx, this.anim, this.width, this.height, this.zoom, this.ribbonsColor, u_before, u_after);
    return this;
};

/**
 * @method size
 * @chainable
 *
 * Get or set and override Player width and height manually
 *
 * @param {Number} [width]
 * @param {Number} [height]
 *
 * @return {anm.Element|Array} width / height or the Element
 **/
Player.prototype.size = function(width, height) {
    if (!is.defined(width)) return [ this.width, this.height ];
    this.__userSize = [ width, height ];
    this._resize();
    return this;
};

/**
 * @method factor
 *
 * Returns the difference factor between player size and animation size,
 * using fit by largest side. _Does not_ count scene zoom, since it does not
 * affect player size. Also, _does not_ count screen pixel ratio.
 *
 * @return {Number} factor factor in range `0..1` or `undefined` if animation is not initialized
 */
Player.prototype.factor = function() {
    if (!this.anim) return undefined;
    if ((this.anim.width === this.width) &&
        (this.anim.height === this.height)) {
            return 1; // this.zoom ?
    } else {
        return Math.min(this.width / this.anim.width,
                        this.height / this.anim.height);
    }
}
/**
 * @method factorData
 *
 * Returns the data about how player will be resize due to difference between
 * player size and animation size.
 *
 * @return {Object} factor data or `undefined` if animation is not initialized
 * @return {Number} return.factor factor in range `0..1`
 * @return {Array} return.anim_rect coordinates of the rect where animation will be rendered
 * @return {Array} return.ribbon_one coordinates of the rect where first ribbon will be places, or null if factor=1
 * @return {Array} return.ribbon_two coordinates of the rect where second ribbon will be places, or null if factor=1
 */
Player.prototype.factorData = function() {
    if (!this.anim) return undefined;
    var result = utils.fit_rects(this.width, this.height,
                                 this.anim.width, this.anim.height);
    return {
        factor: result[0],
        anim_rect: result[1],
        ribbon_one: result[2] || null,
        ribbon_two: result[3] || null
    }
}
/**
 * @method thumbnail
 *
 * Allows to set thumbnail for a player, so player will show this image during the process of
 * loading an animation and when there's no animation was loaded inside.
 *
 * ...It's optional to specify `target_width`/`target_height`, especially if aspect ratio
 * of animation(s) that will be loaded into player matches to aspect ratio of player itself.
 * If not, `target_width` and `target_height`, if specified, are recommended to be equal
 * to a size of an animation(s) that will be loaded into player with this thumbnail;
 * so, since animation will be received later, and if aspect ratios of animation and player
 * does not match, both thumbnail and the animation will be drawn at a same position
 * with same black ribbons applied;
 *
 * If size will not be specified, player will try to match aspect ratio of an image to
 * show it without stretches, so if thumbnail image size matches to animation size has
 * the same aspect ratio as an animation, it is also ok to omit the size data here
 *
 * @param {String} url
 * @param {Number} [target_width]
 * @param {Number} [target_height]
 */
Player.prototype.thumbnail = function(url, target_width, target_height) {
    if (!url) return this.thumbnailSrc;
    var player = this;
    if (player.__thumb &&
        player.__thumb.src == url) return;
    if (player.ctx) { // FIXME: make this a function
      var ratio = engine.PX_RATIO,
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
};

/**
 * @method detach
 *
 * Detach Player from the DOM — removes all the elements were create for
 * this Player instance.
 */
Player.prototype.detach = function() {
    if (!engine.playerAttachedTo(this.wrapper, this)) return; // throw error?
    this.stop();
    if (this.controls) this.controls.detach(this.wrapper);
    engine.detachPlayer(this);
    if (this.ctx) {
        engine.clearAnmProps(this.ctx);
    }
    this._reset();
    playerManager.fire(C.S_PLAYER_DETACH, this);
};

/**
 * @method attachedTo
 *
 * Check if this player was attached to a given element.
 *
 * @param {HTMLElement} canvas_or_wrapper
 */
Player.prototype.attachedTo = function(canvas_or_wrapper) {
    return engine.playerAttachedTo(canvas_or_wrapper, this);
};

/**
 * @method isAttached
 *
 * Check if player was attached to a DOM
 */
Player.prototype.isAttached = function() {
    return engine.playerAttachedTo(this.wrapper, this);
};

/**
 * @static @method attachedTo
 *
 * Check if this player was attached to a given element.
 *
 * @param {HTMLElement} canvas_or_wrapper
 * @param {anm.Player} player
 */
Player.attachedTo = function(canvas_or_wrapper, player) {
    return engine.playerAttachedTo(canvas_or_wrapper, player);
};

/**
 * @method invalidate
 *
 * Invalidates Player position in document
 */
Player.prototype.invalidate = function() {
    // TODO: probably, there's more to invalidate
    if (this.controls) this.controls.update(this.canvas);
};

Player.__invalidate = function(player) {
    return function(evt) {
        player.invalidate();
    };
};

/**
 * @method beforeFrame
 *
 * Call given function before rendering every frame during playing (when context was already modified for this frame)
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Boolean} callback.return
 */
// TODO: change to before/after for events?
Player.prototype.beforeFrame = function(callback) {
    if (this.state.happens === C.PLAYING) errors.player(ErrLoc.P.BEFOREFRAME_BEFORE_PLAY);
    this.__userBeforeFrame = callback;
};

/**
 * @method afterFrame
 *
 * Call given function after rendering every frame during playing (when context is still modified for this frame)
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Boolean} callback.return
 */
Player.prototype.afterFrame = function(callback) {
    if (this.state.happens === C.PLAYING) errors.player(ErrLoc.P.AFTERFRAME_BEFORE_PLAY);
    this.__userAfterFrame = callback;
};

/**
 * @method beforeRender
 *
 * Call given function before rendering every frame during playing (when context is not yet modified for this frame)
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Canvas2DContext} callback.ctx
 */
Player.prototype.beforeRender = function(callback) {
    if (this.state.happens === C.PLAYING) errors.player(ErrLoc.P.BEFORENDER_BEFORE_PLAY);
    this.__userBeforeRender = callback;
};

/**
 * @method afterRender
 *
 * Call given function after rendering every frame during playing (when context modications are rolled back)
 *
 * @param {Function} callback
 * @param {Number} callback.time
 * @param {Canvas2DContext} callback.ctx
 */
Player.prototype.afterRender = function(callback) {
    if (this.state.happens === C.PLAYING) errors.player(ErrLoc.P.AFTERRENDER_BEFORE_PLAY);
    this.__userAfterRender = callback;
};

/**
 * @method subscribeEvents
 * @private
 *
 * Subscribe all the required events for given canvas.
 *
 * @param {Canvas} canvas
 */
Player.prototype.subscribeEvents = function(canvas) {
    var doRedraw = Player.__invalidate(this);
    engine.subscribeWindowEvents({
        load: doRedraw
    });
    engine.subscribeCanvasEvents(canvas, {
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
};

/**
 * @method toggleMute
 *
 * Disable or enable sound
 */
Player.prototype.toggleMute = function() {
    this.muted = !this.muted;
    if (!this.anim) {
        return;
    }
    this.anim.traverse(function(el) {
        if(el.$audio) {
            el.$audio.toggleMute();
        }
    });
};

Player.prototype._drawEmpty = function() {
    var ctx = this.ctx,
        w = this.width,
        h = this.height;

    ctx.save();

    var ratio = engine.PX_RATIO;
    // FIXME: somehow scaling context by ratio here makes all look bad

    // background
    ctx.fillStyle = Player.EMPTY_BG;
    ctx.fillRect(0, 0, w * ratio, h * ratio);
    ctx.strokeStyle = Player.EMPTY_STROKE;
    ctx.lineWidth = Player.EMPTY_STROKE_WIDTH;
    ctx.strokeRect(0, 0, w * ratio, h * ratio);

    ctx.restore();
};

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
            if (!player.infiniteDuration && is.finite(anim.duration)) {
                player.drawAt(anim.duration * Player.PREVIEW_POS);
            } else {
                player.drawAt(state.from);
            }
        }
    } else {
        player._drawEmpty();
    }
};

// _drawThumbnail draws a prepared thumbnail image, which is set by user
Player.prototype._drawThumbnail = function() {
    var thumb_bounds  = this.__thumbSize || this.__thumb.bounds(),
        thumb_width   = thumb_bounds.width,
        thumb_height  = thumb_bounds.height,
        player_width  = this.width,
        player_height = this.height,
        px_ratio      = engine.PX_RATIO;
    var ctx = this.ctx;
    ctx.save();
    if (px_ratio != 1) ctx.scale(px_ratio, px_ratio);
    if ((thumb_width  == player_width) &&
        (thumb_height == player_height)) {
        this.__thumb.apply(ctx);
    } else {
        var f_rects    = utils.fit_rects(player_width, player_height,
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
        if (thumb_rect) {
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
};

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
};

Player.prototype._drawLoadingSplash = function(text) {
    if (this.controls) return;
    this._drawSplash();
    var ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#006';
    ctx.font = '12px sans-serif';
    ctx.fillText(text || StrLoc.LOADING, 20, 25);
    ctx.restore();
};

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
};

Player.prototype._stopDrawingLoadingCircles = function() {
    if (this.controls) return;
    this._drawEmpty();
};

Player.prototype._drawErrorSplash = function(e) {
    if (!this.canvas || !this.ctx) return;
    if (this.controls) {
        return;
    }
    this._drawSplash();
    var ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#006';
    ctx.font = '14px sans-serif';
    ctx.fillText(StrLoc.ERROR +
                 (e ? ': ' + (e.message || (typeof Error))
                    : '') + '.', 20, 25);
    ctx.restore();
};

/**
 * @method toString
 *
 * @return a nice string
 */
Player.prototype.toString = function() {
    return "[ Player '" + this.id + "' ]"; // "' m-" + this.mode + " ]";
};

// reset player to initial state, called before loading any animation
Player.prototype._reset = function() {
    var state = this.state;
    // clear postponed tasks if player started to load remote resources,
    // they are not required since new animation is loading in the player now
    // or it is being detached
    if ((this.loadingMode === C.LM_ONREQUEST) &&
        (state.happens === C.RES_LOADING)) {
        this._clearPostpones();
        resourceManager.cancel(this.id);
    }
    state.happens = C.NOTHING;
    state.from = 0;
    state.time = Player.NO_TIME;
    state.duration = undefined;
    this.fire(C.S_CHANGE_STATE, C.NOTHING);
    if (this.controls) this.controls.reset();
    this.ctx.clearRect(0, 0, this.width * engine.PX_RATIO,
                             this.height * engine.PX_RATIO);
    /*this.stop();*/
};

Player.prototype._stopAndContinue = function() {
    //state.__lastPlayConf = [ from, speed, stopAfter ];
    var state = this.state,
        last_conf = state.__lastPlayConf;
    var stoppedAt = state.time;
    this.stop();
    this.play(stoppedAt, last_conf[1], last_conf[2]);
};

// FIXME: moveTo is not moving anything for the moment
Player.prototype._moveTo = function(x, y) {
    engine.setCanvasPosition(this.canvas, x, y);
};

Player.prototype._resize = function(width, height) {
    var cvs = this.canvas,
        new_size = this.__userSize || [ width, height ],
        cur_size = engine.getCanvasParameters(cvs);
    if (cur_size && (cur_size[0] === new_size[0]) && (cur_size[1] === new_size[1])) return;
    if (!new_size[0] || !new_size[1]) {
        new_size = cur_size;
    };
    engine.setCanvasSize(cvs, new_size[0], new_size[1]);
    this.width = new_size[0];
    this.height = new_size[1];
    engine.updateCanvasOverlays(cvs);
    if (this.ctx) {
        var ctx_props = engine.getAnmProps(this.ctx);
        ctx_props.factor = this.factor();
    }
    if (this.controls) this.controls.handleAreaChange();
    this.forceRedraw();
    return new_size;
};

Player.prototype._restyle = function(bg) {
    engine.setCanvasBackground(this.canvas, bg);
    this.forceRedraw();
};

// FIXME: methods below may be removed, but they are required for tests
Player.prototype._enableControls = function() {
    if (!this.controls) this.controls = new Controls(this);
    // if (this.state.happens === C.NOTHING) { this._drawSplash(); }
    // if ((this.state.happens === C.LOADING) ||
    //     (this.state.happens === C.RES_LOADING)) { this._drawLoadingSplash(); }
    this.controls.enable();
};

Player.prototype._disableControls = function() {
    if (!this.controls) return;
    this.controls.disable();
    this.controls = null;
};

Player.prototype._enableInfo = function() {
    if (!this.controls) return;
    this.controls.enableInfo();
};

Player.prototype._disableInfo = function() {
    if (!this.controls) return;
    this.controls.disableInfo();
};

Player.prototype.__subscribeDynamicEvents = function(anim) {
    if (global_opts.setTabindex) {
        engine.setTabIndex(this.canvas, this.__instanceNum);
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
};

Player.prototype.__unsubscribeDynamicEvents = function(anim) {
    if (global_opts.setTabindex) {
        engine.setTabIndex(this.canvas, undefined);
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
};

Player.prototype._ensureHasState = function() {
    if (!this.state) errors.player(ErrLoc.P.NO_STATE);
};

Player.prototype._ensureHasAnim = function() {
    if (!this.anim) errors.player(ErrLoc.P.NO_ANIMATION);
};

Player.prototype.__beforeFrame = function(anim) {
    return (function(player, state, anim, callback) {
        return function(time) {
            anim.clearAllLaters();
            if (state.happens !== C.PLAYING) return false;
            if (((state.stop !== Player.NO_TIME) &&
                 (time >= (state.from + state.stop))) ||
                 (is.finite(state.duration) &&
                    (time > (state.duration + Player.PEFF)))) {
                player.fire(C.S_COMPLETE);
                state.time = 0;
                anim.reset();
                player.playedOnce = true;
                player.stop();
                if (player.repeat || anim.repeat) {
                   player.repeating = true;
                   player.play();
                   player.fire(C.S_REPEAT);
               } else if (!player.infiniteDuration &&
                       is.finite(state.duration)) {
                   player.drawAt(state.duration);
                }
                return false;
            }
            if (callback) callback(time, player.ctx);
            return true;
        };
    })(this, this.state, anim, this.__userBeforeFrame);
};

Player.prototype.__afterFrame = function(anim) {
    return (function(player, state, anim, callback) {
        return function(time) {
            if (callback) callback(time);

            anim.invokeAllLaters();
            return true;
        };
    })(this, this.state, anim, this.__userAfterFrame);
};

// Called when any error happens during player initialization or animation
// Player should mute all non-system errors by default, and if it got a system error, it may show
// this error over itself
Player.prototype.__onerror = function(err) {
  var player = this;
  var doMute = player.muteErrors;
      doMute = doMute && !(err instanceof SystemError);

  try {
      if (player.state) player.state.happens = C.ERROR;
      player.__lastError = err;
      player.fire(C.S_CHANGE_STATE, C.ERROR);
      player.fire(C.S_ERROR, err);

      player.anim = null;
      // was here: /*if (player.state)*/ player.__unsafe_stop();
  } catch(e) { errors.player(utils.strf(ErrLoc.S.ERROR_HANDLING_FAILED, [err.message || err])); }

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
};

Player.prototype.__callSafe = function(f) {
  try {
    return f.call(this);
  } catch(err) {
    this.__onerror(err);
  }
};

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
};

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
};

Player.prototype.__makeSafe = function(methods) {
  var player = this;
  for (var i = 0, il = methods.length; i < il; i++) {
    var method = methods[i];
    if (!player[method]) errors.system(utils.strf(ErrLoc.S.NO_METHOD_FOR_PLAYER, [method]));
    player['__unsafe_'+method] = player[method];
    player[method] = player.__defSafe(player[method]);
  }
};

Player.prototype.handle__x = function(type, evt) {
    if (this.anim) this.anim.fire(type, this);
    return true;
};

Player.prototype._clearPostpones = function() {
    this._queue = [];
};

Player.prototype._postpone = function(method, args) {
    if (!this._queue) this._queue = [];
    this._queue.push([ method, args ]);
};

Player.prototype._callPostpones = function() {
    if (this._queue && this._queue.length) {
        var q = this._queue, spec;
        for (var i = 0, il = q.length; i < il; i++) {
          spec = q[i]; this[spec[0]].apply(this, spec[1]);
        }
    }
    this._queue = [];
};

var prodHost = 'animatron.com',
    testHost = 'animatron-test.com',
    prodStatUrl = '//api.' + prodHost + '/stats/report/',
    testStatUrl = '//api.' + testHost + '/stats/report/';

Player.prototype.reportStats = function() {
    // currently, notifies only about playing start
    if (!this.anim || !this.anim.meta || !this.anim.meta._anm_id) return;
    if (!this.statImg) {
      this.statImg = engine.createStatImg();
    }
    var loadSrc = this._loadSrc,
        id = this.anim.meta._anm_id,
        locatedAtTest = false,
        locatedAtProd = false;

    if (loadSrc) {
        //if the player was loaded from a snapshot URL, we check the said url
        //to see if it is from our servers
        locatedAtTest = loadSrc.indexOf(testHost) !== -1;
        locatedAtProd = loadSrc.indexOf(prodHost) !== -1;
    } else if(window && window.location) {
        //otherwise, we check if we are on an Animatron's webpage
        var hostname = window.location.hostname;
        locatedAtTest = hostname.indexOf(testHost) !== -1;
        locatedAtProd = hostname.indexOf(prodHost) !== -1;
    }
    if (locatedAtTest) {
        this.statImg.src = testStatUrl + id + '?' + Math.random();
    } else if (locatedAtProd) {
        this.statImg.src = prodStatUrl + id + '?' + Math.random();
    }
};

/* Player.prototype.__originateErrors = function() {
    return (function(player) { return function(err) {
        return player._fireError(err);
    }})(this);
} */

/**
 * @deprecated
 * @static @private @method createState
 *
 * Create a state for current player instance.
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
};

/**
 * @static @method forSnapshot
 *
 * Load an {@link anm.Animation animation} from a JSON located at some remote URL.
 *
 * @param {HTMLElement|String} elm DOM Element ID or the DOM Element itself
 * @param {String} snapshot_url URL of a JSON
 * @param {anm.Importer} importer an importer which knows how to convert given JSON to an {@link anm.Animation animation} instance
 * @param {Function} [callback]
 * @param {anm.Animation} callback.animation
 * @param {Object} [opts] see {@link anm.Player#init} for the description of possible options
 */
Player.forSnapshot = function(elm_id, snapshot_url, importer, callback, alt_opts) {
    var player = new Player();
    player.init(elm_id, alt_opts);
    player.load(snapshot_url, importer, callback);
    return player;
};

Player.prototype._applyUrlParamsToAnimation = function(params) {
    // NB: this metod is intended to be called only after some animation was loaded completely
    //     into player, some URL parameters are loaded into player `options` object and applied
    //     before getting any animation, but it's done using `_optsFromUrlParams` method.

    // these values (t, from, p, still) may be 0 and it's a proper value,
    // so they require a check for undefined separately

    // player may appear already playing something if autoPlay or a similar time-jump
    // flag was set from some different source of options (async, for example),
    // then the rule (for the moment) is: last one wins

    if (is.defined(params.t)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.t / 100);
    } else if (is.defined(params.from)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.from / 100);
    } else if (is.defined(params.p)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.p / 100).pause();
    } else if (is.defined(params.at)) {
        if (this.state.happens === C.PLAYING) this.stop();
        this.play(params.at / 100).pause();
    }
};

module.exports = Player;
