var C = require('../constants.js');

var utils = require('../utils.js');
var is = utils.is;

/**
 * @class anm.Timeline
 *
 * Stores and manages all the timing of a single element.
 */
function Timeline() {
    this.start = 0;
    this.duration = Infinity;
    this.end = C.R_ONCE;
    this.nrep = Infinity;
    this.actions = [];
    this.paused = false;
    this.pos = -this.start;
    this.actualPos = -this.start;
    this.easing = null;
    this.actionsPos = 0;

    this.passedStart = false;
    this.passedEnd = false;
}
provideEvents(Timeline, [ /*C.X_TICK, */C.X_START, C.X_END, C.X_MESSAGE ]);

Timeline.prototype.reset = function() {
    this.paused = false;
    this.pos = -this.start;
    this.actualPos = -this.start;
    this.actionsPos = 0;
    this.passedStart = false;
    this.passedEnd = false;
}

Timeline.prototype.addAction = function(t, f) {
    var actions = this.actions;
    var i = 0;
    for (var il = this.actions.length; (i < il) && (actions[i].time < t); i++) { };
    this.actionsPos = 0;
    this.actions.splice(i, 0, { time: t, func: f });
}

Timeline.prototype.tick = function(dt) {
    this.actualPos += dt;

    if (this.paused) return this.pos - this.start; // FIXME: if less than 0, should return null

    var next = (this.pos + dt) - this.start;

    var toReturn;
    if (is.finite(this.duration) && (next > this.duration)) {
        if (this.mode === C.R_ONCE) {
            next = this.duration;
            this.passedEnd = true;
            toReturn = null;
        } else if (this.mode === C.R_STAY) {
            this.paused = true;
            next = this.duration;
            toReturn = next;
        } else if (this.mode === C.R_LOOP) {
            this.actionsPos = 0;
            var fits = Math.floor(next / duration);
            if ((fits < 0) || (fits > this.nrep)) { toReturn = null; }
            else { next = next - (fits * this.duration); toReturn = next }
        } else if (this.mode === C.R_BOUNCE) {
            this.actionsPos = 0;
            var fits = Math.floor(next / this.duration);
            if ((fits < 0) || (fits > this.nrep)) { toReturn = null; }
            else {
                next = next - (fits * this.duration);
                next = ((fits % 2) === 0) ? next : (this.duration - next);
                toReturn = next;
            }
        }
        // TODO: fire stop event
    } else if (next < 0) {
        toReturn = null;
        // TODO: fire start event
    } else {
        toReturn = (this.easing ? this.easing(next) : next);
    }

    if (this.actions.length) {
        while ((this.actionsPos < this.actions.length) &&
               (this.actions[this.actionsPos].time < next)) { // should easing be
            this.actions[this.actionsPos].func();
            this.actionsPos++;
        }
        if (this.actionsPos === this.actions.length) { this.actionsPos = 0; }
    }
    this.pos = this.start + next;

    return toReturn;
}

Timeline.prototype.setEndAction = function(type) {
    this.end = type;
}

Timeline.prototype.changeBand = function(start, duration) {
    this.start = start;
    this.duration = duration;
}

Timeline.prototype.pause = function() { this.paused = true; }

Timeline.prototype.pauseAt = function(at) {
    var me = this; this.addAction(at, function() { me.pause(); });
}

Timeline.prototype.continue = function() { this.paused = false; }

Timeline.prototype.countinueAt = function(at) {
    var me = this; this.addAction(at, function() { me.continue(); });
}

Timeline.prototype.jump = function(t) { this.pos = t; }

Timeline.prototype.jumpAt = function(at, t) {
    var me = this; this.addAction(at, function() { me.jump(t); });
}

Timeline.prototype.easing = function(f) { this.easing = f; }

Timeline.prototype.fireMessage = function(message) {
    this.fire(C.X_MESSAGE, message);
}

Timeline.prototype.onMessage = function(message, handler) {
    this.on(C.X_MESSAGE, function(name) { if (name === message) handler(); });
}

Timeline.prototype.fireMessageAt = function(at, message) {
    var me = this;
    this.addAction(at, function() { me.fireMessage(message); });
}
