var C = require('./constants.js'),
    is = require('./utils.js').is,
    EasingImpl = require('./easings.js'),
    guid = require('./utils.js').guid;


Modifier.ORDER = [ C.MOD_SYSTEM, C.MOD_TWEEN, C.MOD_USER, C.MOD_EVENT ];
// these two simplify checking in __mafter/__mbefore
Modifier.FIRST_MOD = C.MOD_SYSTEM;
Modifier.LAST_MOD = C.MOD_EVENT;
// modifiers groups
Modifier.ALL_MODIFIERS = [ C.MOD_SYSTEM, C.MOD_TWEEN, C.MOD_USER, C.MOD_EVENT ];
Modifier.NOEVT_MODIFIERS = [ C.MOD_SYSTEM, C.MOD_TWEEN, C.MOD_USER ];

// It's not a common constructor below, but the function (though still pretending to
// be a constructor), which adds custom properties to a given Function instance
// (and it is almost ok, since no `Function.prototype` is harmed this way, but only an instance).
// For user it looks and acts as a common constructor, the difference is just in internals.
// This allows us to store modifiers as plain functions and give user ability to add them
// by just pushing into array.

// FIXME: `t` should be a property of an element, even `dt` also may appear like so,
//        duration is accessible through this.duration() inside the modifier

// Modifier % (func: Function(t, dt, elm_duration)[, type: C.MOD_*])
function Modifier(func, type) {
    func.id = guid();
    func.type = type || C.MOD_USER;
    func.$data = null;
    func.$band = func.$band || null; // either band or time is specified
    func.$time = is.defined(func.$time) ? func.$time : null; // either band or time is specified
    func.$easing = func.$easing || null;
    func.relative = is.defined(func.relative) ? func.relative : false; // is time or band are specified relatively to element
    func.is_tween = (func.is_tween || (func.type == C.MOD_TWEEN) || false); // should modifier receive relative time or not (like tweens)
    // TODO: may these properties interfere with something? they are assigned to function instances
    func[C.MARKERS.MODIFIER_MARKER] = true;
    func.band = function(start, stop) { if (!is.defined(start)) return func.$band;
                                        // FIXME: array bands should not pass
                                        if (is.arr(start)) {
                                            stop = start[1];
                                            start = start[0];
                                        }
                                        if (!is.defined(stop)) { stop = Infinity; }
                                        func.$band = [ start, stop ];
                                        return func; }
    func.time = function(value) { if (!is.defined(value)) return func.$time;
                                  func.$time = value;
                                  return func; }
    func.easing = function(f, data) { if (!f) return func.$easing;
                                      func.$easing = convertEasing(f, data,
                                                     func.relative || func.is_tween);
                                      return func; }
    func.data = function(data) { if (!is.defined(data)) return func.$data;
                                 func.$data = data;
                                 return func; }
    return func;
}

var convertEasing = function(easing, data, relative) {
    if (!easing) return null;
    if (is.str(easing)) {
        var f = EasingImpl[easing](data);
        return relative ? f : function(t, len) { return f(t / len, len) * len; }
    }
    if (is.fun(easing) && !data) return easing;
    if (is.fun(easing) && data) return easing(data);
    if (easing.type) {
        var f = EasingImpl[easing.type](easing.data || data);
        return relative ? f : function(t, len) { return f(t / len, len) * len; }
    }
    if (easing.f) return easing.f(easing.data || data);
}

module.exports = Modifier;
