var Color = require('./color.js'),
    C = require('../constants.js'),
    conf = require('../conf.js'),
    is = require('../utils.js').is,
    engine = require('engine'),
    AnimationError = require('../errors.js').AnimationError;

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

/**
 * @class anm.graphics.Brush
 */
function Brush() {
    this.type = C.BT_NONE;
}
Brush.DEFAULT_CAP = C.PC_ROUND;
Brush.DEFAULT_JOIN = C.PC_ROUND;
Brush.DEFAULT_FILL = '#ffbc05';
Brush.DEFAULT_STROKE = Color.TRANSPARENT;
Brush.DEFAULT_SHADOW = Color.TRANSPARENT;

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
        var ratio = engine.PX_RATIO;
        ctx.shadowColor = style;
        ctx.shadowBlur = (this.blurRadius * ratio) || 0;
        ctx.shadowOffsetX = (this.offsetX * ratio) || 0;
        ctx.shadowOffsetY = (this.offsetY * ratio) || 0;
    }
}
Brush.prototype.invalidate = function() {
    //this.type = C.BT_NONE;
    this._converted = false;
    this._style = null;
}
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
}
// create canvas-compatible style from brush
Brush.prototype.adapt = function(ctx) {
    if (this.color && is.str(this.color)) return this.color;
    if (this.color) return Color.toRgbaStr(this.color);
    if (this.grad) {
        var src = this.grad,
            stops = src.stops,
            dir = src.dir || [ [0.5, 0], [0.5, 1] ],
            r = src.r || 1.0;
            bounds = src.bounds || [0, 0, 100, 100];
        var grad;
        if (is.defined(src.r)) {
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
    if (src.color && is.str(src.color)) { trg.color = src.color; }
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
    if (is.obj(value) && value.stops) {
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
    } else if (is.str(value)) {
        brush.type = C.BT_FILL;
        brush.color = value;
    } else if (is.obj(value)) {
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
        } else throw new AnimationError('Unknown type of brush');
    } else throw new AnimationError('Use Brush.fill, Brush.stroke or Brush.shadow to create brush from values');
}
Brush.grad = function(stops, bounds, dir) {
    var new_stops = [];
    for (var prop in stops) {
        new_stops.push([prop, stops[prop]]);
    }
    return { grad: {
        stops: stops,
        bounds: bounds,
        dir: dir
    } };
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

Brush.interpolateBrushes = function(from, to) {
    var from = (from instanceof Brush) ? from : Brush.value(from),
        to   = (to   instanceof Brush) ? to   : Brush.value(to);
    if (!from._converted) { from.convertColorsToRgba(); }
    if (!to._converted)   { to.convertColorsToRgba();   }
    var result = from.clone();
    return function(t) {
        if (is.defined(from.width) && is.defined(to.width)) { // from.type && to.type == C.BT_STROKE
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

module.exports = Brush;
