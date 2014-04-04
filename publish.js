/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 */

var inIFrame = false;

var _u = (function () { /* utils */

    return {

        extractVal: function (params, name) {
            if (!params) return null;
            var res;
            if (res = params.match(
                new RegExp('[\\?&]' + name + '=([\\w\\.\\-]+)')
            )) return (res.length && res[1]) ? res[1] : null;
        },

        injectVal: function (params, name, value) {
            if (!params) return name + '=' + value;
            var res = params.match(
                new RegExp('[\\?&]' + name + '=[\\w-]+'));
            if (!res || !res.length) return params + '&' + name + '=' + value;
            return params.replace(
                new RegExp('([\\?&])' + name + '=[\\w-]+'),
                    '$1' + name + '=' + value
            );
        },
        injectIfNotPresent: function (params, name, value) {
            if (!this.extractVal(params, name)) {
                return this.injectVal(params, name, value);
            } else {
                return params;
            }
        },

        getRequiredRect: function () {
            if (inIFrame) {
                return _u.getIframeSize();
            } else {
                return [ width, height ];
            }
        },

        getIframeSize: function () {
            var size = [0, 0];
            if (typeof window.innerWidth == 'number') {
                size = [window.innerWidth, window.innerHeight];
            } else {
                size = [document.documentElement.clientWidth, document.documentElement.clientHeight];
            }

            return size;
        },

        reportError: function (_e) {
            if (console) console.error(_e.message || _e);
            else alert(_e.message || _e);
        },

        forcedJS: function (_path, _then) {
            var scriptElm = document.createElement('script');
            scriptElm.type = 'text/javascript';
            scriptElm.async = 'async';
            scriptElm.src = _path + '?' + (new Date()).getTime();
            scriptElm.onload = scriptElm.onreadystatechange = (function () {
                var _success = false;
                return function () {
                    if (!_success && (!this.readyState || (this.readyState == 'complete'))) {
                        _success = true;
                        _then();
                    } else if (!_success) {
                        _u.reportError(new Error('Request failed: ' + this.readyState));
                    }
                }
            })();
            scriptElm.onerror = _u.reportError;
            var headElm = document.head || document.getElementsByTagName('head')[0];
            headElm.appendChild(scriptElm);
        }
    };

})();

var start = (function () {

    var VERSION_MASK = '^(v[0-9]+(\\.[0-9]+){0,2})$|^latest$';

    var CANVAS_ID = 'target',
        PROTOCOL = ('https:' === document.location.protocol) ? 'https://' : 'http://',
        PLAYER_VERSION_ID = playerVersion;

    if (!playerVersion || !playerVersion.match(VERSION_MASK)) {
        _u.reportError(new Error('Snapshot Version ID \'' + playerVersion + '\' is incorrect'));
        return;
    }

    inIFrame = (window.self !== window.top);

    var _params_ = location.search;
    var rect = _u.getRequiredRect();
    if (rect) {
        if (_params_) {
            _params_ = _u.injectIfNotPresent(_params_, "w", rect[0]);
            _params_ = _u.injectIfNotPresent(_params_, "h", rect[1]);
        } else {
            _params_ = '?w=' + rect[0] + '&' + 'h=' + rect[1];
        }
    }
    if (autostart) {
        _params_ = _u.injectIfNotPresent(_params_, "t", 0);
    }
    if (loop) {
        _params_ = _u.injectIfNotPresent(_params_, "r", 1);
    }

    var _snapshotUrl_ = amazonDomain + '/' + filename + (_params_ || '');

    var temp_v = null;
    if (temp_v = _u.extractVal(_params_, 'v')) {
        if (!temp_v.match(VERSION_MASK)) {
            _u.reportError(new Error('Player Version ID \'' + temp_v + '\' is incorrect'));
            return;
        }

        PLAYER_VERSION_ID = temp_v;
    }

    return function () {
        try {
            var cvs = document.getElementById(CANVAS_ID);
            if (!inIFrame) {
                document.body.className = 'no-iframe';
                cvs.className = 'no-iframe';
            }
            if (rect) {
                cvs.style.width = rect[0] + 'px';
                cvs.style.height = rect[1] + 'px';
                if (!inIFrame) {
                    cvs.style.marginLeft = -Math.floor(rect[0] / 2) + 'px';
                    cvs.style.marginTop = -Math.floor(rect[1] / 2) + 'px';
                }
            } else if (!inIFrame) {
                cvs.className += ' no-rect';
            }
            _u.forcedJS(PROTOCOL + playerDomain + '/' + PLAYER_VERSION_ID + '/bundle/animatron.js',
                function () {
                    var animatronImporter = (typeof AnimatronImporter !== 'undefined') ? new AnimatronImporter()
                        : anm.createImporter('animatron');
                    var player = anm.Player.forSnapshot(CANVAS_ID, _snapshotUrl_, animatronImporter);
                }
            );
        } catch (e) {
            _u.reportError(e);
        }
    }

})();
