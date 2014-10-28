function Bounds(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}
Bounds.prototype.toRect = function() {
    var points = this.toPoints();
    return {
        tl: points[0],
        tr: points[1],
        br: points[2],
        bl: points[3]
    };
}
Bounds.prototype.toPoints = function() {
    return [
        { x: this.x, y: this.y },
        { x: this.x + this.width, y: this.y },
        { x: this.x + this.width, y: this.y + this.height },
        { x: this.x, y: this.y + this.height }
    ];
}
Bounds.prototype.exist = function() {
    // if one of the values is NaN, then the whole bounds are invalid?
    return (this.x === NaN);
}
Bounds.prototype.clone = function() {
    return new Bounds(this.x, this.y,
                      this.width, this.height);
}
Bounds.fromPoints = function(pts) {
    this.x = pts[0].x;
    this.y = pts[0].y;
    this.width = pts[3].x - pts[0].x;
    this.height = pts[3].y - pts[0].y;
}
Bounds.fromRect = function(rect) {
    this.x = rect.tr.x;
    this.y = rect.tr.y;
    this.width = rect.br.x - rect.tr.x;
    this.height = rect.br.y - rect.tr.y;
}
Bounds.NONE = new Bounds(NaN, NaN, NaN, NaN);

module.exports = Bounds;
