var C = anm.C;
var engine = anm.engine;
var utils = anm.utils;
var playerManager = anm.player_manager;

var Analytics = function () {
    var self = this;
    self.animatronUrl = utils.makeApiUrl('analytics', '/analytics/player');

    self.enabled = !!self.animatronUrl;
    self.queue = {};

    var sendAllToServer = function (e) {
        if (e && e.type === 'unload') {
            playerManager.instances.forEach(function (player) {
                if (player && player.isPlaying()) {
                    self.track('playing_complete', player);
                }
            })
        }
        if (utils.is.not_empty(self.queue)) {
            var array = [];
            for (var key in self.queue) {
                if (self.queue.hasOwnProperty(key)) {
                    array.push(self.queue[key]);
                }
            }
            self.queue = {};
            self.sendData(array)
        }
    };

    if (self.enabled) {
        window.addEventListener('unload', sendAllToServer, false);

        playerManager.on(C.S_NEW_PLAYER, function (player) {
            player.on(C.S_PAUSE, function () {
                self.track('playing_pause', player);
            });
            player.on(C.S_COMPLETE, function () {
                self.track('playing_complete', player);
            });
            player.on(C.S_PLAY, function () {
                self.track('playing_start', player);
            });
            player.on(C.S_INTERACTIVITY, function (path, type, time) {
                self.trackUI(player, path, type, time);
            });
        });

        playerManager.on(C.S_PLAYER_DETACH, function (player) {
            self.sendPlayerData(player);
        });
    }

    playerManager.on(C.S_NEW_PLAYER, function (player) {
        player.on(C.S_REPORT_STATS, function () {
            self.reportStats(player);
        });
    });
};

/**
 * @param {Array} views - an array of views
 */
Analytics.prototype.sendData = function (views) {
    var data = JSON.stringify(views);
    if (navigator.sendBeacon) {
        navigator.sendBeacon(this.animatronUrl, data);
    } else {
        var match = document.cookie.match(/_animatronauth=([^;]+)/);
        var auth = match && match.length > 0 ? match[1] : '';
        var params = auth ? '?user=' + auth : '';
        engine.ajax(this.animatronUrl + params, null, null, 'POST', null, data, false);
    }
};

/**
 * @param {String} name
 * @param {Player} player
 * @param {Object} [action]
 */
Analytics.prototype.track = function (name, player, action) {
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
    action.time = utils.is.num(action.time) ? action.time : player.getTime();
    action.timestamp = new Date().getTime();
    this.queue[player.viewId].actions.push(action);
};
Analytics.prototype.reportStats = function (player) {
    // currently, notifies only about playing start
    if (!player.anim || !player.anim.meta || !player.anim.meta._anm_id) return;
    if (!player.statImg) {
        player.statImg = engine.createStatImg();
    }
    var loadSrc = player._loadSrc,
        id = player.anim.meta._anm_id;

    var apiUrl = utils.makeApiUrl('api', '/stats/report/', loadSrc);
    if (apiUrl) {
        player.statImg.src = apiUrl + id + '?' + Math.random();
    }
};

Analytics.prototype.sendPlayerData = function (player) {
    this.track('playing_complete', player);
    var action = [this.queue[player.viewId]];
    this.queue[player.viewId] = undefined;
    this.sendData(action)
};

Analytics.prototype.trackUI = function (player, path, type, time) {
    this.track('interactivity', player, {
        time: time,
        interactivity: {
            path: path,
            type: type
        }
    });
};

new Analytics();
