var provideEvents = require('./events.js').provideEvents,
    C = require('./constants.js'),
    engine = require('../anm.js').engine,
    InfoBlock = require('./infoblock.js'),
    is = require('./is.js'),
    Strings = require('./loc.js').Strings,
    utils = require('./utils.js');

// Controls
// -----------------------------------------------------------------------------

function Controls(player) {
    this.player = player;
    this.canvas = null;
    this.ctx = null;
    this.ready = false;
    this.bounds = [];
    this.hidden = false;
    this.focused = false; // the current button is focused
    this.elapsed = false;
    this.theme = null;
    this.info = null;
    this._time = -1000;
    this._lhappens = C.NOTHING;
    this._initHandlers(); /* TODO: make automatic */
}

Controls.DEFAULT_THEME = require('./controls_theme.js');
Controls.THEME = Controls.DEFAULT_THEME;
Controls.LAST_ID = 0;
provideEvents(Controls, [C.X_DRAW]);
Controls.prototype.update = function(parent) {
    var cvs = this.canvas;
    if (!cvs) {
        cvs = engine.addCanvasOverlay('ctrls-' + Controls.LAST_ID, parent,
                 [ 0, 0, 1, 1 ],
                 function(cvs) {
                    engine.registerAsControlsElement(cvs, parent);
                 });
        Controls.LAST_ID++;
        this.id = cvs.id;
        this.canvas = cvs;
        this.ctx = engine.getContext(cvs, '2d');
        this.subscribeEvents(cvs, parent);
        this.hide();
        this.changeTheme(Controls.THEME);
    } else {
        engine.updateOverlay(parent, cvs);
    }
    this.handleAreaChange();
    if (this.info) this.info.update(parent);
    BACK_GRAD = null; // invalidate back gradient
}
Controls.prototype.subscribeEvents = function(canvas, parent) {
    engine.subscribeCanvasEvents(parent, {
        mouseenter: (function(controls) {
                return function(evt) { controls.handleMouseEnter(); };
            })(this),
        mouseleave: (function(controls) {
                return function(evt) { controls.handleMouseLeave(); };
            })(this),
        click: (function(controls) {
                return function(evt) { controls.handlePlayerClick(); };
            })(this)
    });
    engine.subscribeCanvasEvents(canvas, {
        mouseenter: (function(controls) {
                return function(evt) { controls.handleMouseEnter(); };
            })(this),
        mouseleave: (function(controls) {
                return function(evt) { controls.handleMouseLeave(); };
            })(this),
        mousemove: (function(controls) {
                return function(evt) { controls.handleMouseMove(evt); };
            })(this),
        mousedown: (function(controls) {
                return function(evt) { controls.handleClick(); };
            })(this)
    });
}
Controls.prototype.render = function(time) {
    if (this.hidden && !this.__force) return;

    if (!this.bounds) return;

    // TODO: may be this function should check player mode by itself and create canvas
    //       only in case it is required, but player should create Controls instance
    //       all the time, independently of the mode.

    var player = this.player,
        state = player.state,
        _s = state.happens;

    var time = (time > 0) ? time : 0;
    if (!this.__force &&
        (time === this._time) &&
        (_s === this._lhappens)) return;

    // these states do not change controls visually between frames
    if (is.defined(this._lastDrawn) &&
        (this._lastDrawn === _s) &&
        ((_s === C.STOPPED) ||
         (_s === C.NOTHING) ||
         (_s === C.ERROR))
       ) return;

    this.rendering = true;

    if (((this._lhappens === C.LOADING) || (this._lhappens === C.RES_LOADING)) &&
        ((_s !== C.LOADING) && (_s !== C.RES_LOADING))) {
        stopLoadingAnimation(this.ctx);
    }

    this._time = time;
    this._lhappens = _s;

    var ctx = this.ctx,
        theme = this.theme,
        duration = state.duration,
        progress = time / ((duration !== 0) ? duration : 1);

    var _w = this.bounds[2],
        _h = this.bounds[3],
        ratio = engine.PX_RATIO;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, _w, _h);

    if (_s === C.PLAYING) {

    } else if (_s === C.STOPPED) {
        drawBack(ctx, theme, _w, _h);
        drawPlay(ctx, theme, _w, _h, this.focused);
    } else if (_s === C.PAUSED) {
        drawBack(ctx, theme, _w, _h);
        drawProgress(ctx, theme, _w, _h, progress);
        drawPlay(ctx, theme, _w, _h, this.focused);
        if (duration) {
            drawTime(ctx, theme, _w, _h, time, duration);
        }
    } else if (_s === C.NOTHING) {
        drawBack(ctx, theme, _w, _h);
        drawNoAnimation(ctx, theme, _w, _h, this.focused);
    } else if ((_s === C.LOADING) || (_s === C.RES_LOADING)) { // TODO: show resource loading progress
        runLoadingAnimation(ctx, function(ctx) {
            ctx.clearRect(0, 0, _w, _h);
            //Controls._drawBack(ctx, theme, _w, _h);
            drawLoading(ctx, theme, _w, _h,
                                  (((Date.now() / 100) % 60) / 60), '');
                                  // isRemoteLoading ? player._loadSrc '...' : '');
        });
    } else if (_s === C.ERROR) {
        drawError(ctx, theme, _w, _h, player.__lastError, this.focused);
    }
    this._lastDrawn = _s;

    ctx.restore();
    this.fire(C.X_DRAW, state);

    this.__force = false;

    if (this.info) {
      if (_s !== C.NOTHING) { this._infoShown = true; this.info.render(); }
      else { this._infoShown = false; }
    }

    this.rendering = false;
}
Controls.prototype.react = function(time) {
    if (this.hidden) return;

    var _p = this.player,
        _s = _p.state.happens;
    if ((_s === C.NOTHING) || (_s === C.LOADING) || (_s === C.ERROR)) return;
    if (_s === C.STOPPED) { /*$log.debug('play from start');*/ _p.play(0); return; }
    if (_s === C.PAUSED) { /*$log.debug('play from ' + this._time);*/ _p.play(this._time); return; }
    if (_s === C.PLAYING) { /*$log.debug('pause at' + time);*/ this._time = time; _p.pause(); return; }
}
Controls.prototype.refreshByMousePos = function(pos) {
    if (!this.bounds) return;
    var state = this.player.state,
        _lx = pos[0],
        _ly = pos[1],
        _w = this.bounds[2],
        _h = this.bounds[3],
        button_rad = Math.min(_w / 2, _h / 2) * this.theme.radius.inner;
    var lfocused = this.focused;
    this.focused = (_lx >= (_w / 2) - button_rad) &&
                   (_lx <= (_w / 2) + button_rad) &&
                   (_ly >= (_h / 2) - button_rad) &&
                   (_ly <= (_h / 2) + button_rad);
    if (lfocused !== this.focused) {
        this.forceNextRedraw();
    }
    this.render(state.time);
}
Controls.prototype.handleAreaChange = function() {
    if (!this.player || !this.player.canvas) return;
    this.bounds = engine.getCanvasBounds(this.canvas);
}
Controls.prototype.handleMouseMove = function(evt) {
    if (!evt) return;
    this._last_mevt = evt;
    //var pos = engine.getEventPosition(evt, this.canvas);
    //if (this.localInBounds(pos) && (this.player.state.happens !== C.PLAYING)) {
        if (this.hidden) this.show();
        this.refreshByMousePos(engine.getEventPosition(evt, this.canvas));
    //} else {
    //    this.handleMouseOut();
    //}
}
Controls.prototype.handleClick = function() {
    var state = this.player.state;
    this.forceNextRedraw();
    this.react(state.time);
    this.render(state.time);
    if (state.happens === C.PLAYING) this.hide();
}
Controls.prototype.handlePlayerClick = function() {
    if (this.player.handleEvents) return;
    var state = this.player.state;
    if (state.happens === C.PLAYING) {
        this.show();
        this.forceNextRedraw();
        this.react(state.time);
        this.render(state.time);
    }
}
Controls.prototype.handleMouseEnter = function() {
    var state = this.player.state;
    if (state.happens !== C.PLAYING) {
        if (this.hidden) this.show();
        this.forceNextRedraw();
        this.render(state.time);
    }
}
Controls.prototype.handleMouseLeave = function() {
    var state = this.player.state;
    if ((state.happens === C.NOTHING) ||
        (state.happens === C.LOADING) ||
        (state.happens === C.RES_LOADING) ||
        (state.happens === C.ERROR) ||
        (state.happens === C.STOPPED)) {
        this.forceNextRedraw();
        this.render(state.time);
    } else {
        this.hide();
    }
}
Controls.prototype.forceRefresh = function() {
    this.forceNextRedraw();
    this.render(this.player.state.time);
}
/* TODO: take initial state from imported project */
Controls.prototype.hide = function() {
    engine.hideElement(this.canvas);
    this.hidden = true;
    if (this.info) this.info.hide();
}
Controls.prototype.show = function() {
    engine.showElement(this.canvas);
    this.hidden = false;
    if (this.info && this._infoShown) this.info.show();
}
Controls.prototype.reset = function() {
    this._time = -1000;
    this.elapsed = false;
    if (this.info) this.info.reset();
}
Controls.prototype.detach = function(parent) {
    engine.detachElement(parent, this.canvas);
    if (this.info) this.info.detach(parent);
    if (this.ctx) engine.clearAnmProps(this.ctx);
}
Controls.prototype.inBounds = function(pos) {
    //if (this.hidden) return false;
    var _b = this.bounds;
    return (pos[0] >= _b[0]) &&
           (pos[0] <= _b[0] + _b[2]) &&
           (pos[1] >= _b[1]) &&
           (pos[1] <= _b[1] + _b[3]);
}
Controls.prototype.localInBounds = function(pos) {
    //if (this.hidden) return false;
    var _b = this.bounds;
    if (!_b) return false;
    return (pos[0] >= 0) &&
           (pos[0] <= _b[2]) &&
           (pos[1] >= 0) &&
           (pos[1] <= _b[3]);
}
Controls.prototype.changeTheme = function(to) {
    this.theme = to;
    // TODO: redraw
}
Controls.prototype.forceNextRedraw = function() {
    this.__force = true;
}
Controls.prototype._scheduleLoading = function() {
    if (this._loadingInterval) return;
    var controls = this;
    this._loadingInterval = setInterval(function() {
         controls.forceNextRedraw();
         controls.render();
    }, 50);
}
Controls.prototype._stopLoading = function() {
    if (!this._loadingInterval) return;
    clearInterval(this._loadingInterval);
    this._loadingInterval = 0;
    this.forceNextRedraw();
    this.render(this.player.state.time);
}
Controls.prototype.enable = function() {
    var player = this.player,
        state = player.state;
    this.update(this.player.canvas);
    if ((state.happens === C.NOTHING) ||
        (state.happens === C.LOADING) ||
        (state.happens === C.RES_LOADING) ||
        (state.happens === C.ERROR)) {
      this.show();
      this.forceNextRedraw();
      this.render();
    }
}
Controls.prototype.disable = function() {
    this.hide();
    // FIXME: unsubscribe events!
    this.detach(this.player.wrapper);
}
Controls.prototype.enableInfo = function() {
    if (!this.info) this.info = new InfoBlock(this.player);
    this.info.update(this.player.canvas);
}
Controls.prototype.disableInfo = function() {
    if (this.info) this.info.detach(this.player.wrapper);
    /*if (this.info) */this.info = null;
}
Controls.prototype.setDuration = function(value) {
    if (this.info) this.info.setDuration(value);
}
Controls.prototype.inject = function(anim, duration) {
    if (this.info) this.info.inject(anim, duration);
}


var BACK_GRAD = null,
    nextFrame = engine.getRequestFrameFunc(),
    stopAnim = engine.getCancelFrameFunc();
var drawBack = function(ctx, theme, w, h, bgcolor) {
    ctx.save();
    var cx = w / 2,
        cy = h / 2;

    var rgb = [ 175, 200, 200 ],
        bgcolor = bgcolor || '#fff';

    // FIXME: use color parser here!
    //if ((bgcolor == '#000') ||
    //    (bgcolor == '#000000')) rgb = [ 0, 0, 0 ];

    var grd;
    if (!BACK_GRAD) {
        grd = ctx.createRadialGradient(cx, cy, 0,
                                       cx, cy, Math.max(cx, cy) * 1.2);
        var stops = theme.colors.bggrad;
        for (var i = 0, il = stops.length; i < il; i++) {
            grd.addColorStop(stops[i][0], 'rgba(' + rgb[0] + ','
                                                  + rgb[1] + ','
                                                  + rgb[2] + ','
                                                  + stops[i][1] + ')');
        }
        BACK_GRAD = grd;
    } else {
        grd = BACK_GRAD;
    }

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
}

var drawProgress = function(ctx, theme, w, h, progress) {
    if (!is.finite(progress)) return;

    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        progress_rad = Math.min(cx, cy) * theme.radius.outer;

    ctx.beginPath();
    ctx.arc(cx, cy, progress_rad, (1.5 * Math.PI), (1.5 * Math.PI) + ((2 * Math.PI) * progress));
    ctx.strokeStyle = theme.colors.progress.passed;
    ctx.lineWidth = theme.width.outer;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, progress_rad, (1.5 * Math.PI), (1.5 * Math.PI) + ((2 * Math.PI) * progress), true);
    ctx.strokeStyle = theme.colors.progress.left;
    ctx.lineWidth = theme.width.outer;
    ctx.stroke();

    ctx.restore();

}
var drawPause = function(ctx, theme, w, h, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        inner_rad = Math.min(cx, cy) * theme.radius.inner,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.beginPath();
    ctx.arc(cx, cy, inner_rad, 0, 2 * Math.PI);
    ctx.fillStyle = focused ? theme.colors.hoverfill : theme.colors.fill;
    ctx.strokeStyle = theme.colors.stroke;
    ctx.lineWidth = theme.width.inner;
    ctx.stroke();
    ctx.fill();

    var x = cx - (button_width / 2),
        y = cy - (button_height / 2),
        bar_width = 1 / 4,
        between = 2 / 4;

    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.button;
    ctx.strokeStyle = theme.colors.button;
    ctx.strokeRect(x, y, bar_width * button_width, button_height);
    ctx.strokeRect(x + ((bar_width + between) * button_width), y,
                   bar_width * button_width, button_height);
    ctx.fillRect(x, y, bar_width * button_width, button_height);
    ctx.fillRect(x + (bar_width + between) * button_width, y,
                 bar_width * button_width, button_height);

    ctx.restore();

    drawGuyInCorner(ctx, theme, w, h);
}
var drawPlay = function(ctx, theme, w, h, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        inner_rad = Math.min(cx, cy) * theme.radius.inner,
        // play button should be thinner than standard button
        button_width = Math.min(cx, cy) * theme.radius.buttonh * 0.8,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.beginPath();
    ctx.arc(cx, cy, inner_rad, 0, 2 * Math.PI);
    ctx.fillStyle = focused ? theme.colors.hoverfill : theme.colors.fill;
    ctx.strokeStyle = theme.colors.stroke;
    ctx.lineWidth = theme.width.inner;
    ctx.stroke();
    ctx.fill();

    // this way play button "weight" looks more centered
    ctx.translate(button_width / (((button_width > button_height)
                                   ? (button_width / button_height)
                                   : (button_height / button_width)) * 4), 0);

    ctx.beginPath();
    ctx.moveTo(cx - (button_width / 2), cy - (button_height / 2));
    ctx.lineTo(cx + (button_width / 2), cy);
    ctx.lineTo(cx - (button_width / 2), cy + (button_height / 2));
    ctx.closePath();
    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.button;
    ctx.strokeStyle = theme.colors.button;
    ctx.stroke();
    ctx.fill();

    ctx.restore();

    drawGuyInCorner(ctx, theme, w, h);
}
var drawLoading = function(ctx, theme, w, h, hilite_pos, src) {
    drawLoadingProgress(ctx, w, h, hilite_pos, theme.radius.loader,
                                             theme.colors.progress.left, theme.colors.progress.passed);

    if (src) {
        drawText(ctx, theme,
                     w / 2, ((h / 2) * (1 + theme.radius.status)),
                     theme.font.statussize,
                     utils.ell_text(src, theme.statuslimit));
    } else if (hilite_pos == -1) {
        drawText(ctx, theme,
                     w / 2, ((h / 2) * (1 + theme.radius.status)),
                     theme.font.statussize,
                     '...');
    }

    drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.substatus)),
                   theme.font.statussize,
                   Strings.COPYRIGHT);

    drawGuyInCenter(ctx, theme, w, h);
}
var drawLoadingProgress = function(ctx, w, h, hilite_pos, radius, normal_color, hilite_color) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        circles = 15,
        outer_rad = Math.min(cx, cy) * radius,
        circle_rad = Math.min(cx, cy) / 25,
        two_pi = 2 * Math.PI,
        hilite_idx = Math.ceil(circles * hilite_pos);

    ctx.translate(cx, cy);
    for (var i = 0; i <= circles; i++) {
        ctx.beginPath();
        ctx.arc(0, outer_rad, circle_rad, 0, two_pi);
        ctx.fillStyle = (i != hilite_idx) ? normal_color : hilite_color;
        ctx.fill();
        ctx.rotate(two_pi / circles);
    }
    ctx.restore();
}
var drawNoAnimation = function(ctx, theme, w, h, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.fillStyle = '#eee';
    ctx.fillRect(3, 3, w - 3, h - 3);

    ctx.translate(cx, cy);

    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.button;
    ctx.strokeStyle = theme.colors.button;
    ctx.rotate(-Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.rotate(2 * Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.restore();

    drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.status)),
                   theme.font.statussize,
                   Strings.COPYRIGHT);

    drawGuyInCenter(ctx, theme, w, h);

}
var drawError = function(ctx, theme, w, h, error, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        button_width = Math.min(cx, cy) * theme.radius.buttonh,
        button_height = Math.min(cx, cy) * theme.radius.buttonv;

    ctx.fillStyle = '#eee';
    ctx.fillRect(3, 3, w - 3, h - 3);

    ctx.translate(cx, cy);

    ctx.lineWidth = theme.width.button;
    ctx.lineJoin = theme.join.button;
    ctx.fillStyle = theme.colors.error;
    ctx.strokeStyle = theme.colors.error;
    ctx.rotate(-Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.rotate(2 * Math.PI / 4);
    ctx.strokeRect(-(button_width / 2), -(button_height / 8), button_width, button_height / 4);
    ctx.fillRect(  -(button_width / 2), -(button_height / 8), button_width, button_height / 4);

    ctx.restore();

    drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.status)),
                   theme.font.statussize * 1.2,
                   (error && error.message) ? utils.ell_text(error.message, theme.statuslimit)
                                            : error, theme.colors.error);

    drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.substatus)),
                   theme.font.statussize,
                   Strings.COPYRIGHT);

    drawGuyInCenter(ctx, theme, w, h, [ theme.colors.button,
                                                  theme.colors.error ]);
}
var drawTime = function(ctx, theme, w, h, time, duration) {
    drawText(ctx, theme,
                       w / 2, ((h / 2) * (1 + theme.radius.time)),
                       theme.font.timesize,
                       utils.fmt_time(time) + ' / ' + utils.fmt_time(duration));

}
var drawText = function(ctx, theme, x, y, size, text, color, align) {
    ctx.save();
    ctx.font = theme.font.weight + ' ' + Math.floor(size || 15) + 'pt ' + theme.font.face;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || theme.colors.text;
    ctx.fillText(text, x, y);
    ctx.restore();
}
var drawGuyInCorner = function(ctx, theme, w, h, colors, pos, scale) {
    // FIXME: place COPYRIGHT text directly under the guy in drawAnimatronGuy function
    // Controls._drawText(ctx, theme,
    //                    w - 10,
    //                    theme.anmguy.copy_pos[1] * h,
    //                    (theme.font.statussize - (1600 / w)),
    //                    Strings.COPYRIGHT, theme.colors.secondary, 'right');

    /* if ((w / ratio) >= 400) {
      drawAnimatronGuy(ctx, (pos ? pos[0] : theme.anmguy.corner_pos[0]) * w,
                            //theme.anmguy.copy_pos[0] * w,
                            (pos ? pos[1] : theme.anmguy.corner_pos[1]) * h,
                       (scale || theme.anmguy.corner_scale) * Math.min(w, h),
                       colors || theme.anmguy.colors, theme.anmguy.corner_alpha);
    } */
}
var drawGuyInCenter = function(ctx, theme, w, h, colors, pos, scale) {
    /*
    drawAnimatronGuy(ctx, (pos ? pos[0] : theme.anmguy.center_pos[0]) * w,
                          (pos ? pos[1] : theme.anmguy.center_pos[1]) * h,
                     (scale || theme.anmguy.center_scale) * Math.min(w, h),
                     colors || theme.anmguy.colors, theme.anmguy.center_alpha);
    */
    // FIXME: place COPYRIGHT text directly under the guy in drawAnimatronGuy function
}
var runLoadingAnimation = function(ctx, paint) {
    // FIXME: unlike player's _runLoadingAnimation, this function is more private/internal
    //        and Contols._scheduleLoading() should be used to start all the drawing process
    var props = engine.getAnmProps(ctx);
    if (props.loading_req) return;
    var ratio = engine.PX_RATIO;
    // var isRemoteLoading = (_s === C.RES_LOADING); /*(player._loadTarget === C.LT_URL)*/
    props.supress_loading = false;
    function loading_loop() {
        if (props.supress_loading) return;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (ratio != 1) ctx.scale(ratio, ratio);
        // FIXME: redraw only the changed circles
        paint(ctx);
        ctx.restore();
        return nextFrame(loading_loop);
    }
    props.loading_req = nextFrame(loading_loop);
}
var stopLoadingAnimation = function(ctx, paint) {
    // FIXME: unlike player's _stopLoadingAnimation, this function is more private/internal
    //        and Contols._stopLoading() should be used to stop the drawing process
    var props = engine.getAnmProps(ctx);
    if (!props.loading_req) return;
    props.supress_loading = true;
    stopAnim(props.loading_req);
    props.loading_req = null;
}

module.exports = Controls;
