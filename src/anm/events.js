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
    subj.prototype.subscribedTo = function(event) {
        return this.handlers && this.handlers[event] && this.handlers[event].length;
    };
    subj.prototype.fire = function(event/*, evt_args*/) {
        if (this.disabled) return;
        if (!this.provides(event)) throw errors.system('Event \'' + event +
                                                 '\' is not provided by ' + this);
        if (this.dispatch && (this.dispatch.apply(this, arguments) === false)) return;
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

function MouseEventsState() {
    this.lastHoveredNode = null;
}

function MouseEventsSupport(owner, state) {
    this.state = state;
    this.owner = owner;
    this.hoverEvent = null;

    var prevDispatch = owner.dispatch;
    owner.dispatch = function(evt) {
        if (!isMouseEvent(evt)) return prevDispatch.apply(owner, arguments);
        if (this.dispatch.apply(this, arguments) !== false) {
            return prevDispatch.apply(owner, arguments);
        };
    }.bind(this);
}
MouseEventsSupport.prototype.markAsHoveredTree = function(hoverEvent) {
    this.hoverEvent = hoverEvent;
    if (this.owner.parent) {
        this.owner.parent.getMouseSupport().markAsHoveredTree(hoverEvent);
    }
}
MouseEventsSupport.prototype.adaptEvent = function(evt) {
    var local = this.adapt(evt.x, evt.y);
    return {
        type: evt.type,
        x: local.x,
        y: local.y,
        source: evt
    };
}
MouseEventsSupport.prototype.dispatch = function(evt) {
    var owner = this.owner;
    var localEvent = adaptEvent(evt);
    var found = false; // found the matching child inside
    if (owner.inside(local.x, local.y)) {
        owner.reverseEach(function(child) {
            if (child.dispatch(localEvent)) {
                found = true;
                return false; // stop iteration
            }
        });

        if (!found) return false;

        if (event.type === 'mouseclick') {
            this.owner.fire('mouseclick', localEvent);
            return true;
        } else if (event.type === 'mousemove') {
            this.processMove(localEvent);
            return true;
        }
    }
    return false;
}
MouseEventsSupport.prototype.processOver = function(commonChild, evt) {
    var inPath = [];
    var next = this.owner;
    while (next && (next !== commonChild)) {
        inPath.push(next);
        next = next.parent;
    }

    for (var i = (inPath.length - 1); i >= 0; i--) {
        inPath[i].fire('mouseover', evt);
    }
}
MouseEventsSupport.prototype.processOut = function(evt) {
    var processParent = false;
    if (this.hoverEvent && (this.hoverEvent !== evt)) {
        this.hoverEvent = null;
        this.fire('mouseout', evt);
        processParent = true;
    }

    if (processParent && this.owner.parent) {
        var parentSupport = this.owner.parent.getMouseSupport();
        return parentSupport.processOut(evt);
    }

    return this;
}
MouseEventsSupport.prototype.processMove = function(evt) {
    this.markAsHoveredTree(evt);

    this.hoverEvent = event.id;

    var lastHoveredNode = this.state.lastHoveredNode;

    if (lastHoveredNode === this.owner) return;

    var commonChild = null;
    if (lastHoveredNode) {
        commonChild = lastHoveredNode.processOut(evt);
    }

    this.state.lastHoveredNode = this.owner;

    processOver(commonChild, evt);
}

module.exports = {
    mouse: isMouseEvent,
    keyboard: isKeyboardEvent,
    mouseOrKeyboard: isMouseOrKeyboardEvent,
    registerEvent: registerEvent,
    provideEvents: provideEvents,
    MouseEventsState: MouseEventsState,
    MouseEventsSupport: MouseEventsSupport
};
