var C = require('../constants.js');

/**
 * @class anm.Timeline
 *
 * Stores and manages all the timing of a single element.
 */
function Timeline() {
    this.start = 0;
    this.duration = Math.Infinity;
    this.end = C.R_ONCE;
    this.actions = [];
    this.paused = false;
    this.pos = this.start;
    this.easing = null;
    this.actionsPos = 0;
}
provideEvents(Timeline, [ /*C.X_TICK, C.X_START, C.X_END,*/ C.X_MESSAGE ]);

Timeline.prototype.addAction = function(t, f) {
    var actions = this.actions;
    var i = 0;
    for (var il = this.actions.length; (i < il) && (actions[i].time < t); i++) { };
    this.actionsPos = 0;
    this.actions.splice(i, 0, { time: t, func: f });
}

Timeline.prototype.tick = function(dt) {
    if (this.paused) return this.pos;
    var next = this.pos + dt;
    if (next > (this.start + this.duration)) {
        // check mode
    }
    this.pos = this.easing ? this.easing(next) : next;
    if (this.actions.length) {
        while ((this.actionsPos < this.actions.length) &&
               (this.actions[this.actionsPos].time < this.pos)) {
            this.actions[this.actionsPos].func();
            this.actionsPos++;
        }
        if (this.actionsPos == this.actions.length) { this.actionsPos = 0; }
    }
    return this.pos;
}

Timeline.prototype.setEndAction = function(type) {
    this.end = type;
}

Timeline.prototype.changeBand = function(start, duration) {

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
