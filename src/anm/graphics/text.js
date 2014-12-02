var C = require('../constants.js'),
    is = require('../utils.js').is,
    SystemError = require('../errors.js').SystemError;

var engine = require('engine');

var Brush = require('./brush.js');

var Bounds = require('./bounds.js');

// TODO: new Text("My Text").font("Arial").size(5).bold()

/**
 * @class anm.Text
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
Text.prototype.font = function(value) {
    if (!value) return this.$font;
    this.$font = value;
    return this;
}
Text.prototype.align = function(value) {
    if (!value) return this.$align;
    this.$align = value;
    return this;
}
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

Text.prototype.lineCount = function() {
    var lines = this.lines;
    return (is.arr(lines) ? lines.length : 1);
}
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
Text.prototype.clone = function() {
    var c = new Text(this.lines, this.$font);
    if (this.lines && Array.isArray(this.lines)) {
        c.lines = [].concat(this.lines);
    }
    return c;
}
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
