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

var utils = (function () {

    return {

        serializeToQueryString: function(obj) {
          var str = [];
          for(var p in obj)
            if (obj.hasOwnProperty(p)) {
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
          return str.join("&");
        },

        parseQueryString: function() {
            var queryString = location.search.substring(1),
                queries = queryString.split("&"),
                params = {}, queries, temp, i, l;
            for ( i = 0, l = queries.length; i < l; i++ ) {
                temp = queries[i].split('=');
                params[temp[0]] = temp[1];
            }
            return params;
        },


        getRequiredRect: function () {
            if (inIFrame) {
                return utils.getIframeSize();
            } else {
                return {w: width, h: height};
            }
        },

        getIframeSize: function () {
            var size = {w:0, h:0};
            if (typeof window.innerWidth == 'number') {
                size.w = window.innerWidth;
                size.h = window.innerHeight;
            } else {
                size.w = document.documentElement.clientWidth;
                size.h = document.documentElement.clientHeight;
            }

            return size;
        },

        reportError: function (_e) {
            if (window.console) console.error(_e.message || _e);
            else alert(_e.message || _e);
        },

        forcedJS: function (path, then) {
            var scriptElm = document.createElement('script');
            scriptElm.type = 'text/javascript';
            scriptElm.async = 'async';
            scriptElm.src = path + '?' + (new Date()).getTime();
            scriptElm.onload = scriptElm.onreadystatechange = (function () {
                var success = false;
                return function () {
                    if (!success && (!this.readyState || (this.readyState == 'complete'))) {
                        success = true;
                        then();
                    } else if (!success) {
                        console.error('Request failed: ' + this.readyState);
                    }
                }
            })();
            scriptElm.onerror = console.error;
            var headElm = document.head || document.getElementsByTagName('head')[0];
            headElm.appendChild(scriptElm);
        }
    };

})();

var start = (function () {


    var TARGET_ID = 'target',
        WRAPPER_CLASS = 'anm-wrapper',
        PLAYER_VERSION_ID = playerVersion || 'latest';

    inIFrame = (window.self !== window.top);

    var params = utils.parseQueryString();
    var rect = utils.getRequiredRect();

    params.w = params.w || rect.w;
    params.h = params.h || rect.h;

    if (autostart) {
    }
    if (loop) {
        params.r = 1;
    }

    var snapshotUrl = amazonDomain + '/' + filename + (_params_ || '');

    if (params.v) {
      PLAYER_VERSION_ID = params.v;
    }

    return function () {
        try {
            if (!inIFrame) {
                document.body.className = 'no-iframe';
            }
            var stylesTag = document.createElement('style');
            stylesTag.type = 'text/css';

            var head = document.getElementsByTagName("head")[0];
            head.appendChild(stylesTag);

            var styles = stylesTag.sheet,
                rules = styles.cssRules || styles.rules;

            var noIFrameRule = rules[(styles.insertRule || styles.addRule).call(styles,
                                     'body.no-iframe .anm-wrapper {}', rules.length)],
                noRectRule   = rules[(styles.insertRule || styles.addRule).call(styles,
                                     'body.no-rect .anm-wrapper {}', rules.length)],
                noPlayerRule = rules[(styles.insertRule || styles.addRule).call(styles,
                                     'body.no-iframe canvas#target:not([anm-player]) {}', rules.length)],
                // there is a version of player where `anm-state-loading` and `anm-state-resources-loading` classes
                // were incorrectly named `anm-loading`, `anm-resources-loading`, this case is temporary (!) hacked out here
                wrapperRule  = rules[(styles.insertRule || styles.addRule).call(styles,
                                     'body.no-iframe div.anm-state-nothing, body.no-iframe div.anm-state-error, '+
                                     'body.no-iframe div.anm-loading, body.no-iframe div.anm-state-loading, ' +
                                     'body.no-iframe div.anm-resources-loading, body.no-iframe div.anm-state-resources-loading ' +
                                     '{}', rules.length)];

            function ruleForWrapperStyle(rule) {
                rule.style.borderWidth = '1px';
                rule.style.borderStyle = 'solid';
                rule.style.borderColor = '#ccc';
                rule.style.display = 'block';
                rule.style.position = 'absolute';
                rule.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
                rule.style.overflow = 'hidden';
            }

            ruleForWrapperStyle(noIFrameRule);
            ruleForWrapperStyle(noPlayerRule);
            ruleForWrapperStyle(wrapperRule);

            if (rect) {
                function ruleForCanvasPosition(rule) {
                    rule.style.width = rect[0] + 'px';
                    rule.style.height = rect[1] + 'px';
                    if (!inIFrame) {
                        rule.style.top  = '50%';
                        rule.style.left = '50%';
                        rule.style.marginLeft = -Math.floor(rect[0] / 2) + 'px';
                        rule.style.marginTop  = -Math.floor(rect[1] / 2) + 'px';
                    }
                }

                ruleForCanvasPosition(noIFrameRule);
                ruleForCanvasPosition(noPlayerRule);
            }

            noRectRule.style.top  = '10%';
            noRectRule.style.left = '10%';

            if (rect) {
                var target = document.getElementById(TARGET_ID);
                target.style.width  = rect[0] + 'px';
                target.style.height = rect[1] + 'px';
            }

            utils.forcedJS(PROTOCOL + playerDomain + '/' + PLAYER_VERSION_ID + '/bundle/animatron.min.js',
                function () {
                      anm.Player.forSnapshot(TARGET_ID, _snapshotUrl_, anm.createImporter('animatron'));
                }
            );
        } catch (e) {
            console.error(e);
        }
    }

})();
