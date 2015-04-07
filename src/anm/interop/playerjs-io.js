var engine = require('engine'),
    C = require('../constants.js');

var playerJsVersion = '0.0.10';

var adapter = {
    play: function() {
        this.play();
    },

    pause: function() {
        this.pause();
    },

    getPaused: function() {
        return this.state.happens === C.PAUSED;
    },

    mute: function() {
        this.mute();
    },

    unmute: function() {
        this.unmute();
    },

    isMuted: function() {
        return this.muted;
    },

    setVolume: function(message) {
        var volume = message.value;
        player.volume(volume/100);
    },

    getVolume: function() {
        return player.volume()*100;
    },

    getDuration: function() {
        return player.state.duration;
    },

    setCurrentTime: function(message) {
        var time = message.value;
        this.pause().play(time);
    },

    getCurrentTime: function() {
        return this.state.time;
    },

    setLoop: function(message) {
        var loop = message.value;
        this.repeat = loop;
    },

    getLoop: function() {
        return this.repeat;
    },

    addEventListener: function(message) {
        var event = message.value,
            listener = message.listener;
        if (!listeners[event] || listeners[event].indexOf(listener) !== -1) {
            return;
        }
        listeners[event].push(listener);
        return {};
    },

    removeEventListener: function(message) {
        var event = message.value,
            listener = message.listener;
        if (!listeners[event]) {
            return;
        }
        if (!listener) {
            listeners[event] = [];
        } else {
            var index = listeners[event].indexOf(listener);
            if (index !== -1) {
                listeners[event].splice(index, 1);
            }
        }
    }
};

var listeners = {
    'progress': [],
    'timeupdate': [],
    'play': [],
    'pause': [],
    'ended': []
};

var supportedEvents = ['ready'];
for (var e in listeners) {
    supportedEvents.push(e);
}

var supportedMethods = [];
for (var m in adapter) {
    supportedMethods.push(m);
}

var origin = engine.getIframeOrigin();

var messageListener = function(evt) {
    var message = JSON.parse(evt.data);
    if (evt.origin === origin && message.context === 'player.js') {
        if (adapter[message.method] && player) {
            var result = adapter[message.method].call(player, message);
            engine.postToContentWindow({
                context: 'player.js',
                version: playerJsVersion,
                event: message.method,
                listener: message.listener,
                value: result
            });
        }
    }
};

if (engine.isInIframe()) {
    engine.addMessageListener(messageListener);
}

var fireEvent = function(event, data, isGlobal) {
    var message = {
        context: 'player.js',
        version: playerJsVersion,
        event: event,
        value: data || {}
    };
    if (isGlobal) {
        engine.postToContentWindow(message);
    } else {
        if (!listeners[event] || listeners[event].length === 0) {
            return;
        }
        for (var i = 0; i < listeners[event].length; i++) {
            message.listener = listeners[event][i];
            engine.postToContentWindow(message);
        }
    }

};

var bindPlayerEvents = function(player) {
    if (!engine.isInIframe()) {
        return;
    }
    player.on(C.S_LOAD, function(){
        fireEvent('ready', {
            src: engine.getIframeSrc(),
            events: supportedEvents,
            methods: supportedMethods
        }, true);
    });

    player.on(C.S_LOADING_PROGRESS, function(progress) {
        fireEvent('progress', {percent: progress*100});
    });

    player.on(C.S_PLAY, function(){
        fireEvent('play');
    });

    player.on(C.S_PAUSE, function(){
        fireEvent('pause');
    });

    player.on(C.S_COMPLETE, function(){
        fireEvent('ended');
    });

    player.on(C.S_TIME_UPDATE, function(time) {
        fireEvent('timeupdate', {seconds: time, duration: player.state.duration});
    });
};


var player;
module.exports = {
    setPlayer: function(p) {
        player = p;
        bindPlayerEvents(p);
    }
};
