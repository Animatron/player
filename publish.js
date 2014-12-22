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
(function(){
    var inIFrame = (window.self !== window.top);

    var utils = {
        isInt: function(n) {
            n = Number(n);
            return !isNaN(n) && Math.floor(n) === n;
        },
        serializeToQueryString: function(obj) {
            var str = [];
            for(var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            }
            return str.join("&");
        },
        parseQueryString: function() {
            var queryString = location.search.substring(1);
            if (!queryString) {
                return {};
            }
            var queries = queryString.split("&"),
                params = {}, temp, i, l;
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
        forcedJS: function (path, then) {
            var scriptElm = document.createElement('script');
            scriptElm.type = 'text/javascript';
            scriptElm.async = 'async';
            scriptElm.src = path + '?' + (new Date()).getTime();
            scriptElm.onload = scriptElm.onreadystatechange = (function () {
                var success = false;
                return function () {
                    if (this.readyState === 'loading') {
                        return;
                    }
                    if (!success && (!this.readyState ||
                        (this.readyState === 'complete' || this.readyState === 'loaded')
                    )) {
                        success = true;
                        then();
                    } else if (!success && window.console) {
                        console.error('Request failed: ' + this.readyState);
                    }
                };
            })();
            var headElm = document.head || document.getElementsByTagName('head')[0];
            headElm.appendChild(scriptElm);
        }
    };

    var TARGET_ID = 'target',
    WRAPPER_CLASS = 'anm-wrapper',
    PLAYER_VERSION_ID = playerVersion || 'latest';

    var params = utils.parseQueryString(),
        rect = utils.getRequiredRect(),
        targetWidth, targetHeight;

    //floating-point w&h parameters mean percentage sizing
    if (params.w && !utils.isInt(params.w)) {
        targetWidth = params.w = Math.round(params.w * rect.w);
    } else {
        targetWidth = params.w = params.w || rect.w;
    }
    if (params.h && !utils.isInt(params.h)) {
        targetHeight = params.h = Math.round(params.h * rect.h);
    } else {
        targetHeight = params.h = params.h || rect.h;
    }
    if (autostart) {
        params.a = 1;
    }
    if (loop) {
        params.r = 1;
    }

    if (params.v) {
        PLAYER_VERSION_ID = params.v;
    }

    var snapshotUrl = amazonDomain + '/' + filename + '?' +
        utils.serializeToQueryString(params);
    var start = function () {
        try {
            if (!inIFrame) {
                document.body.className ='no-iframe';
            } else {
                document.body.style.overflow = 'hidden';
            }
            var target = document.getElementById(TARGET_ID);
            target.style.width  = targetWidth + 'px';
            target.style.height = targetHeight + 'px';
            target.style.marginLeft = -Math.floor(targetWidth / 2) + 'px';
            target.style.marginTop  = -Math.floor(targetHeight / 2) + 'px';
            target.style.position = 'absolute';
            target.style.left = '50%';
            target.style.top = '50%';


            utils.forcedJS('//' + playerDomain + '/' + PLAYER_VERSION_ID + '/bundle/animatron.min.js',
                function () {
                    anm.Player.forSnapshot(TARGET_ID, snapshotUrl, anm.importers.create('animatron'));
            });
        } catch (e) {
            if(window.console) console.error(e);
        }
    };

    window.start = start;

})();
