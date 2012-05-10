/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _define; 
if (typeof define !== "function") {
   this.define = function(name, func) {
      func().__injectToWindow(name);
   };
};

define("anm", function() {

// === UTILS ===================================================================
// =============================================================================

// assigns to call a function on next animation frame
// http://www.html5canvastutorials.com/advanced/html5-canvas-start-and-stop-an-animation/
/*var */__nextFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        return window.setTimeout(callback, 1000 / 60);
    };
})();

// collects all characters from string
// before specified char, starting from start 
function __collect_to(str, start, char) {
    var result = '';
    for (var i = start; str[i] !== char; i++) {
        if (i === str.length) throw new Error('Reached end of string');
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

function arr_remove(arr, idx) {
    return arr.slice(0,i).concat( arr.slice(i+1) );   
}
// for one-level objects, so no hasOwnProperty check
function obj_clone(what) {
    var dest = {};
    for (var prop in what) {
        dest[prop] = what[prop];
    }
    return dest;
}
// for one-level objects, so no hasOwnProperty check
/*function obj_copy(what, dest) {
    for (var prop in what) {
        dest[prop] = what[prop];
    }
    return dest;
}*/

function find_pos(elm) {
    var curleft = curtop = 0;
    do {
        curleft += elm.offsetLeft;
        curtop += elm.offsetTop;
    } while (elm && (elm = elm.offsetParent));
    return [ curleft, curtop ];
}

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
                throw new Error('No AJAX/XMLHttp support');
            }
        }
    }

    //if (req.overrideMimeType) { // optional
    //  req.overrideMimeType('text/xml');
    //}

    if (!req) {
      throw new Error('Failed to create XMLHttp instance');
      return;
    }

    var whenDone = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                if (callback) callback(req);
            } else {
                throw new Error('AJAX request for ' + url + 
                                ' returned ' + req.status + 
                                ' instead of 200');
            }
        }
    };

    req.onreadystatechange = whenDone;
    req.open('GET', url, true);
    req.send(null); 
}

function canvasOpts(canvas, opts) {
    if (!opts.push) { // object, not array // FIXME: test with typeof
        var _w = opts.width ? Math.floor(opts.width) : 0;
        var _h = opts.height ? Math.floor(opts.height) : 0;
        //canvas.width = _w;
        //canvas.height = _h;
        canvas.setAttribute('width', _w);
        canvas.setAttribute('height', _h);
        if (opts.bgcolor) { 
            canvas.style.backgroundColor = opts.bgcolor; };
    } else { // array
        var _w = Math.floor(opts[0]);
        var _h = Math.floor(opts[1]);
        //canvas.width = _w;
        //canvas.height = _h;
        canvas.setAttribute('width', _w);
        canvas.setAttribute('height', _h);
    }
}

function newCanvas(dimen) {
    var _canvas = document.createElement('canvas');
    canvasOpts(_canvas, [ dimen[0], dimen[1] ]);
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
    _img.src = url;
    return _img;
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
C.M_PREVIEW = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED       
              | C.M_DO_NOT_HANDLE_EVENTS;
C.M_DYNAMIC = C.M_CONTROLS_DISABLED
              | C.M_INFO_DISABLED
              | C.M_HANDLE_EVENTS;
C.M_VIDEO = C.M_CONTROLS_ENABLED
            | C.M_INFO_ENABLED       
            | C.M_DO_NOT_HANDLE_EVENTS;


// EVENTS

// mouse
C.X_MCLICK = 1;
C.X_MDCLICK = 2;
C.X_MUP = 4;
C.X_MDOWN = 8;
C.X_MMOVE = 16;

C.XT_MOUSE = C.X_MCLICK | C.X_MDCLICK | 
             C.X_MUP | C.X_MDOWN | C.X_MMOVE;

// keyboard
C.X_KPRESS = 32;
C.X_KUP = 64;
C.X_KDOWN = 128;

C.XT_KEYBOARD = C.X_KPRESS | C.X_KUP | C.X_KDOWN;

// controllers
C.XT_CONTROL = C.XT_KEYBOARD | C.XT_MOUSE;

// draw
C.X_DRAW = 256;

// playing
C.X_PLAY = 'play';
C.X_PAUSE = 'pause';
C.X_STOP = 'stop';
C.X_LOAD = 'load';
C.X_ERROR = 'error';

// === PLAYER ==================================================================
// =============================================================================

/*
 `id` is canvas id

 you may pass null for options, but if you provide them, at least `mode` is required
 to be set (all other are optional).

 options format:
  { "debug": false,
    "inParent": false,
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
              "height": 500,
              "bgcolor": "#fff",
              "duration": 0 } }
*/
function Player(id, opts) {
    this.id = id;
    this.state = null;
    this.anim = null;
    this.canvas = null;
    this.ctx = null;
    this.controls = null;
    this.info = null;
    this.__canvasPrepared = false;
    this._init(opts);
}

Player.PREVIEW_POS = 0.33;
Player.PEFF = 0.07; // seconds to play more when reached end of movie

Player.URL_ATTR = 'data-url';

Player.DEFAULT_CANVAS = { 'width': 400,
                          'height': 250, 
                          'bgcolor': '#fff' };
Player.DEFAULT_CONFIGURATION = { 'debug': false,
                                 'inParent': false,
                                 'mode': C.M_VIDEO,
                                 'zoom': 1.0,
                                 'meta': { 'title': 'Default',
                                           'author': 'Anonymous',
                                           'copyright': '© NaN',
                                           'version': -1.0,
                                           'description': 
                                                'Default project description' },
                                 'anim': { 'fps': 30,
                                           'width': Player.DEFAULT_CANVAS.width,
                                           'height': Player.DEFAULT_CANVAS.height,
                                           'bgcolor': Player.DEFAULT_CANVAS.bgcolor,
                                           'duration': 0 }
                               };

// === PLAYING CONTROL API =====================================================
// =============================================================================

// TODO: add load/play/pause/stop events

Player.prototype.load = function(object, importer, callback) {
    var player = this;

    player._checkMode();

    player._reset();

    var whenDone = function() {
        player.fire(C.X_LOAD);
        player.stop();
        if (callback) callback();
    };

    // TODO: configure canvas using clips bounds
    
    if (object) {

        // FIXME: load canvas parameters from canvas element, 
        //        if they are not specified
        if (object instanceof Builder) {  // Builder instance
            if (!player.__canvasPrepared) {
                player._prepareCanvas(Player.DEFAULT_CANVAS);
            }
            L.loadBuilder(player, object, whenDone);
        } else if (object instanceof Scene) { // Scene instance
            if (!player.__canvasPrepared) {
                player._prepareCanvas(Player.DEFAULT_CANVAS);
            }
            L.loadScene(player, object, whenDone);
        } else if (object instanceof Array) { // array of clips
            if (!player.__canvasPrepared) {
                player._prepareCanvas(Player.DEFAULT_CANVAS);
            }
            L.loadClips(player, object, whenDone);
        } else if (typeof object === 'string') { // URL
            L.loadFromUrl(player, object, importer, whenDone);
        } else { // any object with importer
            L.loadFromObj(player, object, importer, whenDone);
        }

    } else {
        if (!player.__canvasPrepared) {
            player._prepareCanvas(Player.DEFAULT_CANVAS);
        }
        player.anim = new Scene();
    }

    //console.log('load', player.id, player.state);

    return player;
}

Player.prototype.play = function(from, speed) {

    if (this.state.happens === C.PLAYING) return;

    var player = this;

    player._ensureAnim();
    player._ensureState();

    var _state = player.state;

    _state.from = from || _state.from;
    _state.speed = speed || _state.speed;

    _state.__startTime = Date.now();
    _state.__redraws = 0;
    _state.__rsec = 0;

    /*if (_state.state.__drawInterval !== null) {
        clearInterval(player.state.__drawInterval);
    }*/

    _state.happens = C.PLAYING;

    if (_state.__lastTimeout) window.clearTimeout(_state.__lastTimeout);

    var scene = player.anim;
    scene.reset();
    
    D.drawNext(player.ctx, _state, scene, 
               function(state, time) {
                   if (time > (state.duration + Player.PEFF)) {
                       state.time = 0;
                       scene.reset();
                       player.pause();
                       // TODO: support looping?
                       return false;
                   }
                   if (player.controls) {
                       player.controls.render(state, time);
                   }
                   return true;
               });

    player.fire(C.X_PLAY,_state.from);

    return player;
}

Player.prototype.stop = function() {
    var player = this;

    player._ensureState();

    var _state = player.state;

    _state.time = 0;
    _state.from = 0;

    if (player.anim) {
        _state.happens = C.STOPPED;
        player.drawAt(_state.duration * Player.PREVIEW_POS);
    } else {
        _state.happens = C.NOTHING;
        player.drawSplash();
    }
    if (player.controls) {
        player.controls.render(_state, 0);
    }

    player.fire(C.X_STOP);
    //console.log('stop', player.id, _state);

    return player;    
}

Player.prototype.pause = function() {
    var player = this;
    
    player._ensureState();
    player._ensureAnim();

    var _state = player.state;

    _state.from = _state.time;
    _state.happens = C.PAUSED;

    player.drawAt(_state.time);

    player.fire(C.X_PAUSE,_state.time);
    //console.log('pause', player.id, _state);

    return player;    
}

/*Player.prototype.reset = function() {
    
}*/

Player.prototype.onerror = function(callback) { // TODO: make and event?
    var player = this;

    player.fire(C.X_ERROR);
    //console.log('onerror', player.id, player);

    player.anim = null;
    player.stop();
    // TODO:

    return player;    
}

// === INITIALIZATION ==========================================================
// =============================================================================

provideEvents(Player, [C.X_PLAY, C.X_PAUSE, C.X_STOP, C.X_LOAD, C.X_ERROR]);
// initial state of the player, called from conctuctor
Player.prototype._init = function(opts) {
    var opts = opts || Player.DEFAULT_CONFIGURATION;
    this.inParent = opts.inParent;
    this.mode = opts.mode;
    this.debug = opts.debug;
    this._initHandlers(); // TODO: make automatic
    this.canvas = document.getElementById(this.id);
    this.ctx = this.canvas.getContext("2d");
    this.state = Player.createState(this);
    this.state.zoom = opts.zoom || 1;
    this.controls = new Controls(this); // controls enabled by default
    this.info = new InfoBlock(this); // info enabled by default
    this.configureAnim(opts.anim || Player.DEFAULT_CONFIGURATION.anim);
    this.configureMeta(opts.meta || Player.DEFAULT_CONFIGURATION.meta);
    this.subscribeEvents(this.canvas);
    this.stop();
    // TODO: load some default information into player
    if (!Text.__buff) Text.__buff = Text._createBuffer(); // so it will be performed onload
    var mayBeUrl = this.canvas.getAttribute(Player.URL_ATTR);
    if (mayBeUrl) this.load(mayBeUrl/*,
                            this.canvas.getAttribute(Player.IMPORTER_ATTR)*/);
}
// reset player to initial state, called before loading any scene
Player.prototype._reset = function() {
    var _state = this.state;
    _state.debug = this.debug;
    _state.happens = C.NOTHING;
    _state.from = 0;
    _state.time = 0;
    _state.zoom = 1;
    _state.duration = 0;
    if (this.controls) this.controls.reset();
    if (this.info) this.info.reset();
    this.ctx.clearRect(0, 0, _state.width, _state.height);
    this.stop();
}
// update player's canvas with configuration 
Player.prototype._prepareCanvas = function(opts) {
    var canvas = this.canvas;
    this._canvasConf = opts;
    this.state.width = opts.width;
    this.state.height = opts.height;
    if (opts.bgcolor) this.state.bgcolor = opts.bgcolor;
    canvasOpts(canvas, opts);
    if (this.controls) this.controls.update(canvas);
    if (this.info) this.info.update(canvas);
    this._saveCanvasPos(canvas);
    this.__canvasPrepared = true;
    return this;
}
Player.prototype._checkMode = function() {
    if (this.mode & C.M_CONTROLS_ENABLED) {
        if (!this.controls) {
            this.controls = new Controls(this);
            this.controls.update(this.canvas);
        }
    } else {
        if (this.controls) {
            this.controls.detach(this.canvas);
            this.controls = null;
        }
    }
    if (this.mode & C.M_INFO_ENABLED) {
        if (!this.info) {
            this.info = new InfoBlock(this);
            this.info.update(this.canvas);
        }
    } else {
        if (this.info) {
            this.info.detach(this.canvas);
            this.info = null;
        }
    }
    // FIXME: M_HANDLE_EVENTS
}
// FIXME: call changeRect on every resize
Player.prototype.changeRect = function(rect) {
    this._prepareCanvas({
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
        bgcolor: this.state.bgcolor
    });
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
//   ["bgcolor": "#f00",] // in canvas-friendly format
//   ["duration": 10.0] // in seconds
// }
Player.prototype.configureAnim = function(conf) {
    this._animInfo = conf;
    this._prepareCanvas(conf);
    // inject information to html
    
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
    var ctx = this.ctx,
        state = this.state;
    ctx.clearRect(0, 0, state.width, state.height);
    this.anim.render(ctx, time, state.zoom);
    if (this.controls) {
        this.controls.render(state, time);
    }
}
Player.prototype._ensureState = function() {
    if (!this.state) {
        throw new Error('There\'s no player state defined, nowhere to draw, ' +
                        'please load something in player before ' +
                        'calling \'play\'');
    }
}
Player.prototype._ensureAnim = function() {
    if (!this.anim) {
        throw new Error('There\'s nothing to play at all, ' +
                        'please load something in player before ' +
                        'calling \'play\'');
    }
}
Player.prototype.detach = function() {
    if (this.controls) this.controls.detach(this.canvas);
    if (this.info) this.info.detach(this.canvas);
    this._reset();
}
Player.prototype.subscribeEvents = function(canvas) {
    this.canvas.addEventListener('mouseover', (function(player) { 
                        return function(evt) {
                            if (player.controls) {
                                player.controls.show();
                                player.controls.render(player.state, 
                                                       player.state.time);
                            }
                            if (player.info) player.info.show(); 
                        };
                    })(this), false);
    this.canvas.addEventListener('mouseout', (function(player) { 
                        return function(evt) { 
                            if (player.controls && 
                                (!player.controls.evtInBounds(evt))) {
                                player.controls.hide();
                            }
                            if (player.info) player.info.hide(); 
                        };
                    })(this), false);
}
Player.prototype.updateDuration = function(value) {
    this.state.duration = value;
    if (this.info) this.info.updateDuration(value);
}
Player.prototype._saveCanvasPos = function(cvs) {
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
        } while (elm = elm.offsetParent);
    };
 
    ol += cpl + cbl + htol;
    ot += cpt + cbt + htot;

    // FIXME: find a method with no injection of custom properties
    //        (data-xxx attributes are stored as strings and may work
    //         a bit slower for events)
    cvs.__rOffsetLeft = ol;
    cvs.__rOffsetTop = ot;
}
Player.prototype.drawSplash = function() {
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
Player.prototype.drawLoadingSplash = function(text) {
    this.drawSplash();
    var ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#006';
    ctx.font = '12px sans-serif';
    ctx.fillText(text || "Loading...", 20, 25);
    ctx.restore();
}

Player.createState = function(player) {
    return {
        'time': 0, 'from': 0, 'speed': 1,
        'fps': 30, 'afps': 0, 'duration': 0,
        'debug': false, 'iactive': false, 
        // TODO: use iactive to determine if controls/info should be init-zed
        'width': player.canvas.offsetWidth,
        'height': player.canvas.offsetHeight,
        'zoom': 1.0, 'bgcolor': '#fff',
        'happens': C.NOTHING,
        '__startTime': -1,
        '__redraws': 0, '__rsec': 0
        //'__drawInterval': null
    };
}

// === SCENE ===================================================================
// =============================================================================

// > Scene % ()
function Scene() {
    this.tree = [],
    this.hash = {};
    this.name = '';
    this.duration = 0;
    this._initHandlers(); // TODO: make automatic
}
// mouse/keyboard events are assigned in L.loadScene, TODO: move them into scene
provideEvents(Scene, [ C.X_MCLICK, C.X_MDOWN, C.X_MUP, 
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
    } else if (arg1.push) { // elements array mode
        var _clip = new Clip();
        _clip.add(arg1);
        this._addToTree(_clip);
        return _clip;
    } else if (arg1.value) { // builder instance
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
// > Scene.visitElems % (visitor: Function(elm: Element))
Scene.prototype.visitElems = function(visitor, data) {
    for (var elmId in this.hash) {
        visitor(this.hash[elmId], data);
    }
}
// > Scene.visitElems % (visitor: Function(elm: Element))
Scene.prototype.visitRoots = function(visitor, data) {
    for (var i = 0, tlen = this.tree.length; i < tlen; i++) {
        visitor(this.tree[i], data);
    }
}
Scene.prototype.render = function(ctx, time, zoom) {
    var zoom = zoom || 1;
    ctx.save();
    if (zoom != 1) {
        ctx.scale(zoom, zoom);
    }
    this.visitRoots(function(elm) {
        elm.render(ctx, time);
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
Scene.prototype.calculateDuration = function() {
    var gband = [Number.MAX_VALUE, 0];
    this.visitRoots(function(elm) {
        gband = Bands.expand(gband, elm.findWrapBand());
    });
    return gband[1];
}
Scene.prototype.reset = function() {
    this.visitRoots(function(elm) {
        elm.reset();
    });
}
Scene.prototype.dispose = function() {
    this.disposeHandlers();
    this.visitRoots(function(elm) {
        elm.dispose();
    });
}
Scene.prototype._addToTree = function(elm) {
    if (!elm.children) {
        throw new Error('It appears that it is not a clip object or element that you pass');  
    }
    this.duration = this.calculateDuration();
    if (elm.xdata.gband && 
        (elm.xdata.gband[1] > this.duration)) {
        this.duration = elm.xdata.gband[1];
    };
    this._register(elm);
    if (elm.children) this._addElems(elm.children);
    this.tree.push(elm);
}
Scene.prototype._register = function(elm) {
    this.hash[elm.id] = elm;
}
Scene.prototype._addElems = function(elems) {
    for (var ei = 0; ei < elems.length; ei++) {
        var _elm = elems[ei];
        this._register(_elm);
        if (_elm.children) this._addElems(_elm.children);
    }
}

// === ELEMENTS ================================================================
// =============================================================================

// repeat mode 
C.R_ONCE = 0;
C.R_LOOP = 1;
C.R_BOUNCE = 2;

// modifiers classes
// the order is also determined with value
Element.SYS_MOD = 0;
Element.TWEEN_MOD = 1;
Element.USER_MOD = 2;
// TODO: JUMP_MOD ?
Element.EVENT_MOD = 3;
Element.ALL_MODIFIERS = [ Element.SYS_MOD, Element.TWEEN_MOD, 
                          Element.USER_MOD, Element.EVENT_MOD ];
Element.NOEVT_MODIFIERS = [ Element.SYS_MOD, Element.TWEEN_MOD, 
                            Element.USER_MOD ];

// painters classes
// the order is also determined with value
Element.SYS_PNT = 0;
Element.USER_PNT = 1;
Element.DEBUG_PNT = 2;
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
    this.state = Element.createState();
    this.xdata = Element.createXData();
    this.children = [];
    this.parent = null;
    this.sprite = false;
    this.visible = false;
    this.rendering = false;
    this._modifiers = [];
    this._painters = [];
    if (onframe) this.__modify(onframe);
    if (draw) this.__paint(draw);
    this.__lastJump = null;
    this.__jumpLock = false;
    this.__modifying = null; // current modifiers class, if modifying
    this.__painting = null; // current painters class, if modifying
    this.__evtCache = [];
    this._initHandlers(); // TODO: make automatic
    var _me = this,
        default_on = this.on;
    this.on = function(type, handler) {
        if (type & C.XT_CONTROL) {
            this.m_on.call(_me, type, handler);
        } else default_on.call(_me, type, handler);
    };
};
Element.DEFAULT_LEN = 10;
provideEvents(Element, [ C.X_MCLICK, C.X_MDOWN, C.X_MUP, 
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
Element.prototype.onframe = function(gtime) {
    var ltime = this.localTime(gtime);
    if (!this.fits(ltime)) return false;
    return this.__callModifiers(Element.ALL_MODIFIERS, ltime);
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
        ctx.drawImage(this.xdata.canvas, 0, 0);
    }
}
// > Element.transform % (ctx: Context)
Element.prototype.transform = function(ctx) {
    var s = this.state;
    s._matrix = Element._getMatrixOf(s, s._matrix);
    ctx.globalAlpha = s.alpha;
    s._matrix.apply(ctx);
}
// > Element.render % (ctx: Context, gtime: Float)
Element.prototype.render = function(ctx, time) {
    this.rendering = true;
    ctx.save();
    var wasDrawn = false;
    if (wasDrawn = (this.onframe(time) 
                    && this.prepare())) {
        this.transform(ctx);
        this.draw(ctx);
        this.visitChildren(function(elm) {
            elm.render(ctx, time);
        });
    }
    // immediately when drawn, element becomes visible,
    // it is reasonable
    this.visible = wasDrawn; 
    ctx.restore();
    this.rendering = false;
    if (wasDrawn) this.fire(C.X_DRAW,ctx);
}
// > Element.addModifier % (modifier: Function(time: Float, 
//                                              data: Any) => Boolean, 
//                           data: Any) => Integer
Element.prototype.addModifier = function(modifier, data) {
    this.__modify(Element.USER_MOD, modifier, data);
}
// > Element.addPainter % (painter: Function(ctx: Context)) 
//                         => Integer
Element.prototype.addPainter = function(painter, data) {
    this.__paint(Element.USER_PNT, painter, data);
}

// > Element.addTween % (tween: Tween)
Element.prototype.addTween = function(tween) {
    var tweens = this.xdata.tweens;
    if (!(tweens[tween.type])) {
        tweens[tween.type] = [];
    }
    tweens[tween.type].push(tween);
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
// TODO: removePainter/removeModifier
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
    } else if (arg1.push) { // elements array mode
        this._addChildren(arg1);
    } else if (arg1.value) { // builder instance
        this._addChild(arg1.value); 
    } else { // element object mode
        this._addChild(arg1); 
    }
}
// > Element.addS % (dimen: Array[Int, 2],
//                    draw: Function(ctx: Context),
//                    onframe: Function(time: Float),
//                    [ transform: Function(ctx: Context, 
//                                          prev: Function(Context)) ])
//                    => Element
Element.prototype.addS = function(dimen, draw, onframe, transform) {
    var _elm = this.add(draw, onframe, transform);
    _elm.sprite = true;
    _elm.state.dimen = dimen;
    return _elm;
}    
Element.prototype.bounds = function(time) {
    return G.bounds(this, time);
}
Element.prototype.inBounds = function(point, time) {
    return G.inBounds(this, point, time);
}
Element.prototype.contains = function(pt) {
    if (this.__modifying !== Element.EVENT_MOD) throw new Error('You may call contains only inside a handler');
    var pt = Element._getIMatrixOf(this.state)
                    .transformPoint(pt[0], pt[1]);
    if (!G.inBounds(this, pt)) return false;
    return G.__contains(this.xdata, pt);
}
Element.prototype.dcontains = function(pt, level) {
    var level = level || 0;
    if ((level === 0) && 
        (this.__modifying !== Element.EVENT_MOD)) throw new Error('You may call dcontains only inside a handler');
    var matched = [];
    var pt = this.__lmatrix.transformPoint(pt[0], pt[1]);
    if (G.inBounds(this, pt)) {
        if (G.__contains(this.xdata, pt)) {
            matched.push(elm);
        }
    }
    if (this.children) {
        elm.visitChildren(function(celm) {
            matched.concat(celm.dcontains(pt, level+1));
        });
    }
    return matched;
}
Element.prototype.containsByT = function(point, time) {
    return G.contains(this, point, time);
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
}
Element.prototype.fits = function(ltime) {
    if (ltime < 0) return false;
    return (ltime <= (this.xdata.lband[1]
                      - this.xdata.lband[0]));
}
Element.prototype.localTime = function(gtime) {
    var x = this.xdata;
    switch (x.mode) {
        case C.R_ONCE:
            return this.__checkGJump(gtime);
        case C.R_LOOP: {
                var x = this.xdata,
                    p = this.parent;
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
        case C.R_BOUNCE:
                var x = this.xdata,
                    p = this.parent;
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
                    t = ((fits % 2) == 0) ? t : durtn - t;
                return (fits <= times) ? this.__checkJump(t) : -1;
    }
}
Element.prototype.m_on = function(type, handler) {
    this.__modify(Element.EVENT_MOD, function(t) {
      if (this.__evt_st & type) {
        var evts = this.__evts[type];
        for (var i = 0; i < evts.length; i++) {
            if (!handler.call(this,t,evts[i])) return false;
        }
      }
      return true;
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
    var s = this.state;
    s.x = 0; s.y = 0;
    s.lx = 0; s.ly = 0;
    s.rx = 0; s.ry = 0;
    s.angle = 0; s.alpha = 1;
    s.sx = 1; s.sy = 1;
    s.p = null; s.t = null; s.key = null;
    this.__lastJump = null;
    s._matrix.reset();
    this.__clearEvtState();
    this.visitChildren(function(elm) {
        elm.reset();
    });
}
Element.prototype.visitChildren = function(func) {
    var children = this.children;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        func(children[ei]);
    };
}
Element.prototype.travelChildren = function(func) {
    var children = this.children;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        var elem = children[ei];
        func(elem);
        elem.travelChildren(func);
    };
}
Element.prototype.lock = function() {
    this.__jumpLock = true;
    this.__lstate = obj_clone(this.state);
}
Element.prototype.unlock = function() {
    var result = this.state;
    this.state = this.__lstate;
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
Element.prototype._addChild = function(elm) {
    this.children.push(elm); // or add elem.id?
    elm.parent = this;
    Bands.recalc(this);
}
Element.prototype._addChildren = function(elms) {
    for (var ei = 0; ei < elms.length; ei++) {
        this._addChild(elms[ei]);
    }
}
Element.prototype._drawToCache = function() {
    var _canvas = newCanvas(this.state.dimen);
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
Element.prototype.__callModifiers = function(order, ltime) {
    var modifiers = this._modifiers;
    var type, seq;
    for (var typenum = 0, last = order.length;
         typenum < last; typenum++) {
        type = order[typenum];    
        seq = modifiers[type];
        this.__modifying = type;
        this.__mbefore(type);      
        if (seq) {
            for (var si = 0; si < seq.length; si++) {
                if (!seq[si][0].call(this.state, ltime, seq[si][1])) {
                    this.__mafter(type, false);
                    this.__modifying = null;
                    return false;
                }
            }
        }
        this.__mafter(type, true);
    }
    this.__modifying = null;
    return true;
}
Element.prototype.__callPainters = function(order, ctx) {
    var painters = this._painters;
    var type, seq;
    for (var typenum = 0, last = order.length;
         typenum < last; typenum++) {
        type = order[typenum];
        seq = painters[type];
        this.__painting = type;
        this.__pbefore(type);
        if (seq) {
            for (var si = 0; si < seq.length; si++) {
                seq[si][0].call(this.xdata, ctx, seq[si][1]);
            }
        }
        this.__pafter(type);
    }
    this.__painting = null;
}
Element.prototype.__addTypedModifier = function(type, modifier, data) {
    if (!modifier) return; // FIXME: throw some error?
    var modifiers = this._modifiers;
    if (!modifiers[type]) modifiers[type] = [];
    modifiers[type].push([modifier, data]);
    return (modifiers[type].length - 1);
}
Element.prototype.__modify = Element.prototype.__addTypedModifier; // quick alias
Element.prototype.__addTypedPainter = function(type, painter, data) {
    if (!painter) return; // FIXME: throw some error?
    var painters = this._painters;
    if (!painters[type]) painters[type] = [];
    painters[type].push([painter, data]);
    return (painters[type].length - 1);
}
Element.prototype.__paint = Element.prototype.__addTypedPainter; // quick alias
Element.prototype.__mbefore = function(type) {
    if (type === Element.EVENT_MOD) {
        this.__loadEvtsFromCache();
    }
}
Element.prototype.__mafter = function(type, result) { 
    if (!result || (type === Element.USER_MOD)) {
        this.__lmatrix = Element._getIMatrixOf(this.state);
    }
    if (!result || (type === Element.EVENT_MOD)) {
        this.__clearEvtState();
    }
}
Element.prototype.__pbefore = function(type) { }
Element.prototype.__pafter = function(type) { }
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
            throw new Error('failed to calculate jump');
        }
        if (!this.__jumpLock) {
            if ((this.__lastJump === null) ||
                (this.__lastJump[1] !== t)) {
                 // jump was performed if t or rt or key
                 // were set and new value is not
                 // equal to previous jump value:
                 // save jump time and return it
                 this.__lastJump = [ at, t ];
                 s.p = null;
                 s.t = null;
                 s.key = null;
                 return t;
            } else {
                // jump is already in progress, 
                // reset values and continue
                s.p = null;
                s.t = null;
                s.key = null;
                t = null;
            }
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
    this.__saveToEvtState(type, evt);
    return true;
}
Element.prototype.__saveToEvtState = function(type, evt) {
    if (this.__modifying !== Element.EVENT_MOD) {
        this.state.__evt_st |= type;
        var evts = this.state.__evts;
        if (!evts[type]) evts[type] = [];
        evts[type].push(evt);
    } else {
        this.__evtCache.push([type, evt]);
    }
}
Element.prototype.__clearEvtState = function() {
    var s = this.state;
    if (s.__evt_st === 0) return;
    s.__evt_st = 0;
    var evts = s.__evts;
    for (var type in evts) {
        delete evts[type];
    }
    s.__evts = {};
}
Element.prototype.__loadEvtsFromCache = function() {
    var cache = this.__evtCache;
    var cache_len = cache.length;
    if (cache_len > 0) {
        var edata, type, evts;
        for (var ei = 0; ei < cache_len; ei++) {
            edata = cache[ei];
            type = edata[0];
            this.state.__evt_st |= type;
            evts = this.state.__evts;
            if (!evts[type]) evts[type] = [];
            evts[type].push(edata[1]);
        }
        this.__evtCache = [];
    }
}

// state of the element
Element.createState = function() {
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
             '_evt_st': 0 };
};
// geometric data of the element
Element.createXData = function() {
    return { 'pos': null,      // position in parent clip space
             'reg': null,      // registration point
             'image': null,    // cached Image instance, if it is an image
             'path': null,     // Path instanse, if it is a shape 
             'text': null,     // Text data, if it is a text (`path` holds stroke and fill)
             'tweens': {},     // animation tweens (Tween class)         
             'mode': C.R_ONCE,            // playing mode
             'lband': [0, Element.DEFAULT_LEN], // local band
             'gband': [0, Element.DEFAULT_LEN], // global bane
             'canvas': null,   // own canvas for static (cached) elements
             'dimen': null,    // dimensions for static (cached) elements
             'keys': {},
             'tf': null,
             '_mpath': null };
}
Element._getMatrixOf = function(s, m) {
    var _t = m || new Transform();
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
        if (!this.provides(event)) throw new Error('Event ' + event + 
                                                   ' not provided by ' + this);
        if (!handler) throw new Error('You are trying to assign ' + 
                                       'undefined handler for event ' + event);
        this.handlers[event].push(handler);
        return (this.handlers[event].length - 1);
    };
    subj.prototype.fire = function(event, evtobj) {
        if (!this.provides(event)) throw new Error('Event ' + event + 
                                                   ' not provided by ' + this);
        if (this.handle__x && !(this.handle__x(event, evtobj))) return;    
        if (this['handle_'+event]) this['handle_'+event](evtobj);
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
        if (!this.provides(event)) throw new Error('Event ' + event + 
                                                   ' not provided by ' + this);
        if (this.handlers[event][idx]) {
            this.handlers[event] = arr_remove(this.handlers, idx);
        } else {
            throw new Error('No such handler ' + idx + ' for event ' + event);
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
    return e;
}

function mevt(e, cvs) {
    return [ e.pageX - cvs.__rOffsetLeft, 
             e.pageY - cvs.__rOffsetTop ];
}

// =============================================================================
// === DRAWING =================================================================

var D = {}; // means "Drawing"

// draws current state of animation on canvas and postpones to call itself for 
// the next time period (so to start animation, you just need to call it once 
// when the first time must occur and it will chain its own calls automatically)
D.drawNext = function(ctx, state, scene, callback) {
    // NB: state here is a player state, not an element state

    if (state.happens !== C.PLAYING) return;

    var msec = (Date.now() - state.__startTime); 
    var sec = msec / 1000;

    var time = (sec * state.speed) + state.from;
    state.time = time; 

    if (state.__rsec === 0) state.__rsec = msec;
    if ((msec - state.__rsec) >= 1000) {
        state.afps = state.__redraws;
        state.__rsec = msec;
        state.__redraws = 0;
    }
    state.__redraws++; 

    ctx.clearRect(0, 0, state.width, state.height);

    scene.render(ctx, time, state.zoom);

    // show fps
    if (state.debug) { // TODO: move to player.onrender
        D.drawFPS(ctx, state.afps);
    }

    if (callback) {
        if (!callback(state, time)) return;
    }

    state.__lastTimeout = __nextFrame(function() {
       D.drawNext(ctx, state, scene, callback); 
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
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke._style // calculated once for stroke
                      || (stroke._style = Path.createStyle(ctx, stroke)); 
    ctx.lineCap = stroke.cap;
    ctx.lineJoin = stroke.join;    
}

// FIXME: move to `Path`?
DU.applyFill = function(ctx, fill) {
    ctx.fillStyle = fill._style // calculated once for fill
                  || (fill._style = Path.createStyle(ctx, fill));
}

// FIXME: move to `Path`?
DU.qDraw = function(ctx, stroke, fill, func) {
    ctx.save();
    ctx.beginPath();
    DU.applyStroke(ctx, stroke);
    DU.applyFill(ctx, fill);
    func();
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

var G = {}; // geometry

// for all functions below, 
// t is global time
G.adopt = function(elm, pt, t) {
    if (pt === null) return null;
    var s; if (s = elm.stateAt(t)) {
        return 
            Element._getIMatrixOf(s)
                   .transformPoint(pt[0], pt[1]);
    } else return null;
}
G.adoptBounds = function(elm, bounds, t) {
    if (pt === null) return null;
    var s; if (s = elm.stateAt(t)) {
        var m = Element._getIMatrixOf(s);
        var min = m.transformPoint(bounds[0],
                                   bounds[1]);
        var max = m.transformPoint(bounds[2],
                                   bounds[3]);
        return [ min[0], min[1],
                 max[0], max[1] ];
    } else return null;
    if (bounds === null) return null;
}
// for all functions below, 
// t is global time or undefined if
// it time not necessary
G.bounds = function(elm, t) {
    var x = elm.xdata;
    var bounds;
    if (x.path) {
        bounds = x.path.bounds();
    } else if (x.image) {
        bounds = [ 0, 0, x.image.width, x.image.height ];
    } else if (x.text) {
        bound = [ 0, 0, 100, 100 ]; // FIXME: implement
    } else return null;
    return (typeof t === 'undefined') ?
           bounds : G.adoptBounds(elm, bounds, t);
}
G.inBounds = function(elm, pt, t) {
    var bounds = G.bounds(elm, t);
    if (bounds) {
        return (pt[0] >= bounds[0]) &&
               (pt[1] >= bounds[1]) &&
               (pt[0] <= bounds[2]) &&
               (pt[1] <= bounds[3]); 
    } else return false;
}
G.contains = function(elm, pt, t) {
    var pt = (typeof t === 'undefined')
             ? pt : G.adopt(elm, pt, t);
    var matched = [];
    if (G.inBounds(elm, pt)
        && G.__contains(elm.xdata, pt)) {
        matched.push(elm);
    }
    if (elm.children) {
        elm.visitChildren(function(celm) {
            matched.concat(G.contains(elm, pt, t));
        });
    }
    return matched;
}
G.__contains = function(x, pt) {
    if (x.path) {
        return x.path.contains(pt);
    } else if (x.image) {
        return true; // already tested with bounds
    } else if (x.text) {
        return true;
        // FIXME: call ctx.measureText()

        // http://mudcu.be/journal/2011/01/html5-typographic-metrics/

        /* function getAlign(text, type, offsetx) {
            var direction = window.getComputedStyle(document.body)["direction"];
            control.textContent = text;
            switch(type) {
                case "left": break;
                case "start": offsetx -= (direction == 'ltr') ? 0 : control.offsetWidth; break;
                case "end": offsetx -= (direction == 'ltr') ? control.offsetWidth : 0; break;
                case "right": offsetx -= control.offsetWidth; break;
                case "center": offsetx -= control.offsetWidth / 2; break;
            }
            return offsetx;
        };*/

        /*function measureText(text) {
            control.style.display = "inline";
            control.textContent = text;
            return {
                height: control.offsetHeight,
                width: control.offsetWidth
            };
        };*/
    }
}
/**
  * Calculates the number of times the line from (x0,y0) to (x1,y1)
  * crosses the ray extending to the right from (px,py).
  * If the point lies on the line, then no crossings are recorded.
  * +1 is returned for a crossing where the Y coordinate is increasing
  * -1 is returned for a crossing where the Y coordinate is decreasing
  */
G.__lineCrosses = function(px, py, x0, y0, x1, y1) {
    if ((py < y0) && (py < y1)) return 0;
    if ((py >= y0) && (py >= y1)) return 0;
    // assert y0 != y1
    if ((px >= x0) && (px >= x1)) return 0;
    if ((px < x0) && (px < x1)) return (y0 < y1) ? 1 : -1;
    var xitcpt = x0 + (py - y0) * (x1 - x0) / (y1 - y0);
    if (px >= xitcpt) return 0;
    return (y0 < y1) ? 1 : -1;
}
/**
  * Calculates the number of times the cubic from (x0,y0) to (x1,y1)
  * crosses the ray extending to the right from (px,py).
  * If the point lies on a part of the curve,
  * then no crossings are counted for that intersection.
  * the level parameter should be 0 at the top-level call and will count
  * up for each recursion level to prevent infinite recursion
  * +1 is added for each crossing where the Y coordinate is increasing
  * -1 is added for each crossing where the Y coordinate is decreasing
  */
G.__curveCrosses = function(px, py, x0, y0,
                            xc0, yc0, xc1, yc1,
                            x1, y1, level) {
    var level = level || 0;
    if ((py < y0) && (py < yc0) && (py < yc1) && (py < y1)) return 0;
    if ((py >= y0) && (py >= yc0) && (py >= yc1) && (py >= y1)) return 0;
    // Note y0 could equal yc0...
    if ((px >= x0) && (px >= xc0) && (px >= xc1) && (px >= x1)) return 0;
    if ((px < x0) && (px < xc0) && (px < xc1) && (px < x1)) {
        if (py >= y0) {
            if (py < y1) return 1;
        } else {
            // py < y0
            if (py >= y1) return -1;
        }
        // py outside of y01 range, and/or y0==yc0
        return 0;
    }
    // double precision only has 52 bits of mantissa
    if (level > 52) return G.__lineCrosses(px, py, x0, y0, x1, y1);
    var xmid = (xc0 + xc1) / 2,
        ymid = (yc0 + yc1) / 2;
    var xc0 = (x0 + xc0) / 2,
        yc0 = (y0 + yc0) / 2,
        xc1 = (xc1 + x1) / 2,
        yc1 = (yc1 + y1) / 2;
    var xc0m = (xc0 + xmid) / 2,
        yc0m = (yc0 + ymid) / 2;
        xmc1 = (xmid + xc1) / 2;
        ymc1 = (ymid + yc1) / 2;
    xmid = (xc0m + xmc1) / 2;
    ymid = (yc0m + ymc1) / 2;
    if (isNaN(xmid) || isNaN(ymid)) {
        // [xy]mid are NaN if any of [xy]c0m or [xy]mc1 are NaN
        // [xy]c0m or [xy]mc1 are NaN if any of [xy][c][01] are NaN
        // These values are also NaN if opposing infinities are added
        return 0;
    }
    return (G.__curveCrosses(px, py, x0, y0, 
                             xc0, yc0, xc0m, yc0m, 
                             xmid, ymid, level + 1) +
            G.__curveCrosses(px, py, xmid, ymid, 
                             xmc1, ymc1, xc1, yc1, 
                             x1, y1, level + 1));                            
}


// =============================================================================
// === IMPORT ==================================================================

var L = {}; // means "Loading/Loader"

L.loadFromUrl = function(player, url, importer, callback) {
    if (!JSON) throw new Error('JSON parser is not accessible');

    player.drawLoadingSplash('Loading ' + url.substring(0, 50) + '...');

    ajax(url, function(req) {
        L.loadFromObj(player, JSON.parse(req.responseText), importer, callback);
    });
}
L.loadFromObj = function(player, object, importer, callback) {
    if (!importer) throw new Error('Cannot load project without importer. ' +
                                   'Please define it');
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
    // add rendering
    scene.visitElems(Render.addXDataRender);
    if (player.state.debug) scene.visitElems(Render.addDebugRender);
    // subscribe events
    if (player.mode & C.M_HANDLE_EVENTS) {
        L.subscribeEvents(player.canvas, scene);
    }
    // assign
    player.anim = scene;
    if (!player.state.duration) {
        player.updateDuration(scene.duration);
    }
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
L.subscribeEvents = function(canvas, anim) {
    canvas.addEventListener('mouseup', function(evt) {
        anim.fire(C.X_MUP, mevt(evt, this));
    }, false);
    canvas.addEventListener('mousedown', function(evt) {
        anim.fire(C.X_MDOWN, mevt(evt, this));
    }, false);
    canvas.addEventListener('mouseclick', function(evt) {
        anim.fire(C.X_MCLICK, mevt(evt, this));
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

// =============================================================================
// === CUSTOM RENDERING ========================================================

var Render = {}; // means "Render"

Render.addXDataRender = function(elm) {
    var xdata = elm.xdata;

    // modifiers
    //if (xdata.gband) elm.__modify(Element.SYS_MOD, Render.m_checkBand, xdata.gband);
    if (xdata.reg) elm.__modify(Element.SYS_MOD, Render.m_saveReg, xdata.reg);
    if (xdata.pos) elm.__modify(Element.SYS_MOD, Render.m_applyPos, xdata.pos);
    if (xdata.tweens) Render.addTweensModifiers(elm, xdata.tweens);
    
    // painters
    if (xdata.path) elm.__paint(Element.SYS_PNT, Render.p_drawPath, xdata.path);
    if (xdata.image) elm.__paint(Element.SYS_PNT, Render.p_drawImage, xdata.image);
    if (xdata.text) elm.__paint(Element.SYS_PNT, Render.p_drawText, xdata.text);
        
}

Render.addDebugRender = function(elm) {
    if (elm.xdata.reg) elm.__paint(Element.DEBUG_PNT, Render.p_drawReg, elm.xdata.reg);
    if (elm.name) elm.__paint(Element.DEBUG_PNT, Render.p_drawName, elm.name);
    //elm.__paint(Element.DEBUG_PNT, Render.p_drawMPathIfSet);
    elm.on(C.X_DRAW, Render.h_drawMPath);
}

Render.addTweensModifiers = function(elm, tweens) {
    var _order = Tween.TWEENS_ORDER;

    for (var oi = 0, olen = _order.length; oi < olen; oi++) {
        var _ttweens = tweens[_order[oi]];
        if (_ttweens) {
            for (var ti = 0; ti < _ttweens.length; ti++) {
                Render.addTweenModifier(elm, _ttweens[ti]);
            }
        }
    }
}

Render.addTweenModifier = function(elm, tween) {
    var easing = tween.easing;
    var modifier = !easing ? Bands.adaptModifier(Tweens[tween.type], 
                                                 tween.band)
                           : Bands.adaptModifierByTime(
                                   EasingImpl[easing.type](easing.data),
                                   Tweens[tween.type],
                                   tween.band);
    elm.__modify(Element.TWEEN_MOD, modifier, tween.data);
}

Render.p_drawReg = function(ctx, reg) {
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
    var path = path || this.path;
    path.apply(ctx);
}

Render.p_drawImage = function(ctx, image) {
    var image = image || this.image;
    ctx.save();
    if (image.isReady) ctx.drawImage(image, 0, 0);
    ctx.restore();
}

Render.p_drawText = function(ctx, text) {
    var text = text || this.text;
    text.apply(ctx, this.reg);
}

Render.p_drawName = function(ctx, name) {
    var name = name || this.name;
    if (name) {
        ctx.save();
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText(name, 0, 10);
        ctx.restore();
    };
}

Render.h_drawMPath = function(ctx, path) {
    var mPath = path || this.state._mpath;
    if (mPath) {
        ctx.save();
        var s = this.state;
        ctx.translate(s.lx, s.ly);
        mPath.setStroke('#600', 2.0);
        ctx.beginPath();
        mPath.apply(ctx);
        ctx.closePath();
        ctx.stroke();
        ctx.restore()
    }
}

Render.m_checkBand = function(time, band) {
    if (band[0] > time) return false;
    if (band[1] < time) return false;

    return true;
}

Render.m_saveReg = function(time, reg) {
    this.rx = reg[0];
    this.ry = reg[1];
    return true;
}

Render.m_applyPos = function(time, pos) {
    this.lx = pos[0];
    this.ly = pos[1];
    return true;
}

var Bands = {};

// recalculate all global bands down to the very 
// child, starting from given element
Bands.recalc = function(elm, in_band) {
    var x = elm.xdata;
    var in_band = in_band || 
                  ( elm.parent 
                  ? elm.parent.xdata.gband 
                  : x.lband );
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

Bands.adaptModifier = function(func, sband) {
    return function(time, data) { // returns modifier
        if (sband[0] > time) return true;
        if (sband[1] < time) return true;
        var t = (time-sband[0])/(sband[1]-sband[0]);
        func.call(this, t, data); 
        return true;
    };
}

Bands.adaptModifierByTime = function(tfunc, func, sband) {
    return function(time, data) { // returns modifier
        if ((sband[0] > time) || (sband[1] < time)) return true;
        var blen = sband[1] - sband[0],
            t = (time - sband[0]) / blen,
            mt = tfunc(t);
        if ((0 > mt) || (1 < mt)) return true;
        func.call(this, mt, data);
        return true;
    }
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
Tween.TWEENS_ORDER = [ C.T_TRANSLATE, C.T_SCALE, C.T_ROTATE, 
                       C.T_ROT_TO_PATH, C.T_ALPHA ];

var Tweens = {};
Tweens[C.T_ROTATE] = 
    function(t, data) {
        this.angle = data[0] * (1 - t) + data[1] * t;
        //state.angle = (Math.PI / 180) * 45;
    };
Tweens[C.T_TRANSLATE] = 
    function(t, data) {
        var p = data.pointAt(t);
        this._mpath = data;
        this.x = p[0];
        this.y = p[1];
    };
Tweens[C.T_ALPHA] =
    function(t, data) {
        this.alpha = data[0] * (1 - t) + data[1] * t;
    };
Tweens[C.T_SCALE] =    
    function(t, data) {
        this.sx = data[0][0] * (1.0 - t) + data[1][0] * t;
        this.sy = data[0][1] * (1.0 - t) + data[1][1] * t;  
    };
Tweens[C.T_ROT_TO_PATH] = 
    function(t, data) {
        var path = this._mpath;
        this.angle = path.tangentAt(t);
    };

// function-based easings

// Easings constants

C.E_PATH = 'PATH'; // Path
C.E_FUNC = 'FUNC'; // Function
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

// > Path % (str: String) 
function Path(str, stroke, fill) {
    this.str = str;
    this.stroke = stroke;
    this.fill = fill;
    this.segs = [];
    this.parse(str);
}

Path.EMPTY_STROKE = { 'width': 0, color: 'transparent' };
Path.DEFAULT_STROKE = Path.EMPTY_STROKE;                    
Path.DEFAULT_FILL = { 'color': 'transparent' };
Path.BASE_FILL = { 'color': '#dfdfdf' };
Path.BASE_STROKE = { 'width': 1.0,
                     'color': '#000',
                     'cap': 'round',
                     'join': 'round'
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
             function() { p.visit(p._applyVisitor,ctx); });

    /*ctx.beginPath();
    DU.applyStroke(ctx, this.stroke || Path.DEFAULT_STROKE);
    DU.applyFill(ctx, this.fill || Path.DEFAULT_FILL);
    this.visit(this._applyVisitor,ctx);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();*/

}
Path.prototype.setStroke = function(strokeColor, lineWidth) {
    this.stroke = {
        'width': (lineWidth != null) ? lineWidth
                            : Path.DEFAULT_STROKE.width,
        'color': strokeColor,
        'cap': 'round',
        'join': 'round'
    };
}
Path.prototype.setFill = function(fillColor) {
    this.fill = {
        'color': fillColor
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
              'seg': seg, 'start': p, 'slen': slen, 'segt': (segdist / slen) 
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
    // FIXME: it is not ok for curve path
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
// moves path to be positioned at 0,0 and
// returns subtracted top-left point
// and a center point
Path.prototype.normalize = function() {
    var bounds = this.bounds();
    var w = (bounds[2]-bounds[0]),
        h = (bounds[3]-bounds[1]);
    var min_x = bounds[0],
        min_y = bounds[1];
    var pt = [ Math.floor(w/2), 
               Math.floor(h/2) ];
    if ((min_x > 0) || (min_y > 0)) {
        this.vpoints(function(x, y) {
            return [ x - min_x,
                     y - min_y ];  
        });
    }
    return [ [ min_x, min_y ], pt ];
}
Path.prototype.inBounds = function(point) {
    var _b = this.bounds();
    return ((point[0] >= _b[0]) &&
            (point[1] >= _b[1]) &&
            (point[0] <= _b[2]) &&
            (point[1] <= _b[3]));
}
Path.prototype.contains = function(pt) {
    /*return this.fill ? ((this.crosses(pt) & -1) != 0)
                     : false /* TODO (this.getHitAt(time, point)) ..*/
    return ((this.crosses(pt) & -1) != 0);
}
Path.prototype.crosses = function(pt) {
    if (this.segs.length < 2) return false;
    var start = this.start();
    var cur = start;
    var crossings = 0;
    this.visit(function(segment) {
        crossings += segment.crosses(cur, pt);
        cur = segment.last();
    });

    if ((pt[0] != start[0]) && 
        (pt[1] != start[1])) {
        crossings += G.__lineCrosses(pt[0], pt[1], 
                                     cur[0], cur[1],
                                     start[0], start[1]);
    }

    return crossings;
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
Path.prototype._applyVisitor = function(segment, ctx) {
    var marker = segment.type;
    var positions = segment.pts;
    if (marker === C.P_MOVETO) {
        ctx.moveTo(positions[0], positions[1]);
    } else if (marker === C.P_LINETO) {
        ctx.lineTo(positions[0], positions[1]);
    } else if (marker === C.P_CURVETO) {
        ctx.bezierCurveTo(positions[0], positions[1],
                          positions[2], positions[3],
                          positions[4], positions[5]);
    }
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
// create canvas-compatible style from brush
Path.createStyle = function(ctx, brush) {
    if (brush.color) return brush.color;
    if (brush.lgrad) {
        var src = brush.lgrad,
            stops = src.stops,
            pts = src.pts,
            bounds = src.bounds;
        var grad = bounds
            ? ctx.createLinearGradient(
                            bounds[0] + pts[0][0] * bounds[2], // b.x + x0 * b.width 
                            bounds[1] + pts[0][1] * bounds[3], // b.y + y0 * b.height
                            bounds[0] + pts[1][0] * bounds[2], // b.x + x1 * b.width 
                            bounds[1] + pts[1][1] * bounds[3]) // b.y + y1 * b.height
            : ctx.createLinearGradient(
                            pts[0][0], pts[0][1],  // x0, y0
                            pts[1][0], pts[1][1]); // x1, y1
        for (var i = 0, slen = stops.length; i < slen; i++) {
            var stop = stops[i];
            grad.addColorStop(stop[0], stop[1]);
        }
        return grad;
    }
    if (brush.rgrad) {
        var src = brush.rgrad,
            stops = src.stops,
            pts = src.pts,
            r = src.r,
            bounds = src.bounds;
        var grad = bounds
            ? ctx.createRadialGradient(
                            bounds[0] + pts[0][0] * bounds[2], // b.x + x0 * b.width 
                            bounds[1] + pts[0][1] * bounds[3], // b.y + y0 * b.height
                            Math.max(bounds[2], bounds[3]) * r[0], // max(width, height) * r0
                            bounds[0] + pts[1][0] * bounds[2], // b.x + x1 * b.width 
                            bounds[1] + pts[1][1] * bounds[3], // b.y + y1 * b.height
                            Math.max(bounds[2], bounds[3]) * r[1]) // max(width, height) * r1
            : ctx.createRadialGradient(
                           pts[0][0], pts[0][1], r[0],  // x0, y0, r0
                           pts[1][0], pts[1][1], r[1]); // x1, y1, r1
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
    return [0, 0];
}
MSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
}
MSeg.prototype.crosses = function(start, point) {
    var pts = this.pts; // == this.last();
    return G.__lineCrosses(point[0], point[1], // px, py
                           start[0], start[1], // x0, y0
                           pts[0], pts[1]);    // x1, y1
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
LSeg.prototype.crosses = function(start, point) {
    var pts = this.pts; // == this.last();
    return G.__lineCrosses(point[0], point[1], // px, py
                           start[0], start[1], // x0, y0
                           pts[0], pts[1]);    // x1, y1
}

function CSeg(pts) {
    this.type = C.P_CURVETO;
    this.pts = pts;
    this.count = pts.length;
}
/*
// A point in two-dimensional space.
typedef struct {
    double x, y;
} point;
// The control points (0 and 1) and end point (2) of a cubic Bezier
// curve.
typedef struct {
    point pt[3];
} curve;

// Calculate parametric value of x or y given t and the four point
// coordinates of a cubic bezier curve. This is a separate function
// because we need it for both x and y values.

double _bezier_point (double t, double start, double control_1,
                 double control_2, double end)
{
    // Formula from Wikipedia article on Bezier curves. 
    return              start * (1.0 - t) * (1.0 - t)  * (1.0 - t) 
           + 3.0 *  control_1 * (1.0 - t) * (1.0 - t)  * t 
           + 3.0 *  control_2 * (1.0 - t) * t          * t
           +              end * t         * t          * t;
}
#define STEPS 10
// Approximate length of the Bezier curve which starts at "start" and
// is defined by "c". According to Computing the Arc Length of Cubic Bezier Curves
// there is no closed form integral for it.

double bezier_length (point start, curve * c)
{
    double t;
    int i;
    int steps;
    point dot;
    point previous_dot;
    double length = 0.0;
    steps = STEPS;
    for (i = 0; i <= steps; i++) {
    t = (double) i / (double) steps;
    dot.x = _bezier_point (t, start.x, c->pt[0].x, 
                   c->pt[1].x, c->pt[2].x);
    dot.y = _bezier_point (t, start.y, c->pt[0].y, 
                   c->pt[1].y, c->pt[2].y);
    if (i > 0) {
        double x_diff = dot.x - previous_dot.x;
        double y_diff = dot.y - previous_dot.y;
        length += sqrt (x_diff * x_diff + y_diff * y_diff);
    }
    previous_dot = dot;
    }
    return length;
} */
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
CSeg.prototype.crosses = function(start, point) {
    var level = level || 0, pts = this.pts;
    return G.__curveCrosses(point[0], point[1], // px, py
                            start[0], start[1], // x0, y0
                            pts[0],   pts[1],   // xc0, yc0
                            pts[2],   pts[3],   // xc1, yc1
                            pts[4],   pts[5],   // x1, y1
                            0);                 // level
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

Text.DEFAULT_FONT = '12px sans-serif';
Text.DEFAULT_FILL = { 'color': '#000' };
Text.BASELINE_RULE = 'bottom';
function Text(lines, font,
              stroke, fill) {
    this.lines = lines;
    this.font = font || Text.DEFAULT_FONT;
    this.stroke = stroke || null;
    this.fill = fill || Text.DEFAULT_FILL;
    this._bnds = null;
}
Text.prototype.apply = function(ctx, point) {
    ctx.save();
    var point = point || [0, 0],
        dimen = this.dimen(),
        accent = this.accent(dimen[1]),
        apt = [ point[0], point[1] + accent];
    ctx.font = this.font;
    ctx.textBaseline = Text.BASELINE_RULE;
    if (this.fill) {
        DU.applyFill(ctx, this.fill);
        ctx.strokeText(this.lines, apt[0], apt[1]);
    }
    if (this.stroke) {
        DU.applyStroke(ctx, this.stroke);
        ctx.fillText(this.lines, apt[0], apt[1]);
    }
    ctx.restore();
}
Text.prototype.dimen = function() {
    if (this._dimen) return this._dimen;
    if (!Text.__buff) throw new Error('no Text buffer, bounds call failed');
    var buff = Text.__buff;
    buff.style.font = this.font;
    buff.innerText = this.lines;
    return (this._dimen = [ buff.offsetWidth,
                            buff.offsetHeight ]);
    
}
Text.prototype.accent = function(height) {
    return height; // FIXME
}
Text._createBuffer = function() {
    var _div = document.createElement('div');
    _div.style.visibility = 'hidden';
    _div.style.position = 'absolute';
    var _span = document.createElement('span');
    _div.appendChild(_span);
    document.body.appendChild(_div);
    return _span; 
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
    this._lhappens = C.NOTHING;
    this._initHandlers(); // TODO: make automatic 
    this._inParent = player.inParent;
}
// TODO: move these settings to default css rule?
Controls.HEIGHT = 40;
Controls.MARGIN = 5;
Controls.BGCOLOR = '#c22';
Controls.OPACITY = 0.8;
Controls.COLOR = '#faa';
Controls._BH = Controls.HEIGHT - (Controls.MARGIN + Controls.MARGIN);
Controls._TS = Controls._BH; // text size
Controls._TW = Controls._TS * 4.4; // text width
provideEvents(Controls, [C.X_MDOWN, C.X_DRAW]);
Controls.prototype.update = function(parent) {
    var _w = parent.width,
        _h = Controls.HEIGHT,
        _hdiff = parent.height - Controls.HEIGHT,
        _pp = find_pos(parent), // parent position
        _bp = [ _pp[0], _pp[1] + _hdiff ], // bounds position
        _cp = this._inParent ? [ parent.parentNode.offsetLeft, 
                                 parent.parentNode.offsetTop + _hdiff ] 
                             : _bp; // position to set in styles
    var _canvas = this.canvas;
    if (!_canvas) {
        _canvas = newCanvas([ _w, _h ]);
        if (parent.id) { _canvas.id = '__'+parent.id+'_ctrls'; }
        _canvas.style.position = 'absolute';                                 
        _canvas.style.opacity = Controls.OPACITY;
        _canvas.style.backgroundColor = Controls.BGCOLOR;
        _canvas.style.zIndex = 100;
        this.id = _canvas.id;
        this.canvas = _canvas;
        this.ctx = _canvas.getContext('2d');
        this.subscribeEvents(_canvas);          
        this.hide();
    } else {
        canvasOpts(_canvas, [ _w, _h ]);
    }
    _canvas.style.left = _cp[0] + 'px';
    _canvas.style.top = _cp[1] + 'px';
    this.ctx.font = Math.floor(Controls._TS) + 'px sans-serif';
    if (!this.ready) {
        var appendTo = this._inParent ? parent.parentNode
                                      : document.body;
        // FIXME: a dirty hack?
        if (this._inParent) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(_canvas);
        this.ready = true;
    }
    this.bounds = [ _bp[0], _bp[1], _bp[0]+_w, _bp[1]+_h ];
}
Controls.prototype.subscribeEvents = function(canvas) {
    canvas.addEventListener('mousedown', (function(controls) { 
            return function(evt) { controls.fire(C.X_MDOWN, evt); };
        })(this), false);
    canvas.addEventListener('mouseout', (function(controls) { 
            return function(evt) { controls.hide(); };
        })(this), false);  
}
Controls.prototype.render = function(state, time, _force) {
    if (this.hidden) return;

    var _s = state.happens;
    if ((time === this._time) && 
        (_s === this._lhappens)) return;
    this._time = time;
    this._lhappens = _s; 
    
    var ctx = this.ctx;
    var _bh = Controls._BH, // button height
        _w = this.canvas.width,
        _h = this.canvas.height,
        _m = Controls.MARGIN,
        _tw = Controls._TW, // text width
        _pw = _w - ((_m * 4) + _tw + _bh); // progress width
    // TODO: update only progress if state not changed?
    ctx.clearRect(0, 0, _w, _h);
    ctx.save();
    ctx.translate(_m, _m);
    ctx.fillStyle = Controls.COLOR;

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
        _w = this.bounds[2] - this.bounds[0]; 
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
        var _pw = _w - ((_m * 4) + _tw + _bh), // progress width
            _px = _lx - (_bh + _m + _m), // progress leftmost x
            _d = this.player.state.duration;
        var _tpos = _px / (_pw / _d); // time position
        if (_s === C.PLAYING) this.player.play(_tpos);
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
InfoBlock.BGCOLOR = '#fff';
InfoBlock.OPACITY = 0.85;
InfoBlock.HEIGHT = 60;
InfoBlock.CLASS = 'InfoBlock';
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
        _div.style.position = 'absolute';                  
        _div.style.opacity = InfoBlock.OPACITY;
        // TODO: move these settings to default css rule?
        _div.style.backgroundColor = InfoBlock.BGCOLOR;
        _div.style.zIndex = 100;
        _div.style.fontSize = '10px';
        _div.style.padding = _p+'px';
        _div.className = InfoBlock.CLASS;
        this.div = _div;
        this.id = _div.id;
        this.hide();
    }
    _div.style.width = _w + 'px';
    _div.style.height = _h + 'px';
    _div.style.top = _t + 'px';
    _div.style.left = _l + 'px';
    if (!this.ready) {
        var appendTo = this._inParent ? parent.parentNode
                                      : document.body;
        // FIXME: a dirty hack?
        if (this._inParent) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(_div);
        this.ready = true;
    }
}
InfoBlock.prototype.inject = function(meta, anim) {
    // TODO: show speed
    this.div.innerHTML = '<p><span class="title">'+meta.title+'</span>'+
            (meta.author ? ' by <span class="author">'+meta.author+'</span>' : '')+'<br/> '+
            '<span class="duration">'+anim.duration+'sec</span>'+', '+
            '<span class="dimen">'+anim.width+'x'+anim.height+'</span>'+'<br/> '+
            '<span class="copy">v'+meta.version+' '+meta.copyright+'</span>'+' '+
            (meta.description ? '<br/><span class="desc">'+meta.description+'</span>' : '')+
            '</p>';
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
InfoBlock.prototype.updateDuration = function(value) {
    this.div.getElementsByClassName('duration')[0].innerHTML = value+'sec';
}

// =============================================================================
// === EXPORTS =================================================================

var exports = {
    
    'C': C, // constants
    'Player': Player,
    'Scene': Scene,
    'Element': Element,
    'Clip': Clip,
    'Path': Path, 'Text': Text,
    'Tweens': Tweens, 'Tween': Tween, 'Easing': Easing,
    'Render': Render, 'Bands': Bands,
    'MSeg': MSeg, 'LSeg': LSeg, 'CSeg': CSeg,
    'DU': DU,

    'createPlayer': function(id, opts) { return new Player(id, opts); },

};

exports._$ = exports.createPlayer;
exports.__js_pl_all = this;
exports.__injectToWindow = function(as) {
          window[as] = exports;
          window.createPlayer = exports.createPlayer; 
        };

return exports;

}); // end of anonymous wrapper