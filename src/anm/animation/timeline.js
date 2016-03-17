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
    this.endAction = C.R_ONCE;
    this.repetitionCount = Infinity;
    this.actions = [];
    this.paused = false;
    this.position = -this.start || 0; // in ticks
    this.easing = null;
    this.speed = 1; // TODO: use speed

    this.passedStart = false;
    this.passedEnd = false;
};
provideEvents(Timeline, [ /*C.X_TICK, */C.X_START, C.X_END, C.X_MESSAGE,
    C.X_JUMP, C.X_PAUSE, C.X_CONTINUE, C.X_ITER ]);

Timeline.NO_TIME = NO_TIME;
Timeline.isKnownTime = isKnownTime;

Timeline.prototype.reset = function() {
    this.paused = false;
    this.position = -this.start;
    this.passedStart = false;
    this.passedEnd = false;
};

Timeline.prototype.addAction = function(t, f) {
    var actions = this.actions;
    var i = 0;
    for (var il = this.actions.length; (i < il) && (actions[i].time < t); i++) { };
    this.actions.splice(i, 0, { time: t, func: f });
};



Timeline.prototype.endNow = function() {
    this.fire(C.X_END, this.position); this.passedEnd = true;
    this.position = NO_TIME;
};

Timeline.prototype.isActive = function() {
    return (this.position !== NO_TIME) && (this.position >= 0) && (this.position <= this.duration);
};

Timeline.prototype.setEndAction = function(type, nrep) {
    this.endAction = type;
    this.repetitionCount = is.num(nrep) ? nrep : Infinity;
};

Timeline.prototype.getEffectiveDuration = function() {
    if (this.endAction === C.R_ONCE) return this.duration;
    if (this.endAction === C.R_STAY) return Infinity;
    if ((this.endAction === C.R_LOOP) ||
        (this.endAction === C.R_BOUNCE)) return this.duration * this.repetitionCount;
};

Timeline.prototype.getEffectiveBand = function() {
    return [ this.start, this.start + this.getEffectiveDuration() ];
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

Timeline.prototype.isInfinite = function() {
    return this.getDuration() == Infinity;
};

Timeline.prototype.asBand = function() {
    return [this.start, this.start + this.duration];
};

Timeline.prototype.asRelativeBand = function() {
    return [0, this.duration];
};

Timeline.prototype.asGlobalBand = function(parent) {
    var cursor = parent;
    var start = this.start;
    while (cursor) {
        start += cursor.timeline.start;
        cursor = cursor.parent || cursor.scene;
    }
    return [start, this.duration];
};

Timeline.prototype.getLastPosition = function() {
    return this.position;
};

Timeline.prototype.getGlobalStart = function() {
    var cursor = this.owner;
    var start = 0;
    while (cursor) {
        start += cursor.timeline ? cursor.timeline.start : 0;
        cursor = cursor.parent || cursor.scene;
    }
    return start;
};

Timeline.prototype.getGlobalTime = function() {
    return (this.position !== NO_TIME) ? (this.getGlobalStart() + this.position) : NO_TIME;
};

//Timeline.prototype.isPaused = function() { return this.paused; }
//Timeline.prototype.isPlaying = function() { return !this.paused; }

Timeline.prototype.pause = function() {
    if (this.paused) return;
    this.paused = true; this.fire(C.X_PAUSE, this.position);
};

Timeline.prototype.pauseWithChildren = function() {
    if (this.paused) return;
    this.pause();
    this.owner.each(function(child) {
        child.timeline.pause();
    });
};

Timeline.prototype.pauseAt = function(at) {
    var timeline = this;
    this.addAction(at, function() { timeline.pause(); });
};

Timeline.prototype.continue = function() {
    if (!this.paused) return;
    this.fire(C.X_CONTINUE, this.position);
    this.paused = false;
    /*if (this.owner.affectsChildren) {
        this.owner.each(function(child) {
            child.timeline.continue();
        });
    }*/
};

Timeline.prototype.countinueAt = function(at) {
    var timeline = this;
    this.addAction(at, function() {
        /*timeline.position = at;*/
        timeline.continue();
    });
};

Timeline.prototype.jump = function(t) {
    this.position = t; this.fire(C.X_JUMP, t);
};

Timeline.prototype.jumpAt = function(at, t) {
    var timeline = this;
    this.addAction(at, function() { timeline.jump(t); });
};

Timeline.prototype.jumpTo = function(child) {
    var start = child.timeline.start,
        cursor = child.parent;
    while (cursor && (cursor !== this.owner)) {
        start += cursor.timeline.start;
        cursor = cursor.parent;
    }
    this.jump(start);
};

Timeline.prototype.jumpToStart = function() {
    this.position = 0; this.fire(C.X_JUMP, 0);
};

Timeline.prototype.jumpToEnd = function() {
    this.position = this.duration;
    this.fire(C.X_JUMP, this.position); this.fire(C.X_END);
};

Timeline.prototype.changeTrack = function(other, dt) {
    var left = (this.duration - this.position);
    //if (dt < left) throw new Error('')
    this.tick(left);
    other.tick(dt - left);
};

Timeline.prototype.isFinished = function() {
    return this.passedEnd;
};

Timeline.prototype.easing = function(f) { this.easing = f; };

Timeline.prototype.isBefore = function(t) { return (this.position < t); };
Timeline.prototype.isAfter = function(t) { return (this.position > t); };

Timeline.prototype.fireMessage = function(message) {
    this.fire(C.X_MESSAGE, message);
};

Timeline.prototype.onMessage = function(message, handler) {
    var owner = this.owner;
    this.on(C.X_MESSAGE, function(name) { if (name === message) handler.call(owner); });
};

Timeline.prototype._performActionsBetween = function(previous, next, dt) {
    if (!this.actions.length) return;
    var actionsPos = 0;
    var curAction = this.actions[actionsPos];
    if (curAction && (curAction.time > 0)) {
        // scroll to current time (this.position) forward first, if we're not there already
        while (curAction && (actionsPos < this.actions.length) &&
               (curAction.time <= previous)) {
            actionsPos++; curAction = this.actions[actionsPos];
        }
    }
    // then perform everything before `next` time
    while (curAction && (actionsPos < this.actions.length) &&
           (curAction.time <= next) &&
           ((curAction.time > previous) ||
            ((dt > 0) && (curAction.time == previous)))) {
        curAction.func.call(this.owner, next);
        actionsPos++; curAction = this.actions[actionsPos];
    }
}

Timeline.prototype.clone = function(owner) {
    var trg = new Timeline(owner || this.owner);
    trg.start = this.start; trg.duration = this.duration;
    trg.endAction = this.endAction; trg.repetitionCount = this.repetitionCount;
    trg.easing = this.easing; trg.speed = this.speed;
    //trg.actions = this.actions.concat([])
    return trg;
};

Timeline.prototype.loadFrom = function(other) {
    this.start = other.start; this.duration = other.duration;
    this.endAction = other.endAction; this.repetitionCount = other.repetitionCount;
    this.easing = other.easing; this.speed = other.speed;
};

Timeline.toTicks = function(seconds) {
    return seconds * 1000;
}

Timeline.fromTicks = function(ticks) {
    return ticks / 1000;
}

module.exports = Timeline;
