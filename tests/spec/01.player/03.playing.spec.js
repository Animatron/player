/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about playing,", function() {

    var player,
        C = anm.C;

    var _instances = 0;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();

        player = createPlayer('test-id-' + _instances++);
    });

    it("should not play anything just after loading a scene", function() {
        var playSpy = spyOn(player, 'play');
        player.load(new anm.Scene());
        expect(playSpy).not.toHaveBeenCalled();
    });

    it("should use no duration for an empty scene", function() {
        player.load(new anm.Scene());
        expect(player.state.duration).toEqual(0);
    });

    it("should use default duration for a scene with element", function() {
        var scene = new anm.Scene();
        scene.add(new anm.Element());
        player.load(scene);
        expect(player.state.duration).toBe(anm.Scene.DEFAULT_VIDEO_DURATION);
    });

    it("should try to draw stop-frame of an empty scene at 0, " +
       "when it will be loaded into player", function() {
        var drawSpy = spyOn(player, 'drawAt').andCallThrough();

        var scene = new anm.Scene();
        var renderSpy = spyOn(scene, 'render').andCallThrough();

        player.load(scene);

        expect(drawSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledWith(0);
        expect(renderSpy).toHaveBeenCalled();
        expect(player.state.time).toBe(anm.Player.NO_TIME);
    });

    it("should draw stop-frame at preview position when scene loaded", function() {
        var stopSpy = spyOn(player, 'stop').andCallThrough();
        var drawSpy = spyOn(player, 'drawAt').andCallThrough();

        var scene = new anm.Scene();
        scene.add(new anm.Element());
        player.load(scene);

        expect(stopSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledOnce();
        // P.S. draws at PREVIEW_POS only in C.M_VIDEO mode
        expect(drawSpy).toHaveBeenCalledWith(anm.Scene.DEFAULT_VIDEO_DURATION
                                           * anm.Player.PREVIEW_POS);
        expect(player.state.time).toBe(anm.Player.NO_TIME);
    });

    it("should keep player.anim to point to current scene", function() {
        var scene = new anm.Scene();
        player.load(scene);
        expect(player.anim).toBe(scene);

        var anotherScene = new anm.Scene();
        anotherScene.add(new anm.Element());
        player.load(anotherScene);
        expect(player.anim).toBe(anotherScene);

        player.load(scene);
        expect(player.anim).toBe(scene);

        try { player.load(null); } catch(e) {};
        expect(player.anim).toBe(null);
        expect(player.state.time).toBe(anm.Player.NO_TIME);
    });

    describe("should keep its state conforming to the situation, so", function() {

        it("should have state.happens equal to nothing, if no scene loaded", function() {
            expect(player.state.happens).toBe(C.NOTHING);
        });

        it("should have state.happens equal to stopped, if scene loaded, but not played", function() {
            expect(player.state.happens).toBe(C.NOTHING);
            player.load(new anm.Scene());
            expect(player.state.happens).toBe(C.STOPPED);
        });

        it("should have state.happens equal to nothing, if no scene passed to load", function() {
            expect(player.state.happens).toBe(C.NOTHING);
            player.load(new anm.Scene());
            expect(player.state.happens).toBe(C.STOPPED);
            try { player.load(null); } catch(e) {};
            expect(player.anim).toBe(null);
            expect(player.state.happens).toBe(C.NOTHING);
        });

        it("should have state.happens equal to playing, if started playing", function() {
            var scene = new anm.Scene();
            scene.add(new anm.Element());
            player.load(scene);
            expect(player.anim).not.toBe(null);
            player.play();
            expect(player.state.happens).toBe(C.PLAYING);
            player.stop();
            player.play(2);
            expect(player.state.happens).toBe(C.PLAYING);
            player.stop();
        });

        it("should have state.happens equal to stopped, " +
           "if requested time exceeds scene duration when asking to play", function() {
            player.load(new anm.Scene());
            expect(player.anim).not.toBe(null);
            player.play();
            expect(player.state.happens).toBe(C.PLAYING);
            player.stop();
            player.play(2);
            expect(player.state.happens).toBe(C.STOPPED);
        });

        it("should have state.happens equal to stopped, if started playing and then stopped", function() {
            player.load(new anm.Scene());
            player.play();
            player.stop();
            expect(player.state.happens).toBe(C.STOPPED);
        });

        it("should have state.happens equal to paused, if started playing and then paused", function() {
            player.load(new anm.Scene());
            player.play();
            player.pause();
            expect(player.state.happens).toBe(C.PAUSED);
            player.stop();
            player.play();
            player.pause();
            expect(player.state.happens).toBe(C.PAUSED);
            player.stop();
        });

    });

    it("should not allow to pause when stopped", function() {
        player.load(new anm.Scene());
        player.play();
        player.stop();
        expect(player.state.happens).toBe(C.STOPPED);
        try {
            player.pause();
        } catch(e) {
            expect(e.message).toBe(anm.Player.PAUSING_WHEN_STOPPED_ERR);
            player.stop();
        }
    });

    it("should pause at a time where pause was called", function() {

        runs(function() {
            var scene = new anm.Scene();
            scene.add(new anm.Element());
            player.load(scene);

            player.play();
            expect(player.state.from).toBe(0);

            setTimeout(function() {
                player.pause();
            }, 600);
        });

        waitsFor(function() {
            return player.state.happens === C.PAUSED;
        }, 1000);

        runs(function() {
            expect(player.state.happens).toBe(C.PAUSED);
            expect(player.state.time).toBeEpsilonyCloseTo(0.6, 0.15);
            player.stop();
        });

    });

    it("should allow to play from other point after a pause was called", function() {

        runs(function() {
            var scene = new anm.Scene();
            scene.add(new anm.Element());
            scene.duration = 1;
            player.load(scene);

            player.play();
            expect(player.state.from).toBe(0);

            setTimeout(function() {
                player.pause();
                player.play(.2);
                expect(player.state.from).toBe(.2);
            }, 600);
        });

        var wasAtEnd = false;

        waitsFor(function() {
            var t = player.state.time;
            if (!wasAtEnd && (t > .51)) wasAtEnd = true;
            return wasAtEnd && (t > .2)
                            && (t < .5);
        }, 800);

        runs(function() {
            expect(player.state.happens).toBe(C.PLAYING);
            expect(player.state.time).toBeGreaterThan(0.2);
            expect(player.state.time).toBeLessThan(0.5);
            expect(player.state.from).toBe(0.2);
            player.stop();
        });

    });

    it("should stop at no-time when stop was called", function() {

        runs(function() {
            var scene = new anm.Scene();
            scene.add(new anm.Element());
            player.load(scene);

            player.play();
            expect(player.state.from).toBe(0);

            setTimeout(function() {
                player.stop();
            }, 600);
        });

        waitsFor(function() {
            return player.state.happens === C.STOPPED;
        }, 800);

        runs(function() {
            expect(player.state.time).toBe(anm.Player.NO_TIME);
        });

    });

    it("should call modifiers and painters through all playing cycle", function() {
        var modifierSpy = jasmine.createSpy('modifier-spy');
        var painterSpy = jasmine.createSpy('painter-spy');

        var duration = 1;
        var mCalls = 0, pCalls = 0;

        var scene = new anm.Scene();
        var elem = new anm.Element();
        elem.setBand([0, duration]);
        elem.addModifier(modifierSpy);
        elem.addPainter(painterSpy);
        scene.add(elem);

        expect(modifierSpy).not.toHaveBeenCalled();
        expect(painterSpy).not.toHaveBeenCalled()

        player.load(scene);

        expect(modifierSpy).toHaveBeenCalledOnce(); // for preview
        expect(painterSpy).toHaveBeenCalledOnce(); // for preview
        modifierSpy.reset();
        painterSpy.reset();

        var onframeCallbackSpy = jasmine.createSpy('onframe-cb').andCallFake(function(t) {
            expect(t).toBeGreaterThanOrEqual(0);
            expect(t).toBeLessThanOrEqual(duration + anm.Player.PEFF);
            if (t <= duration) {
                expect(modifierSpy).toHaveBeenCalledWith(t, undefined);
                expect(painterSpy).toHaveBeenCalledWith(_mocks.context2d, undefined);
                mCalls++; pCalls++;
                modifierSpy.reset();
                painterSpy.reset();
            }
        });

        player.afterFrame(onframeCallbackSpy);

        runs(function() { player.play(); });

        waitsFor(function() { return player.state.happens === C.STOPPED; }, (duration*1000)+200);

        runs(function() {
            expect(onframeCallbackSpy).toHaveBeenCalled();
            expect(mCalls).toBeEpsilonyCloseTo(player.state.afps * duration, 10);
            expect(pCalls).toBeEpsilonyCloseTo(player.state.afps * duration, 10);
            player.stop();
        });

    });

    describe("repeat option", function() {

        it("should stop at end of scene by default", function() {

            var stopSpy;

            runs(function() {
                stopSpy = spyOn(player, 'stop').andCallThrough();

                var scene = new anm.Scene();
                scene.add(new anm.Element());
                scene.duration = 1;
                player.load(scene);

                player.play();
                expect(player.state.from).toBe(0);
                expect(player.state.happens).toBe(C.PLAYING);
                stopSpy.reset();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1200);

            runs(function() {
                expect(stopSpy).toHaveBeenCalledOnce();
                player.stop();
            });

        });

        it("should repeat the scene at the end, if it was previously set with repeat option", function() {

            var playSpy,
                stopSpy;

            runs(function() {
                playSpy = spyOn(player, 'play').andCallThrough();
                stopSpy = spyOn(player, 'stop').andCallThrough();

                var scene = new anm.Scene();
                scene.add(new anm.Element());
                scene.duration = 1;
                player.state.repeat = true;
                player.load(scene);

                player.play();
                expect(player.state.from).toBe(0);
                expect(player.state.happens).toBe(C.PLAYING);

                playSpy.reset();
                stopSpy.reset();
            });

            var wasAtEnd = false;

            waitsFor(function() {
                var t = player.state.time;
                if (!wasAtEnd && (t > .6)) wasAtEnd = true;
                return wasAtEnd && (t > .1)
                                && (t < .5);
            }, 1200);

            runs(function() {
                expect(stopSpy).toHaveBeenCalledOnce();
                expect(playSpy).toHaveBeenCalledOnce();
                expect(player.state.happens).toBe(C.PLAYING);
                expect(player.state.time).toBeGreaterThan(0);
                expect(player.state.time).toBeLessThan(1);
                expect(player.state.from).toBe(0);
                player.stop();
            });

        });

    });

    describe("events handling, concretely", function() {

        it("should fire playing event when started playing", function() {
            var playCallbackSpy = jasmine.createSpy('play-cb');

            player.on(C.S_PLAY, playCallbackSpy);

            player.load(new anm.Scene());
            player.play();
            player.pause();
            player.stop();
            player.play();
            player.stop();

            expect(playCallbackSpy).toHaveBeenCalledThisAmountOfTimes(2);
        });

        it("should fire pause event when was paused", function() {
            var pauseCallbackSpy = jasmine.createSpy('pause-cb');

            player.on(C.S_PAUSE, pauseCallbackSpy);

            player.load(new anm.Scene());

            player.play();
            player.pause();
            player.stop();

            player.play();
            player.stop();

            expect(pauseCallbackSpy).toHaveBeenCalledThisAmountOfTimes(1);
        });

        it("should fire stop event when was stopped", function() {
            // one 'stop' was called while initializing a player

            var stopCallbackSpy = jasmine.createSpy('stop-cb');

            player.on(C.S_STOP, stopCallbackSpy);

            player.load(new anm.Scene()); // one stop call inside,
                                          // when load performed

            stopCallbackSpy.reset();

            player.play();
            player.stop();

            player.play();
            player.pause();
            player.stop();

            player.play();
            player.stop();

            expect(stopCallbackSpy).toHaveBeenCalledThisAmountOfTimes(3);
        });

        it("should fire load event when scene was loaded", function() {
            var loadCallbackSpy = jasmine.createSpy('load-cb');

            player.on(C.S_LOAD, loadCallbackSpy);

            player.load(new anm.Scene());
            player.play();
            player.stop();
            player.load(new anm.Scene());
            player.play();
            player.pause();
            player.stop();
            player.load(new anm.Scene());

            expect(loadCallbackSpy).toHaveBeenCalledThisAmountOfTimes(3);
        });

    });

    describe("calling something after every frame, concretely", function() {

        it("should allow to set callback for it when not playing", function() {
            try {
                player.afterFrame(function() {});
                player.load(new anm.Scene());
                player.afterFrame(function() {});
                player.play();
                player.pause();
                player.afterFrame(function() {});
                player.play();
                player.stop();
                player.afterFrame(function() {});
            } catch(e) {
                this.fail('Should not throw exceptions, but thrown: ' + (e.message || e));
            }
        });

        it("should not allow seting callback like this while playing", function() {
            try {
                player.load(new anm.Scene());
                player.play();
                player.afterFrame(function() {});
            } catch(e) {
                expect(e.message).toBe(anm.Player.AFTERFRAME_BEFORE_PLAY_ERR);
                player.stop();
            }

            try {
                player.load(new anm.Scene());
                player.play(1);
                player.afterFrame(function() {});
            } catch(e) {
                expect(e.message).toBe(anm.Player.AFTERFRAME_BEFORE_PLAY_ERR);
                player.stop();
            }
        });

        it("should actually call the given callback while playing", function() {
            var modifierSpy = jasmine.createSpy('modifier-spy');
            var painterSpy = jasmine.createSpy('modifier-spy');

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, 1]);
            elem.addModifier(modifierSpy);
            elem.addPainter(painterSpy);
            scene.add(elem);

            player.load(scene);

            modifierSpy.reset();
            painterSpy.reset();

            var onframeCallbackSpy = jasmine.createSpy('onframe-cb').andCallFake(function(t) {
                expect(t).toBeGreaterThanOrEqual(0);
                expect(t).toBeLessThanOrEqual(1 + anm.Player.PEFF);
                if (t <= 1) {
                    // ensure modifying and painting was performed for this frame
                    expect(modifierSpy).toHaveBeenCalledWith(t, undefined);
                    expect(painterSpy).toHaveBeenCalled();
                    modifierSpy.reset();
                    painterSpy.reset();
                }
            });

            player.afterFrame(onframeCallbackSpy);

            runs(function() { player.play(); });

            waitsFor(function() { return player.state.happens === C.STOPPED; }, 1200);

            runs(function() {
                expect(onframeCallbackSpy).toHaveBeenCalled();
                expect(onframeCallbackSpy.callCount).toBeEpsilonyCloseTo(player.state.afps, 5);
                player.stop();
            });

        });

        // TODO: ensure that the given callback is used for next playing periods, and if it
        //       is changed, new version is used.


    });

    describe("drawAt method, concretely", function() {

        it("should not allow to be called out of scene bounds", function() {

            var duration = 1;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            scene.add(elem);

            player.load(scene);

            try {
                player.drawAt(duration + 0.05);
            } catch(e) {
                expect(e.message).toBe(anm.Player.PASSED_TIME_NOT_IN_RANGE_ERR);
            }

            try {
                player.drawAt(duration + 10);
            } catch(e) {
                expect(e.message).toBe(anm.Player.PASSED_TIME_NOT_IN_RANGE_ERR);
            }

            try {
                player.drawAt(-0.05);
            } catch(e) {
                expect(e.message).toBe(anm.Player.PASSED_TIME_NOT_IN_RANGE_ERR);
            }

            try {
                player.drawAt(-10);
            } catch(e) {
                expect(e.message).toBe(anm.Player.PASSED_TIME_NOT_IN_RANGE_ERR);
            }

        });

        it("should call it synchronously and call required modifiers/painters", function() {
            var modifierSpy = jasmine.createSpy('modifier-spy');
            var painterSpy = jasmine.createSpy('painter-spy');

            var duration = 1;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            elem.addModifier(modifierSpy);
            elem.addPainter(painterSpy);
            scene.add(elem);

            expect(modifierSpy).not.toHaveBeenCalled();
            expect(painterSpy).not.toHaveBeenCalled()

            player.load(scene);

            expect(modifierSpy).toHaveBeenCalledOnce(); // for preview
            expect(painterSpy).toHaveBeenCalledOnce(); // for preview
            modifierSpy.reset();
            painterSpy.reset();

            var testTime = duration - (duration / 4);

            player.drawAt(testTime);

            expect(modifierSpy).toHaveBeenCalledOnce();
            expect(painterSpy).toHaveBeenCalledOnce();
            expect(modifierSpy).toHaveBeenCalledWith(testTime, undefined);
            expect(painterSpy).toHaveBeenCalledWith(_mocks.context2d, undefined);

        });

        // TODO: tests resetting state after drawAt and stuff

    });

    // drawAt should be synchrounous (scene should be fully rendered after drawFrame)
    // should not call modifiers/painters while stopped/paused
    // test if while preview is shown at preview time pos, controls are at 0
    // state.from
    // errors

});