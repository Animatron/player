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
            doNotRenderShadows: false,
            engine: null
        }
    }
    var _conf = _GLOBAL_[PRIVATE_CONF];

    // Export
    // -----------------------------------------------------------------------------

    var foo = {}; // for undefined

    // an object to store private functions inside
    // window.__anm || GLOBAL.__anm
    _GLOBAL_[PRIVATE_NAMESPACE] = {
        global: _GLOBAL_,
        'undefined': foo.___undefined___,
        'C': C, // constants
        console: console,
        guid: guid,
        conf: _conf,
        is: __is, // typecheck
        iter: iter,
        // Namespace, Modules
        namespace: PUBLIC_NAMESPACE,
        registerPlayer: registerPlayer,
        registerUsingAnm: registerUsingAnm,
        // Engine
        getEngine: getEngine,
        // Events
        provideEvents: provideEvents,
        registerEvent: registerEvent,
        // Managers
        resource_manager: new ResourceManager(),
        player_manager: new PlayerManager(),
        // Strings
        Strings: Strings,
        // Errors
        Errors: Errors,
        SystemError: SystemError,
        PlayerError: PlayerError,
        AnimationError: AnimationError
        //override: override,
        //overridePrepended: overridePrepended
        // TODO: player instances listeners (look Player.addNewInstanceListener)
    };

    // Logging
    // -----------------------------------------------------------------------------

    var console = _GLOBAL_['console'] || {
        log: function() {},
        error: function() {},
        warn: function() {}
    };

    // Engines
    // -----------------------------------------------------------------------------

    function getEngine() {
        if (_conf.engine) return _conf.engine;
        // The engine function should return a singleton object, so no `new` or something.
        return (_conf.engine = DomEngine(_window, _document));
    }

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

    // Errors
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

    // DOM Engine
    // -----------------------------------------------------------------------------

    // FIXME: move to separate file

    function DomEngine($wnd, $doc) { return (function() { // wrapper here is just to isolate it, executed immediately

        // DomEngine utils

        function __attrOr(canvas, attr, _default) {
            return canvas.hasAttribute(attr)
                   ? canvas.getAttribute(attr)
                   : _default;
        }

        var MARKER_ATTR = 'anm-player', // marks player existence on canvas element
            URL_ATTR = 'data-url';

        var $DE = {};

        // FIXME: here are truly a lot of methods, try to
        //        reduce their number as much as possible

        // getRequestFrameFunc() -> function(callback)
        // getCancelFrameFunc() -> function(id)

        // ajax(url, callback) -> none

        // createTextMeasurer() -> function(text) -> [ width, height ]

        // findPos(elm) -> [ x, y ]
        // disposeElm(elm) -> none
        // detachElm(parent | null, child) -> none

        // createCanvas(params | [width, height], pxratio) -> canvas
        // getPlayerCanvas(id, player) -> canvas
        // getContext(canvas, type) -> context
        // playerAttachedTo(canvas, player) -> true | false
        // detachPlayer(canvas, player) -> none
        // extractUserOptions(canvas) -> options: object | {}
        // checkPlayerCanvas(canvas) -> true | false
        // hasUrlToLoad(canvas) -> string | null
        // setTabIndex(canvas) -> none
        // getCanvasParams(canvas) -> [ width, height, ratio ]
        // getCanvasBounds(canvas) -> [ x, y, width, height, ratio ]
        // configureCanvas(canvas, options, ratio) -> none
        // addChildCanvas(id, parent, pos: [x, y], style: object, inside: boolean)

        // evtPos(event) -> [ x, y ]
        // subscribeWndEvents(handlers: object) -> none
        // subscribeCvsEvents(canvas, handlers: object) -> none
        // subscribeSceneToEvents(canvas, scene) -> none
        // unsubscribeSceneFromEvents(canvas, scene) -> none

        // keyEvent(evt) -> Event
        // mouseEvent(evt, canvas) -> Event

        // Framing

        $DE.__frameFunc = null;
        $DE.__cancelFunc = null;
        $DE.getRequestFrameFunc = function() {
            if ($DE.__frameFunc) return $DE.__frameFunc;
            return ($DE.__frameFunc =
                        ($wnd.requestAnimationFrame ||
                         $wnd.webkitRequestAnimationFrame ||
                         $wnd.mozRequestAnimationFrame ||
                         $wnd.oRequestAnimationFrame ||
                         $wnd.msRequestAnimationFrame ||
                         $wnd.__anm__frameGen ||
                         function(callback){
                           return $wnd.setTimeout(callback, 1000 / 60);
                         })) };
        $DE.getCancelFrameFunc = function() {
            if ($DE.__cancelFunc) return $DE.__cancelFunc;
            return ($DE.__cancelFunc =
                        ($wnd.cancelAnimationFrame ||
                         $wnd.webkitCancelAnimationFrame ||
                         $wnd.mozCancelAnimationFrame ||
                         $wnd.oCancelAnimationFrame ||
                         $wnd.msCancelAnimationFrame ||
                         $wnd.__anm__frameRem ||
                         function(id){
                           return $wnd.clearTimeout(id);
                         })) };
        /*$DE.stopAnim = function(reqId) {
            $DE.getCancelFrameFunc()(reqId);
        }*/

        // Global things

        $DE.PX_RATIO = $wnd.devicePixelRatio || 1;

        $DE.ajax = function(url, callback, errback) {
            var req = false;

            if (!$wnd.ActiveXObject) {
                req = new $wnd.XMLHttpRequest();
            } else {
                try {
                    req = new $wnd.ActiveXObject("Msxml2.XMLHTTP");
                } catch (e1) {
                    try {
                        req = $wnd.ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e2) {
                        throw new SysErr('No AJAX/XMLHttp support');
                    }
                }
            }

            /*if (req.overrideMimeType) {
                req.overrideMimeType('text/xml');
              } */

            if (!req) {
              throw new SysErr('Failed to create XMLHttp instance');
            }

            var whenDone = function() {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        if (callback) callback(req);
                    } else {
                        var error = new SysErr('AJAX request for ' + url +
                                         ' returned ' + req.status +
                                         ' instead of 200');
                        if (errback) { errback(error, req); }
                        else { throw error; }
                    }
                }
            };

            req.onreadystatechange = whenDone;
            req.open('GET', url, true);
            req.send(null);
        }

        $DE.__textBuf = null;
        $DE.createTextMeasurer = function() {
            var buff = $DE.__textBuf;
            if (!buff) {
                /* FIXME: dispose buffer when text is removed from scene */
                var _div = $doc.createElement('div');
                _div.style.visibility = 'hidden';
                _div.style.position = 'absolute';
                _div.style.top = -10000 + 'px';
                _div.style.left = -10000 + 'px';
                var _span = $doc.createElement('span');
                _div.appendChild(_span);
                $doc.body.appendChild(_div);
                $DE.__textBuf = _span;
                buff = $DE.__textBuf;
            }
            return function(text, lines_arg) {
                var has_arg = (typeof lines_arg !== 'undefined');
                var lines = has_arg ? lines_arg : text.lines;
                buff.style.font = text.font;
                buff.style.textAlign = text.align;
                buff.style.verticalAlign = text.baseline || 'bottom';
                if (__arr(text.lines)) {
                    buff.textContent = text.lines.join('<br/>');
                } else {
                    buff.textContent = text.lines.toString();
                }
                // TODO: test if lines were changed, and if not,
                //       use cached value
                return [ buff.offsetWidth,
                         buff.offsetHeight ];
            }
        }

        $DE.createTransform = function() {
            return new Transform();
        }

        // Elements

        /* FIXME: replace with elm.getBoundingClientRect();
           see http://stackoverflow.com/questions/8070639/find-elements-position-in-browser-scroll */
        $DE.findPos = function(elm) {
            var curleft = 0,
                curtop = 0;
            do {
                curleft += elm.offsetLeft/* - elm.scrollLeft*/;
                curtop += elm.offsetTop/* - elm.scrollTop*/;
            } while (elm = elm.offsetParent);
            return [ curleft, curtop ];
        }

        $DE.__trashBin;
        $DE.disposeElm = function(elm) {
            var trashBin = $DE.__trashBin;
            if (!trashBin) {
                trashBin = $doc.createElement('div');
                trashBin.id = 'trash-bin';
                trashBin.style.display = 'none';
                $doc.body.appendChild(trashBin);
                $DE.__trashBin = trashBin;
            }
            trashBin.appendChild(domElm);
            trashBin.innerHTML = '';
        }
        $DE.detachElm = function(parent, child) {
            (parent ? parent.parentNode
                    : $doc.body).removeChild(child);
        }

        // Creating & Modifying Canvas

        $DE.createCanvas = function(dimen, ratio) {
            var cvs = $doc.createElement('canvas');
            $DE.configureCanvas(cvs, dimen, ratio);
            return cvs;
        }
        $DE.getPlayerCanvas = function(id, player) {
            var cvs = $doc.getElementById(id);
            if (!cvs) throw new PlayerErr(_strf(Errors.P.NO_CANVAS_WITH_ID, [id]));
            if (cvs.getAttribute(MARKER_ATTR)) throw new PlayerErr(Errors.P.ALREADY_ATTACHED);
            cvs.setAttribute(MARKER_ATTR, true);
            return cvs;
        }
        $DE.playerAttachedTo = function(cvs, player) {
            return (cvs.getAttribute(MARKER_ATTR) == null) ||
                   (cvs.getAttribute(MARKER_ATTR) == undefined); }
        $DE.detachPlayer = function(cvs, player) {
            cvs.removeAttribute(MARKER_ATTR);
        }
        $DE.getContext = function(cvs, type) {
            return cvs.getContext(type);
        }
        $DE.extractUserOptions = function(cvs) {
          var width, height,
              pxRatio = $DE.PX_RATIO;
          return { 'debug': __attrOr(cvs, 'data-debug', undefined),
                   'inParent': undefined,
                   'muteErrors': __attrOr(cvs, 'data-mute-errors', false),
                   'repeat': __attrOr(cvs, 'data-repeat', undefined),
                   'mode': __attrOr(cvs, 'data-mode', undefined),
                   'zoom': __attrOr(cvs, 'data-zoom', undefined),
                   'meta': { 'title': __attrOr(cvs, 'data-title', undefined),
                             'author': __attrOr(cvs, 'data-author', undefined),
                             'copyright': undefined,
                             'version': undefined,
                             'description': undefined },
                   'anim': { 'fps': undefined,
                             'width': (__attrOr(cvs, 'data-width',
                                      (width = __attrOr(cvs, 'width', undefined),
                                       width ? (width / pxRatio) : undefined))),
                             'height': (__attrOr(cvs, 'data-height',
                                       (height = __attrOr(cvs, 'height', undefined),
                                        height ? (height / pxRatio) : undefined))),
                             'bgcolor': cvs.hasAttribute('data-bgcolor')
                                       ? cvs.getAttribute('data-bgcolor')
                                       : undefined,
                             'duration': undefined } };
        }
        $DE.checkPlayerCanvas = function(cvs) {
            return true;
        }
        $DE.hasUrlToLoad = function(cvs) {
            return cvs.getAttribute(URL_ATTR);
        }
        $DE.setTabIndex = function(cvs, idx) {
            cvs.setAttribute('tabindex', idx);
        }
        $DE.getCanvasParams = function(cvs) {
            //var ratio = $DE.PX_RATIO;
            // ensure ratio is set when canvas created
            return [ cvs.width, cvs.height, cvs.__pxRatio ];
        }
        $DE.getCanvasBounds = function(cvs/*, parent*/) {
            //var parent = parent || cvs.parentNode;
            var pos = $DE.findPos(cvs),
                params = $DE.getCanvasParams(cvs);
            return [ pos[0], pos[1], params[0], params[1], params[2] ];
        }
        $DE.configureCanvas = function(cvs, opts, ratio) {
            var ratio = ratio || $DE.PX_RATIO;
            var isObj = !(opts instanceof Array),
                _w = isObj ? opts.width : opts[0],
                _h = isObj ? opts.height : opts[1];
            if (isObj && opts.bgcolor) {
                cvs.style.backgroundColor = opts.bgcolor;
            }
            cvs.__pxRatio = ratio;
            cvs.style.width = _w + 'px';
            cvs.style.height = _h + 'px';
            cvs.setAttribute('width', _w * (ratio || 1));
            cvs.setAttribute('height', _h * (ratio || 1));
            $DE._saveCanvasPos(cvs);
            return [ _w, _h ];
        }
        $DE._saveCanvasPos = function(cvs) {
            var gcs = ($doc.defaultView &&
                       $doc.defaultView.getComputedStyle); // last is assigned

            // computed padding-left
            var cpl = gcs ?
                  (parseInt(gcs(cvs, null).paddingLeft, 10) || 0) : 0,
            // computed padding-top
                cpt = gcs ?
                  (parseInt(gcs(cvs, null).paddingTop, 10) || 0) : 0,
            // computed bodrer-left
                cbl = gcs ?
                  (parseInt(gcs(cvs, null).borderLeftWidth,  10) || 0) : 0,
            // computed bodrer-top
                cbt = gcs ?
                  (parseInt(gcs(cvs, null).borderTopWidth,  10) || 0) : 0;

            var html = $doc.body.parentNode,
                htol = html.offsetLeft,
                htot = html.offsetTop;

            var elm = cvs,
                ol = cpl + cbl + htol,
                ot = cpt + cbt + htot;

            if (elm.offsetParent !== undefined) {
                do {
                    ol += elm.offsetLeft;
                    ot += elm.offsetTop;
                } while (elm = elm.offsetParent)
            }

            ol += cpl + cbl + htol;
            ot += cpt + cbt + htot;

            /* FIXME: find a method with no injection of custom properties
                      (data-xxx attributes are stored as strings and may work
                       a bit slower for events) */
            cvs.__rOffsetLeft = ol || cvs.__anm_usr_x;
            cvs.__rOffsetTop = ot || cvs.__anm_usr_y;
        }
        $DE.addChildCanvas = function(id, parent, pos, style, inside) {
            // pos should be: [ x, y, w, h]
            // style may contain _class attr
            var _ratio = $DE.PX_RATIO,
                _x = pos[0], _y = pos[1],
                _w = pos[2], _h = pos[3], // width & height
                _pp = $DE.findPos(parent), // parent position
                _bp = [ _pp[0] + parent.clientLeft + _x, _pp[1] + parent.clientTop + _y ], // bounds position
                _cp = inside ? [ parent.parentNode.offsetLeft + parent.clientLeft + _x,
                                 parent.parentNode.offsetTop  + parent.clientTop + _y ]
                               : _bp; // position to set in styles
            var cvs = $DE.createCanvas([ _w, _h ], _ratio);
            cvs.id = parent.id ? ('__' + parent.id + '_' + id) : ('__anm_' + id) ;
            if (style._class) cvs.className = style._class;
            for (var prop in style) {
                cvs.style[prop] = style[prop];
            }
            var appendTo = inside ? parent.parentNode
                                  : $doc.body;
            // FIXME: a dirty hack?
            if (inside) { appendTo.style.position = 'relative'; }
            appendTo.appendChild(cvs);
            return cvs;
        }

        // Events

        $DE.evtPos = function(evt) {
            return [ evt.pageX, evt.pageY ];
        }
        $DE.subscribeWndEvents = function(handlers) {
            for (var type in handlers) {
                $wnd.addEventListener(type, handlers[type], false);
            }
        }
        $DE.subscribeCvsEvents = function(cvs, handlers) {
            for (var type in handlers) {
                cvs.addEventListener(type, handlers[type], false);
            }
        }
        $DE.unsubcribeCvsEvents = function(cvs, handlers) {
            for (var type in handlers) {
                cvs.removeEventListener(type, handlers[type]);
            }
        }
        $DE.keyEvent = function(e) {
            return { key: ((e.keyCode != null) ? e.keyCode : e.which),
                     ch: e.charCode };
        }
        $DE.mouseEvent = function(e, cvs) {
            return { pos: [ e.pageX - cvs.__rOffsetLeft,
                            e.pageY - cvs.__rOffsetTop ] };
        }
        var _kevt = $DE.keyEvent,
            _mevt = $DE.mouseEvent;
        $DE.subscribeSceneToEvents = function(cvs, scene) {
            if (cvs.__anm_subscribed &&
                cvs.__anm_subscribed[scene.id]) {
                return;
            }
            //canvas.__anm_subscription_id = guid();
            if (!cvs.__anm_handlers)   cvs.__anm_handlers = {};
            if (!cvs.__anm_subscribed) cvs.__anm_subscribed = {};
            var handlers = cvs.__anm_subscribed[scene.id] || {
              mouseup:   function(evt) { anim.fire(C.X_MUP,     _mevt(evt, canvas)); },
              mousedown: function(evt) { anim.fire(C.X_MDOWN,   _mevt(evt, canvas)); },
              mousemove: function(evt) { anim.fire(C.X_MMOVE,   _mevt(evt, canvas)); },
              mouseover: function(evt) { anim.fire(C.X_MOVER,   _mevt(evt, canvas)); },
              mouseout:  function(evt) { anim.fire(C.X_MOUT,    _mevt(evt, canvas)); },
              click:     function(evt) { anim.fire(C.X_MCLICK,  _mevt(evt, canvas)); },
              dblclick:  function(evt) { anim.fire(C.X_MDCLICK, _mevt(evt, canvas)); },
              keyup:     function(evt) { anim.fire(C.X_KUP,     _kevt(evt)); },
              keydown:   function(evt) { anim.fire(C.X_KDOWN,   _kevt(evt)); },
              keypress:  function(evt) { anim.fire(C.X_KPRESS,  _kevt(evt)); }
            };
            canvas.__anm_handlers[scene.id] = handlers;
            canvas.__anm_subscribed[scene.id] = true;
            $DE.subscribeCvsEvents(canvas, handlers);
        }
        $DE.unsubscribeSceneFromEvents = function(cvs, scene) {
            if (!cvs.__anm_handlers   ||
                !cvs.__anm_subscribed ||
                !cvs.__anm_subscribed[scene.id]) return;
            var handlers = cvs.__anm_handlers[scene.id];
            if (!handlers) return;
            $DE.unsubscribeCvsEvents(cvs, handlers);
        }

        return $DE;

    })(); };

    // Strings

    var Strings = {};

    Strings.COPYRIGHT = '© Animatron Player';
    Strings.LOADING = 'Loading...';
    Strings.LOADING_ANIMATION = 'Loading {0}...';

    // Error Strings

    var Errors = {};
    Errors.S = {}; // System Errors
    Errors.P = {}; // Player Errors
    Errors.A = {}; // Animation Errors

    Errors.S.NO_JSON_PARSER = 'JSON parser is not accessible';
    Errors.S.ERROR_HANDLING_FAILED = 'Error-handling mechanics were broken with error {0}';
    Errors.S.NO_METHOD_FOR_PLAYER = 'No method \'{0}\' exist for player';
    Errors.P.NO_IMPORTER_TO_LOAD_WITH = 'Cannot load this project without importer. Please define it';
    Errors.P.NO_CANVAS_WITH_ID = 'No canvas found with given id: {0}';
    Errors.P.NO_CANVAS_WAS_PASSED = 'No canvas was passed';
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

})(this);
