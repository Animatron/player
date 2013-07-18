/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

(function() { // anonymous wrapper to exclude global context clash

var C = anm.C;

C.MOD_COLLISIONS = 'collisions';
if (anm.M[C.MOD_COLLISIONS]) throw new Error('COLLISIONS module already enabled');

var opts = {
    'pathDriven': false,
    'useSnaps': false,
    'vectorSpan': 1, // seconds
    'predictSpan': 1, // seconds
    'mouseBound': false
};

anm.M[C.MOD_COLLISIONS] = opts;

function __filled(arr, val) {
    var l = arr.length; result = new Array(l), i = l;
    while (i--) result[i] = val;
    return result;
}

var E = anm.Element;
var Path = anm.Path, MSeg = anm.MSeg,
                     LSeg = anm.LSeg,
                     CSeg = anm.CSeg;
var Scene = anm.Scene;

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
        if (!opts.pathDriven) return true;
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

E.prototype.intersects = function(elm, t) {
    var rectsMatched;
    if (rectsMatched =
        G.__isecRects(this.rect(t), elm.rect(t))) {
        if (!opts.pathDriven) return true;
        var cx = this.xdata, ex = elm.xdata;
        var pathOfC = (cx.__cpath || cx.path);
        var pathOfE = (ex.__cpath || ex.path);
        if (!pathOfC && !pathOfE) return rectsMatched;
        else if (pathOfC && pathOfE) {
            return G.__pointsInPath(this.__pathAt(t), elm.__pointsAt(t)) ||
                   G.__pointsInPath(elm.__pathAt(t), this.__pointsAt(t));
        } else if (pathOfC && !pathOfE) {
            var e_rect = elm.rect(t);
            return G.__pointsInRect(this.__pointsAt(t), e_rect) ||
                   G.__pointsInPath(this.__pathAt(t), e_rect);
        } else if (!pathOfC && pathOfE) {
            var c_rect = this.rect(t);
            return G.__pointsInRect(elm.__pointsAt(t), c_rect) ||
                   G.__pointsInPath(elm.__pathAt(t), c_rect);
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

E.prototype.collides = function(elm, func) {
    if (!this._collisionTests) this._collisionTests = [];
    if (!this._collisionElms) this._collisionElms = [];
    this._collisionTests.push(func);
    this._collisionElms.push(elm);
}
E.prototype.dcollides = function(elm, t) {
    throw new Error('Not implemented');
}

E.prototype._adopt = function(pts, t) { // adopt point by current or time-matrix
    if (!pts) return null;
    //if (!Array.isArray(pts)) throw new Error('Wrong point format');
    this.__ensureTimeTestAllowedFor(t);
    var s = (t == null) ? (this.astate || this.bstate) : this.stateAt(t);
    if (!s._applied) return __filled(pts, Number.MIN_VALUE);
    //return this.__adoptWithM(pts, s._matrix);
    return this.__adoptWithM(pts, E._getIMatrixOf(s));
}
E.prototype._radopt = function(pts, t) {
    if (!pts) return null;
    //if (!Array.isArray(pts)) throw new Error('Wrong point format');
    this.__ensureTimeTestAllowedFor(t);
    var s = (t == null) ? (this.astate || this.bstate) : this.stateAt(t);
    if (!s._applied) return __filled(pts, Number.MIN_VALUE);
    //return this.__adoptWithM(pts, s._matrix.inverted());
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
    var pt = this._radopt(pt, t);
    var p = this.parent;
    while (p) {
        pt = p._radopt(pt, t);
        p = p.parent;
    }
    return pt;
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

E.___vecErrText = /*new Error(*/'Ensure you have passed actual '+
                                '(current) time to _getVects ' +
                                'or check if vectorSpan value is > (1 / min.framerate) ' +
                                'or may be framerate itself is too low'/*)*/;
E.prototype._makeGhost = function(t) {
    // NB: ensure t is _current_ time, not any other,
    //     many functions below rely on that fact
    var s0, s1,
        t_diff;
    var t_pred = opts.predictSpan;

    // get first and second state to calculate
    // vector from. s0 will hold first state,
    // s1 — second, t_diff — time difference between them
    if (!opts.useSnaps) {
        if (this.__modifying !== null) {
            s0 = this.state;
            s1 = this._state;
        } else {
            s0 = this.state._ || this.state;
            s1 = this.state;
        }
        t_diff = t - s0._appliedAt;
    } else {
        var s = (this.__modifying !== null) ? this._state
                                            : this.state,
            sn0 = s.snap0, sn1 = s.snap1;
        if (!sn0 && !sn1) throw new Error('No vector data available, is this element tracked?');
        var pos = Math.floor(t / opts.vectorSpan);
        if (!sn1) {
            if (pos != sn0._at) throw new Error(E.__vecErrText);
            s0 = sn0; s1 = s;
            t_diff = t - sn0._atT;
        } else {
            var pass_t = t - sn1._atT;
            if (pass_t <= opts.vectorSpan) {
                var span_t = sn1._atT - sn0._atT;
                if (span_t < (opts.vectorSpan - pass_t)) throw new Error(E.__vecErrText);
                var span_pos = span_t - (opts.vectorSpan - pass_t);
                s0 = E._stateBetween(sn0, sn1, span_t, span_pos); s1 = s;
                t_diff = opts.vectorSpan;
            } else {
                s0 = sn1; s1 = s;
                t_diff = pass_t;
            }
        }
    }

    var vec = E._getVect(s0, s1 || s0, t_diff);
    var ghost = E._predictState(s1 || s0, vec, opts.predictSpan);
    ghost._applied = true;
    ghost._appliedAt = t;
    ghost._matrix = E._getMatrixOf(E._mergeStates(this.bstate, ghost), ghost._matrix);
    ghost._vec = vec;
    ghost._tdiff = t_diff;

    this.__ghost = ghost;

    return ghost;
}
E.prototype._defCollides = function(t, elm, func) {

    var prev_src_st = this.state;
    var prev_cmp_st = elm.state;

    var src_ghost = this._makeGhost(t);
    var cmp_ghost = elm._makeGhost(t);

    this.state = src_ghost;
    elm.state  = cmp_ghost;

    var intersects = this.intersects(elm/*, t*/);

    this.state = prev_src_st;
    elm.state  = prev_cmp_st;

    if (intersects) {
        func.call(this, t,
                  src_ghost._tdiff/* === cmp_ghost._tdiff */,
                  src_ghost._vec, cmp_ghost._vec
                  /*, deep_vec*/);
    }

}
/*E.prototype._vecEntersLine = function(vpt0, vpt1, lpt0, lpt1) {
    var S1 = [ vpt1[0] - vpt0[0],
               vpt1[1] - vpt0[1] ],
        S2 = [ lpt1[0] - lpt0[0],
               lpt1[1] - lpt0[1] ];
    var sup = ((vpt0[0] - lpt0[0]) * -S1[1]) -
              ((vpt0[1] - lpt0[1]) * -S1[0]),
        sdn = (S2[0] * -S1[1]) - (S2[1] * -S1[0]),
        s = sup / sdn;
    var tup = (S2[0] * (vpt0[1] - lpt0[1])) -
              (S2[1] * (vpt0[0] - lpt0[0])),
        tdn = sdn,
        t = tup / tdn;
    return (s >= 0) && (s <= 1) &&
           (t >= 0) && (t <= 1);
}*/

E.prototype.__pathAt = function(t) {
    var path = this.xdata.__cpath || this.xdata.path;
    if (!path) throw new Error("No path found for elm " + this.id);
    var mpath = path.duplicate();
    var me = this;
    mpath.vpoints(function(x, y) {
        return me._pradopt([x, y], t);
    });
    return mpath;
}
E.prototype.__pointsAt = function(t) {
    return this._pradopt(this.collectPoints(), t);
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
E.prototype.__ensureTimeTestAllowedFor = function(t) {
    if ((t != null) &&
        (this.__modifying != null)
        && (this.__modifying !== E.EVENT_MOD)) {
        throw new Error('Time-related tests may happen only outside of modifier or inside event handler');
    }
    return true;
}

// TODO: iterate through objects' properties and call function
// for each property
E._getVect = function(s0, s1, t_diff) {
    if (t_diff == 0) return E.createState();
    return {
        'x': (s1.x - s0.x) / t_diff,
        'y': (s1.y - s0.y) / t_diff,
        'lx': (s1.lx - s0.lx) / t_diff,
        'ly': (s1.ly - s0.ly) / t_diff,
        'rx': (s1.rx - s0.rx) / t_diff,
        'ry': (s1.ry - s0.ry) / t_diff,
        'sx': (s1.sx - s0.sx) / t_diff,
        'sy': (s1.sy - s0.sy) / t_diff,
        'angle': (s1.angle - s0.angle) / t_diff,
        'alpha': (s1.alpha - s0.alpha) / t_diff
    }
}
E._stateBetween = function(s0, s1, t_diff, at) {
    if (t_diff == 0) return s0;
    return {
        'x': s0.x + ((s1.x - s0.x) / t_diff) * at,
        'y': s0.y + ((s1.y - s0.y) / t_diff) * at,
        'lx': s0.lx + ((s1.lx - s0.lx) / t_diff) * at,
        'ly': s0.lx + ((s1.ly - s0.ly) / t_diff) * at,
        'rx': s0.rx + ((s1.rx - s0.rx) / t_diff) * at,
        'ry': s0.ry + ((s1.ry - s0.ry) / t_diff) * at,
        'sx': s0.sx + ((s1.sx - s0.sx) / t_diff) * at,
        'sy': s0.sy + ((s1.sy - s0.sy) / t_diff) * at,
        'angle': s0.angle + ((s1.angle - s0.angle) / t_diff) * at,
        'alpha': s0.alpha + ((s1.alpha - s0.alpha) / t_diff) * at
    }
}
E._predictState = function(s1, vec, t_pred) {
    return {
        'x': s1.x + vec.x * t_pred,
        'y': s1.y + vec.y * t_pred,
        'lx': s1.lx + vec.lx * t_pred,
        'ly': s1.ly + vec.ly * t_pred,
        'rx': s1.rx + vec.rx * t_pred,
        'ry': s1.ry + vec.ry * t_pred,
        'sx': s1.sx + vec.sx * t_pred,
        'sy': s1.sy + vec.sy * t_pred,
        'angle': s1.angle + vec.angle * t_pred,
        'alpha': s1.alpha + vec.alpha * t_pred
    }
}

function p_drawCPath(ctx, cPath) {
    if (!(cPath = cPath || this.__cpath)) return;
    cPath.cstroke('#f00', 2.0);
    cPath.apply(ctx);
}
function p_drawAdoptedRect(ctx) {
    var rect = this.$._cpa_rect();
    if (rect) {
        var ratio = ctx.canvas.__pxRatio || 1;
        rect = this.$._pradopt(rect);
        ctx.save();
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // reset
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
        var ratio = ctx.canvas.__pxRatio || 1;
        pts = this.$._pradopt(pts);
        ctx.save();
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // reset
        ctx.fillStyle = '#00f';
        for (var pi = 0, pl = pts.length; pi < pl; pi += 2) {
            ctx.fillRect(pts[pi]-2,pts[pi+1]-2,4,4);
        }
        ctx.restore();
    }
}
/*function p_drawPathAt(ctx) {
    try {
        var p = this.$.__pathAt();
        var ratio = ctx.canvas.__pxRatio || 1;
        ctx.save();
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // reset
        p.fill = Path.BASE_FILL;
        p.stroke = Path.BASE_STROKE;
        p.apply(ctx);
        ctx.restore();
    } catch(e) { };
}*/
function p_drawGhost(ctx) {
    var me = this.$;
    if (me.__ghost && !me.__ghostLock) {
        var ratio = ctx.canvas.__pxRatio || 1;
        ctx.save();
        me.__ghostLock = true;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // reset
        me.__ghost._matrix.apply(ctx);
        ctx.globalAlpha = 0.6;
        me.draw(ctx);
        me.__ghostLock = false;
        ctx.restore();
    }
}
/*function p_drawGhostVec(ctx) {
    var me = this.$;
    if (me.__ghost_m) {
        ctx.save();
        me.__ghost_m.apply(ctx);
        var apt = me._adopt([ -10, 0 ]);
        ctx.beginPath();
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 4;
        ctx.moveTo(0, 0);
        ctx.lineTo(apt[0], apt[1]);
        ctx.stroke();
        ctx.restore();
    }
}*/
var prevAddDebugRender = E.__addDebugRender;
E.__addDebugRender = function(elm) {
    prevAddDebugRender(elm);

    elm.__paint({ type: E.DEBUG_PNT }, p_drawCPath);
    elm.__paint({ type: E.DEBUG_PNT }, p_drawAdoptedRect);
    elm.__paint({ type: E.DEBUG_PNT }, p_drawAdoptedPoints);
    //elm.__paint({ type: E.DEBUG_PNT }, 0, p_drawPathAt);
    elm.__paint({ type: E.DEBUG_PNT }, p_drawGhost);
    //elm.__paint({ type: E.DEBUG_PNT }, 0, p_drawGhostVec);
}

var prevMAfter = E.prototype.__mafter;
E.prototype.__mafter = function(t, type, result) {
    prevMAfter.call(this, t, type, result);
    if (result && (type === E.LAST_MOD)) {
        if (opts.useSnaps && this.track) {
            this.__updateSnaps(t);
        }
        var colTests = this._collisionTests;
        if (colTests && colTests.length > 0) {
            var colElms = this._collisionElms;
            for (var ci = 0, cl = colTests.length;
                 ci < cl; ci++) {
                this._defCollides(t, colElms[ci], colTests[ci]);
            }
            this._collisionTests = [];
            this._collisionElms = [];
        }
    }
}
E.prototype.__updateSnaps = function(t) {
    var pos = Math.floor(t / opts.vectorSpan);
    var s = this.state, _s = this._state;
    if (!s._applied || !s.snap0) {
        _s.snap0 = anm.obj_clone(_s); // FIXME: may be cloning is dangerous for arrays?
        _s.snap0._at = pos;
        _s.snap0._atT = t;
        _s.snap1 = null;
        // assert(pos === 0)
    } else if (s.snap0) {
        var offset0 = pos - s.snap0._at;
        if (!s.snap1 && (pos > 0)) {
            _s.snap1 = anm.obj_clone(_s);
            _s.snap1._at = pos;
            _s.snap1._atT = t;
            // assert(pos > 0)
        } else if ((offset0 > 1) && (pos != s.snap1._at)) {
            // assert(pos > 1)
            _s.snap0 = s.snap1;
            _s.snap1 = anm.obj_clone(_s);
            _s.snap1._at = pos;
            _s.snap1._atT = pos;
            // assert(offset > 0)
        } else {
            _s.snap0 = s.snap0;
            _s.snap1 = s.snap1;
            // assert(pos === s.snap1)
        }
        if (_s.snap1 && ((t - _s.snap1._at) < 0)) {
            _s.snap0 = null;
            _s.snap1 = null;
        }
    }
}

E.prototype._getVects = function(t) {
    // may be called only on __mafter
    var s = this._state,
        s0 = s.snap0, s1 = s.snap1;
    if (!s0 && !s1) throw new Error('No vector data available, is this element tracked?');
    var pos = Math.floor(t / opts.vectorSpan);
    if (!s1) {
        if (pos != s0._at) throw new Error(E.__vecErrText);
        var vec_t = t - s0._at;
        return {
            'mov': [ s0.x, s0.y, s.x, s.y, vec_t ],
            'rot': [ s0.angle, s.angle, vec_t ],
            'scl': [ s0.sx, s0.sy, s.sx, s.sy, vec_t ]
        };
    } else {
        //if (pos != s1._at) throw new Error(E.__vecErrText);
        /*var eps = 0.05 * opts.vectorSpan; // epsilon
        if ((t > (pos - eps)) && (t < (pos + eps)) {
            var vec_t = s1._at - s0._at;
            return {
                'mov': [ s0.x, s0.y, s1.x, s1.y, vec_t ],
                'rot': [ s0.angle, s1.angle, vec_t ],
                'scl': [ s0.sx, s0.sy, s1.sx, s1.sy, vec_t ]
            };
        };*/
        var pass_t = t - s1._at;
        if (pass_t > opts.vectorSpan) { //throw new Error(E.__vecErrText);
            return {
                'mov': [ s1.x, s1.y, s.x, s.y, pass_t ],
                'rot': [ s1.angle, s.angle, pass_t ],
                'scl': [ s1.sx, s1.sy, s.x, s.y, pass_t ]
            };
        }
        var span_t = s1._at - s0._at;
        if (span_t < (opts.vectorSpan - pass_t)) throw new Error(E.__vecErrText);
        var span_pos = span_t - (opts.vectorSpan - pass_t);
        // we take the approx. point between two states as
        // first point and current point as second to
        // make vector time equal to vector span
        var vec_t = opts.vectorSpan;
        // assert(opts.vectorSpan === (span_t - span_pos + pass_t))
        return {
            'mov': [ s0.x + ((s1.x - s0.x) * span_pos),
                     s0.y + ((s1.y - s0.y) * span_pos),
                     s1.x + ((s.x - s1.x) * pass_t),
                     s1.y + ((s.y - s1.y) * pass_t),
                     vec_t ],
            'rot': [ s0.angle + ((s1.angle - s0.angle) * span_pos),
                     s1.angle + ((s.x - s1.x) * pass_t),
                     s1.y + ((s.y - s1.y) * pass_t),
                     vec_t ],
            'scl': [ s0.sx + ((s1.sx - s0.sx) * span_pos),
                     s0.sy + ((s1.sy - s0.sy) * span_pos),
                     s1.sx + ((s.sx - s1.sx) * pass_t),
                     s1.sy + ((s.sy - s1.sy) * pass_t),
                     vec_t ]
        }
    }
    throw new Error(E.__vecErrText);
}

var prev_handle__x = Scene.prototype.handle__x
Scene.prototype.handle__x = function(type, evt) {
    if (opts.mouseBound) {
        if (type & C.XT_MOUSE) {
            switch (type) {
                case C.X_MCLICK: case C.X_MDCLICK: case C.X_MUP: case C.X_MDOWN: {
                    this.visitElems(function(elm) {
                        if (elm.shown &&
                            elm.contains(evt.pos)) elm.fire(type, evt);
                    });
                    return true;
                }
                case C.X_MMOVE: {
                    this.visitElems(function(elm) {
                        if (elm.shown) {
                            if (elm.contains(evt.pos)) {
                                elm.fire(C.X_MMOVE, evt);
                                if (elm.__wout) {
                                    elm.fire(C.X_MOVER, evt);
                                    elm.__wout = false;
                                }
                            } else {
                                if (!elm.__wout) {
                                    elm.fire(C.X_MOUT, evt);
                                    elm.__wout = true;
                                }
                            }
                        }
                    });
                    return true;
                }
                case C.X_MOVER: case C.X_MOUT: { return true; }
            }
        }
    }
    prev_handle__x.call(this, type, evt);
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
G.__edgeTest = function(p1, p2, p3, r2) {
    var rot = [ -(p2[1] - p1[1]),
                  p2[0] - p1[0] ];

    var ref = (rot[0] * (p3[0] - p1[0]) +
               rot[1] * (p3[1] - p1[1])) >= 0;

    for (var i = 0, il = r2.length; i < il; i+=2) {
        if (((rot[0] * (r2[i]   - p1[0]) +
              rot[1] * (r2[i+1] - p1[1])) >= 0) === ref) return false;
    }

    return true;
}
G.__isecRects = function(r1, r2) {
    if (!r1 || !r2) throw new Error('One (or both) of rects / bounds is not accessible');
    if (G.__zeroRect(r1) || G.__zeroRect(r2)) return false;
    var edgeTest = G.__edgeTest;

    var pn, px;
    for (var pi = 0, pl = r1.length; pi < pl; pi += 2) {
        pn = (pi === (pl - 2)) ? 0 : pi + 2; // next point
        px = (pn === (pl - 2)) ? 0 : pn + 2;
        if (edgeTest([r1[pi], r1[pi+1]],
                     [r1[pn], r1[pn+1]],
                     [r1[px], r1[px+1]], r2)) return false;
    }
    for (var pi = 0, pl = r2.length; pi < pl; pi += 2) {
        pn = (pi === (pl - 2)) ? 0 : pi + 2; // next point
        px = (pn === (pl - 2)) ? 0 : pn + 2;
        if (edgeTest([r2[pi], r2[pi+1]],
                     [r2[pn], r2[pn+1]],
                     [r2[px], r2[px+1]], r1)) return false;
    }
    return true;
}
G.__pointsInPath = function(path, pts) {
    for (var pi = 0, pl = pts.length; pi < pl; pi += 2) {
        if (path.contains([pts[pi], pts[pi+1]])) return true;
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