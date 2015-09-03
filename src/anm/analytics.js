var engine = require('engine');

var Analytics = function () {
    var self = this,
        timeout = 1000,
        beacon = null,
        animatronUrl = 'http://localhost:8080/analytics?';

    self.queue = [];

    var event = function () {
        if (self.queue.length > 0) {
            var trackUrl = animatronUrl + 'player=' + encodeURIComponent(JSON.stringify(self.queue));
            self.queue = [];

            if (!beacon) {
                beacon = engine.createStatImg();
            }
            beacon.src = trackUrl;
            beacon.onerror = beacon.onload = function (e) {
                console.log('here we are', trackUrl, e);
                beacon.onerror = beacon.onload = null;
                setTimeout(event, timeout);
            }
        } else {
            setTimeout(event, timeout);
        }
    };
    event();
    window.addEventListener('beforeunload', event, false);

    this.trackPlayingStart = this.trackPlayer('playing_start');
    this.trackPlayingPause = this.trackPlayer('playing_pause');
    this.trackPlayingComplete = this.trackPlayer('playing_complete');
};

Analytics.prototype.track = function track(name, opts) {
    opts = opts || {};
    opts.name = name;
    opts.referer = document.referrer;
    opts.lang = navigator.language || navigator.userLanguage;
    this.queue.push(opts);
};

Analytics.prototype.trackPlayer = function trackPlayer(name) {
    return function (player) {
        var opts = {viewId: player.viewId, time: player.state.time};
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
