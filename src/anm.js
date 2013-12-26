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
            logEvents: false,
            forceWindowScope: false,
            doNotLoadAudio: false,
            doNotLoadImages: false,
            doNotRenderShadows: false
        }
    }
    var _conf = _GLOBAL_[PRIVATE_CONF];

    var foo = {};

    // Logging
    // -----------------------------------------------------------------------------

    var console = _GLOBAL_['console'] || {
        log: function() {},
        error: function() {},
        warn: function() {}
    };

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
        if (_conf.logResMan) { console.log('subscribing ' + callbacks.length + ' to ' + urls.length + ' urls: ' + urls); }
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
        if (_conf.logResMan) { console.log('request to load ' + url); }
        if (me._cache[url]) {
            if (_conf.logResMan)
               { console.log('> already received, trigerring success'); }
            var result = me._cache[url];
            me.trigger(url, result);
            if (onComplete) onComplete(result);
        } else if (me._errors[url]) {
            if (_conf.logResMan)
               { console.log('> failed to load before, notifying with error'); }
            if (onError) onError(me._errors[url]);
        } else if (!me._waiting[url]) {
            if (_conf.logResMan)
               { console.log('> not cached, requesting'); }
            me._waiting[url] = loader;
            loader(function(result) {
                if (_conf.logResMan)
                   { console.log('file at ' + url + ' succeeded to load, triggering success'); }
                me.trigger(url, result);
                if (onComplete) onComplete(result);
                me.check();
            }, function(err) {
                if (_conf.logResMan)
                   { console.log('file at ' + url + ' failed to load, triggering eror'); }
                me.error(url, err);
                if (onError) onError(err);
                me.check();
            });
        } else /*if (me._waiting[url])*/ { // already waiting
            if (_conf.logResMan)
               { console.log('> someone is already waiting for it, subscribing'); }
            if (me._waiting[url] !== loader) me.subscribe([ url ], function(res) { onComplete(res[0]); });
        }
    }
    ResourceManager.prototype.trigger = function(url, value) {
        if (this._cache[url] || this._errors[url]) { this.check(); return; }
        if (_conf.logResMan) { console.log('triggering success for url ' + url); }
        delete this._waiting[url];
        this._cache[url] = value;
    }
    ResourceManager.prototype.error = function(url, err) {
        if (this._cache[url] || this._errors[url]) { this.check(); return; }
        if (_conf.logResMan) { console.log('triggering error for url ' + url); }
        delete this._waiting[url];
        this._errors[url] = err;
    }
    ResourceManager.prototype.has = function(url) {
        return (typeof this._cache[url] !== 'undefined');
    }
    // call this only if you are sure you want to force this check —
    // this method is called automatically when every new incoming url is triggered
    // as complete
    ResourceManager.prototype.check = function() {
        if (_conf.logResMan)
            { console.log('checking subscriptions'); }
        var subscriptions = this._subscriptions,
            cache = this._cache,
            errors = this._errors,
            to_remove = null;
        if (_conf.logResMan)
           { console.log('number of subscriptions: ' + subscriptions.length); }
        for (var i = 0, il = subscriptions.length; i < il; i++) {
            var urls = subscriptions[i][0],
                callbacks = subscriptions[i][1],
                error_count = 0,
                success_count = 0;
            for (var u = 0, ul = urls.length; u < ul; u++) {
                if (errors[urls[u]]) error_count++;
                if (cache[urls[u]]) success_count++;
            }
            if (_conf.logResMan)
                { console.log('stats for ' + urls + '. length: ' + urls.length + ', ' +
                              'success: ' + success_count + ', errors: ' + error_count + ', ready: '
                              + ((success_count + error_count) === urls.length)); }
            if ((success_count + error_count) === urls.length) {
                var ready = [];
                for (var u = 0, ul = urls.length; u < ul; u++) {
                    ready.push(cache[urls[u]] || errors[urls[u]]);
                };
                if (_conf.logResMan)
                   { console.log('notifying subscribers that ' + urls + ' are all ready'); }
                for (var k = 0, kl = callbacks.length; k < kl; k++) {
                    callbacks[k](ready, error_count);
                }
                if (!to_remove) to_remove = [];
                to_remove.push(subscriptions[i]);
            }
        }
        if (to_remove) {
            for (var i = 0, il = to_remove.length; i < il; i++) {
                if (_conf.logResMan)
                   { console.log('removing notified subscribers for ' + to_remove[i][0] + ' from queue'); }
                subscriptions.splice(subscriptions.indexOf(to_remove[i]), 1);
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

    // GUID
    // -----------------------------------------------------------------------------

    function guid() {
       return Math.random().toString(36).substring(2, 10) +
              Math.random().toString(36).substring(2, 10);
    }

    // Value/Typecheck
    // -----------------------------------------------------------------------------

    var __is = (function() {

        // #### value check

        var __finite = isFinite || Number.isFinite || function(n) { return n !== Infinity; };

        var __nan = isNaN || Number.isNaN || function(n) { n !== NaN; };

        // #### typecheck

        function __builder(obj) {
            return (typeof Builder !== 'undefined') &&
                   (obj instanceof Builder);
        }

        var __arr = Array.isArray;

        function __num(n) {
            return !__nan(parseFloat(n)) && __finite(n);
        }

        function __fun(fun) {
            return fun != null && typeof fun === 'function';
        }

        function __obj(obj) {
            return obj != null && typeof obj === 'object';
        }

        function __str(obj) {
            return obj != null && typeof obj === 'string';
        }

        var __is = {};
        __is.finite  = __finite;
        __is.nan     = __nan;
        __is.builder = __builder;
        __is.arr     = __arr;
        __is.num     = __num;
        __is.fun     = __fun;
        __is.obj     = __obj;
        __is.str     = __str;

        return __is;

    })();


    // BitStream
    // -----------------------------------------------------------------------------

    function BitStream(int8array) {
        this.buf = int8array;
        this.pos = 0;
        this.bitPos = 0;
        this.bitsBuf = 0;
    }

    /*
     * Reads n unsigned bits
     */
    BitStream.prototype.readBits = function(n) {
        var v = 0;
        for (;;) {
            var s = n - this.bitPos;
            if (s>0) {
                v |= this.bitBuf << s;
                n -= this.bitPos;
                this.bitBuf = this.readUByte();
                this.bitPos = 8;
            } else {
                s = -s;
                v |= this.bitBuf >> s;
                this.bitPos = s;
                this.bitBuf &= (1 << s) - 1;
                return v;
            }
        }
    }

    /*
     * Reads one unsigned byte
     */
    BitStream.prototype.readUByte = function() {
        return this.buf[this.pos++]&0xff;
    }

    /*
     * Reads n signed bits
     */
    BitStream.prototype.readSBits = function(n) {
        var v = this.readBits(n);
        // Is the number negative?
        if( (v&(1 << (n - 1))) != 0 ) {
            // Yes. Extend the sign.
            v |= -1 << n;
        }

        return v;
    }

    // Base64 Decoder
    // -----------------------------------------------------------------------------

    function Base64Decoder() {}

    /*
     * Returns int8array
     */
    Base64Decoder.decode = function(str) {
        return Base64Decoder.str2ab(Base64Decoder._decode(str));
    }

    Base64Decoder.str2ab = function(str) {
        var result = new Int8Array(str.length);
        for (var i=0, strLen=str.length; i<strLen; i++) {
            result[i] = str.charCodeAt(i);
        }
        return result;
    }

    Base64Decoder._decode = function(data) {
        if (typeof window['atob'] === 'function') {
            // optimize
            return atob(data);
        }

        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            dec = "",
            tmp_arr = [];

        if (!data) {
            return data;
        }

        data += '';

        do { // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(data.charAt(i++));
            h2 = b64.indexOf(data.charAt(i++));
            h3 = b64.indexOf(data.charAt(i++));
            h4 = b64.indexOf(data.charAt(i++));

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            o1 = bits >> 16 & 0xff;
            o2 = bits >> 8 & 0xff;
            o3 = bits & 0xff;

            if (h3 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1);
            } else if (h4 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1, o2);
            } else {
                tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
            }
        } while (i < data.length);

        dec = tmp_arr.join('');

        return dec;
    }

    // Export
    // -----------------------------------------------------------------------------

    // an object to store private functions inside
    // window.__anm || GLOBAL.__anm
    _GLOBAL_[PRIVATE_NAMESPACE] = {
        global: _GLOBAL_,
        'undefined': foo.___undefined___,
        'C': C, // constants
        console: console,
        guid: guid,
        is: __is,
        conf: _conf,
        namespace: PUBLIC_NAMESPACE,
        registerPlayer: registerPlayer,
        registerUsingAnm: registerUsingAnm,
        provideEvents: provideEvents,
        registerEvent: registerEvent,
        resource_manager: new ResourceManager(),
        player_manager: new PlayerManager(),
        Base64Decoder: Base64Decoder,
        BitStream: BitStream
        //override: override,
        //overridePrepended: overridePrepended
        // TODO: player instances listeners (look Player.addNewInstanceListener)
    };

    // FIXME: Errors system shoud be moved here

    // FIXME: store pixel ratio here

    // FIXME: move typechecks/utils here

    // FIXME: support Engines (DOM/NodeJS/...) from this point

})(this);
