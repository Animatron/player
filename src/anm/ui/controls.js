var provideEvents = require('../events.js').provideEvents,
    C = require('../constants.js'),
    engine = require('engine'),
    InfoBlock = require('./infoblock.js'),
    Strings = require('../loc.js').Strings,
    utils = require('../utils.js'),
    is = utils.is;

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
        Controls.stopLoadingAnimation(this.ctx);
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
Controls.stopLoadingAnimation = function(ctx) {
    // FIXME: unlike player's _stopLoadingAnimation, this function is more private/internal
    //        and Contols._stopLoading() should be used to stop the drawing process
    var props = engine.getAnmProps(ctx);
    if (!props.loading_req) return;
    props.supress_loading = true;
    stopAnim(props.loading_req);
    props.loading_req = null;
}

/*
var _anmGuySpec = [
  [ 180, 278 ], // origin
  [ 235, 290 ], // dimensions
  [ "rgba(35,31,32,1.0)",
    "rgba(241,91,42,1.0)" ], // colors
  [
    // before the mask
    // [ color-id, path ]
    [ 0, "M206.367 561.864 L210.181 558.724 C228.037 544.497 253.515 532.989 280.474 527.013 C310.171 520.432 331.881 522.276 352.215 531.595 L357.041 534.028 C357.35 534.198 357.661 534.362 357.965 534.536 C358.084 534.603 358.207 534.646 358.333 534.68 L358.358 534.693 C358.38 534.698 358.404 534.697 358.427 534.701 C358.499 534.716 358.572 534.723 358.644 534.726 C358.665 534.727 358.687 534.734 358.708 534.734 C358.718 534.734 358.727 534.729 358.736 534.729 C358.901 534.725 359.061 534.695 359.214 534.639 C359.235 534.631 359.255 534.624 359.275 534.617 C359.427 534.555 359.568 534.468 359.694 534.357 C359.703 534.35 359.713 534.347 359.72 534.34 C359.734 534.327 359.742 534.312 359.755 534.299 C359.812 534.242 359.864 534.182 359.911 534.115 C359.934 534.084 359.958 534.054 359.977 534.022 C359.987 534.005 360.0 533.993 360.01 533.976 C360.042 533.919 360.063 533.859 360.088 533.8 C360.099 533.773 360.113 533.747 360.123 533.719 C360.16 533.612 360.185 533.502 360.197 533.393 C360.199 533.372 360.197 533.352 360.197 533.331 C360.204 533.239 360.202 533.147 360.191 533.057 C360.189 533.042 360.192 533.029 360.19 533.014 C357.081 511.941 353.944 495.52 351.031 482.785 C357.244 479.02 363.189 474.743 368.789 469.964 C393.406 448.956 409.766 419.693 414.851 387.568 C414.984 386.729 414.572 385.898 413.824 385.495 C413.078 385.094 412.154 385.206 411.528 385.778 C411.211 386.068 379.366 414.738 343.77 414.738 C342.291 414.738 340.805 414.687 339.353 414.59 C337.351 414.454 335.324 414.175 333.283 413.779 C331.964 409.499 330.461 404.804 328.77 399.802 C359.392 384.303 365.286 347.489 365.523 345.916 L365.673 344.918 L364.958 344.204 C343.833 323.079 316.491 319.925 302.074 319.925 C297.818 319.925 294.309 320.184 292.346 320.397 C292.057 319.943 291.367 318.531 291.075 318.082 L291.075 318.082 L289.93 318.134 C288.782 318.186 262.998 319.502 240.402 333.108 C240.257 332.844 240.11 332.58 239.97 332.321 C239.519 331.483 238.543 331.077 237.63 331.355 C237.138 331.503 188.319 346.777 182.558 392.748 C179.346 418.379 183.819 442.529 195.154 460.749 C198.743 466.519 202.966 471.691 207.797 476.277 C205.628 493.159 199.308 523.779 199.131 560.445 C199.131 560.448 199.131 560.449 199.131 560.449 C199.103 560.84 199.374 561.582 199.61 561.929 C200.857 563.749 203.878 563.485 206.367 561.864 L206.367 561.864 M329.861 356.921 C337.152 356.921 343.681 355.511 347.423 354.501 C343.397 371.078 329.711 383.191 323.809 387.651 C319.732 376.532 315.353 363.711 309.755 351.798 C315.197 355.032 321.929 356.921 329.861 356.921 L329.861 356.921 M274.473 524.377 C255.607 528.559 237.545 535.219 222.207 543.738 C226.13 536.158 235.429 517.686 244.087 496.592 C250.783 498.607 257.965 500.123 265.665 501.096 C271.15 501.789 276.723 502.14 282.228 502.14 C295.39 502.14 308.416 500.139 320.898 496.304 C330.401 510.462 338.24 520.043 342.222 524.674 C323.029 518.972 299.648 518.8 274.473 524.377 L274.473 524.377 M206.367 561.864 Z" ]
  ], [
    // masking
    "M228.106 361.104 L235.292 339.707 C220.431 347.023 207.762 353.681 193.499 382.89 L193.371 383.129 C193.335 383.196 193.081 398.216 215.426 411.593 L217.722 398.247 C213.866 395.442 209.922 392.815 203.684 382.392 L203.684 382.392 L206.09 382.041 C206.795 381.993 223.527 380.653 227.963 361.515 L228.106 361.104 L228.106 361.104 M228.106 361.104 Z",
    "M335.139 434.771 C330.899 418.584 314.627 362.091 288.434 321.155 C282.932 321.595 258.458 326.742 239.48 337.752 C237.387 342.508 222.985 385.396 214.605 457.106 C223.094 451.426 246.173 437.705 278.306 432.083 C289.482 430.127 298.912 429.177 307.136 429.177 C318.52 429.176 327.736 431.012 335.139 434.771 L335.139 434.771 M335.139 434.771 Z",
    "M261.669 283.483 C261.122 283.608 260.536 283.529 259.968 283.62 C259.175 283.855 244.69 288.784 240.497 330.304 L252.545 325.896 C252.958 325.746 253.41 325.735 253.829 325.865 C254.189 325.977 262.588 328.605 265.889 329.881 C265.942 329.886 266.001 329.886 266.067 329.886 C268.22 329.886 273.176 328.592 274.266 327.977 C274.929 327.028 277.335 323.153 279.406 319.753 C279.715 319.246 280.233 318.902 280.82 318.815 L287.047 317.888 C283.65 306.582 275.276 280.377 261.669 283.483 L261.669 283.483 M261.669 283.483 Z"
  ],
  [
    // after the mask
    // [ color-id, path ]
    [ 0, "M258.16 316.686 L260.482 319.943 C260.531 319.909 265.533 316.427 272.469 316.574 L272.549 312.574 C264.239 312.415 258.404 316.512 258.16 316.686 L258.16 316.686 M258.16 316.686 Z" ],
    [ 0, "M291.524 319.015 C290.269 315.412 275.55 278.38 261.669 279.484 C260.863 279.548 259.839 279.603 258.948 279.754 C258.183 279.914 240.364 284.186 236.22 333.101 C236.162 333.782 236.456 334.445 236.999 334.86 C237.353 335.13 237.78 335.27 238.213 335.27 C238.444 335.27 238.677 335.23 238.9 335.148 L253.28 329.887 C255.368 330.545 261.949 332.636 264.544 333.651 C264.954 333.811 265.438 333.886 266.065 333.886 C266.065 333.886 266.065 333.886 266.065 333.886 C268.166 333.886 275.679 332.241 277.179 330.305 C277.858 329.427 281.074 323.856 282.394 321.697 L289.246 321.084 C289.809 321.0 290.95 321.105 291.263 320.63 C291.575 320.151 291.711 319.553 291.524 319.015 L291.524 319.015 M280.818 318.813 C280.231 318.901 279.713 319.245 279.404 319.751 C277.333 323.15 274.927 327.025 274.264 327.975 C273.174 328.59 268.218 329.884 266.065 329.884 C265.999 329.884 265.94 329.884 265.887 329.879 C262.586 328.604 254.187 325.976 253.827 325.863 C253.408 325.733 252.956 325.744 252.543 325.894 L240.495 330.302 C241.15 323.815 242.058 318.233 243.124 313.412 C246.317 310.925 256.071 305.486 274.186 302.326 L272.507 297.31 C256.366 300.166 248.436 303.975 245.019 306.105 C246.927 299.814 249.104 295.257 251.197 291.967 C253.956 288.64 261.686 281.937 265.486 288.565 C266.311 290.004 265.915 293.995 261.883 294.298 C261.883 294.298 271.143 298.247 272.283 289.079 C277.986 295.21 284.709 310.11 287.043 317.884 L280.818 318.813 L280.818 318.813 M291.524 319.015 Z" ],
    [ 1, "M232.358 389.656 C232.358 389.656 247.035 382.551 257.026 379.59 L272.548 358.341 L289.591 374.478 C289.591 374.478 302.954 372.629 311.024 374.716 C311.024 374.716 291.608 351.323 279.443 344.346 L261.899 346.255 C256.74 352.255 242.601 369.901 232.358 389.656 L232.358 389.656 M232.358 389.656 Z" ]
  ]
];
*/
var anmGuyCanvas,
    anmGuyCtx;
function drawAnimatronGuy(ctx, x, y, size, colors, opacity) {
    /* var spec = _anmGuySpec,
        origin = spec[0],
        dimensions = spec[1],
        scale = size ? (size / Math.max(dimensions[0], dimensions[1])) : 1,
        colors = colors || spec[2],
        shapes_before = spec[3]
        masking_shapes = spec[4],
        shapes_after = spec[5];

    var w = dimensions[0] * scale,
        h = dimensions[1] * scale;

    if (!anmGuyCanvas) {
        anmGuyCanvas = $engine.createCanvas(w, h);
        anmGuyCtx = $engine.getContext(anmGuyCanvas, '2d');
    } else {
        // FIXME: resize only if size was changed
        $engine.setCanvasSize(anmGuyCanvas, w, h);
    }

    var maskCanvas = anmGuyCanvas;
    var maskCtx = anmGuyCtx;

    maskCtx.save();

    // prepare
    maskCtx.clearRect(0, 0, w, h);
    if (scale != 1) maskCtx.scale(scale, scale);
    maskCtx.translate(-origin[0], -origin[1]);
    maskCtx.save();

    // draw masked shapes
    for (var i = 0; i < shapes_before.length; i++) {
        var shape = shapes_before[i],
            fill = colors[shape[0]],
            path = new Path(shape[1], fill);

        path.apply(maskCtx);
    }

    // draw and apply mask
    maskCtx.save();
    maskCtx.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < masking_shapes.length; i++) {
        var shape = masking_shapes[i],
            path = new Path(shape, '#fff');

        path.apply(maskCtx);
    }
    maskCtx.restore();

    // draw shapes after
    for (var i = 0; i < shapes_after.length; i++) {
        var shape = shapes_after[i],
            fill = colors[shape[0]],
            path = new Path(shape[1], fill);

        path.apply(maskCtx);
    }

    // draw over the main context
    maskCtx.restore();
    maskCtx.restore();

    ctx.save();
    if (opacity) ctx.globalAlpha = opacity;
    ctx.drawImage(maskCanvas, x - (w / 2), y - (h / 2));
    ctx.restore(); */
}

module.exports = Controls;
