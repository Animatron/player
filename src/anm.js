/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// HERE SHOULD GO THE INITIALISATION OF ANM NAMESPACE WITH HELPERS AND GLOBALS

(function() {

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
    ResourceManager.prototype.loadOrGet = function(url, loader, onComplete) {
        var me = this;
        if (me._cache[url] || me._errors[url]) {
            var result = me._cache[url];
            me.trigger(url, result);
            onComplete(result);
        } else {
            me._waiting[url] = loader;
            loader(function(result) {
                me.trigger(url, result);
                onComplete(result);
            }, function(err) {
                me.error(url, err);
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

    // an object to store private functions inside
    // window.__anm || GLOBAL.__anm
    _GLOBAL_[PRIVATE_NAMESPACE] = {
        global: _GLOBAL_,
        'undefined': foo.___undefined___,
        conf: _conf,
        namespace: PUBLIC_NAMESPACE,
        registerPlayer: registerPlayer,
        registerUsingAnm: registerUsingAnm,
        resource_manager: new ResourceManager()
        //override: override,
        //overridePrepended: overridePrepended
        // TODO: player instances listeners (look Player.addNewInstanceListener)
    };

    // FIXME: store pixel ratio here

    // FIXME: move typechecks/utils here

    // FIXME: create PlayerManager here

    // FIXME: support Engines (DOM/NodeJS/...) from this point

})();