var utils = require('../utils.js'),
    is = utils.is,
    iter = utils.iter,
    C = require('../constants.js');

var engine = require('engine'),
    ResMan = require('../resource_manager.js'),
    FontDetector = require('../../vendor/font_detector.js');

var Element = require('./element.js'),
    Clip = Element,
    Brush = require('../graphics/brush.js');

var provideEvents = require('../events.js').provideEvents,
    errors = require('../errors.js'),
    ErrLoc = require('../loc.js').Errors;


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
 * Use {@link anm.Animation#add()} to add elements to an animation.
 *
 * Use {@link anm.Animation#find()} / {@link anm.Animation#findById()} to search for elements in the animation.
 *
 * Use {@link anm.Animation#each()} / {@link anm.Animation#traverse()} to loop through all direct child elements
 * or through the whole tree of children, correspondingly.
 *
 * See {@link anm.Element Element} for detailed description of the basic "brick" of any animation.
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

provideEvents(Animation, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                           C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                           C.X_KPRESS, C.X_KUP, C.X_KDOWN, C.X_ERROR ]);
/**
 * @method add
 * @chainable
 *
 * Append one or several {@link anm.Element elements} to this animation.
 *
 * May be used as:
 *
 * * `anim.add(new anm.Element());`
 * * `anim.add([new anm.Element(), new anm.Element()]);`
 * * `anim.add(function(ctx) {...}, function(t) { ... });`
 * * `anim.add(function(ctx) {...}, function(t) { ... },
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
};

/**
 * @method remove
 * @chainable
 *
 * Remove (unregister) element from this animation.
 *
 * @param {anm.Element} element
 */
Animation.prototype.remove = function(elm) {
    // error will be thrown in _unregister method if element is not registered
    if (elm.parent) {
        // it will unregister element inside
        elm.parent.remove(elm);
    } else {
        this._unregister(elm);
    }
    return this;
};

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
Animation.prototype.traverse = function(visitor, data) {
    if (Object.keys) {
        var hash = this.hash;
        var ids = Object.keys(hash);
        for (var i = 0; i < ids.length; i++) {
            visitor(hash[ids[i]], data);
        }
    } else {
        for (var elmId in this.hash) {
            visitor(this.hash[elmId], data);
        }
    }
    return this;
};

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
};

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
};

/**
 * @method render
 *
 * Render the Animation for given context at given time.
 *
 * @param {Canvas2DContext} context
 * @param {Number} time
 * @param {Number} [dt] The difference in time between current frame and previous one
 */
Animation.prototype.render = function(ctx, time, dt) {
    ctx.save();
    var zoom = this.zoom;
    if (zoom != 1) {
        ctx.scale(zoom, zoom);
    }
    if (this.bgfill) {
        if (!(this.bgfill instanceof Brush)) this.bgfill = Brush.fill(this.bgfill);
        this.bgfill.apply(ctx);
        ctx.fillRect(0, 0, this.width, this.height);
    }
    this.each(function(child) {
        child.render(ctx, time, dt);
    });
    ctx.restore();
};

// TODO: test
/**
 * @method getFittingDuration
 *
 * Get the duration where all child elements' bands fit.
 *
 * @return {Number} The calculated duration
 */
Animation.prototype.getFittingDuration = function() {
    var max_pos = -Infinity;
    var me = this;
    this.each(function(child) {
        var elm_tpos = child._max_tpos();
        if (elm_tpos > max_pos) max_pos = elm_tpos;
    });
    return max_pos;
};

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
};

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
};

/**
 * @method isEmpty
 *
 * Does Animation has any Elements inside.
 *
 * @return {Boolean} `true` if no Elements, `false` if there are some.
 */
Animation.prototype.isEmpty = function() {
    return this.tree.length === 0;
};

/**
 * @method toString
 *
 * Get a pretty description of this Animation
 *
 * @return {String} pretty string
 */
Animation.prototype.toString = function() {
    return "[ Animation "+(this.name ? "'"+this.name+"'" : "")+"]";
};

/**
 * @method subscribeEvents
 * @private
 *
 * @param {Canvas} canvas
 */
Animation.prototype.subscribeEvents = function(canvas) {
    engine.subscribeAnimationToEvents(canvas, this, DOM_TO_EVT_MAP);
};

/**
 * @method unsubscribeEvents
 * @private
 *
 * @param {Canvas} canvas
 */
Animation.prototype.unsubscribeEvents = function(canvas) {
    engine.unsubscribeAnimationFromEvents(canvas, this);
};

/**
 * @method addToTree
 * @private
 *
 * @param {anm.Element} element
 */
Animation.prototype.addToTree = function(elm) {
    if (!elm.children) throw errors.animation(ErrLoc.A.OBJECT_IS_NOT_ELEMENT, this);
    this._register(elm);
    /*if (elm.children) this._addElems(elm.children);*/
    this.tree.push(elm);
};

/*Animation.prototype._addElems = function(elems) {
    for (var ei = 0; ei < elems.length; ei++) {
        var _elm = elems[ei];
        this._register(_elm);
    }
}*/
Animation.prototype._register = function(elm) {
    if (this.hash[elm.id]) throw errors.animation(ErrLoc.A.ELEMENT_IS_REGISTERED, this);
    elm.registered = true;
    elm.anim = this;
    this.hash[elm.id] = elm;

    var me = this;

    //if (!this.__err_handlers) this.__err_handlers = {};
    //this.__err_handlers[elm.id] = elm.on(C.X_ERROR, function(err) { me.fire(C.X_ERROR, err); });

    elm.each(function(child) {
        me._register(child);
    });
};

Animation.prototype._unregister_no_rm = function(elm) {
    this._unregister(elm, true);
};

Animation.prototype._unregister = function(elm, save_in_tree) { // save_in_tree is optional and false by default
    if (!elm.registered) throw errors.animation(ErrLoc.A.ELEMENT_IS_NOT_REGISTERED, this);
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
    elm.unbind(C.X_ERROR, this.__err_handlers[elm.id]);
    elm.registered = false;
    elm.anim = null;
    //elm.parent = null;
};

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
};

Animation.prototype._loadRemoteResources = function(player) {
    var anim = this;
    this.traverse(function(elm) {
        if (elm._hasRemoteResources(anim, player)) {
           elm._loadRemoteResources(anim, player);
        }
    });
    anim.loadFonts(player);
};

/**
 * @method find
 *
 * Searches for {@link anm.Element elements} by name inside another
 * {@link anm.Element element} or inside the whole Animation itself, if no other
 * element was provided.
 *
 * NB: `find` method will be improved soon to support special syntax of searching,
 * so you will be able to search almost everything
 *
 * @param {String} name Name of the element(s) to find
 * @param {anm.Element} [where] Where to search elements for; if omitted, searches in Animation
 *
 * @return {Array} An array of found elements
 */
Animation.prototype.find = function(name, where) {
    where = where || this;
    var found = [];
    if (where.name == name) found.push(name);
    where.traverse(function(elm)  {
        if (elm.name == name) found.push(elm);
    });
    return found;
};

/**
 * @method findById
 *
 * Searches for {@link anm.Element elements} by ID inside another inside the
 * Animation. Actually, just gets it from hash map, so O(1).
 *
 * @param {String} id ID of the element to find
 * @return {anm.Element|Null} An element you've searched for, or null
 *
 * @deprecated in favor of special syntax in `find` method
 */
Animation.prototype.findById = function(id) {
    return this.hash[id];
};

/*
 * @method invokeAllLaters
 * @private
 */
Animation.prototype.invokeAllLaters = function() {
    for (var i = 0; i < this._laters.length; i++) {
        this._laters[i].call(this);
    }
};

/*
 * @method clearAllLaters
 * @private
 */
Animation.prototype.clearAllLaters = function() {
    this._laters = [];
};

/*
 * @method invokeLater
 * @private
 */
Animation.prototype.invokeLater = function(f) {
    this._laters.push(f);
};

var FONT_LOAD_TIMEOUT = 10000, //in ms
    https = engine.isHttps;

/*
 * @method loadFonts
 * @private
 */
Animation.prototype.loadFonts = function(player) {
    if (!this.fonts || !this.fonts.length) {
        return;
    }

    var fonts = this.fonts,
        style = engine.createStyle(),
        css = '',
        fontsToLoad = [],
        detector = new FontDetector();

    for (var i = 0; i < fonts.length; i++) {
        var font = fonts[i];
        if (!font.url || !font.face) {
            //no font name or url
            continue;
        }
        var url = font.url, woff = font.woff;
        if (https) {
            //convert the URLs to https
            url = url.replace('http:', 'https:');
            if (woff) {
                woff = woff.replace('http:', 'https:');
            }
        }
        fontsToLoad.push(font);
        css += '@font-face {\n' +
            'font-family: "' + font.face + '";\n' +
            'src:' +  (woff ? ' url("'+woff+'") format("woff"),\n' : '') +
            ' url("'+url+'") format("truetype");\n' +
            (font.style ? 'font-style: ' + font.style +';\n' : '') +
            (font.weight ? 'font-weight: ' + font.weight + ';\n' : '') +
            '}\n';
    }

    if (fontsToLoad.length === 0) {
        return;
    }

    style.innerHTML = css;
    document.head.appendChild(style); // FIXME: should use engine

    var getLoader = function(i) {
            var face = fontsToLoad[i].face;
            return function(success) {
                var interval = 100,
                counter = 0,
                intervalId,
                checkLoaded = function() {
                    counter += interval;
                    var loaded = detector.detect(face);
                    if (loaded || counter > FONT_LOAD_TIMEOUT) {
                        // after 10 seconds, we'll just assume the font has been loaded
                        // and carry on. this should help when the font could not be
                        // reached for whatever reason.
                        clearInterval(intervalId);
                        success();
                    }
                };
                intervalId = setInterval(checkLoaded, interval);
            };
    };

    for (i = 0; i < fontsToLoad.length; i++) {
        ResMan.loadOrGet(player.id, fontsToLoad[i].url, getLoader(i));
    }

};

module.exports = Animation;
