/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

var C = require('../constants.js');

function Video(url) {
    this.url = url;
    this.loaded = false;
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
        });
};
Video.prototype.apply = function(ctx) {};
Video.prototype.bounds = function() {};
Video.prototype.invalidate = function() {};
Video.prototype.dispose = function() {};
Video.prototype.clone = function() { return new Video(this.url) };
