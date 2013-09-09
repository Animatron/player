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

    // window.__anm_conf || GLOBAL.__anm_conf
    if (!_GLOBAL_[PRIVATE_CONF]) {
        _GLOBAL_[PRIVATE_CONF] = {
            logImport: false,
            forceWindowScope: false
        }
    }
    var _conf = _GLOBAL_[PRIVATE_CONF];

    // TODO: Later, player should be placed in anm.Player and
    //              builder should be placed in anm.Builder

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

    var foo = {}

    // window.__anm || GLOBAL.__anm
    _GLOBAL_[PRIVATE_NAMESPACE] = {
        global: _GLOBAL_,
        'undefined': foo.___undefined___,
        conf: _conf,
        namespace: PUBLIC_NAMESPACE,
        registerPlayer: registerPlayer,
        registerUsingAnm: registerUsingAnm
    };

    // FIXME: support Engines (DOM/NodeJS/...) from this point

})();