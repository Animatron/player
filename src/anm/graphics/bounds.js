var is = require('../utils.js').is;

/**
 * @class anm.Bounds
 *
 * The holder class for any bounds.
 *
 * @constructor
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
function Bounds(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}
/**
 * @method load
 *
 * Replace current instance values with values from another instance.
 *
 * @param {anm.Bounds} other bounds to load values from
 */
Bounds.prototype.load = function(other) {
    this.x = other.x;
    this.y = other.y;
    this.width = other.width;
    this.height = other.height;
}
/**
 * @private @method loadDiag
 */
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
/** @method minX get minimum X value */
Bounds.prototype.minX = function() { return this.x; }
/** @method minY get minimum Y value */
Bounds.prototype.minY = function() { return this.y; }
/** @method maxX get maximum X value */
Bounds.prototype.maxX = function() { return this.x + this.width; }
/** @method maxY get maximum Y value */
Bounds.prototype.maxY = function() { return this.y + this.height; }
/**
 * @method add
 *
 * Add another bounds, so these bounds will be the union of two
 *
 * @param {anm.Bounds} other bounds to add
 */
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
/**
 * @method addPoint
 *
 * Add another point, so these bounds will include it
 *
 * @param {Object} point point to add
 * @param {Number} point.x X coord of a point
 * @param {Number} point.y Y coord of a point
 */
Bounds.prototype.addPoint = function(pt) {
    this.loadDiag(Math.min(this.minX(), pt.x),
                  Math.min(this.minY(), pt.y),
                  Math.max(this.maxX(), pt.x),
                  Math.max(this.maxY(), pt.y));
}
/**
 * @method toPoints
 *
 * Convert bounds to four corner points
 *
 * @return {[Number]}
 */
Bounds.prototype.toPoints = function() {
    return [
        { x: this.x, y: this.y },
        { x: this.x + this.width, y: this.y },
        { x: this.x + this.width, y: this.y + this.height },
        { x: this.x, y: this.y + this.height }
    ];
}
/**
 * @method exist
 *
 * Are these bounds set
 *
 * @return {Boolean}
 */
Bounds.prototype.exist = function() {
    // if one of the values is NaN, then the whole bounds are invalid?
    return !is.nan(this.x);
}
/**
 * @method clone
 *
 * Clone these bounds
 *
 * @return {anm.Bounds}
 */
Bounds.prototype.clone = function() {
    return new Bounds(this.x, this.y,
                      this.width, this.height);
}
Bounds.NONE = new Bounds(NaN, NaN, NaN, NaN);

module.exports = Bounds;
