<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <style type="text/css">
        html, body {
            margin: 0;
            padding: 0;
        }

        body.no-iframe {
            /* width: 100%;
            height: 100%; */
            background-color: rgb(51, 51, 51);
        }

        canvas.no-iframe {
            border: 1px solid #ccc;
            top: 50%;
            left: 50%;
            display: block;
            position: absolute;
            box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.5);
        }

        canvas.no-rect {
            top: 10%;
            left: 10%;
        }
    </style>


    <script type="text/javascript">

        var inIFrame = false;

        var _u = (function() { /* utils */

            return {

            extractVal : function(params, name) {
                if (!params) return null;
                var res; if (res = params.match(
                    new RegExp('[\\?&]' + name + '=([\\w\\.\\-]+)')
                )) return (res.length && res[1]) ? res[1] : null;
            },

            injectVal : function(params, name, value) {
                if (!params) return name + '=' + value;
                var res = params.match(
                    new RegExp('[\\?&]' + name + '=[\\w-]+' ));
                if (!res || !res.length) return params + '&' + name + '=' + value;
                return params.replace(
                    new RegExp('([\\?&])' + name + '=[\\w-]+'),
                    '$1' + name + '=' + value
                );
            },

            getRequiredRect : function(params, w, h) {
                // w and h are precalculated scene sizes
                // so if there is iframe wrapper, return iframe size,
                // if there are width/height in params, return them,
                // else return these precalculated sizes
                if (inIFrame) return _u.getIframeSize();
                if (params) {
                    var wParam = parseInt(_u.extractVal(params, 'w')),
                        hParam = parseInt(_u.extractVal(params, 'h'));
                    if (wParam && hParam) return [ wParam, hParam ];
                }
                if (w && h) return [ w, h ];
            },

            getIframeSize : function() {
                var size = [0,0];
                if (typeof window.innerWidth == 'number') {
                  size = [window.innerWidth, window.innerHeight];
                } else {
                  size = [document.documentElement.clientWidth, document.documentElement.clientHeight];
                }

                return size;
            },

            reportError : function(_e) {
                if (console) console.error(_e);
                else alert(_e.message);
            },

            forcedJS : function(_path, _then) {
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

            var _search = location.search,
                _first_amp_pos = _search.indexOf('&');

            var SNAPSHOT_MASK = '[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}';

            var CANVAS_ID = 'target',
                PROTOCOL = ('https:' === document.location.protocol) ? 'https://' : 'http://',
                URL_PREFIX = PROTOCOL + '://animatron-snapshots.s3.amazonaws.com',
                SNAPSHOT_ID = (_first_amp_pos > 0) ? _search.substring(1, _first_amp_pos) : _search.substring(1);

            if (!SNAPSHOT_ID ||
                !SNAPSHOT_ID.match(SNAPSHOT_MASK)) {
                _u.reportError(new Error('Snapshot ID \'' + SNAPSHOT_ID + '\' is incorrect'));
                return;
            }

            inIFrame = (window.self !== window.top);

            var _params_ = (_first_amp_pos > 0) ? '?' + _search.substring(_first_amp_pos + 1) : null;
            var rect = _u.getRequiredRect(_params_);
            if (rect) {
                if (_params_) {
                    _params_ = _u.injectVal(_params_, 'w', rect[0]);
                    _params_ = _u.injectVal(_params_, 'h', rect[1]);
                }
                else {
                    _params_ = '?w=' + rect[0] + '&' + 'h=' + rect[1];
                }
            }
            var _snapshotUrl_ = URL_PREFIX + '/' + SNAPSHOT_ID + (_params_ || '');

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
                            cvs.style.marginLeft = - Math.floor(rect[0] / 2) + 'px';
                            cvs.style.marginTop  = - Math.floor(rect[1] / 2) + 'px';
                        }
                    } else if (!inIFrame) {
                        cvs.className += ' no-rect';
                    }
                    _u.forcedJS(PROTOCOL + '://player.animatron.com/latest/bundle/animatron.js', function () {
                        anm.Player.forSnapshot(CANVAS_ID, _snapshotUrl_, new AnimatronImporter());
                    });
                } catch (e) {
                    _u.reportError(e);
                }
            }

        })();

    </script>
</head>

<body onload="start();">
<canvas id="target"></canvas>
</body>
</html>
