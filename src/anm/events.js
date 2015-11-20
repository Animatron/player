var C = require('./constants.js');

var errors = require('./errors.js');

// Events
// -----------------------------------------------------------------------------
function registerEvent(id, name) { C[id] = name; }

// TODO: use EventEmitter
// FIXME: all errors below were AnimErr instances

// adds specified events support to the `subj` object. `subj` object receives
// `handlers` property that keeps the listeners for each event. Also, it gets
// `e_<evt_name>` function for every event provided to call it when it is
// required to call all handlers of all of thise event name
// (`fire('<evt_name>', ...)` is the same but can not be reassigned by user).
// `subj` can define `handle_<evt_name>` function to handle concrete event itself,
// but without messing with other handlers.
// And, user gets `on` function to subcribe to events and `provides` to check
// if it is allowed.
function provideEvents(subj, events) {
    subj.prototype.on = function(event, handler) {
        if (!this.provides(event)) throw errors.system('Event \'' + event +
                                                 '\' is not provided by ' + this);
        if (!handler) return;
        if (!this.handlers) this.handlers = {};
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push(handler);
        // FIXME: make it chainable, use handler instance to unbind, instead of index
        return (this.handlers[event].length - 1);
    };
    /* subj.prototype.onAny = function(handler) { there's this.filterEvent below
        if (!this.receivers) this.receivers = [];
        this.receivers.push(handler);
    }; */
    subj.prototype.subscribedTo = function(event) {
        return this.handlers && this.handlers[event] && this.handlers[event].length;
    };
    subj.prototype.fire = function(event/*, evt_args*/) {
        if (this.disabled) return;
        if (!this.provides(event)) throw errors.system('Event \'' + event +
                                                 '\' is not provided by ' + this);
        if (this.filterEvent && !(this.filterEvent.apply(this, arguments))) return;
        var _hdls = this.handlers ? this.handlers[event] : null;
        var _hdls = this.handlers ? this.handlers[event] : null;
        if (this['handle_'+event] || (_hdls && _hdls.length)) {
            var evt_args = new Array(arguments.length - 1);
            for (var i = 1; i < arguments.length; i++) {
                evt_args[i - 1] = arguments[i];
            }
            if (this['handle_'+event]) this['handle_'+event].apply(this, evt_args);
            if (_hdls) {
                for (var hi = 0, hl = _hdls.length; hi < hl; hi++) {
                    _hdls[hi].apply(this, evt_args);
                }
            }
        }

    };
    subj.prototype.provides = (function(evts) {
        return function(event) {
            if (!event) return evts;
            return events.indexOf(event) >= 0;
        };
    })(events);
    subj.prototype.unbind = function(event, idx) {
        if (!this.provides(event) || !this.handlers[event]) return;
        if (this.handlers[event][idx]) {
            this.handlers[event].splice(idx, 1);
        }
    };
    subj.prototype.disposeHandlers = function() {
        this.handlers = {};
    };
    /* subj.prototype.passEventsTo = function(other) {
        this.onAny(function() {
            other.call(other, arguments);
        });
    }; */
}

registerEvent('S_NEW_PLAYER', 'new');
registerEvent('S_PLAYER_DETACH', 'detach');

// ### Events
/* ---------- */

// NB: All of the events must have different values, or the flow will be broken
// FIXME: allow grouping events, i.e. value may a group_marker + name of an event
//        also, allow events to belong to several groups

// * mouse
registerEvent('X_MCLICK', 'mouseclick');
registerEvent('X_MDCLICK', 'mousedoubleclick');
registerEvent('X_MUP', 'mouseup');
registerEvent('X_MDOWN', 'mousedown');
registerEvent('X_MMOVE', 'mousemove');
registerEvent('X_MOVER', 'mouseover');
registerEvent('X_MOUT', 'mouseout');

// * keyboard
registerEvent('X_KPRESS', 'keypress');
registerEvent('X_KUP', 'keyup');
registerEvent('X_KDOWN', 'keydown');

// * timeline
registerEvent('X_START', 'timestart');
registerEvent('X_END', 'timeend');
registerEvent('X_PAUSE', 'timepause');
registerEvent('X_CONTINUE', 'timecontinue');
registerEvent('X_JUMP', 'timejump');
registerEvent('X_ITER', 'timeiteration');

// * Animation or Element error
registerEvent('X_ERROR', 'error');

// * playing (player state)

registerEvent('S_CHANGE_STATE', 'statechange');
registerEvent('S_PLAY', 'play');
registerEvent('S_PAUSE', 'pause');
registerEvent('S_STOP', 'stop');
registerEvent('S_COMPLETE', 'complete');
registerEvent('S_REPEAT', 'repeat');
registerEvent('S_IMPORT', 'import');
registerEvent('S_LOAD', 'load');
registerEvent('S_RES_LOAD', 'loadresources');
registerEvent('S_LOADING_PROGRESS', 'loadprogress');
registerEvent('S_TIME_UPDATE', 'timeupdate');
registerEvent('S_REPORT_STATS', 'reportstats');
registerEvent('S_INTERACTIVITY', 'interactivity');
registerEvent('S_ERROR', 'error'); // is not intersecting with X_ERROR, so it is safe
                                   // they have same name

function isMouseEvent(type) { return (type.indexOf('mouse') === 0); }
function isKeyboardEvent(type) { return (type.indexOf('key') === 0); }
function isMouseOrKeyboardEvent(type) { return isMouseEvent(type) || isKeyboardEvent(type); }

var m_and_k = {
    'mouseclick': 1,
    'mousedoubleclick': 2,
    'mouseup': 4,
    'mousedown': 8,
    'mousemove': 16,
    'mouseover': 32,
    'mouseout': 64,
    'keypress': 128,
    'keyup': 256,
    'keydown': 512
};

function EventState() { this.reset(); }
EventState.prototype.reset = function() { this.state = 0; }
EventState.prototype.save = function(type) { this.state = this.state | m_and_k[type]; }
EventState.prototype.check = function(type) { return this.state & m_and_k[type]; }

module.exports = {
    mouse: isMouseEvent,
    keyboard: isKeyboardEvent,
    mouseOrKeyboard: isMouseOrKeyboardEvent,
    registerEvent: registerEvent,
    provideEvents: provideEvents,
    EventState: EventState
};
