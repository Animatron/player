var log = require('../log.js'),
    utils = require('../utils.js'),
    global_opts = require('../global_opts.js');

var iter = utils.iter,
    is = utils.is;

var engine = require('engine');

var C = require('../constants.js');

var events = require('../events.js'),
    provideEvents = events.provideEvents,
    EventState = events.EventState;

var Transform = require('../../vendor/transform.js');

var Render = require('../render.js');

var Brush = require('../graphics/brush.js'),
    Color = require('../graphics/color.js'),
    Bounds = require('../graphics/bounds.js');

var Timeline = require('./timeline.js');

var Modifier = require('./modifier.js'),
    Painter = require('./painter.js');

var errors = require('../errors.js'),
    ErrLoc = require('../loc.js').Errors;

// Internal Constants
// -----------------------------------------------------------------------------

var TIME_PRECISION = 9; // the number of digits after the floating point
                        // to round the time when comparing with bands and so on;
                        // used to get rid of floating point-conversion issues

function t_adjust(t) {
    return utils.roundTo(t, TIME_PRECISION);
}

function t_cmp(t0, t1) {
    if (t_adjust(t0) > t_adjust(t1)) return 1;
    if (t_adjust(t0) < t_adjust(t1)) return -1;
    return 0;
}

Element.DEFAULT_PVT = [ 0.5, 0.5 ];
Element.DEFAULT_REG = [ 0.0, 0.0 ];

/**
 * @class anm.Element
 *
 * An Element is literally everything what may be drawn in your animation. Or even not
 * to be drawn, but to have some position. Or to have children elements. Or both.
 *
 * There are also some setter-like methods, and if a name of some setter matches
 * to the according property it sets, a `$` symbol is appended to a property name: like
 * the method {@link anm.Element#fill .fill} and the property {@link anm.Element#$fill .$fill}. This way allows us not only
 * to avoid name-clashed, but also serves as an additional mark for user that a value of this
 * property is easier to construct with a corresponding helper method, rather than,
 * for example, creating a special {@link anm.Brush Brush} object for a `fill`.
 *
 * See {@link anm.Element#add add} and {@link anm.Element#remove remove} methods for documentation
 * on adding and removing children elements.
 *
 * See {@link anm.Element#each each} and {@link anm.Element#traverse traverse} method for documentation
 * on iteration over children elements.
 *
 * See {@link anm.Element#path path}, {@link anm.Element#text text} and {@link anm.Element#image image}
 * for documentation on changing the type of the element and the way it draws itself.
 *
 * See {@link anm.Element#rect rect}, {@link anm.Element#oval oval} and other shape-related methods
 * for documentation on changing element's shape.
 *
 * See {@link anm.Element#fill fill}, {@link anm.Element#stroke stroke} and
 * {@link anm.Element#shadow shadow} methods for documentation on changing appearance of the element.
 * (Fill/Shadow only apply if element is `path`, `shape` or `text`).
 *
 * See {@link anm.Element#band band} for documentation on how to set element's lifetime relatively to its parent.
 *
 * See {@link anm.Element#repeat repeat}, {@link anm.Element#once once}, {@link anm.Element#stay stay},
 * {@link anm.Element#loop loop}, {@link anm.Element#bounce bounce} for documentation on how to make this element
 * self-repeat or to stay in its last state inside the parent's lifetime.
 *
 * See {@link anm.Tween Tween} and {@link anm.Element#tween tween} method for documentation on adding tweens.
 *
 * See {@link anm.Modifier Modifier} in pair with {@link anm.Element#modify modify} method and {@link anm.Painter Painter}
 * in pair with {@link anm.Element#modify paint} method for documentation on
 * a custom drawing or positioning the element in time.
 *
 * @constructor
 *
 * @param {String} [name]
 * @param {Function} [draw] If one function may draw this element, you may provide it here
 * @param {anm.Element} draw.this
 * @param {Context2D} draw.ctx
 * @param {Function} [onframe] This function may be called on every frame and modify this element position
 * @param {anm.Element} onframe.this
 * @param {Number} onframe.time A current local time
 */
function Element(name, draw, onframe) {

    this.id = utils.guid(); /** @property {String} id element internal ID @readonly */
    this.name = name || ''; /** @property {String} name element's name, if specified */
    this.type = C.ET_EMPTY; /** @property {anm.C.ET_*} type of the element: `ET_EMPTY` (default), `ET_PATH`, `ET_TEXT` or `ET_SHEET` @readonly */
    this.children = [];     /** @property {Array[anm.Element]} children A list of children elements for this one. Use `.add()` and `.remove()` methods to change @readonly */
    this.parent = null;     /** @property {anm.Element} parent parent element, if exists @readonly */
    this.level = 0;         /** @property {Number} level how deep this element is located in animation tree @readonly */
    this.anim = null;       /** @property {anm.Animation} anim the animation this element belongs to / registered in, if it really belongs to one @readonly */
    this.scene = null;      /** @property {anm.Scene} scene the scene this element belongs to / registered in, if it really belongs to one @readonly */
    this.disabled = false;  /** @property {Boolean} visible Is this element visible or not (called, but not drawn) */
    this.visible = true;    /** @property {Boolean} disabled Is this element disabled or not */
    this.affectsChildren = true; /** @property {Boolean} affectsChildren Is this element local time affects children local time */
    this.$data = null;      /** @property {Any} $data user data */

    this.shown = false; // system flag, set by engine
    this.registered = false; // is registered in animation or not
    this.rendering = false; // in process of rendering or not

    this.initState(); // initializes matrix, values for transformations
    this.initVisuals(); // initializes visual representation storage and data
    this.initTime(); // initialize time position and everything related to time jumps
    this.initEvents(); // initialize events storage and mechanics

    this.$modifiers = {};  /** @property {Array[anm.Modifier]} $modifiers A list of modifiers, grouped by type @readonly */
    this.$painters = {};   /** @property {Array[anm.Painter]} $painters A list of painters, grouped by type @readonly */
    if (onframe) this.modify(onframe);
    if (draw) this.paint(draw);
    this.__modifying = null; // current modifiers class, if modifying
    this.__painting = null; // current painters class, if painting
    this.__modifiers_hash = {}; // applied modifiers, by id
    this.__painters_hash = {}; // applied painters, by id

    this.__detachQueue = [];
    this.__frameProcessors = [];

    // FIXME: add all of the `provideEvents` method to docs for all elements who provide them
    var me = this,
        default_on = this.on;
    /**
     * @method on
     *
     * Subscribe for an element-related event with a handler.
     *
     * There's quite big list of possible events to subscribe, and it will be added here later. `TODO`
     *
     * For example, `C.X_START` and `C.X_END` events are fired when this element's band
     * starts and finishes in process of animation rendering.
     *
     * @param {C.X*} type event type
     * @param {Function} handler event handler
     */
    this.on = function(type, handler) {
        /* if (events.mouseOrKeyboard(type)) {
            return this.m_on.call(me, type, handler);
        } else */ return default_on.call(me, type, handler);
        // return this; // FIXME: make chainable
    };

    this.addSysModifiers();
    this.addSysPainters();
    if (global_opts.liveDebug) this.addDebugRender();
}
Element._$ = function(name, draw, onframe) { return new Element(name, draw, onframe); };
Element.NO_TIME = null;
Element.NO_BAND = null;
Element.DEFAULT_LEN = Infinity;
Element._customImporters = [];
provideEvents(Element, [ C.X_MCLICK, C.X_MDCLICK, C.X_MUP, C.X_MDOWN,
                         C.X_MMOVE, C.X_MOVER, C.X_MOUT,
                         C.X_START, C.X_END ]);
/**
 * @method is
 *
 * Check, if this element represents {@link anm.Path Path}, {@link anm.Text Text},
 * {@link anm.Sheet Sheet}, or it's empty
 *
 * @param {String} type to check for: `'empty'`, `'path'`, `'text'`, `'image'`, `'audio'`, `'video'`...
 * @return {Boolean}
 */
Element.prototype.is = function(type) {
    return this.type == type;
};

Element.prototype.initState = function() {

    /** @property {Number} x position on the X axis, relatively to parent */
    /** @property {Number} y position on the Y axis, relatively to parent */
    /** @property {Number} angle rotation angle, in radians, relative to parent */
    /** @property {Number} sx scale over X axis, relatively to parent */
    /** @property {Number} sy scale over Y axis, relatively to parent */
    /** @property {Number} hx skew over X axis, relatively to parent */
    /** @property {Number} hy skew over Y axis, relatively to parent */
    /** @property {Number} alpha opacity, relative to parent */

    // current state
    this.x = 0; this.y = 0;   // dynamic position
    this.sx = 1; this.sy = 1; // scale by x / by y
    this.hx = 0; this.hy = 0; // shear by x / by y
    this.angle = 0;           // rotation angle
    this.alpha = 1;           // opacity
    // these values are for user to set
    //this.dt = null;
    //this.t = null; this.rt = null; this.key = null;
                               // cur local time (t) or 0..1 time (rt) or by key (t have highest priority),
                               // if both are null — stays as defined

    if (this.matrix) { this.matrix.reset(); }
    else { this.matrix = new Transform(); }

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
    //this._dt = null;
    //this._t = null; this._rt = null; this._key = null;
                                // cur local time (t) and 0..1 time (rt) and,
                                // if it was ever applied, the last applied key

    if (this._matrix) { this._matrix.reset(); }
    else { this._matrix = new Transform(); }

    /** @property {Array[Number]} $reg registration point (X and Y position) @readonly */
    /** @property {Array[Number]} $pivot pivot point (relative X and Y position) @readonly */

    this.$reg = Element.DEFAULT_REG;   // registration point (static values)
    this.$pivot = Element.DEFAULT_PVT; // pivot (relative to dimensions)

    return this;
};

Element.prototype.resetState = Element.prototype.initState;
Element.prototype.initVisuals = function() {

    // since properties below will conflict with getters/setters having same names,
    // they're renamed with dollar-sign. this way also allows methods to be replaced
    // with native JS 1.5 getters/setters just in few steps. (TODO)

    /** @property {anm.Brush} $fill element fill @readonly */
    /** @property {anm.Brush} $stroke element stroke @readonly */
    /** @property {anm.Brush} $shadow element shadow @readonly */

    this.$fill = null;   // Fill instance
    this.$stroke = null; // Stroke instance
    this.$shadow = null; // Shadow instance

    // TODO: change to `{anm.Path|anm.Sheet|anm.Text} $visual`
    /** @property {anm.Path} $path set to some curve, if it's a shape @readonly */
    /** @property {anm.Sheet} $sheet set to some image, if it's an image @readonly */
    /** @property {anm.Text} $text set to some text, if it's a text @readonly */

    this.$path = null;  // Path instanse, if it is a shape
    this.$text = null;  // Text data, if it is a text
    this.$image = null; // Sheet instance, if it is an image or a sprite sheet

    this.composite_op = null; // composition operation

    /** @property {anm.Element} $mask masking element @readonly */

    this.$mask = null; // Element instance, if this element has a mask
    this.$mpath = null; // move path, though it's not completely "visual"

    this.$bounds = null; // Element bounds incl. children, cached by time position
    this.lastBoundsSavedAt = null; // time, when bounds were saved last time
    this.$my_bounds = null; // Element bounds on its own, cached

    this.$audio = null;
    this.$video = null;

    return this;
};

Element.prototype.resetVisuals = Element.prototype.initVisuals;
Element.prototype.initTime = function() {

    /** @property {anm.Timeline} timeline instance @readonly */

    this.time = new Timeline(this);

    /** @property {String} switch (name of the child to render in current moment) */

    this.switch = null;

    return this;
};

Element.prototype.resetTime = function() {
    this.time.reset();
    this.switch = null;
};

Element.prototype.initEvents = function() {
    this.evts = {}; // events cache
    this.__evt_st = new EventState(); // event state
    this.__evtCache = [];
    return this;
};

Element.prototype.resetEvents = Element.prototype.initEvents;
/**
 * @method path
 * @chainable
 *
 * Set this element to be a {@link anm.Path Path} or get current path.
 *
 * Examples:
 *
 * * `elm.path("M0.0 10.0 L20.0 20.0 C10.0 20.0 15.0 30.0 10.0 9.0 Z")`
 * * `elm.path(new Path().move(0, 10).curve(10, 20, 15, 30, 10, 9))`
 * * `var my_path = elm.path()`
 *
 * @param {String|anm.Path} [path]
 * @return {anm.Path|anm.Element}
 */
Element.prototype.path = function(value) {
    if (value) {
        this.invalidate();
        this.type = C.ET_PATH;
        this.$path = is.str(value) ? new Path(value) : value;
        return this;
    } else return this.$path;
};

/**
 * @method text
 * @chainable
 *
 * Set this element to be a {@link anm.Text Text} or get current text.
 *
 * Examples:
 *
 * * `elm.text("my text")`
 * * `elm.text(["text","in three","lines"])`
 * * `elm.text(new Text("My Text").font("Arial"))`
 * * `elm.text(new Text(["Two lines", "of text"]).font("italic 20px Arial").align(anm.C.TA_RIGHT))`
 * * `var my_text = elm.text()`
 *
 * @param {String|[String]|anm.Text} [text]
 * @return {anm.Text|anm.Element}
 */
Element.prototype.text = function(value) {
    if (value) {
        this.invalidate();
        this.type = C.ET_TEXT;
        this.$text = (is.str(value) || is.arr(value)) ? new Text(value) : value;
        return this;
    } else return this.$text;
};

/**
 * @method image
 * @chainable
 *
 * Set this element to be an {@link anm.Sheet Image/Sheet} or get current image.
 *
 * Examples:
 *
 * * `elm.image("path://to.my_image.jpg")`
 * * `elm.image(new Image("path://to.my_image.jpg"))`
 * * `elm.image(new Image("path://to.my_image.jpg", function() { console.log("image received"); }))`
 * * `var my_image = elm.image()`
 *
 * @param {String|anm.Image|anm.Sheet} [image] URL or anm.Image instance
 * @param {Function} [callback] a function to be called when image will be received (NB: only appliable if `image` parameter is specified as an URL string)
 * @param {anm.Image} [callback.image] anm.Image instance
 * @param {DomElement} [callback.element] Image Element
 * @return {anm.Image|anm.Sheet|anm.Element}
 */
// TODO: add spite-sheet methods and documenation
Element.prototype.image = function(value, callback) {
    if (value) {
        this.invalidate();
        this.type = C.ET_SHEET;
        this.$image = (is.str(value)) ? new Image(value, callback) : value;
        return this;
    } else return this.$image;
};

/**
 * @method fill
 * @chainable
 *
 * Set fill for this element
 *
 * Examples:
 *
 * * `elm.fill("#ffaa0b")`
 * * `elm.fill("rgb(255,170,11)")`
 * * `elm.fill("rgb(255,170,11,0.8)")`
 * * `elm.fill("hsl(120,50,100%)")`
 * * `elm.fill("hsla(120,50,100%,0.8)")`
 * * `elm.fill(anm.Color.rgb(1.0,0.6,0.1))`
 * * `elm.fill(anm.Color.hsla(Math.PI/3,50,1.0))`
 * * `elm.fill(anm.Brush.gradient().stops({0: "#000", 0.5: "#ccc"}))`
 * * `var brush = elm.fill()`
 *
 * @param {String|anm.Brush} [color]
 * @return {anm.Brush|anm.Element}
 */
Element.prototype.fill = function(value) {
    if (value) {
        this.$fill = (value instanceof Brush) ? value : Brush.fill(value);
        return this;
    } else return this.$fill;
};

/**
 * @method noFill
 * @chainable
 *
 * Remove fill from this element (set it to transparency)
 *
 * @return {anm.Element}
 */
Element.prototype.noFill = function() {
    this.$fill = Color.TRANSPARENT;
    return this;
};

/**
* @method stroke
* @chainable
*
* Set stroke for this element
*
* Examples:
*
* * `elm.stroke("#ffaa0b", 2)`
* * `elm.stroke("rgb(255,170,11)", 4)`
* * `elm.stroke("rgb(255,170,11,0.8)", 5)`
* * `elm.stroke("hsl(120,50,100%)", 3)`
* * `elm.stroke("hsla(120,50,100%,0.8)", 1)`
* * `elm.stroke(anm.Color.rgb(1.0,0.6,0.1), 2)`
* * `elm.stroke(anm.Color.hsla(Math.PI/3,50,1.0), 5)`
* * `elm.stroke(anm.Brush.gradient().stops({0: "#000", 0.5: "#ccc"}), 10)`
* * `var brush = elm.stroke()`
*
* @param {String|anm.Brush} [color] color of the stroke
* @param {Number} [width] width of the stroke
* @return {anm.Brush|anm.Element}
*/
Element.prototype.stroke = function(value, width) {
    if (value) {
        if (value instanceof Brush) {
            this.$stroke = value;
            if (is.defined(width)) this.$stroke.width = width;
        } else {
            this.$stroke = Brush.stroke(value, width);
        }
        return this;
    } else return this.$stroke;
};

/**
 * @method noStroke
 * @chainable
 *
 * Remove stroke from this element
 *
 * @return {anm.Element}
 */
Element.prototype.noStroke = function() {
    this.$stroke = null;
    return this;
};

/**
* @method shadow
* @chainable
*
* Set shadow for this element
*
* Examples:

* * `elm.shadow("#ffaa0b", 3)`
* * `elm.shadow("rgb(255,170,11)", 3, 5, 5)`
* * `var brush = elm.shadow()`
*
* @param {String|anm.Brush} [color] color of the shadow
* @param {Number} [radius] radius of the shadow
* @param {Number} [x] x offset of the shadow
* @param {Number} [y] y offset of the shadow
* @return {anm.Brush|anm.Element}
*/
Element.prototype.shadow = function(value, radius, x, y) {
    if (value) {
        if (value instanceof Brush) {
            this.$shadow = value;
        } else {
            this.$shadow = Brush.shadow(value, radius, x, y);
        }
        return this;
    } else return this.$shadow;
};

/**
 * @private @method modifiers
 *
 * Call all modifiers of the element. Used in element rendering process.
 * See {@link anm.Modifier Modifier} for detailed documenation on modifiers.
 *
 * @param {Number} ltime local time of the element (relatively to parent element), in seconds
 * @param {Number} [dt] time passed since last frame was rendered, in seconds
 * @param {[C.MOD_*]} [types] the types and order of modifiers to call (`SYSTEM`, `TWEEN`, `USER`, `EVENT`)
 *
 * @return [Boolean] `true` if this element shoud be rendered, `false` if not
 */
Element.prototype.modifiers = function(ltime, dt, types) {
    var elm = this;
    var order = types || Modifier.ALL_MODIFIERS;
    dt = dt || 0;

    // copy current state as previous one
    elm.applyPrevState(elm);

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
                // `null` will be returned from `__adaptModTime` for some modifier,
                // if it is required to skip current one, but continue calling others;
                // when `false` is returned for some modifier, this element should not be rendered at all
                if (lbtime === null) continue;
                // modifier will return false if it is required to skip all next modifiers,
                // returning false from our function means the same
                //                                         // time,      dt, duration
                if ((lbtime === false) || (modifier.apply(elm, lbtime[0], dt, lbtime[1]) === false)) {
                    elm.__mafter(ltime, elm.__modifying, false);
                    elm.__modifying = null;
                    return false; // exit the method
                }
            }

        }

        elm.__mafter(ltime, type, true);
    } // for each type

    elm.matrix = Element.getMatrixOf(elm, elm.matrix);

    elm.__modifying = null;

    elm.__appliedAt = ltime;

    elm.resetEvents();

    return true;
};

/**
 * @private @method painters
 *
 * Call all painters of the element. Used in element rendering process.
 * See {@link anm.Painter Painter} for detailed documenation on painters.
 *
 * @param {Context2D} ctx 2D context where element should be drawn
 * @param {[C.PNT_*]} [types] the types and order of painters to call (`SYSTEM`, `USER`, `DEBUG`)
 */
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
                painter.apply(elm, ctx);
            }
        }

        elm.__pafter(ctx, type);
    } // for each type

    elm.__painting = null;
};

/**
 * @private @method forAllModifiers
 *
 * Iterate over all of the modifiers and call given function
 *
 * @param {Function} fn function to call
 * @param {anm.Modifier} fn.modifier modifier
 * @param {C.MOD_*} fn.type modifier type
 */
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
};

/**
* @private @method forAllPainters
*
* Iterate over all of the painters and call given function
*
* @param {Function} fn function to call
* @param {anm.Painter} fn.painter painter
* @param {C.PNT_*} fn.type painter type
*/
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
};

/**
 * @method draw
 *
 * Draw element over some context, without applying transformations, even if element
 * has some, since they depend on time. To draw element along with applying
 * transformations in one call, use {@link anm.Element#render render} method.
 *
 * @param {Context2D} ctx context, where element should be drawn
 */
// > Element.draw % (ctx: Context)
Element.prototype.draw = Element.prototype.painters;
/**
 * @private @method transform
 *
 * Apply every transformation in current matrix to context.
 *
 * @param {Context2D} ctx context
*/
Element.prototype.transform = function(ctx) {
    ctx.globalAlpha *= this.alpha;
    this.matrix.apply(ctx);
    return this.matrix;
};

/**
 * @private @method invTransform
 *
 * Invert current matrix and apply every transformation in it to context.
 *
 * @param {Context2D} ctx context
 */
Element.prototype.invTransform = function(ctx) {
    var inv_matrix = Element.getIMatrixOf(this); // this will not write to elm matrix
    ctx.globalAlpha *= this.alpha;
    inv_matrix.apply(ctx);
    return inv_matrix;
};

/**
 * @method render
 * @chainable
 *
 * Render this element at a given global time, which means execute its full render
 * cycle, starting with checking its time band, and, if band matches time and this
 * element is enabled, calling _modifiers_ (tweens), applying its state to context
 * and then drawing it with _painters_. Plus, does the same recursively for every
 * child or sub-child, if has some.
 *
 * @param {Context2D} ctx context to draw onto
 * @param {Number} dt time passed since the previous frame was rendered, in seconds
 *
 * @return {anm.Element} itself
 */
// > Element.render % (ctx: Context, gtime: Float, dt: Float)
Element.prototype.render = function(ctx, dt) {
    if (this.disabled) return;

    this.rendering = true;

    // context is saved before the actual decision, if we draw or not, for safety:
    // because context anyway may be changed with user functions,
    // like modifiers who return false (and we do not want to restrict
    // user to do that)
    var drawMe = false;

    var ltime = (this.parent && this.parent.affectsChildren) // check `affectsChildren` inside `tickParent`?
                ? this.time.tickParent(dt)
                : this.time.tick(dt);
    if (ltime === Element.NO_TIME) return;

    drawMe = this.__preRender(gtime, ltime, ctx);
    if (drawMe) {
        drawMe = this.time.fits() &&
                 this.modifiers(ltime, dt) &&
                 this.visible; // modifiers should be applied even if element isn't visible
    }
    if (drawMe) {
        ctx.save();

        var mask = this.$mask,
            renderMasked = false;

        var mask_ltime;

        if (mask) {
            mask_ltime = (mask.parent && mask.parent.affectsChildren) // check `affectsChildren` inside `tickParent`?
                         ? mask.time.tickParent(dt)
                         : mask.time.tick(dt);

            // FIXME: move this chain completely into one method, or,
            //        which is even better, make all these checks to be modifiers
            // FIXME: call modifiers once for one moment of time. If there are several
            //        masked elements, they will be called that number of times
            renderMasked = mask.time.fits() &&
                           mask.modifiers(mask_ltime, dt) &&
                           mask.visible;
        }

        if (!renderMasked) {
            // draw directly to context, if has no mask
            this.transform(ctx);
            this.painters(ctx);
            this.each(function(child) {
                child.render(ctx, dt);
            });
        } else {
            // FIXME: the complete mask process should be a Painter.

            mask.ensureHasMaskCanvas();
            var mcvs = mask.__maskCvs,
                mctx = mask.__maskCtx,
                bcvs = mask.__backCvs,
                bctx = mask.__backCtx;

            // FIXME: test if bounds are not empty
            var bounds_pts = mask.bounds(mask_ltime).toPoints();

            var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE,
                maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;

            var pt;
            for (var i = 0, il = bounds_pts.length; i < il; i++) {
                pt = bounds_pts[i];
                if (pt.x < minX) minX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y > maxY) maxY = pt.y;
            }

            var ratio  = engine.PX_RATIO,
                x = minX, y = minY,
                width  = Math.round(maxX - minX),
                height = Math.round(maxY - minY);

            var last_cvs_size = this._maskCvsSize || engine.getCanvasSize(mcvs);

            if ((last_cvs_size[0] < width) ||
                (last_cvs_size[1] < height)) {
                // mcvs/bcvs both always have the same size, so we save/check only one of them
                this._maskCvsSize = engine.setCanvasSize(mcvs, width, height);
                engine.setCanvasSize(bcvs, width, height);
            } else {
                this._maskCvsSize = last_cvs_size;
            }

            var scale = ratio;  // multiple by global scale when it's known

            bctx.clearRect(0, 0, width*scale, height*scale);
            mctx.clearRect(0, 0, width*scale, height*scale);

            bctx.save();
            mctx.save();

            bctx.setTransform(scale, 0, 0, scale, -x*scale, -y*scale);
            mctx.setTransform(scale, 0, 0, scale, -x*scale, -y*scale);

            this.transform(bctx);
            this.painters(bctx);
            this.each(function(child) {
                child.render(bctx, dt);
            });

            mask.transform(mctx);
            mask.painters(mctx);
            mask.each(function(child) {
                child.render(mctx, dt);
            });

            bctx.globalCompositeOperation = 'destination-in';
            bctx.setTransform(1, 0, 0, 1, 0, 0);
            bctx.drawImage(mcvs, 0, 0);

            ctx.drawImage(bcvs,
                0, 0, Math.floor(width * scale), Math.floor(height * scale),
                x, y, width, height);

            mctx.restore();
            bctx.restore();
        }
        ctx.restore();
    }
    // immediately after being drawn, element is shown, it is reasonable
    this.shown = drawMe;
    this.__postRender();
    this.rendering = false;
    return this;
};

/**
 * @method pivot
 * @chainable
 *
 * Assign a pivot for this element (given in relative coords to element's bounds).
 * This point becomes the center for all the applied transformations.
 *
 * @param {Number} x X position, in range 0..1
 * @param {Number} y Y position, in range 0..1
 * @return {anm.Element} itself
 */
Element.prototype.pivot = function(x, y) {
    this.$pivot = [ x, y ];
    return this;
};

/**
 * @method reg
 * @chainable
 *
 * Assign a registration point for this element (given in points).
 * This point becomes the starting point for all the applied transformations.
 *
 * @param {Number} x X position, in points
 * @param {Number} y Y position, in points
 * @return {anm.Element} itself
 */
Element.prototype.reg = function(x, y) {
    this.$reg = [ x, y ];
    return this;
};

/**
 * @method move
 * @chainable
 *
 * Move this element to some point, once and forever.
 *
 * NB: If this element has tweens, event handlers and/or any modifiers in general,
 * they will rewrite this value on the very next render call—so if you want, while having
 * modifiers, to constantly add these values to the element position, it is
 * recommended to better add a correspoding static tween or modifier to it,
 * rather than calling this method.
 *
 * @param {Number} x X position, in points
 * @param {Number} y Y position, in points
 * @return {anm.Element} itself
 */
Element.prototype.move = function(x, y) {
    this.x = x;
    this.y = y;
    return this;
};

/**
 * @method rotate
 * @chainable
 *
 * Rotate this element to some angle, once and forever.
 *
 * NB: If this element has tweens, event handlers and/or any modifiers in general,
 * they will rewrite this value on the very next render call—so if you want, while having
 * modifiers, to constantly add this value to the element rotation state, it is
 * recommended to better add a correspoding static tween or modifier to it,
 * rather than calling this method.
 *
 * @param {Number} angle angle, in radians
 * @return {anm.Element} itself
 */
Element.prototype.rotate = function(angle) {
    this.angle = angle;
    return this;
};

/**
 * @method rotateInDeg
 * @chainable
 *
 * Rotate this element to some angle, once and forever.
 *
 * NB: If this element has tweens, event handlers and/or any modifiers in general,
 * they will rewrite this value on the very next render call—so if you want, while having
 * modifiers, to constantly add this value to the element rotation state, it is
 * recommended to better add a correspoding static tween or modifier to it,
 * rather than calling this method.
 *
 * @param {Number} angle angle, in degrees
 * @return {anm.Element} itself
 */
Element.prototype.rotateInDeg = function(angle) {
    return this.rotate(angle / 180 * Math.PI);
};

/**
 * @method scale
 * @chainable
 *
 * Scale this element, once and forever.
 *
 * NB: If this element has tweens, event handlers and/or any modifiers in general,
 * they will rewrite this value on the very next render call—so if you want, while having
 * modifiers, to constantly add these values to the element scale state, it is
 * recommended to better add a correspoding static tween or modifier to it,
 * rather than calling this method.
 *
 * @param {Number} sx scale by X axis, in points
 * @param {Number} sy scale by Y axis, in points
 * @return {anm.Element} itself
 */
Element.prototype.scale = function(sx, sy) {
    this.sx = sx;
    this.sy = sy;
    return this;
};

/**
 * @method skew
 * @chainable
 *
 * Skew this element, once and forever.
 *
 * NB: If this element has tweens, event handlers and/or any modifiers in general,
 * they will rewrite this value on the very next render call—so if you want, while having
 * modifiers, to constantly add these values to the element scale state, it is
 * recommended to better add a correspoding static tween or modifier to it,
 * rather than calling this method.
 *
 * @param {Number} hx skew by X axis, in points
 * @param {Number} hy skew by Y axis, in points
 * @return {anm.Element} itself
 */
Element.prototype.skew = function(hx, hy) {
    this.hx = hx;
    this.hy = hy;
    return this;
};

/**
* @method repeat
* @chainable
*
* Repeat this element inside parent's band using specified mode. Possible modes are:
*
* * `C.R_ONCE` — do not repeat at all, just hide this element when its band (lifetime) finished
* * `C.R_STAY` — "play" this element once and then immediately freeze its last frame, and keep showing it until parent's band will finish
* * `C.R_LOOP` — loop this element inside parent's band until the latter will finish
* * `C.R_BOUNCE` — bounce (loop forward and back in time) this element inside parent's band until the latter will finish
*
* So, if element has its own band, and this band fits parent's band at least one time,
* then this element will repeated (or stay) the specified number of times (or infinite
* number of times by default), but only while it still fits parent's band.
*
* If parent's band is infinite and looping is infinite, both elements will stay forever,
* except the case when a parent of a parent has narrower band.
*
* NB: by default, element's band is `[0, Infinity]`, in seconds, relative to parent's band.
* To change it, use {@link anm.Element#band band} method.
*
* See also: {@link anm.Element#band band}, {@link anm.Element#once once},
*           {@link anm.Element#stay stay}, {@link anm.Element#loop loop},
*           {@link anm.Element#bounce bounce}
*
* @param {anm.C.R_*} mode repeat mode, one of the listed above
* @param {Number} nrep number of times to repeat or `Infinity` by default
*
* @return {anm.Element} itself
*/
Element.prototype.repeat = function(mode, nrep) {
    this.time.setEndAction(mode, nrep);
    return this;
};

/**
 * @method once
 * @chainable
 *
 * Do not repeat this element inside the parent's band. In another words, repeat this
 * element just once. In another words, assign this element a default behavior
 * when it element "dies" just after its lifetime is finished. In another words,
 * disable any looping/repeating.
 *
 * See also: {@link anm.Element#band band}, {@link anm.Element#repeat repeat}.
 *
 * @return {anm.Element} itself
 */
Element.prototype.once = function() {
    this.time.setEndAction(C.R_ONCE, Infinity);
    return this;
};

/**
 * @method stay
 * @chainable
 *
 * Repeat this element once inside its own band, but freeze its last frame until
 * parents' band will finish, or forever.
 *
 * See also: {@link anm.Element#band band}, {@link anm.Element#repeat repeat}.
 *
 * @return {anm.Element} itself
 */
Element.prototype.stay = function() {
    this.time.setEndAction(C.R_STAY, Infinity);
    return this;
};

/**
 * @method loop
 * @chainable
 *
 * Loop this element using its own band until its parent's band will finish, or
 * until specified number of times to repeat will be reached, or forever.
 *
 * See also: {@link anm.Element#band band}, {@link anm.Element#repeat repeat}.
 *
 * @param {Number} [nrep] number of times to repeat or `Infinity` by default
 *
 * @return {anm.Element} itself
 */
Element.prototype.loop = function(nrep) {
    this.time.setEndAction(C.R_LOOP, nrep);
    return this;
};

/**
 * @method bounce
 * @chainable
 *
 * Bounce (loop forward and then back) this element using its own band until
 * its parent's band will finish, or until specified number of times to repeat
 * will be reached, or forever.
 *
 * See also: {@link anm.Element#band band}, {@link anm.Element#repeat repeat}.
 *
 * @param {Number} [nrep] number of times to repeat or `Infinity` by default
 *
 * @return {anm.Element} itself
 */
Element.prototype.bounce = function(nrep) {
    this.time.setEndAction(C.R_BOUNCE, nrep);
    return this;
};

Element.prototype.mode = function(mode, nrep) {
    this.time.setEndAction(mode, nrep);
};

/**
 * @method jump
 * @chainable
 *
 * Jump to local time. Element must be alive for this to work: its band should include both the time
 * when jump performed and the time to where jump is performed. Time is specified as `0` if
 * element should jump to the start of its band.
 *
 * See also: {@link anm.Element#band band}, {@link anm.Element#play play}, {@link anm.Element#stop stop}
 *
 * @param {Number} t target local time for a jump
 *
 * @return {anm.Element} itself
 */
Element.prototype.jump = function(t) {
    this.time.jump(t);
    return this;
};

/**
 * @method jumpTo
 * @chainable
 *
 * Jump to the given start time of the element given or found with passed selector (uses
 * {@link anm.Animation#jumpTo animation.jumpTo} inside). It will skip a jump, if it's already in process
 * of jumping.
 *
 * See also: {@link anm.Element#band band}, {@link anm.Element#play play}, {@link anm.Element#stop stop}
 *
 * @param {String|anm.Element} selector
 *
 * @return {anm.Element} itself
 */
Element.prototype.jumpTo = function(element) {
    var elm = is.str(selector) ? this.find(selector) : selector;
    if (!elm) return;
    this.time.jumpTo(elm);
    return this;
};

Element.prototype.jumpAt = function(at, t) {
    this.time.jumpAt(at, t);
    return this;
};

Element.prototype.jumpToStart = function() {
    this.time.jumpToStart(at, t);
};

Element.prototype.getTime = function() {
    return this.time.getLastPosition();
};

/**
  * @method play
  * @chainable
  *
  * Unpause after a call to {@link anm.Element#stop stop}.
  *
  * See also: {@link anm.Element#band band}, {@link anm.Element#jump jump}, {@link anm.Element#stop stop}.
  *
  * @return {anm.Element} itself
  */
Element.prototype.play = function() {
    this.time.continue();
    return this;
}
Element.prototype.continue = Element.prototype.play; // FIXME

/**
 * @method stop
 * @chainable
 *
 * Pause at current time (so element will be visible, but won't be tweened). Children are
 * also affected. Will pause _only_ for the time where element is "alive", i.e. if current time is
 * outside of its band, element won't render instead. Also, no band `START`/`STOP` events
 * will be fired in any case.
 *
 * See also: {@link anm.Element#band band}, {@link anm.Element#jump jump}, {@link anm.Element#play play}.
 *
 * @return {anm.Element} itself
 */
Element.prototype.stop = function() {
    this.time.pause();
    return this;
}
Element.prototype.pause = Element.prototype.stop; // FIXME

/**
 * @method at
 * @chainable
 *
 * Shortcut to `element.modify(new anm.Modifier(function(t) { console.log(t); }).time(<time>))`. Calls given
 * function at the requested local time or a bit later (as soon as possible, due to uneven frame logic of canvas).
 * Passes the actual time of a call to a function. `this` in this function is bound the caller `Element` instance.
 *
 * See also: {@link anm.Element#modify modify}.
 *
 * @param {Number} time time to call a function
 * @param {Function} func a function to call
 * @param {Number} func.time time of an actual call
 * @param {anm.Element} func.this the calling element
 *
 * @return {anm.Element} itself
 */
Element.prototype.at = function(t, f) {
    return this.time.addAction(t, f);
}

/**
 * @method modify
 * @chainable
 *
 * Add the Modifier to this element. The Modifier is a function which modifies the
 * element's state, see {@link anm.Modifier Modifier} for detailed information.
 *
 * Examples:
 *
 * * `elm.modify(function(t) { this.x += 1 / t; })`
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; }).band(0, 2).easing(fuction(t) { return 1 - t; }))`
 *
 * @param {Function|anm.Modifier} modifier modifier
 * @param {Number} modifier.t local band time
 * @param {Number} [modifier.dt] time passed after last render
 * @param {Number} [modifier.duration] duration of the modifier band or `Infinity` if it has no band
 * @param {Object} [modifier.data] user data
 * @param {anm.Element} modifier.this element, owning the modifier
 *
 * @return {anm.Element} itself
 */
Element.prototype.modify = function(band, modifier) {
    // FIXME!!!: do not pass time, dt and duration neither to modifiers
    //           nor painters, they should be accessible through this.t / this.dt
    if (!is.arr(band)) { modifier = band;
                        band = null; }
    if (!modifier) throw errors.element('No modifier was passed to .modify() method', this);
    if (!is.modifier(modifier) && is.fun(modifier)) {
        modifier = new Modifier(modifier, C.MOD_USER);
    } else if (!is.modifier(modifier)) {
        throw errors.element('Modifier should be either a function or a Modifier instance', this);
    }
    if (!modifier.type) throw errors.element('Modifier should have a type defined', this);
    if (band) modifier.$band = band;
    if (modifier.__applied_to &&
        modifier.__applied_to[this.id]) throw errors.element('This modifier is already applied to this Element', this);
    if (!this.$modifiers[modifier.type]) this.$modifiers[modifier.type] = [];
    this.$modifiers[modifier.type].push(modifier);
    this.__modifiers_hash[modifier.id] = modifier;
    if (!modifier.__applied_to) modifier.__applied_to = {};
    modifier.__applied_to[this.id] = this.$modifiers[modifier.type].length; // the index in the array by type + 1 (so 0 means not applied)
    return this;
};

/**
 * @method removeModifier
 * @chainable
 *
 * Remove the modifier which was applied to this element.
 *
 * @param {Function|anm.Modifier} modifier modifier to remove
 *
 * @return {anm.Element} itself
 */
Element.prototype.removeModifier = function(modifier) {
    // FIXME!!!: do not pass time, dt and duration neither to modifiers
    //           nor painters, they should be accessible through this.t / this.dt
    if (!is.modifier(modifier)) throw errors.element('Please pass Modifier instance to removeModifier', this);
    if (!this.__modifiers_hash[modifier.id]) throw errors.element('Modifier wasn\'t applied to this element', this);
    if (!modifier.__applied_to || !modifier.__applied_to[this.id]) throw errors.element(ErrLoc.A.MODIFIER_NOT_ATTACHED, this);
    //if (this.__modifying) throw errors.element("Can't remove modifiers while modifying");
    utils.removeElement(this.__modifiers_hash, modifier.id);
    utils.removeElement(this.$modifiers[modifier.type], modifier);
    utils.removeElement(modifier.__applied_to, this.id);
    return this;
};

/**
 * @method paint
 * @chainable
 *
 * Add the Painter to this element. The Painter is a function which customly draws the
 * element, see {@link anm.Painter Painter} for detailed information.
 *
 * Examples:
 *
 * * `elm.paint(function(ctx) { ctx.fillStyle = '#f00'; ctx.fillRect(0, 0, 200, 200); })`
 * * `elm.paint(new Painter(function(t) { ctx.fillStyle = '#f00'; ctx.fillRect(0, 0, 200, 200); }))`
 *
 * @param {Function|anm.Painter} painter painter
 * @param {Number} painter.ctx context to draw onto
 * @param {Number} [painter.data] user data
 *
 * @return {anm.Element} itself
 */
Element.prototype.paint = function(painter) {
    if (!painter) throw errors.element('No painter was passed to .paint() method', this);
    if (!is.painter(painter) && is.fun(painter)) {
        painter = new Painter(painter, C.MOD_USER);
    } else if (!is.painter(painter)) {
        throw errors.element('Painter should be either a function or a Painter instance', this);
    }
    if (!painter.type) throw errors.element('Painter should have a type defined', this);
    if (painter.__applied_to &&
        painter.__applied_to[this.id]) throw errors.element('This painter is already applied to this Element', this);
    if (!this.$painters[painter.type]) this.$painters[painter.type] = [];
    this.$painters[painter.type].push(painter);
    this.__painters_hash[painter.id] = painter;
    if (!painter.__applied_to) painter.__applied_to = {};
    painter.__applied_to[this.id] = this.$painters[painter.type].length; // the index in the array by type + 1 (so 0 means not applied)
    return this;
};

/**
 * @method removePainter
 * @chainable
 *
 * Remove the painter which was applied to this element.
 *
 * @param {Function|anm.Painter} painter painter to remove
 *
 * @return {anm.Element} itself
 */
Element.prototype.removePainter = function(painter) {
    if (!is.painter(painter)) throw errors.element('Please pass Painter instance to removePainter', this);
    if (!this.__painters_hash[painter.id]) throw errors.element('Painter wasn\'t applied to this element', this);
    if (!painter.__applied_to || !painter.__applied_to[this.id]) throw errors.element(ErrLoc.A.PAINTER_NOT_ATTACHED, this);
    //if (this.__modifying) throw errors.element("Can't remove modifiers while modifying", this);
    utils.removeElement(this.__painters_hash, painter.id);
    utils.removeElement(this.$painters[painter.type], painter);
    utils.removeElement(painter.__applied_to, this.id);
    return this;
};

/**
 * @method tween
 * @chainable
 *
 * Add some Tween to this element. The Tween is a pre-defined way of modifing the
 * element's state, stored in a function. See {@link anm.Tween Tween} for detailed information.
 *
 * Examples:
 *
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2))`
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2).start(0).stop(2))`
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2).easing(function(t) { return 1 - t; }))`
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2).easing('in'))`
 *
 * @param {anm.Tween} tween tween to apply
 *
 * @return {anm.Element} itself
 */
Element.prototype.tween = function(tween) {
    if (!is.tween(tween)) throw errors.element('Please pass Tween instance to .tween() method', this);
    // tweens are always receiving time as relative time
    // is.finite(duration) && duration ? (t / duration) : 0
    return this.modify(tween);
};

/**
* @method removeTween
* @chainable
*
* Remove the tween which was applied to this element.
*
* @param {anm.Tween} tween tween to remove
*
* @return {anm.Element} itself
*/
Element.prototype.removeTween = function(tween) {
    if (!is.tween(tween)) throw errors.element('Please pass Tween instance to .removeTween() method', this);
    return this.removeModifier(tween);
};

/**
* @method add
* @chainable
*
* Add another element (or elements) as a child to this element. Child element will
* have its `.parent` link set to point to current element.
*
* It is also possible to add element via specifying its {@link anm.Painter Painter} and,
* optionally, {@link anm.Modifier Modifier}, i.e. `elm.add(function(ctx) { ... },
* function(t) { ... })`
*
* @param {anm.Element|[anm.Element]} element new child element
*
* @return {anm.Element} parent, itself
*/
Element.prototype.add = function(arg1, arg2, arg3) {
    if (arg2) { // element by functions mode
        var elm = new Element(arg1, arg2);
        if (arg3) elm.changeTransform(arg3);
        this._addChild(elm);
    } else if (is.arr(arg1)) { // elements array mode
        for (var ei = 0, el = elms.length; ei < el; ei++) {
            this._addChild(elms[ei]);
        }
    } else { // element object mode
        this._addChild(arg1);
    }
    this.invalidate();
    return this;
};

/**
 * @method remove
 * @chainable
 *
 * Remove child element which was attached to this element before.
 *
 * @param {anm.Element|[anm.Element]} element element to remove
 *
 * @return {anm.Element} parent, itself
 */
Element.prototype.remove = function(elm) {
    if (!elm) throw errors.element(ErrLoc.A.NO_ELEMENT_TO_REMOVE);
    if (this.__safeDetach(elm) === 0) throw errors.element(ErrLoc.A.NO_ELEMENT);
    this.invalidate();
    return this;
};

Element.prototype._unbind = function() {
    if (this.parent.__unsafeToRemove ||
        this.__unsafeToRemove) throw errors.element(ErrLoc.A.UNSAFE_TO_REMOVE);
    this.parent = null;
    if (this.scene) this.scene._unregister(this);
    // this.scene should be null after unregistering
};

/**
 * @private @method detach
 *
 * Detach element from parent, a part of removing process
 */
Element.prototype.detach = function() {
    if (this.parent.__safeDetach(this) === 0) throw errors.element(ErrLoc.A.ELEMENT_NOT_ATTACHED, this);
};

/**
 * @method gtime
 *
 * Get global time (relative to {@link anm.Animation Animation} or {@link anm.Scene scene})
 *
 * @return {Number} global time
 */
Element.prototype.gtime = function(ltime) {
    this.time.getGlobalTime();
};

/**
 * @method band
 * @chainable
 *
 * Set a time-band of an element (relatively to parent element or an {@link anm.Animation Animation},
 * or {@link anm.Scene Scene}, if this element happened to be a direct child of one). Time-band
 * of an Element is its lifetime, an Element gets its birth and dies at specified time, accordingly.
 * If it has repeat-mode, it resets its local time and starts living again. Time-band is specified in
 * seconds relatively to parent element's time-band.
 *
 * For example, if parent is in a root of animation and has a band of `[ 1.5, 6 ]`, and its child has a
 * band of `[ 3.5, 7 ]`, then this child appears at `5` (`1.5 + 3.5`) seconds of global time and hides at
 * `6` seconds of global time, since its band outlives the parent band, so it was cut.
 *
 * @param {Number} start start time of a band
 * @param {Number} stop stop of a band
 * @return {anm.Element} itself
 */
Element.prototype.band = function(start, stop) {
    if (!is.defined(start)) return this.time.getBand();
    this.time.changeBand(start, is.defined(stop) ? stop : Infinity);
    return this;
};

Element.prototype.getGlobalBand = function() {
    return this.time.getGlobalBand(this.parent);
};

/**
 * @method duration
 * @chainable
 *
 * Get or set duration of an element's band
 *
 * See {@link anm.Element#band band} method.
 *
 * @param {Number} [value] desired duration
 *
 * @return {anm.Element|Number} itself or current duration value
 */
Element.prototype.duration = function(value) {
    if (!is.defined(value)) return this.getDuration();
    this.setDuration(value);
    return this;
};

Element.prototype.setDuration = function(duration) {
    this.time.setDuration(duration);
};

Element.prototype.getDuration = function() {
    return this.time.getDuration();
};

/**
 * @private @method m_on
 *
 * Subscribe for mouse or keyboard event over this element (these events are
 * separated from a flow)
 */
Element.prototype.m_on = function(type, handler) {
    this.modify(new Modifier(
        function(t) { /* FIXME: handlers must have priority? */
            if (this.__evt_st.check(type)) {
                var evts = this.evts[type];
                for (var i = 0, el = evts.length; i < el; i++) {
                    if (handler.call(this, evts[i], t) === false) return false;
                }
            }
        }, C.MOD_EVENT));
};

/**
 * @private @method dispose
 *
 * Dispose the memory-consuming objects, called authomatically on animation end
 */
Element.prototype.dispose = function() {
    this.disposeHandlers();
    this.disposeVisuals();
    this.each(function(child) {
        child.dispose();
    });
};

Element.prototype.disposeVisuals = function() {
    if (this.$path)  this.$path.dispose();
    if (this.$text)  this.$text.dispose();
    if (this.$image) this.$image.dispose();
    if (this.$video) this.$video.dispose();
    if (this.$mpath) this.$mpath.dispose();
};

/**
* @private @method reset
*
* Reset all stored flags and events, called authomatically on animation end
*/
Element.prototype.reset = function() {
    // if positions were set before loading a scene, we don't need to reset them
    //this.resetState();
    this.resetEvents();
    this.resetTime();
    /*this.__clearEvtState();*/
    var elm = this;
    this.forAllModifiers(function(modifier) {
        if (modifier.__wasCalled) modifier.__wasCalled[elm.id] = false;
        if (is.defined(modifier.__wasCalledAt)) modifier.__wasCalledAt[elm.id] = -1;
    });
    this.each(function(elm) {
        elm.reset();
    });
};

/**
 * @method each
 * @chainable
 *
 * Iterate over element's children with given function. No sub-children, though,
 * see {@link anm.Element#traverse .traverse} to include them, or call `.each` for
 * every child, inside the passed function.
 *
 * @param {Function} f function to call
 * @param {Boolean} f.return if `false` returned, stops the iteration. no-`return` or empty `return` both considered `true`.
 * @param {anm.Element} f.elm child element
 *
 * @return {anm.Element} itself
 */
Element.prototype.each = function(func) {
    var children = this.children;
    this.__unsafeToRemove = true;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        if (func(children[ei]) === false) break;
    }
    this.__unsafeToRemove = false;
    return this;
};

/**
 * @method reverseEach
 * @chainable
 *
 * Iterate over element's children with given function. No sub-children, though,
 * see {@link anm.Element#traverse .traverse} to include them, or call `.each` for
 * every child, inside the passed function. The only difference with {@link anm.Element#each .each}
 * is that `.reverseEach` literally iterates over the children in the order _reverse_ to the
 * order of their addition—this could be helpful when you need elements with
 * higher z-index to be visited before.
 *
 * @param {Function} f function to call
 * @param {Boolean} f.return if `false` returned, stops the iteration. no-`return` or empty `return` both considered `true`.
 * @param {anm.Element} f.elm child element
 *
 * @return {anm.Element} itself
 */
Element.prototype.reverseEach = function(func) {
    var children = this.children;
    this.__unsafeToRemove = true;
    var ei = children.length;
    while (ei--) {
        if (func(children[ei]) === false) break;
    }
    this.__unsafeToRemove = false;
    return this;
};

/**
 * @method firstParent
 *
 * Find first parent which satisfies the filter. Starts with the element itself.
 *
 * @param {Function} filter filter to call
 * @param {anm.Element} filter.element parent element
 * @param {Boolean} filter.return if `false` was returned, keeps going to the top; if `true` was returned, returns matched element
 *
 * @return {anm.Element} matched parent or `null`, if no element was found
 */
Element.prototype.firstParent = function(filter) {
    if (filter(this)) return this;
    var p = this.parent;
    while (p && !filter(p)) p = p.parent;
    return p;
};

/**
 * @method traverse
 * @chainable
 *
 * Iterate over element's children including all the levels of sub-children with
 * given function (see {@link anm.Element#each .each} method to iterate over
 * only element's own children).
 *
 * @param {Function} f function to call
 * @param {Boolean} f.return if `false` returned, stops the iteration. no-`return` or empty `return` both considered `true`.
 * @param {anm.Element} f.elm child element
 *
 * @return {anm.Element} itself
 */
Element.prototype.traverse = function(func) {
    var children = this.children;
    this.__unsafeToRemove = true;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        var elem = children[ei];
        if (func(elem) === false) break;
        elem.traverse(func);
    }
    this.__unsafeToRemove = false;
    return this;
};

/**
 * @method iter
 * @chainable
 *
 * _Safely_ iterate over element's children including all the levels of sub-children.
 * Safe iteration assumes that you are able to remove elements in its process.
 *
 * @param {Function} f function to call
 * @param {anm.Element} f.elm child element
 * @param {Function} [rf] function which marks element as the one to remove
 * @param {anm.Element} [rf.elm] child element
 * @param {Boolean} [rf.return] remove element or not
 *
 * @return {anm.Element} itself
 */
Element.prototype.iter = function(func, rfunc) {
    this.__unsafeToRemove = true;
    iter(this.children).each(func, rfunc);
    this.__unsafeToRemove = false;
    return this;
};

/**
 * @method hasChildren
 *
 * Check if this element has children.
 *
 * @return {Boolean} are there any children
 */
Element.prototype.hasChildren = function() {
    return this.children.length > 0;
};

Element.prototype.deepIterateChildren = function(func, rfunc) {
    this.__unsafeToRemove = true;
    iter(this.children).each(function(elem) {
        elem.deepIterateChildren(func, rfunc);
        return func(elem);
    }, rfunc);
    this.__unsafeToRemove = false;
};

Element.prototype.__performDetach = function() {
    var children = this.children;
    iter(this.__detachQueue).each(function(elm) {
        if ((idx = children.indexOf(elm)) >= 0) {
            children.splice(idx, 1);
            elm._unbind();
        }
    });
    this.__detachQueue = [];
};

/**
 * @method clear
 * @chainable
 *
 * Remove all the element's children.
 *
 * @return {anm.Element} itself
 */
Element.prototype.clear = function() {
    if (this.__unsafeToRemove) throw errors.element(ErrLoc.A.UNSAFE_TO_REMOVE, this);
    if (!this.rendering) {
        var children = this.children;
        this.children = [];
        iter(children).each(function(elm) { elm._unbind(); });
    } else {
        this.__detachQueue = this.__detachQueue.concat(this.children);
    }
    return this;
};

/**
 * @private @method lock
 *
 * Disable user-defined jumps in time for this element and freeze up the state
 */
Element.prototype.lock = function() {
    this.__jumpLock = true; // disable jumps in time
    this.__state = this.extractState();
    this.__pstate = this.extractPrevState(); // FIXME: remove previous state
};

/**
 * @private @method unlock
 *
 * Enable user-defined jumps in time for this element and return the state
 */
Element.prototype.unlock = function(collect_res) { // collect_res flag is optional
    var result = collect_res ? this.extractState() : undefined;
    this.applyState(this.__state);
    this.applyPrevState(this.__pstate);
    this.__state = null;
    this.__pstate = null; // FIXME: remove previous state
    this.__jumpLock = false;
    return result;
};

// FIXME: rename and merge get/set into .state() & .prev_state() ?
/**
 * @method extractState
 *
 * Extract element's state to object
 *
 * @return {Object} extracted state
 */
Element.prototype.extractState = function() {
    // see .initState() for values definition
    return {
      x: this.x, y: this.y,
      sx: this.sx, sy: this.sy,
      hx: this.hx, hy: this.hy,
      angle: this.angle,
      alpha: this.alpha,
      t: this.t, rt: this.rt, key: this.key
    };
};

Element.prototype.extractPrevState = function() {
    // see .initState() for values definition
    return {
      x: this._x, y: this._y,
      sx: this._sx, sy: this._sy,
      hx: this._hx, hy: this._hy,
      angle: this._angle,
      alpha: this._alpha,
      t: this._t, rt: this._rt, key: this._key
    };
};

/**
 * @method applyState
 *
 * Apply a complete state from object to element. NB: Rewrites all the values!
 *
 * @param {Object} state state to apply
 * @param {Number} state.x
 * @param {Number} state.y
 * @param {Number} state.sx
 * @param {Number} state.sy
 * @param {Number} state.hx
 * @param {Number} state.hy
 * @param {Number} state.angle
 * @param {Number} state.alpha
 * @param {Number|Null} state.t
 * @param {Number|Null} state.rt
 * @param {String|Null} state.key
 */
Element.prototype.applyState = function(s) {
    this.x = s.x; this.y = s.y;
    this.sx = s.sx; this.sy = s.sy;
    this.hx = s.hx; this.hy = s.hy;
    this.angle = s.angle;
    this.alpha = s.alpha;
    this.t = s.t; this.rt = s.rt; this.key = s.key;
};

Element.prototype.applyPrevState = function(s) {
    this._x = s.x; this._y = s.y;
    this._sx = s.sx; this._sy = s.sy;
    this._hx = s.hx; this._hy = s.hy;
    this._angle = s.angle;
    this._alpha = s.alpha;
    this._t = s.t; this._rt = s.rt; this._key = s.key;
};

/**
 * @method stateAt
 *
 * Get a state object at specified time
 *
 * @param {Number} t time where to take a mask of a state
 * @return {Object} state at given time
 */
Element.prototype.stateAt = function(t) { /* FIXME: test */
    this.lock();
    // calls all modifiers with given time and then unlocks the element
    // and returns resulting state if modifiers succeeded
    // (unlock should be performed independently of success)
    return this.unlock(/* success => return previous state */
              this.modifiers(t, 0, Element.NOEVT_MODIFIERS) // returns true if succeeded
           );
};

/**
 * @method pos
 * @chainable
 *
 * Get or set current position of this element, relatively to parent
 *
 * @param {Number} [x] X-position
 * @param {Number} [y] Y-position
 *
 * @return {anm.Element|Object} element or position
 */
Element.prototype.pos = function(x, y) {
    if (is.defined(x)) return this.move(x, y);
    return { x: this.x, y: this.y };
};

/**
 * @method offset
 *
 * Get current offset of this element, including all the way to the top of the
 * element tree.
 *
 * @param {Number} [x] X-position
 * @param {Number} [y] Y-position
 *
 * @return {anm.Element|Object} element or position
 */
Element.prototype.offset = function() {
    var xsum = 0, ysum = 0;
    var p = this.parent;
    while (p) {
        xsum += p.x;
        ysum += p.y;
        p = p.parent;
    }
    return [ xsum, ysum ];
};

/*Element.prototype.local = function(pt) {
    return this.matrix.transformPoint(pt);
}
Element.prototype.global = function(pt) {
    return this.matrix.transformPointInverse(pt);
} */
/**
 * @method invalidate
 * @chainable
 *
 * Invalidate element bounds. Should be called if you change the inner graphical contents
 * of the element (i.e. changed points in path or updated text content, or replaced one image with
 * another, ...).
 *
 * For methods like `.add(child)`, `.remove(child)`, `.path(path)`, `.image(img)`, `.text(txt)`
 * it is done automatically, so no need in calling it if you use them.
 *
 * @return {anm.Element} itself
 */
Element.prototype.invalidate = function() {
    this.$my_bounds = null;
    this.$bounds = null;
    this.lastBoundsSavedAt = null;
    if (this.parent) this.parent.invalidate();
    return this;
};

/**
* @method invalidateVisuals
* @chainable
*
* Invalidate element graphics. Should be called if you change the inner graphical contents
* of the element (i.e. changed points in path or updated text content, or replaced one image with
* another, ...).
*
* For methods like `.add(child)`, `.remove(child)`, `.path(path)`, `.image(img)`, `.text(txt)`
* it is done automatically, so no need in calling it if you use them.
*
* @return {anm.Element} itself
*/
Element.prototype.invalidateVisuals = function() {
    //TODO: replace with this['$' + this.type].invalidate() ?
    var subj = this.$path || this.$text || this.$image || this.$video;
    if (subj) subj.invalidate();
};

/**
 * @method bounds
 *
 * Returns bounds (`x`, `y`, `width`, `height`) of an element in given time,
 * in a parent's coordinate space, including element's children.
 * Last call is cached so if you add/remove children by hands and you want to
 * get new bounds on next call, you need to call `elm.invalidate()` first, just
 * after adding/removing. `elm.add()`/`elm.remove()` methods do it automatically,
 * though.
 *
 * @param {Number} ltime band-local time
 *
 * @return {Object} bounds
 */
Element.prototype.bounds = function(ltime) {
    if (is.defined(this.lastBoundsSavedAt) &&
        (t_cmp(this.lastBoundsSavedAt, ltime) == 0)) return this.$bounds;

    var result = this.myBounds();
    if (this.children.length) {
        result = result.clone();
        this.each(function(child) {
            result.add(child.bounds(ltime));
        });
    }
    result = this.adaptBounds(result);

    this.lastBoundsSavedAt = ltime;
    return (this.$bounds = result);
};

/**
 * @method myBounds
 *
 * Returns bounds with no children consideration, and not affected by any
 * matrix — independent of time — pure local bounds.
 *
 * @return {Object} bounds
 */
Element.prototype.myBounds = function() {
    if (this.$my_bounds) return this.$my_bounds;
    var subj = this.$path || this.$text || this.$image || this.$video;
    if (subj) { return (this.$my_bounds = subj.bounds()); }
    else return (this.$my_bounds = Bounds.NONE);
};

/**
 * @method inside
 *
 * Test if a point given in global coordinate space is located inside the element's bounds
 * or one of its children/sub-children and calls given function for found elements. If function
 * explicitly returns `false`, stops the iteration and exits.
 *
 * Also, visits the children in reverse order, so function is called first for the elements
 * with higher z-index (it means they are "closer" to the one who watches the animation)
 * than the ones found later: it's safe to assume first found element is the top one
 * (_not_ considering the time band, which could be filtered or not in a corresponding function).
 *
 * If filter returned `false` for some element, it's children won't be checked. If point is
 * inside of some element, it's children also won't be checked.
 *
 * NB: `.inside(...)` is NOT returning the result of a test. It only calls an `fn` callback if
 * test passed.
 *
 * @param {Object} pt point to check
 * @param {Number} pt.x
 * @param {Number} pt.y
 * @param {Function} filter function to filter elements before checking bounds, since it's quite a slow operation
 * @param {anm.Element} filter.elm element to check
 * @param {Boolean} filter.return return `true` if this element should be checked, `false` if not
 * @param {Function} fn function to call for matched elements
 * @param {anm.Element} fn.elm element matched with the point
 * @param {Number} fn.pt point adapted to child coordinate space
 * @param {Boolean} fn.return return nothing or `true`, if iteration should keep going, return `false` if it should exit
 */
Element.prototype.inside = function(pt, filter, fn) {
    var passed_filter = !filter || filter(this);
    if (!passed_filter) return; /* skip this element and its children, but not exit completely */;
    var local_pt = this.adapt(pt.x, pt.y);
    if (this.myBounds().inside(local_pt)) {
        var subj = this.$path || this.$text || this.$image || this.$video;
        if (subj && subj.inside(local_pt)) return fn(this, local_pt);
    }
    this.reverseEach(function(elm) {
        return elm.inside(local_pt, filter, fn);
    });
};

/**
 * @method adapt
 *
 * Adapt a point to element's local coordinate space (relative to parent).
 *
 * @param {Number} x
 * @param {Number} y
 *
 * @return {Object} transformed point
 */
Element.prototype.adapt = function(x, y) {
    return this.matrix.transformPointInverse(x, y);
};

/**
* @method adaptBounds
*
* Adapt bounds to element's local coordinate space (relatively to
* parent's space). Bounds are passed as an object
* `{ x: 100, y: 100, width: 200, height: 150 }`.
*
* @param {Object} bounds bounds to adapt
* @param {Number} bounds.x
* @param {Number} bounds.y
* @param {Number} bounds.width
* @param {Number} bounds.height
*
* @return {Object} transformed bounds
*/
Element.prototype.adaptBounds = function(bounds) {
    var matrix = this.matrix;
    var tl = matrix.transformPoint(bounds.x, bounds.y),
        tr = matrix.transformPoint(bounds.x + bounds.width, bounds.y),
        br = matrix.transformPoint(bounds.x + bounds.width, bounds.y + bounds.height),
        bl = matrix.transformPoint(bounds.x, bounds.y + bounds.height);
    var minX = Math.min(tl.x, tr.x, bl.x, br.x),
        minY = Math.min(tl.y, tr.y, bl.y, br.y),
        maxX = Math.max(tl.x, tr.x, bl.x, br.x),
        maxY = Math.max(tl.y, tr.y, bl.y, br.y);
    return new Bounds(minX, minY, maxX - minX, maxY - minY);
};

/**
* @method inverseAdaptBounds
*
* Adapt bounds to parent's coordinate space. Bounds are passed as an object
* `{ x: 100, y: 100, width: 200, height: 150 }`.
*
* @param {Object} bounds bounds to adapt
* @param {Number} bounds.x
* @param {Number} bounds.y
* @param {Number} bounds.width
* @param {Number} bounds.height
*
* @return {Object} transformed bounds
*/
Element.prototype.inverseAdaptBounds = function(bounds) {
    var matrix = this.matrix;
    var tl = matrix.transformPointInverse(bounds.x, bounds.y),
        tr = matrix.transformPointInverse(bounds.x + bounds.width, bounds.y),
        br = matrix.transformPointInverse(bounds.x + bounds.width, bounds.y + bounds.height),
        bl = matrix.transformPointInverse(bounds.x, bounds.y + bounds.height);
    var minX = Math.min(tl.x, tr.x, bl.x, br.x),
        minY = Math.min(tl.y, tr.y, bl.y, br.y),
        maxX = Math.max(tl.x, tr.x, bl.x, br.x),
        maxY = Math.max(tl.y, tr.y, bl.y, br.y);
    return new Bounds(minX, minY, maxX - minX, maxY - minY);
};

/**
 * @method isEmpty
 *
 * Check if this element contains something visual, like path, image or text.
 *
 * @return {Boolean} if element is empty
 */
Element.prototype.isEmpty = function() {
    var my_bounds = this.myBounds();
    return (my_bounds.width === 0) && (my_bounds.height === 0);
};

Element.prototype.applyVisuals = function(ctx) {
    var subj = this.$path || this.$text || this.$image || this.$video;
    if (!subj) return;

    // save/restore is performed inside .apply method
    // FIXME: split into p_applyBrush and p_drawVisuals,
    //        so user will be able to use brushes with
    //        his own painters
    subj.apply(ctx, this.$fill, this.$stroke, this.$shadow);
};

Element.prototype.applyBrushes = function(ctx) {
    if (this.$shadow) { this.$shadow.apply(ctx); }
    if (this.$fill) { this.$fill.apply(ctx); ctx.fill(); }
    if (this.$shadow) { Brush.clearShadow(ctx); }
    if (this.$stroke) { this.$stroke.apply(ctx); ctx.stroke(); }
}

Element.prototype.applyAComp = function(ctx) {
    if (this.composite_op) ctx.globalCompositeOperation = C.AC_NAMES[this.composite_op];
};

/**
 * @method mask
 *
 * Mask this element with another element. Literally, using this method way you
 * may produce animated masks and use masks with children and mask any elements with
 * children, same way. Just ensure both contain some overlapping graphics.
 * To disable masking back, use {@link anm.Element#noMask noMask} method.
 *
 * @param {anm.Element} elm Element to mask with
 *
 * @return {anm.Element} itself
 */
Element.prototype.mask = function(elm) {
    if (!elm) return this.$mask;
    this.$mask = elm;
    return this;
};

/**
 * @method noMask
 *
 * Disable mask previously set with {@link anm.Element#mask mask} method.
 *
 * @return {anm.Element} itself
 */
Element.prototype.noMask = function() {
    this.$mask = null;
    return this;
};

// @private
Element.prototype.ensureHasMaskCanvas = function(lvl) {
    if (this.__maskCvs && this.__backCvs) return;
    this.__maskCvs = engine.createCanvas(1, 1);
    this.__maskCtx = engine.getContext(this.__maskCvs, '2d');
    this.__backCvs = engine.createCanvas(1, 1);
    this.__backCtx = engine.getContext(this.__backCvs, '2d');
};

// @private
Element.prototype.removeMaskCanvases = function() {
    if (this.__maskCvs) engine.disposeElement(this.__maskCvs);
    if (this.__backCvs) engine.disposeElement(this.__backCvs);
    this.__maskCtx = null;
    this.__backCtx = null;
};

Element.prototype.data = function(val) {
    if (!is.defined(val)) return this.$data;
    this.$data = val;
    return this;
};

Element.prototype.toString = function() {
    var buf = [ '[ Element ' ];
    buf.push('\'' + (this.name || this.id) + '\' ');
    /*if (this.children.length > 0) {
        buf.push('( ');
        this.each(function(child) {
            buf.push(child.toString() + ', ');
        });
        buf.push(') ');
    }
    if (this.parent) {
        buf.push('< \'' + (this.parent.name || this.parent.id) + '\' > ');
    }*/
    buf.push(']');
    return buf.join("");
};

/**
 * @method find
 *
 * Find any element inside this element by its name.
 *
 * See also {@link anm.Animation#find animation.find} for information on nice
 * search abilities provided using special syntax.
 *
 * @param {String} name name of the element to search for, or a selector
 * @return {anm.Element|Null} found element or `null`
 */
Element.prototype.find = function(name) {
    if (!this.anim) throw errors.element(ErrLoc.A.NOT_BELONGS_TO_ANIMATION, this);
    return this.anim.find(name, this);
};

/**
 * @method find
 *
 * Find all the element inside this element matching to given name.
 *
 * See also {@link anm.Animation#findAll animation.findAll} for information on nice
 * search abilities provided using special syntax.
 *
 * @param {String} name name of the element to search for, or a selector
 * @return {[anm.Element]} found elements
 */
Element.prototype.findAll = function(name) {
    if (!this.anim) throw errors.element(ErrLoc.A.NOT_BELONGS_TO_ANIMATION, this);
    return this.anim.findAll(name, this);
};

/**
 * @method clone
 *
 * Clone this element.
 *
 * @return {anm.Element} clone
 */
Element.prototype.clone = function() {
    var clone = new Element();
    clone.name = this.name;
    clone.children = [].concat(this.children);
    clone.$modifiers = [].concat(this.$modifiers);
    clone.$painters = [].concat(this.$painters);
    clone.level = this.level;
    //clone.visible = this.visible;
    //clone.disabled = this.disabled;
    // .anim pointer, .scene pointer, .parent pointer & registered flag
    // are not transferred because the clone is another
    // element that should be separately added to some animation
    // in its own time to start working properly
    Element.transferState(this, clone);
    Element.transferVisuals(this, clone);
    Element.transferTime(this, clone);
    // FIXME: What else?
    clone.__u_data = this.__u_data;
    return clone;
};

/**
 * @method shallow
 *
 * Shallow-copy this element: clone itself and clone all of its children, modifiers and painters
 *
 * @return {anm.Element} shallow copy
 */
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
};

Element.prototype._addChild = function(elm) {
    //if (elm.parent) throw errors.element('This element already has parent, clone it before adding', this);
    elm.parent = this;
    elm.level = this.level + 1;
    this.children.push(elm); /* or add elem.id? */
    if (this.scene) this.scene._register(elm); /* TODO: rollback parent and child? */
};

Element.prototype._stateStr = function() {
    return "x: " + this.x + " y: " + this.y + '\n' +
           "sx: " + this.sx + " sy: " + this.sy + '\n' +
           "angle: " + this.angle + " alpha: " + this.alpha + '\n' +
           "p: " + this.p + " t: " + this.t + " key: " + this.key + '\n';
};

Element.prototype.__mbefore = function(t, type) {
    /*if (type === C.MOD_EVENT) {
        this.__loadEvtsFromCache();
    }*/
};

Element.prototype.__mafter = function(t, type, result) {
    /*if (!result || (type === C.MOD_USER)) {
        this.__lmatrix = Element._getIMatrixOf(this.bstate, this.state);
    }*/
    /*if (!result || (type === C.MOD_EVENT)) {
        this.__clearEvtState();
    }*/
};

Element.prototype.__adaptModTime = function(modifier, ltime) {

    // gets element local time (relative to its local band) and
    // returns modifier local time (relative to its local band)

    // TODO: move to Modifier class?

    var elm = this,
        elm_duration = elm.time.getDuration(), // duration of the element's local band
        mod_easing = modifier.$easing, // modifier easing
        mod_time = modifier.$band || modifier.$time, // time (or band) of the modifier, if set
        mod_relative = modifier.$relative, // is modifier time or band relative to elm duration or not
        mod_is_tween = modifier.is_tween; // should time be passed in relative time or not

    var res_time,
        res_duration;

    // modifier takes the whole element time
    if (mod_time === null) {

        res_time = ltime;
        res_duration = elm_duration;

    // modifier is band-restricted
    } else if (is.arr(mod_time)) {

        var mod_band = mod_time,
            mod_duration;

        // this band is specified relatively to local band in absolute time values
        // (like [0, 7] modifier band for [0, 10] element band)
        if (!mod_relative) {
            mod_duration = mod_band[1] - mod_band[0];
        // this band is specified relatively to local band in relative time values
        // (like [0, 0.7] modifier band for [0, 10] element band means [0, 7], as above)
        } else {
            mod_band = [ mod_band[0] * elm_duration,
                         mod_band[1] * elm_duration ];
            mod_duration = mod_band[1] - mod_band[0];
        }

        res_time = ltime - mod_band[0];
        res_duration = mod_duration;
        if (t_cmp(res_time, 0) < 0) return null;
        if (t_cmp(res_time, res_duration) > 0) return null;

    // modifier is assigned to trigger at some specific time moment
    } else if (is.num(mod_time)) {

        if (modifier.__wasCalled && modifier.__wasCalled[elm.id]) return null;
        var tpos = mod_relative ? (mod_time * elm_duration) : mod_time;
        if (t_cmp(ltime, tpos) >= 0) {
            if (!modifier.__wasCalled) modifier.__wasCalled = {};
            if (!modifier.__wasCalledAt) modifier.__wasCalledAt = {};
            modifier.__wasCalled[elm.id] = true;
            modifier.__wasCalledAt[elm.id] = ltime;
        } else return null;

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
        if (is.finite(res_duration)) {
            res_time = t_adjust(res_time) / t_adjust(res_duration);
            res_duration = t_adjust(res_duration);
        } else {
            // if band duration is infinite, time value is left as it was
        }
    } else {
        res_time = t_adjust(res_time);
        res_duration = t_adjust(res_duration);
    }

    // apply easing, if it's there
    return !mod_easing ? [ res_time, res_duration ]
                       : [ mod_easing(res_time, res_duration),
                           res_duration ];
};

Element.prototype.__pbefore = function(ctx, type) { };
Element.prototype.__pafter = function(ctx, type) { };
Element.prototype.__checkSwitcher = function(gtime) {
    if (!this.parent || !this.parent.switch) return gtime;
    // FIXME: move switcher to Timeline class
    var parent = this.parent;
    if (parent.switch === C.SWITCH_OFF) return Element.NO_TIME;
    if ((parent.switch === this.name) && parent.switch_band) {
        if (gtime === Element.NO_TIME) return Element.NO_TIME;
        return gtime - parent.switch_band[0];
    } else return Element.NO_TIME;
}
Element.prototype.filterEvent = function(type, evt) {
    if ((type != C.X_START) &&
        (type != C.X_END) && this.shown) {
        this.__saveEvt(type, evt);
    }
    return true;
};

Element.prototype.__saveEvt = function(type, evt) {
    this.__evtCache.push([type, evt]);
};

Element.prototype.__loadEvents = function() {
    var cache = this.__evtCache;
    var cache_len = cache.length;
    this.resetEvents();
    if (cache_len > 0) {
        var edata, type, evts;
        for (var ei = 0; ei < cache_len; ei++) {
            edata = cache[ei];
            type = edata[0];
            this.__evt_st.save(type);
            evts = this.evts;
            if (!evts[type]) evts[type] = [];
            evts[type].push(edata[1]);
        }
        this.__evtCache = [];
    }
};

Element.prototype.__preRender = function(ltime, ctx) {
    var cr = this.__frameProcessors;
    for (var i = 0, cl = cr.length; i < cl; i++) {
        if (cr[i].call(this, ltime, ctx) === false) return false;
    }
    return true;
};

Element.prototype.__safeDetach = function(what, _cnt) {
    var pos = -1, found = _cnt || 0;
    var children = this.children;
    if ((pos = children.indexOf(what)) >= 0) {
        if (this.rendering || what.rendering) {
            this.__detachQueue.push(what/*pos*/);
        } else {
            if (this.__unsafeToRemove) throw errors.element(ErrLoc.A.UNSAFE_TO_REMOVE, this);
            what._unbind();
            children.splice(pos, 1);
        }
        return 1;
    } else {
        this.each(function(ielm) {
            found += ielm.__safeDetach(what, found);
        });
        return found;
    }
};

Element.prototype.__postRender = function() {
    // clear detach-queue
    this.__performDetach();
};

Element.prototype._hasRemoteResources = function(anim, player) {
    if (player.imagesEnabled && this.$image) return true;
    if (this.is(C.ET_AUDIO) && player.audioEnabled) return true;
    if (this.is(C.ET_VIDEO) && player.videoEnabled) return true;
    if (this.$mask) return this.$mask._hasRemoteResources(anim, player);

    return false;
};

Element.prototype._collectRemoteResources = function(anim, player) {
    var resources = [];

    if (player.imagesEnabled && this.$image) {
        resources.push(this.$image.src);
    }

    if (player.audioEnabled && this.is(C.ET_AUDIO)) {
        resources.push(this.$audio.url);
    }

    if (player.videoEnabled && this.is(C.ET_VIDEO)) {
        resources.push(this.$video.url);
    }

    if (this.$mask) {
        resources = resources.concat(this.$mask._collectRemoteResources(anim, player));
    }

    return resources;
};

Element.prototype._loadRemoteResources = function(anim, player) {
    if (player.imagesEnabled && this.$image) {
        this.$image.load(this.id, player);
    }
    if (this.is(C.ET_AUDIO) && player.audioEnabled) {
        this.$audio.load(this.id, player);
    }
    if (this.is(C.ET_VIDEO) && player.videoEnabled) {
        this.$video.load(this.id, player);
    }
    if (this.$mask) {
        this.$mask._loadRemoteResources(this, player);
    }
};

Element.mergeStates = function(src1, src2, trg) {
    trg.x  = src1.x  + src2.x;  trg.y  = src1.y  + src2.y;
    trg.sx = src1.sx * src2.sx; trg.sy = src1.sy * src2.sy;
    trg.hx = src1.hx + src2.hx; trg.hy = src1.hy + src2.hy;
    trg.angle = src1.angle + src2.angle;
    trg.alpha = src1.alpha + src2.alpha;
};

Element.transferState = function(src, trg) {
    trg.x = src.x; trg.y = src.y;
    trg.sx = src.sx; trg.sy = src.sy;
    trg.hx = src.hx; trg.hy = src.hy;
    trg.angle = src.angle;
    trg.alpha = src.alpha;
    trg.$reg = [].concat(src.$reg);
    trg.$pivot = [].concat(src.$pivot);
};

Element.transferVisuals = function(src, trg) {
    trg.$fill = Brush.clone(src.$fill);
    trg.$stroke = Brush.clone(src.$stroke);
    trg.$shadow = Brush.clone(src.$shadow);
    trg.$path = src.$path ? src.$path.clone() : null;
    trg.$text = src.$text ? src.$text.clone() : null;
    trg.$image = src.$image ? src.$image.clone() : null;
    trg.$audio = src.$audio ? src.$audio.clone() : null;
    trg.$video = src.$video ? src.$video.clone() : null;
    trg.$mask = src.$mask ? src.$mask : null;
    trg.$mpath = src.$mpath ? src.$mpath.clone() : null;
    trg.composite_op = src.composite_op;
};

Element.transferTime = function(src, trg) {
    trg.time = src.time.clone(trg);
};

// TODO: rename to matrixOf ?
Element.getMatrixOf = function(elm, m) {
    var t = (m ? (m.reset(), m)
                : new Transform());
    var tr = Element.getTranslate(elm);
    t.translate(tr ? tr.x : elm.x, tr ? tr.y : elm.y);
    t.rotate(elm.angle + Element.getRotate(elm));
    t.shear(elm.hx, elm.hy);
    t.scale(elm.sx, elm.sy);
    t.translate(-elm.$reg[0], -elm.$reg[1]);

    var pivot = elm.$pivot;
    if ((pivot[0] === 0) && (pivot[1] === 0)) return t;
    var my_bounds = elm.myBounds();
    if (!my_bounds || (my_bounds === Bounds.NONE)) return t;
    t.translate(-(pivot[0] * (my_bounds.width || 0)),
                -(pivot[1] * (my_bounds.height || 0)));

    return t;
};

Element.getTranslate = function(elm) {
    if (elm.parent && elm.parent.layer2Bone) {
	elm.$bonePath = elm.$bonePath || Element.bonePath(elm);
        var result = {x: 0, y: 0};
        var bone = null;
	for (var li = elm.$bonePath.length; li--;) {
            bone = elm.$bonePath[li];
	    result.x += bone.bonelength * Math.cos(bone.bonerotate);
	    result.y += bone.bonelength * Math.sin(bone.bonerotate);
	}
        elm = bone ? elm.parent.children[bone.$from] : elm;
        result.x += elm.x;
        result.y += elm.y;
        return result;
    }
    return null;
};

Element.getRotate = function(elm) {
    if (elm.parent && elm.parent.layer2Bone) {
        elm.$bonePath = elm.$bonePath || Element.bonePath(elm);
	var result = 0;
	for (var li = elm.$bonePath.length; li--;) {
	    result += elm.$bonePath[li].bonerotate;
	}
        return result;
    }
    return 0;
};

Element.bonePath = function(elm) {
    var l2b = elm.parent.layer2Bone;
    var result = [];
    var bone = l2b[elm.parent.children.indexOf(elm)];
    while (bone) {
       result.push(bone);
       bone = l2b[bone.$from];
    }
    return result;
};

Element.getIMatrixOf = function(elm, m) {
    var t = Element.getMatrixOf(elm, m);
    t.invert();
    return t;
};

Element._fromArguments = function(arg1, arg2, arg3) {
    if (arg2) { // element by functions mode
        var elm = new Element(arg1, arg2);
        if (arg3) elm.changeTransform(arg3);
        return elm;
    } else if (is.arr(arg1)) { // elements array mode
        var clip = new Element();
        clip.add(arg1);
        return clip;
    } else { // element object mode
        return arg1;
    }
};

/* TODO: add createFromImgUrl?
 Element.imgFromURL = function(url) {
    return new Sheet(url);
}*/

Element.prototype.addSysModifiers = function() {
    // band check performed in checkJump
    // Render.m_checkBand
    // Render.m_saveReg
    // Render.m_applyPos
};

Element.prototype.addSysPainters = function() {
    this.paint(Render.p_applyAComp);
    this.paint(Render.p_drawVisuals);
};

Element.prototype.addDebugRender = function() {
    this.paint(Render.p_drawPivot);
    this.paint(Render.p_drawBounds);
    this.paint(Render.p_drawReg);
    this.paint(Render.p_drawName);
    this.paint(Render.p_drawMPath);
};

Element.prototype.getPath = function() {
    var cursor = this, last;
    var path = '';
    while (cursor) {
        path = cursor.name + '/' + path;
        last = cursor;
        cursor = cursor.parent;
    };
    if (last && last.scene) {
        path = last.scene.name + '/' + path;
    };
    return '/' + path;
};

module.exports = Element;
