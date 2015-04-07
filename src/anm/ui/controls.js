var utils = require('../utils.js'),
    is = utils.is;

var C = require('../constants.js'),
    Strings = require('../loc.js').Strings;

var engine = require('engine'),
    InfoBlock = require('./infoblock.js');

//fade modes
var FADE_NONE = 0,
    FADE_IN = 1,
    FADE_OUT = 2;

// Controls
// -----------------------------------------------------------------------------

/**
 * @class anm.Controls
 */
function Controls(player) {
    this.player = player;
    this.canvas = null;
    this.ctx = null;
    this.bounds = [];
    this.theme = null;
    this.info = null;

    this.state = {
        happens: C.NOTHING,
        mpos: {x: 0, y: 0},
        alpha: 1,
        click: false,
        changed: true,
        time: 0,
        gtime: 0,
        fadeTimer: 0,
        fadeMode: FADE_NONE,
        mouseInteractedAt: 0
    };
}

var theme = Controls.DEFAULT_THEME = require('./controls_theme.json');
Controls.THEME = Controls.DEFAULT_THEME;

Controls.LAST_ID = 0;
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
};

Controls.prototype.subscribeEvents = function() {
    var me=this;

    me.player.on(C.S_CHANGE_STATE, function(state) {
        me.state.happens = state;
        me.state.changed = true;
    });

    engine.subscribeCanvasEvents(me.canvas, {
        mouseenter: function(e) { me.handleMouseEnter(e);},
        mousemove: function(e) { me.handleMouseMove(e);},
        mouseleave: function(e) { me.handleMouseLeave(); },
        mousedown: function(e) { me.handleClick(); engine.preventDefault(e);},
        click: engine.preventDefault,
        dblclick: engine.preventDefault
    });
};

//check and update the time when the mouse was last moved or clicked.
//fade out the controls if the mouse has been inactive for `fadeTimes.idle` ms.
Controls.prototype.checkMouseTimeout = function(gtime) {
    if (this.state.mouseInteracted) {
        this.state.mouseInteractedAt = gtime;
        this.state.mouseInteracted = false;
        this.state.autoHidden = false;
        this.show();
    } else if(!this.state.autoHidden){
        var idleTime = gtime - this.state.mouseInteractedAt;
        if (idleTime > this.theme.fadeTimes.idle &&
            //if we're in a state where controls should autohide
            (this.state.happens === C.PLAYING || this.state.happens === C.PAUSED) &&
            //and the mouse is not busy somewhere on the bottom area
            !Controls.isInProgressArea(this.state.mpos, this.bounds[2], this.bounds[3])
        ) {
            this.hide();
            this.state.autoHidden = true;
        }
    }
};

//check if controls are being faded in/out, update alpha accordingly
//return true if a fade is in progress
Controls.prototype.checkFade = function(dt) {
    var state = this.state,
        fadeMode = state.fadeMode,
        fadeModifier = false,
        alpha = state.alpha;
    if (fadeMode !== FADE_NONE) {
        fadeModifier = true;
        state.fadeTimer -= dt;
        if (fadeMode === FADE_IN) {
            alpha = Math.min(1, 1-state.fadeTimer/theme.fadeTimes.fadein);
        } else { // FADE_OUT
            alpha = Math.max(0, state.fadeTimer/theme.fadeTimes.fadeout);
        }
        state.alpha = alpha;

        if (state.fadeTimer <= 0) {
            state.fadeTimer = 0;
            state.fadeMode = FADE_NONE;

        }
    }
    return fadeModifier;
};

Controls.prototype.render = function(gtime) {
    this.checkMouseTimeout(gtime);

    var dt = gtime - this.state.gtime;
    var prevGtime = this.state.gtime;
    this.state.gtime = gtime;

    if (!this.bounds || !this.state.changed) {
        // no reason to render nothing or the same image again
        return;
    }

    this.rendering = true;

    var fadeModifier = this.checkFade(dt);

    var state = this.state,
        player = this.player,
        s = state.happens,
        coords = state.mpos,
        time = state.time = player.state.time;

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
    ctx.globalAlpha = state.alpha;

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
        state.changed = false;
    } else if (s === C.PAUSED) {
        drawBack(ctx, theme, w, h);
        if (duration) {
            drawProgress(ctx, theme, w, h, progress);
            drawTinyPlay(ctx, w, h);
            drawTime(ctx, theme, w, h, time, duration, progress, coords);
            drawVolumeBtn(ctx, w, h, player.muted);
        }
        drawPlay(ctx, theme, w, h, this.focused);
        state.changed = false;
    } else if (s === C.NOTHING) {
        drawNoAnimation(ctx, theme, w, h, this.focused);
        state.changed = false;
    } else if ((s === C.LOADING) || (s === C.RES_LOADING)) {
        drawLoadingProgress(ctx, w, h, this.loadingProgress, this.loadingErrors);
    } else if (s === C.ERROR) {
        drawBack(ctx, theme, w, h);
        drawError(ctx, theme, w, h, player.__lastError, this.focused);
        state.changed = false;
    }

    ctx.restore();

    if (this.info) {
        if (s !== C.NOTHING) { this._infoShown = true; this.info.render(); }
        else { this._infoShown = false; }
    }
    //we might have a non-changing state like STOPPED, but it will still
    //need to be redrawn when fading in/out, so we apply our fade modifier
    //if applicable at this point
    state.changed |= fadeModifier;

    this.rendering = false;
};

//react to a click on the controls
Controls.prototype.react = function() {
    if (this.hidden) return;

    var p = this.player,
        s = this.state.happens,
        btnWidth = theme.progress.buttonWidth,
        bottomHeight = theme.bottomControls.height;
    if ((s === C.NOTHING) || (s === C.LOADING) || (s === C.ERROR)) return;
    var coords = this.state.mpos,
        w = this.bounds[2], h = this.bounds[3];

    //handle clicks in the bottom area, where the playhead
    //and mute buttons reside
    if (Controls.isInProgressArea(coords, w, h)) {
        if (coords.x > btnWidth && coords.x < w-btnWidth) {
            time = utils.roundTo(p.state.duration*(coords.x-btnWidth)/(w-2*btnWidth), 1);
            if (time > p.anim.duration) {
                //when the animation is something like 3.8 seconds long,
                //the rounding will exceed the duration, which is not
                //a good idea.
                time = p.anim.duration;
            }
            if (s === C.PLAYING) {
              p.pause()
               .play(time);
            } else {
              p.play(time).pause();
            }
            this.state.time = time;
            return;
        } else if(coords.x > w-btnWidth) { //mute button?
            p.toggleMute();
            return;
        }
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

Controls.prototype.handleMouseMove = function(evt) {
    this.state.mouseInteracted = true;
    var pos = engine.getEventPosition(evt, this.canvas);
    this.state.mpos.x = pos[0];
    this.state.mpos.y = pos[1];
    if (this.state.happens === C.PLAYING || this.state.happens === C.PAUSED) {
        //if we are in the state where the playhead is accessible,
        //let's check if the mouse was there.
        if (Controls.isInProgressArea(this.state.mpos, this.bounds[2], this.bounds[3])) {
            this.state.changed = true;
            this.state.mouseInProgressArea = true;
        } else {
            // if the mouse left the progress area, we need to redraw the
            // controls to possibly update the time marker position
            if (this.state.mouseInProgressArea) {
                this.state.changed = true;
            }
            this.state.mouseInProgressArea = false;
        }
    }
};


Controls.prototype.handleClick = function() {
    this.state.changed = true;
    this.state.mouseInteracted = true;
    this.show();
    this.react();
};

Controls.prototype.handleMouseEnter = function() {
    this.show();
    this.forceNextRedraw();
};

Controls.prototype.handleMouseLeave = function() {
    if (this.state.happens === C.PLAYING || this.state.happens === C.PAUSED) {
        this.hide();
    }
};


Controls.prototype.hide = function() {
    if (this.state.alpha === 0 || this.state.fadeMode === FADE_OUT) {
        //already hidden/hiding
        return;
    }
    this.state.fadeMode = FADE_OUT;
    //we substract the current fadeTimer value so that if the controls only
    //showed halfway, they will fade out from the exact alpha they were in
    this.state.fadeTimer = theme.fadeTimes.fadeout - this.state.fadeTimer;
    this.state.changed = true;
};


Controls.prototype.show = function() {
    if (this.state.alpha === 1 || this.state.fadeMode === FADE_IN) {
        //already shown/showing
        return;
    }
    this.state.fadeMode = FADE_IN;
    this.state.fadeTimer = theme.fadeTimes.fadein - this.state.fadeTimer;
    this.state.changed = true;
};

Controls.prototype.reset = function() {
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

var nextFrame = engine.getRequestFrameFunc(),
    stopAnim = engine.getCancelFrameFunc();

var getRenderFunc = function(controls) {
    var renderFunc = function(t) {
        controls.render.call(controls, t);
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

//check whether the mpos coordinates are within the bottom area
Controls.isInProgressArea = function(mpos, w, h) {
    return(mpos.y <= h && mpos.y >= (h - theme.bottomControls.height));
};

//draw the play/pause button background
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

//draw the progress area, complete with the progress bar
var drawProgress = function(ctx, theme, w, h, progress) {
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

//draw the pause button
var drawPause = function(ctx, theme, w, h, focused) {
    ctx.save();
    var cx = w / 2,
        cy = h / 2;
    ctx.fillStyle = theme.button.color;
    ctx.fillRect(cx - 12, cy - 17, 8, 34);
    ctx.fillRect(cx + 4, cy - 17, 8, 34);
    ctx.restore();
};

//draw the play button
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

//draw the small pause/play buttons in the bottom area
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

// draw the sound on/off button
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

// draw loading progress at the bottom
var drawLoadingProgress = function(ctx, w, h, factor, errorFactor) {

    if (!factor && !errorFactor) return;

    // draw loading progress at the bottom

    ctx.translate(0, h - theme.loading.factorLineWidth);
    ctx.strokeStyle = theme.loading.factorBackColor;
    ctx.lineWidth = theme.loading.factorLineWidth;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.strokeStyle = theme.loading.factorDoneColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * factor, 0);
    ctx.stroke();
    if (errorFactor) {
        ctx.strokeStyle = theme.loading.factorErrorColor;
        ctx.moveTo(w * factor, 0);
        ctx.lineTo(w * errorFactor, 0);
        ctx.stroke();
    }
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
                   w / 2, ((h / 2) * (1 + theme.circle.radius)),
                   theme.font.statussize * 1.2,
                   (error && error.message) ? utils.ell_text(error.message, theme.error.statuslimit)
                                            : error, theme.error.color);
};

//draw either the current time or the time under the mouse position
var drawTime = function(ctx, theme, w, h, time, duration, progress, coords) {
    var btnWidth = theme.progress.buttonWidth,
        inArea = Controls.isInProgressArea(coords, w, h) && coords.x > btnWidth && coords.x < w-btnWidth;
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
    drawRoundedRect(ctx,x,y,rw,rh,r);
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

var drawRoundedRect = function(ctx, x, y, w, h, radius)
{
  var r = x + w;
  var b = y + h;
  ctx.moveTo(x+radius, y);
  ctx.lineTo(r-radius, y);
  ctx.quadraticCurveTo(r, y, r, y+radius);
  ctx.lineTo(r, y+h-radius);
  ctx.quadraticCurveTo(r, b, r-radius, b);
  ctx.lineTo(x+radius, b);
  ctx.quadraticCurveTo(x, b, x, b-radius);
  ctx.lineTo(x, y+radius);
  ctx.quadraticCurveTo(x, y, x+radius, y);
};

module.exports = Controls;
