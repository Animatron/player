/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

 var conf = require('../conf.js'),
     log = require('../log.js');

 var C = require('../constants.js');

 var engine = require('engine');

function Video(url) {
    this.url = url;
    this.ready = false;
    this.playing = false;
}

Video.prototype.connect = function(element) {
    var me = this;
    element.on(C.X_START, function() {
        me.play.apply(me, arguments);
    });
    var stop = function() { me.stop(); };
    element.on(C.X_STOP, stop);
    element.on(C.S_STOP, stop);
    element.on(C.S_PAUSE, stop);
};
Video.prototype.load = function(player) {
    var me = this;
    ResMan.loadOrGet(player.id, me.url,
        function(notify_success, notify_error, notify_progress) { // loader
            var url = me.url;
            if (engine.isHttps) { url = url.replace('http:', 'https:'); }

            var el = engine.createVideo();
            el.setAttribute("preload", "auto");

            var progressListener = function(e) {
                var buffered = el.buffered;
                if (buffered.length == 1) {
                    if (el.readyState === 4) {
                        engine.unsubscribeElementEvents(el,
                            { 'progress': progressAndLoadingListener,
                              'loadedmetadata': loadingListener,
                              'canplay': canPlayListener });
                        notify_success(el);
                        notify_progress(1);
                        return;
                    }
                }
            };

            var loadingListener = function(e) {
                var ranges = [];
                for (var i = 0; i < el.buffered.length; i++) {
                    ranges.push([ el.buffered.start(i),
                                  el.buffered.end(i) ]);
                }

                for (var i = 0, progress = 0; i < el.buffered.length; i ++) {
                    progress += (1 / el.duration) * (ranges[i][1] - ranges[i][0]);
                }

                notify_progress(progress);
            }

            var progressAndLoadingListener = function(e) {
                progressListener(e); loadingListener(e);
            }

            var canPlayListener = function(e) {
                me.canPlay = true;
                progressListener(e);
            };

            engine.subscribeElementEvents(el,
                { 'progress': progressAndLoadingListener,
                  'loadedmetadata': loadingListener,
                  'canplay': canPlayListener,
                  'error': audioErrProxy(url, notify_error) });

            var addSource = function(video, url, type) {
                var src = engine.createSource();
                src.type = type;
                src.src = url;
                src.addEventListener("error", notify_error, false);
                video.appendChild(src);
            };

            try {
                engine.appendToBody(el);
                addSource(el, url, videoType);
            } catch(e) { notify_error(e); }

        },
        function(video) { // oncomplete
            me.video = video;
            me.ready = true;
        },
        function(err) { log.error(err ? (err.message || err) : 'Unknown error');
                        /* throw err; */ });
        });
};
Video.prototype.apply = function(ctx) {};
Video.prototype.bounds = function() {};
Video.prototype.invalidate = function() {};
Video.prototype.dispose = function() {};
Video.prototype.clone = function() { return new Video(this.url) };
