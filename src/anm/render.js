var C = require('./constants.js');

var Painter = require('./animation/painter.js'),
    Modifier = require('./animation/modifier.js');

var Brush = require('./graphics/brush.js');

var engine = require('engine'),
    nextFrame = engine.getRequestFrameFunc();

var fit_rects = require('./utils.js').fit_rects;

// Rendering
// -----------------------------------------------------------------------------

var Render = {}; // means "Render", render loop + system modifiers & painters

// functions below, the ones named in a way like `r_*` are the real functions
// acting under their aliases `Render.*`; it is done this way because probably
// the separate function which is not an object propertly, will be a bit faster to
// access during animation loop

//time counters to emit S_TIME_UPDATE every second or so
var timeCounters = {}, TIME_UPDATE_DELTA = 1;

// draws current state of animation on canvas and postpones to call itself for
// the next time period (so to start animation, you just need to call it once
// when the first time must occur and it will chain its own calls automatically)
function r_loop(ctx, player, anim, before, after, before_render, after_render) {
    if (typeof timeCounters[player.id] === 'undefined') {
        timeCounters[player.id] = 0;
    }
    if (player.happens !== C.PLAYING) return;

    var timeline = anim.timeline;

    var msec = (Date.now() - player.__startTime);
    var sec = msec / 1000;

    var time = (sec * timeline.speed) + player.__startFrom,
        dt = time - player.__prevt;
    player.__dt = dt;
    player.__prevt = time;

    if (before) {
        if (!before(time)) return;
    }

    var fps = 0;
    if (player.__rsec === 0) player.__rsec = msec;

    if ((msec - player.__rsec) >= 1000) {
        fps = player.__redraws;
        player.fps = fps;
        player.__rsec = msec;
        player.__redraws = 0;
    }
    player.__redraws++;

    r_next(dt, ctx, anim,
           player.width, player.height, player.zoom, player.ribbonsColor,
           before_render, after_render);

    // show fps
    if (player.debug) {
        r_fps(ctx, player.fps, time);
    }

    if (after) {
        if (!after(time)) return;
    }

    //increase the counter and fire the event if necessary
    timeCounters[player.id] += dt;
    if (timeCounters[player.id] >= TIME_UPDATE_DELTA) {
        player.fire(C.S_TIME_UPDATE, time);
        timeCounters[player.id] = 0;
    }

    return (player.__lastReq = nextFrame(function() {
        r_loop(ctx, player, anim, before, after, before_render, after_render);
    }));
}

function r_next(dt, ctx, anim, width, height, zoom, rib_color, before, after) {
    ctx.save();
    var ratio = engine.PX_RATIO;
    if (ratio !== 1) { ctx.scale(ratio, ratio); }
    width = width | 0;
    height = height | 0;
    var size_differs = (width  != anim.width) ||
                       (height != anim.height);
    anim.factor = 1 * (zoom || 1) * (anim.zoom || 1);
    if (!size_differs) {
        ctx.clearRect(0, 0, anim.width,
                            anim.height);
        if (before) before(anim.getTime(), ctx);
        if (zoom != 1) { ctx.scale(zoom, zoom); }
        anim.tick(dt);
        anim.render(ctx);
        if (after) after(anim.getTime(), ctx);
        ctx.restore();
    } else {
        r_with_ribbons(ctx, anim,
                       width, height,
                       anim.width, anim.height,
                       rib_color,
            function(_scale) {
                ctx.clearRect(0, 0, anim.width, anim.height);
                if (before) before(anim.getTime(), ctx);
                if (zoom != 1) { ctx.scale(zoom, zoom); }
                anim.tick(dt);
                anim.render(ctx);
                if (after) after(anim.getTime(), ctx);
                ctx.restore();
            });
    }
}

function r_with_ribbons(ctx, anim, pw, ph, aw, ah, color, draw_f) {
    // pw == player width, ph == player height
    // aw == anim width,   ah == anim height
    var f_rects   = fit_rects(pw, ph, aw, ah),
        factor    = f_rects[0],
        anim_rect = f_rects[1],
        rect1     = f_rects[2],
        rect2     = f_rects[3];
    ctx.save();
    if (rect1 || rect2) {
        ctx.save();
        ctx.fillStyle = color || '#000';
        if (rect1) {
            ctx.clearRect(rect1[0], rect1[1],
                          rect1[2], rect1[3]);
            ctx.fillRect(rect1[0], rect1[1],
                         rect1[2], rect1[3]);
        }
        if (rect2) {
            ctx.clearRect(rect2[0], rect2[1],
                          rect2[2], rect2[3]);
            ctx.fillRect(rect2[0], rect2[1],
                         rect2[2], rect2[3]);
        }
        ctx.restore();
    }
    if (anim_rect) {
        ctx.beginPath();
        if (engine.isIE10) {
            //fix for IE10's clip bug
            anim_rect[0] = Math.floor(anim_rect[0]);
            anim_rect[1] = Math.floor(anim_rect[1]);
            anim_rect[2] = Math.ceil(anim_rect[2]);
            anim_rect[3] = Math.ceil(anim_rect[3]);
        }
        ctx.rect(anim_rect[0], anim_rect[1],
                 anim_rect[2], anim_rect[3]);
        ctx.clip();
        ctx.translate(anim_rect[0], anim_rect[1]);
    }
    anim.factor = anim.factor * factor; // anim.factor is always reset in r_at
    if (factor != 1) { ctx.scale(factor, factor); }
    draw_f(factor);
    ctx.restore();
}

function r_fps(ctx, fps, time) {
    ctx.fillStyle = '#999';
    ctx.font = '20px sans-serif';
    ctx.fillText(Math.floor(fps), 8, 20);
    ctx.font = '10px sans-serif';
    ctx.fillText(Math.floor(time * 1000) / 1000, 8, 35);
}

Render.loop = r_loop;
Render.next = r_next;
Render.drawFPS = r_fps;

// SYSTEM PAINTERS

Render.p_drawVisuals = new Painter(function(ctx) { this.applyVisuals(ctx); }, C.PNT_SYSTEM);

Render.p_applyAComp = new Painter(function(ctx) { this.applyAComp(ctx); }, C.PNT_SYSTEM);

// DEBUG PAINTERS

// TODO: also move into Element class

Render.p_drawBounds = new Painter(function(ctx, bounds) {
    var my_bounds = this.myBounds();
    if (!my_bounds || this.isEmpty()) return;
    var stokeStyle = this.isEmpty() ? '#f00' : '#600';
    var width = my_bounds.width, height = my_bounds.height;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = stokeStyle;
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}, C.PNT_DEBUG);

Render.p_drawPivot = new Painter(function(ctx, pivot) {
    if (!(pivot = pivot || this.$pivot)) return;
    var my_bounds = this.myBounds();
    var stokeStyle = this.isEmpty() ? '#600' : '#f00';
    ctx.save();
    if (my_bounds) {
        ctx.translate(pivot[0] * my_bounds.width,
                      pivot[1] * my_bounds.height);
    }
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = stokeStyle;
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 0);
    ctx.moveTo(3, 0);
    //ctx.moveTo(0, 5);
    ctx.arc(0,0,3,0,Math.PI*2,true);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}, C.PNT_DEBUG);

Render.p_drawReg = new Painter(function(ctx, reg) {
    if (!(reg = reg || this.$reg)) return;
    ctx.save();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#00f';
    ctx.fillStyle = 'rgba(0,0,255,.3)';
    ctx.translate(reg[0], reg[1]);
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 0);
    ctx.moveTo(3, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}, C.PNT_DEBUG);

Render.p_drawName = new Painter(function(ctx, name) {
    if (!(name = name || this.name)) return;
    ctx.save();
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText(name, 0, 10);
    ctx.restore();
}, C.PNT_DEBUG);

Render.p_drawTime = new Painter(function(ctx, time) {
    if (!(time = time || this.getTime())) return;
    ctx.save();
    ctx.fillStyle = '#600';
    ctx.font = '10px sans-serif';
    ctx.fillText(Math.round(time * 1000) / 1000, 0, 20);
    ctx.restore();
}, C.PNT_DEBUG);

Render.p_drawMPath = new Painter(function(ctx, mPath) {
    if (!(mPath = mPath || this.$mpath)) return;
    ctx.save();
    //var s = this.$.astate;
    //Render.p_usePivot.call(this.xdata, ctx);
    Brush.qstroke(ctx, '#600', 2.0);
    //ctx.translate(-s.x, -s.y);
    //ctx.rotate(-s.angle);
    ctx.beginPath();
    mPath.apply(ctx);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}, C.PNT_DEBUG);

Render.m_checkBand = new Modifier(function(time, duration, band) {
    if (band[0] > (duration * time)) return false; // exit
    if (band[1] < (duration * time)) return false; // exit
}, C.MOD_SYSTEM);

module.exports = Render;
