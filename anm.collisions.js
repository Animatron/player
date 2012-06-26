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

E.prototype.rect = function(t) {
    return this._pradopt(this._cpa_rect(), t);
}

E.prototype.drect = function(t) {
    var r = this.rect(t);
    var x1, y1, x2, y2, x3, y3, x4, y4;
    if (r) {
        x1 = r[0]; y1 = r[1];
        x2 = r[2]; y2 = r[3];
        x3 = r[4]; y3 = r[5];
        x4 = r[6]; y4 = r[7];
    } else {
        x1 = y1 = y2 = x4 = Number.MAX_VALUE;
        x2 = y4 = x3 = y3 = 0;
    }
    this.travelChildren(function(elm) {
        var cr = elm.rect(t);
        if (!cr) return;
        x1 = Math.min(x1, cr[0]); y1 = Math.min(y1, cr[1]);
        x2 = Math.max(x2, cr[2]); y2 = Math.min(y2, cr[3]);
        x3 = Math.max(x3, cr[4]); y3 = Math.max(y3, cr[5]);
        x4 = Math.min(x4, cr[6]); y4 = Math.max(y4, cr[7]);
        // it may be rotate, so we correct it before
    });
    return [ x1, y1, x2, y2, x3, y3, x4, y4 ];
}

E.prototype.collectPoints = function() {
    var x = this.xdata;
    if (x.__cpath) return x.__cpath.getPoints();
    if (x.path) return x.path.getPoints();
    if (x.image || x.text) return this.lrect();
}

E.prototype.contains = function(pt, t) {
    if (!pt) return false;
    var b = this._cpa_bounds();
    if (!b) return false;
    var pt = this._padopt(pt, t);
    var x = this.xdata;
    if (x.__cfunc) return x.__cfunc.call(this, pt);
    var inBounds;
    if (inBounds = G.__inBounds(b, pt)) {
        if (!opts.pathCheck) return true;
        if (x.__cpath) return x.__cpath.contains(pt);        
        if (x.path) return x.path.contains(pt);
        if (x.image || x.text) return inBounds;
    } 
    return false;
}

E.prototype.dcontains = function(pt, t) {
    var matched = [];
    if (this.contains(pt, t)) {
        matched.push(this);
    }
    if (this.children) {
        elm.visitChildren(function(celm) {
            matched.concat(celm.dcontains(pt, t));
        });
    }
    return matched;
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
    this.xdata.__cpath = path;
}
E.prototype.reactWith = function(func) {
    this.xdata.__cfunc = func;
}

E.prototype.collides = function(elm, t) {
    throw new Error('Not implemented');
}

E.prototype.dcollides = function(elm, t) {
    throw new Error('Not implemented');
}

E.prototype.intersects = function(elm, t) {
    var rectsMatched;
    if (rectsMatched =
        G.__isecRects(this.rect(t), elm.rect(t))) {
        if (!opts.pathCheck) return true;
        var cx = this.xdata, ex = elm.xdata;
        var cIsPath = (cx.__cpath || cx.path);
        var eIsPath = (ex.__cpath || ex.path);
        if (!cIsPath && !eIsPath) return rectsMatched;
        else if (cIsPath && eIsPath) {
            return G.__pointsInPath(cx.__cpath || cx.path, 
                                    elm._pradopt(elm.collectPoints(), t)) ||
                   G.__pointsInPath(ex.__cpath || ex.path,
                                    this._pradopt(this.collectPoints(), t));
        } else if (cIsPath && !eIsPath) {
            var epts = elm._pradopt(elm.lrect(), t);
            return G.__pointsInPath(cx.__cpath || cx.path, epts) ||
                   G.__pointsInRect(this._pradopt(this.collectPoints(), t), epts);
        } else if (!cIsPath && eIsPath) {
            var cpts = this._pradopt(this.lrect(), t);
            return G.__pointsInPath(ex.__cpath || ex.path, cpts) ||
                   G.__pointsInRect(elm._pradopt(elm.collectPoints(), t), cpts);
        }
        return false;
    }
}

E.prototype.dintersects = function(elm, t) {
    var matched = [];
    if (this.intersects(elm, t)) {
        matched.push(this);
    }
    if (this.children) {
        elm.visitChildren(function(celm) {
            matched.concat(celm.dintersects(elm, t));
        });
    }
    return matched;
}

E.prototype._cpa_bounds = function() { // cpath-aware bounds
    var cpath = this.xdata.__cpath;
    return cpath 
            ? cpath.bounds()
            : this.lbounds();
}

E.prototype._cpa_rect = function() { // cpath-aware rect
    var cpath = this.xdata.__cpath;
    return cpath
            ? cpath.rect()
            : this.lrect();
}

E.prototype._adopt = function(pts, t) { // adopt point by current or time-matrix
    if (!pts) return null;
    //if (!Array.isArray(pts)) throw new Error('Wrong point format');
    if ((t != null) &&
        (this.__modifying != null)
        && (this.__modifying !== E.EVENT_MOD)) {
        throw new Error('Time-related tests may happen only outside of modifier or inside event handler');
    }
    var s = (t == null) ? this.state : this.stateAt(t);
    if (!s._applied) {
        // fill result with min-values
        var l = pts.length; result = new Array(l), i = l;
        while (i--) result[i] = Number.MIN_VALUE;
        return result;
    }
    //return this.__adoptWithM(pts, s._matrix.inverted());
    return this.__adoptWithM(pts, E._getIMatrixOf(s));
}
E.prototype._radopt = function(pts, t) {
    if (!pts) return null;
    //if (!Array.isArray(pts)) throw new Error('Wrong point format');
    if ((t != null) &&
        (this.__modifying != null)
        && (this.__modifying !== E.EVENT_MOD)) {
        throw new Error('Time-related tests may happen only outside of modifier or inside event handler');
    }
    var s = (t == null) ? this.state : this.stateAt(t);
    if (!s._applied) {
        // fill result with min-values
        var l = pts.length; result = new Array(l), i = l;
        while (i--) result[i] = Number.MIN_VALUE;
        return result;
    }
    //return this.__adoptWithM(pts, s._matrix);
    return this.__adoptWithM(pts, E._getMatrixOf(s));
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
var prevAddDebugRender = E.__addDebugRender;
function p_drawCPath(ctx, cPath) {
    if (!(cPath = cPath || this.__cpath)) return;
    cPath.cstroke('#f00', 2.0);
    cPath.apply(ctx);
}
function p_drawAdoptedBounds(ctx) {
    var rect = this.$._cpa_rect();
    if (rect) {
        rect = this.$._pradopt(rect);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        ctx.fillStyle = '#0f0';
        ctx.fillRect(rect[0]-2,rect[1]-2,4,4);
        ctx.fillRect(rect[2]-2,rect[3]-2,4,4);
        ctx.fillRect(rect[4]-2,rect[5]-2,4,4);
        ctx.fillRect(rect[6]-2,rect[7]-2,4,4);
        ctx.beginPath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.moveTo(rect[0], rect[1]);
        ctx.lineTo(rect[2], rect[3]);
        ctx.lineTo(rect[4], rect[5]);
        ctx.lineTo(rect[6], rect[7]);
        ctx.lineTo(rect[0], rect[1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}
function p_drawAdoptedPoints(ctx) {
    var pts = this.$.collectPoints();
    if (pts) {
        pts = this.$._pradopt(pts);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        ctx.fillStyle = '#00f';
        for (var pi = 0, pl = pts.length; pi < pl; pi += 2) {
            ctx.fillRect(pts[pi]-2,pts[pi+1]-2,4,4);
        }
        ctx.restore();
    }
}
E.__addDebugRender = function(elm) {
    prevAddDebugRender(elm);

    elm.__paint(E.DEBUG_PNT, 0, p_drawCPath);
    elm.__paint(E.DEBUG_PNT, 0, p_drawAdoptedBounds);
    elm.__paint(E.DEBUG_PNT, 0, p_drawAdoptedPoints);
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

G.__zeroBounds = function(b) {
    return (b[0] === b[1]) &&
           (b[1] === b[2]) &&
           (b[2] === b[3])/* &&
           (b[3] === b[0])*/;
}
G.__zeroRect = function(r) {
    return (r[0] === r[1]) && (r[1] === r[2]) &&
           (r[2] === r[3]) && (r[3] === r[4]) &&
           (r[4] === r[5]) && (r[5] === r[6]) &&
           (r[6] === r[7])/* && (r[7] === r[0])*/;
}
G.__inBounds = function(b, pt, zeroTest) {
    if (!b) throw new Error('Bounds are not accessible');
    // zero-bounds don't match
    if (zeroTest && G.__zeroBounds(b)) return false;
    return ((pt[0] >= b[0]) &&
            (pt[0] <= b[2]) &&
            (pt[1] >= b[1]) &&
            (pt[1] <= b[3]));
}
G.__inRect = function(r, pt, zeroTest) {
    if (!r) throw new Error('Rect is not accessible');
    // zero-rect don't match
    if (zeroTest && G.__zeroRect(r)) return false;
    return ((pt[0] >= r[0]) &&
            (pt[0] <= r[2]) &&
            (pt[1] >= r[1]) &&
            (pt[1] <= r[5]));
}
G.__isecBounds = function(b1, b2) {
    var inBounds = G.__inBounds;
    if (!b1 || !b2) throw new Error('Bounds are not accessible');
    if (G.__zeroBounds(b1) || G.__zeroBounds(b2)) return false;
    if (inBounds(b2, [b1[0], b1[1]])) return true; // x1, y1
    if (inBounds(b2, [b1[2], b1[1]])) return true; // x2, y1
    if (inBounds(b2, [b1[2], b1[3]])) return true; // x2, y2
    if (inBounds(b2, [b1[0], b1[3]])) return true; // x1, y2
    if (inBounds(b1, [b2[0], b2[1]])) return true; // x1, y1
    if (inBounds(b1, [b2[2], b2[1]])) return true; // x2, y1
    if (inBounds(b1, [b2[2], b2[3]])) return true; // x2, y2
    if (inBounds(b1, [b2[0], b2[3]])) return true; // x1, y2
    return false; 
}
G.__isecRects = function(r1, r2) {
    var inRect = G.__inRect;
    if (!r1 || !r2) throw new Error('Rects are not accessible');
    if (G.__zeroRect(r1) || G.__zeroRect(r2)) return false;
    for (var r1i = 0, r1l = r1.length; r1i < r1l; r1i+2) {
        if (inRect(r2, [r1[r1i], r1[r1i+1]])) return true;
    }
    for (var r2i = 0, r2l = r2.length; r2i < r2l; r2i+2) {
        if (inRect(r1, [r2[r2i], r2[r2i+1]])) return true;
    }
    return false; 
}
G.__pointsInPath = function(path, pts) {
    for (var pi = 0, pl = pts.length; pi < pl; pi += 2) {
        if (path.contains([pts[pi], pts[pi+1]])) return true;
    }
    return false; // return count?
}
G.__pointsInBounds = function(b, pts) {
    if (G.__zeroBounds(b)) return false;
    var inBounds = G.__inBounds;    
    for (var pi = 0, pl = pts.length; pi < pl; pi += 2) {
        if (inBounds(b, [pts[pi], pts[pi+1]], false)) return true;
    }
    return false; // return count?    
}
G.__pointsInRect = function(r, pts) {
    if (G.__zeroRect(r)) return false;
    var inRect = G.__inRect;    
    for (var pi = 0, pl = pts.length; pi < pl; pi += 2) {
        if (inRect(r, [pts[pi], pts[pi+1]], false)) return true;
    }
    return false; // return count?    
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