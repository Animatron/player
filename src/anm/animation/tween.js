var C = require('../constants.js');
var is = require('../utils.js').is;

var Modifier = require('./modifier.js');
var Brush = require('../graphics/brush.js');
var Path = require('../graphics/path.js');

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
 * from the predefined ones or to register a new Tween type with {@link anm.Tween#register register()}
 * method.
 *
 * TODO the list of the tweens
 *
 * Also see {@link anm.Element#translate translate(from, to)}, {@link anm.Element#scale scale(from, to)},
 * {@link anm.Element#rotate rotate(from, to)}, {@link anm.Element#scale scale(from, to)}, {@link anm.Element#skew skew(from, to)},
 * {@link anm.Element#alpha alpha(from, to)}, {@link anm.Element#color color()}
 *
 * Examples:
 *
 * * `// elm.rotate(0, Math.PI): Not yet implemented, should take the whole element band`
 * * `elm.tween(new Tween('rotate', [0, Math.PI]))`
 * * `elm.tween(new Tween('rotate').from(0).to(Math.PI / 2))`
 * * `elm.tween(Tween.rotate().values(0, Math.PI / 2))`*
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2))`
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2)`
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2).start(0).stop(2)`
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2).easing(function(t) { return 1 - t; }))`
 * * `elm.tween(Tween.rotate().from(0).to(Math.PI / 2).band(0, 2).easing('in'))`
 * * `elm.tween(Tween.translate().from(0, 0).to(100, 100))`
 * * `elm.tween(Tween.translate().data('M0 0 100 100'))`
 * * `elm.tween(Tween.rotatetopath())`
 */
var Tween = Modifier;

function createTween(type, data) {
    var mod = new Modifier(null, C.MOD_TWEEN); // mod.func will be set to `null` first
    var def = Registry[type];
    mod.t_func = def.func; // == function(data) { return function(t) { ... data ... }; }
    mod.func = function(t, dt, duration) { if (mod.$tween) mod.$tween.call(this, t, dt, duration); };
    mod.is_tween = true;
    mod.$data = data;
    if (is.defined(data)) mod.$tween = def.func(data);
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
    Tween[type] = function(data) { return createTween(type, data); };
}

Tween._$ = createTween;

/**
 * @method values
 * @chainable
 *
 * Set or get values for this tween. Useful only if tween uses two values to operate, one to start from,
 * and one to end with, i.e. rotate tween or scale tween. To set a single value for a tween (say, path
 * for translate tween), use {@link anm.Modifier#data data(value)} method. To set values separately, use
 * {@link anm.Tween#from from()} and {@link anm.Tween#to to()} methods.
 *
 * See also: {@link anm.Tween#from from()}, {@link anm.Tween#to to()}, {@link anm.Tween#data data()}.
 *
 * @param {Any} from start value
 * @param {Any} to end value
 *
 * @return {anm.Tween|Any} itself, or current values if no arguments were passed
 */
Tween.prototype.values = function(_from, to) {
    if (!is.defined(_from) && this.$data) return this.$data;
    this.$data = to_f(to, from_f(_from, null));
    this.$tween = tween_f(this.$data);
    return this;
};

/**
 * @method from
 * @chainable
 *
 * Set value to start from for this tween. Useful only if tween uses two values to operate, one to start from,
 * and one to end with, i.e. rotate tween or scale tween. To set a single value for a tween (say, path
 * for translate tween), use {@link anm.Modifier#data data(value)} method. To set end value, use
 * {@link anm.Tween#to to()} method. To set them both at one time, use {@link anm.Tween#values values(from, to)}.
 *
 * See also: {@link anm.Tween#to to()}, {@link anm.Tween#values values()}, {@link anm.Tween#data data()}.
 *
 * @param {Any} from start value
 *
 * @return {anm.Tween} itself
 */
 Tween.prototype = function(val) {
    this.$data = from_f(val, this.$data);
    this.$tween = tween_f(this.$data);
    return this;
};

/**
 * @method to
 * @chainable
 *
 * Set value to end with for this tween. Useful only if tween uses two values to operate, one to start from,
 * and one to end with, i.e. rotate tween or scale tween. To set a single value for a tween (say, path
 * for translate tween), use {@link anm.Modifier#data data(value)} method. To set start value, use
 * {@link anm.Tween#from from()} method. To set them both at one time, use {@link anm.Tween#values values(from, to)}.
 *
 * See also: {@link anm.Tween#from from()}, {@link anm.Tween#values values()}, {@link anm.Tween#data data()}.
 *
 * @param {Any} to end value
 *
 * @return {anm.Tween} itself
 */
Tween.prototype.to   = function(val) {
    this.$data = to_f(val, this.$data);
    this.$tween = tween_f(this.$data);
    return this;
};

/**
 * @method data
 * @chainable
 *
 * Set or get data for this tween, i.e. path for a translate tween.
 *
 * @param {Any} data data
 *
 * @return {anm.Tween|Any} itself, or current data value
 */
Tween.prototype.data = function(data) {
    // overrides modifier function
    if (!is.defined(data)) return this.$data;
    this.$data = data;
    this.$tween = tween_f(data);
    return this;
};

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

Tween.register(C.T_SCALE, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.sx = _from[0] * (1.0 - t) + to[0] * t;
        this.sy = _from[1] * (1.0 - t) + to[1] * t;
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
            if (path) this.angle = path.tangentAt(t);
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

Tween.register(C.T_SHEAR, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.hx = _from[0] * (1.0 - t) + to[0] * t;
        this.hy = _from[1] * (1.0 - t) + to[1] * t;
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


module.exports = Tween;
