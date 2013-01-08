/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about playing,", function() {

    var player,
        C = anm.C,
        strf = anm.__dev.strf;

    var _instances = 0;

    var FPS = 60, _fg;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn().run(FPS);

        player = createPlayer('test-id-' + _instances++);
    });

    afterEach(function() { _fg.stop(); });

    it("should not play anything just after loading a scene", function() {
        var playSpy = spyOn(player, 'play');
        player.load(new anm.Scene());
        expect(playSpy).not.toHaveBeenCalled();
    });

    it("should use no duration for an empty scene", function() {
        player.load(new anm.Scene());
        expect(player.state.duration).toEqual(0);
    });

    it("should use default duration for a scene with no-band element", function() {
        var scene = new anm.Scene();
        scene.add(new anm.Element());
        player.load(scene);
        expect(player.state.duration).toBe(anm.Element.DEFAULT_LEN);
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
            expect(e.message).toBe(anm.Errors.P.PAUSING_WHEN_STOPPED);
            player.stop();
        }
    });

    it("should pause at a time where pause was called", function() {

        var scene = new anm.Scene();
        scene.add(new anm.Element());

        doAsync(player, scene, {
            run: function() {
                player.play();
                expect(player.state.from).toBe(0);

                setTimeout(function() {
                    player.pause();
                }, 600);
            },
            until: C.PAUSED,
            then: function() {
                expect(player.state.happens).toBe(C.PAUSED);
                expect(player.state.time).toBeEpsilonyCloseTo(0.6, 0.15);
            }
        });

    });

    it("should allow to play from other point after a pause was called", function() {

        var scene = new anm.Scene();
        scene.add(new anm.Element());
        scene.duration = 1;

        var wasAtEnd = false;

        doAsync(player, scene, {
            run: function() {
                player.play();
                expect(player.state.from).toBe(0);

                setTimeout(function() {
                    player.pause();
                    player.play(.2);
                    expect(player.state.from).toBe(.2);
                }, 600);
            },
            waitFor: function() {
                var t = player.state.time;
                if (!wasAtEnd && (t > .51)) wasAtEnd = true;
                return wasAtEnd && (t > .2)
                                && (t < .5);
            }, timeout: 0.8,
            then: function() {
                expect(player.state.happens).toBe(C.PLAYING);
                expect(player.state.time).toBeGreaterThan(0.2);
                expect(player.state.time).toBeLessThan(0.5);
                expect(player.state.from).toBe(0.2);
            }
        });
    });

    it("should stop at no-time when stop was called", function() {

        var scene = new anm.Scene();
        scene.add(new anm.Element());

        doAsync(player, scene, {
            run: function() {
                player.play();
                expect(player.state.from).toBe(0);

                setTimeout(function() {
                    player.stop();
                }, 600);
            },
            until: C.STOPPED, timeout: 0.8,
            then: function() { expect(player.state.time).toBe(anm.Player.NO_TIME); }
        });

    });

    it("should call modifiers and painters through all playing cycle", function() {
        var modifierSpy = jasmine.createSpy('modifier-spy');
        var painterSpy = jasmine.createSpy('painter-spy');

        var duration = 1.1;

        var maxFPS = -1,
            minFPS = Number.MAX_VALUE;

        var onframeCallbackSpy = jasmine.createSpy('onframe-cb').andCallFake(function(t) {
            expect(t).toBeGreaterThanOrEqual(0);
            expect(t).toBeLessThanOrEqual(duration + anm.Player.PEFF);
            if (t <= duration) {
                expect(modifierSpy).toHaveBeenCalledWith(t / duration, duration, undefined);
                expect(painterSpy).toHaveBeenCalledWith(_mocks.context2d, undefined);
                mCalls++; pCalls++;
                modifierSpy.reset();
                painterSpy.reset();
            }
            var lastFPS = player.state.afps;
            if (lastFPS > 0) {
                if (lastFPS > maxFPS) maxFPS = lastFPS;
                if (lastFPS < minFPS) minFPS = lastFPS;
            }
        });

        var mCalls = 0, pCalls = 0;

        var scene = new anm.Scene();
        var elem = new anm.Element();
        elem.setBand([0, duration]);
        elem.addModifier(modifierSpy);
        elem.addPainter(painterSpy);
        scene.add(elem);

        doAsync(player, {
            prepare: function() {
                expect(modifierSpy).not.toHaveBeenCalled();
                expect(painterSpy).not.toHaveBeenCalled();
                return scene;
            },
            run: function() {
                expect(scene.duration).toBe(duration); // FIXME: move to a separate test
                expect(modifierSpy).toHaveBeenCalledOnce(); // for preview
                expect(painterSpy).toHaveBeenCalledOnce(); // for preview
                modifierSpy.reset();
                painterSpy.reset();

                player.afterFrame(onframeCallbackSpy);

                player.play();
            }, until: C.STOPPED, timeout: duration + .2,
            then: function() {
                expect(onframeCallbackSpy).toHaveBeenCalled();
                expect(player.state.afps).toBeGreaterThan(0);
                expect(minFPS).toBeLessThan(Number.MAX_VALUE);
                expect(maxFPS).toBeGreaterThan(0);
                var midFPS = minFPS + ((maxFPS - minFPS) / 2);
                expect(midFPS).toBeGreaterThan(0);
                expect(mCalls).toBeEpsilonyCloseTo(midFPS * duration, 3);
                expect(pCalls).toBeEpsilonyCloseTo(midFPS * duration, 3);
                /*expect(player.state.afps).toEqual(FPS);
                expect(mCalls).toEqual(FPS * duration, 10);
                expect(pCalls).toEqual(FPS * duration, 10);*/
            }
        });

    });

    describe("repeat option", function() {

        it("should stop at end of scene by default", function() {

            var stopSpy = spyOn(player, 'stop').andCallThrough();

            var scene = new anm.Scene();
            scene.add(new anm.Element());
            scene.duration = 1;

            doAsync(player, scene, {
                run: function() {
                    player.play();
                    expect(player.state.from).toBe(0);
                    expect(player.state.happens).toBe(C.PLAYING);
                    stopSpy.reset();
                }, until: C.STOPPED,
                then: function() { expect(stopSpy).toHaveBeenCalledOnce(); }
            });

        });

        it("should repeat the scene at the end, if it was previously set with repeat option", function() {

            var playSpy = spyOn(player, 'play').andCallThrough(),
                stopSpy = spyOn(player, 'stop').andCallThrough();

            var wasAtEnd = false;

            doAsync(player, {
                prepare: function() {
                    var scene = new anm.Scene();
                    scene.add(new anm.Element());
                    scene.duration = 1;

                    player.state.repeat = true;

                    return scene;
                },
                run: function() {
                    player.play();

                    expect(player.state.from).toBe(0);
                    expect(player.state.happens).toBe(C.PLAYING);

                    playSpy.reset();
                    stopSpy.reset();
                },
                waitFor: function() {
                    var t = player.state.time;
                    if (!wasAtEnd && (t > .6)) wasAtEnd = true;
                    return wasAtEnd && (t > .1)
                                    && (t < .5);
                },
                then: function() {
                    expect(stopSpy).toHaveBeenCalledOnce();
                    expect(playSpy).toHaveBeenCalledOnce();
                    expect(player.state.happens).toBe(C.PLAYING);
                    expect(player.state.time).toBeGreaterThan(0);
                    expect(player.state.time).toBeLessThan(1);
                    expect(player.state.from).toBe(0);
                }
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
                expect(e.message).toBe(anm.Errors.P.AFTERFRAME_BEFORE_PLAY);
                player.stop();
            }

            try {
                player.load(new anm.Scene());
                player.play(1);
                player.afterFrame(function() {});
            } catch(e) {
                expect(e.message).toBe(anm.Errors.P.AFTERFRAME_BEFORE_PLAY);
                player.stop();
            }
        });

        it("should actually call the given callback while playing", function() {

            var modifierSpy = jasmine.createSpy('modifier-spy');
            var painterSpy = jasmine.createSpy('painter-spy');

            var duration = 1.1;

            var maxFPS = -1,
                minFPS = Number.MAX_VALUE;

            var onframeCallbackSpy = jasmine.createSpy('onframe-cb').andCallFake(function(t) {
                expect(t).toBeGreaterThanOrEqual(0);
                expect(t).toBeLessThanOrEqual(duration + anm.Player.PEFF);
                if (t <= duration) {
                    // ensure modifying and painting was performed for this frame
                    expect(modifierSpy).toHaveBeenCalledWith(t / duration, duration, undefined);
                    expect(painterSpy).toHaveBeenCalled();
                    modifierSpy.reset();
                    painterSpy.reset();
                    var lastFPS = player.state.afps;
                    if (lastFPS > 0) {
                        if (lastFPS > maxFPS) maxFPS = lastFPS;
                        if (lastFPS < minFPS) minFPS = lastFPS;
                    }
                }
            });

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            elem.addModifier(modifierSpy);
            elem.addPainter(painterSpy);
            scene.add(elem);

            doAsync(player, {
                prepare: function() {
                    player.load(scene);

                    modifierSpy.reset();
                    painterSpy.reset();

                    player.afterFrame(onframeCallbackSpy);
                },
                do: 'play', until: C.STOPPED, timeout: duration + .2,
                then: function() {
                    expect(scene.duration).toBe(duration);
                    expect(onframeCallbackSpy).toHaveBeenCalled();
                    expect(minFPS).toBeLessThan(Number.MAX_VALUE);
                    expect(maxFPS).toBeGreaterThan(0);
                    var midFPS = minFPS + ((maxFPS - minFPS) / 2);
                    expect(midFPS).toBeGreaterThan(0);
                    expect(onframeCallbackSpy.callCount).toBeEpsilonyCloseTo(midFPS * duration, 5);
                }
            });

        });

        // TODO: ensure that the given callback is used for next playing periods, and if it
        //       is changed, new version is used.


    });

    describe("drawAt method, concretely", function() {

        it("should not allow to be called out of scene bounds", function() {

            var duration = 1.1;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            scene.add(elem);

            player.load(scene);

            try {
                player.drawAt(duration + 0.05);
            } catch(e) {
                expect(e.message).toBe(strf(anm.Errors.P.PASSED_TIME_NOT_IN_RANGE, [duration+0.05]));
            }

            try {
                player.drawAt(duration + 10);
            } catch(e) {
                expect(e.message).toBe(strf(anm.Errors.P.PASSED_TIME_NOT_IN_RANGE, [duration+10]));
            }

            try {
                player.drawAt(-0.05);
            } catch(e) {
                expect(e.message).toBe(strf(anm.Errors.P.PASSED_TIME_NOT_IN_RANGE, [-0.05]));
            }

            try {
                player.drawAt(-10);
            } catch(e) {
                expect(e.message).toBe(strf(anm.Errors.P.PASSED_TIME_NOT_IN_RANGE, [-10]));
            }

        });

        it("should call it synchronously and call required modifiers/painters", function() {
            var modifierSpy = jasmine.createSpy('modifier-spy');
            var painterSpy = jasmine.createSpy('painter-spy');

            var duration = 1.1;

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
            expect(modifierSpy).toHaveBeenCalledWith(testTime / duration, duration, undefined);
            expect(painterSpy).toHaveBeenCalledWith(_mocks.context2d, undefined);

        });

        // TODO: test resetting state after drawAt and stuff

    });

    var DEFAULT_VIDEO_DURATION = anm.Scene.DEFAULT_VIDEO_DURATION;
    var DEFAULT_ELEMENT_LENGTH = anm.Element.DEFAULT_LEN;

    describe("scene duration", function() {

        var scene;

        var expected_duration;

        var big_band = [-10, 101.2];

        beforeEach(function() {
            scene = new anm.Scene();
        });

        varyAll([

            { description: "in case of empty scene, duration will be the default duration of the video",
              prepare: function() { expected_duration = 0; } },

            { description: "in case of scene with no-band element, duration will be the default length of an element",
              prepare: function() { scene.add(new anm.Element());
                                    expected_duration = DEFAULT_ELEMENT_LENGTH; } },

            { description: "in case of scene with several no-band elements, duration will be the default length of an element",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    expected_duration = DEFAULT_ELEMENT_LENGTH; } },

            { description: "in case of scene with an element that has a simple band, duration will be equal to a band duration",
              prepare: function() { var elm = new anm.Element();
                                    elm.setBand([0, 5]);
                                    scene.add(elm);
                                    expected_duration = 5; } },

            { description: "in case of scene with an element that has a shifted band, duration will be equal to band end",
              prepare: function() { var elm = new anm.Element();
                                    elm.setBand([2, 15]);
                                    scene.add(elm);
                                    expected_duration = 15; } },

            { description: "in case of scene with an element that has a negative band, duration will be equal to a band end",
              prepare: function() { var elm = new anm.Element();
                                    elm.setBand([-12, 50]);
                                    scene.add(elm);
                                    expected_duration = 50; } },

            { description: "in case of scene with some element that has a shifted band inside (set before adding), duration will be equal to a root duration (default one, since it wasn't set)",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    inner.setBand([2, 17]);
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    expected_duration = DEFAULT_ELEMENT_LENGTH; } },

            { description: "in case of scene with some element that has a shifted band inside (set after adding), duration will be equal to a root duration (default one, since it wasn't set)",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    inner.setBand([2, 17]);
                                    expected_duration = DEFAULT_ELEMENT_LENGTH; } },

            { description: "in case of scene with some element that has a shifted band inside (set before adding) and root has a band, duration will be equal to a root duration",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    inner.setBand([2, 17]);
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    root.setBand([-2, 12]);
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    expected_duration = 12; } },

            { description: "in case of scene with some element that has a shifted band inside (set after adding) and root has a band, duration will be equal to a root duration",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    root.setBand([-2, 12]);
                                    inner.setBand([2, 17]);
                                    expected_duration = 12; } },

            { description: "when one of the roots has duration less than default, scene will have default duration",
              prepare: function() { expect(DEFAULT_ELEMENT_LENGTH).toBeGreaterThan(2);
                                    var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.setBand([-9, DEFAULT_ELEMENT_LENGTH - 2]);
                                    root.add(new anm.Element());
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    inner.setBand([2, 17]);
                                    expected_duration = DEFAULT_ELEMENT_LENGTH; } },

            { description: "in case of scene with several elements that has different bands, duration will be minimum-start + maximum-reachable root band",
              prepare: function() { var root1 = new anm.Element();
                                    var root2 = new anm.Element();
                                    var root3 = new anm.Element();
                                    var root4 = new anm.Element();
                                    var inner1 = new anm.Element();
                                    var inner2 = new anm.Element();
                                    var inner3 = new anm.Element();
                                    var inner4 = new anm.Element();
                                    root1.setBand([1, 6]);
                                    root2.setBand([1, 5]);
                                    root2.add(inner1);
                                    inner1.setBand([2, 75]);
                                    inner3.setBand([0, 3]);
                                    inner4.setBand([-2, 5]);
                                    scene.add(root1);
                                    scene.add(root2);
                                    scene.add(root3);
                                    scene.add(root4);
                                    root2.add(inner2);
                                    root2.add(inner3);
                                    root3.add(inner4);
                                    root3.setBand([2, 36]);
                                    root4.setBand([-40, 4]);
                                    expected_duration = 36; } },

            { description: "in case of scene with several elements that has different bands and some top-level of them has a negative band, duration still will be 0 + maximum-reachable root band",
              prepare: function() { var root1 = new anm.Element();
                                    var root2 = new anm.Element();
                                    var root3 = new anm.Element();
                                    var root4 = new anm.Element();
                                    var inner1 = new anm.Element();
                                    var inner2 = new anm.Element();
                                    var inner3 = new anm.Element();
                                    var inner4 = new anm.Element();
                                    root1.setBand([1, 6]);
                                    root2.setBand([1, 5]);
                                    root2.add(inner1);
                                    inner1.setBand([2, 75]);
                                    inner3.setBand([0, 3]);
                                    inner4.setBand([-2, 5]);
                                    scene.add(root1);
                                    scene.add(root2);
                                    scene.add(root3);
                                    scene.add(root4);
                                    root2.add(inner2);
                                    root2.add(inner3);
                                    root3.add(inner4);
                                    root3.setBand([2, 2]);
                                    root4.setBand([-40, 12.5]);
                                    expected_duration = 12.5; } }

            // TODO: test what happens if element was live-removed from a scene

        ], function() {

            it("and should stay as expected just after the creation", function() {
                expect(scene.duration).toBe(expected_duration);
            });

            it("and should remain with its value when loaded into player", function() {
                player.load(scene);
                expect(scene.duration).toBe(expected_duration);
            });

            it("and should remain with its value even when started to play", function() {
                player.load(scene).play();
                expect(scene.duration).toBe(expected_duration);
                player.stop();
            });

            it("and if was overriden, should stay after a load", function() {
                scene.duration = 12;
                player.load(scene);
                expect(scene.duration).toBe(12);
            });

            it("and if was overriden, should stay after a playing", function() {
                scene.duration = 17;
                player.load(scene).play();
                expect(scene.duration).toBe(17);
                expect(player.state.duration).toBe(17);
                player.stop();
            });

            it("and should change duration when it was overriden after loading but before playing", function() {
                player.load(scene);
                scene.duration = 22;
                player.play();
                expect(player.state.duration).toBe(22);
                player.stop();
            });

            it("and should not change duration when it was overriden after playing", function() {
                player.load(scene);
                player.play();
                scene.duration = 3;
                expect(player.state.duration).toBe(expected_duration);
                player.stop();
            });

            it("and should change duration if some element with band was added before playing", function() {
                player.load(scene);
                var big_band_elm = new anm.Element();
                big_band_elm.setBand(big_band);
                scene.add(big_band_elm);
                player.play();
                expect(scene.duration).toBe(big_band[1]);
                expect(player.state.duration).toEqual(scene.duration);
                player.stop();
            });

            it("and should not change duration if some element with band was added during playing", function() {
                player.load(scene);
                player.play();
                var big_band_elm = new anm.Element();
                big_band_elm.setBand(big_band);
                scene.add(big_band_elm);
                expect(scene.duration).toBe(big_band[1]);
                expect(player.state.duration).toBe(expected_duration);
                player.stop();
            });

        });

    });

    // ensure drawAt and playing are the similar calls and produce the same results
    // test passing stopAt value to play() method (state.stop)
    // state.from
    // state.time
    // drawAt should be synchrounous (scene should be fully rendered after drawFrame)
    // test all the inner sequence of playing
    // test callback passed to be called after every frame
    // test callback passed to be called after playing
    // should not call modifiers/painters while stopped/paused
    /// test if while preview is shown at preview time pos, only for video mode, controls are at 0
    // errors

});