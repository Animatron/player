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
 * Tween, under the hood, is a pre-defined {@link anm.Modifier Modifier}.
 * It changes element state (position. rotation, ...) over the time, but in
 * this case you may choose from a prepared recipe without writing a function on
 * your own.
 *
 * For example, scale Tween is a Modifier with this code:
 *
 * ```
 * var data = [ [ 0.5, 0.5 ], [ 1.0, 2.0 ] ];
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
Tween.DEFAULT_FROM = function(_from, prev) { return is.defined(prev) ? [ _from,   prev[1] ] : [ _from, null ]; };
Tween.DEFAULT_TO   = function(to,    prev) { return is.defined(to)   ? [ prev[0], to ]      : [  null,   to ]; };
function Tween(tween_type, data) {
    if (!tween_type) throw errors.element('Tween type is required to be specified or function passed');
    var me = this;
    // tween_f — tween function reacts on every data update and changes the modifier function
    // mod_f — modifier function which is called on every frame and time passed there
    // from_f — is an optional function which returns proper this.$data for a tween using new given start value and previous this.$data value
    // to_f — is an optional function which returns proper this.$data for a tween using new given end value and previous this.$data value
    // last two default to create an array like [ from, to ] in this.$data
    var tween_f, mod_f, from_f, to_f;
    // we update `modifier.$tween` function with the result of calling `tween_f(new_data)`, each time when tween data was changed using `from`/`to`/`values` methods
    var mod_f = function(t, dt, duration) { if (me.$tween) me.$tween.call(this, t, dt, duration); };
    if (is.fun(tween_type)) {
        tween_f = tween_type;
    } else {
        var tween_def = _Tweens[tween_type];
        tween_f = tween_def.func;
        mod_f.tween = tween_type;
        from_f = tween_def.from;
        to_f = tween_def.to;
    }
    mod_f.is_tween = true;
    var mod = Modifier(mod_f, C.MOD_TWEEN);
    mod_wrapper.v = mod;
    mod.$data = data;
    if (is.defined(data)) mod.$tween = tween_f(data);
    from_f = from_f || function(_from, prev) { return is.defined(prev) ? [ _from, prev[1] ] : [ _from, null ]; };
    to_f = to_f || function(to, prev) { return is.defined(prev) ? [ prev[0], to ] : [ null, to ]; };
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
    mod.values = function(_from, to) {
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
    mod.from = function(val) {
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
    mod.to   = function(val) {
                   this.$data = to_f(val, this.$data);
                   this.$tween = tween_f(this.$data);
                   return this;
               };
    // overrides modifier function
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
    mod.data = function(data) {
        if (!is.defined(data)) return this.$data;
        this.$data = data;
        this.$tween = tween_f(data);
        return this;
    };
    return mod;
}

Tween._$ = function(tween_type) { return new Tween(tween_type); }

// tween order
Tween.TWEENS_PRIORITY = {};
Tween.TWEENS_COUNT = 0;

var _Tweens = {};

Tween.addTween = function(tween_type, definition) {
    _Tweens[tween_type] = is.fun(definition) ? { func: definition } : definition;
    Tween[tween_type] = function(data) { return new Tween(tween_type, data); };
    Tween.TWEENS_PRIORITY[tween_type] = Tween.TWEENS_COUNT++;
};

function nop() {};

Tween.addTween(C.T_TRANSLATE, {
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

Tween.addTween(C.T_SCALE, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.sx = _from[0] * (1.0 - t) + to[0] * t;
        this.sy = _from[1] * (1.0 - t) + to[1] * t;
    }
});

Tween.addTween(C.T_ROTATE, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.angle = _from * (1.0 - t) + to * t;
    }
});

Tween.addTween(C.T_ROT_TO_PATH, {
    func: function() {
        return function(t) {
            var path = this.$mpath;
            if (path) this.angle = path.tangentAt(t);
        }
    },
    from: nop, to: nop
});

Tween.addTween(C.T_ALPHA, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.alpha = _from * (1.0 - t) + to * t;
    };
});

Tween.addTween(C.T_SHEAR, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        this.hx = _from[0] * (1.0 - t) + to[0] * t;
        this.hy = _from[1] * (1.0 - t) + to[1] * t;
    }
});

Tween.addTween(C.T_FILL, function(values) {
    var interp_func = Brush.interpolateBrushes(values[0], values[1]);
    return function(t) {
        this.$fill = interp_func(t);
    };
});

Tween.addTween(C.T_STROKE, function(values) {
    var interp_func = Brush.interpolateBrushes(values[0], values[1]);
    return function(t) {
        this.$stroke = interp_func(t);
    };
});

Tween.addTween(C.T_SHADOW, function(values) {
    var interp_func = Brush.interpolateBrushes(values[0], values[1]);
    return function(t) {
        this.$shadow = interp_func(t);
    };
});

Tween.addTween(C.T_VOLUME, function(values) {
    var _from = values[0],
        to = values[1];
    return function(t) {
        if (!this.$audio.ready) return;
        var volume = _from * (1.0 - t) + to * t;
        this.$audio.setVolume(volume);
    };
});


module.exports = Tween;
