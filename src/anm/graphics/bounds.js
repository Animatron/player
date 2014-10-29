function Bounds(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}
Bounds.prototype.load = function(other) {
    this.x = other.x;
    this.y = other.y;
    this.width = other.width;
    this.height = other.height;
}
Bounds.prototype.loadDiag = function(x1, y1, x2, y2) {
    if (x2 < x1) {
        var t = x1; x1 = x2; x2 = t;
    }
    if (y2 < y1) {
        var t = y1; y1 = y2; y2 = t;
    }
    this.x = x1;
    this.y = y1;
    this.width = x2 - x1;
    this.height = y2 - y1;
}
Bounds.prototype.loadRect = function(rect) {
    this.loadDiag(rect.tr.x, rect.tr.y,
                  rect.bl.x, rect.bl.y);
}
Bounds.prototype.minX = function() { return this.x; }
Bounds.prototype.minY = function() { return this.y; }
Bounds.prototype.maxX = function() { return this.x + this.width; }
Bounds.prototype.maxY = function() { return this.y + this.height; }
Bounds.prototype.add = function(other) {
    if (!other.exist()) return;
    if (this.exist()) {
        this.loadDiag(Math.min(this.minX(), other.minX()),
                      Math.min(this.minY(), other.minY()),
                      Math.max(this.maxX(), other.maxX()),
                      Math.max(this.maxY(), other.maxY()));
    } else {
        this.load(other);
    }
}
Bounds.prototype.addRect = function(rect) {
    if (this.exist()) {
        this.loadDiag(Math.min(this.minX(), rect.tl.x),
                      Math.min(this.minY(), rect.tl.y),
                      Math.max(this.maxX(), rect.br.x),
                      Math.max(this.maxY(), rect.br.y));
    } else {
        this.loadRect(rect);
    }
}
Bounds.prototype.addPoint = function(pt) {
    this.loadDiag(Math.min(this.minX(), pt.x),
                  Math.min(this.minY(), pt.y),
                  Math.max(this.maxX(), pt.x),
                  Math.max(this.maxY(), pt.y));
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
Bounds.fromRect = function(rect) {
    var bounds = new Bounds();
    bounds.loadRect(rect);
    return bounds;
}
Bounds.fromPoints = function(pts) {
    var bounds = new Bounds();
    bounds.loadDiag(pts[0].x, pts[0].y,
                    pts[2].x, pts[2].y);
    return bounds;
}
Bounds.NONE = new Bounds(NaN, NaN, NaN, NaN);

module.exports = Bounds;
