// Bands
// -----------------------------------------------------------------------------

var Bands = {};

// recalculate all global bands down to the very
// child, starting from given element
Bands.recalc = function(elm, in_band) {
    var in_band = in_band ||
                  ( elm.parent
                  ? elm.parent.gband
                  : [0, 0] );
    elm.gband = [ in_band[0] + elm.lband[0],
                  in_band[0] + elm.lband[1] ];
    elm.each(function(child) {
        Bands.recalc(child, elm.gband);
    });
}

// makes inner band coords relative to outer space
Bands.wrap = function(outer, inner) {
    if (!outer) return inner;
    return [ outer[0] + inner[0],
             ((outer[0] + inner[1]) <= outer[1])
              ? (outer[0] + inner[1])
              : outer[1]
            ];
}
// makes band maximum wide to fit both bands
Bands.expand = function(from, to) {
    if (!from) return to;
    return [ ((to[0] < from[0])
              ? to[0] : from[0]),
             ((to[1] > from[1])
              ? to[1] : from[1])
           ];
}
// finds minimum intersection of the bands
Bands.reduce = function(from, to) {
    if (!from) return to;
    return [ ((to[0] > from[0])
              ? to[0] : from[0]),
             ((to[1] < from[1])
              ? to[1] : from[1])
           ];
}

module.exports = Bands;
