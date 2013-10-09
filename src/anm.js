/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// HERE GOES THE INITIALISATION OF ANM NAMESPACE, GLOBALS AND GLOBAL HELPERS

(function(GLOBAL) {

    var PRIVATE_NAMESPACE = '__anm',
        PRIVATE_CONF = '__anm_conf',
        PUBLIC_NAMESPACE = 'anm';

    var _GLOBAL_ = (typeof window !== 'undefined') ? window : GLOBAL;
    var _window = (typeof window !== 'undefined') ? window : null,
        _document = (typeof document !== 'undefined') ? document : null;

    if (!_GLOBAL_) throw new Error('Failed to find global namespace');

    // TODO: try the way of jasmine.getGlobal()

    // private developer-related configuration
    // window.__anm_conf || GLOBAL.__anm_conf
    if (!_GLOBAL_[PRIVATE_CONF]) {
        _GLOBAL_[PRIVATE_CONF] = {
            logImport: false,
            logResMan: false,
            forceWindowScope: false
        }
    }
    var _conf = _GLOBAL_[PRIVATE_CONF];

    var foo = {};

    // Namespace management
    // -----------------------------------------------------------------------------

    // TODO: Later, player should be placed in anm.Player and
    //              builder should be placed in anm.Builder

    // a function to register some sub-namespace or object (like 'anm.*') in window or as module
    var registerUsingAnm = (function(_namespace, _glob, _wnd, _conf) {
        return function(name, produce) {
            var isBrowser = _wnd || _conf.forceWindowScope,
                isAmd = (typeof define === 'function' && define.amd),
                isCommonJSModule = (typeof module != 'undefined'),
                isCommonJSExports = (typeof exports === 'object');
             // FIXME: Remove, replace with Engine injector
            if (isBrowser) {
                _glob[name] = produce(_glob[_namespace]);
            } else if (isAmd) {
                define([_namespace], produce);
            } else if (isCommonJSModule) {
                module.exports = produce(require(_namespace));
            } else if (isCommonJSExports) {
                produce(require(_namespace));
            } else {
                _glob[name] = produce(_glob[_namespace]);
            }
        }
    })(PUBLIC_NAMESPACE, _GLOBAL_, _window, _conf);

    // a function to register a player namespace (currently: 'anm') in window or as module
    var registerPlayer = (function(_namespace, _glob, _wnd, _doc, _conf) {
        /*var _wnd_mock = {
                    'setTimeout': setTimeout, 'clearTimeout': clearTimeout,
                    'devicePixelRatio': 1,
                    'addEventListener': function() {},
                    'removeEventListener': function() {}
                };*/

        return function(produce) {
            var isBrowser = _wnd || _conf.forceWindowScope,
                isAmd = (typeof define === 'function' && define.amd),
                isCommonJSModule = (typeof module != 'undefined'),
                isCommonJSExports = (typeof exports === 'object');
             // FIXME: Remove, replace with Engine injector
            if (isBrowser) {
                _wnd[_namespace] = _wnd[_namespace] || {};
                produce(_glob, _wnd, _doc)(_wnd[_namespace]);
            } else if (isAmd) {
                define(produce(_glob, _wnd, _doc));
            } else if (isCommonJSModule) {
                module.exports = produce(_glob, _wnd, _doc)({});
            } else if (isCommonJSExports) {
                produce(_glob, _wnd, _doc)(exports);
            } else {
                _wnd[_namespace] = _wnd[_namespace] || {};
                produce(_glob, _wnd, _doc)(_wnd[_namespace]);
            }
        }
    })(PUBLIC_NAMESPACE, _GLOBAL_, _window, _document, _conf);

    /* TODO: use this for:
       collisions: Scene.prototype.handle__x (return value should be returned properly);
       builder: Builder.prototype.circle --> move into collisions
    function override(proto, name, with) {
        var prev = proto[name];
        proto[name] = function() {
            prev.apply(this, arguments);
            with.apply(this, arguments);
        };
    }

    function overridePrepended(proto, name, with) {
        var prev = proto[name];
        proto[name] = function() {
            with.apply(this, arguments);
            prev.apply(this, arguments);
        };
    } */

    // Constants
    // -----------------------------------------------------------------------------

    //_GLOBAL_[PUBLIC_NAMESPACE].C = {};
    //_GLOBAL_[PUBLIC_NAMESPACE].C;
    var C = {};

    // Events
    // -----------------------------------------------------------------------------

    C.__enmap = {};

    function registerEvent(id, name, value) {
        C[id] = value;
        C.__enmap[value] = name;
    }

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
            if (!this.handlers) throw new Error('Instance is not initialized with handlers, call __initHandlers in its constructor');
            if (!this.provides(event)) throw new Error('Event \'' + C.__enmap[event] +
                                                         '\' not provided by ' + this);
            if (!handler) throw new Error('You are trying to assign ' +
                                            'undefined handler for event ' + event);
            this.handlers[event].push(handler);
            return (this.handlers[event].length - 1);
        };
        subj.prototype.fire = function(event/*, args*/) {
            if (!this.handlers) throw new Error('Instance is not initialized with handlers, call __initHandlers in its constructor');
            if (!this.provides(event)) throw new Error('Event \'' + C.__enmap[event] +
                                                         '\' not provided by ' + this);
            if (this.disabled) return;
            var evt_args = Array.prototype.slice.call(arguments, 1);
            if (this.handle__x && !(this.handle__x.apply(this, arguments))) return;
            var name = C.__enmap[event];
            if (this['handle_'+name]) this['handle_'+name].apply(this, evt_args);
            var _hdls = this.handlers[event];
            for (var hi = 0, hl = _hdls.length; hi < hl; hi++) {
                _hdls[hi].apply(this, evt_args);
            }
        };
        subj.prototype.provides = (function(evts) {
            return function(event) {
                if (!this.handlers) throw new Error('Instance is not initialized with handlers, call __initHandlers in its constructor');
                if (!event) return evts;
                return this.handlers.hasOwnProperty(event);
            }
        })(events);
        subj.prototype.unbind = function(event, idx) {
            if (!this.handlers) throw new Error('Instance is not initialized with handlers, call __initHandlers in its constructor');
            if (!this.provides(event)) throw new Error('Event ' + event +
                                                         ' not provided by ' + this);
            if (this.handlers[event][idx]) {
                this.handlers[event].splice(idx, 1);
            } else {
                throw new Error('No such handler ' + idx + ' for event ' + event);
            }
        };
        subj.prototype.disposeHandlers = function() {
            if (!this.handlers) throw new Error('Instance is not initialized with handlers, call __initHandlers in its constructor');
            var _hdls = this.handlers;
            for (var evt in _hdls) {
                if (_hdls.hasOwnProperty(evt)) _hdls[evt] = [];
            }
        }
        /* FIXME: call fire/e_-funcs only from inside of their providers, */
        /* TODO: wrap them with event objects */
        var _event;
        for (var ei = 0, el = events.length; ei < el; ei++) {
            _event = events[ei];
            subj.prototype['e_'+_event] = (function(event) {
                return function(evtobj) {
                    this.fire(event, evtobj);
                };
            })(_event);
        }
        /* subj.prototype.before = function(event, handler) { } */
        /* subj.prototype.after = function(event, handler) { } */
        /* subj.prototype.provide = function(event, provider) { } */
    }

    // Resource manager
    // -----------------------------------------------------------------------------

    function ResourceManager() {
        this._cache = {};
        this._errors = {};
        this._waiting = {};
        this._subscriptions = [];
    }
    ResourceManager.prototype.subscribe = function(urls, callbacks) {
        var filteredUrls = [];
        for (var i = 0; i < urls.length; i++){
            // there should not be empty urls
            if (urls[i]) filteredUrls.push(urls[i]);
        }

        this._subscriptions.push([ filteredUrls,
                                   Array.isArray(callbacks) ? callbacks : [ callbacks ] ]);
        this.check();
    }
    ResourceManager.prototype.loadOrGet = function(url, loader, onComplete, onError) {
        var me = this;
        if (me._cache[url]) {
            var result = me._cache[url];
            me.trigger(url, result);
            if (onComplete) onComplete(result);
        } else if (me._errors[url]) {
            if (onError) onError(me._errors[url]);
        } else {
            me._waiting[url] = loader;
            loader(function(result) {
                me.trigger(url, result);
                if (onComplete) onComplete(result);
            }, function(err) {
                me.error(url, err);
                if (onError) onError(err);
            });
        }
    }
    ResourceManager.prototype.trigger = function(url, value) {
        if (this._cache[url] || this._errors[url]) { this.check(); return; }
        delete this._waiting[url];
        this._cache[url] = value;
        this.check();
    }
    ResourceManager.prototype.error = function(url, err) {
        if (this._cache[url] || this._errors[url]) { this.check(); return; }
        delete this._waiting[url];
        this._errors[url] = err;
        this.check();
    }
    ResourceManager.prototype.has = function(url) {
        return (typeof this._cache[url] !== 'undefined');
    }
    // call this only if you are sure you want to force this check —
    // this method is called automatically when every new incoming url is triggered
    // as complete
    ResourceManager.prototype.check = function() {
        var subscriptions = this._subscriptions,
            cache = this._cache,
            errors = this._errors;
        for (var i = 0, il = subscriptions.length; i < il; i++) {
            var urls = subscriptions[i][0],
                callbacks = subscriptions[i][1],
                ready = [];
            for (var u = 0, ul = urls.length; u < ul; u++) {
                var request_result = cache[urls[u]] || errors[urls[u]];
                if (request_result) ready.push(request_result);
            };
             // `ready` is equal to the number of `urls` means all resources for this callbacks are ready
            if (ready.length === urls.length) {
                for (var k = 0, kl = callbacks.length; k < kl; k++) {
                    callbacks[k](ready);
                }
            }
        }
    }
    ResourceManager.prototype.clear = function() {
        this._cache = {};
        this._errors = {};
        this._waiting = {};
        this._subscriptions = [];
    }

    // Player manager
    // -----------------------------------------------------------------------------

    registerEvent('S_NEW_PLAYER', 'new_player', 'new_player');
    registerEvent('S_PLAYER_DETACH', 'player_detach', 'player_detach');

    var PlayerManager = function() {
        this.hash = {};
        this.instances = [];
        this._initHandlers();
    }
    provideEvents(PlayerManager, [ C.S_NEW_PLAYER, C.S_PLAYER_DETACH ]);
    PlayerManager.prototype.handle__x = function(evt, player) {
        if (evt == C.S_NEW_PLAYER) {
            this.hash[player.id] = player;
            this.instances.push(player);
        } else if (evt == C.S_PLAYER_DETACH) {
            // do nothing
        }
        return true;
    }
    PlayerManager.prototype.getPlayer = function(cvs_id) {
        return this.hash[cvs_id];
    }

    // Logging
    // -----------------------------------------------------------------------------

    var console = _GLOBAL_['console'] || {
        log: function() {},
        error: function() {},
        warn: function() {}
    };

    // Export
    // -----------------------------------------------------------------------------

    // an object to store private functions inside
    // window.__anm || GLOBAL.__anm
    _GLOBAL_[PRIVATE_NAMESPACE] = {
        global: _GLOBAL_,
        'undefined': foo.___undefined___,
        'C': C, // constants
        console: console,
        conf: _conf,
        namespace: PUBLIC_NAMESPACE,
        registerPlayer: registerPlayer,
        registerUsingAnm: registerUsingAnm,
        provideEvents: provideEvents,
        registerEvent: registerEvent,
        resource_manager: new ResourceManager(),
        player_manager: new PlayerManager()
        //override: override,
        //overridePrepended: overridePrepended
        // TODO: player instances listeners (look Player.addNewInstanceListener)
    };

    // FIXME: Errors system shoud be moved here

    // FIXME: store pixel ratio here

    // FIXME: move typechecks/utils here

    // FIXME: support Engines (DOM/NodeJS/...) from this point

})(this);