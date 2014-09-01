/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// HERE GOES THE INITIALISATION OF ANM NAMESPACE, GLOBALS AND GLOBAL HELPERS
// namespace itself is registered by name inside of the function, with the help of $engine.define

// FIXME: but it actually should go different way, namespace should not be dependent on engine, so
//        it should be prepared before the engine, and here it should only be filled with engine-dependent
//        methods. also, modules are still not perfect, may be it's not so good only engine may provide their
//        support

(function(_GLOBAL_) {

    var PUBLIC_NAMESPACE = 'anm';

    var PRIVATE_CONF = '__anm_conf',
        ENGINE_VAR = '__anm_engine';

    var _getGlobal = _GLOBAL_['__anm_getGlobal'],
        _registerGlobally = _GLOBAL_['__anm_registerGlobally'];

    if (!_getGlobal || !_registerGlobally) throw new Error('Potentially, no Engine was provided to player, so we cannot proceed :(');

    var $glob = _GLOBAL_;

    // Private configuration
    // -----------------------------------------------------------------------------

    // private developer-related configuration
    // TODO: merge actual properties with default values, if they are set
    $conf = _getGlobal(PRIVATE_CONF) || {
            logImport: false, // FIXME: create a hash-map of such values, by key
            logResMan: false, //        or just remove these flags in favor of log.debug
            logEvents: false,
            logLevel: 0, // will be initialized later
            doNotLoadAudio: false,
            doNotLoadImages: false,
            doNotRenderShadows: false,
            engine: null
        };
    _registerGlobally(PRIVATE_CONF, $conf);

    // Engine
    // -----------------------------------------------------------------------------

    var $engine = getEngine();

    function getEngine() {
        if (_getGlobal(ENGINE_VAR)) return ($conf.engine = _getGlobal(ENGINE_VAR));
        // The engine function should return a singleton object, so no `new` or something.
        if (typeof DomEngine === 'undefined') throw new Error('Can\'t find any Engine to fallback to. DomEngine is not accessible.');
        return ($conf.engine = DomEngine(PUBLIC_NAMESPACE, $conf));
    }

    function switchEngineTo($engine) {
        throw new Error('Not implemented');
        //$conf.engine = $engine(PUBLIC_NAMESPACE, $glob, $conf);
        // TODO: move to PlayerManager
        // FIXME: update all global functions that used from engine
        // FIXME: fire an event and update all subscribed object
    }

    // Public Namespace
    // -----------------------------------------------------------------------------

    $engine.define(PUBLIC_NAMESPACE, [], function() {

        var $publ = {
            global: $glob,
            'undefined': ({}).___undefined___,
            'C': null, // constants, will be initialized below
            'M': null, // modules, will be initialized below
            'I': null, // importers, will be initialized below
            console: null, // will be initialized below
            guid: guid,
            conf: $conf,
            is: __is, // typecheck, will be initialized below
            iter: iter,
            // Namespace
            namespace: PUBLIC_NAMESPACE,
            // Modules
            // modules: [], // modules will register a namespace for themselves
            // Engine
            engine: $engine,
            switchEngineTo: switchEngineTo,
            // FIXME: modules and engines should use require/define technique, with optional ? for tests
            // Modules
            registerModule: registerModule,
            getModule: getModule, // should use `engine.require`?
            isModuleAccessible: isModuleAccessible,
            //configureModule: configureModule,
            // Importers
            registerImporter: registerImporter,
            getImporter: getImporter, // should use `engine.require`?
            createImporter: createImporter,
            isImporterAccessible: isImporterAccessible,
            //configureImporter: configureImporter,
            // Events
            provideEvents: provideEvents,
            registerEvent: registerEvent,
            // Managers
            resource_manager: new ResourceManager(),
            player_manager: null, // will be initialized below with `new PlayerManager()`
            // Strings
            Strings: null, // will be initialized below
            // Errors
            Errors: null, // will be initialized below
            SystemError: null, // will be initialized below
            PlayerError: null, // will be initialized below
            AnimationError: null, // will be initialized below
            // Globals
            getGlobal: _getGlobal,
            registerGlobally: _registerGlobally
            //override: override,
            //overridePrepended: overridePrepended
            // TODO: registerTween
            //_win: function() { return $wnd },
            //_winf: function(w) { $wnd = w; }
        };

        // Constants
        // -----------------------------------------------------------------------------

        $publ.C = {};
        var C = $publ.C;

        // Logging
        // -----------------------------------------------------------------------------

        C.L_DEBUG = 1;
        C.L_INFO = 2;
        C.L_WARN = 4;
        C.L_ERROR = 8;
        $conf.logLevel = C.L_ERROR;
        var nop = function() {};
        var console = $glob['console'] || {
            log: nop, info: nop, warn: nop, error: nop
        };
        $publ.log = {
            debug: function() { if ($conf.logLevel & C.L_DEBUG) (console.debug || console.log).apply(console, arguments); },
            info:  function() { if ($conf.logLevel & C.L_INFO)  (console.info  || console.log).apply(console, arguments); },
            warn:  function() { if ($conf.logLevel & C.L_WARN)  (console.warn  || console.log).apply(console, arguments); },
            error: function() { if ($conf.logLevel & C.L_ERROR) (console.error || console.log).apply(console, arguments); },
        };
        var $log = $publ.log;

        // Modules
        // -----------------------------------------------------------------------------

        $publ.M = {};
        var M = $publ.M;

        function registerModule(alias, conf) {
            if (M[alias]) throw new Error('Module ' + alias + ' is already registered!');
            M[alias] = conf;
        }

        function getModule(alias) {
            return M[alias];
        }

        function isModuleAccessible(alias) {
            return (typeof M[alias] !== 'undefined');
        }

        // TODO:
        /*function configureModule(alias, conf) {

        }*/

        // Importers
        // -----------------------------------------------------------------------------

        $publ.I = {};
        var I = $publ.I;

        function registerImporter(alias, conf) {
            if (I[alias]) throw new Error('Importer ' + alias + ' is already registered!');
            I[alias] = conf;
        }

        // returns importer constructor (not an instance)
        function getImporter(alias) {
            return I[alias];
        }

        // creates importer instance
        function createImporter(alias) {
            return new I[alias]();
        }

        function isImporterAccessible(alias) {
            return (typeof I[alias] !== 'undefined');
        }

        // TODO:
        /*function configureImporter(alias, conf) {

        }*/

        // TODO: same methods for engines as above, but problem is engines are prepared before anm namespace

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
                // FIXME: make it chainable, use handler instance to unbind, instead of index
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

        // .subscribe() allows to subscribe to any number of urls and to execute a callback (or few) when
        //              there is a known status for each one of them (received or failed);
        //              callback receives an array of results of length equal to the given urls array
        //              and with null in place of urls which were failed to receive, and it receives total
        //              failure count;
        //
        // .loadOrGet() should be called for every remote resource Resource Manager should be aware of;
        //              it receives a loader function that actually should request for that resource in any way
        //              it wants to (async or not), but should call provided success handler in case of success
        //              or error handler in case of failure; `subject_id` should be the same as for corresponding
        //              subscribe group (it's the only way we currently found to ensure to unsubscribe loaders
        //              from single subject, instead of all, in case of cancel);
        //
        // .check() is the internal function that iterates through all subscriptions, checks the status
        //          of the urls and calls the subscribed callbacks in case if their resources are ready;
        //          it is called by Resource Manager itself in cases when there was a chance that some resource
        //          changed status;
        //
        // .trigger() notifies Resource Manager about the fact that resource located at given URL was successfully
        //            received and provides it the received value; may be called from outside; forces .check() call;
        //
        // .error() notifies Resource Manager about the fact that resource expected to be located at some URL
        //          was failed to be received and provides it the error object as a cause of the failure;
        //          may be called from outside; forces .check() call;
        //
        // .has() checks if the resource with given URL is stored in Resource Manager's cache (was received before);
        //
        // .clear() clears all the subscriptions from this subject;

        // The system designed with intention (but not restricted to it) that any player will first subscribe (using its ID)
        // to all remote resources from current scene, then trigger them to load with multiple .loadOrGet() calls (with passing
        // the same ID). In .loadOrGet() it should call .trigger() or .error() for a resource in appropriate case.
        // If player needs to stop loading remote resources (i.e. if scene was accidentally changed when it
        // already started but nor finished loading them, or if it was required to be detached at some point in-between),
        // it should call .cancel() with its ID.
        // NB: Notice, that no check is performed just after subscription! Because if new player instance will request resource
        //     which is in cache thanks to previous instance, its own loader (.loadOrGet()) will not be called!

        // FIXME: loader in .loadOrGet() should call trigger() and error() instead of notifiers
        // FIXME: get rid of subject_id in .loadOrGet(), it requires to pass player or scene everywhere inside
        //        (may be in favor of subscriptions groups and generating ID automatically inside)
        //        the main pitfall here is that sheet.load or audio.load requires player as an argument

        function ResourceManager() {
            this._cache = {};
            this._errors = {};
            this._waiting = {};
            this._subscriptions = {};
            this._url_to_subjects = {};
        }
        ResourceManager.prototype.subscribe = function(subject_id, urls, callbacks) {
            if (!subject_id) throw new Error('Subject ID is empty');
            if (this._subscriptions[subject_id]) throw new Error('This subject (\'' + subject_id + '\') is already subscribed to ' +
                                                                 'a bunch of resources, please group them in one.');
            var filteredUrls = [];
            if ($conf.logResMan) { $log.debug('subscribing ' + callbacks.length + ' to ' + urls.length + ' urls: ' + urls); }
            for (var i = 0; i < urls.length; i++){
                // there should be no empty urls
                if (urls[i]) {
                    filteredUrls.push(urls[i]);
                    if (!this._url_to_subjects[urls[i]]) {
                        this._url_to_subjects[urls[i]] = [];
                    }
                    this._url_to_subjects[urls[i]].push(subject_id);
                }
            }
            this._subscriptions[subject_id] = [ filteredUrls,
                                                __is.arr(callbacks) ? callbacks : [ callbacks ] ];
        }
        ResourceManager.prototype.loadOrGet = function(subject_id, url, loader, onComplete, onError) {
            var me = this;
            if (!subject_id) throw new Error('Subject ID is empty');
            if (!url) throw new Error('Given URL is empty');
            if ($conf.logResMan) { $log.debug('request to load ' + url); }
            if (me._cache[url]) {
                if ($conf.logResMan)
                   { $log.debug('> already received, trigerring success'); }
                var result = me._cache[url];
                me.trigger(url, result); // TODO: is it needed?
                if (onComplete) onComplete(result);
            } else if (me._errors[url]) {
                if ($conf.logResMan)
                   { $log.debug('> failed to load before, notifying with error'); }
                if (onError) onError(me._errors[url]);
            } else if (!me._waiting[subject_id] ||
                       !(me._waiting[subject_id] && me._waiting[subject_id][url])) {
                if ($conf.logResMan)
                   { $log.debug('> not cached, requesting'); }
                if (!me._waiting[subject_id]) me._waiting[subject_id] = {};
                me._waiting[subject_id][url] = loader;
                loader(function(result) {
                    result = result || true; //so that the loader isn't obliged to return something
                    if ($conf.logResMan)
                       { $log.debug('file at ' + url + ' succeeded to load, triggering success'); }
                    me.trigger(url, result);
                    if (onComplete) onComplete(result);
                    me.check();
                }, function(err) {
                    if ($conf.logResMan)
                       { $log.debug('file at ' + url + ' failed to load, triggering eror'); }
                    me.error(url, err);
                    if (onError) onError(err);
                    me.check();
                });
            } else /*if (me._waiting[subject_id] && me._waiting[subject_id][url])*/ { // already waiting
                if ($conf.logResMan)
                   { $log.debug('> someone is already waiting for it, subscribing'); }
                if (!me._waiting[subject_id][url]) {
                    me.subscribe(subject_id, [ url ], function(res) {
                        if (res[0]) { onComplete(res[0]); }
                        else { onError(res[0]); };
                    });
                }
            }
        }
        ResourceManager.prototype.trigger = function(url, value) {
            if (this._cache[url] || this._errors[url]) { this.check(); return; }
            if ($conf.logResMan) { $log.debug('triggering success for url ' + url); }
            var subjects = this._url_to_subjects[url];
            if (subjects) { for (var i = 0, il = subjects.length; i < il; i++) {
                if (this._waiting[subjects[i]]) {
                    delete this._waiting[subjects[i]][url];
                }
            } }
            this._cache[url] = value;
            //this.check(); FIXME: .loadOrGet() calls .check() itself in this case, after the onError
        }
        ResourceManager.prototype.error = function(url, err) {
            if (this._cache[url] || this._errors[url]) { this.check(); return; }
            if ($conf.logResMan) { $log.debug('triggering error for url ' + url); }
            var subjects = this._url_to_subjects[url];
            if (subjects) { for (var i = 0, il = subjects.length; i < il; i++) {
                if (this._waiting[subjects[i]]) {
                    delete this._waiting[subjects[i]][url];
                }
            } }
            this._errors[url] = err;
            //this.check(); FIXME: .loadOrGet() calls .check() itself in this case, after the onError
        }
        ResourceManager.prototype.has = function(url) {
            return (typeof this._cache[url] !== 'undefined');
        }
        // call this only if you are sure you want to force this check —
        // this method is called automatically when every new incoming url is triggered
        // as complete or failed
        ResourceManager.prototype.check = function() {
            if ($conf.logResMan)
                { $log.debug('checking subscriptions'); }
            var subscriptions = this._subscriptions,
                cache = this._cache,
                errors = this._errors,
                to_remove = null;
            for (var subject_id in subscriptions) {
                if ($conf.logResMan) { $log.debug('subscription group \'' + subject_id + '\''); }
                var urls = subscriptions[subject_id][0],
                    callbacks = subscriptions[subject_id][1],
                    error_count = 0,
                    success_count = 0;
                for (var u = 0, ul = urls.length; u < ul; u++) {
                    if (errors[urls[u]]) error_count++;
                    if (cache[urls[u]]) success_count++;
                }
                if ($conf.logResMan)
                    { $log.debug('stats for ' + urls + '. length: ' + urls.length + ', ' +
                                  'success: ' + success_count + ', errors: ' + error_count + ', ready: '
                                  + ((success_count + error_count) === urls.length)); }
                if ((success_count + error_count) === urls.length) {
                    var ready = [];
                    for (var u = 0, ul = urls.length; u < ul; u++) {
                        ready.push(cache[urls[u]] || errors[urls[u]]);
                    };
                    if ($conf.logResMan)
                       { $log.debug('notifying subscribers that ' + urls + ' are all ready'); }
                    for (var k = 0, kl = callbacks.length; k < kl; k++) {
                        //callbacks[k].call(subscriber, ready, error_count);
                        callbacks[k](ready, error_count);
                    }
                    if (!to_remove) to_remove = [];
                    to_remove.push(subject_id);
                }
            }
            if (to_remove) { for (var i = 0, il = to_remove.length; i < il; i++) {
                if ($conf.logResMan)
                   { $log.debug('removing notified subscribers for subject \'' + to_remove[i] + '\' from queue'); }
                delete subscriptions[to_remove[i]];
            } }
        }
        ResourceManager.prototype.cancel = function(subject_id) {
            if (!subject_id) throw new Error('Subject ID is empty');
            if (this._waiting[subject_id]) {
                var urls = this._subscriptions[subject_id][0];
                if (urls) { for (var u = 0, ul = urls.length; u < ul; u++) {
                    delete this._waiting[subject_id][urls[u]];
                } }
            }
            // clear _url_to_subjects ?
            delete this._subscriptions[subject_id];
        }
        ResourceManager.prototype.clear = function() {
            this._cache = {};
            this._errors = {};
            this._waiting = {};
            this._loaders = {};
            this._subscriptions = {};
        }

        // Player manager
        // -----------------------------------------------------------------------------

        registerEvent('S_NEW_PLAYER', 'new_player', 'new_player');
        registerEvent('S_PLAYER_DETACH', 'player_detach', 'player_detach');

        function PlayerManager() {
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

        $publ.player_manager = new PlayerManager();

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

            var __defined = function(v) { return !((typeof v === 'undefined') || (typeof v === 'null') ||
                                                   (v === null) || (v === undefined)); }

            var __finite = isFinite || Number.isFinite || function(n) { return n !== Infinity; };

            var __nan = isNaN || Number.isNaN || function(n) { n !== NaN; };

            // #### typecheck

            function __builder(obj) {
                return (typeof anm.Builder !== 'undefined') &&
                       (obj instanceof anm.Builder);
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
            __is.defined = __defined;
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

        $publ.is = __is;

        // Iterator
        // -----------------------------------------------------------------------------

        function StopIteration() {}
        function iter(a) {
            if (a.__iter) {
                a.__iter.reset();
                return a.__iter;
            }
            var pos = 0,
                len = a.length;
            return (a.__iter = {
                next: function() {
                          if (pos < len) return a[pos++];
                          pos = 0;
                          throw new StopIteration();
                      },
                hasNext: function() { return (pos < len); },
                remove: function() { len--; return a.splice(--pos, 1); },
                reset: function() { pos = 0; len = a.length; },
                get: function() { return a[pos]; },
                each: function(f, rf) {
                          this.reset();
                          while (this.hasNext()) {
                            if (f(this.next()) === false) {
                                if (rf) rf(this.remove()); else this.remove();
                            }
                          }
                      }
            });
        }

        // Errors & Strings
        // -----------------------------------------------------------------------------

        function __errorAs(name) {
          return function (message) {
              if (Error.captureStackTrace) Error.captureStackTrace(this, this);
              var err = new Error(message || '');
              err.name = name;
              return err;
          };
        }

        var SystemError = __errorAs('SystemError'),
            PlayerError = __errorAs('PlayerError'),
            AnimationError = __errorAs('AnimationError');

        $publ.SystemError = SystemError;
        $publ.PlayerError = PlayerError;
        $publ.AnimationError = AnimationError;

        // Strings

        var Strings = {};
        $publ.Strings = Strings;

        Strings.COPYRIGHT = 'Animatron Player';
        Strings.LOADING = 'Loading...';
        Strings.LOADING_ANIMATION = 'Loading {0}...';

        // Error Strings

        var Errors = {};

        $publ.Errors = Errors;

        Errors.S = {}; // System Errors
        Errors.P = {}; // Player Errors
        Errors.A = {}; // Animation Errors

        // FIXME: move to player those ones who belong only to itself
        //        ...or create strings module?
        //        NB: engine also has error strings
        Errors.S.NO_JSON_PARSER = 'JSON parser is not accessible';
        Errors.S.ERROR_HANDLING_FAILED = 'Error-handling mechanics were broken with error {0}';
        Errors.S.NO_METHOD_FOR_PLAYER = 'No method \'{0}\' exist for player';
        Errors.P.NO_IMPORTER_TO_LOAD_WITH = 'Cannot load this project without importer. Please define it';
        Errors.P.NO_WRAPPER_WITH_ID = 'No element found with given id: {0}';
        Errors.P.NO_WRAPPER_WAS_PASSED = 'No element was passed to player initializer';
        Errors.P.CANVAS_NOT_VERIFIED = 'Canvas is not verified by the provider';
        Errors.P.CANVAS_NOT_PREPARED = 'Canvas is not prepared, don\'t forget to call \'init\' method';
        Errors.P.ALREADY_PLAYING = 'Player is already in playing mode, please call ' +
                                   '\'stop\' or \'pause\' before playing again';
        Errors.P.PAUSING_WHEN_STOPPED = 'Player is stopped, so it is not allowed to pause';
        Errors.P.NO_SCENE_PASSED = 'No scene passed to load method';
        Errors.P.NO_STATE = 'There\'s no player state defined, nowhere to draw, ' +
                            'please load something in player before ' +
                            'calling its playing-related methods';
        Errors.P.NO_SCENE = 'There\'s nothing at all to manage with, ' +
                            'please load something in player before ' +
                            'calling its playing-related methods';
        Errors.P.COULD_NOT_LOAD_WHILE_PLAYING = 'Could not load any scene while playing or paused, ' +
                            'please stop player before loading';
        Errors.P.LOAD_WAS_ALREADY_POSTPONED = 'Load was called while loading process was already in progress';
        Errors.P.NO_LOAD_CALL_BEFORE_PLAY = 'No animation was loaded into player before the request to play';
        Errors.P.BEFOREFRAME_BEFORE_PLAY = 'Please assign beforeFrame callback before calling play()';
        Errors.P.AFTERFRAME_BEFORE_PLAY = 'Please assign afterFrame callback before calling play()';
        Errors.P.BEFORERENDER_BEFORE_PLAY = 'Please assign beforeRender callback before calling play()';
        Errors.P.AFTERRENDER_BEFORE_PLAY = 'Please assign afterRender callback before calling play()';
        Errors.P.PASSED_TIME_VALUE_IS_NO_TIME = 'Given time is not allowed, it is treated as no-time';
        Errors.P.PASSED_TIME_NOT_IN_RANGE = 'Passed time ({0}) is not in scene range';
        Errors.P.DURATION_IS_NOT_KNOWN = 'Duration is not known';
        Errors.P.ALREADY_ATTACHED = 'Player is already attached to this canvas, please use another one';
        Errors.P.INIT_TWICE = 'Initialization was called twice';
        Errors.P.INIT_AFTER_LOAD = 'Initialization was called after loading a scene';
        Errors.P.SNAPSHOT_LOADING_FAILED = 'Snapshot failed to load ({0})';
        Errors.P.IMPORTER_CONSTRUCTOR_PASSED = 'You\'ve passed importer constructor to snapshot loader, but not an instance! ' +
                                               'Probably you used anm.getImporter instead of anm.createImporter.';
        Errors.A.ELEMENT_IS_REGISTERED = 'This element is already registered in scene';
        Errors.A.ELEMENT_IS_NOT_REGISTERED = 'There is no such element registered in scene';
        Errors.A.UNSAFE_TO_REMOVE = 'Unsafe to remove, please use iterator-based looping (with returning false from iterating function) to remove safely';
        Errors.A.NO_ELEMENT_TO_REMOVE = 'Please pass some element or use detach() method';
        Errors.A.NO_ELEMENT = 'No such element found';
        Errors.A.ELEMENT_NOT_ATTACHED = 'Element is not attached to something at all';
        Errors.A.MODIFIER_NOT_ATTACHED = 'Modifier wasn\'t applied to anything';
        Errors.A.NO_MODIFIER_PASSED = 'No modifier was passed';
        Errors.A.NO_PAINTER_PASSED = 'No painter was passed';
        Errors.A.MODIFIER_REGISTERED = 'Modifier was already added to this element';
        Errors.A.PAINTER_REGISTERED = 'Painter was already added to this element';
        Errors.A.RESOURCES_FAILED_TO_LOAD = 'Some of resources required to play this animation were failed to load';
        Errors.A.MASK_SHOULD_BE_ATTACHED_TO_SCENE = 'Element to be masked should be attached to scene when rendering';

        // Export
        // -----------------------------------------------------------------------------

        return $publ;

    });

})(this);
