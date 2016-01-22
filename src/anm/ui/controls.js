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
    this.invisible = player.controlsInvisible;

    this.happens = C.NOTHING;

    this.mpos = { x: 0, y: 0 };
    this.alpha = 1;
    this.click = false;
    this.updated = true;

    this.autoHidden = false;
    this.mouseInteracted = false;
    this.mouseInteractedAt = 0;

    this.fadeTimer = 0;
    this.fadeMode = FADE_NONE;
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
    var me = this;

    me.player.on(C.S_CHANGE_STATE, function(state) {
        me.happens = state;
        me.updated = true;
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
    if (this.mouseInteracted) {
        this.mouseInteractedAt = gtime;
        this.mouseInteracted = false;
        this.autoHidden = false;
        this.show();
    } else if (!this.autoHidden) {
        var idleTime = gtime - this.mouseInteractedAt;
        if (idleTime > this.theme.fadeTimes.idle &&
            //if we're in a state where controls should autohide
            (this.happens === C.PLAYING || this.happens === C.PAUSED) &&
            //and the mouse is not busy somewhere on the bottom area
            !Controls.isInBottomArea(this.mpos, this.bounds[2], this.bounds[3])
        ) {
            this.hide();
            this.autoHidden = true;
        }
    }
};

//check if controls are being faded in/out, update alpha accordingly
//return true if a fade is in progress
Controls.prototype.checkFade = function(dt) {
    var fadeMode = this.fadeMode,
        fadeModifier = false,
        alpha = this.alpha;
    if (fadeMode !== FADE_NONE) {
        fadeModifier = true;
        this.fadeTimer -= dt;
        if (this.fadeMode === FADE_IN) {
            alpha = Math.min(1, 1 - this.fadeTimer / theme.fadeTimes.fadein);
        } else { // FADE_OUT
            alpha = Math.max(0, this.fadeTimer / theme.fadeTimes.fadeout);
        }
        this.alpha = alpha;

        if (this.fadeTimer <= 0) {
            this.fadeTimer = 0;
            this.fadeMode = FADE_NONE;
        }
    }
    return fadeModifier;
};

Controls.prototype.render = function(gtime) {
    this.checkMouseTimeout(gtime);

    var player = this.player;

    var dt = gtime - this.gtime;
    var prevGtime = this.gtime;
    this.gtime = gtime;
    this.time = player.getTime();

    if (this.invisible) {
        return;
    }

    if (!this.bounds || !this.updated) {
        // no reason to render nothing or the same image again
        return;
    }

    this.rendering = true;

    var fadeModifier = this.checkFade(dt);

    var s = this.happens,
        coords = this.mpos,
        time = this.time;

    var ctx = this.ctx,
        theme = this.theme,
        duration = player.anim ? player.anim.getDuration() : Infinity,
        progress = time / ((duration !== 0) ? duration : 1);

    var w = this.bounds[2],
        h = this.bounds[3],
        ratio = engine.PX_RATIO;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (ratio != 1) ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = this.alpha;

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
        this.updated = false;
    } else if (s === C.PAUSED) {
        if (duration) {
            drawProgress(ctx, theme, w, h, progress);
            drawTinyPlay(ctx, w, h);
            drawTime(ctx, theme, w, h, time, duration, progress, coords);
            drawVolumeBtn(ctx, w, h, player.muted);
        }
        drawBack(ctx, theme, w, h);
        drawPlay(ctx, theme, w, h, this.focused);
        this.updated = false;
    } else if (s === C.NOTHING) {
        drawNoAnimation(ctx, theme, w, h, this.focused);
        this.updated = false;
    } else if ((s === C.LOADING) || (s === C.RES_LOADING)) {
        drawLoadingProgress(ctx, w, h, this.loadingProgress, this.loadingErrors);
    } else if (s === C.ERROR) {
        drawBack(ctx, theme, w, h);
        drawError(ctx, theme, w, h, player.__lastError, this.focused);
        this.updated = false;
    }

    ctx.restore();

    if (this.info) {
        if (s !== C.NOTHING) { this._infoShown = true; this.info.render(); }
        else { this._infoShown = false; }
    }
    //we might have a non-changing state like STOPPED, but it will still
    //need to be redrawn when fading in/out, so we apply our fade modifier
    //if applicable at this point
    this.updated |= fadeModifier;

    this.rendering = false;
};

//react to a click on the controls
Controls.prototype.react = function() {
    if (this.hidden) return;

    var p = this.player,
        s = this.happens;

    if ((s === C.NOTHING) || (s === C.LOADING) || (s === C.ERROR)) return;

    var duration = p.anim ? p.anim.getDuration() : 0,
        btnWidth = theme.bottom.buttonSize,
        progressMargin = theme.bottom.progress.margin,
        progressHeight = theme.bottom.progress.inactiveHeight, // FIXME: make activeHeight
        bottomHeight = theme.bottom.height;

    var coords = this.mpos,
        w = this.bounds[2], h = this.bounds[3];

    //handle clicks in the bottom area, where the playhead
    //and mute buttons reside
    if (!this.invisible && Controls.isInBottomArea(coords, w, h)) {
        if ((coords.x > progressMargin) && (coords.x < w-progressMargin) && (coords.y < (h - bottomHeight + progressHeight))) {
            time = utils.roundTo(duration*(coords.x-progressMargin)/(w-2*progressMargin), 1);
            p.seek(time);
            this.time = time;
            return;
        } else if (coords.x > w-theme.bottom.marginX-btnWidth) { //mute button?
            p.toggleMute();
            return;
        }
    }
    if (s === C.STOPPED) {
        p.play(0);
        return;
    }
    if (s === C.PAUSED) {
        p.play(this.time);
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
    this.mouseInteracted = true;
    var pos = engine.getEventPosition(evt, this.canvas);
    this.mpos.x = pos.x;
    this.mpos.y = pos.y;
    if (this.happens === C.PLAYING || this.happens === C.PAUSED) {
        //if we are in the state where the playhead is accessible,
        //let's check if the mouse was there.
        if (Controls.isInBottomArea(this.mpos, this.bounds[2], this.bounds[3])) {
            this.updated = true;
            this.mouseInProgressArea = true;
        } else {
            // if the mouse left the progress area, we need to redraw the
            // controls to possibly update the time marker position
            if (this.mouseInProgressArea) {
                this.updated = true;
            }
            this.mouseInProgressArea = false;
        }
    }
};

Controls.prototype.handleClick = function() {
    this.updated = true;
    this.mouseInteracted = true;
    this.show();
    this.react();
};

Controls.prototype.handleMouseEnter = function() {
    this.show();
    this.forceNextRedraw();
};

Controls.prototype.handleMouseLeave = function() {
    if (this.happens === C.PLAYING || this.happens === C.PAUSED) {
        this.hide();
    }
};

Controls.prototype.hide = function() {
    if (this.alpha === 0 || this.fadeMode === FADE_OUT) {
        //already hidden/hiding
        return;
    }
    this.fadeMode = FADE_OUT;
    //we substract the current fadeTimer value so that if the controls only
    //showed halfway, they will fade out from the exact alpha they were in
    this.fadeTimer = theme.fadeTimes.fadeout - this.fadeTimer;
    this.updated = true;
};

Controls.prototype.show = function() {
    if (this.alpha === 1 || this.fadeMode === FADE_IN) {
        //already shown/showing
        return;
    }
    this.fadeMode = FADE_IN;
    this.fadeTimer = theme.fadeTimes.fadein - this.fadeTimer;
    this.updated = true;
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
    this.updated = true;
};

Controls.prototype.forceNextRedraw = function() {
    this.updated = true;
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
    stopAnim = engine.getCancelFrameFunc(),
    lastRequest = null;

Controls.prototype.setupRenderLoop = function() {
    var controls = this;
    var renderFunc = function(t) {
        controls.render(t);
        nextFrame(renderFunc);
    };
    lastRequest = nextFrame(renderFunc);
};

Controls.prototype.stopRenderLoop = function() {
    if (lastRequest) stopAnim(lastRequest);
};

//check whether the mpos coordinates are within the bottom area
Controls.isInBottomArea = function(mpos, w, h) {
    return (mpos.y <= h && mpos.y >= (h - theme.bottom.height));
};

//draw the play/pause button background
var drawBack = function(ctx, theme, w, h, bgcolor) {
    ctx.save();
    var cx = w / 2,
        cy = h / 2;
    ctx.beginPath();
    ctx.fillStyle = theme.circle.color;
    ctx.arc(cx, cy, theme.circle.radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
};

//draw the progress area, complete with the progress bar
var drawProgress = function(ctx, theme, w, h, progress) {
    ctx.save();
    var btnWidth = theme.bottom.buttonSize,
        backGradColors = theme.bottom.backGradient,
        bottomHeight = theme.bottom.height;
    var progressMargin = theme.bottom.progress.margin,
        progressHeight = theme.bottom.progress.inactiveHeight;
    var backGradient = ctx.createLinearGradient(0, 0, 0, h);
    for (var i = 0; i < backGradColors.length; i++) {
        backGradient.addColorStop(backGradColors[i][0], backGradColors[i][1]);
    }
    ctx.fillStyle = backGradient;
    ctx.fillRect(0, 0, w, h);
    ctx.translate(0, h - bottomHeight);
    ctx.fillStyle = theme.bottom.progress.inactiveColor;
    ctx.fillRect(progressMargin, 0, w - 2 * progressMargin, progressHeight);
    var progressWidth = Math.round(progress * (w - 2 * progressMargin));
    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = theme.bottom.progress.activeColor;
    ctx.fillRect(progressMargin, 0, progressWidth, progressHeight);
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

    var cx = 0 + theme.bottom.marginX,
        cy = h - theme.bottom.height + theme.bottom.marginY,
        bh = theme.bottom.buttonSize; // bar height

    var bw = Math.floor(bh * 0.37), // bar width
        gw = Math.floor(bh * 0.26); // gap width

    ctx.translate(cx, cy);

    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = theme.button.color;
    ctx.fillRect(0, 0, bw, bh);
    ctx.fillRect(bw + gw, 0, bw, bh);

    ctx.restore();
};

var drawTinyPlay = function(ctx, w, h) {
    ctx.save();

    var cx = 0 + theme.bottom.marginX,
        cy = h - theme.bottom.height + theme.bottom.marginY,
        bs = theme.bottom.buttonSize;

    ctx.translate(cx, cy);

    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = theme.button.color;
    ctx.beginPath();
    ctx.moveTo(0,  0);
    ctx.lineTo(Math.floor(bs * 1.1), bs / 2);
    ctx.lineTo(0, bs);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
};

// draw the sound on/off button
var drawVolumeBtn = function(ctx, w, h, muted) {
    ctx.save();

    var cx = w - theme.bottom.buttonSize - theme.bottom.marginX,
        cy = h - theme.bottom.height + theme.bottom.marginY;

    var bs = theme.bottom.buttonSize; // button size

    ctx.translate(cx, cy);

    ctx.strokeStyle = 'transparent';
    ctx.lineWidth = 1;
    ctx.fillStyle = theme.button.color;
    ctx.beginPath();
    ctx.moveTo(0, Math.floor(bs * 0.35));
    ctx.lineTo(Math.floor(bs * 0.3), Math.floor(bs * 0.35));
    ctx.lineTo(Math.floor(bs * 0.7), 0);
    ctx.lineTo(Math.floor(bs * 0.7), bs);
    ctx.lineTo(Math.floor(bs * 0.3), Math.ceil(bs * 0.65));
    ctx.lineTo(Math.floor(bs * 0.3), Math.ceil(bs * 0.65));
    ctx.lineTo(0, Math.ceil(bs * 0.65));
    ctx.lineTo(0, Math.floor(bs * 0.4));
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.button.color;

    var ms = bs - Math.floor(bs * 0.75); // mark size
    ctx.translate(Math.floor(bs * 0.75), (bs / 2) - (ms / 2));
    if (muted) {
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(ms,ms);
        ctx.moveTo(ms,0);
        ctx.lineTo(0,ms);
        ctx.stroke();
    } else {
        // )))
        var gap = ms / 3;
        for (var i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, ms / 2, (i * gap) + gap, 1.5*Math.PI, 0.5*Math.PI);
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
    var btnWidth = theme.bottom.buttonSize,
        bottomHeight = theme.bottom.height,
        progressMargin = theme.bottom.progress.margin,
        progressHeight = theme.bottom.progress.inactiveHeight;
    var myHeight = 13,
        myWidth = 30;
    var inArea = Controls.isInBottomArea(coords, w, h)
                 && (coords.x > progressMargin) && (coords.x < w-progressMargin)
                 && (coords.y > (h - bottomHeight - 2))
                 && (coords.y < (h - bottomHeight + progressHeight + 2));
    var timeX = theme.bottom.marginX + btnWidth + 7,
        timeY = h - ((bottomHeight - progressHeight) / 2);
    drawText(ctx, theme, timeX, timeY, 10, utils.fmt_time(time) + ' / ' + utils.fmt_time(duration), null, 'left');
    if (inArea) {
        //calculate time at mouse position
        progress = (coords.x - progressMargin) / (w - 2 * progressMargin);
        time = Math.round(duration*progress);
        var progressPos = progressMargin + Math.round(progress * (w - 2 * progressMargin));
        ctx.beginPath();
        var x = Math.min(Math.max(1, progressPos-(myWidth / 2)), w-myWidth), r=2, rw=myWidth, rh=myHeight;
        var y = h - bottomHeight - myHeight - 1;
        ctx.fillStyle = theme.bottom.hintBackColor;
        ctx.strokeStyle = 'transparent';
        //ctx.clearRect(0, 0, w, myHeight); // clear previous tip area
        ctx.fillRect(progressPos - 2, h - bottomHeight, 3, 3);
        drawRoundedRect(ctx,x,y,rw,rh,r);
        ctx.fill();
        drawText(ctx, theme, x + (myWidth / 2), y + (myHeight / 2) + 1, 6, utils.fmt_time(time));
    }
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
