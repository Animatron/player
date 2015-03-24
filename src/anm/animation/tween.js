var C = require('../constants.js');
var is = require('../utils.js').is;

var Modifier = require('./modifier.js');
var Brush = require('../graphics/brush.js');

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
 * another.
 *
 * Also see {@link anm.Element#translate translate()}, {@link anm.Element#scale scale()},
 * {@link anm.Element#rotate rotate()}, {@link anm.Element#scale scale()}, {@link anm.Element#skew skew()},
 * {@link anm.Element#alpha alpha()}, {@link anm.Element#color color()}
 *
 * Examples:
 *
 * TODO: examples with strings instead of constants
 *
 * * `elm.tween(new Tween(C.T_ROTATE, [0, Math.PI / 2]))`
 * * `elm.tween(new Tween(C.T_ROTATE, [0, Math.PI / 2]).band(0, 2))`
 * * `elm.tween(new Tween(C.T_ROTATE, [0, Math.PI / 2]).band(0, 2).easing(function(t) { return 1 - t; }))`
 * * `elm.tween(new Tween(C.T_ROTATE, [0, Math.PI / 2]).band(0, 2).easing(anm.C.E_IN))`
 */
function Tween(tween_type, data) {
    if (!tween_type) throw errors.element('Tween type is required to be specified or function passed');
    var func;
    if (is.fun(tween_type)) {
        func = tween_type;
    } else {
        func = Tweens[tween_type](data);
        func.tween = tween_type;
    }
    func.is_tween = true;
    var mod = Modifier(func, C.MOD_TWEEN);
    mod.$data = data;
    // FIXME: value should be an array i.e. for scale tween, use object like { sx: <num>, sy: <num> } instead
    mod.from = function(val) {
                   if (!is.defined(val) && this.$data) return this.$data[0];
                   if (!this.$data) this.$data = [];
                   this.$data[0] = val;
                   return this;
               };
    mod.to   = function(val) {
                   if (!is.defined(val) && this.$data) return this.$data[1];
                   if (!this.$data) this.$data = [];
                   this.$data[1] = val;
                   return this;
               };
    mod.data = data_block_fn; // FIXME
    return mod;
}

var data_block_fn = function() {
    throw errors.element("Data should be passed to tween in a constructor or using from()/to() methods");
};

// TODO: add function to add every tween type in easy way, may be separate module?
// .tween(new anm.Tween(C.T_TRANSLATE, [[0, 0], [100, 100]]).band(0, Infinity)) does not work

// tween order
Tween.TWEENS_PRIORITY = {};
Tween.TWEENS_COUNT = 0;

var Tweens = {};

Tween.addTween = function(id, func) {
    Tweens[id] = func;
    Tween.TWEENS_PRIORITY[id] = Tween.TWEENS_COUNT++;
};

Tween.addTween(C.T_TRANSLATE, function(data) {
    return function(t, dt, duration) {
        var p = data.pointAt(t);
        if (!p) return;
        this.x = p[0];
        this.y = p[1];
        // we should null the moving path, if it was empty
        this.$mpath = (data.length() > 0) ? data : null;
    };
});

// TODO: add translate by points tween
/* Tween.addTween(C.T_TRANSLATE, function(data) {
    return function(t, dt, duration) {
        var p = data.pointAt(t);
        if (!p) return;
        this.$mpath = data;
        this.x = p[0];
        this.y = p[1];
    };
}); */

// FIXME: data should be an object instead of array
Tween.addTween(C.T_SCALE, function(data) {
    return function(t, dt, duration) {
      this.sx = data[0][0] * (1.0 - t) + data[1][0] * t;
      this.sy = data[0][1] * (1.0 - t) + data[1][1] * t;
    };
});

Tween.addTween(C.T_ROTATE, function(data) {
    return function(t, dt, duration) {
        this.angle = data[0] * (1.0 - t) + data[1] * t;
    };
});

Tween.addTween(C.T_ROT_TO_PATH, function(data) {
    return function(t, dt, duration) {
        var path = this.$mpath;
        if (path) this.angle = path.tangentAt(t);
    };
});

Tween.addTween(C.T_ALPHA, function(data) {
    return function(t, dt, duration) {
        this.alpha = data[0] * (1.0 - t) + data[1] * t;
    };
});

Tween.addTween(C.T_SHEAR, function(data) {
    return function(t, dt, duration) {
        this.hx = data[0][0] * (1.0 - t) + data[1][0] * t;
        this.hy = data[0][1] * (1.0 - t) + data[1][1] * t;
    };
});

Tween.addTween(C.T_FILL, function(data) {
    var interp_func = Brush.interpolateBrushes(data[0], data[1]);
    return function(t, dt, duration) {
        this.$fill = interp_func(t);
    };
});

Tween.addTween(C.T_STROKE, function(data) {
    var interp_func = Brush.interpolateBrushes(data[0], data[1]);
    return function (t, dt, duration) {
        this.$stroke = interp_func(t);
    };
});

Tween.addTween(C.T_SHADOW, function(data) {
    var interp_func = Brush.interpolateBrushes(data[0], data[1]);
    return function (t, dt, duration) {
        this.$shadow = interp_func(t);
    };
});

Tween.addTween(C.T_VOLUME, function(data){
    return function(t) {
        if (!this.$audio.ready) return;
        var volume = data[0] * (1.0 - t) + data[1] * t;
        this.$audio.setVolume(volume);
    };
});


module.exports = Tween;
