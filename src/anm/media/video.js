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

var errors = require('../errors.js');

var engine = require('engine');

var ResMan = require('../resource_manager.js');

var Bounds = require('../graphics/bounds.js');

/**
 * @class anm.Video
 */
function Video(url, formats, size) {
    this.url = url;
    this.formats = formats;
    this.size = size;
    this.ready = false;
    this.playing = false;
}
/** @private @method connect */
Video.prototype.connect = function(element, anim) {
    var me = this;
    element.on(C.X_START, function() {
        me.play.apply(me, arguments);
    });
    var stop = function() { me.stop(); };
    element.on(C.X_STOP, stop);
    anim.on(C.A_STOP, stop);
    anim.on(C.A_PAUSE, stop);
};
/** @private @method load */
Video.prototype.load = function(uid, player) {

    var me = this;
    ResMan.loadOrGet(uid, me.url,
        function(notify_success, notify_error, notify_progress) { // loader
            var url = me.url;
            var formats = me.formats;
            if (engine.isHttps) { url = url.replace('http:', 'https:'); }
            url = engine.fixLocalUrl(url);

            var el = engine.createVideo(me.size[0], me.size[1]);
            el.setAttribute("preload", "auto");
            el.style.display = 'none';

            var progressListener = function(e) {
                var buffered = el.buffered;
                if (buffered.length == 1) {
                    // 0 == HAVE_NOTHING
                    // 1 == HAVE_METADATA
                    // 2 == HAVE_CURRENT_DATA
                    // 3 == HAVE_FUTURE_DATA
                    // 4 == HAVE_ENOUGH_DATA
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
                  'error': videoErrProxy(url, notify_error) });

            var addSource = function(video, url, type) {
                var src = engine.createSource();
                src.addEventListener("error", notify_error, false);
                src.type = type;
                src.src = url;
                video.appendChild(src);
            };

            try {
                if (!formats) { addSource(el, url, 'video/mp4'); }
                else if (formats.length) {
                    formats.forEach(function(pair) {
                        addSource(el, pair[0], pair[1]);
                    });
                }
                engine.appendToBody(el);
            } catch(e) { notify_error(e); }

        },
        function(video) { // oncomplete
            me.video = video;
            me.ready = true;

            if (!me.size) me.size = [video.width, video.height];
        },
        function(err) { log.error(err ? (err.message || err) : 'Unknown error');
                        //throw errors.element(err ? err.message : 'Unknown', uid);
        });
};
/** @private @method apply */
Video.prototype.apply = function(ctx) {
    if (this.video) ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, 0, 0, this.size[0], this.size[1]);
};
Video.prototype.bounds = function() {
    if (this.$bounds) return this.$bounds;
    if (!this.video) return Bounds.NONE;
    var bounds = new Bounds(0, 0,
                            this.video.width,
                            this.video.height);
    return (this.$bounds = bounds);
};
/**
 * @method inside
 *
 * Checks if point is inside the shape. _Does no test for bounds_, the point is
 * assumed to be already inside of the bounds, so check `video.bounds().inside(pt)`
 * before calling this method manually.
 *
 * @param {Object} pt point to check
 * @param {Number} pt.x
 * @param {Number} pt.y
 * @return {Boolean} is point inside
 */
Video.prototype.inside = function(pt) {
    return true; // if point is inside of the bounds, point is considered to be
                 // inside the video shape
};
/** @private @method play */
Video.prototype.play = function(ltime, duration) {
    if (!this.ready || this.playing) {
       return false;
    }

    this.playing = true;
    var current_time = (this.offset || 0) + ltime;

    this.video.currentTime = current_time;
    this.video.play();
}
/** @private @method stop */
Video.prototype.stop = function() {
    if (!this.playing) return;
    this.video.pause();
    this.playing = false;
};
Video.prototype.invalidate = function() {
    this.$bounds = null;
};
Video.prototype.dispose = function() {};
/**
 * @method clone
 *
 * @return {anm.Video}
 */
Video.prototype.clone = function() {
    var clone = new Video(this.url);
    clone.offset = this.offset;
    return clone;
};

function videoErrProxy(src, pass_to) {
  return function(err) {
    // e_.MEDIA_ERR_ABORTED=1
    // e_.MEDIA_ERR_NETWORK=2
    // e_.MEDIA_ERR_DECODE=3
    // e_.MEDIA_ERR_SRC_NOT_SUPPORTED=4
    // e_.MEDIA_ERR_ENCRYPTED=5
    pass_to(new Error('Failed to load video file from ' + src + ' with error code: ' +
                      err.currentTarget.error.code));
  };
}

module.exports = Video;
