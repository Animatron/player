var C = require('./constants.js'),
    is = require('./is.js'),
    Modifier = require('./modifier.js'),
    AnimationError = require('./errors.js').AnimationError;

// Tweens
// -----------------------------------------------------------------------------
function Tween(tween_type, data) {
    if (!tween_type) throw new Error('Tween type is required to be specified or function passed');
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
    mod.data = data_block_fn; // FIXME
    return mod;
}

var data_block_fn = function() {
   throw new AnimationError("Data should be passed to tween in a constructor");
};

// tween order
Tween.TWEENS_PRIORITY = {};
Tween.TWEENS_COUNT = 8;

var Tweens = {};

Tween.addTween = function(id, func) {
  Tweens[id] = func;
  Tween.TWEENS_PRIORITY[id] = Tween.TWEENS_COUNT++;
}

Tween.addTween(C.T_TRANSLATE, function(data) {
  return function(t, dt, duration) {
      var p = data.pointAt(t);
      if (!p) return;
      this.$mpath = data;
      this.x = p[0];
      this.y = p[1];
  };
});

Tween.addTween(C.T_SCALE, function(data) {
  return function(t, dt, duration) {
    this.sx = data[0][0] * (1.0 - t) + data[1][0] * t;
    this.sy = data[0][1] * (1.0 - t) + data[1][1] * t;
  };
});

Tween.addTween(C.T_ROTATE, function(data) {
  return function(t, dt, duration) {
    this.angle = data[0] * (1.0 - t) + data[1] * t;
    //state.angle = (Math.PI / 180) * 45;
  };
});

Tween.addTween(C.T_ROT_TO_PATH, function(data) {
  return function(t, dt, duration) {
    var path = this.$mpath;
    if (path) this.angle += path.tangentAt(t); // Math.atan2(this.y, this.x);
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
  }
});

Tween.addTween(C.T_STROKE, function(data) {
  var interp_func = Brush.interpolateBrushes(data[0], data[1]);
  return function (t, dt, duration) {
      this.$stroke = interp_func(t);
  }
});

module.exports = Tween;
