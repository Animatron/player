var C = require('../constants.js');

var utils = require('../utils.js');
var is = utils.is;

var events = require('../events.js'),
    provideEvents = events.provideEvents;

var NO_TIME = [ 'UNKNOWN' ];
function isKnownTime(t) { return !(t === NO_TIME); }

//var NO_TIME = undefined;
//function isKnownTime(t) { return is.defined(t); }

/**
 * @class anm.Timeline
 *
 * Stores and manages all the timing of a single element.
 */
function Timeline(owner) {
    this.owner = owner;

    this.start = 0;
    this.duration = Infinity;
    this.end = C.R_ONCE;
    this.nrep = Infinity;
    this.actions = [];
    this.paused = false;
    this.pos = -this.start || 0;
    this.actualPos = -this.start || 0;
    this.easing = null;
    this.speed = 1;
    this.lastDelta = 0;

    this.passedStart = false;
    this.passedEnd = false;
};
provideEvents(Timeline, [ /*C.X_TICK, */C.X_START, C.X_END, C.X_MESSAGE,
    C.X_JUMP, C.X_PAUSE, C.X_CONTINUE, C.X_ITER ]);

Timeline.NO_TIME = NO_TIME;
Timeline.isKnownTime = isKnownTime;

Timeline.prototype.reset = function() {
    this.paused = false;
    this.pos = -this.start;
    this.actualPos = -this.start;
    this.passedStart = false;
    this.passedEnd = false;
    this.lastDelta = 0;
};

Timeline.prototype.addAction = function(t, f) {
    var actions = this.actions;
    var i = 0;
    for (var il = this.actions.length; (i < il) && (actions[i].time < t); i++) { };
    this.actions.splice(i, 0, { time: t, func: f });
};

Timeline.prototype.tick = function(dt) {
    this.actualPos += dt;

    if (this.paused) { this.lastDelta = 0; return this.pos; }

    var next = (this.pos !== NO_TIME) ? (this.pos + dt) : NO_TIME;
    next = this._checkSwitcher(next);

    if (next !== NO_TIME) {

        this.lastDelta = dt;

        next = (this.easing ? this.easing(next) : next);

        if (is.finite(this.duration) && (next > this.duration)) {
            if (this.mode === C.R_ONCE) {
                //next = NO_TIME; let it be higher than duration
            } else if (this.mode === C.R_STAY) {
                var wasPaused = this.paused;
                this.paused = true;
                next = this.duration;
                if (!wasPaused) this.fire(C.X_PAUSE, next);
            } else if (this.mode === C.R_LOOP) {
                var fits = Math.floor(next / this.duration);
                if ((fits < 0) || (fits > this.nrep)) { next = NO_TIME; }
                else { next = next - (fits * this.duration); }
                this.fire(C.X_JUMP, next); this.fire(C.X_ITER);
            } else if (this.mode === C.R_BOUNCE) {
                var fits = Math.floor(next / this.duration);
                if ((fits < 0) || (fits > this.nrep)) { next = NO_TIME; }
                else {
                    next = next - (fits * this.duration);
                    next = ((fits % 2) === 0) ? next : (this.duration - next);
                }
                this.fire(C.X_JUMP, next); this.fire(C.X_ITER);
            }
        }
    } else { this.lastDelta = 0; }

    var prev = this.pos;

    if (next !== NO_TIME) {
        this._performActionsBetween(prev, next, dt); // actions could change this.pos

        if (this.pos !== next) { // there were no jumps in time, so this.pos stayed
            if ((prev <= 0) && (next > 0) && (next <= this.duration) && !this.passedStart) {
                this.fire(C.X_START, next); this.passedStart = true;
            }

            if ((prev >= 0) && (prev <= this.duration) && (next > this.duration) && !this.passedEnd) {
                this.fire(C.X_END, next); this.passedEnd = true;
            }
        }
    }

    //console.log('tick', this.owner.name, this.pos, dt, next);
    this.pos = next;

    return this.pos;
};

Timeline.prototype.tickRelative = function(other, dt) {
    if (!other || !is.defined(other.pos)) { /*this.endNow();*/ return NO_TIME; }
    this.pos = other.pos - this.start - dt; // we subtract dt to add it later in this.tick
    this.actualPos = this.pos;
    return this.tick(dt);
};

Timeline.prototype.endNow = function() {
    this.fire(C.X_END, this.pos); this.passedEnd = true;
    this.pos = NO_TIME;
};

Timeline.prototype.fits = function() {
    return (this.pos !== NO_TIME) && (this.pos >= 0) && (this.pos <= this.duration);
};

Timeline.prototype.setEndAction = function(type, nrep) {
    this.end = type;
    this.nrep = is.num(nrep) ? nrep : Infinity;
};

Timeline.prototype.changeBand = function(start, stop) {
    this.start = start;
    this.duration = stop - this.start;
    this.reset();
};

Timeline.prototype.getBand = function() {
    return [ this.start, this.start + this.duration ];
};

Timeline.prototype.setSpeed = function(speed) {
    this.speed = speed;
};

Timeline.prototype.setDuration = function(duration) {
    this.duration = duration;
    this.reset();
};

Timeline.prototype.getDuration = function(duration) {
    return this.duration;
};

Timeline.prototype.getGlobalBand = function(parent) {
    var cursor = parent;
    var start = this.start;
    while (cursor) {
        start += cursor.time.start;
        cursor = cursor.parent || cursor.scene;
    }
    return [start, this.duration];
};

Timeline.prototype.getLastPosition = function() {
    return this.pos;
};

Timeline.prototype.getLastDelta = function() {
    return this.lastDelta;
};

Timeline.prototype.getGlobalStart = function() {
    var cursor = this.owner;
    var start = 0;
    while (cursor) {
        start += cursor.time ? cursor.time.start : 0;
        cursor = cursor.parent || cursor.scene;
    }
    return start;
};

Timeline.prototype.getGlobalTime = function() {
    return (this.pos !== NO_TIME) ? (this.getGlobalStart() + this.pos) : NO_TIME;
};

Timeline.prototype.pause = function() {
    console.log('pause', this.owner.name, this.pos);
    if (this.paused) return;
    this.paused = true; this.fire(C.X_PAUSE, this.pos);
};

Timeline.prototype.pauseAt = function(at) {
    var me = this; this.addAction(at, function() { me.pause(); });
};

Timeline.prototype.continue = function() {
    console.log('continue', this.owner.name, this.pos);
    if (!this.paused) return;
    this.fire(C.X_CONTINUE, this.pos);
    this.paused = false;
};

Timeline.prototype.countinueAt = function(at) {
    var me = this; this.addAction(at, function() { me.continue(); });
};

Timeline.prototype.jump = function(t) {
    console.log('jump', this.owner.name, this.pos, t);
    this.pos = t; this.fire(C.X_JUMP, t);
};

Timeline.prototype.jumpAt = function(at, t) {
    var me = this; this.addAction(at, function() { me.jump(t); });
};

Timeline.prototype.jumpTo = function(child) {
    var start = child.time.start,
        cursor = child.parent;
    while (cursor && (cursor !== this.owner)) {
        start += cursor.time.start;
        cursor = cursor.parent;
    }
    this.jump(start);
};

Timeline.prototype.jumpToStart = function() {
    this.actualPos = this.duration;
    this.pos = 0; this.fire(C.X_JUMP, 0);
};

Timeline.prototype.jumpToEnd = function() {
    this.actualPos = this.duration;
    this.pos = this.duration;
    this.fire(C.X_JUMP, this.pos); this.fire(C.X_END);
};

Timeline.prototype.changeTrack = function(other, dt) {
    var left = (this.duration - this.pos);
    //if (dt < left) throw new Error('')
    this.tick(left);
    other.tick(dt - left);
};

Timeline.prototype.isFinished = function() {
    return this.passedEnd;
};

Timeline.prototype.easing = function(f) { this.easing = f; };

Timeline.prototype.isBefore = function(t) { return (this.pos < t); };
Timeline.prototype.isAfter = function(t) { return (this.pos > t); };

Timeline.prototype.fireMessage = function(message) {
    this.fire(C.X_MESSAGE, message);
};

Timeline.prototype.onMessage = function(message, handler) {
    this.on(C.X_MESSAGE, function(name) { if (name === message) handler(); });
};

Timeline.prototype.fireMessageAt = function(at, message) {
    var me = this;
    this.addAction(at, function() { me.fireMessage(message); });
};

Timeline.prototype._checkSwitcher = function(next) {
    var parent = this.owner.parent;
    if (!parent || !parent.switch) return next;
    if (parent.switch === C.SWITCH_OFF) return NO_TIME;
    if ((parent.switch === this.owner.name) && parent.switch_band) {
        if (next === NO_TIME) return NO_TIME;
        return next - parent.switch_band[0];
    } else return NO_TIME;
};

Timeline.prototype._performActionsBetween = function(prev, next, dt) {
    if (!this.actions.length) return;
    var actionsPos = 0;
    var curAction = this.actions[actionsPos];
    // scroll to current time (this.time) forward first, if we're not there already
    while (curAction && (actionsPos < this.actions.length) &&
           (curAction.time < prev)) {
        actionsPos++; curAction = this.actions[actionsPos];
    }
    // then perform everything before `next` time
    while (curAction && (actionsPos < this.actions.length) &&
           (curAction.time <= next) &&
           ((curAction.time > prev) ||
            ((dt > 0) && (curAction.time == prev)))) {
        curAction.func(next);
        actionsPos++; curAction = this.actions[actionsPos];
    }
}

Timeline.prototype.clone = function(owner) {
    var trg = new Timeline(owner || this.owner);
    trg.start = this.start; trg.duration = this.duration;
    trg.end = this.end; trg.nrep = this.nrep;
    trg.easing = this.easing;
    //trg.actions = this.actions.concat([])
    return trg;
};

module.exports = Timeline;
