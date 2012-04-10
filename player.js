/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

(function() { // anonymous wrapper to exclude global context clash

// Here I use the technique where the operable object is passed as a first parameter to functions,
// and `this` is null (window object), not to mess with it at all. So you can use this function with 
// any object as a first parameter and you always know what `this` is in fact. You can name it `delegate`,
// if you wish

// FIXME: remove console.log

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

function inject(from, to) {
    for (var propName in from) {
        if (from.hasOwnProperty(propName)) {
            to[propName] = from[propName];
        }
    }
}

function arr_remove(arr, idx) {
    return arr.slice(0,i).concat( arr.slice(i+1) );   
}

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

// === PLAYER ==================================================================
// =============================================================================

/*
 `id` is canvas id

 you may pass null for options, but if you provide them, at least `mode` is required
 to be set (all other are optional).

 options format:
  { "debug": false,
    "inParent": false,
    "mode": Player.M_VIDEO,
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
    this.__canvasConfigured = false;
    this._init(opts);
}

Player.NOTHING = -1;
Player.STOPPED = 0;
Player.PLAYING = 1;
Player.PAUSED = 2;

Player.PREVIEW_POS = 0.33;
Player.PEFF = 0.07; // seconds to play more when reached end of movie

Player.M_CONTROLS_DISABLED = 0;
Player.M_CONTROLS_ENABLED = 1;
Player.M_INFO_DISABLED = 0;
Player.M_INFO_ENABLED = 2;
Player.M_DO_NOT_HANDLE_EVENTS = 0;
Player.M_HANDLE_EVENTS = 4;
Player.M_PREVIEW = Player.M_CONTROLS_DISABLED
                   | Player.M_INFO_DISABLED       
                   | Player.M_DO_NOT_HANDLE_EVENTS;
Player.M_DYNAMIC = Player.M_CONTROLS_DISABLED
                   | Player.M_INFO_DISABLED
                   | Player.M_HANDLE_EVENTS;
Player.M_VIDEO = Player.M_CONTROLS_ENABLED
                 | Player.M_INFO_ENABLED       
                 | Player.M_DO_NOT_HANDLE_EVENTS;

Player.URL_ATTR = 'data-url';

Player.DEFAULT_CANVAS = { 'width': 400,
                          'height': 250, 
                          'bgcolor': '#fff' };
Player.DEFAULT_CONFIGURATION = { 'debug': false,
                                 'inParent': false,
                                 'mode': Player.M_VIDEO,
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

Player.prototype.load= function(object, importer, callback) {
    var player = this;

    player._checkMode();

    player._reset();

    var whenDone = function() {
        player.e_load();
        player.stop();
        if (callback) callback();
    };

    // TODO: configure canvas using clips bounds
    
    if (object) {
        // FIXME: check through instanceof/typeof
        // FIXME: split canvas configuration (size) 
        //        and meta-information (author, duration) 
        //        in two different objects
        // FIXME: load canvas parameters from canvas element, 
        //        if they are not specified
        if (object.meta) { // exported from Animatron
            L.loadFromObj(player, object, importer, whenDone);
        } else if (object.value) { // Builder instance
            if (!player.__canvasConfigured) {
                player._configureCanvas(Player.DEFAULT_CANVAS);
            }
            L.loadBuilder(player, object, whenDone);
        } else if (object.push) { // array of clips
            if (!player.__canvasConfigured) {
                player._configureCanvas(Player.DEFAULT_CANVAS);
            }
            L.loadClips(player, object, whenDone);
        } else if (object.visitElems) { // Scene instance
            if (!player.__canvasConfigured) {
                player._configureCanvas(Player.DEFAULT_CANVAS);
            }
            L.loadScene(player, object, whenDone);
        } else { // URL
            L.loadFromUrl(player, object, importer, whenDone);
        }
    } else {
        if (!player.__canvasConfigured) {
            player._configureCanvas(Player.DEFAULT_CANVAS);
        }
        player.anim = new Scene();
    }

    //console.log('load', player.id, player.state);

    return player;
}

Player.prototype.play = function(from, speed) {

    if (this.state.happens === Player.PLAYING) return;

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

    _state.happens = Player.PLAYING;

    if (_state.__lastTimeout) window.clearTimeout(_state.__lastTimeout);

    D.drawNext(player.ctx, _state, player.anim, 
               function(state, time) {
                   if (time > (state.duration + Player.PEFF)) {
                       state.time = 0;
                       player.pause();
                       // TODO: support looping?
                       return false;
                   }
                   if (player.controls) {
                       player.controls.render(state, time);
                   }
                   return true;
               });

    player.e_play(_state.from);
    //console.log('play', player.id, _state);

    return player;
}

Player.prototype.stop = function() {
    var player = this;

    player._ensureState();

    var _state = player.state;

    _state.time = 0;
    _state.from = 0;

    if (player.anim) {
        _state.happens = Player.STOPPED;
        player.drawAt(_state.duration * Player.PREVIEW_POS);
    } else {
        _state.happens = Player.NOTHING;
        player.drawSplash();
    }
    if (player.controls) {
        player.controls.render(_state, 0);
    }

    player.e_stop();
    //console.log('stop', player.id, _state);

    return player;    
}

Player.prototype.pause = function() {
    var player = this;
    
    player._ensureState();
    player._ensureAnim();

    var _state = player.state;

    _state.from = _state.time;
    _state.happens = Player.PAUSED;

    player.drawAt(_state.time);

    player.e_pause(_state.time);
    //console.log('pause', player.id, _state);

    return player;    
}

/*Player.prototype.reset = function() {
    
}*/

Player.prototype.onerror = function(callback) { // TODO: make and event?
    var player = this;

    player.e_error();
    //console.log('onerror', player.id, player);

    player.anim = null;
    player.stop();
    // TODO:

    return player;    
}

// === INITIALIZATION ==========================================================
// =============================================================================

provideEvents(Player, ['play', 'pause', 'stop', 'load', 'error']);
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
    _state.happens = Player.NOTHING;
    _state.from = 0;
    _state.time = 0;
    _state.zoom = 1;
    if (this.controls) this.controls.reset();
    if (this.info) this.info.reset();
    this.ctx.clearRect(0, 0, _state.width, _state.height);
    this.stop();
}
// update player's canvas with configuration 
Player.prototype._configureCanvas = function(opts) {
    this.__canvasConfigured = true;
    this._canvasConf = opts;
    this.state.width = opts.width;
    this.state.height = opts.height;
    if (opts.bgcolor) this.state.bgcolor = opts.bgcolor;
    Player.configureCanvas(this.canvas, opts);
    if (this.controls) this.controls.update(this.canvas);
    if (this.info) this.info.update(this.canvas);
    return this;
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
Player.prototype._checkMode = function() {
    if (this.mode & Player.M_CONTROLS_ENABLED) {
        if (!this.controls) {
            this.controls = new Controls(this);
            this.controls.update(this.canvas);
        }
    } else {
        if (this.controls) {
            this.controls.detach(this.canvas);
            delete this.controls;
            this.controls = null;
        }
    }
    if (this.mode & Player.M_INFO_ENABLED) {
        if (!this.info) {
            this.info = new InfoBlock(this);
            this.info.update(this.canvas);
        }
    } else {
        if (this.info) {
            this.info.detach(this.canvas);
            delete this.info;
            this.info = null;
        }
    }
    // FIXME: M_HANDLE_EVENTS
}
Player.prototype.changeRect = function(rect) {
    this._configureCanvas({
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
    this._configureCanvas(conf);
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

Player.createState = function(player) {
    return {
        'time': 0, 'from': 0, 'speed': 1,
        'fps': 30, 'afps': 0, 'duration': 0,
        'debug': false, 'iactive': false, 
        // TODO: use iactive to determine if controls/info should be init-zed
        'width': player.canvas.offsetWidth,
        'height': player.canvas.offsetHeight,
        'zoom': 1.0, 'bgcolor': '#fff',
        'happens': Player.NOTHING,
        '__startTime': -1,
        '__redraws': 0, '__rsec': 0
        //'__drawInterval': null
    };
}
Player.configureCanvas = function(canvas, opts) {
    if (!opts.push) { // object, not array // FIXME: test with typeof
        var _w = opts.width ? Math.floor(opts.width) : 0;
        var _h = opts.height ? Math.floor(opts.height) : 0;
        canvas.width = _w;
        canvas.height = _h;
        canvas.setAttribute('width', _w);
        canvas.setAttribute('height', _h);
        if (opts.bgcolor) { 
            canvas.style.backgroundColor = opts.bgcolor; };
    } else { // array
        var _w = Math.floor(opts[0]);
        var _h = Math.floor(opts[1]);
        canvas.width = _w;
        canvas.height = _h;
        canvas.setAttribute('width', _w);
        canvas.setAttribute('height', _h);
    }
}
Player.newCanvas = function(dimen) {
    var _canvas = document.createElement('canvas');
    Player.configureCanvas(_canvas, [ dimen[0], dimen[1] ]);
    return _canvas;
}
Player.prepareImage = function(url) {
    var _img = new Image();
    _img.onload = function() {
        this.isReady = true; // FIXME: use 'image.complete' and 
                             // '...' (network exist) combination,
                             // 'complete' fails on Firefox
    };
    _img.src = url;
    return _img;
}

// === SCENE ===================================================================
// =============================================================================

// > Scene % ()
function Scene() {
    this.tree = [],
    this.hash = {};
    this.duration = 0;
    this._initHandlers(); // TODO: make automatic
}
provideEvents(Scene, ['mdown', 'draw']);
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
// TODO: add chaining to all external Scene methods?
// > Scene.add % (elem: _Element | Clip)
// > Scene.add % (elems: Array[_Element]) => Clip
// > Scene.add % (draw: Function(ctx: Context),
//                onframe: Function(time: Float),
//                [ transform: Function(ctx: Context, 
//                                      prev: Function(Context)) ]) 
//                => _Element
// > Scene.add % (builder: Builder)
Scene.prototype.add = function(arg1, arg2, arg3) {
    if (arg2) { // element by functions mode
        var _elm = new _Element(arg1, arg2);
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
// > Scene.visitElems % (visitor: Function(elm: _Element))
Scene.prototype.visitElems = function(visitor, data) {
    for (var elmId in this.hash) {
        visitor(this.hash[elmId], data);
    }
}
// > Scene.visitElems % (visitor: Function(elm: _Element))
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
    this.e_draw(ctx);
}
Scene.prototype.handle_mdown = function(evt) {
    /*this.visitElems(function(elm) {
        elm.e_mdown(evt);
    });*/
}
Scene.prototype.calculateDuration = function() {
    var gband = [Number.MAX_VALUE, 0];
    this.visitRoots(function(elm) {
        gband = Bands.expand(gband, elm.findWrapBand());
    });
    return gband[1];
}

// === ELEMENTS ================================================================
// =============================================================================

// > _Element % (draw: Function(ctx: Context),
//               onframe: Function(time: Float))
// FIXME: Underscore here is to prevent conflicts with other libraries.
//        Find another shorter name that will also fit the meaning
function _Element(draw, onframe) {
    this.id = guid();
    this.name = '';
    this.state = _Element.createState();
    this.xdata = _Element.createXData();
    this.children = [];
    this.parent = null;
    //this.draw = draw,
    //this.onframe = onframe;
    this.sprite = false;
    this._drawSeq = [];
    this._onframeSeq = [];
    if (draw) this._drawSeq.push([draw, null]);
    if (onframe) this._onframeSeq.push([onframe, null]);
    this._initHandlers(); // TODO: make automatic
};
_Element.M_PLAYONCE = 0;
_Element.M_LOOP = 1;
_Element.M_BOUNCE = 2;
_Element.DEFAULT_LEN = 10;
// TODO: draw and onframe must be events also?
provideEvents(_Element, ['mdown', 'draw']);
// > _Element.prepare % () => Boolean
_Element.prototype.prepare = function() {
    this.state._matrix.reset();
    if (this.sprite && !this.xdata.canvas) {
        this._drawToCache();
    }
    return true;     
}
// > _Element.onframe % (ltime: Float) => Boolean
_Element.prototype.onframe = function(gtime) {
    var ltime = this.localTime(gtime);
    if (!this.fits(ltime)) return false;
    var seq = this._onframeSeq;
    for (var si = 0; si < seq.length; si++) {
        if (!seq[si][0].call(this.state, ltime, seq[si][1])) return false;
    }
    return true;
}
// > _Element.drawTo % (ctx: Context)
_Element.prototype.drawTo = function(ctx) {
    var seq = this._drawSeq;
    for (var si = 0; si < seq.length; si++) {
        // TODO: pass xdata instead of element
        seq[si][0].call(this/*.xdata*/, ctx, seq[si][1]);
    }
}
// > _Element.draw % (ctx: Context)
_Element.prototype.draw = function(ctx) {
    if (!this.sprite) {
        this.drawTo(ctx);
    } else {
        ctx.drawImage(this.xdata.canvas, this.state.x, this.state.y);
    }
}
// > _Element.transform % (ctx: Context)
_Element.prototype.transform = function(ctx) {
    var s = this.state;
    s._matrix = _Element._applyToMatrix(s);
    ctx.globalAlpha = s.alpha;
    s._matrix.apply(ctx);
};
_Element.prototype._drawToCache = function() {
    var _canvas = Player.newCanvas(this.state.dimen);
    var _ctx = _canvas.getContext('2d');
    this.drawTo(_ctx);
    this.xdata.canvas = _canvas;
}
// > _Element.addPainter % (painter: Function(ctx: Context)) 
//                         => Integer
_Element.prototype.addPainter = function(painter, data) {
    if (!painter) return; // FIXME: throw some error?
    this._drawSeq.push([painter, data]);
    return (this._drawSeq.length - 1);
}
// > _Element.addModifier % (modifier: Function(time: Float, 
//                                              data: Any) => Boolean, 
//                           data: Any) => Integer
_Element.prototype.addModifier = function(modifier, data) {
    if (!modifier) return; // FIXME: throw some error?
    this._onframeSeq.push([modifier, data]);
    return (this._onframeSeq.length - 1);
}
// > _Element.addTween % (tween: Tween)
_Element.prototype.addTween = function(tween) {
    var tweens = this.xdata.tweens;
    if (!(tweens[tween.type])) {
        tweens[tween.type] = [];
    }
    tweens[tween.type].push(tween);
}
// > _Element.changeTransform % (transform: Function(ctx: Context, 
//                                                   prev: Function(Context)))
_Element.prototype.changeTransform = function(transform) {
    this.transform = (function(elm, new_, prev) { 
        return function(ctx) {
           new_.call(elm, ctx, prev); 
        } 
    } )(this, transform, this.transform);
}
// TODO: removePainter/removeModifier
// > _Element.add % (elem: _Element | Clip)
// > _Element.add % (elems: Array[_Element])
// > _Element.add % (draw: Function(ctx: Context),
//                   onframe: Function(time: Float),
//                   [ transform: Function(ctx: Context, 
//                                         prev: Function(Context)) ]) 
//                   => _Element
_Element.prototype.add = function(arg1, arg2, arg3) {
    if (arg2) { // element by functions mode
        var _elm = new _Element(arg1, arg2);
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
// > _Element.addS % (dimen: Array[Int, 2],
//                    draw: Function(ctx: Context),
//                    onframe: Function(time: Float),
//                    [ transform: Function(ctx: Context, 
//                                          prev: Function(Context)) ])
//                    => _Element
_Element.prototype.addS = function(dimen, draw, onframe, transform) {
    var _elm = this.add(draw, onframe, transform);
    _elm.sprite = true;
    _elm.state.dimen = dimen;
    return _elm;
}    
_Element.prototype._addChild = function(elm) {
    this.children.push(elm); // or add elem.id?
    elm.parent = this;
};
_Element.prototype._addChildren = function(elms) {
    for (var ei = 0; ei < elms.length; ei++) {
        this._addChild(elms[ei]);
    }
};
_Element.prototype.render = function(ctx, time) {
    ctx.save();
    if (this.onframe(time) && this.prepare()) {
        this.transform(ctx);
        this.draw(ctx);
    }
    if (this.children.length > 0) {
        var children = this.children;
        for (var ei = 0; ei < children.length; ei++) {
            children[ei].render(ctx, time);
        }
    }
    ctx.restore();
    this.e_draw(ctx); // call only if this element drawn
}
_Element.prototype.bounds = function(time) {
    return G.adaptBounds(this, time, G.bounds(this.xdata));
}
_Element.prototype.inBounds = function(time, point) {
    var tpoint = G.adapt(this, time, point);
    return G.inBounds(this.xdata, tpoint);
}
_Element.prototype.contains = function(time, point) {
    var tpoint = G.adapt(this, time, point);
    return G.contains(this.xdata, tpoint);
}
_Element.prototype.setBand = function(band) {
    if (!band) return;
    this.xdata.gband = band;
    var parent = this.parent,
        children = this.children;
    if (!this.__sbflag) {
        this.__sbflag = true;
        if (parent) {
            parent.applyBand(band); // it will correct parent band
                                    // if it will be wider than the
                                    // band passed
        }
        for (var ei = 0; ei < children.length; ei++) {
            children[ei].reduceBand(band); // it will correct child band
                                           // if it will be narrower than the
                                           // band passed
        };
        this.__sbflag = false;
    }
    this.xdata.lband = parent 
        ? Bands.unwrap(parent.xdata.gband, band)
        : band;
}
// expand element's global-time band if it is already set, 
// or just sets it, if it is not
_Element.prototype.applyBand = function(band) {
    this.setBand(this.xdata.gband 
                 ? Bands.expand(this.xdata.gband, band)
                 : band);
}
// reduce element's global-time band if it is already set, 
// or just sets it, if it is not 
_Element.prototype.reduceBand = function(band) {
    this.setBand(this.xdata.gband 
                 ? Bands.reduce(this.xdata.gband, band)
                 : band);
}
_Element.prototype.setLBand = function(band) {
    if (!band) return;
    this.xdata.lband = this.parent 
        ? Bands.unwrap(this.parent.xdata.gband, band)
        : band;
    this.xdata.gband = this.parent 
        ? Bands.wrap(this.parent.xdata.gband, 
                     this.xdata.lband)
        : band;
    var children = this.children;
    for (var ei = 0; ei < children.length; ei++) {
        children[ei].reduceBand(this.xdata.gband); 
                                       // it will correct child band
                                       // if it will be narrower than the
                                       // band passed
    };
}
// reduce element's local-time band if it is already set, 
// or just sets it, if it is not 
_Element.prototype.applyLBand = function(band) { 
    this.setLBand(this.xdata.lband 
                  ? Bands.expand(this.xdata.lband, band)
                  : band);
}
// expand element's local-time band if it is already set, 
// or just sets it, if it is not
_Element.prototype.reduceLBand = function(band) {
    this.setLBand(this.xdata.lband 
                  ? Bands.reduce(this.xdata.lband, band)
                  : band);
}
// make element band fit all children bands
_Element.prototype.makeBandFit = function() {
    this.applyBand(this.findWrapBand());
}
_Element.prototype.fits = function(ltime) {
    if (ltime < 0) return false;
    return (ltime <= (this.xdata.lband[1]
                      - this.xdata.lband[0]));
}
_Element.prototype.localTime = function(gtime) {
    var t = (this.state.t !== null) 
            ? this.state.t
            : ((this.state.rt !== null)
               ? this.state.rt * (this.xdata.lband[1]
                                  - this.xdata.lband[0])
               : 0);
    switch (this.xdata.mode) {
        case _Element.M_PLAYONCE:
            return this.parent
                   ? ((gtime - this.parent.xdata.gband[0])
                      - this.xdata.lband[0]) + t
                   : (gtime - this.xdata.gband[0]) + t;
        case _Element.M_LOOP: {
                var duration = this.xdata.lband[1] - 
                               this.xdata.lband[0];
                var offset = this.parent 
                             ? ((gtime - this.parent.xdata.gband[0])
                                - this.xdata.lband[0])
                             : (gtime - this.xdata.gband[0]);
                var wtime = Math.floor(offset / duration); 
                return offset - (duration * wtime) + t;
            }
        case _Element.M_BOUNCE:
                var duration = this.xdata.lband[1] - 
                               this.xdata.lband[0];
                var offset = this.parent 
                             ? ((gtime - this.parent.xdata.gband[0])
                                - this.xdata.lband[0])
                             : (gtime - this.xdata.gband[0]);
                var wtime = Math.floor(offset / duration); 
                var result = offset - (duration * wtime) + t;
                return ((wtime % 2) === 0) 
                       ? result : (duration - result); 
    }
}
_Element.prototype.handle_mdown = function(evt) {
    //console.log(evt);
    // TODO: call inBounds
}
// calculates band that fits all child elements, recursively
// FIXME: test
_Element.prototype.findWrapBand = function() {
    var children = this.children;
    if (children.length === 0) return this.xdata.gband;
    var result = [ Number.MAX_VALUE, 0 ];
    for (var ei = 0; ei < children.length; ei++) {
        result = Bands.expand(result, children[ei].findWrapBand());
    }
    return (result[0] !== Number.MAX_VALUE) ? result : null;
}
// FIXME: ensure element has a reg-point (auto-calculated) 

// state of the element
_Element.createState = function() {
    return { 'x': 0, 'y': 0,   // position
             'rx': 0, 'ry': 0, // registration point shift
             'angle': 0,       // rotation angle
             'sx': 1, 'sy': 1, // scale by x / by y 
             'alpha': 1,       // opacity
             't': null, 'rt': null, // cur local time (t) or 0..1 time (rt) (t have higher priority),
                                    // if both are null — stays as defined
             '_matrix': new Transform() };
};
// geometric data of the element
_Element.createXData = function() {
    return { 'reg': null,      // registration point
             'image': null,    // cached Image instance, if it is an image
             'path': null,     // Path instanse, if it is a shape 
             'text': null,     // Text data, if it is a text (`path` holds stroke and fill)
             'tweens': {},     // animation tweens (Tween class)         
             'mode': _Element.M_PLAYONCE,         // playing mode
             'lband': [0, _Element.DEFAULT_LEN], // local band
             'gband': [0, _Element.DEFAULT_LEN], // global bane
             'dimen': null,    // dimensions for static (cached) elements
             'canvas': null,   // own canvas for static (cached) elements             
             '_mpath': null };
}
_Element._applyToMatrix = function(s) {
    var _t = s._matrix;
    _t.translate(s.x, s.y);
    _t.rotate(s.angle);    
    _t.scale(s.sx, s.sy);
    _t.translate(-s.rx, -s.ry);   
    return _t;
}

var Clip = _Element;

// =============================================================================
// === DRAWING =================================================================

var D = {}; // means "Drawing"

// draws current state of animation on canvas and postpones to call itself for 
// the next time period (so to start animation, you just need to call it once 
// when the first time must occur and it will chain its own calls automatically)
D.drawNext = function(ctx, state, scene, callback) {
    // NB: state here is a player state, not an element state

    if (state.happens !== Player.PLAYING) return;

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
    ctx.beginPath();
    DU.applyStroke(ctx, stroke);
    DU.applyFill(ctx, fill);
    func();
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
}

var G = {}; // geometry

G.adapt = function(elm, time, point) {
    return point;
    // FIXME: return real value
}
G.adaptBounds = function(elm, time, bounds) {
    return bounds;
    // FIXME: return real value
}
G.bounds = function(xdata) {
    if (xdata.path) {
        return xdata.path.bounds();
    };
    // TODO: handle images and stuff
}
G.inBounds = function(xdata, point) {
    if (xdata.path) {
        return xdata.path.inBounds(point);
    };
    // TODO: handle images and stuff
}
G.contains = function(xdata, point) {
    if (G.inBounds(xdata, point)) {
        if (xdata.path) {
            return xdata.path.contains(point);
        };
        // TODO: handle images and stuff    
    }
    return false;   
}
G.__lineCrosses = function(px, py, x0, y0, x1, y1) {
    if ((py < y0) && (py < y1)) return 0;
    if ((py >= y0) && (py >= y1)) return 0;
    // assert y0 != y1
    if ((px >= x0) && (px >= x1)) return 0;
    if ((px < x0) && (px < x1)) return (y0 < y1) ? 1 : -1;
    var xitcpt = x0 + (py - y0) * (x1 - x0) / (y1 - y0);
    if (px > xitcpt) return 0;
    return (y0 < y1) ? 1 : -1;
}
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
    xc0 = (x0 + xc0) / 2;
    yc0 = (y0 + yc0) / 2;
    xc1 = (xc1 + x1) / 2;
    yc1 = (yc1 + y1) / 2;
    var xc0m = (xc0 + xmid) / 2,
        yc0m = (yc0 + ymid) / 2;
        xmc1 = (xmid + xc1) / 2;
        ymc1 = (ymid + yc1) / 2;
    xmid = (xc0m + xmc1) / 2;
    ymid = (yc0m + ymc1) / 2;
    if (Math.isNaN(xmid) || Math.isNaN(ymid)) {
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
    if (importer.configureMeta) {
        player.configureMeta(importer.configureMeta(object));
    }
    if (importer.configureAnim) {
        player.configureAnim(importer.configureAnim(object));
    }
    L.loadScene(player, importer.load(object), callback);
}
L.loadScene = function(player, scene, callback) {
    // add rendering
    scene.visitElems(Render.addXDataRender);
    if (player.state.debug) scene.visitElems(Render.addDebugRender);
    // subscribe events
    L.subscribeEvents(player.canvas, scene);
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
    _anim.add(builder);
    L.loadScene(player, _anim, callback);
}
L.subscribeEvents = function(canvas, anim) {
    canvas.addEventListener('mousedown', function(evt) {
        anim.e_mdown(evt);
    }, false);
}

// =============================================================================
// === CUSTOM RENDERING ========================================================

var Render = {}; // means "Render"

Render.addXDataRender = function(elm) {
    var xdata = elm.xdata;

    // modifiers
    //if (xdata.gband) elm.addModifier(Render.m_checkBand, xdata.gband);
    if (xdata.tweens) Render.addTweensModifiers(elm, xdata.tweens);
    if (xdata.reg) elm.addModifier(Render.m_saveReg, xdata.reg);

    // painters
    if (xdata.path) elm.addPainter(Render.p_drawPath, xdata.path);
    if (xdata.image) elm.addPainter(Render.p_drawImage, xdata.image);
    if (xdata.text) elm.addPainter(Render.p_drawText, xdata.text);
        
}

Render.addDebugRender = function(elm) {
    if (elm.xdata.reg) elm.addPainter(Render.p_drawReg, elm.xdata.reg);
    if (elm.name) elm.addPainter(Render.p_drawName, elm.name);
    elm.on('draw', Render.p_drawMPath);
}

Render.addTweensModifiers = function(elm, tweens) {
    var _order = Tween.TWEENS_ORDER;

    for (var oi = 0; oi < _order.length; oi++) {
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
                                   TimeEasings[easing.type](easing.data),
                                   Tweens[tween.type],
                                   tween.band);
    elm.addModifier(modifier, tween.data);
}

Render.p_drawReg = function(ctx, reg) {
    var reg = reg || this.xdata.reg; 
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#600';
    ctx.moveTo(reg[0], reg[1]-10);
    ctx.lineTo(reg[0], reg[1]);
    ctx.moveTo(reg[0]+3, reg[1]);
    //ctx.moveTo(reg[0], reg[1] + 5);
    ctx.arc(reg[0],reg[1],3,0,Math.PI*2,true);
    ctx.closePath();
    ctx.stroke();
}

Render.p_drawPath = function(ctx, path) {
    var path = path || this.xdata.path;
    path.apply(ctx);
}

Render.p_drawImage = function(ctx, image) {
    var image = image || this.xdata.image;
    if (image.isReady) ctx.drawImage(image, 0, 0);
}

Render.p_drawText = function(ctx, text) {
    var text = text || this.xdata.text;
    text.apply(ctx, this.xdata.reg);
}

Render.p_drawMPath = function(ctx) {
    if (this.state._mpath) {
        var tPath = this.state._mpath;
        tPath.setStroke('#600', 2.0);
        ctx.beginPath();
        tPath.apply(ctx);
        ctx.closePath();
        ctx.stroke();
    };
}

Render.p_drawName = function(ctx, name) {
    var name = name || this.name;
    if (name) {
        var state = this.state;
        // FIXME: calculate origin automatically
        var pt = state.reg ?
                 [ state.reg[0] + state.x,
                   state.reg[1] + state.y ]
                 : [ state.x, state.y ];
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText(name, pt[0], pt[1] + 10);
    };
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

var Bands = {};

// makes inner band coords relative to outer space (local => global) 
Bands.wrap = function(outer, inner) {
    if (!outer) return inner;
    /*var finish = ((outer[0] + inner[1]) <= outer[1])
                  ? (outer[0] + inner[1])
                  : outer[1],
        start = (finish < outer[1]) 
                  ? (outer[0] + inner[0])
                  : inner[]
         
    return [ start, finish ]; */
    return [ outer[0] + inner[0],
             ((outer[0] + inner[1]) <= outer[1])
              ? (outer[0] + inner[1])
              : outer[1]               
            ];
}
// makes inner band coords relative to inner space (global => local) 
Bands.unwrap = function(outer, inner) {
    if (!outer) return inner;
    return [ ((inner[0] - outer[0]) >= 0)
              ? (inner[0] - outer[0])
              : 0,
             (inner[1] < outer[1])
              ? (inner[1] - outer[0])
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

var Tween = {};
var Easing = {};

// tween constants
Tween.T_TRANSLATE   = 'TRANSLATE';
Tween.T_SCALE       = 'SCALE';
Tween.T_ROTATE      = 'ROTATE';
Tween.T_ROT_TO_PATH = 'ROT_TO_PATH';
Tween.T_ALPHA       = 'ALPHA';
// tween order
Tween.TWEENS_ORDER = [ Tween.T_TRANSLATE, Tween.T_SCALE, Tween.T_ROTATE, 
                       Tween.T_ROT_TO_PATH, Tween.T_ALPHA ];

var Tweens = {};
Tweens[Tween.T_ROTATE] = 
    function(t, data) {
        this.angle = data[0] * (1 - t) + data[1] * t;
        //state.angle = (Math.PI / 180) * 45;
    };
Tweens[Tween.T_TRANSLATE] = 
    function(t, data) {
        var p = data.pointAt(t);
        this._mpath = data;
        this.x = p[0];
        this.y = p[1];
    };
Tweens[Tween.T_ALPHA] =
    function(t, data) {
        this.alpha = data[0] * (1 - t) + data[1] * t;
    };
Tweens[Tween.T_SCALE] =    
    function(t, data) {
        this.sx = data[0][0] * (1.0 - t) + data[1][0] * t;
        this.sy = data[0][1] * (1.0 - t) + data[1][1] * t;  
    };
Tweens[Tween.T_ROT_TO_PATH] = 
    function(t, data) {
        var path = this._mpath;
        this.angle = path.tangentAt(t); //Math.atan2(this.y, this.x);
    };

Easing.T_DEF = 'DEF';
Easing.T_IN = 'IN';
Easing.T_OUT = 'OUT';
Easing.T_INOUT = 'INOUT';
Easing.T_PATH = 'PATH';
Easing.T_FUNC = 'FUNC';

// FIXME: change to sinus/cosinus
Easing.__SEGS = {};
Easing.__SEGS[Easing.T_DEF] = new CSeg([.25, .1, .25, 1, 1, 1]);
Easing.__SEGS[Easing.T_IN] = new CSeg([.42, 0, 1, 1, 1, 1]);
Easing.__SEGS[Easing.T_OUT] = new CSeg([0, 0, .58, 1, 1, 1]);
Easing.__SEGS[Easing.T_INOUT] = new CSeg([.42, 0, .58, 1, 1, 1]);

var TimeEasings = {};
TimeEasings[Easing.T_DEF] = 
    function() {
        var seg = Easing.__SEGS[Easing.T_DEF];
        return function(t) {
            return seg.atT([0, 0], t)[1];
        }
    };
TimeEasings[Easing.T_IN] = 
    function() {
        var seg = Easing.__SEGS[Easing.T_IN];
        return function(t) {
            return seg.atT([0, 0], t)[1];
        }
    };
TimeEasings[Easing.T_OUT] = 
    function() {
        var seg = Easing.__SEGS[Easing.T_OUT];
        return function(t) {
            return seg.atT([0, 0], t)[1];
        }
    };
TimeEasings[Easing.T_INOUT] = 
    function() {
        var seg = Easing.__SEGS[Easing.T_INOUT];
        return function(t) {
            return seg.atT([0, 0], t)[1];
        }
    };
TimeEasings[Easing.T_PATH] =
    function(path) {
        //var path = Path.parse(str);
        return function(t) {
            return path.pointAt(t)[1];
        }
    };
TimeEasings[Easing.T_FUNC] =
    function(f) {
        return f;
    };

// === EVENTS ==================================================================
// =============================================================================

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
            this.handlers = arr_remove(this.handlers, idx);
        } else {
            throw new Error('No such handler ' + idx + ' for event ' + event);
        }
    };
    // FIXME: call fire/e_-funcs only from inside of their providers,
    // TODO: wrap them with event objects
    for (var ei = 0; ei < events.length; ei++) {
        var _event = events[ei];
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

// > Path % (str: String) 
function Path(str, stroke, fill) {
    this.str = str;
    this.stroke = stroke;
    this.fill = fill;
    this.segs = [];
    this.parse(str);
}

// path constants
Path.P_MOVETO = 0;
Path.P_LINETO = 1;
Path.P_CURVETO = 2;

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
Path.prototype._applyVisitor = function(segment, ctx) {
    var marker = segment.type;
    var positions = segment.pts;
    if (marker === Path.P_MOVETO) {
        ctx.moveTo(positions[0], positions[1]);
    } else if (marker === Path.P_LINETO) {
        ctx.lineTo(positions[0], positions[1]);
    } else if (marker === Path.P_CURVETO) {
        ctx.bezierCurveTo(positions[0], positions[1],
                          positions[2], positions[3],
                          positions[4], positions[5]);
    }
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
    for (var si = 0; si < nsegs; si++) {
        var seg = this.segs[si];
        var slen = seg.length(p); // segment length
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
Path.prototype.inBounds = function(point) {
    var _b = this.bounds();
    return ((point[0] >= _b[0]) &&
            (point[1] >= _b[1]) &&
            (point[0] <= _b[2]) &&
            (point[1] <= _b[3]));
}
Path.prototype.contains = function(t, point) {
    return this.fill ? (this.crosses(point) === -1) 
                     : false /* TODO (this.getHitAt(time, point)) ..*/;
}
Path.prototype.crosses = function(point) {
    // TODO: check for infinity
    if (segs.length < 2) return false;
    var p = this.start();
    var crossings = 0;
    this.visit(function(segment) {
        crossings += segment.crosses(p, point);
        //if (segment.crosses(p, point)) return true; // TODO: return point?
        p = segment.last();
    });
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
        for (var i = 0; i < stops.length; i++) {
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
        for (var i = 0; i < stops.length; i++) {
            var stop = stops[i];
            grad.addColorStop(stop[0], stop[1]);
        }
        return grad;
    }
    return null;
}

function MSeg(pts) {
    this.type = Path.P_MOVETO;
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
    var end = this.last();
    return G.__lineCrosses(point[0], point[1], // px, py
                           start[0], start[1], // x0, y0
                           end[0], end[1]);    // x1, y1
}

function LSeg(pts) {
    this.type = Path.P_LINETO;
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
    var end = this.last();
    return G.__lineCrosses(point[0], point[1], // px, py
                           start[0], start[1], // x0, y0
                           end[0], end[1]);    // x1, y1
}

function CSeg(pts) {
    this.type = Path.P_CURVETO;
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
CSeg.prototype.crosses = function(start, point) {
    var level = level || 0, pts = this.pts;
    return G.__curveCrosses(point[0], point[1], // px, py
                            start[0], start[1], // x0, y0
                            pts[0],   pts[1],   // xc0, yc0
                            pts[2],   pts[3],   // xc1, yc1
                            pts[4],   pts[5],   // x1, y1
                            0);                 // level
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
    this._lhappens = Player.NOTHING;
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
provideEvents(Controls, ['mdown', 'draw']);
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
        _canvas = Player.newCanvas([ _w, _h ]);
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
        Player.configureCanvas(_canvas, [ _w, _h ]);
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
            return function(evt) { controls.e_mdown(evt); };
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
    if (_s === Player.PLAYING) {
        // pause button
        Controls.__pause_btn(ctx);
    } else if (_s === Player.STOPPED) {
        // play button
        Controls.__play_btn(ctx);
    } else if (_s === Player.PAUSED) {
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
    this.e_draw(state);
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
        if (_s === Player.STOPPED) {
            this.player.play(0);
        } else if (_s === Player.PAUSED) {
            this.player.play(this._time);
        } else if (_s === Player.PLAYING) {
            this.player.pause();
        }
    } else if (_lx < (_w - (_tw + _m))) { // progress area 
        var _s = this.player.state.happens;
        if (_s === Player.NOTHING) return;
        var _pw = _w - ((_m * 4) + _tw + _bh), // progress width
            _px = _lx - (_bh + _m + _m), // progress leftmost x
            _d = this.player.state.duration;
        var _tpos = _px / (_pw / _d); // time position
        if (_s === Player.PLAYING) this.player.play(_tpos);
        else if ((_s === Player.PAUSED) ||
                 (_s === Player.STOPPED)) {
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
    this.div.innerHTML = '<p><span class="title">'+meta.title+'</span>'+' by '+
            '<span class="author">'+meta.author+'</span>'+'.<br/> '+
            '<span class="duration">'+anim.duration+'sec</span>'+', '+
            '<span class="dimen">'+anim.width+'x'+anim.width+'</span>'+'.<br/> '+
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

var all = this;    
var exports = {
    'Player': Player,
    'Scene': Scene,
    '_Element': _Element,
    'Clip': Clip,
    'Path': Path, 'Text': Text,
    'Tweens': Tweens, 'Tween': Tween, 'Easing': Easing,
    'Render': Render, 'Bands': Bands,
    'MSeg': MSeg, 'LSeg': LSeg, 'CSeg': CSeg,
    'DU': DU,

    'createPlayer': function(id, opts) { return new Player(id, opts); },

    '__js_pl_all': all
}
inject(exports, window);

})(); // end of anonymous wrapper