var C = require('./constants.js');

var errors = require('./errors.js');

// Events
// -----------------------------------------------------------------------------
C.__enmap = {};

function registerEvent(id, name, value) {
    C[id] = value;
    C.__enmap[value] = name;
}


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
        if (!this.provides(event)) throw errors.system('Event \'' + C.__enmap[event] +
                                                 '\' not provided by ' + this);
        if (!handler) throw errors.system('You are trying to assign ' +
                                    'undefined handler for event ' + event);
        this.handlers[event].push(handler);
        // FIXME: make it chainable, use handler instance to unbind, instead of index
        return (this.handlers[event].length - 1);
    };
    subj.prototype.fire = function(event/*, evt_args*/) {
        if (this.disabled) return;
        if (!this.handlers) throw errors.system('Instance is not initialized with handlers, call __initHandlers in its constructor');
        if (!this.provides(event)) throw errors.system('Event \'' + C.__enmap[event] +
                                                 '\' not provided by ' + this);
        if (this.handle__x && !(this.handle__x.apply(this, arguments))) return;
        var name = C.__enmap[event];
        if (this['handle_'+name] || this.handlers[event].length) {
            var evt_args = new Array(arguments.length - 1);
            for (var i = 1; i < arguments.length; i++) {
                evt_args[i - 1] = arguments[i];
            }
            if (this['handle_'+name]) this['handle_'+name].apply(this, evt_args);
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
        if (!this.provides(event)) throw errors.system('Event ' + event +
                                                 ' not provided by ' + this);
        if (this.handlers[event][idx]) {
            this.handlers[event].splice(idx, 1);
        } else {
            throw errors.system('No such handler ' + idx + ' for event ' + event);
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

registerEvent('S_NEW_PLAYER', 'new_player', 'new_player');
registerEvent('S_PLAYER_DETACH', 'player_detach', 'player_detach');

// ### Events
/* ---------- */

// NB: All of the events must have different values, or the flow will be broken
// FIXME: allow grouping events, i.e. value may a group_marker + name of an event
//        also, allow events to belong to several groups, it may replace a tests like
//        XT_MOUSE or XT_CONTROL

// * mouse
registerEvent('X_MCLICK', 'mclick', 1);
registerEvent('X_MDCLICK', 'mdclick', 2);
registerEvent('X_MUP', 'mup', 4);
registerEvent('X_MDOWN', 'mdown', 8);
registerEvent('X_MMOVE', 'mmove', 16);
registerEvent('X_MOVER', 'mover', 32);
registerEvent('X_MOUT', 'mout', 64);

registerEvent('XT_MOUSE', 'mouse',
  (C.X_MCLICK | C.X_MDCLICK | C.X_MUP | C.X_MDOWN | C.X_MMOVE | C.X_MOVER | C.X_MOUT));

// * keyboard
registerEvent('X_KPRESS', 'kpress', 128);
registerEvent('X_KUP', 'kup', 256);
registerEvent('X_KDOWN', 'kdown', 1024);

registerEvent('XT_KEYBOARD', 'keyboard', (C.X_KPRESS | C.X_KUP | C.X_KDOWN));

// * controllers
registerEvent('XT_CONTROL', 'control', (C.XT_KEYBOARD | C.XT_MOUSE));

// * bands
registerEvent('X_START', 'start', 'x_start');
registerEvent('X_STOP', 'stop', 'x_stop');

// * Animation or Element error
registerEvent('X_ERROR', 'error', 'x_error');

// * playing (player state)
registerEvent('S_PLAY', 'play', 'play');
registerEvent('S_PAUSE', 'pause', 'pause');
registerEvent('S_STOP', 'stop', 'stop');
registerEvent('S_COMPLETE', 'complete', 'complete');
registerEvent('S_REPEAT', 'repeat', 'repeat');
registerEvent('S_IMPORT', 'import', 'import');
registerEvent('S_LOAD', 'load', 'load');
registerEvent('S_RES_LOAD', 'res_load', 'res_load');
registerEvent('S_ERROR', 'error', 'error'); // Player error


module.exports = {
  registerEvent: registerEvent,
  provideEvents: provideEvents
};
