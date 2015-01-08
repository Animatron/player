var C = require('../constants.js');

var utils = require('../utils.js'),
    is = utils.is;

var segments = require('./segments.js')
    MSeg = segments.MSeg,
    LSeg = segments.LSeg,
    CSeg = segments.CSeg;

var Brush = require('./brush.js');

var Bounds = require('./bounds.js');

// Paths
// -----------------------------------------------------------------------------

// M<X> <Y> - move to
// L<X> <Y> - line to
// C<X1> <Y1> <X2> <Y2> <X3> <Y3> - curve to
// Z - close path
// lowercase marker means relative coord
// Example: "M0 10 L20 20 C10 20 15 30 10 9 Z"

// all commands:
// V = vertical lineto
// C = curveto
// S = smooth curveto
// Q = quadratic Bézier curve
// T = smooth quadratic Bézier curveto
// A = elliptical Arc
// Z = closepath

/**
 * @class anm.Path
 *
 * A Class that helps in creating SVG-compatible paths easily.
 *
 * Examples:
 *
 * * `var path = new Path('M0.0 10.0 L20.0 20.0 C10.0 20.0 15.0 30.0 10.0 9.0 Z');`
 * * `var path = new Path().add(new MSeg([0, 0])).add(new LSeg([20, 20])).add(new CSeg([10, 20, 15, 30, 10, 9]));`
 * * `var path = new Path().move(0, 0).line(20, 20).curve(10, 20, 15, 30, 10, 9);`
 * * `var path = new Path().move(0, 0).line(20, 20).curve(10, 20, 15, 30, 10, 9).close();`
 *
 * See: {@link anm.Element#path Element.path()}, {@link anm.Element#translate_path Element.translate_path()}
 *
 * @constructor
 *
 * @param {String} [value] String representation of SVG path
 *
 * @return {anm.Path}
 */
function Path(val) {
    this.segs = [];
    this.closed = false;

    if (is.str(val)) {
        this.parse(val);
    } else if (is.arr(val)) {
        this.segs = val;
    }

    this.cached_hits = {};
}

/**
 * @method visit
 * @chainable
 *
 * // FIXME: rename to `.each`
 *
 * Visits every chunk of path in array-form and calls visitor function, so
 * visitor function gets chunk marker and positions sequentially
 * data argument will be also passed to visitor if specified
 *
 * @param {Function} visitor
 * @param {anm.MSeg|anm.LSeg|anm.CSeg} visitor.segment
 */
Path.prototype.visit = function(visitor, data) {
    var segments = this.segs;
    for (var si = 0, sl = segments.length; si < sl; si++) {
        visitor(segments[si], data);
    }
    return this;
}
/**
 * @method length
 *
 * Get path length, in points.
 *
 * @return {Number} path length
 */
Path.prototype.length = function() {
    if (is.defined(this.cached_len)) return this.cached_len;
    var sum = 0;
    var p = this.start();
    this.visit(function(segment) {
        sum += segment.length(p);
        p = segment.last();
    });
    this.cached_len = sum;
    return sum;
}
/**
 * @method add
 * @chainable
 *
 * Add a segment to this path
 *
 * @param {anm.MSeg|anm.LSeg|anm.CSeg} segment segment to add
 *
 * @return {anm.Path} itself
 */
Path.prototype.add = function(seg) {
    this.segs.push(seg);
    return this;
}
/**
 * @method move
 * @chainable
 *
 * Shortcut to adding Move Segment
 *
 * @param {Number} x X coordinate of move-to operation
 * @param {Number} y Y coordinate of move-to operation
 *
 * @return {anm.Path} itself
 */
Path.prototype.move = function(x, y) {
    return this.add(new MSeg([x, y]));
}
/**
 * @method line
 * @chainable
 *
 * Shortcut to adding Line Segment
 *
 * @param {Number} x X coordinate of line-to operation
 * @param {Number} y Y coordinate of line-to operation
 *
 * @return {anm.Path} itself
 */
Path.prototype.line = function(x, y) {
    return this.add(new LSeg([x, y]));
}
/**
 * @method curve
 * @chainable
 *
 * Shortcut to adding Curve Segment
 *
 * @param {Number} x1 X coordinate of first point of curve-to operation
 * @param {Number} y1 Y coordinate of first point of curve-to operation
 * @param {Number} x2 X coordinate of second point of curve-to operation
 * @param {Number} y2 Y coordinate of second point of curve-to operation
 * @param {Number} x3 X coordinate of third point of curve-to operation
 * @param {Number} y3 Y coordinate of third point of curve-to operation
 *
 * @return {anm.Path} itself
 */
Path.prototype.curve = function(x1, y1, x2, y2, x3, y3) {
    return this.add(new CSeg([x1, y1, x2, y2, x3, y3]));
}
/**
 * @method close
 * @chainable
 *
 * Close the path
 *
 * @return {anm.Path} itself
 */
Path.prototype.close = function() {
    this.closed = true;
    return this;
}
/**
 * @method apply
 *
 * Apply this path to a given 2D context with given fill / stroke / shadow
 *
 * Example: `path.apply(ctx, Brush.fill('#ff0000'), Brush.stroke('#00ff00', 2))`
 *
 * @param {Context2D} ctx where to apply
 * @param {anm.Brush} fill fill to use
 * @param {anm.Brush} stroke stroke to use
 * @param {anm.Brush} shadow shadow to use
 *
 * @return {anm.Path} itself
 */
Path.prototype.apply = function(ctx, fill, stroke, shadow) {
    ctx.beginPath();
    // unrolled for speed
    var segments = this.segs;
    for (var si = 0, sl = segments.length; si < sl; si++) {
        segments[si].draw(ctx);
    }

    if (this.closed) ctx.closePath();

    if (shadow) { shadow.apply(ctx); }
    if (fill) { fill.apply(ctx); ctx.fill(); }
    if (shadow) { Brush.clearShadow(ctx); }
    if (stroke) { stroke.apply(ctx); ctx.stroke(); }
}
/**
 * @method parse
 * @chainable
 * @deprecated
 *
 * Same as `new Path(str)`, but updates current instance instead of creating new one.
 *
 * @param {String} source string representation of SVG path
 * @return {anm.Path} itself
 */
Path.prototype.parse = function(str) {
    if (str) Path.parse(str, this);
    return this;
}
/**
 * @method hitAt
 *
 * Find a segment hit data in a path that corresponds
 * to specified distance (t) of the path.
 *
 * @param {Number} t distance in a range of [0..1]
 * @return {Object} hit data
 */
Path.prototype.hitAt = function(t) {
    if (is.defined(this.cached_hits[t])) return this.cached_hits[t];

    var plen = this.length(); // path length in pixels
    if (plen == 0) return null;
    if (t < 0 || t > 1.0) return null;

    var startp = this.start(); // start point of segment

    if (t === 0) return (this.cached_hits[t] = {
        'seg': this.segs[0], 'start': startp, 'slen': 0.0, 'segt': 0.0
    });

    /*var endp = this.end();
      if (t == 1) return func ? func(startp, endp) : endp;*/

    var nsegs = this.segs.length; // number of segments
    if (nsegs == 0) return null;

    var distance = t * plen;
    var p = startp;
    var length = 0; // checked length in pixels
    var seg, slen;
    for (var si = 0; si < nsegs; si++) {
        seg = this.segs[si];
        slen = seg.length(p); // segment length
        if (distance <= (length + slen)) {
            // inside current segment
            var segdist = distance - length;
            return (this.cached_hits[t] = {
                'seg': seg, 'start': p, 'slen': slen, 'segt': (slen != 0) ? seg.findT(p, segdist) : 0
            });
        }
        length += slen;
        // end point of segment
        p = seg.last();
    }

    /*var lseg = this.segs[nsegs - 1];
      return {
        'seg': lseg, 'start': p, 'slen': lseg.length(p), 'segt': 1.0
      };*/
    return null;
}
/**
 * @method pointAt
 *
 * Find a point on a path at specified distance (t) of the path.
 *
 * @param {Number} t distance in a range of [0..1]
 * @return {[Number]} point in a form of [x, y]
 */
Path.prototype.pointAt = function(t) {
    var hit = this.hitAt(t);
    if (!hit) return this.start();
    return hit.seg.atT(hit.start, hit.segt);
}
/**
 * @method tangentAt
 *
 * Find a tangent on a path at specified distance (t) of the path.
 *
 * @param {Number} t distance in a range of [0..1]
 * @return {[Number]} point in a form of [x, y]
 */
Path.prototype.tangentAt = function(t) {
    var t = t;
    if (this.length() > 0) {
        if (t == 0) t = 0.0001;
        if (t == 1) t = 0.9999;
    }
    var hit = this.hitAt(t);
    if (!hit) return 0;
    return hit.seg.tangentAt(hit.start, hit.segt);
}
/**
 * @method start
 *
 * Get first point of a path
 *
 * @return {[Number]|Null} point in a form of [x, y]
 */
Path.prototype.start = function() {
    if (this.segs.length < 1) return null;
    return [ this.segs[0].pts[0],   // first-x
             this.segs[0].pts[1] ]; // first-y
}
/**
 * @method end
 *
 * Get last point of a path
 *
 * @return {[Number]|Null} point in a form of [x, y]
 */
Path.prototype.end = function() {
    if (this.segs.length < 1) return null;
    return this.segs[this.segs.length - 1].last();
}
/**
 * @method bounds
 *
 * Get bounds of a path
 *
 * @return {anm.Bounds} path bounds
 */
Path.prototype.bounds = function() {
    // FIXME: it is not ok for curve path, possibly
    if (this.$bounds) return this.$bounds;
    if (this.segs.length <= 0) return Bounds.NONE;
    var minX = this.segs[0].pts[0], maxX = this.segs[0].pts[0],
        minY = this.segs[0].pts[1], maxY = this.segs[0].pts[1];
    this.visit(function(segment) {
        var pts = segment.pts,
            pnum = pts.length;
        for (var pi = 0; pi < pnum; pi+=2) {
            minX = Math.min(minX, pts[pi]);
            maxX = Math.max(maxX, pts[pi]);
        }
        for (var pi = 1; pi < pnum; pi+=2) {
            minY = Math.min(minY, pts[pi]);
            maxY = Math.max(maxY, pts[pi]);
        }
    });
    return (this.$bounds = new Bounds(minX, minY,
                                      maxX - minX, maxY - minY));
}
/* TODO: rename to `modify`? */
Path.prototype.vpoints = function(func) {
    this.visit(function(segment) {
        var pts = segment.pts,
            pnum = pts.length;
        for (var pi = 0; pi < pnum; pi+=2) {
            var res = func(pts[pi], pts[pi+1]);
            if (res) {
                pts[pi] = res[0];
                pts[pi+1] = res[1];
            }
        }
    });
}
/**
 * @method shift
 * @chainable
 *
 * Shift this path to a point
 *
 * @param {[Number]} point in a form of [x, y]
 *
 * @return {anm.Path} itself
 */
Path.prototype.shift = function(pt) {
    this.vpoints(function(x, y) {
        return [ x + pt[0],
                 y + pt[1] ];
    });
    return this;
};
/**
 * @method zoom
 * @chainable
 *
 * Scale this path by given values
 *
 * @param {[Number]} values in a form of [sx, sy]
 *
 * @return {anm.Path} itself
 */
Path.prototype.zoom = function(vals) {
    this.vpoints(function(x, y) {
        return [ x * vals[0],
                 y * vals[1] ];
    });
    return this;
}
/**
 * @method normalize
 *
 * Moves path to be positioned at 0,0 and returns the difference
 *
 * @return {[Number]} [ center-x, center-y ]
 */
// moves path to be positioned at 0,0 and
// returns subtracted top-left point
// and a center point
Path.prototype.normalize = function() {
    var bounds = this.bounds();
    var w = bounds.width,
        h = bounds.height;
    var hw = Math.floor(w/2),
        hh = Math.floor(h/2);
    var min_x = bounds.x,
        min_y = bounds.y;
    this.vpoints(function(x, y) {
        return [ x - min_x - hw,
                 y - min_y - hh];
        });
    return [ hw, hh ];
}
Path.prototype.getPoints = function() {
    var points = [];
    this.visit(function(seg) {
        points = points.concat(seg.pts);
    });
    return points;
}
Path.prototype.toString = function() {
    return "[ Path '" + Path.toSVGString(this) + "' ]";
}
/**
 * @method clone
 *
 * Clone this path
 *
 * @return {anm.Path} clone
 */
Path.prototype.clone = function() {
    var _clone = new Path();
    this.visit(function(seg) {
        _clone.add(seg.clone());
    });
    clone.closed = this.closed;
    return _clone;
}
/**
 * @method invalidate
 *
 * Invalidate bounds of this path
 */
Path.prototype.invalidate = function() {
    this.cached_len = undefined;
    this.cached_hits = {};
    this.$bounds = null;
}
Path.prototype.reset = function() {
    this.segs = [];
    this.closed = false;
}
Path.prototype.dispose = function() { }

// visits every chunk of path in string-form and calls
// visitor function, so visitor function gets
// chunk marker and positions sequentially
// data argument will be also passed to visitor if specified
Path.visitStrPath = function(path, visitor, data) {
    var cur_pos = 0;
    while (true) {
        var marker = path[cur_pos];
        if (marker === 'Z') {
            visitor(marker, [], data);
            return;
        }
        var pos_data = null;
        if ((marker === 'M') || (marker === 'L')) {
            pos_data = collectPositions(path, cur_pos, 2);
        } else if (marker === 'C') {
            pos_data = collectPositions(path, cur_pos, 6);
        }
        cur_pos += pos_data[0];
        var positions = pos_data[1];
        visitor(marker, positions, data);
    }
}
Path.toSVGString = function(path) {
    var buffer = [];
    path.visit(encodeVisitor, buffer);
    buffer.push('Z');
    return buffer.join(' ');
}
// parses `count` positions from path (string form),
// starting at `start`, returns a length of parsed data and
// positions array
var collectPositions = function(path, start, count) {
    var pos = start + 1;
    var positions = [];
    var got = 0;
    while (got != count) {
        var posstr = utils.collect_to(path, pos, ' ');
        pos += posstr.length + 1; got++;
        positions.push(parseFloat(posstr));
    }
    return [pos - start, positions];
}
// visitor to parse a string path into Path object
var parserVisitor = function(marker, positions, path) {
    if (marker === 'M') {
        path.add(new MSeg(positions));
    } else if (marker === 'L') {
        path.add(new LSeg(positions));
    } else if (marker === 'C') {
        path.add(new CSeg(positions));
    }
}
// visitor to apply string path to context
var strApplyVisitor = function(marker, positions, ctx) {
    if (marker === 'M') {
        ctx.moveTo(positions[0], positions[1]);
    } else if (marker === 'L') {
        ctx.lineTo(positions[0], positions[1]);
    } else if (marker === 'C') {
        ctx.bezierCurveTo(positions[0], positions[1],
                          positions[2], positions[3],
                          positions[4], positions[5]);
    }
};
var encodeVisitor = function(segment, buffer) {
    buffer.push(segment.toString());
}

// converts path given in string form to array of segments
Path.parse = function(path, target) {
    var target = target || new Path();
    target.segs = [];
    Path.visitStrPath(path, parserVisitor, target);
    target.str = path;
    return target;
}
/**
 * @static @method parseAndAppy
 *
 * Parses a path in string form and immediately applies it to context
 *
 * @param {Context2D} ctx context to apply to
 * @param {String} path SVG representation of a path
 */
Path.parseAndApply = function(ctx, path) {
    Path.visitStrPath(path, strApplyVisitor, ctx);
}

module.exports = Path;
