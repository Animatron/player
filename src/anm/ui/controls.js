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
    this.bounds = [];
    this.hidden = false;
    this.elapsed = false;
    this.theme = null;
    this.info = null;
    this._time = -1000;
    this._lhappens = C.NOTHING;
    this._initHandlers(); /* TODO: make automatic */
    this.state = {
        happens: C.NOTHING,
        mpos: {x: 0, y: 0},
        alpha: 1,
        click: false,
        changed: true,
        time: 0,
        gtime: 0,
        fadeTimer: 0,
        fadingIn: false,
        fadingOut: false
    };
}

var theme = Controls.DEFAULT_THEME = require('./controls_theme.json');
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
        this.subscribeEvents(cvs);
        this.changeTheme(Controls.THEME);
        this.setupRenderLoop();
    } else {
        engine.updateOverlay(parent, cvs);
    }
    this.handleAreaChange();
    if (this.info) this.info.update(parent);
    BACK_GRAD = null; // invalidate back gradient
};

Controls.prototype.subscribeEvents = function() {
    var me=this,
        canvas=this.canvas;

    me.player.on(C.S_STATE_CHANGE, function(state) {
        me.state.happens = state;
        me.state.changed = true;
    });

    engine.subscribeCanvasEvents(canvas, {
        mouseenter: function(e) { me.handleMouseEnter(e);},
        mousemove: function(e) { me.handleMouseMove(e);},
        mouseleave: function(e) { me.handleMouseLeave(); },
        mousedown: function(e) { me.handleClick(); engine.preventDefault(e);},
        click: engine.preventDefault,
        dblclick: engine.preventDefault
    });
};

Controls.prototype.render = function(gtime) {
    if (!this.bounds || !this.state.changed) {
        return;
    }

    this.rendering = true;
    var dt = gtime-this.gtime,
        player = this.player,
        s = this.state.happens,
        alpha = this.state.alpha,
        coords = this.state.mpos,
        time = this.state.time = player.state.time;

    this.gtime = gtime;

    var ctx = this.ctx,
        theme = this.theme,
        duration = this.player.state.duration,
        progress = time / ((duration !== 0) ? duration : 1);

    var w = this.bounds[2],
        h = this.bounds[3],
        ratio = engine.PX_RATIO;


    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = alpha;
    if (alpha === 0) {
        this.state.changed = false;
        ctx.restore();
        this.rendering = false;
        return;
    }

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
        this.state.changed = false;
    } else if (s === C.PAUSED) {
        drawBack(ctx, theme, w, h);
        drawPlay(ctx, theme, w, h, this.focused);
        if (duration) {
            drawProgress(ctx, theme, w, h, progress);
            drawTinyPlay(ctx, w, h);
            drawTime(ctx, theme, w, h, time, duration, progress, coords);
            drawVolumeBtn(ctx, w, h, player.muted);
        }
        this.state.changed = false;
    } else if (s === C.NOTHING) {
        drawNoAnimation(ctx, theme, w, h, this.focused);
        this.state.changed = false;
    } else if ((s === C.LOADING) || (s === C.RES_LOADING)) {
            drawLoading(ctx, theme, w, h, ((gtime % 60) / 60), '');
    } else if (s === C.ERROR) {
        drawBack(ctx, theme, w, h);
        drawError(ctx, theme, w, h, player.__lastError, this.focused);
        this.state.changed = false;
    }

    ctx.restore();
    this.fire(C.X_DRAW);


    if (this.info) {
      if (s !== C.NOTHING) { this._infoShown = true; this.info.render(); }
      else { this._infoShown = false; }
    }

    this.rendering = false;
};

Controls.prototype.react = function() {
    if (this.hidden) return;

    var p = this.player,
        s = this.state.happens,
        btnWidth = theme.progress.buttonWidth,
        bottomHeight = theme.bottomControls.height;
    if ((s === C.NOTHING) || (s === C.LOADING) || (s === C.ERROR)) return;
    this.state.changed = true;
    var coords = this.state.mpos,
        w = this.bounds[2], h = this.bounds[3];
    if (isInProgressArea(coords, w, h) && coords.x > btnWidth && coords.x < w-btnWidth) {
        time = Math.round(p.state.duration*(coords.x-btnWidth)/(w-2*btnWidth));
        if (s === C.PLAYING) {
          p.pause().play(time);
        } else {
          p.play(time).pause();
        }
        this.state.time = time;
        return;
    }
    //mute button?
    if (isInProgressArea(coords, w, h) && coords.x > w-btnWidth) {
      p.toggleMute();
      return;
    }

    if (s === C.STOPPED) {
        p.play(0);
        return;
    }
    if (s === C.PAUSED) {
        p.play(this.state.time);
        return;
    }
    if (s === C.PLAYING) {
        p.pause();
        return;
    }
};

Controls.prototype.handleAreaChange = function() {
    if (!this.player || !this.player.canvas) return;
    this.bounds = engine.getCanvasBounds(this.canvas);
};

Controls.prototype.startShow = function(){

};

Controls.prototype.startHide = function(){

};

Controls.prototype.handleMouseMove = function(evt) {
    var pos = engine.getEventPosition(evt, this.canvas);
    this.state.mpos.x = pos[0];
    this.state.mpos.y = pos[1];
    if (isInProgressArea(this.state.mpos, this.bounds[2], this.bounds[3])) {
        this.state.changed = true;
    }
};


Controls.prototype.handleClick = function() {
    this.state.changed = true;
    this.react();
};

Controls.prototype.handleMouseEnter = function() {
    this.show();
    this.forceNextRedraw();
};

Controls.prototype.handleMouseLeave = function() {
    this.hide();
};


Controls.prototype.hide = function() {
    this.state.alpha = 0;
};


Controls.prototype.show = function() {
    this.state.alpha = 1;
};

Controls.prototype.reset = function() {
    this._time = -1000;
    this.elapsed = false;
    if (this.info) this.info.reset();
};

Controls.prototype.detach = function(parent) {
    this.stopRenderLoop();
    engine.detachElement(parent, this.canvas);
    if (this.info) this.info.detach(parent);
    if (this.ctx) engine.clearAnmProps(this.ctx);
};

Controls.prototype.changeTheme = function(to) {
    this.theme = to;
    this.state.changed = true;
};

Controls.prototype.forceNextRedraw = function() {
    this.state.changed = true;
};

Controls.prototype.enable = function() {
    var player = this.player,
        state = player.state;
    this.update(this.player.canvas);
};

Controls.prototype.disable = function() {
    this.hide();
    // FIXME: unsubscribe events!
    this.detach(this.player.wrapper);
};

Controls.prototype.enableInfo = function() {
};

Controls.prototype.disableInfo = function() {
};

Controls.prototype.setDuration = function(value) {
};

Controls.prototype.inject = function(anim, duration) {
};

var getRenderFunc = function(controls) {
    var renderFunc = function() {
        controls.render.call(controls, arguments);
        nextFrame(renderFunc);
    };

    return renderFunc;
};

Controls.prototype.setupRenderLoop = function() {
    this.renderFunc = getRenderFunc(this);
    nextFrame(this.renderFunc);
};

Controls.prototype.stopRenderLoop = function() {
    stopAnim(this.renderFunc);
};


var isInProgressArea = function(mpos, w, h) {
    return(mpos.y <= h && mpos.y >= (h - theme.bottomControls.height));
};

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
};

var drawProgress = function(ctx, theme, w, h, progress) {
    if (!is.finite(progress)) return;
    ctx.save();
    var btnWidth = theme.progress.buttonWidth,
        bottomHeight = theme.bottomControls.height;
    ctx.fillStyle = theme.progress.backColor;
    ctx.fillRect(0, h-bottomHeight, w, bottomHeight);
    ctx.fillStyle = theme.progress.inactiveColor;
    ctx.fillRect(btnWidth, h-10, w-2*btnWidth, 5);
    var progressWidth = Math.round(progress*(w-2*btnWidth));
    ctx.fillStyle = theme.progress.activeColor;
    ctx.fillRect(btnWidth, h-10, progressWidth, 5);
    ctx.restore();

};

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
        cy = h-theme.bottomControls.height;

    ctx.fillStyle = theme.button.color;
    ctx.fillRect(cx+9, cy+3, 3, 9);
    ctx.fillRect(cx+15, cy+3, 3, 9);

    ctx.restore();
};

var drawTinyPlay = function(ctx, w, h) {
    ctx.save();

    var cx = 0,
        cy = h-theme.bottomControls.height;

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
        cy = h-theme.bottomControls.height;

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
};

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

};

var drawLoading = function(ctx, theme, w, h, hilite_pos, src) {
    drawBack(ctx, theme, w, h);
    drawLoadingProgress(ctx, w, h, hilite_pos);
};

var drawLoadingProgress = function(ctx, w, h, hilite_pos) {
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
        inArea = isInProgressArea(coords, w, h) && coords.x > btnWidth && coords.x < w-btnWidth;
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

module.exports = Controls;
