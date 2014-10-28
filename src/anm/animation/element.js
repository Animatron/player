var log = require('../log.js'),
    utils = require('../utils.js'),
    global_opts = require('../global_opts.js');

var iter = utils.iter,
    is = utils.is;

var engine = require('engine');

var C = require('../constants.js');

var provideEvents = require('../events.js').provideEvents;

var Transform = require('../../vendor/transform.js');

var Render = require('../render.js');

var Brush = require('../graphics/brush.js'),
    Color = require('../graphics/color.js'),
    Bounds = require('../graphics/bounds.js');

var Modifier = require('./modifier.js'),
    Painter = require('./painter.js'),
    Bands = require('./band.js');

var AnimationError = require('../errors.js').AnimationError,
    Errors = require('../loc.js').Errors;

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

var isPlayerEvent = function(type) {
    // FIXME: make some marker to group types of events
    return ((type == C.S_CHANGE_STATE) ||
            (type == C.S_PLAY)  || (type == C.S_PAUSE)    ||
            (type == C.S_STOP)  || (type == C.S_REPEAT)   ||
            (type == C.S_LOAD)  || (type == C.S_RES_LOAD) ||
            (type == C.S_ERROR) || (type == C.S_IMPORT)   ||
            (type == C.S_COMPLETE));
};

Element.DEFAULT_PVT = [ 0.5, 0.5 ];
Element.DEFAULT_REG = [ 0.0, 0.0 ];

// > Element % (name: String,
//              draw: Function(ctx: Context),
//              onframe: Function(time: Float))
function Element(name, draw, onframe) {
    this.id = utils.guid();
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
    var me = this,
        default_on = this.on;
    this.on = function(type, handler) {
        if (type & C.XT_CONTROL) {
            return this.m_on.call(me, type, handler);
        } else return default_on.call(me, type, handler);
        // return this; // FIXME: make chainable
    };
    this.addSysModifiers();
    this.addSysPainters();
    if (global_opts.liveDebug) this.addDebugRender();
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
    this._dt = null;
    this._t = null; this._rt = null; this._key = null;
                                // cur local time (t) and 0..1 time (rt) and,
                                // if it was ever applied, the last applied key
    if (this._matrix) { this._matrix.reset() }
    else { this._matrix = new Transform(); }

    this.$reg = Element.DEFAULT_REG;   // registration point (static values)
    this.$pivot = Element.DEFAULT_PVT; // pivot (relative to dimensions)

    return this;
}
Element.prototype.resetState = Element.prototype.initState;
Element.prototype.initVisuals = function() {

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

    this.$mask = null; // Element instance, if this element has a mask
    this.$mpath = null; // move path, though it's not completely "visual"

    this.$bounds = null; // Element bounds incl. children, cached
    this.$my_bounds = null; // Element bounds on its own, cached

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
        this.invalidate();
        this.type = C.ET_PATH;
        this.$path = value;
        return this;
    } else return this.$path;
}
// > Element.text % ([value: Text]) => Text | Element
Element.prototype.text = function(value) {
    if (value) {
        this.invalidate();
        this.type = C.ET_TEXT;
        this.$text = value;
        return this;
    } else return this.$text;
}
// > Element.image % ([value: Sheet]) => Sheet | Element
Element.prototype.image = function(value) {
    if (value) {
        this.invalidate();
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
// > Element.modifiers % (ltime: Float, dt: Float[, types: Array]) => Boolean
Element.prototype.modifiers = function(ltime, dt, types) {
    var elm = this;
    var order = types || Modifier.ALL_MODIFIERS;

    // copy current state as previous one
    elm.applyPrevState(elm);

    // FIXME: checkJump is performed before, may be it should store its values inside here?
    if (is.num(elm.__appliedAt)) {
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

    elm.matrix = Element.getMatrixOf(elm, elm.matrix);

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
Element.prototype.adapt = function(pts) {
    if (is.arr(pts)) {
        var trg = [];
        var matrix = this.matrix;
        for (var i = 0, il = pts.length; i < il; i++) {
            trg.push(matrix.transformPoint(pts[i]));
        }
        return trg;
    } else {
        return this.matrix.transformPoint(pts);
    }
}
Element.prototype.adaptRect = function(rect) {
    var matrix = this.matrix;
    return { tl: matrix.transformPoint(rect.tl),
             tr: matrix.transformPoint(rect.tr),
             bl: matrix.transformPoint(rect.bl),
             br: matrix.transformPoint(rect.br) };
}
// > Element.draw % (ctx: Context)
Element.prototype.draw = Element.prototype.painters;
// > Element.transform % (ctx: Context)
Element.prototype.transform = function(ctx) {
    ctx.globalAlpha *= this.alpha;
    this.matrix.apply(ctx);
    return this.matrix;
}
// > Element.invTransform % (ctx: Context)
Element.prototype.invTransform = function(ctx) {
    var inv_matrix = Element.getIMatrixOf(this); // this will not write to elm matrix
    ctx.globalAlpha *= this.alpha;
    inv_matrix.apply(ctx);
    return inv_matrix;
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
    // FIXME: masks have no animation set to something, but should to (see masks tests)
    if (this.anim && this.anim.__informEnabled) this.inform(ltime);
    if (drawMe) {
        drawMe = this.fits(ltime)
                 && this.modifiers(ltime, dt)
                 && this.visible; // modifiers should be applied even if element isn't visible
    }
    if (drawMe) {
        ctx.save();
        try {
            // update global time with new local time (it may've been
            // changed if there were jumps or something), so children will
            // get the proper value
            gtime = this.gtime(ltime);
            if (!this.$mask) {
                // draw directly to context, if has no mask
                this.transform(ctx);
                this.painters(ctx);
                this.each(function(child) {
                    child.render(ctx, gtime, dt);
                });
            } else {
                // FIXME: the complete mask process should be a Painter.

                var anim = this.anim;
                if (!anim) throw new AnimationError(Errors.A.MASK_SHOULD_BE_ATTACHED_TO_ANIMATION);
                var level = this.level;

                var mask = this.$mask;

                // FIXME: move this chain completely into one method, or,
                //        which is even better, make all these checks to be modifiers
                // FIXME: call modifiers once for one moment of time. If there are several
                //        masked elements, they will be called that number of times
                if (!(mask.fits(ltime)
                      && mask.modifiers(ltime, dt)
                      && mask.visible)) return;
                      // what should happen if mask doesn't fit in time?

                // FIXME: both canvases should be stored in a mask itself.
                anim.__ensureHasMaskCanvas(level);
                var mcvs = anim.__maskCvs[level],
                    mctx = anim.__maskCtx[level],
                    bcvs = anim.__backCvs[level],
                    bctx = anim.__backCtx[level];

                var bounds_pts = mask.adapt(mask.boundsPoints());

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
                    width  = Math.ceil(maxX - minX),
                    height = Math.ceil(maxY - minY);

                var last_cvs_size = this._maskCvsSize || engine.getCanvasSize(mcvs);

                if ((last_cvs_size[0] < (width  * ratio)) ||
                    (last_cvs_size[1] < (height * ratio))) {
                    // mcvs/bcvs both always have the same size, so we save/check only one of them
                    this._maskCvsSize = engine.setCanvasSize(mcvs, width, height);
                    engine.setCanvasSize(bcvs, width, height);
                } else {
                    this._maskCvsSize = last_cvs_size;
                }

                bctx.save(); // bctx first open
                if (ratio !== 1) bctx.scale(ratio, ratio);
                bctx.clearRect(0, 0, width, height);

                bctx.save(); // bctx second open
                bctx.translate(-x, -y);

                this.transform(bctx);
                this.painters(bctx);
                this.each(function(child) {
                    child.render(bctx, gtime, dt);
                });

                bctx.restore(); // bctx second closed

                bctx.globalCompositeOperation = 'destination-in';

                mctx.save(); // mctx first open

                if (ratio !== 1) mctx.scale(ratio, ratio);
                mctx.clearRect(0, 0, width, height);

                mctx.translate(-x, -y);
                mask.transform(mctx);
                mask.painters(mctx);
                mask.each(function(child) {
                    child.render(mctx, gtime, dt);
                });

                mctx.restore(); // mctx first close

                bctx.drawImage(mcvs, 0, 0, width, height);
                bctx.restore(); // bctx first closed

                ctx.translate(x, y);
                ctx.drawImage(bcvs, 0, 0, width, height);
            }
        } catch(e) { log.error(e); }
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
    if (!is.arr(band)) { modifier = band;
                        band = null; }
    if (!modifier) throw new AnimationError('No modifier was passed to .modify() method');
    if (!is.modifier(modifier) && is.fun(modifier)) {
        modifier = new Modifier(modifier, C.MOD_USER);
    } else if (!is.modifier(modifier)) {
        throw new AnimationError('Modifier should be either a function or a Modifier instance');
    }
    if (!modifier.type) throw new AnimationError('Modifier should have a type defined');
    if (band) modifier.$band = band;
    if (modifier.__applied_to &&
        modifier.__applied_to[this.id]) throw new AnimationError('This modifier is already applied to this Element');
    if (!this.$modifiers[modifier.type]) this.$modifiers[modifier.type] = [];
    this.$modifiers[modifier.type].push(modifier);
    this.__modifiers_hash[modifier.id] = modifier;
    if (!modifier.__applied_to) modifier.__applied_to = {};
    modifier.__applied_to[this.id] = this.$modifiers[modifier.type].length; // the index in the array by type + 1 (so 0 means not applied)
    return this;
}
// > Element.removeModifier % (modifier: Function)
Element.prototype.removeModifier = function(modifier) {
    if (!is.modifier(modifier)) throw new AnimationError('Please pass Modifier instance to removeModifier');
    if (!this.__modifiers_hash[modifier.id]) throw new AnimationError('Modifier wasn\'t applied to this element');
    if (!modifier.__applied_to || !modifier.__applied_to[this.id]) throw new AnimationError(Errors.A.MODIFIER_NOT_ATTACHED);
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
    if (!painter) throw new AnimationError('No painter was passed to .paint() method');
    if (!is.painter(painter) && is.fun(painter)) {
        painter = new Painter(painter, C.MOD_USER);
    } else if (!is.painter(painter)) {
        throw new AnimationError('Painter should be either a function or a Painter instance');
    }
    if (!painter.type) throw new AnimationError('Painter should have a type defined');
    if (painter.__applied_to &&
        painter.__applied_to[this.id]) throw new AnimationError('This painter is already applied to this Element');
    if (!this.$painters[painter.type]) this.$painters[painter.type] = [];
    this.$painters[painter.type].push(painter);
    this.__painters_hash[painter.id] = painter;
    if (!painter.__applied_to) painter.__applied_to = {};
    painter.__applied_to[this.id] = this.$painters[painter.type].length; // the index in the array by type + 1 (so 0 means not applied)
    return this;
}
// > Element.removePainter % (painter: Function | Painter)
Element.prototype.removePainter = function(painter) {
    if (!is.painter(painter)) throw new AnimationError('Please pass Painter instance to removePainter');
    if (!this.__painters_hash[painter.id]) throw new AnimationError('Painter wasn\'t applied to this element');
    if (!painter.__applied_to || !painter.__applied_to[this.id]) throw new AnimErr(Errors.A.PAINTER_NOT_ATTACHED);
    //if (this.__modifying) throw new AnimErr("Can't remove modifiers while modifying");
    delete this.__painters_hash[painter.id];
    delete this.$painters[painter.type].splice(painter.__applied_to[this.id] - 1, 1); // delete by index
    delete painter.__applied_to[this.id];
    return this;
}
// > Element.tween % (tween: Tween)
Element.prototype.tween = function(tween) {
    if (!is.tween(tween)) throw new AnimationError('Please pass Tween instance to .tween() method');
    // tweens are always receiving time as relative time
    // is.finite(duration) && duration ? (t / duration) : 0
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
}
// > Element.remove % (elm: Element)
Element.prototype.remove = function(elm) {
    if (!elm) throw new AnimationError(Errors.A.NO_ELEMENT_TO_REMOVE);
    if (this.__safeDetach(elm) == 0) throw new AnimationError(Errors.A.NO_ELEMENT);
    this.invalidate();
    return this;
}
Element.prototype._unbind = function() {
    if (this.parent.__unsafeToRemove ||
        this.__unsafeToRemove) throw new AnimationError(Errors.A.UNSAFE_TO_REMOVE);
    this.parent = null;
    if (this.anim) this.anim._unregister(this);
    // this.anim should be null after unregistering
}
// > Element.detach % ()
Element.prototype.detach = function() {
    if (this.parent.__safeDetach(this) == 0) throw new AnimationError(Errors.A.ELEMENT_NOT_ATTACHED);
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
    return t_cmp(ltime, this.lband[1] - this.lband[0]) <= 0;
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
    if (!is.finite(gband[1])) return this.__checkJump(gtime - gband[0]);
    switch (this.mode) {
        case C.R_ONCE:
            return this.__checkJump(gtime - gband[0]);
        case C.R_STAY:
            return (t_cmp(gtime, gband[1]) <= 0)
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
    if (!isPlayerEvent(event)) throw new Error('This method is intended to assign only player-related handles');
    this.on(event, handler);
}
// > Element.inform % (ltime: Float)
Element.prototype.inform = function(ltime) {
    if (t_cmp(ltime, 0) >= 0) {
        var duration = this.lband[1] - this.lband[0],
            cmp = t_cmp(ltime, duration);
        if (!this.__firedStart) {
            this.fire(C.X_START, ltime, duration);
            // FIXME: it may fire start before the child band starts, do not do this!
            /* this.traverse(function(elm) { // TODO: implement __fireDeep
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
                this.traverse(function(elm) { // TODO: implement __fireDeep
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
    if (!is.defined(start)) return this.lband;
    // FIXME: array bands should not pass
    // if (is.arr(start)) throw new AnimErr('Band is specified with two numbers, not an array');
    if (is.arr(start)) {
        stop = start[1];
        start = start[0];
    }
    if (!is.defined(stop)) { stop = Infinity; }
    this.lband = [ start, stop ];
    if (this.parent) {
        var parent = this.parent;
        this.gband = [ parent.gband[0] + start, parent.gband[0] + stop ];
    }
    return this;
}
// > Element.duration % () -> Float
Element.prototype.duration = function(value) {
    if (!is.defined(value)) return this.lband[1] - this.lband[0];
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
    this.each(function(child) {
        result = Bands.expand(result, child.gband);
        //result = Bands.expand(result, elm.findWrapBand());
    });
    return (result[0] !== Infinity) ? result : null;
}
Element.prototype.dispose = function() {
    this.disposeHandlers();
    this.disposeVisuals();
    this.each(function(child) {
        child.dispose();
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
        if (is.defined(modifier.__wasCalledAt)) modifier.__wasCalledAt[elm.id] = -1;
    });
    this.each(function(elm) {
        elm.reset();
    });
}
Element.prototype.each = function(func) {
    var children = this.children;
    this.__unsafeToRemove = true;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        func(children[ei]);
    };
    this.__unsafeToRemove = false;
    return this;
}
Element.prototype.traverse = function(func) {
    var children = this.children;
    this.__unsafeToRemove = true;
    for (var ei = 0, el = children.length; ei < el; ei++) {
        var elem = children[ei];
        func(elem);
        elem.traverse(func);
    };
    this.__unsafeToRemove = false;
    return this;
}
Element.prototype.iter = function(func, rfunc) {
    this.__unsafeToRemove = true;
    iter(this.children).each(func, rfunc);
    this.__unsafeToRemove = false;
    return this;
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
    this.matrix.transformPoint();
}
Element.prototype.global = function(pt) {
    this.matrix.transformPoint();
} */
Element.prototype.invalidate = function() {
    this.$my_rect = null;
    this.$my_bounds = null;
    this.$bounds = null;
    this.lastBoundsSavedAt = null;
    if (this.parent) this.parent.invalidate();
}
Element.prototype.invalidateVisuals = function() {
    //TODO: replace with this['$' + this.type].invalidate() ?
    var subj = this.$path || this.$text || this.$image;
    if (subj) subj.invalidate();
}
// returns bound in a parent's coordinate space
Element.prototype.bounds = function(ltime) {
    if (is.defined(this.lastBoundsSavedAt) &&
        (t_cmp(this.lastBoundsSavedAt, ltime) == 0) return this.$bounds;

    var my_rect = this.adaptRect(this.myRect());

    var result = Bounds.fromRect(my_rect);
    if (this.children.length) {
        var child_bounds = null;
        this.each(function(child) {
            result.add(child.adaptRect(child.myRect()));
        });
    }
    this.lastBoundsSavedAt = ltime;
    return (this.$bounds = result);
}
Element.prototype.myRect = function() {
    if (this.$my_rect) return this.$my_rect;
    var bounds = this.myBounds();
    return (this.$my_rect = bounds.toRect());
}
// returns bounds with no children consideration, and not affected by any matrix — pure local bounds
Element.prototype.myBounds = function() {
    if (this.$my_bounds) return this.$my_bounds;
    var subj = this.$path || this.$text || this.$image;
    if (subj) { return (this.$my_bounds = subj.bounds()); }
    else return (this.$my_bounds = { x: 0, y: 0, width: 0, height: 0 });
}
Element.prototype.isEmpty = function() {
    var my_bounds = this.myBounds();
    return (my_bounds.width == 0) && (my_bounds.height == 0);
}
Element.prototype.applyVisuals = function(ctx) {
    var subj = this.$path || this.$text || this.$image;
    if (!subj) return;

    // save/restore is performed inside .apply method
    // FIXME: split into p_applyBrush and p_drawVisuals,
    //        so user will be able to use brushes with
    //        his own painters
    subj.apply(ctx, this.$fill, this.$stroke, this.$shadow);
}
Element.prototype.applyAComp = function(ctx) {
    if (this.composite_op) ctx.globalCompositeOperation = C.AC_NAMES[this.composite_op];
}
Element.prototype.mask = function(elm) {
    if (!elm) return this.$mask;
    if (this.anim) this.anim.__ensureHasMaskCanvas(this.level);
    this.$mask = elm;
}
Element.prototype.noMask = function() {
    this.$mask = null;
}
Element.prototype.data = function(val) {
  if (!is.defined(val)) return this.$data;
  this.$data = val;
  return this;
}
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
}
Element.prototype.find = function(name) {
    this.anim.find(name, this);
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
    } else if (is.arr(mod_time)) {

        var mod_band = mod_time,
            mod_duration;

        // this band is specified relatively to local band in absolute time values
        // (like [0, 7] modifier band for [0, 10] element band)
        if (!mod_relative) {
            mod_duration = mod_band[1] - mod_band[0];
            if (t_cmp(ltime, mod_band[0]) < 0) return false;
            if (t_cmp(ltime, mod_band[1]) > 0) return false;
        // this band is specified relatively to local band in relative time values
        // (like [0, 0.7] modifier band for [0, 10] element band means [0, 7], as above)
        } else {
            mod_band = [ mod_band[0] * elm_duration,
                         mod_band[1] * elm_duration ];
            mod_duration = mod_band[1] - mod_band[0];
            if (t_cmp(ltime, mod_band[0]) < 0) return false;
            if (t_cmp(ltime, mod_band[1]) > 0) return false;
        }

        res_time = ltime - mod_band[0];
        res_duration = mod_duration;

    // modifier is assigned to trigger at some specific time moment
  } else if (is.num(mod_time)) {

        if (modifier.__wasCalled && modifier.__wasCalled[elm.id]) return false;
        var tpos = mod_relative ? (mod_time * elm_duration) : mod_time;
        if (t_cmp(ltime, tpos) >= 0) {
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
        if (is.finite(res_duration)) {
            res_time = t_adjust(res_time) / t_adjust(res_duration);
            res_duration = t_adjust(res_duration);
        } else {
            res_time = 0;
        }
    } else {
        res_time = t_adjust(res_time);
        res_duration = t_adjust(res_duration);
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
    t = (is.defined(this.p)) ? this.p : null;
    t = ((t === null) && (this.t !== null) && is.finite(duration))
        ? this.t * duration
        : t;
    t = ((t === null) && (is.defined(this.key)))
        ? this.keys[this.key]
        : t;
    if (t !== null) {
        if ((t < 0) || (t > duration)) {
            throw new AnimationError('failed to calculate jump');
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
    if (is.defined(this.__lastJump)) {
       /* return (jump_pos + (t - jumped_at)) */
       return (is.finite(this.__lastJump[1])
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
    if (!isPlayerEvent(type)
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
            if (this.__unsafeToRemove) throw new AnimationError(Errors.A.UNSAFE_TO_REMOVE);
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
    trg.$reg = [].concat(src.$reg);
    trg.$pivot = [].concat(src.$pivot);
}
Element.transferVisuals = function(src, trg) {
    trg.$fill = Brush.clone(src.$fill);
    trg.$stroke = Brush.clone(src.$stroke);
    trg.$shadow = Brush.clone(src.$shadow);
    trg.$path = src.$path ? src.$path.clone() : null;
    trg.$text = src.$text ? src.$text.clone() : null;
    trg.$image = src.$image ? src.$image.clone() : null;
    trg.$mask = src.$mask ? src.$mask : null;
    trg.$mpath = src.$mpath ? src.$mpath.clone() : null;
    // trg.$bounds = src.$bounds ? src.$bounds.clone : null;
    // trg.$my_bounds = src.$my_bounds ? src.$my_bounds.clone : null;
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
    var t = (m ? (m.reset(), m)
                : new Transform());
    t.translate(elm.x, elm.y);
    t.rotate(elm.angle);
    t.shear(elm.hx, elm.hy);
    t.scale(elm.sx, elm.sy);
    t.translate(-elm.$reg[0], -elm.$reg[1]);

    var pivot = elm.$pivot;
    if ((pivot[0] === 0) && (pivot[1] === 0)) return t;
    var my_bounds = elm.myBounds();
    if (!my_bounds) return t;
    t.translate(pivot[0] * my_bounds.width,
                pivot[1] * my_bounds.height);

    return t;
}
Element.getIMatrixOf = function(elm, m) {
    var t = Element.getMatrixOf(elm, m);
    t.invert();
    return t;
}
/* TODO: add createFromImgUrl?
 Element.imgFromURL = function(url) {
    return new Sheet(url);
}*/

Element.prototype.addSysModifiers = function() {
    // band check performed in checkJump
    // Render.m_checkBand
    // Render.m_saveReg
    // Render.m_applyPos
}
Element.prototype.addSysPainters = function() {
    this.paint(Render.p_applyAComp);
    this.paint(Render.p_drawVisuals);
}
Element.prototype.addDebugRender = function() {
    this.paint(Render.p_drawPivot);
    this.paint(Render.p_drawReg);
    this.paint(Render.p_drawName);
    this.paint(Render.p_drawMPath);
}

module.exports = Element;
