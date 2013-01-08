/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _define;
if (typeof define !== "function") {
   this.define = function(name, func) {
      func.call({}).__injectToWindow(name);
   };
}

define("anm", function() {

// === UTILS ===================================================================
// =============================================================================

// FRAMING

// http://www.html5canvastutorials.com/advanced/html5-canvas-start-and-stop-an-animation/
// http://www.w3.org/TR/animation-timing/
// https://gist.github.com/1579671

var __frameFunc = function() {
           return window.requestAnimationFrame ||
                  window.webkitRequestAnimationFrame ||
                  window.mozRequestAnimationFrame ||
                  window.oRequestAnimationFrame ||
                  window.msRequestAnimationFrame ||
                  window.__anm__frameGen ||
                  function(callback){
                    return window.setTimeout(callback, 1000 / 60);
                  } };

var __clearFrameFunc = function() {
           return window.cancelAnimationFrame ||
                  window.webkitCancelAnimationFrame ||
                  window.mozCancelAnimationFrame ||
                  window.oCancelAnimationFrame ||
                  window.msCancelAnimationFrame ||
                  window.__anm__frameRem ||
                  function(id){
                    return window.clearTimeout(id);
                  } };

// assigns to call a function on next animation frame
var __nextFrame;

// stops the animation
// FIXME: remove, not used, __supressFrames is used
var __stopAnim = function(requestId) {
    __clearFrameFunc()(requestId);
};

// ERRORS

var SystemError = __errorAs('SystemError',
                            function(msg) { this.message = msg || ''; });
var SysErr = SystemError;

var PlayerError = __errorAs('PlayerError',
                            function(msg) { this.message = msg || ''; });
var PlayerErr = PlayerError;

var AnimationError = __errorAs('AnimationError',
                               function(msg) { this.message = msg || ''; });
var AnimErr = AnimationError;

// OTHER

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

function _s4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
   return (_s4()+_s4()+'-'+_s4()+'-'+_s4()+'-'+_s4()+'-'+_s4()+_s4()+_s4());
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

// ARRAYS

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

// DOM

// for one-level objects, so no hasOwnProperty check
function obj_clone(what) {
    var dest = {};
    for (var prop in what) {
        dest[prop] = what[prop];
    }
    return dest;
}

// FIXME: replace with elm.getBoundingClientRect();
// see http://stackoverflow.com/questions/8070639/find-elements-position-in-browser-scroll
function find_pos(elm) {
    var curleft = 0,
        curtop = 0;
    do {
        curleft += elm.offsetLeft/* - elm.scrollLeft*/;
        curtop += elm.offsetTop/* - elm.scrollTop*/;
    } while (elm = elm.offsetParent);
    return [ curleft, curtop ];
}

// AJAX

function ajax(url, callback/*, errback*/) {
    var req = false;

    if (!window.ActiveXObject) {
        req = new XMLHttpRequest();
    } else {
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e1) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e2) {
                throw new SysErr('No AJAX/XMLHttp support');
            }
        }
    }

    //if (req.overrideMimeType) { // optional
    //  req.overrideMimeType('text/xml');
    //}

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

// CANVAS-RELATED

function getPxRatio() { return window.devicePixelRatio || 1; }

var DEF_CNVS_WIDTH = 400;
var DEF_CNVS_HEIGHT = 250;
var DEF_CNVS_BG = '#fff';

function canvasOpts(canvas, opts, ratio) {
    var isObj = !(opts instanceof Array),
        _w = isObj ? opts.width : opts[0],
        _h = isObj ? opts.height : opts[1];
    if (isObj) {
        if (opts.bgfill) { // TODO: support other fill types
            canvas.style.backgroundColor = opts.bgfill.color;
        }
    }
    canvas.__pxRatio = ratio;
    canvas.style.width = _w + 'px';
    canvas.style.height = _h + 'px';
    canvas.setAttribute('width', _w * (ratio || 1));
    canvas.setAttribute('height', _h * (ratio || 1));
}

function newCanvas(dimen, ratio) {
    var _canvas = document.createElement('canvas');
    canvasOpts(_canvas, dimen, ratio);
    return _canvas;
}

function prepareImage(url, callback) {
    var _img = new Image();
    _img.onload = function() {
        this.isReady = true; // FIXME: use 'image.complete' and
                             // '...' (network exist) combination,
                             // 'complete' fails on Firefox
        if (callback) callback(this);
    };
    try { _img.src = url; }
    catch(e) { throw new SysErr('Image at ' + url + ' is not accessible'); }
    return _img;
}

// HELPERS

function __builder(obj) {
    return (typeof Builder !== 'undefined') &&
           (obj instanceof Builder);
}

function __array(obj) {
    return Array.isArray(obj);
}

function __num(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function __close(n1, n2, precision) {
    if (!(precision === 0)) {
        precision = precision || 2;
    }
    var multiplier = Math.pow(10, precision);
    return Math.round(n1 * multiplier) ==
           Math.round(n2 * multiplier);
}

function __errorAs(name, _constructor) {
  //var _constructor = function(msg) { this.message = msg; }
  _constructor.prototype = new Error();
  //_constructor.prototype.constructor = _constructor;
  _constructor.prototype.name = name || 'Unknown';
  _constructor.prototype.toString = function() { return name + (this.message ? ': ' + this.message : ''); }
  return _constructor;
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

function mrg_obj(src, backup) {
    var res = {};
    for (prop in backup) {
        res[prop] = (typeof src[prop] !== 'undefined') ? src[prop] : backup[prop]; };
    return res;
}

var trashBin = null;
function disposeElm(domElm) {
    if (!trashBin) {
        trashBin = document.createElement('div');
        trashBin.id = 'trash-bin';
        trashBin.style.display = 'none';
        document.body.appendChild(trashBin);
    }
    trashBin.appendChild(domElm);
    trashBin.innerHTML = '';
}

// === CONSTANTS ==================================================================
// ================================================================================

var C = {};

// Player states

C.NOTHING = -1;
C.STOPPED = 0;
C.PLAYING = 1;
C.PAUSED = 2;

// public constants below are also appended to C object, but with `X_`-like prefix
// to indicate their scope, see through all file

// Player Modes constants

C.M_CONTROLS_DISABLED = 0;
C.M_CONTROLS_ENABLED = 1;
C.M_INFO_DISABLED = 0;
C.M_INFO_ENABLED = 2;
C.M_DO_NOT_HANDLE_EVENTS = 0;
C.M_HANDLE_EVENTS = 4;
C.M_DO_NOT_DRAW_STILL = 0;
C.M_DRAW_STILL = 8;
C.M_PREVIEW = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED
              | C.M_DO_NOT_HANDLE_EVENTS
              | C.M_DO_NOT_DRAW_STILL;
C.M_DYNAMIC = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED
              | C.M_HANDLE_EVENTS
              | C.M_DO_NOT_DRAW_STILL;
C.M_VIDEO = C.M_CONTROLS_ENABLED
            | C.M_INFO_ENABLED
            | C.M_DO_NOT_HANDLE_EVENTS
            | C.M_DRAW_STILL;


// EVENTS

C.__enmap = {};

function __reg_event(id, name, value) {
    C[id] = value;
    C.__enmap[value] = name;
}

// NB: All of the events must have different values, or the flow will be broken

// mouse
__reg_event('X_MCLICK', 'mclick', 1);
__reg_event('X_MDCLICK', 'mdclick', 2);
__reg_event('X_MUP', 'mup', 4);
__reg_event('X_MDOWN', 'mdown', 8);
__reg_event('X_MMOVE', 'mmove', 16);
__reg_event('X_MOVER', 'mover', 32);
__reg_event('X_MOUT', 'mout', 64);

__reg_event('XT_MOUSE', 'mouse',
  (C.X_MCLICK | C.X_MDCLICK | C.X_MUP | C.X_MDOWN | C.X_MMOVE | C.X_MOVER | C.X_MOUT));

// keyboard
__reg_event('X_KPRESS', 'kpress', 128);
__reg_event('X_KUP', 'kup', 256);
__reg_event('X_KDOWN', 'kdown', 1024);

__reg_event('XT_KEYBOARD', 'keyboard',
  (C.X_KPRESS | C.X_KUP | C.X_KDOWN));

// controllers
__reg_event('XT_CONTROL', 'control', (C.XT_KEYBOARD | C.XT_MOUSE));

// draw
__reg_event('X_DRAW', 'draw', 2048);

// playing
__reg_event('S_PLAY', 'play', 'play');
__reg_event('S_PAUSE', 'pause', 'pause');
__reg_event('S_STOP', 'stop', 'stop');
__reg_event('S_LOAD', 'load', 'load');
__reg_event('S_ERROR', 'error', 'error');

// X_ERROR, X_FOCUS, X_RESIZE, X_SELECT, touch events

// TODO: the problem with controls receiving events is that `handle_` method is now saved as 'handle_8' instead of 'handle_mclick'

// === MODULES ====================================================================
// ================================================================================

var M = {};

C.MOD_PLAYER = 'player';

// === OPTIONS ====================================================================
// ================================================================================

var global_opts = { 'liveDebug': false,
                    'autoFocus': true,
                    'setTabindex': true };

M[C.MOD_PLAYER] = global_opts;

// === INTERNAL CONSTANTS =========================================================
// ================================================================================

// for the cases when it is impossible to determine FPS
var FPS_FALLBACK = 60,
    FPS_ERROR = 1.3;

// === PLAYER =====================================================================
// ================================================================================

/*
 `id` is canvas id

 you may pass null for options, but if you provide them, at least `mode` is required
 to be set (all other are optional).

 options format:
  { "debug": false,
    "inParent": false,
    "muteErrors": false,
    "mode": C.M_VIDEO,
    "zoom": 1.0,
    "meta": { "title": "Default",
              "author": "Anonymous",
              "copyright": "© NaN",
              "version": -1.0,
              "description":
                      "Default project description",
              [ "modified": "2012-04-10T15:06:12.246Z" ] }, // not used
    "anim": { "fps": 30,
              "width": 400,
              "height": 250,
              "bgfill": { color: "#fff" },
              "duration": 0 } }
*/
function Player() {
    this.id = '';
    this.state = null;
    this.anim = null;
    this.canvas = null;
    this.ctx = null;
    this.controls = null;
    this.info = null;
    this.__canvasPrepared = false;
    this.__instanceNum = ++Player.__instances;
    this.__makeSafe(Player._SAFE_METHODS);
}
Player.__instances = 0;

Player.PREVIEW_POS = 0.33;
Player.PEFF = 0.07; // seconds to play more when reached end of movie
Player.NO_TIME = -1;

Player.URL_ATTR = 'data-url';

Player.DEFAULT_CANVAS = { 'width': DEF_CNVS_WIDTH,
                          'height': DEF_CNVS_HEIGHT,
                          'bgfill': null/*{ 'color': DEF_CNVS_BG }*/ };
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
                                           'bgfill': null,
                                           'duration': 0 }
                               };

// === PLAYING CONTROL API =====================================================
// =============================================================================

// methods listed below are directly wrapped with try/catch to check
// which way of handling/suppressing errors is current one for this player
// and act with catched errors basing on this way

Player._SAFE_METHODS = [ 'init', 'load', 'play', 'stop', 'pause', 'drawAt' ];

// TODO: add load/play/pause/stop events

Player.prototype.init = function(cvs, opts) {
    if (this.canvas) throw new PlayerErr(Errors.P.INIT_TWICE);
    if (this.anim) throw new PlayerErr(Errors.P.INIT_AFTER_LOAD);
    this._initHandlers(); // TODO: make automatic
    this._prepare(cvs);
    this._loadOpts(opts);
    this._postInit();
    // TODO: if (this.canvas.hasAttribute('data-url'))
    return this;
}
Player.prototype.load = function(object, importer, callback) {
    var player = this;

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

    var whenDone = function() {
        if (player.mode & C.M_HANDLE_EVENTS) {
            player.__subscribeDynamicEvents(player.anim);
        }
        player.fire(C.S_LOAD);
        player.stop();
        if (callback) callback();
    };

    // TODO: configure canvas using clips bounds

    if (object) {

        if (__builder(object)) {  // Builder instance
            L.loadBuilder(player, object, whenDone);
        } else if (object instanceof Scene) { // Scene instance
            L.loadScene(player, object, whenDone);
        } else if (__array(object)) { // array of clips
            L.loadClips(player, object, whenDone);
        } else if (typeof object === 'string') { // URL
            L.loadFromUrl(player, object, importer, whenDone);
        } else { // any object with importer
            L.loadFromObj(player, object, importer, whenDone);
        }

    } else {
        player.anim = new Scene();
    }

    //console.log('load', player.id, player.state);

    return player;
}

Player.prototype.play = function(from, speed, stopAfter) {

    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.ALREADY_PLAYING);

    var player = this;

    __nextFrame = __frameFunc();

    player._ensureHasAnim();
    player._ensureHasState();

    var state = player.state;

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

    state.__firstReq = D.drawNext(player.ctx,
                                  state, scene,
                                  player.__beforeFrame(scene),
                                  player.__afterFrame(scene));

    player.fire(C.S_PLAY, state.from);

    return player;
}

Player.prototype.stop = function() {
    //if (state.happens === C.STOPPED) return;

    var player = this;

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

    if (player.anim) {
        state.happens = C.STOPPED;
        if (player.mode & C.M_DRAW_STILL) {
            player.drawAt(state.duration * Player.PREVIEW_POS);
        }
        if (player.controls/* && !player.controls.hidden*/) {
            player._renderControlsAt(0);
        }
    } else {
        state.happens = C.NOTHING;
        player._drawSplash();
    }

    player.fire(C.S_STOP);
    //console.log('stop', player.id, state);

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
    //console.log('pause', player.id, state);

    return player;
}

/*Player.prototype.reset = function() {

}*/

Player.prototype.onerror = function(callback) {
    this.__err_handler = callback;

    return this;
}

/*Player.prototype._fireError = function(err) {
    var player = this;

    player.fire(C.S_ERROR, err);
    //console.log('onerror', player.id, player);

    player.anim = null;
    player.stop();

    // TODO: test if handlers not supressed the error

    return false; // do not throw error
}*/

// === INITIALIZATION ==========================================================
// =============================================================================

provideEvents(Player, [C.S_PLAY, C.S_PAUSE, C.S_STOP, C.S_LOAD, C.S_ERROR]);
Player.prototype._prepare = function(cvs) {
    if (typeof cvs === 'string') {
        this.canvas = document.getElementById(cvs);
        if (!this.canvas) throw new PlayerErr(_strf(Errors.P.NO_CANVAS_WITH_ID, [cvs]));
        this.id = cvs;
    } else {
        if (!cvs) throw new PlayerErr(Errors.P.NO_CANVAS_PASSED);
        this.id = cvs.id;
        this.canvas = cvs;
    }
    var canvas = this.canvas;
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
// initial state of the player, called from conctuctor
Player.prototype._postInit = function() {
    this.stop();
    // TODO: load some default information into player
    if (!Text.__buff) Text.__buff = Text._createBuffer(); // so it will be performed onload
    var mayBeUrl = this.canvas.getAttribute(Player.URL_ATTR);
    if (mayBeUrl) this.load(mayBeUrl/*,
                            this.canvas.getAttribute(Player.IMPORTER_ATTR)*/);
}
Player.prototype.changeRect = function(rect) {
    this._applyConfToCanvas({
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
        bgfill: this.state.bgfill
    });
    if (this.anim) this.forceRedraw();
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
        case C.PAUSED: this.drawAt(this.state.time); break;
        case C.PLAYING: this.play(this.state.time); break;
    }
}
Player.prototype.changeZoom = function(ratio) {
    this.state.zoom = ratio;
}
// update player state with passed configuration, usually done before
// loading some scene or by importer, `conf` has the data about title,
// author/copyright, fps and width/height of the player
// Anim-info format:
// { ["fps": 24.0,] // NB: currently not applied in any way, default is 30
//   "width": 640,
//   "height": 480,
//   ["bgfill": { color: "#f00" },] // in canvas-friendly format
//   ["duration": 10.0] // in seconds
// }
Player.prototype.configureAnim = function(conf) {
    this._animInfo = conf;
    var cnvs = this.canvas;

    if (!conf.width && cnvs.hasAttribute('width')) conf.width = cnvs.getAttribute('width');
    if (!conf.height && cnvs.hasAttribute('height')) conf.height = cnvs.getAttribute('height');

    this._applyConfToCanvas(conf);

    if (conf.fps) this.state.fps = conf.fps;
    if (conf.duration) this.state.duration = conf.duration;

}
// update player information block with passed configuration, usually done before
// loading some scene or by importer, `conf` has the data about title,
// author/copyright, version.
// Meta-info format:
// { ["id": "......",]
//   "title": "Default",
//   "author": "Anonymous",
//   "copyright": "© 2011",
//   "version": 0.1,
//   "description": "Default project description"
// }
Player.prototype.configureMeta = function(info) {
    this._metaInfo = info;
    if (this.info) this.info.inject(info, this._animInfo);
}
// draw current scene at specified time
Player.prototype.drawAt = function(time) {
    if (time === Player.NO_TIME) throw new PlayerErr(Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
    if ((time < 0) || (time > this.state.duration)) {
        throw new PlayerErr(_strf(Errors.P.PASSED_TIME_NOT_IN_RANGE, [time]));
    }
    var ctx = this.ctx,
        state = this.state;
    ctx.clearRect(0, 0, state.width * state.ratio,
                        state.height * state.ratio);
    this.anim.reset();
    this.anim.render(ctx, time, state.zoom * state.ratio);
    if (this.controls) {
        this._renderControlsAt(time);
    }
}
Player.prototype.afterFrame = function(callback) {
    if (this.state.happens === C.PLAYING) throw new PlayerErr(Errors.P.AFTERFRAME_BEFORE_PLAY);
    this.__userAfterFrame = callback;
}
Player.prototype.detach = function() {
    if (this.controls) this.controls.detach(this.canvas);
    if (this.info) this.info.detach(this.canvas);
    this._reset();
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
        if (player.controls) {
            player.controls.update(player.canvas);
            //player._renderControls();
        }
        if (player.info) {
            player.info.update(player.canvas);
            //player.info.render(player.state, player.state.time);
        }
    };
}
Player.prototype.subscribeEvents = function(canvas) {
    //window.addEventListener('scroll', Player.__getPosAndRedraw(this), false);
    //window.addEventListener('resize', Player.__getPosAndRedraw(this), false);
    this.canvas.addEventListener('mouseover', (function(player) {
                        return function(evt) {
                            if (global_opts.autoFocus &&
                                (player.mode & C.M_HANDLE_EVENTS) &&
                                player.canvas) {
                                player.canvas.focus();
                            }
                            if (player.controls) {
                                player.controls.show();
                                player._renderControls();
                            }
                            if (player.info) player.info.show();
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
                            if (player.controls &&
                                (!player.controls.evtInBounds(evt))) {
                                player.controls.hide();
                            }
                            if (player.info &&
                                (!player.info.evtInBounds(evt))) {
                                player.info.hide();
                            }
                            return true;
                        };
                    })(this), false);
}
Player.prototype.setDuration = function(value) {
    this.state.duration = value;
    if (this.info) this.info.setDuration(value);
}
Player.prototype._drawSplash = function() {
    var ctx = this.ctx,
        w = this.state.width,
        h = this.state.height,
        rsize = 120;
    ctx.save();

    // background
    ctx.fillStyle = '#ffe';
    ctx.fillRect(0, 0, w, h);

    // text
    ctx.fillStyle = '#999966';
    ctx.font = '18px sans-serif';
    ctx.fillText('© Animatron Player', 20, h - 20);

    // outer rect
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#fee';
    ctx.strokeRect(0, 0, w, h);

    // inner rect
    ctx.translate((w / 2) - (rsize / 2), (h / 2) - (rsize / 2));
    var grad = ctx.createLinearGradient(0,0,rsize,rsize);
    grad.addColorStop(0, '#00abeb');
    grad.addColorStop(.7, '#fff');
    grad.addColorStop(.7, '#6c0');
    grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 10;
    ctx.globalAlpha = .8;
    ctx.fillRect(0, 0, rsize, rsize);
    ctx.globalAlpha = .9;
    ctx.strokeRect(0, 0, rsize, rsize);

    ctx.restore();
}
Player.prototype._drawLoadingSplash = function(text) {
    this._drawSplash();
    var ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#006';
    ctx.font = '12px sans-serif';
    ctx.fillText(text || Strings.LOADING, 20, 25);
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
    //state.zoom = 1; // do not override the zoom
    state.duration = 0;
    if (this.controls) this.controls.reset();
    if (this.info) this.info.reset();
    this.ctx.clearRect(0, 0, state.width * state.ratio,
                             state.height * state.ratio);
    //this.stop();
}
// update player's canvas with configuration
Player.prototype._applyConfToCanvas = function(opts) {
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
    if (opts.bgfill) this.state.bgfill = opts.bgfill;
    canvasOpts(canvas, opts, pxRatio);
    Player._saveCanvasPos(canvas);
    if (this.controls) this.controls.update(canvas);
    if (this.info) this.info.update(canvas);
    this.__canvasPrepared = true;
    return this;
}
Player.prototype._enableControls = function() {
    this.controls = new Controls(this);
    this.controls.update(this.canvas);
}
Player.prototype._disableControls = function() {
    this.controls.detach(this.canvas);
    this.controls = null;
}
Player.prototype._enableInfo = function() {
    this.info = new InfoBlock(this);
    this.info.update(this.canvas);
}
Player.prototype._disableInfo = function() {
    this.info.detach(this.canvas);
    this.info = null;
}
Player.prototype._renderControls = function() {
    this._renderControlsAt(this.state.time);
}
Player.prototype._renderControlsAt = function(t) {
    this.controls.render(this.state, t);
}
Player.prototype._checkMode = function() {
    if (!this.canvas) return;

    if (this.mode & C.M_CONTROLS_ENABLED) {
        if (!this.controls) this._enableControls();
    } else {
        if (this.controls) this._disableControls();
    }
    if (this.mode & C.M_INFO_ENABLED) {
        if (!this.info) this._enableInfo();
    } else {
        if (this.info) this._disableInfo();
    }
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
    return (function(player, state, scene) {
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
                }
                return false;
            }
            return true;
        }
    })(this, this.state, scene);
}
Player.prototype.__afterFrame = function(scene) {
    return (function(player, state, scene, callback) {
        return function(time) {
            if (player.controls) {
                player._renderControls();
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
    player.fire(C.S_ERROR, err);

    player.anim = null;
    /*if (player.state)*/ player.__unsafe_stop();
  } catch(e) { throw new SysErr(_strf(Errors.S.ERROR_HANDLING_FAILED, [err.message || err])); }

  doMute = (this.__err_handler && this.__err_handler(err)) || doMute;

  if (!doMute) throw err;
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

/* Player.prototype.__originateErrors = function() {
    return (function(player) { return function(err) {
        return player._fireError(err);
    }})(this);
} */
Player._saveCanvasPos = function(cvs) {
    var gcs = (document.defaultView &&
               document.defaultView.getComputedStyle); // last is assigned

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

    var html = document.body.parentNode,
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

    // FIXME: find a method with no injection of custom properties
    //        (data-xxx attributes are stored as strings and may work
    //         a bit slower for events)
    cvs.__rOffsetLeft = ol;
    cvs.__rOffsetTop = ot;
}

Player.createState = function(player) {
    return {
        'time': Player.NO_TIME, 'from': 0, 'stop': Player.NO_TIME,
        'speed': 1, 'fps': 30, 'afps': 0, 'duration': 0,
        'debug': false, 'iactive': false,
        // TODO: use iactive to determine if controls/info should be init-zed
        'width': player.canvas.offsetWidth,
        'height': player.canvas.offsetHeight,
        'zoom': 1.0, 'bgfill': null,
        'happens': C.NOTHING,
        '__startTime': -1,
        '__redraws': 0, '__rsec': 0
        //'__drawInterval': null
    };
}

function __attrOr(canvas, attr, _default) {
    return canvas.hasAttribute(attr)
           ? canvas.getAttribute(attr)
           : _default;
}
Player._mergeOpts = function(what, where) {
    var res = mrg_obj(what, where);
    res.meta = what.meta ? mrg_obj(what.meta, where.meta || {}) : (where.meta || {});
    res.anim = what.anim ? mrg_obj(what.anim, where.anim || {}) : (where.anim || {});
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
                       'bgfill': canvas.hasAttribute('data-bgcolor')
                                 ? { 'color': canvas.getAttribute('data-bgcolor') }
                                 : undefined,
                       'duration': undefined } };
};
Player._optsFromURLParams = function(attrs/* as json */) {
    return { 'debug': attrs.debug,
             'inParent': undefined,
             'muteErrors': false,
             'repeat': attrs.r,
             'mode': attrs.m,
             'zoom': attrs.z,
             'anim': { 'fps': undefined,
                       'width': attrs.w,
                       'height': attrs.h,
                       'bgfill': { color: "#" + attrs.bg },
                       'duration': undefined } };
}
Player.forSnapshot = function(canvasId, snapshotURL, params/* as json */, importer) {
    var options = Player._optsFromURLParams(params);
    var player = new Player();
    player.init(canvasId, options);
    function updateWithParams() {
        if (typeof params.t !== 'undefined') {
            player.play(params.t / 100);
        } else if (typeof params.p !== 'undefined') {
            player.play(params.p / 100).pause();
        }
        if (params.w && params.h) {
            player._applyConfToCanvas({ width: params.w, height: params.h });
        }
        if (params.bg) player.canvas.style.backgroundColor = '#' + params.bg;
    }

    player.load(snapshotURL, importer, updateWithParams);

    return player;
}

// the dynamic method subsribes player itself to
/* Player.subscribeEvents = function(canvas, anim) {

} */

// === SCENE ===================================================================
// =============================================================================

// > Scene % ()
function Scene() {
    this.tree = [];
    this.hash = {};
    this.name = '';
    this.duration = 0;
    this._initHandlers(); // TODO: make automatic
}

Scene.DEFAULT_VIDEO_DURATION = 10;

// mouse/keyboard events are assigned in L.loadScene, TODO: move them into scene
provideEvents(Scene, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                       C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                       C.X_KPRESS, C.X_KUP, C.X_KDOWN,
                       C.X_DRAW ]);
// TODO: add chaining to all external Scene methods?
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
    } else if (__array(arg1)) { // elements array mode
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
// > Scene.addS % (dimen: Array[Int, 2],
//                 draw: Function(ctx: Context),
//                 onframe: Function(time: Float),
//                 [ transform: Function(ctx: Context,
//                                       prev: Function(Context)) ])
//                 => Clip
Scene.prototype.addS = function(dimen, draw, onframe, transform) {
    var _clip = new Clip();
    _clip.addS(dimen, draw, onframe, transform);
    this.add(_clip);
    return _clip;
}
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
Scene.prototype.render = function(ctx, time, zoom, afps) {
    ctx.save();
    if (zoom != 1) {
        ctx.scale(zoom, zoom);
    }
    this.visitRoots(function(elm) {
        elm.render(ctx, time, afps);
    });
    ctx.restore();
    this.fire(C.X_DRAW,ctx);
}
Scene.prototype.handle__x = function(type, evt) {
    this.visitElems(function(elm) {
        if (elm.visible) elm.fire(type, evt);
    });
    return true;
}
Scene.prototype.updateDuration = function() {
    var max_pos = 0;
    var me = this;
    this.visitRoots(function(elm) {
        var elm_tpos = elm._max_tpos();
        if (elm_tpos > me.duration) me.duration = elm_tpos;
    });
    return this.duration;
}
Scene.prototype.reset = function() {
    this.visitRoots(function(elm) {
        elm.reset();
    });
}
Scene.prototype.dispose = function() {
    this.disposeHandlers();
    var me = this;
    // FIXME: unregistering removes from tree, ensure it is safe
    this.visitRoots(function(elm) {
        me._unregister(elm);
        elm.dispose();
    });
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
    //if (elm.children) this._addElems(elm.children);
    this.tree.push(elm);
    this.updateDuration();
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
    this.updateDuration();
    elm.registered = false;
    elm.scene = null;
    //elm.parent = null;
}

// === ELEMENTS ================================================================
// =============================================================================

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

Element.TYPE_MAX_BIT = 16;
Element.PRRT_MAX_BIT = 8; // used to calculate modifiers/painters id's:
    // they are: (type << TYPE_MAX_BIT) | (priot << PRRT_MAX_BIT) | i

// modifiers classes
// the order is also determined with value
Element.SYS_MOD = 0;
Element.TWEEN_MOD = 1;
Element.USER_MOD = 2;
// TODO: JUMP_MOD ?
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
// FIXME: Underscore here is to prevent conflicts with other libraries.
//        Find another shorter name that will also fit the meaning
function Element(draw, onframe) {
    this.id = guid();
    this.name = '';
    this.state = Element.createState(this);
    this.xdata = Element.createXData(this);
    this.children = [];
    this.parent = null;
    this.scene = null;
    this.sprite = false;
    this.visible = false;
    this.registered = false;
    this.disabled = false;
    this.rendering = false;
    this.__data = null;
    this._modifiers = [];
    this._painters = [];
    if (onframe) this.__modify(Element.USER_MOD, 0, null, onframe);
    if (draw) this.__paint(Element.USER_PNT, 0, draw);
    this.__lastJump = null;
    this.__jumpLock = false;
    this.__modifying = null; // current modifiers class, if modifying
    this.__painting = null; // current painters class, if painting
    this.__evtCache = [];
    this.__detachQueue = [];
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
Element.DEFAULT_LEN = 10;
provideEvents(Element, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                         C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                         C.X_KPRESS, C.X_KUP, C.X_KDOWN,
                         C.X_DRAW ]);
// > Element.prepare % () => Boolean
Element.prototype.prepare = function() {
    this.state._matrix.reset();
    if (this.sprite && !this.xdata.canvas) {
        this._drawToCache();
    }
    return true;
}
// > Element.onframe % (gtime: Float) => Boolean
Element.prototype.onframe = function(ltime, afps) {
    return this.__callModifiers(Element.ALL_MODIFIERS, ltime, afps);
}
// > Element.drawTo % (ctx: Context)
Element.prototype.drawTo = function(ctx) {
    return this.__callPainters(Element.ALL_PAINTERS, ctx);
}
// > Element.draw % (ctx: Context)
Element.prototype.draw = function(ctx) {
    if (!this.sprite) {
        this.drawTo(ctx);
    } else {
        if (this.xdata.canvas.width > 0 && this.xdata.canvas.height > 0) {
            if (this.sheet ) {
                var tw;
                var th;
                var w = 1;
                var h = 1;
                if (this.sheet instanceof Array) {
                    w = this.xdata.image.width / this.sheet[0];
                    h = this.xdata.image.height / this.sheet[1];
                    tw = this.sheet[0];
                    th = this.sheet[1];
                } else {
                    w = this.xdata.image.width / this.sheet;
                    tw = this.sheet;
                }
                var sy = Math.floor( this.xdata.frame / w ) * tw;
                var sx = this.xdata.frame % w * th;
                ctx.drawImage(this.xdata.canvas, sx, sy, tw, th, 0, 0, tw, th);
            }
            else ctx.drawImage(this.xdata.canvas, 0, 0);
        }
    }
}
// > Element.transform % (ctx: Context)
Element.prototype.transform = function(ctx) {
    var s = this.state;
    s._matrix = Element._getMatrixOf(s, s._matrix);
    ctx.globalAlpha *= s.alpha;
    s._matrix.apply(ctx);
}
// > Element.render % (ctx: Context, gtime: Float[, afps: Float])
Element.prototype.render = function(ctx, gtime, afps) {
    if (this.disabled) return;
    this.rendering = true;
    ctx.save();
    var wasDrawn = false;
    // checks if any time jumps (including repeat
    // modes) were performed
    var ltime = this.ltime(gtime);
    if (wasDrawn = (this.fits(ltime)
                    && this.onframe(ltime, afps)
                    && this.prepare())) {
        // update gtime, if it was changed by ltime()
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

            bctx.save();
            bctx.clearRect(0, 0,
                           mcvs.width, mcvs.height);
            bctx.save();
            this.transform(bctx);
            this.draw(bctx);
            this.visitChildren(function(elm) {
                elm.render(bctx, gtime);
            });
            bctx.restore();
            bctx.globalCompositeOperation = 'destination-in';

            mctx.clearRect(0, 0,
                           mcvs.width, mcvs.height);
            this.__mask.render(mctx, gtime);
            bctx.drawImage(mcvs, 0, 0,
                           mcvs.width, mcvs.height);
            bctx.restore();

            ctx.drawImage(bcvs, 0, 0,
                          mcvs.width, mcvs.height);
        }
    }
    // immediately when drawn, element becomes visible,
    // it is reasonable
    this.visible = wasDrawn;
    ctx.restore();
    this.__postRender();
    this.rendering = false;
    if (wasDrawn) this.fire(C.X_DRAW,ctx);
}
// > Element.addModifier % ([restriction: Array[Float, 2] | Float],
//                          modifier: Function(time: Float,
//                                             data: Any) => Boolean,
//                          [easing: Function()],
//                          [data: Any],
//                          [priority: Int]
//                         ) => Integer
Element.prototype.addModifier = function(modifier, easing, data, priority) {
    return this.__modify(Element.USER_MOD, priority || 0, null, modifier, easing, data);
}
// > Element.addTModifier % ([restriction: Array[Float, 2] | Float],
//                           modifier: Function(time: Float,
//                                              data: Any) => Boolean,
//                           [easing: Function()],
//                           [data: Any],
//                           [priority: Int]
//                          ) => Integer
Element.prototype.addTModifier = function(band, modifier, easing, data, priority) {
    return this.__modify(Element.USER_MOD, priority || 0, band, modifier, easing, data);
}
// > Element.removeModifier % (modifier: Function)
Element.prototype.removeModifier = function(modifier) {
    if (!modifier.__m_ids) throw new AnimErr(Errors.A.MODIFIER_NOT_ATTACHED);
    //if (this.__modifying) throw new AnimErr("Can't remove modifiers while modifying");
    var id = modifier.__m_ids[this.id];
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
    return this.__paint(Element.USER_PNT, priority || 0, painter, data);
}
// > Element.removePainter % (painter: Function)
Element.prototype.removePainter = function(painter) {
    if (!painter.__p_ids) throw new AnimErr('Painter wasn\'t applied to anything');
    //if (this.__painting) throw new AnimErr("Can't remove painters while painting");
    var id = painter.__p_ids[this.id];
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
    } else if (__array(arg1)) { // elements array mode
        this._addChildren(arg1);
    } else if (__builder(arg1)) { // builder instance
        this._addChild(arg1.v);
    } else { // element object mode
        this._addChild(arg1);
    }
}
// > Element.addS % (dimen: Array[Int, 2],
//                   draw: Function(ctx: Context),
//                   onframe: Function(time: Float),
//                   [ transform: Function(ctx: Context,
//                                         prev: Function(Context)) ])
//                   => Element
Element.prototype.addS = function(dimen, draw, onframe, transform) {
    var _elm = this.add(draw, onframe, transform);
    _elm.sprite = true;
    _elm.state.dimen = dimen;
    return _elm;
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
// make element band fit all children bands
Element.prototype.makeBandFit = function() {
    var wband = this.findWrapBand();
    this.xdata.gband = wband;
    this.xdata.lband[1] = wband[1] - wband[0];
}
Element.prototype.setBand = function(band) {
    this.xdata.lband = band;
    Bands.recalc(this);
    if (this.scene) this.scene.updateDuration();
}
Element.prototype.duration = function() {
    return this.xdata.lband[1] - this.xdata.lband[0];
}
/* Element.prototype.rel_duration = function() { // TODO: duration cut with global band
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
Element.prototype.fits = function(ltime) {
    if (ltime < 0) return false;
    return (ltime <= (this.xdata.lband[1]
                      - this.xdata.lband[0]));
}
Element.prototype.gtime = function(ltime) {
    return this.xdata.gband[0] + ltime;
}
Element.prototype.ltime = function(gtime) {
    var x = this.xdata;
    switch (x.mode) {
        case C.R_ONCE:
            return this.__checkGJump(gtime);
        case C.R_STAY:
            return (gtime <= x.gband[1])
                   ? (gtime - x.gband[0])
                   : (x.lband[1] - x.lband[0]);
        case C.R_LOOP: {
                var p = this.parent;
                var durtn = x.lband[1] -
                            x.lband[0],
                    pdurtn = p
                        ? (p.xdata.lband[1] -
                           p.xdata.lband[0])
                        : durtn;
                if (durtn < 0) return -1;
                var times = Math.floor(pdurtn / durtn),
                    fits = Math.floor((gtime - x.gband[0]) / durtn);
                if (fits < 0) return -1;
                var t = (gtime - x.gband[0]) - (fits * durtn);
                return (fits <= times) ? this.__checkJump(t) : -1;
            }
        case C.R_BOUNCE: {
                var p = this.parent;
                var durtn = x.lband[1] -
                            x.lband[0],
                    pdurtn = p
                        ? (p.xdata.lband[1] -
                           p.xdata.lband[0])
                        : durtn;
                if (durtn < 0) return -1;
                var times = Math.floor(pdurtn / durtn),
                    fits = Math.floor((gtime - x.gband[0]) / durtn);
                if (fits < 0) return -1;
                var t = (gtime - x.gband[0]) - (fits * durtn),
                    t = ((fits % 2) === 0) ? t : durtn - t;
                return (fits <= times) ? this.__checkJump(t) : -1;
            }
    }
}
Element.prototype.m_on = function(type, handler) {
    return this.__modify(Element.EVENT_MOD, 0, null, function(t) { // FIXME: handlers must have priority?
      if (this.__evt_st & type) {
        var evts = this.__evts[type];
        for (var i = 0; i < evts.length; i++) {
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
// FIXME: test
Element.prototype.findWrapBand = function() {
    var children = this.children;
    if (children.length === 0) return this.xdata.gband;
    var result = [ Number.MAX_VALUE, 0 ];
    this.visitChildren(function(elm) {
        result = Bands.expand(result, elm.findWrapBand());
    });
    return (result[0] !== Number.MAX_VALUE) ? result : null;
}
Element.prototype.dispose = function() {
    this.disposeHandlers();
    this.visitChildren(function(elm) {
        elm.dispose();
    });
}
Element.prototype.reset = function() {
    this.__resetState();
    this.__lastJump = null;
    if (this.__mask) this.__removeMaskCanvases();
    //this.__clearEvtState();
    (function(elm) {
        elm.__forAllModifiers(function(band, modifier) {
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
Element.prototype.stateAt = function(t) { // FIXME: test
    this.lock();
    var success = this.__callModifiers(Element.NOEVT_MODIFIERS, t);
    var state = this.unlock();
    return success ? state : null;
}
Element.prototype.offset = function() {
    var xsum = 0, ysum = 0;
    var p = this.parent;
    while (p) {
        var ps = p.state;
        xsum += ps.lx + ps.x;
        ysum += ps.ly + ps.y;
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
}*/
Element.prototype.lbounds = function() {
    var x = this.xdata;
    if (x.__bounds) return x.__bounds;
    var bounds;
    if (x.path) {
        bounds = x.path.bounds();
    } else if (x.image) {
        bounds = [ 0, 0, x.image.width, x.image.height ];
    } else if (x.text) {
        bounds = x.text.bounds();
    } else return null;
    return bounds;
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
    var scene = this.scene;
    if (!scene) throw new AnimErr('Element to be masked should be attached to scene when rendering');
    this.__maskCvs = newCanvas([scene.awidth, scene.aheight], this.state.ratio);
    this.__maskCtx = this.__maskCvs.getContext('2d');
    this.__backCvs = newCanvas([scene.awidth, scene.aheight], this.state.ratio);
    this.__backCtx = this.__backCvs.getContext('2d');
    // document.body.appendChild(this.__maskCvs);
    // document.body.appendChild(this.__backCvs);
}
Element.prototype.__removeMaskCanvases = function() {
    if (this.__maskCvs) {
        disposeElm(this.__maskCvs);
        this.__maskCvs = null;
        this.__maskCtx = null;
    }
    if (this.__backCvs) {
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
    clone.sprite = this.sprite;
    clone.sheet = this.sheet;
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
    // FIXME: use __forAllModifiers & __forAllPainters
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
    //if (src_x.image) trg_x.image = src_x.image.clone();
    if (src_x.text) trg_x.text = src_x.text.clone();
    trg_x.pos = [].concat(src_x.pos);
    trg_x.reg = [].concat(src_x.reg);
    trg_x.lband = [].concat(src_x.lband);
    trg_x.gband = [].concat(src_x.gband);
    trg_x.keys = obj_clone(src_x.keys);
    return clone;
}
Element.prototype._addChild = function(elm) {
    elm.parent = this;
    this.children.push(elm); // or add elem.id?
    if (this.scene) this.scene._register(elm); // TODO: rollback parent and child?
    Bands.recalc(this);
}
Element.prototype._addChildren = function(elms) {
    for (var ei = 0, el = elms.length; ei < el; ei++) {
        this._addChild(elms[ei]);
    }
}
Element.prototype._drawToCache = function() {
    var dim = this.state.dimen;
    if (this.sheet) dim = [this.xdata.image.width, this.xdata.image.height];
    var _canvas = newCanvas(dim, this.state.ratio);
    var _ctx = _canvas.getContext('2d');
    this.drawTo(_ctx);
    this.xdata.canvas = _canvas;
}
Element.prototype._stateStr = function() {
    var state = this.state;
    return "x: " + s.x + " y: " + s.y + '\n' +
           "lx: " + s.lx + " ly: " + s.ly + '\n' +
           "rx: " + s.rx + " ry: " + s.ry + '\n' +
           "sx: " + s.sx + " sy: " + s.sy + '\n' +
           "angle: " + s.angle + " alpha: " + s.alpha + '\n' +
           "p: " + s.p + " t: " + s.t + " key: " + s.key + '\n';
}
Element._FPS_FALLBACK = FPS_FALLBACK;
Element._FPS_ERROR = FPS_ERROR;
Element.prototype.__adaptModTime = function(ltime, band, state, modifier, easing, afps) {
  var lband = this.xdata.lband,
      elm_duration = lband[1] - lband[0];
  var _tpair = null;
  if (band == null) {
      _tpair = [ ltime / elm_duration, elm_duration ];
  } else if (__array(band)) { // modifier is band-restricted
      //if ((ltime + band[0]) >= elm_duration) return ltime;
      var mod_duration = band[1] - band[0];
      if (ltime < band[0]) return false; //_tpair = [ 0, mod_duration ];
      else if (ltime > band[1]) return false; // _tpair = [ 1, mod_duration ];
      else _tpair = [ (ltime - band[0]) / mod_duration, mod_duration ];
  } else if (__num(band)) {
      if (modifier.__wasCalled && modifier.__wasCalled[this.id]) return false;
      afps = afps || (state._._appliedAt
                      ? (1 / (ltime - state._._appliedAt))
                      : 0) || 0;
      // FIXME: test if afps is not too big
      var tpos = band;
      var doCall = ((afps > 0) &&
                    (ltime >= tpos) &&
                    (ltime <= tpos + ((1 / afps) * FPS_ERROR))) ||
                   ((afps <= 0) && __close(ltime, tpos, 10)) ||
                   ((tpos > (lband[1] - (1 / (afps || FPS_FALLBACK)))) &&
                    ((ltime + (1 / (afps || FPS_FALLBACK))) > lband[1]));
      if (doCall) {
          if (!modifier.__wasCalled) modifier.__wasCalled = {};
          if (!modifier.__wasCalledAt) modifier.__wasCalledAt = {};
          modifier.__wasCalled[this.id] = true;
          modifier.__wasCalledAt[this.id] = ltime;
      }
      if (!doCall) return false;
      _tpair = [ ltime / elm_duration, elm_duration ];
  } else _tpair = [ ltime, elm_duration ];
  return !easing ? _tpair : [ easing(_tpair[0], _tpair[1]), _tpair[1] ];
}
Element.prototype.__callModifiers = function(order, ltime, afps) {
    return (function(elm) {

        // save the previous state
        elm.state._ = null; // clear the pointer, so it will not be cloned
        elm._state = Element.createState(elm);
        elm._state._ = obj_clone(elm.state);

        // now it looks like:
        // this.
        //     .state -> state from the last modifiers call
        //     ._state -> clone of the last state, it is passed to modifiers as `this`
        //     ._state._ -> a pointer to the last state, so it will be accessible in
        //                  modifiers as `this._`

        elm.__loadEvts(elm._state);

        if (!elm.__forAllModifiers(order,
            function(band, modifier, easing, data) { /* each modifier */
                // lbtime is band-apadted time, if modifier has its own band
                var lbtime = elm.__adaptModTime(ltime, band, elm._state, modifier, easing, afps);
                // false will be returned from __adaptModTime
                // for trigger-like modifier if it is required to skip current one
                if (lbtime === false) return true;
                // modifier will return false if it is required to skip all next modifiers,
                // returning false from our function means the same
                return modifier.call(elm._state, lbtime[0], lbtime[1], data);
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
            function(painter, data) { /* each painter */
                painter.call(elm.xdata, ctx, data);
            }, function(type) { /* before each new type */
                elm.__painting = type;
                elm.__pbefore(ctx, type);
            }, function(type) { /* after each new type */
                elm.__pafter(ctx, type);
            });
        elm.__painting = null;
    })(this);
}
Element.prototype.__addTypedModifier = function(type, priority, band, modifier, easing, data) {
    if (!modifier) return; // FIXME: throw some error?
    var modifiers = this._modifiers;
    var priority = priority || 0;
    if (!modifier.__m_ids) modifier.__m_ids = {};
    else if (modifier.__m_ids[this.id]) throw new AnimErr('Modifier was already added to this element');
    if (!modifiers[type]) modifiers[type] = [];
    if (!modifiers[type][priority]) modifiers[type][priority] = [];
    modifiers[type][priority].push([band, modifier, Element.__convertEasing(easing), data]);
    modifier.__m_ids[this.id] = (type << Element.TYPE_MAX_BIT) | (priority << Element.PRRT_MAX_BIT) |
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
                  if (f(modifier[0], modifier[1], modifier[2], modifier[3]) === false) return false;
                } // if cur[ci]
              } // for var ci
            } // if cur = seq[pi]
          } // for var pi
        } // if seq
        if (after_type) after_type(type);
    }
    return true;
}
Element.prototype.__addTypedPainter = function(type, priority, painter, data) {
    if (!painter) return; // FIXME: throw some error?
    var painters = this._painters;
    var priority = priority || 0;
    if (!painter.__p_ids) painter.__p_ids = {};
    else if (painter.__p_ids[this.id]) throw new AnimErr('Painter was already added to this element');
    if (!painters[type]) painters[type] = [];
    if (!painters[type][priority]) painters[type][priority] = [];
    painters[type][priority].push([painter, data]);
    painter.__p_ids[this.id] = (type << Element.TYPE_MAX_BIT) | (priority << Element.PRRT_MAX_BIT) |
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
        this.__lmatrix = Element._getIMatrixOf(this.state);
    }*/
    /*if (!result || (type === Element.EVENT_MOD)) {
        this.__clearEvtState();
    }*/
}
Element.prototype.__pbefore = function(ctx, type) { }
Element.prototype.__pafter = function(ctx, type) { }
Element.prototype.__checkGJump = function(gtime) {
    return this.__checkJump(gtime - this.xdata.gband[0]);
}
Element.prototype.__checkJump = function(at) {
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
       // return (jump_pos + (t - jumped_at))
       return this.__lastJump[1] + (t - this.__lastJump[0]);
       /* // overflow will be checked in fits() method,
       // or recalculated with loop/bounce mode
       // so if this clip longs more than allowed,
       // it will be just ended there
       return ((this.__lastJump + t) > x.gband[1])
             ? (this.__lastJump + t)
             : x.gband[1]; */
    }
    return t;
}
Element.prototype.handle__x = function(type, evt) {
    this.__saveEvt(type, evt);
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
Element.prototype.__postRender = function() {
    // clear detach-queue
    this.__performDetach();
}
Element.prototype.__resetState = function() {
    var s = this.state;
    s.x = 0; s.y = 0;
    s.lx = 0; s.ly = 0;
    s.rx = 0; s.ry = 0;
    s.angle = 0; s.alpha = 1;
    s.sx = 1; s.sy = 1;
    s.p = null; s.t = null; s.key = null;
    s._applied = false;
    s._appliedAt = null;
    s._matrix.reset();
}

// state of the element
Element.createState = function(owner) {
    return { 'x': 0, 'y': 0,   // dynamic position
             'lx': 0, 'ly': 0, // static position
             'rx': 0, 'ry': 0, // registration point shift
             'angle': 0,       // rotation angle
             'sx': 1, 'sy': 1, // scale by x / by y
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
    return { 'pos': [0, 0],      // position in parent clip space
             'reg': [0, 0],      // registration point
             'image': null,    // cached Image instance, if it is an image
             'path': null,     // Path instanse, if it is a shape
             'text': null,     // Text data, if it is a text (`path` holds stroke and fill)
             'mode': C.R_ONCE,            // playing mode
             'lband': [0, Element.DEFAULT_LEN], // local band
             'gband': [0, Element.DEFAULT_LEN], // global band
             'canvas': null,   // own canvas for static (cached) elements
             'dimen': null,    // dimensions for static (cached) elements
             'keys': {},
             'tf': null,
             'acomp': null,    // alpha composition
             '_mpath': null,
             '$': owner };
}
Element.__addSysModifiers = function(elm) {
    // band check performed in checkJump
    //if (xdata.gband) this.__modify(Element.SYS_MOD, 0, null, Render.m_checkBand, xdata.gband);
    elm.__modify(Element.SYS_MOD, 0, null, Render.m_saveReg);
    elm.__modify(Element.SYS_MOD, 0, null, Render.m_applyPos);
}
Element.__addSysPainters = function(elm) {
    elm.__paint(Element.SYS_PNT, 0, Render.p_applyAComp);
    elm.__paint(Element.SYS_PNT, 0, Render.p_drawPath);
    elm.__paint(Element.SYS_PNT, 0, Render.p_drawImage);
    elm.__paint(Element.SYS_PNT, 0, Render.p_drawText);
}
Element.__addDebugRender = function(elm) {
    elm.__paint(Element.DEBUG_PNT, 0, Render.p_drawReg);
    elm.__paint(Element.DEBUG_PNT, 0, Render.p_drawName);
    //elm.__paint(Element.DEBUG_PNT, 1, Render.p_drawMPath);

    elm.on(C.X_DRAW, Render.h_drawMPath); // to call out of the 2D context changes
}
Element.__addTweenModifier = function(elm, tween) { // FIXME: improve modify with adding object same way,
                                                    // include easing in all modifiers
    var m_tween = Tweens[tween.type]();
    return elm.__modify(Element.TWEEN_MOD, Tween.TWEENS_PRIORITY[tween.type],
                        tween.band, m_tween,
                        tween.easing,
                        tween.data);
}
Element.__convertEasing = function(easing, data) {
  if (!easing) return null;
  if (typeof easing === 'string') return EasingImpl[easing](data);
  if ((typeof easing === 'function') && !data) return easing;
  if ((typeof easing === 'function') && data) return easing(data);
  if (easing.type) return EasingImpl[easing.type](easing.data || data);
  if (easing.f) return easing.f(easing.data || data);
}

Element._getMatrixOf = function(s, m) {
    var _t = (m ? (m.reset(), m)
                : new Transform());
    _t.translate(s.lx, s.ly);
    _t.translate(s.x, s.y);
    _t.rotate(s.angle);
    _t.scale(s.sx, s.sy);
    _t.translate(-s.rx, -s.ry);
    return _t;
}
Element._getIMatrixOf = function(s, m) {
    var _t = Element._getMatrixOf(s, m);
    _t.invert();
    return _t;
}
Element.imgFromUrl = prepareImage;

var Clip = Element;

// =============================================================================
// === EVENTS ==================================================================

// adds specified events support to the `subj` object. `subj` object receives
// `handlers` property that keeps the listeners for each event. Also, it gets
// `e_<evt_name>` function for every event provided to call it when it is
// required to call all handlers of all of thise event name
// (`fire('<evt_name>', ...)` is the same but can not be reassigned by user).
// `subj` can define `handle_<evt_name>` function to handle concrete event itself,
// but without messing with other handlers.
// And, user gets `on` function to subcribe to events and `provides` to check
// if it is allowed.
function provideEvents(subj, events) {
    subj.prototype._initHandlers = (function(evts) { // FIXME: make automatic
        return function() {
            var _hdls = {};
            this.handlers = _hdls;
            for (var ei = 0; ei < evts.length; ei++) {
                _hdls[evts[ei]] = [];
            }
        };
    })(events);
    subj.prototype.on = function(event, handler) {
        if (!this.provides(event)) throw new AnimErr('Event \'' + C.__enmap[event] +
                                                     '\' not provided by ' + this);
        if (!handler) throw new AnimErr('You are trying to assign ' +
                                        'undefined handler for event ' + event);
        this.handlers[event].push(handler);
        return (this.handlers[event].length - 1);
    };
    subj.prototype.fire = function(event, evtobj) {
        if (!this.provides(event)) throw new AnimErr('Event \'' + C.__enmap[event] +
                                                     '\' not provided by ' + this);
        if (this.disabled) return;
        if (this.handle__x && !(this.handle__x(event, evtobj))) return;
        var name = C.__enmap[event];
        if (this['handle_'+name]) this['handle_'+name](evtobj);
        var _hdls = this.handlers[event];
        for (var hi = 0; hi < _hdls.length; hi++) {
            _hdls[hi].call(this, evtobj);
        }
    };
    subj.prototype.provides = (function(evts) {
        return function(event) {
            if (!event) return evts;
            return this.handlers.hasOwnProperty(event);
        }
    })(events);
    subj.prototype.unbind = function(event, idx) {
        if (!this.provides(event)) throw new AnimErr('Event ' + event +
                                                     ' not provided by ' + this);
        if (this.handlers[event][idx]) {
            this.handlers[event].splice(idx, 1);
        } else {
            throw new AnimErr('No such handler ' + idx + ' for event ' + event);
        }
    };
    subj.prototype.disposeHandlers = function() {
        var _hdls = this.handlers;
        for (var evt in _hdls) {
            if (_hdls.hasOwnProperty(evt)) _hdls[evt] = [];
        }
    }
    // FIXME: call fire/e_-funcs only from inside of their providers,
    // TODO: wrap them with event objects
    var _event;
    for (var ei = 0; ei < events.length; ei++) {
        _event = events[ei];
        subj.prototype['e_'+_event] = (function(event) {
            return function(evtobj) {
                this.fire(event, evtobj);
            };
        })(_event);
    }
    // subj.prototype.before = function(event, handler) { }
    // subj.prototype.after = function(event, handler) { }
    // subj.prototype.provide = function(event, provider) { }
}

function kevt(e) {
    return { key: ((e.keyCode != null) ? e.keyCode : e.which),
             ch: e.charCode };
}

function mevt(e, cvs) {
    return { pos: [ e.pageX - cvs.__rOffsetLeft,
                    e.pageY - cvs.__rOffsetTop ] };
}

// =============================================================================
// === DRAWING =================================================================

var D = {}; // means "Drawing"

// draws current state of animation on canvas and postpones to call itself for
// the next time period (so to start animation, you just need to call it once
// when the first time must occur and it will chain its own calls automatically)
D.drawNext = function(ctx, state, scene, before, after) {
    // NB: state here is a player state, not an element state

    if (state.happens !== C.PLAYING) return;

    var msec = (Date.now() - state.__startTime);
    var sec = msec / 1000;

    var time = (sec * state.speed) + state.from;
    state.time = time;

    if (before) {
        if (!before(time)) return;
    }

    if (state.__rsec === 0) state.__rsec = msec;
    if ((msec - state.__rsec) >= 1000) {
        state.afps = state.__redraws;
        state.__rsec = msec;
        state.__redraws = 0;
    }
    state.__redraws++;

    ctx.clearRect(0, 0, state.width * state.ratio,
                        state.height * state.ratio);

    scene.render(ctx, time, state.zoom * state.ratio, state.afps);

    // show fps
    if (state.debug) { // TODO: move to player.onrender
        D.drawFPS(ctx, state.afps);
    }

    if (after) {
        if (!after(time)) return;
    }

    if (state.__supressFrames) return;

    return __nextFrame(function() {
        D.drawNext(ctx, state, scene, before, after);
    });

}
/* D.drawAt = function(ctx, state, scene, time) {
    ctx.clearRect(0, 0, state.width, state.height);
    scene.render(ctx, time);
} */
D.drawFPS = function(ctx, fps) {
    ctx.fillStyle = '#999';
    ctx.font = '20px sans-serif';
    ctx.fillText(Math.floor(fps), 8, 20);
}

// === DRAWING: UTILS ==========================================================

var DU = {}; // means "Drawing Utils"

// FIXME: move to `Path`?
DU.applyStroke = function(ctx, stroke) {
    if (!stroke) return;
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke._style // calculated once for stroke
                      || (stroke._style = Path.createStyle(ctx, stroke));
    ctx.lineCap = stroke.cap;
    ctx.lineJoin = stroke.join;
}

// FIXME: move to `Path`?
DU.applyFill = function(ctx, fill) {
    if (!fill) return;
    ctx.fillStyle = fill._style // calculated once for fill
                  || (fill._style = Path.createStyle(ctx, fill));
}

DU._hasVal = function(fsval) {
    return (fsval && (fsval.color || fsval.lgrad || fsval.rgrad));
}

// FIXME: move to `Path`?
DU.qDraw = function(ctx, stroke, fill, func) {
    ctx.save();
    ctx.beginPath();
    DU.applyFill(ctx, fill);
    DU.applyStroke(ctx, stroke);
    func();
    ctx.closePath();

    if (DU._hasVal(fill)) ctx.fill();
    if (DU._hasVal(stroke)) ctx.stroke();
    ctx.restore();
}

// =============================================================================
// === IMPORT ==================================================================

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
        scene.visitElems(Element.__addDebugRender);
    // assign
    player.anim = scene;
    // update duration
    if (!player.state.duration) {
        if (player.mode & C.M_DYNAMIC) scene.duration = Number.MAX_VALUE;
        player.setDuration(scene.duration);
    }
    scene.awidth = player.state.width;
    scene.aheight = player.state.height;
    if (callback) callback.call(player);
}
L.loadClips = function(player, clips, callback) {
    var _anim = new Scene();
    _anim.add(clips);
    L.loadScene(player, _anim, callback);
}
L.loadBuilder = function(player, builder, callback) {
    var _anim = new Scene();
    _anim.add(builder.v);
    L.loadScene(player, _anim, callback);
}

// =============================================================================
// === CUSTOM RENDERING ========================================================

var Render = {}; // means "Render", system modifiers & painters

Render.p_drawReg = function(ctx, reg) {
    if (!(reg = reg || this.reg)) return;
    ctx.save();
    ctx.translate(reg[0],reg[1]);
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#600';
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 0);
    ctx.moveTo(3, 0);
    //ctx.moveTo(0, 5);
    ctx.arc(0,0,3,0,Math.PI*2,true);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

Render.p_drawPath = function(ctx, path) {
    if (!(path = path || this.path)) return;
    path.apply(ctx);
}

Render.p_drawImage = function(ctx, image) {
    if (!(image = image || this.image)) return;
    ctx.save();
    if (image.isReady) ctx.drawImage(image, 0, 0);
    ctx.restore();
}

Render.p_drawText = function(ctx, text) {
    if (!(text = text || this.text)) return;
    text.apply(ctx);
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

Render.h_drawMPath = function(ctx, mPath) {
    if (!(mPath = mPath || this.state._mpath)) return;
    ctx.save();
    var s = this.state;
    ctx.translate(s.lx, s.ly);
    mPath.cstroke('#600', 2.0);
    ctx.beginPath();
    mPath.apply(ctx);
    ctx.closePath();
    ctx.stroke();
    ctx.restore()
}

Render.m_checkBand = function(time, duration, band) {
    if (band[0] > (duration * time)) return false; // exit
    if (band[1] < (duration * time)) return false; // exit
}

Render.m_saveReg = function(time, duration, reg) {
    if (!(reg = reg || this.$.xdata.reg)) return;
    this.rx = reg[0];
    this.ry = reg[1];
}

Render.m_applyPos = function(time, duration, pos) {
    if (!(pos = pos || this.$.xdata.pos)) return;
    this.lx = pos[0];
    this.ly = pos[1];
}

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
}// makes band maximum wide to fith both bands
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

// =============================================================================
// === TWEENS ==================================================================

// Tween constants

C.T_TRANSLATE   = 'TRANSLATE';
C.T_SCALE       = 'SCALE';
C.T_ROTATE      = 'ROTATE';
C.T_ROT_TO_PATH = 'ROT_TO_PATH';
C.T_ALPHA       = 'ALPHA';

var Tween = {};
var Easing = {};

// tween order
Tween.TWEENS_PRIORITY = {};

Tween.TWEENS_PRIORITY[C.T_TRANSLATE]   = 0;
Tween.TWEENS_PRIORITY[C.T_SCALE]       = 1;
Tween.TWEENS_PRIORITY[C.T_ROTATE]      = 2;
Tween.TWEENS_PRIORITY[C.T_ROT_TO_PATH] = 3;
Tween.TWEENS_PRIORITY[C.T_ALPHA]       = 4;

Tween.TWEENS_COUNT = 5;

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

// function-based easings

// Easings constants

C.E_PATH = 'PATH'; // Path
C.E_FUNC = 'FUNC'; // Function
C.E_CSEG = 'CSEG'; // Function
//C.E_CINOUT = 'CINOUT'; // Cubic InOut
//....

var EasingImpl = {};

EasingImpl[C.E_PATH] =
    function(path) {
        //var path = Path.parse(str);
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

// =============================================================================
// === PATHS ===================================================================

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
// ======================================================

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
function Path(str, stroke, fill) {
    this.str = str;
    this.stroke = stroke;
    this.fill = fill;
    this.segs = [];
    this.parse(str);
}

Path.DEFAULT_CAP = C.PC_ROUND;
Path.DEFAULT_JOIN = C.PC_ROUND;
Path.DEFAULT_FILL = { 'color': 'transparent' };
Path.BASE_FILL = { 'color': '#dfdfdf' };
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
    for (var si = 0; si < segments.length; si++) {
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
    DU.qDraw(ctx, p.stroke || Path.DEFAULT_STROKE,
                  p.fill || Path.DEFAULT_FILL,
             function() { p.visit(Path._applyVisitor, ctx); });

    /*ctx.beginPath();
    DU.applyFill(ctx, this.fill || Path.DEFAULT_FILL);
    DU.applyStroke(ctx, this.stroke || Path.DEFAULT_STROKE);
    this.visit(this._applyVisitor,ctx);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();*/

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
        var pts = segment.pts;
        for (var pi = 0; pi < pts.length; pi+=2) {
            minX = Math.min(minX, pts[pi]);
            maxX = Math.max(maxX, pts[pi]);
        }
        for (var pi = 1; pi < pts.length; pi+=2) {
            minY = Math.min(minY, pts[pi]);
            maxY = Math.max(maxY, pts[pi]);
        }
    });
    return [ minX, minY, maxX, maxY ];
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
// TODO: rename to `modify`?
Path.prototype.vpoints = function(func) {
    this.visit(function(segment) {
        var pts = segment.pts;
        for (var pi = 0; pi < pts.length; pi+=2) {
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
// create canvas-compatible style from brush
Path.createStyle = function(ctx, brush) {
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
    // FIXME: cache length data and points somewhere
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
    //var p = this.atT(start, t);
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

// =============================================================================
// === TEXT ====================================================================

Text.DEFAULT_CAP = C.PC_ROUND;
Text.DEFAULT_JOIN = C.PC_ROUND;
Text.DEFAULT_FFACE = 'sans-serif';
Text.DEFAULT_FSIZE = 12;
Text.DEFAULT_FONT = Text.DEFAULT_FSIZE + 'px ' + Text.DEFAULT_FFACE;
Text.DEFAULT_FILL = { 'color': '#000' };
Text.BASELINE_RULE = 'bottom';
Text.DEFAULT_STROKE = null/*Path.EMPTY_STROKE*/;
function Text(lines, font,
              stroke, fill) {
    this.lines = lines;
    this.font = font || Text.DEFAULT_FONT;
    this.stroke = stroke || Text.DEFAULT_STROKE;
    this.fill = fill || Text.DEFAULT_FILL;
    this._bnds = null;
}
Text.prototype.apply = function(ctx, point) {
    ctx.save();
    var point = point || [0, 0],
        dimen = this.dimen(),
        accent = this.accent(dimen[1]),
        apt = [ point[0] - dimen[0]/2,
                point[1] + accent - dimen[1]/2];
    ctx.font = this.font;
    ctx.textBaseline = Text.BASELINE_RULE;
    if (this.fill) {
        DU.applyFill(ctx, this.fill);
        var x = apt[0], y = apt[1];
        this.visitLines(function(line) {
            ctx.fillText(line, x, y);
            y += 1.2 * accent;
        });
    }
    if (this.stroke) {
        DU.applyStroke(ctx, this.stroke);
        var x = apt[0], y = apt[1];
        this.visitLines(function(line) {
            ctx.strokeText(line, x, y);
            y += 1.2 * accent;
        });
    }
    ctx.restore();
}
Text.prototype.dimen = function() {
    if (this._dimen) return this._dimen;
    if (!Text.__buff) throw new SysErr('no Text buffer, bounds call failed');
    var buff = Text.__buff;
    buff.style.font = this.font;
    buff.innerText = this.lines;
    return (this._dimen = [ buff.offsetWidth,
                            buff.offsetHeight ]);

}
Text.prototype.bounds = function() {
    var dimen = this.dimen();
    return [ 0, 0, dimen[0], dimen[1] ];
}
Text.prototype.accent = function(height) {
    return height; // FIXME
}
Text._createBuffer = function() {
    // FIXME: dispose buffer when text is removed from scene
    var _div = document.createElement('div');
    _div.style.visibility = 'hidden';
    _div.style.position = 'absolute';
    var _span = document.createElement('span');
    _div.appendChild(_span);
    document.body.appendChild(_div);
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
    if (typeof lines === 'string') {
        func(lines, data);
    } else {
        var line;
        for (var i = 0, ilen = lines.length; i < ilen; i++) {
            line = lines[i];
            func(line, data);
        }
    }
}
Text.prototype.clone = function() {
    var c = new Text(this.lines, this.font,
                     this.stroke, this.fill);
    if (this.lines && Array.isArray(this.lines)) {
        c.lines = [].concat(this.lines);
    }
    if (this.stroke) c.stroke = obj_clone(this.stroke);
    if (this.fill) c.fill = obj_clone(this.fill);
    return c;
}

// =============================================================================
// === CONTROLS ================================================================

function Controls(player) {
    this.player = player;
    this.canvas = null;
    this.ctx = null;
    this.ready = false;
    this.bounds = [];
    this.hidden = false;
    this.elapsed = false;
    this._time = -1000;
    this._ratio = 1;
    this._lhappens = C.NOTHING;
    this._initHandlers(); // TODO: make automatic
    this._inParent = player.inParent;
}
// TODO: move these settings to default css rule?
Controls.HEIGHT = 40;
Controls.MARGIN = 5;
Controls.OPACITY = 0.8;
Controls.DEF_FGCOLOR = '#faa';
Controls.DEF_BGCOLOR = '#c22';
Controls._BH = Controls.HEIGHT - (Controls.MARGIN + Controls.MARGIN);
Controls._TS = Controls._BH; // text size
Controls._TW = Controls._TS * 4.4; // text width
provideEvents(Controls, [C.X_MDOWN, C.X_DRAW]);
Controls.prototype.update = function(parent) {
    var _ratio = parent.__pxRatio,
        _w = parent.width / _ratio,
        _h = Controls.HEIGHT,
        _hdiff = (parent.height / _ratio) - Controls.HEIGHT,
        _pp = find_pos(parent), // parent position
        _bp = [ _pp[0], _pp[1] + _hdiff ], // bounds position
        _cp = this._inParent ? [ parent.parentNode.offsetLeft,
                                 parent.parentNode.offsetTop + _hdiff ]
                             : _bp; // position to set in styles
    var _canvas = this.canvas;
    if (!_canvas) {
        _canvas = newCanvas([ _w, _h ], _ratio);
        if (parent.id) { _canvas.id = '__'+parent.id+'_ctrls'; }
        _canvas.className = 'anm-controls';
        _canvas.style.position = 'absolute';
        _canvas.style.opacity = Controls.OPACITY;
        _canvas.style.zIndex = 100;
        this.id = _canvas.id;
        this.canvas = _canvas;
        this.ctx = _canvas.getContext('2d');
        this.subscribeEvents(_canvas);
        this.hide();
        this.changeColor(Controls.DEF_FGCOLOR);
    } else {
        canvasOpts(_canvas, [ _w, _h ], _ratio);
    }
    _canvas.style.left = _cp[0] + 'px';
    _canvas.style.top = _cp[1] + 'px';
    this._ratio = _ratio;
    this.ctx.font = Math.floor(Controls._TS) + 'px sans-serif';
    if (!this.ready) {
        var appendTo = this._inParent ? parent.parentNode
                                      : document.body;
        // FIXME: a dirty hack?
        if (this._inParent) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(_canvas);
        this.ready = true;
    }
    if (!_canvas.style.backgroundColor) _canvas.style.backgroundColor = Controls.DEF_BGCOLOR;
    this.bounds = [ _bp[0], _bp[1], _bp[0]+(_w*_ratio),
                                    _bp[1]+(_h*_ratio) ];
}
Controls.prototype.subscribeEvents = function(canvas) {
    canvas.addEventListener('mousedown', (function(controls) {
            return function(evt) {
                controls.fire(C.X_MDOWN, evt);
            };
        })(this), false);
    canvas.addEventListener('mouseout', (function(controls) {
            return function(evt) {
                controls.hide();
            };
        })(this), false);
}
Controls.prototype.render = function(state, time) {
    if (this.hidden && !this.__force) return;

    var _s = state.happens;
    var time = (time > 0) ? time : 0;
    if (!this.__force &&
        (time === this._time) &&
        (_s === this._lhappens)) return;
    this._time = time;
    this._lhappens = _s;

    var ctx = this.ctx,
        _ratio = this._ratio; // pixelRatio (or use this.canvas.__pxRatio?)
    var _bh = Controls._BH, // button height
        _w = this.bounds[2] - this.bounds[0],
        _h = this.bounds[3] - this.bounds[1],
        _m = Controls.MARGIN,
        _tw = Controls._TW, // text width
        _pw = (_w / _ratio) - ((_m * 4) + _tw + _bh); // progress width
    // TODO: update only progress if state not changed?
    ctx.clearRect(0, 0, _w, _h);
    ctx.save();
    if (_ratio != 1) ctx.scale(_ratio, _ratio);
    ctx.translate(_m, _m);
    ctx.fillStyle = this.canvas.style.color || this.__fgcolor || Controls.DEF_FGCOLOR;

    // play/pause/stop button
    if (_s === C.PLAYING) {
        // pause button
        Controls.__pause_btn(ctx);
    } else if (_s === C.STOPPED) {
        // play button
        Controls.__play_btn(ctx);
    } else if (_s === C.PAUSED) {
        // play button
        Controls.__play_btn(ctx);
    } else {
        // stop button
        Controls.__stop_btn(ctx);
    }

    // progress
    ctx.translate(_bh + _m, 0);
    Controls.__progress(ctx, _pw, time, state.duration);

    // time
    ctx.translate(_pw + _m, 0);
    Controls.__time(ctx, this.elapsed
                         ? (time - state.duration) : time);

    ctx.restore();
    this.fire(C.X_DRAW, state);

    this.__force = false;
}
// TODO: take initial state from imported project
Controls.prototype.hide = function() {
    this.hidden = true;
    this.canvas.style.display = 'none';
}
Controls.prototype.show = function() {
    this.hidden = false;
    this.canvas.style.display = 'block';
}
Controls.prototype.reset = function() {
    this._time = -1000;
    this.elapsed = false;
}
Controls.prototype.detach = function(parent) {
    (this._inParent ? parent.parentNode
                    : document.body).removeChild(this.canvas);
}
Controls.prototype.handle_mdown = function(event) {
    if (this.hidden) return;
    var _lx = event.pageX - this.bounds[0],
        _ly = event.pageY - this.bounds[1],
        _bh = Controls._BH,
        _m = Controls.MARGIN,
        _tw = Controls._TW,
        _w = this.bounds[2] - this.bounds[0],
        _ratio = this._ratio;
    if (_lx < (_bh + _m + (_m / 2))) { // play button area
        var _s = this.player.state.happens;
        if (_s === C.STOPPED) {
            this.player.play(0);
        } else if (_s === C.PAUSED) {
            this.player.play(this._time);
        } else if (_s === C.PLAYING) {
            this.player.pause();
        }
    } else if (_lx < (_w - (_tw + _m))) { // progress area
        var _s = this.player.state.happens;
        if (_s === C.NOTHING) return;
        var _pw = (_w / _ratio) - ((_m * 4) + _tw + _bh), // progress width
            _px = _lx - (_bh + _m + _m), // progress leftmost x
            _d = this.player.state.duration;
        var _tpos = _px / (_pw / _d); // time position
        if (_s === C.PLAYING) {
            this.player.pause();
            this.player.play(_tpos);
        }
        else if ((_s === C.PAUSED) ||
                 (_s === C.STOPPED)) {
            this.player.drawAt(_tpos);
        }
    } else { // time area
        this.elapsed = !this.elapsed;
    }
}
Controls.prototype.inBounds = function(point) {
    if (this.hidden) return false;
    var _b = this.bounds;
    return (point[0] >= _b[0]) &&
           (point[0] <= _b[2]) &&
           (point[1] >= _b[1]) &&
           (point[1] <= _b[3]);
}
Controls.prototype.evtInBounds = function(evt) {
    if (this.hidden) return false;
    return this.inBounds([evt.pageX, evt.pageY]);
}
Controls.prototype.changeColor = function(front) {
    this.__fgcolor = front;
}
Controls.prototype.forceNextRedraw = function() {
    this.__force = true;
}
Controls.__play_btn = function(ctx) {
    var _bh = Controls._BH;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(_bh, _bh / 2);
    ctx.lineTo(0, _bh);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.closePath();
}
Controls.__pause_btn = function(ctx) {
    var _bh = Controls._BH;
    var _w = _bh / 2.3;
    var _d = _bh - (_w + _w);
    var _nl = _w + _d;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(_w, 0);
    ctx.lineTo(_w, _bh);
    ctx.lineTo(0, _bh);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(_nl, 0);
    ctx.lineTo(_bh, 0);
    ctx.lineTo(_bh, _bh);
    ctx.lineTo(_nl, _bh);
    ctx.lineTo(_nl, 0);
    ctx.fill();
    ctx.closePath();
}
Controls.__stop_btn = function(ctx) {
    var _bh = Controls._BH;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(_bh, 0);
    ctx.lineTo(_bh, _bh);
    ctx.lineTo(0, _bh);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.closePath();
}
Controls.__time = function(ctx, time) {
    var _bh = Controls._BH,
        _time = Math.abs(time),
        _h = Math.floor(_time / 3600),
        _m = Math.floor((_time - (_h * 3600)) / 60),
        _s = Math.floor(_time - (_h * 3600) - (_m * 60));
    ctx.fillText(((time < 0) ? '(' : '[') +
                 ((_h < 10) ? ('0' + _h) : _h) + ':' +
                 ((_m < 10) ? ('0' + _m) : _m) + ':' +
                 ((_s < 10) ? ('0' + _s) : _s) +
                 ((time < 0) ? ')' : ']'), 0, _bh - 4);
}
Controls.__progress = function(ctx, _w, time, duration) {
    var _bh = Controls._BH,
        _m = Controls.MARGIN,
        _px = (_w / duration) * time,
        _lh = _bh / 4,
        _ly = (_bh - _lh) / 2;
    ctx.beginPath();
    ctx.moveTo(0, _ly);
    ctx.lineTo(_w, _ly);
    ctx.lineTo(_w, _ly+_lh);
    ctx.lineTo(0, _ly+_lh);
    ctx.lineTo(0, _ly);
    ctx.fill();
    ctx.closePath();
    if (duration == 0) return;
    ctx.beginPath();
    ctx.moveTo(_px, 0);
    ctx.lineTo(_px+5, 0);
    ctx.lineTo(_px+5, _bh);
    ctx.lineTo(_px, _bh);
    ctx.lineTo(_px, 0);
    ctx.fill();
    ctx.closePath();
}

// =============================================================================
// === INFO BLOCK ==============================================================

function InfoBlock(player) {
    this.div = null;
    this.ready = false;
    this.hidden = false;
    this._inParent = player.inParent;
}
// TODO: move these settings to default css rule?
InfoBlock.DEF_BGCOLOR = '#fff';
InfoBlock.DEF_FGCOLOR = '#000';
InfoBlock.OPACITY = 0.85;
InfoBlock.HEIGHT = 60;
InfoBlock.PADDING = 4;
InfoBlock.prototype.detach = function(parent) {
    (this._inParent ? parent.parentNode
                    : document.body).removeChild(this.div);
}
InfoBlock.prototype.update = function(parent) {
    var _p = InfoBlock.PADDING,
        _w = parent.width - (_p + _p),
        _h = InfoBlock.HEIGHT - (_p + _p),
        _pp = this._inParent ? [ parent.parentNode.offsetLeft,
                                 parent.parentNode.offsetTop ]
                             : find_pos(parent),
        _l = _pp[0],
        _t = _pp[1];
    var _div = this.div;
    if (!_div) {
        _div = document.createElement('div');
        if (parent.id) { _div.id = '__'+parent.id+'_info'; }
        _div.className = 'anm-info';
        _div.style.position = 'absolute';
        _div.style.opacity = InfoBlock.OPACITY;
        _div.style.zIndex = 100;
        if (!_div.style.fontSize) _div.style.fontSize = '10px';
        _div.style.padding = _p+'px';
        this.div = _div;
        this.id = _div.id;
        this.hide();
    }
    _div.style.width = _w + 'px';
    _div.style.height = _h + 'px';
    _div.style.top = _t + 'px';
    _div.style.left = _l + 'px';
    this.bounds = [ _l, _t, _l+_w, _t+_h ];
    if (!this.ready) {
        var appendTo = this._inParent ? parent.parentNode
                                      : document.body;
        // FIXME: a dirty hack?
        if (this._inParent) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(_div);
        this.ready = true;
    }
    if (!_div.style.color) _div.style.color = InfoBlock.DEF_FGCOLOR;
    if (!_div.style.backgroundColor) _div.style.backgroundColor = InfoBlock.DEF_BGCOLOR;
}
InfoBlock.prototype.inject = function(meta, anim) {
    // TODO: show speed
    this.div.innerHTML = '<p><span class="title">'+(meta.title || '[No title]')+'</span>'+
            (meta.author ? ' by <span class="author">'+meta.author+'</span>' : '')+'<br/> '+
            '<span class="duration">'+anim.duration+'sec</span>'+', '+
            (((anim.width!=null) && (anim.height!=null))
             ? '<span class="dimen">'+anim.width+'x'+anim.height+'</span>'+'<br/> ' : '')+
            '<span class="copy">'+(meta.version ? ('v'+meta.version+' ') : '')
                                 +meta.copyright+'</span>'+' '+
            (meta.description ? '<br/><span class="desc">'+meta.description+'</span>' : '')+
            '</p>';
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
    this.div.style.display = 'none';
}
InfoBlock.prototype.show = function() {
    this.hidden = false;
    this.div.style.display = 'block';
}
InfoBlock.prototype.setDuration = function(value) {
    this.div.getElementsByClassName('duration')[0].innerHTML = value+'sec';
}
InfoBlock.prototype.changeColors = function(front, back) {
    this.div.style.color = front;
    this.div.style.backgroundColor = back;
}

// ==== STRINGS ================================================================

var Strings = {};

Strings.LOADING = 'Loading...';
Strings.LOADING_ANIMATION = 'Loading {0}...';

// ==== ERRORS =================================================================

// TODO: Move Scene and Element errors here ?

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
Errors.P.AFTERFRAME_BEFORE_PLAY = 'Please assign afterFrame callback before calling play()';
Errors.P.PASSED_TIME_VALUE_IS_NO_TIME = 'Given time is not allowed, it is treated as no-time';
Errors.P.PASSED_TIME_NOT_IN_RANGE = 'Passed time ({0}) is not in scene range';
Errors.P.INIT_TWICE = 'Initialization was called twice';
Errors.P.INIT_AFTER_LOAD = 'Initialization was called after loading a scene';
Errors.A.ELEMENT_IS_REGISTERED = 'This element is already registered in scene';
Errors.A.ELEMENT_IS_NOT_REGISTERED = 'There is no such element registered in scene';
Errors.A.UNSAFE_TO_REMOVE = 'Unsafe to remove, please use iterator-based looping (with returning false from iterating function) to remove safely';
Errors.A.NO_ELEMENT_TO_REMOVE = 'Please pass some element or use detach() method';
Errors.A.NO_ELEMENT = 'No such element found';
Errors.A.ELEMENT_NOT_ATTACHED = 'Element is not attached to something at all';
Errors.A.MODIFIER_NOT_ATTACHED = 'Modifier wasn\'t applied to anything';

// =============================================================================
// === EXPORTS =================================================================

var exports = {

    'C': C, // constants
    'M': M, // modules
    'Player': Player,
    'Scene': Scene,
    'Element': Element,
    'Clip': Clip,
    'Path': Path, 'Text': Text,
    'Tweens': Tweens, 'Tween': Tween, 'Easing': Easing,
    'Render': Render, 'Bands': Bands, // why Render and Bands classes are visible to pulic?
    'MSeg': MSeg, 'LSeg': LSeg, 'CSeg': CSeg,
    'DU': DU, // why DU class is visible to pulic?
    'Errors': Errors, 'SystemError': SystemError,
                      'PlayerError': PlayerError,
                      'AnimationError': AnimationError,
    'MODULES': {},

    'obj_clone': obj_clone,

    'createPlayer': function(cvs, opts) { var p = new Player();
                                          p.init(cvs, opts); return p; },
    'ajax': ajax,
    '_typecheck': { builder: __builder,
                    array: __array,
                    num: __num },

    '__dev': { 'strf': _strf/*,
               'Controls': Controls, 'Info': InfoBlock*/ },

};

exports._$ = exports.createPlayer;
//exports.__js_pl_all = this;
exports.__injectToWindow = function(as) {
          window[as] = exports;
          window.createPlayer = exports.createPlayer;
        };

return exports;

}); // end of anonymous wrapper