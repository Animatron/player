var engine = require('engine'),
    utils = require('./utils.js');

var Analytics = function () {
    var self = this,
        animatronUrl = utils.makeApiUrl('/analytics/player');

    self.enabled = animatronUrl != null && animatronUrl.indexOf('animatron-test') >= 0;
    self.queue = {};

    var event = function (e) {
        if (e && e.type === 'unload') {
            anm.player_manager.instances.forEach(function (player) {
                if (player && player.state && player.canvas) {
                    self.trackPlayingComplete(player);
                }
            })
        }
        if (utils.is.not_empty(self.queue)) {
            var array = [];
            for (var key in self.queue) {
                array.push(self.queue[key]);
            }
            self.queue = {};
            var data = JSON.stringify(array);

            if (navigator.sendBeacon) {
                navigator.sendBeacon(animatronUrl, data);
            } else {
                var match = document.cookie.match(/_animatronauth=([^;]+)/);
                var auth = match && match.length > 0 ? match[1] : '';
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

Analytics.prototype.track = function track(name, player, action) {
    if (this.enabled) {
        this.queue[player.viewId] = this.queue[player.viewId] || {
                viewId: player.viewId,
                projectId: player.anim.meta._anm_id,
                referer: document.referrer,
                lang: navigator.language || navigator.userLanguage,
                url: location.href,
                screenHeight: screen.height,
                screenWidth: screen.width,
                windowHeight: window.innerHeight,
                windowWidth: window.innerWidth,
                timestamp: new Date().getTime(),
                actions: []
            };
        action = action || {};
        action.name = name;
        action.time = utils.is.num(action.time) ? action.time : player.state.time;
        action.timestamp = new Date().getTime();
        this.queue[player.viewId].actions.push(action);
    }
};

Analytics.prototype.trackPlayer = function trackPlayer(name) {
    return function (player) { this.track(name, player); }.bind(this);
};

Analytics.prototype.trackUI = function trackUI(player, path, type, time) {
    this.track('interactivity', player, {
        time: time,
        interactivity: {
            path: path,
            type: type
        }
    });
};


Analytics.prototype.getObjectId = function () {
    var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function () {
            return (Math.random() * 16 | 0).toString(16);
        }).toLowerCase();
};

module.exports = new Analytics();
