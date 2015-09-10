var engine = require('engine'),
    utils = require('./utils.js');

var Analytics = function () {
    var self = this,
        supportSendBeacon = !!navigator.sendBeacon,
        timeout = supportSendBeacon ? 2000 : 1000,
        beacon = null,
        animatronUrl = utils.makeApiUrl('/analytics/player');

    self.enabled = animatronUrl != null || animatronUrl.indexOf('animatron-test') >= 0;
    self.queue = [];

    var event = function () {
        if (self.queue.length > 0) {
            var data = JSON.stringify(self.queue);
            self.queue = [];

            if (supportSendBeacon) {
                navigator.sendBeacon(animatronUrl, data);
                setTimeout(event, timeout);
            } else {
                var trackUrl = animatronUrl + '?data=' + encodeURIComponent(data);
                sendViaGif(trackUrl);
            }
        } else {
            setTimeout(event, timeout);
        }
    };

    var sendViaGif = function (trackUrl) {
        if (!beacon) {
            beacon = engine.createStatImg();
        }
        beacon.src = trackUrl;
        beacon.onerror = beacon.onload = function () {
            beacon.onerror = beacon.onload = null;
            setTimeout(event, timeout);
        }
    };
    if (self.enabled) {
        event();
        window.addEventListener('unload', event, false);
    }

    this.trackPlayingStart = this.trackPlayer('playing_start');
    this.trackPlayingPause = this.trackPlayer('playing_pause');
    this.trackPlayingComplete = this.trackPlayer('playing_complete');
};

Analytics.prototype.track = function track(name, opts) {
    opts = opts || {};
    opts.name = name;
    opts.referer = document.referrer;
    opts.lang = navigator.language || navigator.userLanguage;
    opts.url = location.href;
    opts.screenHeight = screen.height;
    opts.screenWidth = screen.width;
    opts.windowHeight = window.innerHeight;
    opts.windowWidth = window.innerWidth;
    opts.timestamp = new Date().getTime();
    if (this.enabled) {
        this.queue.push(opts);
    }
};

Analytics.prototype.trackPlayer = function trackPlayer(name) {
    return function (player) {
        var opts = {viewId: player.viewId, projectId: player.anim.meta._anm_id, time: player.state.time};
        this.track(name, opts);
    }.bind(this);
};


Analytics.prototype.getObjectId = function () {
    var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function () {
            return (Math.random() * 16 | 0).toString(16);
        }).toLowerCase();
};

module.exports = new Analytics();
