var engine = require('engine'),
    theme = require('./controls_theme.js');

// Info Block
// -----------------------------------------------------------------------------

function InfoBlock(player, theme) {
    this.canvas = null;
    this.ctx = null;
    this.ready = false;
    this.hidden = false;
    this.attached = false;
}


/* FIXME: merge Info Block and Controls? */
InfoBlock.BASE_BGCOLOR = theme.colors.infobg;
InfoBlock.BASE_FGCOLOR = theme.colors.text;
InfoBlock.OPACITY = 1;
InfoBlock.PADDING = 6;
InfoBlock.OFFSET_X = 0.03; // percents of canvas height
InfoBlock.OFFSET_Y = 0.02; // percents of canvas width
InfoBlock.FONT = theme.font.face;
InfoBlock.FONT_SIZE_A = theme.font.infosize_a;
InfoBlock.FONT_SIZE_B = theme.font.infosize_b;
InfoBlock.DEFAULT_WIDTH = 0.3; // percents of canvas height
InfoBlock.DEFAULT_HEIGHT = 0.1; // percents of canvas height
InfoBlock.LAST_ID = 0;


InfoBlock.prototype.detach = function(parent) {
    if (!this.attached) return;
    engine.detachElement(parent, this.canvas);
    this.attached = false;
}
// TODO: move to engine
InfoBlock.prototype.update = function(parent) {
    var cvs = this.canvas,
        pconf = engine.getCanvasSize(parent),
        _m = InfoBlock.MARGIN,
        _w = InfoBlock.DEFAULT_WIDTH, _h = InfoBlock.DEFAULT_HEIGHT;
    if (!cvs) {
        cvs = engine.addCanvasOverlay('info-' + InfoBlock.LAST_ID, parent,
                 [ InfoBlock.OFFSET_X, InfoBlock.OFFSET_Y,
                   InfoBlock.DEFAULT_WIDTH, InfoBlock.DEFAULT_HEIGHT ],
                 function(cvs) {
                    engine.registerAsInfoElement(cvs, parent);
                 });
        InfoBlock.LAST_ID++;
        this.id = cvs.id;
        this.canvas = cvs;
        this.attached = true;
        this.ctx = engine.getContext(cvs, '2d');
        this.hide();
        this.changeTheme(InfoBlock.BASE_FGCOLOR, InfoBlock.BASE_BGCOLOR);
    } else {
        engine.updateOverlay(parent, cvs);
    }
    //var cconf = engine.getCanvasParameters(cvs);
    // _canvas.style.left = _cp[0] + 'px';
    // _canvas.style.top = _cp[1] + 'px';
    //this._ratio = cconf[2];
    //this.ctx.font = Controls.FONT_WEIGHT + ' ' + Math.floor(Controls._TS) + 'px ' + Controls.FONT;
    this.bounds = engine.getCanvasBounds(cvs);
}
InfoBlock.prototype.render = function() {
    if (!this.__data) return;
    var meta = this.__data[0],
        anim = this.__data[1],
        duration = this.__data[2] || meta.duration;
    var ratio = engine.PX_RATIO;
    /* TODO: show speed */
    var _tl = new Text(meta.title || '[No title]', 'bold ' + Math.floor(InfoBlock.FONT_SIZE_A) + 'px ' + InfoBlock.FONT, { color: this.__fgcolor }),
        _bl = new Text((meta.author || '[Unknown]') + ' ' + (duration ? (duration + 's') : '?s') +
                       ' ' + (anim.width || 0) + 'x' + (anim.height || 0),
                      Math.floor(InfoBlock.FONT_SIZE_B) + 'px ' + InfoBlock.FONT, { color: this.__fgcolor }),  // meta.version, meta.description, meta.copyright
        _p = InfoBlock.PADDING,
        _td = _tl.dimen(),
        _bd = _bl.dimen(),
        _nw = Math.max(_td[0], _bd[0]) + _p + _p,
        _nh = _td[1] + _bd[1] + (_p * 3),
        ctx = this.ctx;
    engine.setCanvasSize(this.canvas, _nw, _nh);
    ctx.save();
    if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, _nw, _nh);
    ctx.fillStyle = this.__bgcolor;
    //Controls.__roundRect(ctx, 0, 0, _nw, _nh, 5);
    ctx.fill();
    ctx.fillStyle = this.__fgcolor;
    ctx.translate(_p, _p);
    _tl.apply(ctx);
    ctx.globalAlpha = .8;
    ctx.translate(0, _bd[1] + _p);
    _bl.apply(ctx);
    ctx.restore();
}
InfoBlock.prototype.inject = function(anim, duration) {
    if (!anim) return;
    var meta = anim.meta;
    this.__data = [ anim, meta, duration || (meta && meta.duration) || anim.duration || 0 ];
    if (this.ready) this.render();
}
InfoBlock.prototype.reset = function() {

}
InfoBlock.prototype.hide = function() {
    engine.hideElement(this.canvas);
    this.hidden = true;
}
InfoBlock.prototype.show = function() {
    engine.showElement(this.canvas);
    this.hidden = false;
}
InfoBlock.prototype.setDuration = function(value) {
    if (this.__data) this.inject(this.__data[0], value);
}
InfoBlock.prototype.changeTheme = function(front, back) {
    this.__fgcolor = front;
    this.__bgcolor = back;
    // TODO: redraw
}

module.exports = InfoBlock;
