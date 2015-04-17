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
    subj.prototype._initHandlers = (function(evts) { // FIXME: make automatic
        return function() {
            var _hdls = {};
            this.handlers = _hdls;
            for (var ei = 0, el = evts.length; ei < el; ei++) {
                _hdls[evts[ei]] = [];
            }
        };
    })(events);
    subj.prototype.on = function(event, handler) {
        if (!this.handlers) throw errors.system('Instance is not initialized with handlers, call __initHandlers in its constructor');
        if (!this.provides(event)) throw errors.system('Event \'' + event +
                                                 '\' is not provided by ' + this);
        if (!handler) return;
        this.handlers[event].push(handler);
        // FIXME: make it chainable, use handler instance to unbind, instead of index
        return (this.handlers[event].length - 1);
    };
    subj.prototype.subscribedTo = function(event) {
        return this.handlers && this.handlers[event] && this.handlers[event].length;
    };
    subj.prototype.fire = function(event/*, evt_args*/) {
        if (this.disabled) return;
        if (!this.handlers) throw errors.system('Instance is not initialized with handlers, call __initHandlers in its constructor');
        if (!this.provides(event)) throw errors.system('Event \'' + event +
                                                 '\' is not provided by ' + this);
        if (this.handle__x && !(this.handle__x.apply(this, arguments))) return;
        if (this['handle_'+event] || this.handlers[event].length) {
            var evt_args = new Array(arguments.length - 1);
            for (var i = 1; i < arguments.length; i++) {
                evt_args[i - 1] = arguments[i];
            }
            if (this['handle_'+event]) this['handle_'+event].apply(this, evt_args);
            var _hdls = this.handlers[event];
            for (var hi = 0, hl = _hdls.length; hi < hl; hi++) {
                _hdls[hi].apply(this, evt_args);
            }
        }

    };
    subj.prototype.provides = (function(evts) {
        return function(event) {
            if (!this.handlers) throw errors.system('Instance is not initialized with handlers, call __initHandlers in its constructor');
            if (!event) return evts;
            return this.handlers.hasOwnProperty(event);
        };
    })(events);
    subj.prototype.unbind = function(event, idx) {
        if (!this.handlers) throw errors.system('Instance is not initialized with handlers, call __initHandlers in its constructor');
        if (!this.provides(event)) return;
        if (this.handlers[event][idx]) {
            this.handlers[event].splice(idx, 1);
        }
    };
    subj.prototype.disposeHandlers = function() {
        if (!this.handlers) throw errors.system('Instance is not initialized with handlers, call __initHandlers in its constructor');
        var _hdls = this.handlers;
        for (var evt in _hdls) {
            if (_hdls.hasOwnProperty(evt)) _hdls[evt] = [];
        }
    };
    /* FIXME: call fire/e_-funcs only from inside of their providers, */
    /* TODO: wrap them with event objects */
    var makeFireFunc = function(event) {
        return function(evtobj) {
            this.fire(event, evtobj);
        };
    };

    for (var ei = 0, el = events.length; ei < el; ei++) {
        subj.prototype['e_'+events[ei]] = makeFireFunc(events[ei]);
    }
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

// * bands
registerEvent('X_START', 'bandstart');
registerEvent('X_STOP', 'bandstop');

// * Animation or Element error
registerEvent('X_ERROR', 'error');

// * animation start/stop
registerEvent('A_START', 'animationstart');
registerEvent('A_STOP', 'animationstop');
registerEvent('A_PAUSE', 'animationpause');

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
