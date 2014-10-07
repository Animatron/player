var C = require('./constants.js'),
    guid = require('./utils.js').guid;
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

// Painter % (func: Function(ctx, data[ctx, t, dt])[, type: C.PNT_*])
function Painter(func, type) {
    func.id = guid();
    func.type = type || C.PNT_USER;
    func[C.MARKERS.PAINTER_MARKER] = true;
    return func;
}


module.exports = Painter;
