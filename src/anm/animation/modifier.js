var C = require('../constants.js'),
    is = require('../utils.js').is,
    EasingImpl = require('./easing.js'),
    guid = require('../utils.js').guid;


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

/**
 * @class anm.Modifier
 *
 * Modifier is a function which changes element's state (position, rotation angle, opacity...) over time.
 * Tweens are actually implemented sub-cases of modifiers. Together, Modifiers and {@link anm.Painter Painters}
 * are supposed to be a pair of function types sufficient to draw any element in any place of a scene. So, any
 * Element may have any number of modifiers and/or painters which are executed in order on every frame.
 *
 * Examples:
 *
 * * `elm.modify(function(t) { this.x += 1 / t; })`
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; }))` — modifier with a band equal to element's band
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; })).band(0, 2))` — modifier with its own band, relative to element's band
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; })).easing(C.E_INOUT))` — modifier using pre-defined easing
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; })).easing(C.E_PATH, new anm.Path().move(10, 10).line(20, 20)))` — modifier using pre-defined path-based easing
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; })).easing(fuction(t) { return 1 - t; }))` — modifier with custom time-easing function
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; })).band(0, 2).easing(fuction(t) { return 1 - t; }))` — modifier with both band and easing specified
 * * `elm.modify(new Modifier(function(t) { this.x += 1 / t; })).time(5)` — modifier to be called at exact local element time (_"trigger-modifier"_)
 *
 * See also: {@link anm.Element#modify element.modify()} method, {@link anm.Tween Tween} class, {@link anm.Painter Painter} class.
 *
 * @constructor
 *
 * @param {Function} f function to use as a base of modifier
 * @param {Number} f.t element band-local time, in seconds, when this function was called
 * @param {Number} [f.dt] time passed after the previous render of the scene
 * @param {Number} [f.duration] duration of the modifier band, or, if it's a trigger-modifier, duration of the element band
 * @param {anm.Element} f.this element, owning the modifier
 *
 * @return {anm.Modifier} modifier instance
 */
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
    /**
     * @method band
     * @chainable
     *
     * Set or get a band for this modifier. By default, any modifier is executed
     * during the whole lifetime of the element. If you specify a band, modifier
     * will have its own lifetime inside element's band, so it will affect it only
     * during a special part of time. This band is defined in band-local time, relative
     * to element's band. This way tweens with their own bands are created.
     *
     * Opposite to {@link anm.Modifier#time time()} method.
     *
     * @param {Number} start start time, in seconds, relative to element's band
     * @param {Number} [stop] stopping time, in seconds, relative to element's band, or `Infinity` by default
     *
     * @return {anm.Modifier|[Number]} itself, or a band
     */
    func.band = function(start, stop) {
        if (!is.defined(start)) return this.$band;
        // FIXME: array bands should not pass
        if (is.arr(start)) {
            // NB: be aware, the order "stop, then start" is important here,
            //     because we modify start value intself in the second expression,
            //     so we should take stop value before.
            stop = start[1];
            start = start[0];
        }
        if (!is.defined(stop)) { stop = Infinity; }
        this.$band = [ start, stop ];
        return func;
    };
    /**
     * @method time
     * @chainable
     *
     * Set or get a time when this modifier should be called, just once. This type of modifiers
     * is called trigger-modifiers and is opposite to band-restricted modifiers. It is similar
     * to event handler, but an event here is a time.
     *
     * @param {Number} t time to trigger at, in seconds, relative to element's band
     *
     * @return {anm.Modifier|Number} itself, or a value of current time to trigger at
     */
    func.time = function(value) {
        if (!is.num(value)) return this.$time;
        this.$time = value;
        return this;
    };
    /**
     * @method easing
     * @chainable
     *
     * Set or get time-easing function for this modifier. There are several easings
     * functions accessible from the box.
     *
     * Easing function receives time to adapt, in a range of `0..1`, as a percentage progress inside a
     * modifier's own band, if it was specified, or an owner-element band, if modifier has no own band.
     *
     * Examples:
     *
     * * `.easing(C.E_INOUT)` — pre-defined easing, and there are a lot of possible ones: `E_IN`, `E_OUT`, `E_SIN` for SineIn, `E_QOUT` for Quad Out, `E_CRINOUT` for Circ InOut, `E_EIN` for Expo In, `B_OUT` for Back Out...
     * * `.easing(C.E_PATH, new anm.Path.move(10, 10).line(20, 20))` — pre-defined data-based easing, in this example it uses path as a base for easing (has more sense with curves, though, see {@link anm.Path Path} documentation)
     * * `.easing(function(t) { return 1 - t; })` — custom easing function
     *
     * @param {Function|anm.C.E_*} f a function which converts incoming time to the time that will be passed to modifier
     * @param {Number} f.t a time to adapt, `0..1` as a percentage progress inside a band (which one? see above;)
     * @param {Object} [data] if this easing is pre-defined and requires some data, this data may be passed here
     *
     * @return {anm.Modifier|Function} modifier itself, or current easing function
     */
    func.easing = function(f, data) {
        if (!f) return this.$easing;
        this.$easing = convertEasing(f, data, this.relative || this.is_tween);
        return this;
    };

    func.data = function(data) {
        if (!is.defined(data)) return this.$data;
        this.$data = data;
        return this;
    };
    return func;
}

var convertEasing = function(easing, data, relative) {
    if (!easing) return null;
    var f;
    if (is.str(easing)) {
        f = EasingImpl[easing](data);
        return relative ? f : function(t, len) { return f(t / len, len) * len; };
    }
    if (is.fun(easing) && !data) return easing;
    if (is.fun(easing) && data) return easing(data);
    if (easing.type) {
        f = EasingImpl[easing.type](easing.data || data);
        return relative ? f : function(t, len) { return f(t / len, len) * len; };
    }
    if (easing.f) return easing.f(easing.data || data);
};

module.exports = Modifier;
