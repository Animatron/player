var C = require('./constants.js');

var errors = require('./errors.js');

// Events
// -----------------------------------------------------------------------------
function registerEvent(id, name) { C[id] = name; }

// TODO: use EventEmitter
// FIXME: all errors below were AnimErr instances

// adds specified events support to the `subj` object. `subj` object receives
// `handlers` property that keeps the listeners for each event. Also, it gets
// `e_<event_name>` function for every event provided to call it when it is
// required to call all handlers of all of thise event name
// (`fire('<event_name>', ...)` is the same but can not be reassigned by user).
// `subj` can define `handle_<event_name>` function to handle concrete event itself,
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
    // check if subject accepts event, dispatch it, if required, and pass it to handlers
    subj.prototype.fire = function(type, event) {
        if (this.disabled) return;
        if (!this.provides(type)) throw errors.system('Event \'' + type +
                                                 '\' is not provided by ' + this);
        var dispatched;
        if (this.dispatch) {
            dispatched = this.dispatch(type, event);
            if (!dispatched) return;
        }
        dispatched = dispatched || event;
        var new_type = dispatched ? (dispatched.type || type) : type;
        if (!new_type) throw errors.system('Failed to find a type for event ' + event);
        this.notify(new_type, dispatched);
        return dispatched;
    };
    // force-pass event to handlers
    subj.prototype.notify = function(type, event) {
        if (this['handle_'+type]) this['handle_'+type](event);
        var handlers = this.handlers ? this.handlers[type] : null;
        if (handlers) {
            for (var hi = 0, hl = handlers.length; hi < hl; hi++) {
                handlers[hi](event);
            }
        }
    };
    subj.prototype.provides = (function(events) {
        return function(event) {
            if (!event) return events;
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
}
MouseEventsSupport.prototype.markAsHoveredTree = function(moveEvent) {
    this.hoverEvent = moveEvent;
    if (this.owner.parent) {
        this.owner.parent.getMouseSupport().markAsHoveredTree(moveEvent);
    }
}
MouseEventsSupport.prototype.adaptEvent = function(event) {
    var localPos = this.owner.adapt(event.x, event.y);
    return new MouseEvent(event.type,
                          localPos.x, localPos.y,
                          this.owner, // target
                          event); // source
}
MouseEventsSupport.prototype.dispatch = function(type, event) {
    var owner = this.owner;
    var localEvent = this.adaptEvent(event);
    var dispatchedByChild; // found the matching child inside
    if (owner.inside({ x: localEvent.x, y: localEvent.y })) {
        owner.reverseEach(function(child) {
            if (child.isActive()) {
                dispatchedByChild = child.fire(type, localEvent); // will call `child.dispatch` from the inside
                if (dispatchedByChild) return false; // stop iteration
            }
        });

        if (dispatchedByChild) return dispatchedByChild; // pass event to the parent handlers

        if (type === 'mouseclick') {
            return localEvent; // pass this event to owner's handlers
        } else if (type === 'mousemove') {
            this.processMove(localEvent); // fire mouseover/mouseout if required
            return localEvent; // but also pass this mousemove to handlers
        }
    }
    return;
}
MouseEventsSupport.prototype.processOver = function(commonChild, overEvent) {
    var inPath = [];
    var next = this.owner;
    while (next && (next !== commonChild)) {
        inPath.push(next);
        next = next.parent;
    }

    for (var i = (inPath.length - 1); i >= 0; i--) {
        inPath[i].notify('mouseover', overEvent);
    }
}
MouseEventsSupport.prototype.processOut = function(outEvent) {
    var processParent = false;
    if (this.hoverEvent && (this.hoverEvent !== event)) {
        this.hoverEvent = null;
        this.owner.notify('mouseout', outEvent);
        processParent = true;
    }

    if (processParent && this.owner.parent) {
        var parentSupport = this.owner.parent.getMouseSupport();
        return parentSupport.processOut(outEvent);
    }

    return this;
}
MouseEventsSupport.prototype.processMove = function(moveEvent) {
    this.markAsHoveredTree(moveEvent);

    var lastHoveredNode = this.state.lastHoveredNode;

    if (lastHoveredNode === this.owner) return;

    var commonChild = null;
    if (lastHoveredNode) {
        var outEvent = this.makeOutEvent(moveEvent, lastHoveredNode);
        var hoveredSupport = lastHoveredNode.getMouseSupport();
        commonChild = hoveredSupport.processOut(outEvent);
    }

    this.state.lastHoveredNode = this.owner;

    this.processOver(commonChild, this.makeOverEvent(moveEvent));
}
MouseEventsSupport.prototype.makeOutEvent = function(moveEvent, target) {
    var outEvent = moveEvent.clone();
    outEvent.type = 'mouseout';
    outEvent.target = target;
    outEvent.x = null; outEvent.y = null;
    return outEvent;
}
MouseEventsSupport.prototype.makeOverEvent = function(moveEvent) {
    var overEvent = moveEvent.clone();
    overEvent.type = 'mouseover';
    overEvent.target = this.owner;
    return overEvent;
}

function MouseEvent(type, x, y, target, source) {
    this.type = type;
    this.x = x; this.y = y;
    this.target = target || null;
    this.source = source || null;
}
MouseEvent.prototype.clone = function() {
    return new MouseEvent(this.type,
                          this.x, this.y,
                          this.target, this.source);
}

module.exports = {
    mouse: isMouseEvent,
    keyboard: isKeyboardEvent,
    mouseOrKeyboard: isMouseOrKeyboardEvent,
    registerEvent: registerEvent,
    provideEvents: provideEvents,
    MouseEvent: MouseEvent,
    MouseEventsState: MouseEventsState,
    MouseEventsSupport: MouseEventsSupport
};
