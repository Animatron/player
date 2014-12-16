var C = require('../constants.js'),
    guid = require('../utils.js').guid;
// FIXME: order should not be important, system should add painters in proper order
//        by itself.

Painter.ORDER = [ C.PNT_SYSTEM, C.PNT_USER, C.PNT_DEBUG ];
// these two simplify checking in __mafter/__mbefore
Painter.FIRST_PNT = C.PNT_SYSTEM;
Painter.LAST_PNT = C.PNT_DEBUG;
// painters groups
Painter.ALL_PAINTERS = [ C.PNT_SYSTEM, C.PNT_USER, C.PNT_DEBUG ];
Painter.NODBG_PAINTERS = [ C.PNT_SYSTEM, C.PNT_USER ];

// See description above for Modifier constructor for details, same technique

/**
 * @class anm.Painter
 *
 * Painter is a function which draws element over time in given context.
 * Together, {@link anm.Modifier Modifiers} and Painters are supposed to be a pair
 * of function types sufficient to draw any element in any place of a scene.
 * So, any {@link anm.Element Element} may have any number of modifiers and/or
 * painters which are executed in order on every frame.
 *
 * Examples:
 *
 * * `elm.paint(function(ctx) { ctx.fillStyle = '#f00'; ctx.fillRect(0, 0, 20, 20) })`
 * * `elm.paint(function(ctx, t) { ctx.fillStyle = Color.rgb(255 * t, 0, 0); ctx.fillRect(0, 0, 20, 20) })`
 * * `elm.paint(new Painter(function(ctx) { ctx.fillStyle = '#f00'; ctx.fillRect(0, 0, 20, 20) }))`
 * * `elm.paint(new Painter(function(ctx, t) { ctx.fillStyle = Color.rgb(255 * t, 0, 0); ctx.fillRect(0, 0, 20, 20) }))
 *
 * See also: {@link anm.Element#paint element.paint()} method, {@link anm.Modifier Modifier} class.
 *
 * @constructor
 *
 * @param {Function} f function to use as a base of painter
 * @param {Context2D} f.ctx context to draw on
 * @param {Number} [f.t] element band-local time, in seconds, when this function was called
 * @param {Number} [f.dt] time passed after the previous render of the scene
 * @param {Number} [f.duration] duration of the the element band
 * @param {anm.Element} f.this element, owning the painter
 *
 * @return {anm.Painter} painter instance
 */
function Painter(func, type) {
    func.id = guid();
    func.type = type || C.PNT_USER;
    func[C.MARKERS.PAINTER_MARKER] = true;
    return func;
}


module.exports = Painter;
