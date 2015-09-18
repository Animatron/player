var engine = require('engine'),
    utils = require('./utils.js');

var Analytics = function () {
    var self = this,
        animatronUrl = utils.makeApiUrl('/analytics/player');

    self.enabled = animatronUrl != null && animatronUrl.indexOf('animatron-test') >= 0;
    self.queue = [];

    var event = function () {
        if (self.queue.length > 0) {
            var data = JSON.stringify(self.queue);
            self.queue = [];

            if (navigator.sendBeacon) {
                navigator.sendBeacon(animatronUrl, data);
            } else {
                var auth = document.cookie.match(/_animatronauth=(\w+);/)[1];
                var params = auth ? '?user=' + auth : '';
                engine.ajax(animatronUrl + params, null, null, 'POST', null, data, false);
            }
        }
    };

    if (self.enabled) {
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

Analytics.prototype.trackUI = function trackUI(player, path, type, time) {
    var opts = {
        viewId: player.viewId,
        projectId: player.anim.meta._anm_id,
        time: utils.is.num(time) ? time : player.state.time,
        interactivity: {
            path: path,
            type: type
        }
    };
    this.track('interactivity', opts);
};


Analytics.prototype.getObjectId = function () {
    var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function () {
            return (Math.random() * 16 | 0).toString(16);
        }).toLowerCase();
};

module.exports = new Analytics();
