var C = require('../constants.js');

var utils = require('../utils.js');
var is = utils.is;

var events = require('../events.js'),
    provideEvents = events.provideEvents;

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
    this.actionsPos = 0;
    this.speed = 1;

    this.passedStart = false;
    this.passedEnd = false;
};
provideEvents(Timeline, [ /*C.X_TICK, */C.X_START, C.X_END, C.X_MESSAGE,
    C.X_JUMP, C.X_PAUSE, C.X_CONTINUE, C.X_ITER ]);

Timeline.prototype.reset = function() {
    this.paused = false;
    this.pos = -this.start;
    this.actualPos = -this.start;
    this.actionsPos = 0;
    this.passedStart = false;
    this.passedEnd = false;
};

Timeline.prototype.addAction = function(t, f) {
    var actions = this.actions;
    var i = 0;
    for (var il = this.actions.length; (i < il) && (actions[i].time < t); i++) { };
    this.actionsPos = 0;
    this.actions.splice(i, 0, { time: t, func: f });
};

Timeline.prototype.tick = function(dt) {
    this.actualPos += dt;

    if (this.paused) return this.pos; // FIXME: if less than 0, should return null

    var next = (this.pos + dt);

    var toReturn;
    if (is.finite(this.duration) && (next > this.duration)) {
        if (this.mode === C.R_ONCE) {
            next = this.duration;
            this.passedEnd = true;
            toReturn = null;
        } else if (this.mode === C.R_STAY) {
            var wasPaused = this.paused;
            this.paused = true;
            next = this.duration;
            toReturn = next;
            if (!wasPaused) this.fire(C.X_PAUSE, next);
        } else if (this.mode === C.R_LOOP) {
            this.actionsPos = 0;
            var fits = Math.floor(next / this.duration);
            if ((fits < 0) || (fits > this.nrep)) { toReturn = null; }
            else { next = next - (fits * this.duration); toReturn = next; }
            this.fire(C.X_JUMP, next); this.fire(C.X_ITER);
        } else if (this.mode === C.R_BOUNCE) {
            this.actionsPos = 0;
            var fits = Math.floor(next / this.duration);
            if ((fits < 0) || (fits > this.nrep)) { toReturn = null; }
            else {
                next = next - (fits * this.duration);
                next = ((fits % 2) === 0) ? next : (this.duration - next);
                toReturn = next;
            }
            this.fire(C.X_JUMP, next); this.fire(C.X_ITER);
        }
    } else if (next < 0) {
        toReturn = undefined;
    } else {
        toReturn = next;
    }

    if (is.defined(toReturn)) {
        toReturn = (this.easing ? this.easing(next) : next);
        next = (this.easing ? this.easing(next) : next);
    }

    this._performActionsUpTo(next);

    if ((this.pos <= 0) && (next > 0) && (next <= this.duration) && !this.passedStart) {
        this.fire(C.X_START, next); this.passedStart = true;
    }

    if ((this.pos >= 0) && (this.pos <= this.duration) && (next > this.duration) && !this.passedEnd) {
        this.fire(C.X_END, next); this.passedEnd = true;
    }

    this.pos = next;

    return toReturn;
}

Timeline.prototype.tickParent = function(dt) {
    // this could be replaced with subscribing parent to children's
    // X_ITER and resetting their timeline
    if (!this.owner.parent) { return this.tick(dt); };
    var parent_time = this.owner.parent.time;
    if (!parent_time) return;
    this.pos = parent_time.pos - this.start - dt;
    this.actualPos = this.pos;
    // this._scrollActionsTo?
    return this.tick(dt);
}

Timeline.prototype.fits = function() {
    return (this.pos >= 0) && (this.pos <= this.duration);
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
    return this.getGlobalStart() + this.pos;
};

Timeline.prototype.pause = function() {
    if (this.paused) return;
    this.paused = true; this.fire(C.X_PAUSE, this.pos);
};

Timeline.prototype.pauseAt = function(at) {
    var me = this; this.addAction(at, function() { me.pause(); });
};

Timeline.prototype.continue = function() {
    if (!this.paused) return;
    this.fire(C.X_CONTINUE, this.pos);
    this.paused = false;
};

Timeline.prototype.countinueAt = function(at) {
    var me = this; this.addAction(at, function() { me.continue(); });
};

Timeline.prototype.jump = function(t) {
    if (t !== this.pos) this._scrollActionsTo(t);
    this.pos = t; this.fire(C.X_JUMP, t);
};

Timeline.prototype.jumpAt = function(at, t) {
    var me = this; this.addAction(at, function() { me.jump(t); });
};

Timeline.prototype.jumpTo = function(child) {
    var start = elm.time.start,
        cursor = elm.parent;
    while (cursor && (cursor !== this.owner)) {
        start += cursor.time.start;
        cursor = cursor.parent;
    }
    this.jump(start);
};

Timeline.prototype.jumpToStart = function() {
    this.actionsPos = 0;
    this.pos = 0; this.fire(C.X_JUMP, 0);
};

Timeline.prototype.jumpToEnd = function() {
    this.actionsPos = this.duration;
    this.pos = this.duration; this.fire(C.X_JUMP, this.pos);
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

Timeline.prototype._performActionsUpTo = function(next) {
    if (!this.actions.length) return;
    var curAction = this.actions[this.actionsPos];
    // scroll to current time (this.time) first, if we're not there already
    while (curAction && (this.actionsPos < this.actions.length) &&
           (curAction.time < this.pos)) {
        this.actionsPos++;
        curAction = this.actions[this.actionsPos];
    }
    // then perform everything before `next` time
    while (curAction && (this.actionsPos < this.actions.length) &&
           (curAction.time <= next) &&
           ((curAction.time > this.pos) ||
            ((dt > 0) && (curAction.time == this.pos)))) {
        curAction.func();
        this.actionsPos++;
        curAction = this.actions[this.actionsPos];
    }
    if (this.actionsPos === this.actions.length) { this.actionsPos = 0; }
}

Timeline.prototype._scrollActionsTo = function(time) {
    var curAction = this.actions[this.actionsPos];
    while (curAction && (this.actionsPos < this.actions.length) &&
           (curAction.time < time)) {
        this.actionsPos++;
        curAction = this.actions[this.actionsPos];
    }
    if (this.actionsPos === this.actions.length) { this.actionsPos = 0; }
};

Timeline.prototype.clone = function(owner) {
    var trg = new Timeline(owner || this.owner);
    trg.start = this.start; trg.duration = this.duration;
    trg.end = this.end; trg.nrep = this.nrep;
    trg.easing = this.easing;
    //trg.actions = this.actions.concat([])
    return trg;
};

module.exports = Timeline;
