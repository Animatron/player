(function() { // anonymous wrapper to exclude global context clash

if (anm.MODULES['COLLISIONS']) throw new Error('COLLISIONS module already enabled');

var opts = {
    'pathCheck': false
};

anm.MODULES['COLLISIONS'] = opts;

var E = anm.Element; Path = anm.Path, MSeg = anm.MSeg, 
                                      LSeg = anm.LSeg, 
                                      CSeg = anm.CSeg;

E.prototype.bounds = function(t) {
    return this._pradopt(this._cpa_bounds(), t);
}

E.prototype.dbounds = function(t) {
    var b = this.bounds(t);
    var minX, minY, maxX, maxY;
    if (b) {
        minX = b[0]; minY = b[1];
        maxX = b[2]; maxY = b[3];
    } else {
        minX = minY = Number.MAX_VALUE;
        maxX = maxY = 0; 
    }
    this.travelChildren(function(elm) {
        var cb = elm.bounds(t);
        if (!cb) return;
        minX = Math.min(minX, cb[0]);
        minY = Math.min(minY, cb[1]);
        maxX = Math.max(maxX, cb[2]);
        maxY = Math.max(maxY, cb[3]);
    });
    return [ minX, minY, maxX, maxY ];
}

E.prototype.contains = function(pt, t) {
    if (!pt) return false;
    var b = this._cpa_bounds();
    if (!b) return false;
    var pt = this._padopt(pt, t);
    if (this.__cfunc) return this.__cfunc.call(this, pt);
    if (G.__inBounds(b, pt)) {
        if (!opts.pathCheck) return true;
        if (this.__cpath) return this.__cpath.contains(pt);
        var x = this.xdata;
        if (x.path) return x.path.contains(pt);
        if (x.image) return G.__inBounds(this._cpa_bounds(), pt);
        if (x.text) throw new Error('Not implemented');
    } 
    return false;
}

E.prototype.dcontains = function(pt, t) {
    var matched = [];
    if (this.contains(pt, t)) {
        matched.push(elm);
    }
    if (this.children) {
        elm.visitChildren(function(celm) {
            matched.concat(celm.dcontains(pt, t));
        });
    }
    return matched.length;
}

E.prototype.local = function(pt, t) {
    /*var off = this.offset();
    var lpt = this._adopt(pt, t);
    return [ lpt[0] - off[0],
             lpt[1] - off[1] ];*/
    return this._padopt(pt, t);
}

E.prototype.global = function(pt, t) {
    /*var off = this.offset();
    var gpt = this._radopt(pt, t);
    return [ gpt[0] + off[0],
             gpt[1] + off[1] ];*/ 
    return this._pradopt(pt, t);
}

E.prototype.reactAs = function(path) {
    this.__cpath = path;
}
E.prototype.reactWith = function(func) {
    this.__cfunc = func;
}

E.prototype.collides = function(elm, t) {
    throw new Error('Not implemented');
}

E.prototype.dcollides = function(elm, t) {
    throw new Error('Not implemented');
}

E.prototype.intersects = function(elm, t) {
    if (!opts.pathCheck) {
        /*var this_b = this.bounds(t);
        var other_b = elm.bounds(t);
        return (((this_b[0] >= other_b[0]) &&
                 (this_b[2] <= other_b[2])) &&
                ((this_b[1] >= other_b[1]) &&*/
        throw new Error('Not implemented');
    } else {
        throw new Error('Not implemented');
    }
}

E.prototype.dintersects = function(elm, t) {
    throw new Error('Not implemented');
}

E.prototype._cpa_bounds= function() { // cpath-aware bounds
    var cpath = this.__cpath;
    return cpath 
            ? cpath.bounds()
            : this.ibounds();
}
E.prototype._adopt = function(pts, t) { // adopt point by current or time-matrix
    if (!pts) return null;
    //if (!Array.isArray(pts)) throw new Error('Wrong point format');
    if ((t != null) &&
        (this.__modifying != null)
        && (this.__modifying !== Element.EVENT_MOD)) {
        throw new Error('Time-related tests may happen only outside of modifier or inside event handler');
    }
    return this.__adoptWithM(pts, 
        E._getIMatrixOf(
            (t == null) ? this.state : this.stateAt(t)
        ));
}
E.prototype._radopt = function(pts, t) {
    if (!pts) return null;
    //if (!Array.isArray(pts)) throw new Error('Wrong point format');
    if ((t != null) &&
        (this.__modifying != null)
        && (this.__modifying !== Element.EVENT_MOD)) {
        throw new Error('Time-related tests may happen only outside of modifier or inside event handler');
    }
    return this.__adoptWithM(pts, 
        E._getMatrixOf(
            (t == null) ? this.state : this.stateAt(t)
        ));    
}
E.prototype._padopt = function(pt, t) {
    var p = this.parent;
    while (p) {
        pt = p._adopt(pt, t);
        p = p.parent;
    } 
    return this._adopt(pt, t);
}
E.prototype._pradopt = function(pt, t) {
    var p = this.parent;
    while (p) {
        pt = p._radopt(pt, t);
        p = p.parent;
    } 
    return this._radopt(pt, t);
}
E.prototype.__adoptWithM = function(pts, m) {
    if (pts.length > 2) {
        var transformed = [];
        for (var pi = 0, pl = pts.length; pi < pl; pi += 2) {
            var tpt = m.transformPoint(pts[pi], pts[pi+1]);
            transformed.push(tpt[0], tpt[1]);
        }
        return transformed;
    } else {
        return m.transformPoint(pts[0], pts[1]);
    }
}

Path.prototype.contains = function(pt) {
    // FIXME: add stroke width
    /*return this.fill ? ((this.crosses(pt) & -1) != 0)
                     : false /* TODO (this.getHitAt(time, point)) ..*/
    return ((this.crosses(pt) & -1) != 0);
}
Path.prototype.crosses = function(pt) {
    if (this.segs.length < 2) return false;
    var start = this.start();
    var cur = start;
    var crossings = 0;
    this.visit(function(segment) {
        crossings += segment.crosses(cur, pt);
        cur = segment.last();
    });

    if ((pt[0] != start[0]) && 
        (pt[1] != start[1])) {
        crossings += G.__lineCrosses(pt[0], pt[1], 
                                     cur[0], cur[1],
                                     start[0], start[1]);
    }

    return crossings;
}

MSeg.prototype.crosses = function(start, point) {
    var pts = this.pts; // == this.last();
    return G.__lineCrosses(point[0], point[1], // px, py
                           start[0], start[1], // x0, y0
                           pts[0], pts[1]);    // x1, y1
}

LSeg.prototype.crosses = function(start, point) {
    var pts = this.pts; // == this.last();
    return G.__lineCrosses(point[0], point[1], // px, py
                           start[0], start[1], // x0, y0
                           pts[0], pts[1]);    // x1, y1
}

CSeg.prototype.crosses = function(start, point) {
    var level = level || 0, pts = this.pts;
    return G.__curveCrosses(point[0], point[1], // px, py
                            start[0], start[1], // x0, y0
                            pts[0],   pts[1],   // xc0, yc0
                            pts[2],   pts[3],   // xc1, yc1
                            pts[4],   pts[5],   // x1, y1
                            0);                 // level
}

var G = {}; // geometry

G.__inBounds = function(b, pt) {
    return ((pt[0] >= b[0]) &&
            (pt[0] <= b[3]) &&
            (pt[1] >= b[1]) &&
            (pt[1] <= b[2]));
}
/**
  * Calculates the number of times the line from (x0,y0) to (x1,y1)
  * crosses the ray extending to the right from (px,py).
  * If the point lies on the line, then no crossings are recorded.
  * +1 is returned for a crossing where the Y coordinate is increasing
  * -1 is returned for a crossing where the Y coordinate is decreasing
  */
G.__lineCrosses = function(px, py, x0, y0, x1, y1) {
    if ((py < y0) && (py < y1)) return 0;
    if ((py >= y0) && (py >= y1)) return 0;
    // assert y0 != y1
    if ((px >= x0) && (px >= x1)) return 0;
    if ((px < x0) && (px < x1)) return (y0 < y1) ? 1 : -1;
    var xitcpt = x0 + (py - y0) * (x1 - x0) / (y1 - y0);
    if (px >= xitcpt) return 0;
    return (y0 < y1) ? 1 : -1;
}
/**
  * Calculates the number of times the cubic from (x0,y0) to (x1,y1)
  * crosses the ray extending to the right from (px,py).
  * If the point lies on a part of the curve,
  * then no crossings are counted for that intersection.
  * the level parameter should be 0 at the top-level call and will count
  * up for each recursion level to prevent infinite recursion
  * +1 is added for each crossing where the Y coordinate is increasing
  * -1 is added for each crossing where the Y coordinate is decreasing
  */
G.__curveCrosses = function(px, py, x0, y0,
                            xc0, yc0, xc1, yc1,
                            x1, y1, level) {
    var level = level || 0;
    if ((py < y0) && (py < yc0) && (py < yc1) && (py < y1)) return 0;
    if ((py >= y0) && (py >= yc0) && (py >= yc1) && (py >= y1)) return 0;
    // Note y0 could equal yc0...
    if ((px >= x0) && (px >= xc0) && (px >= xc1) && (px >= x1)) return 0;
    if ((px < x0) && (px < xc0) && (px < xc1) && (px < x1)) {
        if (py >= y0) {
            if (py < y1) return 1;
        } else {
            // py < y0
            if (py >= y1) return -1;
        }
        // py outside of y01 range, and/or y0==yc0
        return 0;
    }
    // double precision only has 52 bits of mantissa
    if (level > 52) return G.__lineCrosses(px, py, x0, y0, x1, y1);
    var xmid = (xc0 + xc1) / 2,
        ymid = (yc0 + yc1) / 2;
    var xc0 = (x0 + xc0) / 2,
        yc0 = (y0 + yc0) / 2,
        xc1 = (xc1 + x1) / 2,
        yc1 = (yc1 + y1) / 2;
    var xc0m = (xc0 + xmid) / 2,
        yc0m = (yc0 + ymid) / 2;
        xmc1 = (xmid + xc1) / 2;
        ymc1 = (ymid + yc1) / 2;
    xmid = (xc0m + xmc1) / 2;
    ymid = (yc0m + ymc1) / 2;
    if (isNaN(xmid) || isNaN(ymid)) {
        // [xy]mid are NaN if any of [xy]c0m or [xy]mc1 are NaN
        // [xy]c0m or [xy]mc1 are NaN if any of [xy][c][01] are NaN
        // These values are also NaN if opposing infinities are added
        return 0;
    }
    return (G.__curveCrosses(px, py, x0, y0, 
                             xc0, yc0, xc0m, yc0m, 
                             xmid, ymid, level + 1) +
            G.__curveCrosses(px, py, xmid, ymid, 
                             xmc1, ymc1, xc1, yc1, 
                             x1, y1, level + 1));                            
}
    
})();  // end of anonymous wrapper