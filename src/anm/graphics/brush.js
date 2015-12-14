var C = require('../constants.js');

var conf = require('../conf.js'),
    utils = require('../utils.js'),
    log = require('../log.js'),
    is = utils.is;

var engine = require('engine');

var errors = require('../errors.js');

var Color = require('./color.js');

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
// { stops: [ [ t, color ], ... ],
//   dir: [ [ x0, y0 ], [ x1, y1] ]
//   bounds: [ x, y, width, height ] }
// { stops: [ [ t, color ], ... ],
//   dir: [ [ x0, y0 ], [ x1, y1] ]
//   bounds: [ x, y, width, height ],
//   r: [ r0, r1 ] }

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

/**
 * @class anm.Brush
 *
 * Brush holds either fill, stroke or shadow data in one object.
 *
 * Examples:
 *
 * * `var brush = Brush.fill('#ff0000');`
 * * `var brush = Brush.stroke('#ff0000', 10);`
 * * `var brush = Brush.stroke(Color.rgba(10, 20, 40, 0.5), 10);`
 * * `var brush = Brush.fill(Brush.gradient({0: "#000", 0.5: "#ccc"}));`
 * * `var brush = Brush.fill(Brush.gradient({0: "#000", 0.5: "#ccc"}).size(200, 200).radial());`
 * * `var brush = Brush.shadow('rgb(10, 20, 40)', 3, 0, 0);`
 *
 * See: {@link anm.Color Color}, {@link anm.Element#fill Element.fill}, {@link anm.Element#stroke Element.stroke},
 * {@link anm.Element#shadow Element.shadow}
 *
 */
function Brush(value) {
    this.type = C.BT_NONE;
    if (value) Brush.value(value, this);
}
Brush.DEFAULT_CAP = C.PC_ROUND;
Brush.DEFAULT_JOIN = C.PC_ROUND;
Brush.DEFAULT_FILL = '#ffbc05';
Brush.DEFAULT_STROKE = Color.TRANSPARENT;
Brush.DEFAULT_SHADOW = Color.TRANSPARENT;

/**
 * @method apply
 *
 * Apply this brush to given context
 *
 * @param {Context2D} ctx context to apply to
 */
Brush.prototype.apply = function(ctx) {
    if (this.type == C.BT_NONE) return;
    var style = this._style || (this._style = this.adapt(ctx));
    if (this.type == C.BT_FILL) {
        ctx.fillStyle = style;
    } else if (this.type == C.BT_STROKE) {
        if (this.width > 0) {
          ctx.lineWidth = this.width;
          ctx.strokeStyle = style || Brush.DEFAULT_STROKE;
          ctx.lineCap = this.cap || Brush.DEFAULT_CAP;
          ctx.lineJoin = this.join || Brush.DEFAULT_JOIN;
        } else {
          Brush.clearStroke(ctx);
        }
        // TODO: mitter
    } else if (this.type == C.BT_SHADOW) {
        if (conf.doNotRenderShadows) return;
        // FIXME: this could be a slow operation to perform
        var props = engine.getAnmProps(ctx);
        if (props.skip_shadows) return;
        var ratio = (engine.PX_RATIO * (props.factor || 1));
        ctx.shadowColor = style;
        ctx.shadowBlur = (this.blurRadius * ratio) || 0;
        ctx.shadowOffsetX = (this.offsetX * ratio) || 0;
        ctx.shadowOffsetY = (this.offsetY * ratio) || 0;
    }
};

/**
 * @method invalidate
 *
 * Invalidate this brush, if its content was updated
 */
Brush.prototype.invalidate = function() {
    //this.type = C.BT_NONE;
    this._converted = false;
    this._style = null;
};

Brush.prototype.convertColorsToRgba = function() {
    if (this._converted) return;
    if (this.color && is.str(this.color)) {
        this.color = Color.fromStr(this.color);
    } else if (this.grad) {
        var stops = this.grad.stops;
        for (var i = 0, il = stops.length; i < il; i++) {
            if (is.str(stops[i][1])) {
                stops[i][1] = Color.from(stops[i][1]);
            }
        }
    }
    this._converted = true;
};

// create canvas-compatible style from brush
Brush.prototype.adapt = function(ctx) {
    if (this.color && is.str(this.color)) return this.color;
    if (this.color) return Color.toRgbaStr(this.color);
    if (this.grad) {
        var src = this.grad,
            stops = src.stops,
            dir = src.dir || [ [0.5, 0], [0.5, 1] ],
            r = src.r || [ 1.0, 1.0 ];
            bounds = src.bounds || [0, 0, 1, 1];
        var grad;
        var x0 = bounds ? (bounds[0] + dir[0][0] * bounds[2]) : dir[0][0], // b.x + x0 * b.width
            y0 = bounds ? (bounds[1] + dir[0][1] * bounds[3]) : dir[0][1], // b.y + y0 * b.height
            x1 = bounds ? (bounds[0] + dir[1][0] * bounds[2]) : dir[1][0], // b.x + x1 * b.width
            y1 = bounds ? (bounds[1] + dir[1][1] * bounds[3]) : dir[1][1]; // b.y + y1 * b.height
        if (is.defined(src.r)) {
            var r0 = bounds ? (Math.max(bounds[2], bounds[3]) * r[0]) : r[0], // max(b.width, b.height) * r0
                r1 = bounds ? (Math.max(bounds[2], bounds[3]) * r[0]) : r[1]; // max(b.width, b.height) * r1
            try {
                grad = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
            } catch(e) {
                log.error(e, 'Failed to create radial gradient', x0, y0, r0, x1, y1, r1);
                grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 0);
                return grad;
            }
        } else {
            try {
                grad = ctx.createLinearGradient(x0, y0, x1, y1);
            } catch(e) {
                log.error(e, 'Failed to create linear gradient', x0, y0, x1, y1);
                grad = ctx.createLinearGradient(0, 0, 0, 0);
                return grad;
            }
        }
        for (var i = 0, slen = stops.length; i < slen; i++) {
            var stop = stops[i];
            grad.addColorStop(stop[0], Color.adapt(stop[1]));
        }
        return grad;
    }
    if (this.pattern) {
        var elm = this.pattern.elm,
            fill;
        var canvas = engine.createCanvas(this.pattern.w, this.pattern.h, null, 1);
        var cctx = canvas.getContext('2d');
        elm.pivot(0,0);
        elm.disabled = false;
        //var prevPos = elm.getTime();
        elm.jumpToStart();
        elm.render(cctx, 0);
        //elm.jump(prevPos);
        elm.disabled = true;
        fill = canvas;

        return ctx.createPattern(fill, this.pattern.repeat);
    }
    return null;
};

/**
 * @method clone
 *
 * Clone this brush
 *
 * @return {anm.Brush} clone
 */
Brush.prototype.clone = function()  {
    var src = this,
        trg = new Brush();
    trg.type = src.type;
    if (src.color && is.str(src.color)) { trg.color = src.color; }
    else if (src.color) {
        trg.color = { r: src.color.r, g: src.color.g, b: src.color.b, a: src.color.a || 1 };
    }
    if (src.grad) {
        var src_grad = src.grad,
            trg_grad = {};
        trg_grad.stops = [];
        for (i = 0; i < src_grad.stops.length; i++) {
            trg_grad.stops[i] = [].concat(src_grad.stops[i]);
        }
        trg_grad.dir = [];
        for (i = 0; i < src_grad.dir.length; i++) {
            trg_grad.dir[i] = [].concat(src_grad.dir[i]);
        }
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
};

/**
 * @static @method fill
 *
 * Create a Fill-Brush
 *
 * See {@link anm.Element#fill Element.fill}
 *
 * Examples:
 *
 * * `var brush = Brush.fill('#ff0000')`
 * * `var brush = Brush.fill(Color.rgba(70, 12, 35, 0.5))`
 * * `var brush = Brush.fill(Color.hsl(0.6, 100, 15))`
 * * `var brush = Brush.fill(Brush.gradient().stops({0: '#ffffff', 0.5: '#cccccc'}))`
 *
 * @param {String|Object} color color or gradient
 * @return {anm.Brush}
 */
Brush.fill = function(value) {
    var brush = new Brush();
    brush.type = C.BT_FILL;
    if (is.obj(value)) {
        if (value instanceof Gradient) {
            brush.grad = value.get();
        } else if (value.stops) {
            brush.grad = value;
        } else if (value.elm) {
            brush.pattern = value;
        }
    } else {
        brush.color = value;
    }
    return brush;
};

/**
 * @static @method stroke
 *
 * Create a Stroke-Brush
 *
 * See {@link anm.Element#stroke Element.stroke}
 *
 * Examples:
 *
 * * `var brush = Brush.stroke('#ff0000', 2)`
 * * `var brush = Brush.stroke(Color.rgba(70, 12, 35, 0.5), 5, C.PC_ROUND)`
 * * `var brush = Brush.stroke(Color.hsl(0.6, 100, 15), 1)`
 * * `var brush = Brush.stroke(Brush.gradient().stops({0: '#ffffff', 0.5: '#cccccc'}), 2)`
 *
 * @param {String|Object} color color or gradient
 * @param {Number} width width, in pixels
 * @param {C.PC_*} [cap]
 * @param {C.PC_*} [join]
 * @param {C.PC_*} [mitter]
 *
 * @return {anm.Brush}
 */
Brush.stroke = function(color, width, cap, join, mitter) {
    var brush = (color && (color instanceof Brush)) ? color.clone() : Brush.fill(color);
    brush.type = C.BT_STROKE;
    brush.width = width || 0;
    brush.cap = cap || Brush.DEFAULT_CAP;
    brush.join = join || Brush.DEFAULT_JOIN;
    brush.mitter = mitter;
    return brush;
};

/**
 * @static @method shadow
 *
 * Create a Shadow-Brush
 *
 * See {@link anm.Element#shadow Element.shadow}
 *
 * Examples:
 *
 * * `var brush = Brush.shadow('#ff0000', 2)`
 * * `var brush = Brush.shadow(Color.rgba(70, 12, 35, 0.5), 5, 2, 2)`
 *
 * @param {String|Object} color color or gradient
 * @param {Number} [blurRadius] blur radius
 * @param {Number} [offsetX] offset by X axis
 * @param {Number} [offsetY] offset by Y axis
 *
 * @return {anm.Brush}
 */
Brush.shadow = function(color, blurRadius, offsetX, offsetY) {
    var brush = Brush.fill(color);
    brush.type = C.BT_SHADOW;
    brush.blurRadius = blurRadius || 0;
    brush.offsetX = offsetX || 0;
    brush.offsetY = offsetY || 0;
    return brush;
};

Brush.value = function(value, target) {
    var brush = target || (new Brush());
    if (!value) {
        brush.type = C.BT_NONE;
    } else if (is.str(value)) {
        brush.type = C.BT_FILL;
        brush.color = value;
    } else if (is.obj(value)) {
        value = (value instanceof Gradient) ? value.get() : value;
        if (is.defined(value.r) && is.defined(value.g) && is.defined(value.b)) {
            brush.type = C.BT_FILL;
            brush.color = value;
        } else if (value.color || value.grad) {
            if (is.defined(value.width)) {
                brush.type = C.BT_STROKE;
            } else if (is.defined(value.blurRadius) ||
                       is.defined(value.offsetX)) {
                brush.type = C.BT_SHADOW;
            } else {
                brush.type = C.BT_FILL;
            }
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    brush[key] = value[key];
                }
            }
        } else throw errors.element('Unknown type of brush');
    } else throw errors.element('Use Brush.fill, Brush.stroke or Brush.shadow to create brush from values');
};

Brush.gradient = function() {
    return new Gradient();
};

Brush.qfill = function(ctx, color) {
    ctx.fillStyle = color;
};

Brush.qstroke = function(ctx, color, width) {
    ctx.lineWidth = width || 1;
    ctx.strokeStyle = color;
    ctx.lineCap = Brush.DEFAULT_CAP;
    ctx.lineJoin = Brush.DEFAULT_JOIN;
};

Brush.clearFill = function(ctx) {
    ctx.fillStyle = Brush.DEFAULT_FILL;
};

Brush.clearStroke = function(ctx) {
    ctx.strokeStyle = Brush.DEFAULT_STROKE;
    ctx.lineWidth = 0;
    ctx.lineCap = Brush.DEFAULT_CAP;
    ctx.lineJoin = Brush.DEFAULT_JOIN;
};

Brush.clearShadow = function(ctx) {
    ctx.shadowColor = Brush.DEFAULT_SHADOW;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

/**
 * @static @method interpolateBrushes
 *
 * Create a function from two brushes which takes distance between these brushes
 * (as `0..1`) and returns the new brush representing the values at this point.
 * This method used for color tweens, but iterpolates every possible value
 * including stroke width.
 * NB: if you re-use the returned function, be aware that it shares and updates
 * the same instance between the calls.
 *
 * See {@link anm.Color#interpolate Color.interpolate}
 *
 * @param {anm.Brush} from initial state of interpolation
 * @param {anm.Brush} to final state of interpolation
 * @return {Function} function that takes t and returns interpolation result
 * @return {Number} return.t distance between initial and final state, as `0..1`
 * @return {anm.Brush} return.return a brush value as a result of interpolation
 */
Brush.interpolateBrushes = function(from, to) {
    var equal = is.equal(from, to);
    from = (from instanceof Brush) ? from : Brush.value(from);
    if (!from._converted) { from.convertColorsToRgba(); }
    if (equal) {
        //if the values are the same, we can just skip the interpolating
        //and return the first value
        return function() {
            return from;
        };
    }

    to   = (to   instanceof Brush) ? to   : Brush.value(to);
    if (!to._converted)   { to.convertColorsToRgba();   }
    var result = from.clone();
    return function(t) {
        if (is.defined(from.width) && is.defined(to.width)) { // from.type && to.type == C.BT_STROKE
            result.width = utils.interpolateFloat(from.width, to.width, t);
        }
        if (from.type === C.BT_SHADOW) {
            result.offsetX = utils.interpolateFloat(from.offsetX, to.offsetX, t);
            result.offsetY = utils.interpolateFloat(from.offsetY, to.offsetY, t);
            result.blurRadius = utils.interpolateFloat(from.blurRadius, to.blurRadius, t);
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
                trgg.dir[i][0] = utils.interpolateFloat(fromg.dir[i][0], tog.dir[i][0], t);
                trgg.dir[i][1] = utils.interpolateFloat(fromg.dir[i][1], tog.dir[i][1], t);
            }
            // stops
            if (!trgg.stops ||
                (trgg.stops.length !== fromg.stops.length)) trgg.stops = [];
            for (i = 0; i < fromg.stops.length; i++) {
                if (!trgg.stops[i]) trgg.stops[i] = [];
                trgg.stops[i][0] = utils.interpolateFloat(fromg.stops[i][0], tog.stops[i][0], t);
                trgg.stops[i][1] = Color.toRgbaStr(Color.interpolate(fromg.stops[i][1], tog.stops[i][1], t));
            }
            // radius
            if (fromg.r) {
                if (!trgg.r) trgg.r = [];
                trgg.r[0] = utils.interpolateFloat(fromg.r[0], tog.r[0], t);
                trgg.r[1] = utils.interpolateFloat(fromg.r[1], tog.r[1], t);
            } else { trgg.r = null; }
        }
        result.invalidate();
        return result;
    };
};

function Gradient() {
    this.$radial = false;
    this.$stops = {};
    this.$radius = null;
    this.$bounds = [ 0, 0, 1, 1 ];
    this.$direction = [ [ 0.5, 0 ], [ 0.5, 1 ] ];
};
Gradient.prototype.stops = function(hash) {
    if (!is.defined(hash)) {
        hash = {}; var stops = this.$stops;
        for (var i = 0; i < stops.length; i++) {
            hash[stops[i][0]] = stops[i][1];
        }
        return hash;
    } else {
        var list = [];
        for (var prop in hash) {
            list.push([parseFloat(prop), hash[prop]]);
        }
        this.$stops = list;
        return this;
    }
};
Gradient.prototype.radial = function() {
    this.$radial = true;
    return this;
};
Gradient.prototype.radius = function(value) {
    if (!is.defined(value)) return this.$radius;
    this.$radial = true; this.$radius = value;
    return this;
};
Gradient.prototype.start = function(left, top) {
    if (!is.defined(left)) return [ this.$bounds[0], this.$bounds[1] ];
    this.$bounds[0] = left; this.$bounds[1] = top;
    return this;
};
Gradient.prototype.size = function(width, height) {
    if (!is.defined(width)) return [ this.$bounds[2], this.$bounds[3] ];
    this.$bounds[2] = width; this.$bounds[3] = height;
    return this;
};
Gradient.prototype.from = function(x, y) {
    if (!is.defined(x)) return this.$direction[0];
    this.$direction[0][0] = x; this.$direction[0][1] = y;
    return this;
};
Gradient.prototype.to = function(x, y) {
    if (!is.defined(x)) return this.$direction[1];
    this.$direction[1][0] = x; this.$direction[1][1] = y;
    return this;
};
Gradient.prototype.get = function() {
    return {
        r: this.$radial ? (this.$radius || [ 1.0, 1.0 ]) : null,
        stops: this.$stops,
        bounds: this.$bounds,
        dir: this.$direction
    };
};

module.exports = Brush;
