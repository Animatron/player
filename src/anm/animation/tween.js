var C = require('../constants.js');

var Modifier = require('./modifier.js');
var Brush = require('../graphics/brush.js');
var Path = require('../graphics/path.js');

var utils = require('../utils.js');
var is = utils.is;

var errors = require('../errors.js');

/**
 * @class anm.Tween
 * @extends anm.Modifier
 *
 * Tween, under the hood, is an alias to {@link anm.Modifier Modifier} and extends it
 * with several special methods.
 *
 * Tween is a function that changes element state (position. rotation, ...) over the time,
 * but what is different to Modifier is that in this case you may choose from a prepared
 * recipe without a need in writing a function on your own. Commonly tween is an interpolation
 * between two values by time, but this rule may have exceptions.
 *
 * For example, Scale Tween is a Modifier with a code like this:
 *
 * ```
 * var data = [ [ 0.5, 0.5 ],   // horizontal and vertical proportions to start from
 *              [ 1.0, 2.0 ] ]; // horizontal and vertical proportions to end with
 * function(t) {
 *     this.sx = data[0][0] * (1.0 - t) + data[1][0] * t;
 *     this.sy = data[0][1] * (1.0 - t) + data[1][1] * t;
 * };
 * ```
 *
 * To add a tween to some element, you just need to know its type and provide
 * both start-value and end-value, so it will automatically interpolate one to
 * another. Some tweens do not require these values or require only one value.
 *
 * You can not create a Tween with a constructor, though, you either should choose
 * from the predefined ones or to register a new Tween type with {@link anm.Tween#static-method-register register}
 * method.
 *
 * Tweens ready to use:
 *
 * * `'translate'` — value is a path to follow;
 * * `'scale'` — values are start scale (one value or two values if horz/vert differ) and end scale (the same);
 * * `'rotate'` — values are start angle and end angle;
 * * `'rotatetopath'` — orient to path used in `'translate'`, no special value;
 * * `'alpha'` — values are start and end opacity;
 * * `'shear'` — values are start shear (one value or two values if horz/vert differ) and end shear (the same);
 * * `'fill'` — values are start color or {@link anm.Brush Brush} instance and end color or Brush;
 * * `'stroke'` — values are start color or {@link anm.Brush Brush} instance and end color or Brush;
 * * `'shadow'` — values are start color or {@link anm.Brush Brush} instance and end color or Brush;
 * * `'volume'` — values are start volume and end volume;
 * * `'display'` — value is a boolean if element should be visible or not;
 *
 * Also see {@link anm.Element#translate translate(from, to)}, {@link anm.Element#scale scale(from, to)},
 * {@link anm.Element#rotate rotate(from, to)}, {@link anm.Element#scale scale(from, to)}, {@link anm.Element#skew skew(from, to)},
 * {@link anm.Element#alpha alpha(from, to)}, {@link anm.Element#color color}
 *
 * Examples:
 *
 * * `// elm.rotate(0, Math.PI): Not yet implemented, should take the whole element band`
 * * `elm.modify(Tween._$(rotate', [0, Math.PI]))`
 * * `elm.modify(Tween._$('rotate').from(0).to(Math.PI / 2))`
 * * `elm.modify(Tween.rotate().values(0, Math.PI / 2))`*
 * * `elm.modify(Tween.rotate().from(0).to(Math.PI / 2))`
 * * `elm.modify(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2)`
 * * `elm.modify(Tween.rotate().from(0).to(Math.PI / 2).start(0).stop(2)`
 * * `elm.modify(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2).easing(function(t) { return 1 - t; }))`
 * * `elm.modify(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2).easing('in'))`
 * * `elm.modify(Tween.translate().from(0, 0).to(100, 100))`
 * * `elm.modify(Tween.translate().value('M0 0 100 100'))`
 * * `elm.modify(Tween.translate().value(new Path().move(0, 0).line(100, 100)))`
 * * `elm.modify(Tween.rotatetopath())`
 * * `elm.modify(Tween['rotatetopath']())`
 */
var Tween = Modifier;

function createTween(type, value) {
    var mod = new Modifier(null, C.MOD_TWEEN); // mod.func will be set to `null` first
    var def = Registry[type];
    mod.def = def;
    mod.func = function(t, dt, duration) { if (mod.$tween) mod.$tween.call(this, t, dt, duration); };
    mod.is_tween = true;
    mod.tween_type = type;
    if (is.defined(value)) {
        mod.value(value);
    } else if ((def.from === nop) && (def.to === nop)) {
        mod.$tween = def.func();
    }
    return mod;
}

// tween type priority depends on the order the types were registered

var Registry = {};

Tween.DEFAULT_FROM = function(_from, prev) { return is.defined(prev) ? [ _from,   prev[1] ] : [ _from, null ]; };
Tween.DEFAULT_TO   = function(to,    prev) { return is.defined(to)   ? [ prev[0], to ]      : [  null,   to ]; };

Tween.register = function(type, definition) {
    definition = is.fun(definition) ? { func: definition } : definition;
    definition.from = definition.from || Tween.DEFAULT_FROM;
    definition.to   = definition.to   || Tween.DEFAULT_TO;
    Registry[type] = definition;
    Tween[type] = function(value) { return createTween(type, value); };
}

Tween._$ = createTween;

/**
 * @method values
 * @chainable
 *
 * Set or get values for this tween. Useful only if tween uses two values to operate, one to start from,
 * and one to end with, i.e. rotate tween or scale tween. To set a single value for a tween (say, path
 * for translate tween), use {@link anm.Tween#value value} method. To set values separately, use
 * {@link anm.Tween#from from} and {@link anm.Tween#to to} methods.
 *
 * See also: {@link anm.Tween#from from}, {@link anm.Tween#to to}, {@link anm.Tween#value value}.
 *
 * @param {Any} from start value
 * @param {Any} to end value
 *
 * @return {anm.Tween|Any} itself, or current values if no arguments were passed
 */
Tween.prototype.values = function(_from, to) {
    if (!is.defined(_from) && this.$value) return this.$value;
    this.$value = this.def.to(to, this.def.from(_from, null));
    this.$tween = this.def.func(this.$value);
    return this;
};

/**
 * @method value
 * @chainable
 *
 * Set or get value for this tween. Useful only if tween uses one value to operate, like path for
 * translate tween. To set both starting and final value for a tween (say, for rotate tween),
 * use {@link anm.Tween#values values} method. To set values separately, use {@link anm.Tween#from from}
 * and {@link anm.Tween#to to} methods.
 *
 * See also: {@link anm.Tween#from from}, {@link anm.Tween#to to}, {@link anm.Tween#values values}.
 *
 * @param {Any} value a new value to set
 *
 * @return {anm.Tween|Any} itself, or current value if no arguments were passed
 */
Tween.prototype.value = function(val) {
    if (!is.defined(val) && this.$value) return this.$value;
    this.$value = val;
    this.$tween = this.def.func(this.$value);
    return this;
};

/**
 * @method from
 * @chainable
 *
 * Set value to start from for this tween. Useful only if tween uses two values to operate, one to start from,
 * and one to end with, i.e. rotate tween or scale tween. To set a single value for a tween (say, path
 * for translate tween), use {@link anm.Modifier#data data(value)} method. To set end value, use
 * {@link anm.Tween#to to} method. To set them both at one time, use {@link anm.Tween#values values(from, to)}.
 *
 * See also: {@link anm.Tween#to to}, {@link anm.Tween#values values}, {@link anm.Tween#value value}.
 *
 * @param {Any} from start value to set
 *
 * @return {anm.Tween} itself
 */
 Tween.prototype.from = function(val, val2) {
    this.$value = this.def.from(!is.defined(val2) ? val : [ val, val2 ], this.$value);
    this.$tween = this.def.func(this.$value);
    return this;
};

/**
 * @method to
 * @chainable
 *
 * Set value to end with for this tween. Useful only if tween uses two values to operate, one to start from,
 * and one to end with, i.e. rotate tween or scale tween. To set a single value for a tween (say, path
 * for translate tween), use {@link anm.Modifier#data data(value)} method. To set start value, use
 * {@link anm.Tween#from from} method. To set them both at one time, use {@link anm.Tween#values values(from, to)}.
 *
 * See also: {@link anm.Tween#from from}, {@link anm.Tween#values values}, {@link anm.Tween#value value}.
 *
 * @param {Any} to end value to set
 *
 * @return {anm.Tween} itself
 */
Tween.prototype.to = function(val, val2) {
    this.$value = this.def.to(!is.defined(val2) ? val : [ val, val2 ], this.$value);
    this.$tween = this.def.func(this.$value);
    return this;
};

// NB: By default, if only the function is passed to the registration method, tween
//     is considered being two-values tween (like Alpha, Rotate or Fill tweens).
//     If your `value` constructed differently than just using two values (like path
//     for Translate tween), you need to define your own `from` / `to` implementations.
//     If your tween needs no values at all to operate, set both `from` and `to` methods to `nop`.
//
// It is done to let user call either `tween.from(val)` or `tween.to(val)` without its pair,
// and also `values` should work same way.
//
// A subject to refactor, though.

function nop() {};

Tween.register(C.T_TRANSLATE, {
    func: function(path) {
        return function(t) {
            var p = path.pointAt(t);
            if (!p) return;
            this.x = p[0];
            this.y = p[1];
            // we should null the moving path, if it was empty
            this.$mpath = (path.length() > 0) ? path : null;
        }
    },
    from: function(_from, path) {
        return path ? path.line(_from[0], _from[1]) : new Path().move(_from[0], _from[1]) },
    to: function(to, path) {
        return path ? path.line(to[0], to[1]) : new Path().move(to[0], to[1]) }
});

Tween.register(C.T_SCALE, {
    func: function(values) {
        var _from = values[0],
            to = values[1];
        return function(t) {
            this.sx = _from[0] * (1.0 - t) + to[0] * t;
            this.sy = _from[1] * (1.0 - t) + to[1] * t;
        }
    },
    from: function(_from, both) {
        _from = (_from.length) ? _from : [ _from, _from ];
        return both ? [ _from, both[1] ] : [ _from, [ 1, 1 ] ];
    },
    to: function(to, both) {
        to = (to.length) ? to : [ to, to ];
        return both ? [ both[0], to ] : [ [ 1, 1 ], to ];
    }
});

Tween.register(C.T_ROTATE, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.angle = _from * (1.0 - t) + to * t;
    }
});

Tween.register(C.T_ROT_TO_PATH, {
    func: function() {
        return function(t) {
            var path = this.$mpath;
            // when t equals exact 0, it is replaced with 0.001
            // or else returned angle would be 0
            if (path) this.angle = path.tangentAt(t || 0.001);
        }
    },
    from: nop, to: nop
});

Tween.register(C.T_ALPHA, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.alpha = _from * (1.0 - t) + to * t;
    };
});

Tween.register(C.T_SHEAR, {
    func: function(values) {
        var _from = values[0],
            to = values[1];
        return function(t) {
            this.hx = _from[0] * (1.0 - t) + to[0] * t;
            this.hy = _from[1] * (1.0 - t) + to[1] * t;
        }
    },
    from: function(_from, both) {
        _from = (_from.length) ? _from : [ _from, _from ];
        return both ? [ _from, both[1] ] : [ _from, [ 1, 1 ] ];
    },
    to: function(to, both) {
        to = (to.length) ? to : [ to, to ];
        return both ? [ both[0], to ] : [ [ 1, 1 ], to ];
    }
});

Tween.register(C.T_FILL, function(values) {
    var interp_func = Brush.interpolateBrushes(values[0], values[1]);
    return function(t) {
        this.$fill = interp_func(t);
    };
});

Tween.register(C.T_STROKE, function(values) {
    var interp_func = Brush.interpolateBrushes(values[0], values[1]);
    return function(t) {
        this.$stroke = interp_func(t);
    };
});

Tween.register(C.T_SHADOW, function(values) {
    var interp_func = Brush.interpolateBrushes(values[0], values[1]);
    return function(t) {
        this.$shadow = interp_func(t);
    };
});

Tween.register(C.T_VOLUME, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        if (!this.$audio.ready) return;
        var volume = _from * (1.0 - t) + to * t;
        this.$audio.setVolume(volume);
    };
});

Tween.register(C.T_DISPLAY, {
    func: function(value) {
        return function(t) { this.visible = value; }
    },
    from: function(_from, prev) { return _from; },
    to: function(to, prev) { return to; }
});

Tween.register(C.T_SWITCH, {
    func: function(value) {
        return function(t) { this.switch = value; }
    },
    from: nop, to: nop
});


module.exports = Tween;
