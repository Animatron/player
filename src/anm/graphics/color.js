var utils = require('../utils.js'),
    is = utils.is;
//a set of functions for parsing, converting and intepolating color values

/**
 * @class anm.Color
 *
 * A collection of static helpers to work with color values
 */
var Color = {};
Color.TRANSPARENT  = 'transparent';
// TODO: Color.RED, Color.BLUE, ....
Color.HEX_RE       = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i;
Color.HEX_SHORT_RE = /^#?([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])$/i;
Color.RGB_RE       = /^rgb\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i;
Color.RGBA_RE      = /^rgba\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*(\d*[.]?\d+)\s*\)$/i;
Color.HSL_RE       = /^hsl\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*%\s*,\s*([0-9]{1,3})\s*%\s*\)$/i;
Color.HSLA_RE      = /^hsla\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*%\s*,\s*([0-9]{1,3})\s*%\s*,\s*(\d*[.]?\d+)\s*\)$/i;
/**
 * @static @method from
 *
 * Get {@link anm.Brush Brush}-compatible object from a color string (in any
 * CSS-compatible format, except named colors and `#rgb` instead of `#rrggbb`)
 *
 * @param {String} source
 * @return {Object} result
 * @return {Number} return.r Red value
 * @return {Number} return.g Green value
 * @return {Number} return.b Blue value
 * @return {Number} return.a Alpha value
 */
Color.from = function(test) {
    return is.str(test) ? Color.fromStr(test) : (test.r && test);
};
/** @static @private @method fromStr */
Color.fromStr = function(str) {
    return Color.fromHex(str) ||
        Color.fromRgb(str) ||
        Color.fromRgba(str) ||
        Color.fromHsl(str) ||
        { r: 0, g: 0, b: 0, a: 0};
};
/** @static @private @method fromHex */
Color.fromHex = function(hex) {
    if (hex[0] !== '#') return null;
    var result = Color.HEX_RE.exec(hex);
    if (result) {
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 1
        };
    }
    result = Color.HEX_SHORT_RE.exec(hex);
    return result ? {
        r: parseInt(result[1] + result[1], 16),
        g: parseInt(result[2] + result[2], 16),
        b: parseInt(result[3] + result[3], 16),
        a: 1
    } : null;
};
/** @static @private @method fromRgb */
Color.fromRgb = function(rgb) {
    if (rgb.indexOf('rgb(') !== 0) return null;
    var result = Color.RGB_RE.exec(rgb);
    return result ? {
        r: parseInt(result[1]),
        g: parseInt(result[2]),
        b: parseInt(result[3]),
        a: 1
    } : null;
};
/** @static @private @method fromRgba */
Color.fromRgba = function(rgba) {
    if (rgba.indexOf('rgba(') !== 0) return null;
    var result = Color.RGBA_RE.exec(rgba);
    return result ? {
        r: parseInt(result[1]),
        g: parseInt(result[2]),
        b: parseInt(result[3]),
        a: parseFloat(result[4])
    } : null;
};

/** @static @private @method fromHsl */
Color.fromHsl = function(hsl) {
    if (hsl.indexOf('hsl(') !== 0) return null;
    var result = Color.HSL_RE.exec(hsl);
    return result ? Color.fromHslVal(
        parseInt(result[1]) / 180 * Math.PI,
        parseInt(result[2]) / 100,
        parseInt(result[3]) / 100
    ) : null;
};
/** @static @private @method fromHsla */
Color.fromHsla = function(hsla) {
    if (hsla.indexOf('hsla(') !== 0) return null;
    var result = Color.HSLA_RE.exec(hsl);
    if (!result) return null;
    result = Color.fromHslVal(
        parseInt(result[1]) / 180 * Math.PI,
        parseInt(result[2]) / 100,
        parseInt(result[3]) / 100
    );
    result.a = parseFloat(result[4]);
    return result;
};
/**
 * @static @method fromHslVal
 *
 * Get {@link anm.Brush Brush}-compatible object from HSL values
 *
 * @param {Number} hue hue
 * @param {Number} sat saturation
 * @param {Number} light light
 * @return {Object} result
 * @return {Number} return.r Red value
 * @return {Number} return.g Green value
 * @return {Number} return.b Blue value
 * @return {Number} return.a Alpha value
 */
Color.fromHslVal = function(hue, sat, light) {
    var hueToRgb = Color.hueToRgb;
    var t2;
    if (light <= 0.5) {
        t2 = light * (sat + 1);
    } else {
        t2 = light + sat - (light * sat);
    }
    var t1 = light * 2 - t2;
    return { r: hueToRgb(t1, t2, hue + 2),
        g: hueToRgb(t1, t2, hue),
        b: hueToRgb(t1, t2, hue - 2),
        a: 1 };

};
/** @static @private @method hueToRgb */
Color.hueToRgb = function(t1, t2, hue) {
    if (hue < 0) hue += 6;
    if (hue >= 6) hue -= 6;
    if (hue < 1) return (t2 - t1) * hue + t1;
    else if (hue < 3) return t2;
    else if (hue < 4) return (t2 - t1) * (4 - hue) + t1;
    else return t1;
};
/**
 * @static @method rgb
 *
 * Convert RGB values to CSS-compatible string
 *
 * @param {Number} r Red value
 * @param {Number} g Green value
 * @param {Number} b Blue value
 * @return {String} result
 */
Color.rgb = function(r, g, b) {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
};
/**
 * @static @method rgba
 *
 * Convert RGB values to CSS-compatible string
 *
 * @param {Number} r Red value
 * @param {Number} g Green value
 * @param {Number} b Blue value
 * @param {Number} a Alpha value
 * @return {String} result
 */
Color.rgba = function(r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' +
           (is.defined(a) ? a.toFixed(2) : 1.0) + ')';
};
/**
 * @static @method hsl
 *
 * Convert HSL values to CSS-compatible string
 *
 * @param {Number} h Hue value, in radians
 * @param {Number} s Saturation value
 * @param {Number} l Light value
 * @return {String} result
 */
Color.hsl = function(h, s, l) {
    return Color.dhsl(h / Math.PI * 180, s, l);
};
/**
 * @static @method dhsl
 *
 * Convert DHSL values to CSS-compatible string
 *
 * @param {Number} h Hue value, in degrees
 * @param {Number} s Saturation value
 * @param {Number} l Light value
 * @return {String} result
 */
Color.dhsl = function(dh, s, l) {
    return 'hsl(' + Math.floor(dh) + ',' +
                    Math.floor(s * 100) + '%,' +
                    Math.floor(l * 100) + '%)';
};
/**
 * @static @method hsla
 *
 * Convert HSLA values to CSS-compatible string
 *
 * @param {Number} h Hue value, in radians
 * @param {Number} s Saturation value
 * @param {Number} l Light value
 * @param {Number} a Alpha value
 * @return {String} result
 */
Color.hsla = function(h, s, l, a) {
    return Color.dhsla(h / Math.PI * 180, s, l, a);
};
/**
 * @static @method dhsla
 *
 * Convert DHSLA values to CSS-compatible string
 *
 * @param {Number} h Hue value, in radians
 * @param {Number} s Saturation value
 * @param {Number} l Light value
 * @param {Number} a Alpha value
 * @return {String} result
 */
Color.dhsla = function(dh, s, l, a) {
    return 'hsla('+ Math.floor(dh) + ',' +
                    Math.floor(s * 100) + '%,' +
                    Math.floor(l * 100) + '%,' +
                    (is.defined(a) ? a.toFixed(2) : 1.0) + ')';
};
/** @static @private @method adapt */
Color.adapt = function(color) {
    if (!color) return null;
    if (is.str(color)) return color;
    // "r" is reserved for gradients, so we test for "g" to be sure
    if (is.defined(color.g)) return Color.toRgbaStr(color);
    if (is.defined(color.h)) return Color.toHslaStr(color);
};
/** @static @private @method toRgbaStr */
Color.toRgbaStr = function(color) {
    return Color.rgba(color.r,
                      color.g,
                      color.b,
                      color.a);
};
/** @static @private @method toHslaStr */
Color.toHslaStr = function(color) {
    return Color.hsla(color.h,
                      color.s,
                      color.l,
                      color.a);
};
/**
 * @static @method interpolate
 *
 * Find a color located at a given distance between two given colors
 *
 * See {@link anm.Brush#static-method-interpolate Brush.interpolate()}
 *
 * @param {anm.Color} c1 starting value of a color
 * @param {anm.Color} c2 final value of a color
 * @param {Number} t distance between colors, `0..1`
 * @return {anm.Color} color located at a given distance between two given colors
 */
Color.interpolate = function(c1, c2, t) {
    return {
        r: Math.round(utils.interpolateFloat(c1.r, c2.r, t)),
        g: Math.round(utils.interpolateFloat(c1.g, c2.g, t)),
        b: Math.round(utils.interpolateFloat(c1.b, c2.b, t)),
        a: utils.interpolateFloat(c1.a, c2.a, t)
    };
};

module.exports = Color;
