var C = require('./constants.js');

var is = {};

is.defined = function(v) {
  return !((typeof v === 'undefined')
   || (typeof v === 'null')
   || (v === null)
   || (v === undefined));
};
is.finite = global.isFinite;
is.nan = global.isNaN;
is.arr = Array.isArray;
is.num = function(n) {
  n = global.parseFloat(n);
  return !is.nan(n) && is.finite(n);
};
is.fun = function(f) {
  return typeof f === 'function';
};
is.obj = function(o) {
  return typeof o === 'object';
};
is.str = function(s) {
  return typeof s === 'string';
};

is.modifier = function(f) {
  return f.hasOwnProperty(C.MARKERS.MODIFIER_MARKER);
};
is.painter = function(f) {
  return f.hasOwnProperty(C.MARKERS.PAINTER_MARKER);
};
is.tween = function(f) {
  return f.is_tween && is.modifier(f);
};


module.exports = is;
