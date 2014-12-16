var C = require('../constants.js');

function MSeg(pts) {
    this.pts = pts;
}

MSeg.prototype.draw = function(ctx) {
    ctx.moveTo(this.pts[0], this.pts[1]);
}
// > MSeg.length(start: Array[Int,2]) => Double
MSeg.prototype.length = function(start) {
    return 0;
}
// returns pair, first - distance, second - parameter t that corresponds to given distance
MSeg.prototype.atDist = function(start, dist) {
    return [0, 0];
}
MSeg.prototype.atT = function(start, t) {
    return [ this.pts[0], this.pts[1] ];
}
MSeg.prototype.tangentAt = function(start, t) {
    return 0;
}
MSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
}
MSeg.prototype.toString = function() {
    return "M" + this.pts.join(" ");
}
MSeg.prototype.clone = function() {
    return new MSeg(this.pts);
}

function LSeg(pts) {
    this.pts = pts;
}
LSeg.prototype.draw = function(ctx) {
    ctx.lineTo(this.pts[0], this.pts[1]);
}
LSeg.prototype.length = function(start) {
    var dx = this.pts[0] - start[0];
    var dy = this.pts[1] - start[1];
    return Math.sqrt(dx*dx + dy*dy);
}
LSeg.prototype.atDist = function(start, dist) {
    if (dist <= 0) return [0, 0];
    var length = this.length(start);
    if (dist >= length) return [length, 1];
    return [dist, this.atT(start, dist / this.length(start))];
}
LSeg.prototype.atT = function(start, t) {
    var p0x = start[0];
    var p0y = start[1];
    var p1x = this.pts[0];
    var p1y = this.pts[1];
    return [
        p0x + (p1x - p0x) * t,
        p0y + (p1y - p0y) * t
    ];
}
LSeg.prototype.tangentAt = function(start, t) {
    return Math.atan2(this.pts[1] - start[1],
                      this.pts[0] - start[0]);
}
LSeg.prototype.last = function() {
    return [ this.pts[0], this.pts[1] ];
}
LSeg.prototype.toString = function() {
    return "L" + this.pts.join(" ");
}
LSeg.prototype.clone = function() {
    return new LSeg(this.pts);
}

function CSeg(pts) {
    this.pts = pts;
}
CSeg.prototype.draw = function(ctx) {
    ctx.bezierCurveTo(this.pts[0], this.pts[1], this.pts[2], this.pts[3], this.pts[4], this.pts[5]);
}
CSeg.prototype.atDist = function(start, dist) {
    /* FIXME: cache length data and points somewhere */
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
}
CSeg.prototype.length = function(start) {
    return this.atDist(start, Number.MAX_VALUE)[0];
}
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
}
CSeg.prototype.last = function() {
    return [ this.pts[4], this.pts[5] ];
}
CSeg.prototype.tangentAt = function(start, t) {
    if (t < 0) t = 0;
    if (t > 1) t = 1;

    var a = 3 * (1 - t) * (1 - t);
    var b = 6 * (1 - t) * t;
    var c = 3 * t * t;

    return Math.atan2(a * (this.pts[1] - start[1]) + b * (this.pts[3] - this.pts[1]) + c * (this.pts[5] - this.pts[3]), a * (this.pts[0] - start[0]) + b * (this.pts[2] - this.pts[0]) + c * (this.pts[4] - this.pts[2]));
}
CSeg.prototype._ensure_params = function(start) {
    if (this._lstart &&
        (this._lstart[0] === start[0]) &&
        (this._lstart[1] === start[1])) return;
    this._lstart = start;
    this._params = this._calc_params(start);
}
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
}
CSeg.prototype.clone = function() {
    return new CSeg(this.pts);
}
CSeg.prototype.toString = function() {
    return "C" + this.pts.join(" ");
}

module.exports = {
  MSeg: MSeg,
  LSeg: LSeg,
  CSeg: CSeg
}
