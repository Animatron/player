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
    this.pos = this.start;
}
provideEvents(Timeline, [ C.X_TICK, C.X_START, C.X_END, C.X_MESSAGE ]);

Timeline.prototype.addAction = function(t, f) {
    var actions = this.actions;
    var i = 0;
    for (var il = this.actions.length; (i < il) && (actions[i].time < t); i++) { };
    this.actions.splice(i, 0, { time: t, func: f });
}

Timeline.prototype.tick = function(dt) {
    this.pos += dt;
}

Timeline.prototype.pause = function() {

}

Timeline.prototype.jump = function() {

}

Timeline.prototype.easing = function(f) {

}
