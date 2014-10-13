var C = require('./constants.js'),
    Brush = require('./brush.js'),
    is = require('./utils.js').is,
    SystemError = require('./errors.js').SystemError,
    engine = require('engine');

function Text(lines, font, align, baseline, underlined) {
    this.lines = lines;
    this.font = font || Text.DEFAULT_FONT;
    this.align = align || Text.DEFAULT_ALIGN;
    this.baseline = baseline || Text.DEFAULT_BASELINE;
    this.underlined = is.defined(underlined) ? underlined : Text.DEFAULT_UNDERLINE;
    this._bnds = null;
}

Text.DEFAULT_FFACE = 'sans-serif';
Text.DEFAULT_FSIZE = 24;
Text.DEFAULT_FONT = Text.DEFAULT_FSIZE + 'px ' + Text.DEFAULT_FFACE;
Text.DEFAULT_ALIGN = C.TA_LEFT;
Text.DEFAULT_BASELINE = C.BL_BOTTOM; // FIXME: also change to middle?
Text.DEFAULT_UNDERLINE = false;

Text.__measuring_f = engine.createTextMeasurer();

Text.prototype.apply = function(ctx) {
    ctx.save();
    var dimen = this.dimen(),
        height = (dimen[1] / this.lineCount()),
        underlined = this.underlined;
    ctx.font = this.font;
    ctx.textBaseline = this.baseline || Text.DEFAULT_BASELINE;

    var ascent = this.ascent(height, ctx.textBaseline);

    ctx.textAlign = this.align || Text.DEFAULT_ALIGN;
    var y = 0;
    this.visitLines(function(line) {
        ctx.fillText(line, 0, y+ascent);
        y += height;
    });
    Brush.clearShadow(ctx);
    y = 0;
    this.visitLines(function(line) {
        ctx.strokeText(line, 0, y+ascent);
        y += height;
    });
    if (underlined) { // FIXME: no this.fill anymore
        var stroke = this.fill,
            me = this; //obj_clone(this.fill);
        y = 0;
        Brush.stroke(ctx, stroke);
        ctx.lineWidth = 1;
        this.visitLines(function(line) {
            var width = me.dimen(line)[0];
            ctx.beginPath();
            ctx.moveTo(0, y + height);      // not entirely correct
            ctx.lineTo(width, y + height);
            ctx.stroke();

            y += height;
        });
    }
    ctx.restore();
}
Text.prototype.dimen = function(/*optional: */lines) {
    //if (this._dimen) return this._dimen;
    if (!Text.__measuring_f) throw new SystemError('no Text buffer, bounds call failed');
    return Text.__measuring_f(this, lines);
}
Text.prototype.bounds = function() {
    var dimen = this.dimen();
    return [ 0, 0, dimen[0], dimen[1] ];
}
// should be static
Text.prototype.ascent = function(height, baseline) {
    return (baseline == C.BL_MIDDLE) ? (height / 2) : height;
}
Text.prototype.lineCount = function() {
    var lines = this.lines;
    return is.arr(lines) ? lines.length : 1;
}
Text.prototype.visitLines = function(func, data) {
    var lines = this.lines;
    if (is.arr(lines)) {
        var line;
        for (var i = 0, ilen = lines.length; i < ilen; i++) {
            line = lines[i];
            func(line, data);
        }
    } else {
        func(lines.toString(), data);
    }
}
Text.prototype.clone = function() {
    var c = new Text(this.lines, this.font);
    if (this.lines && Array.isArray(this.lines)) {
        c.lines = [].concat(this.lines);
    }
    return c;
}
Text.prototype.invalidate = function() { }
Text.prototype.reset = function() { }
Text.prototype.dispose = function() { }

module.exports = Text;
