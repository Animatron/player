var C = require('./constants.js'),
    engine = require('engine'),
    Element = require('./element.js'),
    Clip = Element,
    Brush = require('./brush.js'),
    provideEvents = require('./events.js').provideEvents,
    AnimationError = require('./errors.js').AnimationError,
    Errors = require('./loc.js').Errors,
    ResMan = require('./resource_manager.js'),
    FontDetector = require('../vendor/font_detector.js'),
    utils = require('./utils.js'),
    is = utils.is,
    iter = utils.iter;


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

// Animation
// -----------------------------------------------------------------------------

/**
 * @class anm.Animation
 *
 * Create an Animation.
 *
 * It holds an elements tree, an id-to-element map, background fill, zoom and
 * repeat option. It also may render itself to any context with {@link anm.Animation#render}
 * method.
 *
 * @constructor
 */
function Animation() {
    this.id = utils.guid();
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
/**
 * @method add
 * @chainable
 *
 * Append an one or several {@link anm.Element elements} to this animation.
 *
 * May be used as:
 *
 * `anim.add(new anm.Element());`
 * `anim.add([new anm.Element(), new anm.Element()]);`
 * `anim.add(function(ctx) {...}, function(t) { ... });`
 * `anim.add(function(ctx) {...}, function(t) { ... },
 *           function(ctx, prev(ctx)) { ... });`
 *
 * @param {anm.Element|anm.Clip|Array[Element]} subject Any number of Elements to add
 *
 * @return {anm.Element} The Element was appended.
 *
 */
Animation.prototype.add = function(arg1, arg2, arg3) {
    // this method only adds an element to a top-level
    // FIXME: allow to add elements deeper or rename this
    //        method to avoid confusion?
    if (arg2) { // element by functions mode
        var elm = new Element(arg1, arg2);
        if (arg3) elm.changeTransform(arg3);
        this.addToTree(elm);
        //return elm;
    } else if (is.arr(arg1)) { // elements array mode
        var clip = new Clip();
        clip.add(arg1);
        this.addToTree(_clip);
        //return clip;
    } else { // element object mode
        this.addToTree(arg1);
    }
    return this;
}
/* addS allowed to add static element before, such as image, may be return it in some form? */
/**
 * @method remove
 * @chainable
 *
 * Remove (unregister) element from this animation.
 *
 * @param {anm.Element} element
 */
Animation.prototype.remove = function(elm) {
    // error will be thrown in _unregister method
    //if (!this.hash[elm.id]) throw new AnimErr(Errors.A.ELEMENT_IS_NOT_REGISTERED);
    if (elm.parent) {
        // it will unregister element inside
        elm.parent.remove(elm);
    } else {
        this._unregister(elm);
    }
    return this;
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
/**
 * @method traverse
 * @chainable
 *
 * Visit every element in a tree, no matter how deep it is.
 *
 * @param {Function} visitor
 * @param {anm.Element} visitor.element
 * @param {Object} [data]
 */
// visitElems
Animation.prototype.traverse = function(visitor, data) {
    for (var elmId in this.hash) {
        visitor(this.hash[elmId], data);
    }
    return this;
}
/**
 * @method each
 * @chainable
 *
 * Visit every root element (direct Animation child) in a tree.
 *
 * @param {Function} visitor
 * @param {anm.Element} visitor.child
 * @param {Object} [data]
 */
Animation.prototype.each = function(visitor, data) {
    for (var i = 0, tlen = this.tree.length; i < tlen; i++) {
        visitor(this.tree[i], data);
    }
    return this;
}
/**
 * @method iter
 * @chainable
 *
 * Iterate through every root (direct Animation child) element in a tree.
 *
 * @param {Function} iterator
 * @param {anm.Element} iterator.child
 * @param {Boolean} iterator.return `false`, if this element should be removed
 */
Animation.prototype.iter = function(func, rfunc) {
    iter(this.tree).each(func, rfunc);
    return this;
}
/**
 * @method render
 *
 * Render the Animation for given context at given time.
 *
 * @param {Canvas2DContext} ctx
 * @param {Float} time
 * @param {Float} [dt] The difference in time between current frame and previous one
 */
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
        this.each(function(child) {
            child.render(ctx, time, dt);
        });
    } finally { ctx.restore(); }
    this.fire(C.X_DRAW,ctx);
}
Animation.prototype.handle__x = function(type, evt) {
    this.traverse(function(elm) {
        elm.fire(type, evt);
    });
    return true;
}
// TODO: test
/**
 * @method getFittingDuration
 *
 * Get the duration where all child elements' bands fit.
 *
 * @return {Float} The calculated duration
 */
Animation.prototype.getFittingDuration = function() {
    var max_pos = -Infinity;
    var me = this;
    this.each(function(child) {
        var elm_tpos = child._max_tpos();
        if (elm_tpos > max_pos) max_pos = elm_tpos;
    });
    return max_pos;
}
/**
 * @method reset
 * @chainable
 *
 * Reset all render-related data for itself, and the data of all the elements.
 */
Animation.prototype.reset = function() {
    this.__informEnabled = true;
    this.each(function(child) {
        child.reset();
    });
    return this;
}
/**
 * @method dispose
 * @chainable
 *
 * Remove every possible allocated data to either never use this animation again or
 * start using it from scratch as if it never was used before.
 */
Animation.prototype.dispose = function() {
    this.disposeHandlers();
    var me = this;
    /* FIXME: unregistering removes from tree, ensure it is safe */
    this.iter(function(child) {
        me._unregister_no_rm(child);
        child.dispose();
        return false;
    });
    return this;
}
/**
 * @method isEmpty
 *
 * Does Animation has any Elements inside.
 *
 * @return {Boolean} `true` if no Elements, `false` if there are some.
 */
Animation.prototype.isEmpty = function() {
    return this.tree.length == 0;
}
/**
 * @method toString
 *
 * Get a pretty description of this Animation
 *
 * @return {String} pretty string
 */
Animation.prototype.toString = function() {
    return "[ Animation "+(this.name ? "'"+this.name+"'" : "")+"]";
}
/**
 * @method subscribeEvents
 * @private
 *
 * @param {Canvas} canvas
 */
Animation.prototype.subscribeEvents = function(canvas) {
    engine.subscribeAnimationToEvents(canvas, this, DOM_TO_EVT_MAP);
}
/**
 * @method unsubscribeEvents
 * @private
 *
 * @param {Canvas} canvas
 */
Animation.prototype.unsubscribeEvents = function(canvas) {
    engine.unsubscribeAnimationFromEvents(canvas, this);
}
/**
 * @method addToTree
 * @private
 *
 * @param {anm.Element} element
 */
Animation.prototype.addToTree = function(elm) {
    if (!elm.children) {
        throw new AnimationError('It appears that it is not a clip object or element that you pass');
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
    if (this.hash[elm.id]) throw new AnimationError(Errors.A.ELEMENT_IS_REGISTERED);
    elm.registered = true;
    elm.anim = this;
    this.hash[elm.id] = elm;
    var me = this;
    elm.each(function(child) {
        me._register(child);
    });
}
Animation.prototype._unregister_no_rm = function(elm) {
    this._unregister(elm, true);
}
Animation.prototype._unregister = function(elm, save_in_tree) { // save_in_tree is optional and false by default
    if (!elm.registered) throw new AnimationError(Errors.A.ELEMENT_IS_NOT_REGISTERED);
    var me = this;
    elm.each(function(child) {
        me._unregister(child);
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
    this.traverse(function(elm) {
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
    this.traverse(function(elm) {
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
    this.__maskCvs[lvl] = engine.createCanvas(1, 1);
    this.__maskCtx[lvl] = engine.getContext(this.__maskCvs[lvl], '2d');
    this.__backCvs[lvl] = engine.createCanvas(1, 1);
    this.__backCtx[lvl] = engine.getContext(this.__backCvs[lvl], '2d');
    //document.body.appendChild(this.__maskCvs[lvl]);
    //document.body.appendChild(this.__backCvs[lvl]);
}
Animation.prototype.__removeMaskCanvases = function() {
    if (!this.__maskCvs && !this.__backCvs) return;
    if (this.__maskCvs) {
        for (var i = 0, il = this.__maskCvs.length; i < il; i++) {
            if (this.__maskCvs[i]) { // use `continue`?
                engine.disposeElement(this.__maskCvs[i]);
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
                engine.disposeElement(this.__backCvs[i]);
                this.__backCvs[i] = null; // is it required?
                this.__backCtx[i] = null; // is it required?
            }
        }
        this.__maskCvs = null;
        this.__backCtx = null;
    }
}
/**
 * @method find
 *
 * Searches for {@link anm.Element elements} by name inside another
 * {@link anm.Element element} or inside the whole Animation itself, if no other
 * element was provided.
 *
 * @param {String} name Name of the element(s) to find
 * @param {anm.Element} [where] Where to search elements for; if omitted, searches in Animation
 *
 * @return {Array} An array of found elements
 */
Animation.prototype.find = function(name, where) {
    var where = where || this;
    var found = [];
    if (where.name == name) found.push(name);
    where.traverse(function(elm)  {
        if (elm.name == name) found.push(elm);
    });
    return found;
}
/**
 * @method find
 *
 * Searches for {@link anm.Element elements} by ID inside another inside the
 * Animation. Actually, just gets it from hash map, so O(1).
 *
 * @param {String} id ID of the element to find
 * @return {anm.Element|Null} An element you've searched for, or null
 */
Animation.prototype.findById = function(id) {
    return this.hash[id];
}
/*
 * @method invokeAllLaters
 * @private
 */
Animation.prototype.invokeAllLaters = function() {
    for (var i = 0; i < this._laters.length; i++) {
        this._laters[i].call(this);
    };
}
/*
 * @method clearAllLaters
 * @private
 */
Animation.prototype.clearAllLaters = function() {
    this._laters = [];
}
/*
 * @method invokeLater
 * @private
 */
Animation.prototype.invokeLater = function(f) {
    this._laters.push(f);
}
/*
 * @method loadFonts
 * @private
 */
Animation.prototype.loadFonts = function(player) {
    if (!this.fonts || !this.fonts.length) {
        return;
    }

    var fonts = this.fonts,
        style = document.createElement('style'), // FIXME: should use engine
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
    document.head.appendChild(style); // FIXME: should use engine

    for (var i = 0; i < fontsToLoad.length; i++) {
        // FIXME: should not require a player (probably)
        ResMan.loadOrGet(player.id, fontsToLoad[i].url, function(success) {
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

module.exports = Animation;
