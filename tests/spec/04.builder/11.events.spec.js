/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

xdescribe("events", function() {

    describe("different types of events", function() {

        it("not implemented", function() {
            this.fail('NI');
        });

    });

    /*
    TODO: - also test start/stop firing for children, especially when child band finish is at the same global time as parent's band finish
          - test the mouse position is correctly transformed to the right local position, even if tweens are applied and with respect to
            pivot and registration point
          - play with enabling/disabling children
          - decide, if it is OK not to fire X_STOP (band stop) event when scene finished playing
          - test the differences in firing these events when just a frame was called to render (drawAt) or during the playing process
            (or pause/play)

    function wrapWithLogging(prefix, _elm) {
        _elm.whenPlayer(C.S_STOP, function(player) { console.log(prefix, 'STOP', player.state.time, player); })
            .whenPlayer(C.S_PLAY, function(player) { console.log(prefix, 'PLAY', player.state.time, player); })
            .whenPlayer(C.S_PAUSE, function(player) { console.log(prefix, 'PAUSE', player.state.time, player); })
            .whenPlayer(C.S_LOAD, function(player) { console.log(prefix, 'LOAD1', player.state.time, player); })
            .whenPlayer(C.S_LOAD, function(player) { console.log(prefix, 'LOAD2', player.state.time, player); })
            .whenPlayer(C.S_REPEAT, function(player) { console.log(prefix, 'REPEAT', player.state.time, player); })
            .whenPlayer(C.S_ERROR, function(player) { console.log(prefix, 'ERROR', player.state.time, player); })
            .onstart(function(t, duration) { console.log(prefix, 'start', t, duration, t/duration); })
            .onstop(function(t, duration) { console.log(prefix, 'stop', t, duration, t/duration); })
        return _elm;
    }

    return wrapWithLogging('scene',
              b().add(wrapWithLogging('2-10',     b().band([2, 10])))
                 .add(wrapWithLogging('0-10',     b().band([0, 10])))
                 .add(wrapWithLogging('3-7',      b().band([3, 7])))
                 .add(wrapWithLogging('3-Inf',    b().band([3, Infinity])))
                 .add(wrapWithLogging('(-3)-6',   b().band([-3, 6])))
                 .add(wrapWithLogging('(-3)-Inf', b().band([-3, Infinity])))
                 .add(wrapWithLogging('11-12',    b().band([11, 12]))));
    */

});
