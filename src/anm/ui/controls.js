var provideEvents = require('../events.js').provideEvents,
    C = require('../constants.js'),
    engine = require('engine'),
    InfoBlock = require('./infoblock.js'),
    Strings = require('../loc.js').Strings,
    utils = require('../utils.js'),
    Path = require('../graphics/path.js');
    is = utils.is,
    Brush = require('../graphics/brush.js');

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

var theme = Controls.DEFAULT_THEME = require('./controls_theme.js');
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
                return function(evt) { controls.handleClick(); engine.preventDefault(evt); };
            })(this),
        click: engine.preventDefault,
        dblclick: engine.preventDefault
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
        s = state.happens;

    var time = (time > 0) ? time : 0,
        coords = {x:0,y:0};
    if (this._last_mevt) {
      var pos = engine.getEventPosition(this._last_mevt, this.canvas),
          coords = {x: pos[0], y: pos[1]};
    }

    if (!this.__force &&
        (time === this._time) &&
        (s === this._lhappens)) return;

    // these states do not change controls visually between frames
    if (is.defined(this._lastDrawn) &&
        (this._lastDrawn === s) &&
        ((s === C.STOPPED) ||
         (s === C.NOTHING) ||
         (s === C.ERROR))
       ) return;

    this.rendering = true;

    if (((this._lhappens === C.LOADING) || (this._lhappens === C.RES_LOADING)) &&
        ((s !== C.LOADING) && (s !== C.RES_LOADING))) {
        Controls.stopLoadingAnimation(this.ctx);
    }

    this._time = time;
    this._lhappens = s;

    var ctx = this.ctx,
        theme = this.theme,
        duration = state.duration,
        progress = time / ((duration !== 0) ? duration : 1);

    var w = this.bounds[2],
        h = this.bounds[3],
        ratio = engine.PX_RATIO;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, w, h);

    if (s === C.PLAYING) {
        if (duration) {
            drawProgress(ctx, theme, w, h, progress);
            drawTinyPause(ctx, w, h);
            drawTime(ctx, theme, w, h, time, duration, progress, coords);
            drawVolumeBtn(ctx, w, h, player.muted);
        }
    } else if (s === C.STOPPED) {
        drawBack(ctx, theme, w, h);
        drawPlay(ctx, theme, w, h, this.focused);
    } else if (s === C.PAUSED) {
        drawBack(ctx, theme, w, h);
        drawPlay(ctx, theme, w, h, this.focused);
        if (duration) {
            drawProgress(ctx, theme, w, h, progress);
            drawTinyPlay(ctx, w, h);
            drawTime(ctx, theme, w, h, time, duration, progress, coords);
            drawVolumeBtn(ctx, w, h, player.muted);
        }

    } else if (s === C.NOTHING) {
        drawNoAnimation(ctx, theme, w, h, this.focused);
    } else if ((s === C.LOADING) || (s === C.RES_LOADING)) {
        runLoadingAnimation(ctx, function(ctx) {
            ctx.clearRect(0, 0, w, h);
            drawLoading(ctx, theme, w, h,
                                  (((Date.now() / 100) % 60) / 60), '');
        });
    } else if (s === C.ERROR) {
        drawBack(ctx, theme, w, h);
        drawError(ctx, theme, w, h, player.__lastError, this.focused);
    }
    this._lastDrawn = s;

    ctx.restore();
    this.fire(C.X_DRAW, state);

    this.__force = false;

    if (this.info) {
      if (s !== C.NOTHING) { this._infoShown = true; this.info.render(); }
      else { this._infoShown = false; }
    }

    this.rendering = false;
}
Controls.prototype.react = function(time) {
    if (this.hidden) return;

    var p = this.player,
        s = p.state.happens,
        btnWidth = theme.progress.buttonWidth;
    if ((s === C.NOTHING) || (s === C.LOADING) || (s === C.ERROR)) return;
    if (this._last_mevt) {
      var pos = engine.getEventPosition(this._last_mevt, this.canvas);
      var coords = {x: pos[0], y: pos[1]},
          w = this.bounds[2], h = this.bounds[3];
      if (coords.y > h-15 && coords.x > btnWidth && coords.x < w-btnWidth) {
        var time = Math.round(p.state.duration*(coords.x-btnWidth)/(w-2*btnWidth));
        if (s === C.PLAYING) {
            p.pause().play(time);
        } else {
            p.play(time).pause();
        }
        return;
      }
      //mute button?
      if (coords.y > h-15 && coords.x > w-btnWidth) {
          p.toggleMute();
          return;
      }
    }

    if (s === C.STOPPED) { p.play(0); return; }
    if (s === C.PAUSED) { p.play(this._time); return; }
    if (s === C.PLAYING) { this._time = time; p.pause(); return; }
}
Controls.prototype.refreshByMousePos = function(pos) {
    if (!this.bounds) return;
    var state = this.player.state;
    this.forceNextRedraw();
    this.render(state.time);
}
Controls.prototype.handleAreaChange = function() {
    if (!this.player || !this.player.canvas) return;
    this.bounds = engine.getCanvasBounds(this.canvas);
}
Controls.prototype.handleMouseMove = function(evt) {
    if (!evt) return;
    var me=this;
    this._last_mevt = evt;

    if (this.hidden) this.show();
    this.refreshByMousePos(engine.getEventPosition(evt, this.canvas));
};

Controls.prototype.scheduleHide = function() {
  var me=this;
  clearTimeout(me._hideTimeout);
  me._hideTimeout = setTimeout(function(){
    me.hide();
  }, 2000);
};

Controls.prototype.resetScheduledHide = function() {
  clearTimeout(me._hideTimeout);
}

Controls.prototype.handleClick = function() {
    var state = this.player.state;
    this.forceNextRedraw();
    this.react(state.time);
    this.render(state.time);
    if (state.happens === C.PLAYING) {
      this.hide();
    }
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
    if (this.hidden) this.show();
    this.forceNextRedraw();
    this.render(state.time);
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
}
Controls.prototype.disableInfo = function() {
}
Controls.prototype.setDuration = function(value) {
}
Controls.prototype.inject = function(anim, duration) {
}

var nextFrame = engine.getRequestFrameFunc(),
    stopAnim = engine.getCancelFrameFunc();

var drawBack = function(ctx, theme, w, h, bgcolor) {
    ctx.save();
    var cx = w / 2,
        cy = h / 2;
    ctx.beginPath();
    ctx.fillStyle = theme.circle.color;
    ctx.arc(cx,cy,theme.circle.radius,0,2*Math.PI);
    ctx.fill();

    ctx.restore();
}

var drawProgress = function(ctx, theme, w, h, progress) {
    if (!is.finite(progress)) return;
    ctx.save();
    var btnWidth = theme.progress.buttonWidth;
    ctx.fillStyle = theme.progress.backColor;
    ctx.fillRect(0, h-15, w, 15);
    ctx.fillStyle = theme.progress.inactiveColor;
    ctx.fillRect(btnWidth, h-10, w-2*btnWidth, 5);
    var progressWidth = Math.round(progress*(w-2*btnWidth));
    ctx.fillStyle = theme.progress.activeColor;
    ctx.fillRect(btnWidth, h-10, progressWidth, 5);
    ctx.restore();

}
var drawPause = function(ctx, theme, w, h, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2;

    ctx.fillStyle = theme.button.color;
    ctx.fillRect(cx - 12, cy - 17, 8, 34);
    ctx.fillRect(cx + 4, cy - 17, 8, 34);

    ctx.restore();

};

var drawTinyPause = function(ctx, w, h) {
    ctx.save();

    var cx = 0,
        cy = h-15;

    ctx.fillStyle = theme.button.color;
    ctx.fillRect(cx+9, cy+3, 3, 9);
    ctx.fillRect(cx+15, cy+3, 3, 9);

    ctx.restore();
};

var drawTinyPlay = function(ctx, w, h) {
    ctx.save();

    var cx = 0,
        cy = h-15;

    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = theme.button.color;
    ctx.beginPath();
    ctx.moveTo(cx + 9, cy + 3);
    ctx.lineTo(cx + 18, cy + 7);
    ctx.lineTo(cx + 9, cy + 11);
    ctx.lineTo(cx + 9, cy + 3);
    ctx.closePath();
    ctx.fill();


    ctx.restore();
};

var drawVolumeBtn = function(ctx, w, h, muted) {
    ctx.save();

    var cx = w-theme.progress.buttonWidth,
        cy = h-15;

    ctx.strokeStyle = 'transparent';
    ctx.lineWidth = 1;
    ctx.fillStyle = theme.button.color;
    ctx.beginPath();
    ctx.translate(cx,cy);
    ctx.moveTo(3,6);
    ctx.lineTo(6,6);
    ctx.lineTo(12,3);
    ctx.lineTo(12,12);
    ctx.lineTo(6,9);
    ctx.lineTo(3,9);
    ctx.lineTo(3,6);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.button.color;

    ctx.beginPath();
    if (muted) {
        ctx.moveTo(15,5);
        ctx.lineTo(21,10);
        ctx.moveTo(15,10);
        ctx.lineTo(21,5);
        ctx.stroke();
    } else {
        // )))
        for (var i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(15+i*3,3);
            ctx.bezierCurveTo(18+i*3,7, 18+i*3,8, 15+i*3, 12);
            ctx.stroke();
        }
    }


    ctx.restore();
}

var drawPlay = function(ctx, theme, w, h, focused) {
    ctx.save();
    var cx = w / 2,
        cy = h / 2;

    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = theme.button.color;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 20);
    ctx.lineTo(cx - 12, cy + 20);
    ctx.lineTo(cx + 18, cy);
    ctx.lineTo(cx - 12, cy - 20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

}

var drawLoading = function(ctx, theme, w, h, hilite_pos, src) {
    drawBack(ctx, theme, w, h);
    drawLoadingProgress(ctx, w, h, hilite_pos);
}

var drawLoadingProgress = function(ctx, w, h, hilite_pos) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2,
        segment = Math.ceil(90 * hilite_pos),
        twoPi = 2 * Math.PI,
        segmentPos = twoPi/90*segment;
        segmentAngle = twoPi/8;

    ctx.translate(cx, cy);
    ctx.strokeStyle = theme.loading.inactiveColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, twoPi);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = theme.loading.activeColor;
    ctx.arc(0,0,36,segmentPos, segmentPos + segmentAngle);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
};

var drawNoAnimation = function(ctx, theme, w, h, focused) {
  //drawAnimatronGuy(ctx,w,h);
};

var drawError = function(ctx, theme, w, h, error, focused) {
    ctx.save();

    var cx = w / 2,
        cy = h / 2;

    ctx.translate(cx, cy);
    ctx.rotate(Math.PI/4);
    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = theme.button.color;
    ctx.fillRect(-25, -3, 50, 6);
    ctx.fillRect(-3, -25, 6, 50);

    ctx.restore();

    drawText(ctx, theme,
                   w / 2, ((h / 2) * (1 + theme.radius.status)),
                   theme.font.statussize * 1.2,
                   (error && error.message) ? utils.ell_text(error.message, theme.statuslimit)
                                            : error, theme.colors.error);
};

var drawTime = function(ctx, theme, w, h, time, duration, progress, coords) {
    var btnWidth = theme.progress.buttonWidth,
        inArea = coords.y >= h-15 && coords.x > btnWidth && coords.x < w-btnWidth;
    if (inArea) {
      //calculate time at mouse position
      progress = (coords.x-btnWidth)/(w-2*btnWidth);
      time = Math.round(duration*progress);
    }
    var progressPos = btnWidth + Math.round(progress*(w-2*btnWidth));
    ctx.beginPath();
    ctx.fillStyle = theme.progress.backColor;
    ctx.strokeStyle = 'transparent';
    ctx.clearRect(0, h-40, w, 20);
    var x = Math.min(Math.max(1, progressPos-17), w-35), r=3, y=h-40, rw=34, rh=20;
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+rw, y,   x+rw, y+rh, r);
    ctx.arcTo(x+rw, y+rh, x,   y+rh, r);
    ctx.arcTo(x,   y+rh, x,   y,   r);
    ctx.arcTo(x,   y,   x+rw, y,   r);
    ctx.moveTo(x+rw/2-3, y+rh);
    ctx.lineTo(x+rw/2, y+rh+3);
    ctx.lineTo(x+rw/2+3, y+rh);
    ctx.closePath();
    ctx.fill();
    drawText(ctx, theme, x+17, (h-30), 8, utils.fmt_time(time));
};

var drawText = function(ctx, theme, x, y, size, text, color, align) {
    ctx.save();
    ctx.font = theme.font.weight + ' ' + Math.floor(size || 15) + 'pt ' + theme.font.face;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || theme.font.color;
    ctx.fillText(text, x, y);
    ctx.restore();
};

var runLoadingAnimation = function(ctx, paint) {
    var props = engine.getAnmProps(ctx);
    if (props.loading_req) return;
    var ratio = engine.PX_RATIO;
    props.supress_loading = false;
    function loading_loop() {
        if (props.supress_loading) return;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (ratio != 1) ctx.scale(ratio, ratio);
        paint(ctx);
        ctx.restore();
        return nextFrame(loading_loop);
    }
    props.loading_req = nextFrame(loading_loop);
};


Controls.stopLoadingAnimation = function(ctx) {
    var props = engine.getAnmProps(ctx);
    if (!props.loading_req) return;
    props.supress_loading = true;
    stopAnim(props.loading_req);
    props.loading_req = null;
};


module.exports = Controls;
