/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 */

/* Variables we get from template:
   playerDomain - a URL to player domain host, e.g. player.animatron.com
   amazonDomain — a URL to snapshot storage host, e.g. http://snapshots.animatron.com/<snapshot-id>
   width — width of the animation
   height - height of the animation
   playerVersion = player version, default 'latest'
   filename = filename of snapshot, used as amazonDomain + filename
   autostart = (boolean) autostart of movie on player load
   loop = (boolean) loop animation instead of stoping at the end
   animation = JSON object of animatron movie (currently not used)
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
        WRAPPER_CLASS = 'anm-wrapper',
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
            if (!inIFrame && !rect) {
                document.body.className = 'no-iframe no-rect';
            } else if (!inIFrame) {
                document.body.className = 'no-iframe';
            }
            var stylesTag = document.createElement('style');
            stylesTag.type = 'text/css';

            var head = document.getElementsByTagName("head")[0];
            if (!head) throw new Error('No head element in document');
            head.appendChild(stylesTag);

            var styles = stylesTag.sheet,
                rules = styles.cssRules || styles.rules;

            var noIFrameRule   = rules[(styles.insertRule || styles.addRule).call(styles,
                                       'body.no-iframe .anm-wrapper {}', rules.length)],
                noRectRule  = rules[(styles.insertRule || styles.addRule).call(styles,
                                       'body.no-rect .anm-wrapper {}', rules.length)],
                noPlayerRule   = rules[(styles.insertRule || styles.addRule).call(styles,
                                       'body.no-iframe canvas#target:not([anm-player]) {}', rules.length)],
                loadingRule    = rules[(styles.insertRule || styles.addRule).call(styles,
                                       '.anm-loading, .anm-state-loading {}', rules.length)];
                loadingCvsRule  = rules[(styles.insertRule || styles.addRule).call(styles,
                                       '.anm-loading canvas#target, .anm-state-loading canvas#target {}', rules.length)];

            function ruleForCenteredCanvas(rule) {
                rule.style.borderWidth = '1px';
                rule.style.borderStyle = 'solid';
                rule.style.borderColor = '#ccc';
                rule.style.top  = '50%';
                rule.style.left = '50%';
                rule.style.display = 'block';
                rule.style.position = 'absolute';
                rule.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
            }

            ruleForCenteredCanvas(noIFrameRule);
            ruleForCenteredCanvas(noPlayerRule);
            ruleForCenteredCanvas(loadingRule);

            if (rect) {
                noPlayerRule.style.width = rect[0] + 'px';
                noPlayerRule.style.height = rect[1] + 'px';
                loadingCvsRule.style.width = rect[0] + 'px';
                loadingCvsRule.style.height = rect[1] + 'px';
                if (!inIFrame) {
                    noPlayerRule.style.marginLeft = -Math.floor(rect[0] / 2) + 'px';
                    noPlayerRule.style.marginTop  = -Math.floor(rect[1] / 2) + 'px';
                    loadingCvsRule.style.marginLeft = -Math.floor(rect[0] / 2) + 'px';
                    loadingCvsRule.style.marginTop  = -Math.floor(rect[1] / 2) + 'px';
                }
            }

            noRectRule.style.top  = '10%';
            noRectRule.style.left = '10%';

            if (rect) {
                var canvas = document.getElementById(CANVAS_ID);
                canvas.style.width  = rect[0] + 'px';
                canvas.style.height = rect[1] + 'px';
            }

            _u.forcedJS(PROTOCOL + playerDomain + '/' + PLAYER_VERSION_ID + '/bundle/animatron.min.js',
                function () {
                      anm.Player.forSnapshot(CANVAS_ID, _snapshotUrl_, anm.createImporter('animatron'),
                        rect
                        ? (function() {
                            var wrapper = document.getElementsByClassName(WRAPPER_CLASS)[0];
                            wrapper.style.width = rect[0] + 'px';
                            wrapper.style.height = rect[1] + 'px';
                            if (!inIFrame) {
                                wrapper.style.marginLeft = -Math.floor(rect[0] / 2) + 'px';
                                wrapper.style.marginTop = -Math.floor(rect[1] / 2) + 'px';
                            }
                            var canvas = document.getElementById(CANVAS_ID);
                            canvas.style.width  = rect[0] + 'px';
                            canvas.style.height = rect[1] + 'px';
                          })
                        : null);
                }
            );
        } catch (e) {
            _u.reportError(e);
        }
    }

})();
