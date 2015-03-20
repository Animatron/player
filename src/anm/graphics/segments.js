var C = require('../constants.js');

/**
 * @class anm.MSeg
 *
 * Represents Move Segment of an SVG-compatible curve. Takes one point to move to.
 *
 * See {@link anm.LSeg LSeg}, {@link anm.CSeg CSeg}, {@link anm.Path Path};
 *
 * @constuctor
 *
 * @param {Array[Number]} pts point to initialize with, in format `[x, y]`
 */
function MSeg(pts) {
    this.pts = pts;
};
/**
 * @method draw
 *
 * Apply this segment to a given context
 *
 * @param {Context2D} ctx context to draw
 */
MSeg.prototype.draw = function(ctx) {
    ctx.moveTo(this.pts[0], this.pts[1]);
};
/**
 * @method length
 *
 * Find length of a segment, in pixels. Needs to know a start point,
 * which is usually a last point of a previous segment or [0, 0].
 * For Move Segment it's always 0.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 *
 * @return Number segment length
 */
MSeg.prototype.length = function(start) {
    return 0;
};
/**
 * @method findT
 *
 * Find `t` parameter in range `[0, 1]` corresponding to a given distance `dist` in pixels.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0]. For Move Segment it's always 0.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} dist distance, in pixels
 *
 * @return {Number} `t` in a range of `[0..1]`
 */
MSeg.prototype.findT = function(start, dist) {
    return 0;
};
/**
 * @method atDist
 *
 * Find a point located at given distance `dist` in pixels.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0]. For Move Segment it's always a point
 * it was initialized with.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} dist distance, in pixels
 *
 * @return {Array[Number]} point in format `[x, y]`
 */
MSeg.prototype.atDist = function(start, dist) {
    return this.atT(start, null);
};
/**
 * @method atT
 *
 * Find a point located at given distance `t`, which is specified in range of
 * `[0..1]` where `0` is first point of a segment and `1` is the last.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0]. For Move Segment it's always a point
 * it was initialized with.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} t `t` parameter, in range of `[0..1]`
 *
 * @return {Array[Number]} point in format `[x, y]`
 */
MSeg.prototype.atT = function(start, t) {
    return [ this.pts[0], this.pts[1] ];
};
/**
 * @method tangentAt
 *
 * Find a tangent at given distance `t`, which is specified in range of
 * `[0..1]` where `0` is first point of a segment and `1` is the last.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or `[0, 0]`. For Move Segment it's always `0`.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} t `t` parameter, in range of `[0..1]`
 *
 * @return {Number} tangent at given distance
 */
MSeg.prototype.tangentAt = function(start, t) {
    return 0;
};
/**
 * @method crossings
 *
 * Calculates the number of crossings for move segment.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} x X-coordinate of a point to check for crossings
 * @param {Number} y Y-coordinate of a point to check for crossings
 *
 * @return {Number} number of crossings
 */
MSeg.prototype.crossings = function(start, x, y) {
    return 0;
};
/**
 * @method last
 *
 * Get last point of a segment. For Move Segment it's always a point it was initialized with.
 *
 * @return {Array[Number]} last point in format `[x, y]`
 */
MSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
};
MSeg.prototype.toString = function() {
    return "M" + this.pts.join(" ");
};
/**
 * @method clone
 *
 * Clone this segment.
 *
 * @return {anm.MSeg} clone
 */
MSeg.prototype.clone = function() {
    return new MSeg(this.pts);
};

/**
 * @class anm.LSeg
 *
 * Represents Line Segment of an SVG-compatible curve. Takes one point as an end of a line.
 *
 * See {@link anm.MSeg MSeg}, {@link anm.CSeg CSeg}, {@link anm.Path Path};
 *
 * @constuctor
 *
 * @param {Array[Number]} pts points to initialize with, in format `[x, y]`
 */
function LSeg(pts) {
    this.pts = pts;
};
/**
 * @method draw
 *
 * Apply this segment to a given context
 *
 * @param {Context2D} ctx context to draw
 */
LSeg.prototype.draw = function(ctx) {
    ctx.lineTo(this.pts[0], this.pts[1]);
};
/**
 * @method length
 *
 * Find length of a segment, in pixels. Needs to know a start point,
 * which is usually a last point of a previous segment or [0, 0].
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 *
 * @return Number segment length
 */
LSeg.prototype.length = function(start) {
    var dx = this.pts[0] - start[0];
    var dy = this.pts[1] - start[1];
    return Math.sqrt(dx*dx + dy*dy);
};
/**
 * @method findT
 *
 * Find `t` parameter in range `[0, 1]` corresponding to a given distance `dist` in pixels.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0].
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} dist distance, in pixels
 *
 * @return {Number} `t` in a range of `[0..1]`
 */
LSeg.prototype.findT = function(start, dist) {
    if (dist <= 0) return 0;
    var length = this.length(start);
    if (dist >= length) return 1;
    return dist / length;
};
/**
 * @method atDist
 *
 * Find a point located at given distance `dist` in pixels.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0].
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} dist distance, in pixels
 *
 * @return {Array[Number]} point in format `[x, y]`
 */
LSeg.prototype.atDist = function(start, dist) {
    return this.atT(start, this.findT(start, dist));
};
/**
 * @method atT
 *
 * Find a point located at given distance `t`, which is specified in range of
 * `[0..1]` where `0` is first point of a segment and `1` is the last.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0].
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} t `t` parameter, in range of `[0..1]`
 *
 * @return {Array[Number]} point in format `[x, y]`
 */
LSeg.prototype.atT = function(start, t) {
    var p0x = start[0];
    var p0y = start[1];
    var p1x = this.pts[0];
    var p1y = this.pts[1];
    return [
        p0x + (p1x - p0x) * t,
        p0y + (p1y - p0y) * t
    ];
};
/**
 * @method tangentAt
 *
 * Find a tangent at given distance `t`, which is specified in range of
 * `[0..1]` where `0` is first point of a segment and `1` is the last.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or `[0, 0]`.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} t `t` parameter, in range of `[0..1]`
 *
 * @return {Number} tangent at given distance
 */
LSeg.prototype.tangentAt = function(start, t) {
    return Math.atan2(this.pts[1] - start[1],
                      this.pts[0] - start[0]);
};
/**
 * @method crossings
 *
 * Calculates the number of times the line from (x0,y0) to (x1,y1)
 * crosses the ray extending to the right from (px,py).
 * If the point lies on the line, then no crossings are recorded.
 * +1 is returned for a crossing where the Y coordinate is increasing
 * -1 is returned for a crossing where the Y coordinate is decreasing
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} x X-coordinate of a point to check for crossings
 * @param {Number} y Y-coordinate of a point to check for crossings
 *
 * @return {Number} number of crossings
 */
LSeg.prototype.crossings = function(start, x, y) {
    return Crossings.line(x, y, start[0], start[1],
                          this.pts[0], this.pts[1]);
};
/**
 * @method last
 *
 * Get last point of a segment. For Line Segment it's always a point it was initialized with.
 *
 * @return {Array[Number]} last point in format `[x, y]`
 */
LSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
};
LSeg.prototype.toString = function() {
    return "L" + this.pts.join(" ");
};
/**
 * @method clone
 *
 * Clone this segment.
 *
 * @return {anm.LSeg} clone
 */
LSeg.prototype.clone = function() {
    return new LSeg(this.pts);
};

/**
 * @class anm.CSeg
 *
 * Represents Curve Segment of an SVG-compatible curve. Takes three points of a curve.
 *
 * See {@link anm.MSeg MSeg}, {@link anm.LSeg LSeg}, {@link anm.Path Path};
 *
 * @constuctor
 *
 * @param {Array[Number]} pts points to initialize with, in format `[x, y, x, y, ...]`
 */
function CSeg(pts) {
    this.pts = pts;
    this._cachedStart = null;
    this._length = 0;
};
/**
 * @method draw
 *
 * Apply this segment to a given context
 *
 * @param {Context2D} ctx context to draw
 */
CSeg.prototype.draw = function(ctx) {
    ctx.bezierCurveTo(this.pts[0], this.pts[1], this.pts[2], this.pts[3], this.pts[4], this.pts[5]);
};
/**
 * @method length
 *
 * Find length of a segment, in pixels. Needs to know a start point,
 * which is usually a last point of a previous segment or [0, 0].
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 *
 * @return Number segment length
 */
CSeg.prototype.length = function(start) {
    if (this._cachedStart && ((this._cachedStart[0] === start[0]) &&
                              (this._cachedStart[1] === start[1]))) return this._length;
    this._cachedStart = start;
    return (this._length = this.findLengthAndT(start, Number.MAX_VALUE)[0]);
};
/**
 * @method findT
 *
 * Find `t` parameter in range `[0, 1]` corresponding to a given distance `dist` in pixels.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0].
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} dist distance, in pixels
 *
 * @return {Number} `t` in a range of `[0..1]`
 */
CSeg.prototype.findT = function(start, dist) {
    return this.findLengthAndT(start, dist)[1];
};
CSeg.prototype.findLengthAndT = function(start, dist) {
    var positions = this.pts;
    var p0x = start[0];
    var p0y = start[1];
    var p1x = positions[0];
    var p1y = positions[1];
    var p2x = positions[2];
    var p2y = positions[3];
    var p3x = positions[4];
    var p3y = positions[5];

    var p0to1 = Math.sqrt(Math.pow(p1x-p0x, 2) + Math.pow(p1y-p0y, 2));
    var p1to2 = Math.sqrt(Math.pow(p2x-p1x, 2) + Math.pow(p2y-p1y, 2));
    var p2to3 = Math.sqrt(Math.pow(p3x-p2x, 2) + Math.pow(p3y-p2y, 2));

    var len = p0to1 + p1to2 + p2to3 + 1;

    // choose the step as 1/len
    var dt = 1.0 / len;

    var q1 = 3 * dt;
    var q2 = q1 * dt;
    var q3 = dt * dt * dt;
    var q4 = 2 * q2;
    var q5 = 6 * q3;

    var q6x = p0x - 2 * p1x + p2x;
    var q6y = p0y - 2 * p1y + p2y;

    var q7x = 3 * (p1x - p2x) - p0x + p3x;
    var q7y = 3 * (p1y - p2y) - p0y + p3y;

    var bx = p0x;
    var by = p0y;

    var dbx = (p1x - p0x) * q1 + q6x * q2 + q3 * q7x;
    var dby = (p1y - p0y) * q1 + q6y * q2 + q3 * q7y;

    var ddbx = q6x * q4 + q7x * q5;
    var ddby = q6y * q4 + q7y * q5;

    var dddbx = q7x * q5;
    var dddby = q7y * q5;

    var length = 0;
    for (var idx = 0; idx < len; idx++) {
        var px = bx;
        var py = by;

        bx += dbx;
        by += dby;

        dbx += ddbx;
        dby += ddby;

        ddbx += dddbx;
        ddby += dddby;

        length += Math.sqrt((bx - px) * (bx - px) + (by - py) * (by - py));
        if (length >= dist) {
            return [length, dt * idx];
        }
    }
    return [length, 1];
};
/**
 * @method atDist
 *
 * Find a point located at given distance `dist` in pixels.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0]. For Move Segment it's always a point
 * it was initialized with.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} dist distance, in pixels
 *
 * @return {Array[Number]} point in format `[x, y]`
 */
CSeg.prototype.atDist = function(start, dist) {
    return this.atT(start, this.findT(start, dist));
};
/**
 * @method atT
 *
 * Find a point located at given distance `t`, which is specified in range of
 * `[0..1]` where `0` is first point of a segment and `1` is the last.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or [0, 0]. For Move Segment it's always a point
 * it was initialized with.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} t `t` parameter, in range of `[0..1]`
 *
 * @return {Array[Number]} point in format `[x, y]`
 */
CSeg.prototype.atT = function(start, t) {
    var tt = t * t,       // t^2
        ttt = tt * t,      // t^3
        t1 = 1 - t,       // 1-t
        tt1 = t1 * t1,     // (1-t)^2
        tt2 = tt1 * t1,    // (1-t)^3
        tt3 = 3 * t * tt1,   // 3*t*(1-t)^2
        tt4 = 3 * tt * t1;   // 3*t^2*(1-t)

    return [ start[0] * tt2 + this.pts[0] * tt3 + this.pts[2] * tt4 + this.pts[4] * ttt,
             start[1] * tt2 + this.pts[1] * tt3 + this.pts[3] * tt4 + this.pts[5] * ttt ];
};
/**
 * @method tangentAt
 *
 * Find a tangent at given distance `t`, which is specified in range of
 * `[0..1]` where `0` is first point of a segment and `1` is the last.
 * Needs to know a start point, which is usually a last point of a
 * previous segment or `[0, 0]`.
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} t `t` parameter, in range of `[0..1]`
 *
 * @return {Number} tangent at given distance
 */
CSeg.prototype.tangentAt = function(start, t) {
    if (t < 0) t = 0;
    if (t > 1) t = 1;

    var a = 3 * (1 - t) * (1 - t);
    var b = 6 * (1 - t) * t;
    var c = 3 * t * t;

    return Math.atan2((a * (this.pts[1] - start[1])) +
                      (b * (this.pts[3] - this.pts[1])) +
                      (c * (this.pts[5] - this.pts[3])),
                      // -------------------------------
                      (a * (this.pts[0] - start[0])) +
                      (b * (this.pts[2] - this.pts[0])) +
                      (c * (this.pts[4] - this.pts[2])));
};
/**
 * @method crossings
 *
 * Calculates the number of times the cubic from (x0,y0) to (x1,y1)
 * crosses the ray extending to the right from (px,py).
 * If the point lies on a part of the curve,
 * then no crossings are counted for that intersection.
 * the level parameter should be 0 at the top-level call and will count
 * up for each recursion level to prevent infinite recursion
 * +1 is added for each crossing where the Y coordinate is increasing
 * -1 is added for each crossing where the Y coordinate is decreasing
 *
 * @param {Array[Number]} start start point in format `[x, y]`
 * @param {Number} x X-coordinate of a point to check for crossings
 * @param {Number} y Y-coordinate of a point to check for crossings
 *
 * @return {Number} number of crossings
 */
CSeg.prototype.crossings = function(start, x, y) {
    var pts = this.pts;
    return Crossings.curve(x, y, start[0], start[1],
                           pts[0], pts[1],
                           pts[2], pts[3],
                           pts[4], pts[5],
                           0);
};
/**
 * @method last
 *
 * Get last point of a segment.
 *
 * @return {Array[Number]} last point in format `[x, y]`
 */
CSeg.prototype.last = function() {
    return [ this.pts[4], this.pts[5] ];
};
CSeg.prototype._ensure_params = function(start) {
    if (this._lstart &&
        (this._lstart[0] === start[0]) &&
        (this._lstart[1] === start[1])) return;
    this._lstart = start;
    this._params = this._calc_params(start);
};
CSeg.prototype._calc_params = function(start) {
    // See http://www.planetclegg.com/projects/WarpingTextToSplines.html
    var pts = this.pts;
    var params = [];
    var p0x = start[0];
    var p0y = start[1];
    var p1x = pts[0];
    var p1y = pts[1];
    var p2x = pts[2];
    var p2y = pts[3];
    var p3x = pts[4];
    var p3y = pts[5];

    params[0] = p3x - 3*p2x + 3*p1x - p0x;  // A = x3 - 3 * x2 + 3 * x1 - x0
    params[1] = 3*p2x - 6*p1x + 3*p0x;      // B = 3 * x2 - 6 * x1 + 3 * x0
    params[2] = 3*p1x - 3*p0x;              // C = 3 * x1 - 3 * x0
    params[3] = p0x;                        // D = x0

    params[4] = p3y - 3*p2y + 3*p1y - p0y;  // E = y3 - 3 * y2 + 3 * y1 - y0
    params[5] = 3*p2y - 6*p1y + 3*p0y;      // F = 3 * y2 - 6 * y1 + 3 * y0
    params[6] = 3*p1y - 3*p0y;              // G = 3 * y1 - 3 * y0
    params[7] = p0y;                        // H = y0

    return params;
};
/**
 * @method clone
 *
 * Clone this segment.
 *
 * @return {anm.CSeg} clone
 */
CSeg.prototype.clone = function() {
    return new CSeg(this.pts);
};
CSeg.prototype.toString = function() {
    return "C" + this.pts.join(" ");
};

var Crossings = {
    curve: function(px, py, x0, y0,
                    xc0, yc0, xc1, yc1,
                    x1, y1, level) {
        if (py < y0 && py < yc0 && py < yc1 && py < y1) return 0;
        if (py >= y0 && py >= yc0 && py >= yc1 && py >= y1) return 0;
        // Note y0 could equal yc0...
        if (px >= x0 && px >= xc0 && px >= xc1 && px >= x1) return 0;
        if (px < x0 && px < xc0 && px < xc1 && px < x1) {
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
        if (level > 52) return Crossings.line(px, py, x0, y0, x1, y1);
        var xmid = (xc0 + xc1) / 2;
        var ymid = (yc0 + yc1) / 2;
        xc0 = (x0 + xc0) / 2;
        yc0 = (y0 + yc0) / 2;
        xc1 = (xc1 + x1) / 2;
        yc1 = (yc1 + y1) / 2;
        var xc0m = (xc0 + xmid) / 2;
        var yc0m = (yc0 + ymid) / 2;
        var xmc1 = (xmid + xc1) / 2;
        var ymc1 = (ymid + yc1) / 2;
        xmid = (xc0m + xmc1) / 2;
        ymid = (yc0m + ymc1) / 2;
        if (isNaN(xmid) || isNaN(ymid)) {
            // [xy]mid are NaN if any of [xy]c0m or [xy]mc1 are NaN
            // [xy]c0m or [xy]mc1 are NaN if any of [xy][c][01] are NaN
            // These values are also NaN if opposing infinities are added
            return 0;
        }
        return (Crossings.curve(px, py,
                x0, y0, xc0, yc0,
                xc0m, yc0m, xmid, ymid, level + 1) +
                Crossings.curve(px, py,
                        xmid, ymid, xmc1, ymc1,
                        xc1, yc1, x1, y1, level + 1));

    },
    line: function(px, py, x0, y0, x1, y1) {
        if (py < y0 && py < y1) return 0;
        if (py >= y0 && py >= y1) return 0;
        // assert(y0 != y1);
        if (px >= x0 && px >= x1) return 0;
        if (px < x0 && px < x1) return (y0 < y1) ? 1 : -1;
        var xintercept = x0 + (py - y0) * (x1 - x0) / (y1 - y0);
        if (px >= xintercept) return 0;
        return (y0 < y1) ? 1 : -1;
    }
};

module.exports = {
    MSeg: MSeg,
    LSeg: LSeg,
    CSeg: CSeg,
    Crossings: Crossings
};
