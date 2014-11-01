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

// Currently our format differs in a number format:
// "M0.0 10.0 L20.0 20.0 C10.0 20.0 15.0 30.0 10.0 9.0 Z"
// > Path % (val: String | Array)
function Path(val) {
    this.segs = [];

    if (is.str(val)) {
        this.parse(val);
    } else if (is.arr(val)) {
        this.segs = val;
    }
}

// visits every chunk of path in array-form and calls
// visitor function, so visitor function gets
// chunk marker and positions sequentially
// data argument will be also passed to visitor if specified
// > Path.visit % (visitor: Function[Segment, Any], data: Any)
Path.prototype.visit = function(visitor, data) {
    var segments = this.segs;
    for (var si = 0, sl = segments.length; si < sl; si++) {
        visitor(segments[si], data);
    }
}
// path length, in points
// > Path.length % () => Double
Path.prototype.length = function() {
    var sum = 0;
    var p = this.start();
    this.visit(function(segment) {
        sum += segment.length(p);
        p = segment.last();
    });
    return sum;
}
// > Path.add % (seg: Segment)
Path.prototype.add = function(seg) {
    this.segs.push(seg);
}
// > Path.apply % (ctx: Context)
Path.prototype.apply = function(ctx, fill, stroke, shadow) {
    // TODO: every segment should apply itself
    //       simplify this to call seg.apply for every segment
    ctx.beginPath();
    this.visit(applyVisitor, ctx);
    // ctx.closePath();

    if (shadow) { shadow.apply(ctx); }
    if (fill) { fill.apply(ctx); ctx.fill(); }
    if (shadow) { Brush.clearShadow(ctx); }
    if (stroke) { stroke.apply(ctx); ctx.stroke(); }
}
// > Path.parse % (str: String) => Path
Path.prototype.parse = function(str) {
    if (str) Path.parse(str, this);
    return this;
}
// find a segment hit data in a path that corresponds
// to specified distance (t) of the path (0..1),
// > Path.hitAt % (t: [0..1]) => Array[Int, 2]
Path.prototype.hitAt = function(t) {
    var plen = this.length(); // path length in pixels
    if (plen == 0) return null;
    if (t < 0 || t > 1.0) return null;

    var startp = this.start(); // start point of segment

    if (t === 0) return {
          'seg': this.segs[0], 'start': startp, 'slen': 0.0, 'segt': 0.0
        };

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
        if (seg.type !== C.P_MOVE_TO) {
          slen = seg.length(p); // segment length
          if (distance <= (length + slen)) {
              // inside current segment
              var segdist = distance - length;
              return {
                'seg': seg, 'start': p, 'slen': slen, 'segt': (slen != 0) ? (segdist / slen) : 0
              };
          }
          length += slen;
        }
        // end point of segment
        p = seg.last();
    };

    /*var lseg = this.segs[nsegs - 1];
      return {
        'seg': lseg, 'start': p, 'slen': lseg.length(p), 'segt': 1.0
      };*/
    return null;
}
// find a point on a path at specified distance (t) of the path (0..1),
// a function that transforms the result point (using given start point of
// segment and a point on a segment) may be passed
// > Path.pointAt % (t: [0..1]) => Array[Int, 2]
Path.prototype.pointAt = function(t) {
    var hit = this.hitAt(t);
    if (!hit) return this.start();
    return hit.seg.atT(hit.start, hit.segt);
}
// find a tangent on a path at specified distance (t) of the path (0..1)
// > Path.tangentAt % (t: [0..1]) => Double
Path.prototype.tangentAt = function(t) {
    var hit = this.hitAt(t);
    if (!hit) return 0;
    return hit.seg.tangentAt(hit.start, hit.segt);
}
Path.prototype.start = function() {
    if (this.segs.length < 1) return null;
    return [ this.segs[0].pts[0],   // first-x
             this.segs[0].pts[1] ]; // first-y
}
Path.prototype.end = function() {
    if (this.segs.length < 1) return null;
    var lastidx = this.segs.length - 1;
    var s = this.segs[lastidx].count; // size of the last segment
    return [ this.segs[lastidx].pts[s-2],   // last-x
             this.segs[lastidx].pts[s-1] ]; // last-y
}
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
Path.prototype.shift = function(pt) {
    this.vpoints(function(x, y) {
        return [ x + pt[0],
                 y + pt[1] ];
    });
};
Path.prototype.zoom = function(vals) {
    this.vpoints(function(x, y) {
        return [ x * vals[0],
                 y * vals[1] ];
    });
}
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
Path.prototype.clone = function() {
    var _clone = new Path();
    this.visit(function(seg) {
        _clone.add(Path.makeSeg(seg.type, [].concat(seg.pts)));
    });
    return _clone;
}
Path.prototype.invalidate = function() {
    this.$bounds = null;
}
Path.prototype.reset = function() {
    this.segs = [];
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
var applyVisitor = function(segment, ctx) {
    var type = segment.type;
    var positions = segment.pts;
    if (type === C.P_MOVETO) {
        ctx.moveTo(positions[0], positions[1]);
    } else if (type === C.P_LINETO) {
        ctx.lineTo(positions[0], positions[1]);
    } else if (type === C.P_CURVETO) {
        ctx.bezierCurveTo(positions[0], positions[1],
                          positions[2], positions[3],
                          positions[4], positions[5]);
    }
}
var encodeVisitor = function(segment, buffer) {
    var type = segment.type;
    var positions = segment.pts;
    if (type === C.P_MOVETO) {
        buffer.push('M'+positions[0]+' '+positions[1]);
    } else if (type === C.P_LINETO) {
        buffer.push('L'+positions[0]+' '+positions[1]);
    } else if (type === C.P_CURVETO) {
        buffer.push('C'+positions[0]+' '+positions[1]+' '+
                        positions[2]+' '+positions[3]+' '+
                        positions[4]+' '+positions[5]);
    }
}

// converts path given in string form to array of segments
Path.parse = function(path, target) {
    var target = target || new Path();
    target.segs = [];
    Path.visitStrPath(path, parserVisitor, target);
    target.str = path;
    return target;
}
// parses a path in string form and immediately applies it to context
Path.parseAndApply = function(ctx, path) {
    Path.visitStrPath(path, strApplyVisitor, ctx);
}
Path.makeSeg = function(type, pts) {
    if (type === C.P_MOVETO) { return new MSeg(pts); }
    else if (type === C.P_LINETO) { return new LSeg(pts); }
    else if (type === C.P_CURVETO) { return new CSeg(pts); }
}

module.exports = Path;
