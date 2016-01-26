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
                                                 '\' can not be handled by ' + this);
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
    subj.prototype.fire = function(type, event) {
        if (this.disabled) return;
        if (!this.provides(type)) throw errors.system('Event \'' + type +
                                                 '\' can not be handled by ' + this);
        this.notify(type, event);
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
registerEvent('X_MENTER', 'mouseenter');
registerEvent('X_MEXIT', 'mouseexit');

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
    this.pressedNode = null;
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
    if (!this.owner.adapt) return event;
    var localPos = this.owner.adapt(event.x, event.y);
    return new MouseEvent(event.type,
                          localPos.x, localPos.y,
                          this.owner, // target
                          event); // source
}
MouseEventsSupport.prototype.dispatch = function(event) {
    var owner = this.owner;
    var localEvent = this.adaptEvent(event);
    var state = this.state;

    if ((localEvent.type === 'mouseup') && state.pressedNode) {
        localEvent.target = state.pressedNode;
        var adaptedEvent = state.pressedNode.getMouseSupport().adaptEvent(localEvent);
        state.pressedNode.fire('mouseup', adaptedEvent);
        state.pressedNode = null;
        return true;
    }

    var dispatchedByOwner, // handled event myself
        dispatchedByChild; // not handled myself, but found the matching child inside

    // here and below localEvent has properties `.x` and `.y`, so duck typing works
    dispatchedByOwner = !owner.isScene && owner.inBounds(localEvent) && owner.inside(localEvent);
    // scenes have no .inside or .inBounds methods

    owner.reverseEach(function(child) {
        if (child.isActive()) {
            dispatchedByChild = child.dispatchMouseEvent(localEvent);
            if (dispatchedByChild) return false; // stop iteration of reverseEach
        }
    });

    if ((dispatchedByOwner || owner.isScene) && !dispatchedByChild) {
        if (localEvent.type === 'mousemove') {
            this.processMove(localEvent); // fire mouseenter/mouseexit if required
        }
        if ((localEvent.type === 'mouseclick') || (localEvent.type === 'mousedown')) {
            state.pressedNode = this.owner;
        }
        this.owner.fire(localEvent.type, localEvent);
    };

    return dispatchedByOwner || dispatchedByChild;
}
MouseEventsSupport.prototype.processOver = function(commonChild, moveEvent) {
    var inPath = [];
    var next = this.owner;
    while (next && (next !== commonChild)) {
        inPath.push(next);
        next = next.parent;
    }

    if (inPath.length > 0) {
        var overEvent = this.makeEnterEvent(moveEvent);
        for (var i = (inPath.length - 1); i >= 0; i--) {
            inPath[i].fire('mouseenter', overEvent);
        }
    }
}
MouseEventsSupport.prototype.processOut = function(moveEvent) {
    var processParent = false;
    if (this.hoverEvent && (this.hoverEvent !== moveEvent)) {
        this.hoverEvent = null;
        this.owner.fire('mouseexit', this.makeExitEvent(moveEvent));
        processParent = true;
    }

    if (processParent && this.getParent()) {
        var parentSupport = this.getParent().getMouseSupport();
        return parentSupport.processOut(moveEvent);
    }

    return this.owner;
}
MouseEventsSupport.prototype.processMove = function(moveEvent) {
    this.markAsHoveredTree(moveEvent);

    var lastHoveredNode = this.state.lastHoveredNode;

    if (lastHoveredNode === this.owner) return;

    var commonChild = null;
    if (lastHoveredNode) {
        var hoveredSupport = lastHoveredNode.getMouseSupport();
        commonChild = hoveredSupport.processOut(moveEvent);
    }

    this.state.lastHoveredNode = this.owner;

    this.processOver(commonChild, moveEvent);
}
MouseEventsSupport.prototype.makeExitEvent = function(moveEvent) {
    var exitEvent = moveEvent.clone();
    exitEvent.type = 'mouseexit';
    exitEvent.target = this.state.lastHoveredNode;
    exitEvent.x = null; exitEvent.y = null;
    return exitEvent;
}
MouseEventsSupport.prototype.makeEnterEvent = function(moveEvent) {
    var enterEvent = moveEvent.clone();
    enterEvent.type = 'mouseenter';
    enterEvent.target = this.owner;
    enterEvent.x = null; enterEvent.y = null;
    return enterEvent;
}
MouseEventsSupport.prototype.getParent = function() {
    if (this.owner.parent) return this.owner.parent;
    if (this.owner.scene) return this.owner.scene;
    return null;
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
    isMouse: isMouseEvent,
    isKeyboard: isKeyboardEvent,
    mouseOrKeyboard: isMouseOrKeyboardEvent,
    registerEvent: registerEvent,
    provideEvents: provideEvents,
    MouseEvent: MouseEvent,
    MouseEventsState: MouseEventsState,
    MouseEventsSupport: MouseEventsSupport
};
