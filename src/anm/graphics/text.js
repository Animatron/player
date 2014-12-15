var C = require('../constants.js'),
    is = require('../utils.js').is,
    SystemError = require('../errors.js').SystemError;

var engine = require('engine');

var Brush = require('./brush.js');

var Bounds = require('./bounds.js');

// TODO: new Text("My Text").font("Arial").size(5).bold()

/**
 * @class anm.Text
 *
 * Controls Text to operate a single or several lines of text.
 *
 * Examples:
 *
 * * `var text = new Text('Hello');`
 * * `var text = new Text('Hello').font('Arial');`
 * * `var text = new Text('Hello').font('12px Arial italic');`
 * * `var text = new Text(['Hello', 'Hello', 'Is there anybody in there?']).align(C.TA_CENTER);`
 *
 * See: {@link anm.Element#text Element.text()}
 *
 * @constructor
 *
 * @param {String|[String]} lines lines to init with, one or several
 * @param {String} [font] font description in CSS format, i.e. `Arial` or `12px Arial bold`
 * @param {C.TA_*} [align] text align, one of `C.TA_LEFT` (default), `C.TA_RIGHT` or `C.TA_CENTER`
 * @param {C.BL_*} [baseline] text baseline, one of `C.BL_MIDDLE` (default), `C.BL_TOP`, `C.BL_BOTTOM`, `C.BL_ALPHABETIC`, `C.BL_IDEOGRAPHIC`, `C.BL_ALPHABETIC`
 * @param {Boolean} [underlined] is text underlined
 *
 * @return {anm.Text}
 */
function Text(lines, font, align, baseline, underlined) {
    this.lines = lines;
    this.$font = font || Text.DEFAULT_FONT;
    this.$align = align || Text.DEFAULT_ALIGN;
    this.baseline = baseline || Text.DEFAULT_BASELINE;
    this.underlined = is.defined(underlined) ? underlined : Text.DEFAULT_UNDERLINE;
    this.size = -1;
    this.$bounds = null;
}

Text.DEFAULT_FFACE = 'sans-serif';
Text.DEFAULT_FSIZE = 24;
Text.DEFAULT_FONT = Text.DEFAULT_FSIZE + 'px ' + Text.DEFAULT_FFACE;
Text.DEFAULT_ALIGN = C.TA_LEFT;
Text.DEFAULT_BASELINE = C.BL_MIDDLE; // FIXME: also change to middle?
Text.DEFAULT_UNDERLINE = false;

Text.__measuring_f = engine.createTextMeasurer();

/**
 * @method apply
 *
 * Apply this text to a given 2D context with given fill / stroke / shadow
 *
 * Example: `text.apply(ctx, Brush.fill('#ff0000'), Brush.stroke('#00ff00', 2))`
 *
 * @param {Context2D} ctx where to apply
 * @param {anm.Brush} fill fill to use
 * @param {anm.Brush} stroke stroke to use
 * @param {anm.Brush} shadow shadow to use
 *
 * @return {anm.Text} itself
 */
Text.prototype.apply = function(ctx, fill, stroke, shadow) {
    var bounds = this.bounds(),
        height = (bounds.height / this.lineCount()),
        underlined = this.underlined;

    ctx.font = this.$font;
    ctx.textBaseline = this.baseline || Text.DEFAULT_BASELINE;
    ctx.textAlign = this.$align || Text.DEFAULT_ALIGN;

    var ascent = this.ascent(height, ctx.textBaseline);

    var x = this.xOffset(bounds.width, ctx.textAlign),
        y;
    if (shadow) { shadow.apply(ctx); } else { Brush.clearShadow(ctx); }
    if (fill) {
        fill.apply(ctx);
        y = 0;
        this.visitLines(function(line) {
            ctx.fillText(line, x, y+ascent);
            y += height;
        });
    } else { Brush.clearFill(ctx); }
    if (shadow) { Brush.clearShadow(ctx); }
    if (stroke) {
        stroke.apply(ctx);
        y = 0;
        this.visitLines(function(line) {
            ctx.strokeText(line, x, y+ascent);
            y += height;
        });
    } else { Brush.clearStroke(ctx); }
    if (underlined && fill) {
        y = 0;
        Brush.stroke(ctx, fill); // passing fill is intentional,
                                 // stroke should have a color of a fill
        ctx.lineWidth = 1;
        var line_bounds = null,
            line_width = 0,
            me = this;
        this.visitLines(function(line) {
            line_bounds = Text.bounds(me, line);
            line_width = line_bounds.width;
            ctx.beginPath();
            ctx.moveTo(x, y + height);      // not entirely correct
            ctx.lineTo(line_width, y + height);
            ctx.stroke();

            y += height;
        });
    }
}
/**
 * @method font
 * @chainable
 *
 * Change the font of a text
 *
 * @param {String} value font description in CSS format, i.e. `Arial` or `12px Arial bold`
 * @return {anm.Text} itself
 */
Text.prototype.font = function(value) {
    if (!value) return this.$font;
    this.$font = value;
    return this;
}
/**
 * @method align
 * @chainable
 *
 * Change the alignment of a text
 *
 * @param {C.TA_} value text align, one of `C.TA_LEFT` (default), `C.TA_RIGHT` or `C.TA_CENTER`
 * @return {anm.Text} itself
 */
Text.prototype.align = function(value) {
    if (!value) return this.$align;
    this.$align = value;
    return this;
}
/**
 * @method bounds
 *
 * Get bounds of this text. NB: Be aware, bounds are cached, use `invalidate()`` to update them.
 *
 * @return {Object} bounds data
 */
Text.prototype.bounds = function() {
    if (this.$bounds) return this.$bounds;
    var bounds = Text.bounds(this, this.lines);
    return (this.$bounds = bounds);
}
// should be static
Text.prototype.ascent = function(height, baseline) {
    return (baseline == C.BL_MIDDLE) ? (height / 2) : height;
}
// should be static
Text.prototype.xOffset = function(width, align) {
    if (align == C.TA_LEFT) return 0;
    if (align == C.TA_CENTER) return width / 2;
    if (align == C.TA_RIGHT) return width;
    return 0;
}

/**
 * @method lineCount
 *
 * Get number of lines in this text
 *
 * @return {Number} number of lines
 */
Text.prototype.lineCount = function() {
    var lines = this.lines;
    return (is.arr(lines) ? lines.length : 1);
}
/**
 * @method visitLines
 *
 * // FIXME: rename to `.each`
 *
 * Visit every line of a path with given function
 *
 * @param {Function} f visiting function
 * @param {String} f.line current line
 */
Text.prototype.visitLines = function(func, data) {
    var lines = this.lines;
    if (is.arr(lines)) {
        var line;
        for (var i = 0, ilen = lines.length; i < ilen; i++) {
            line = lines[i];
            func(line);
        }
    } else {
        func(lines.toString());
    }
}
/**
 * @method clone
 *
 * Clone this text
 *
 * @return {anm.Text} clone
 */
Text.prototype.clone = function() {
    var c = new Text(this.lines, this.$font);
    if (this.lines && Array.isArray(this.lines)) {
        c.lines = [].concat(this.lines);
    }
    return c;
}
/**
 * @method invalidate
 *
 * Invalidate bounds of this text
 */
Text.prototype.invalidate = function() {
    this.$bounds = null;
}
Text.prototype.reset = function() { }
Text.prototype.dispose = function() { }
Text.bounds = function(spec, lines) {
    if (!Text.__measuring_f) throw new SysErr('no Text buffer, bounds call failed');
    var dimen = Text.__measuring_f(spec, lines);
    return new Bounds(0, 0, dimen[0], dimen[1]);
}

module.exports = Text;
