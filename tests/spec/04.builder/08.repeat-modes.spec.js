/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("repeat modes", function() {

    var player;

    var _fg,
        FPS = 30,
        SCENE_DURATION = 28/*,
        CLOSE_FACTOR = 10*/;

    var b = Builder._$;

    var t_cmp = anm.__dev.t_cmp; // FIXME: test t_cmp separately

    var t_adjust = anm.__dev.adjust;

    function t_before      (t0, t1) { return t_cmp(t0, t1) <  0; }
    function t_before_or_eq(t0, t1) { return t_cmp(t0, t1) <= 0; }
    function t_after       (t0, t1) { return t_cmp(t0, t1) >  0; }
    function t_after_or_eq (t0, t1) { return t_cmp(t0, t1) >= 0; }

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn().run(FPS);

        // sandbox mode is enabled not to mess with still-preview used for video-mode
        // (it calls drawAt and causes modifiers to be called once more before starting playing)
        player = createPlayer('test-id', { mode: anm.C.M_SANDBOX });
    });

    afterEach(function() { _fg.stop().destroy(); });

    function expectLocalTime(scene, subj, func) {
        var afterFrameSpy;

        doAsync(player, {
            prepare: function() {
                var onframeSpy = spyOn(subj.v, 'onframe');
                afterFrameSpy = jasmine.createSpy('afterframe').andCallFake(function(glob_t) {
                    var expected_result = func(glob_t);
                    if (expected_result !== false) { expect(onframeSpy).toHaveBeenCalledWith(expected_result); }
                    else { expect(onframeSpy).not.toHaveBeenCalled(); }
                    onframeSpy.reset();
                });
                player.afterFrame(afterFrameSpy);
                return [ scene, SCENE_DURATION ];
            },
            do: 'play', until: anm.C.STOPPED, timeout: SCENE_DURATION + 2,
            then: function() { expect(afterFrameSpy).toHaveBeenCalled(); }
        });
    }

    describe("once mode", function() {

        it("animation works once, when applied to root", function() {
            var scene = b('scene');
            var onceElm = b('once').band([0, SCENE_DURATION / 2]).once();
            scene.add(onceElm);

            expectLocalTime(scene, onceElm,
                function(gtime) {
                    if (t_after(gtime, (SCENE_DURATION / 2))) return false;
                    else return gtime;
                });
        });

        it("animation works once inside of another element", function() {
            var scene = b('scene');
            var onceElm = b('once').band([0, SCENE_DURATION / 3]).once();
            scene.add(b('wrapper').add(onceElm).band([0, SCENE_DURATION / 2]));

            expectLocalTime(scene, onceElm,
                function(gtime) {
                    if (t_after(gtime, (SCENE_DURATION / 3))) return false;
                    else return gtime;
                });
        });

        it("animation works once inside of another element in complex bands structure", function() {
            var scene = b('scene');
            var onceElm = b('once').band([1, SCENE_DURATION / 8]).once();
            scene.add(b('wrapper').add(onceElm).band([2.2, SCENE_DURATION / 2]));

            expectLocalTime(scene, onceElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, 2.2 + (SCENE_DURATION / 8)) ||
                        t_after(gtime, SCENE_DURATION / 2)) return false;
                    return gtime - 3.2;
                });
        });

    });

    describe("stay mode", function() {

        it("animation stays, when applied to root", function() {
            var scene = b('scene');
            var stayElm = b('stay').band([0, SCENE_DURATION / 2]).stay();
            scene.add(stayElm);

            expectLocalTime(scene, stayElm,
                function(gtime) {
                    if (t_after(gtime, (SCENE_DURATION / 2))) return SCENE_DURATION / 2;
                    else return gtime;
                });
        });

        it("animation stays inside of another element", function() {
            var scene = b('scene');
            var stayElm = b('stay').band([0, SCENE_DURATION / 3]).stay();
            scene.add(b('wrapper').add(stayElm).band([0, SCENE_DURATION / 2]));

            expectLocalTime(scene, stayElm,
                function(gtime) {
                    if (t_after(gtime, (SCENE_DURATION / 2))) return false;
                    if (t_after(gtime, (SCENE_DURATION / 3)) &&
                        t_before_or_eq(gtime, (SCENE_DURATION / 2))) return SCENE_DURATION / 3;
                    return gtime;
                });
        });

        it("animation stays inside of another element in complex bands structure", function() {
            var scene = b('scene');
            var stayElm = b('stay').band([1, SCENE_DURATION / 8]).stay();
            scene.add(b('wrapper').add(stayElm).band([2.2, SCENE_DURATION / 2]));

            expectLocalTime(scene, stayElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION / 2)) return false;
                    if (t_after(gtime, 2.2 + (SCENE_DURATION / 8)) &&
                        t_before_or_eq(gtime, SCENE_DURATION / 2)) return (SCENE_DURATION / 8) - 1;
                    return gtime - 3.2;
                });
        });

    });

    describe("loop mode", function() {

        it("animation loops properly, when applied to root", function() {
            var scene = b('scene');
            var loopElm = b('loop').band([0, SCENE_DURATION / 8]).loop();
            scene.add(loopElm);

            expectLocalTime(scene, loopElm,
                function(gtime) {
                    return gtime % (SCENE_DURATION / 8);
                });
        });

        it("animation loops properly inside of another element", function() {
            var scene = b('scene');
            var loopElm = b('loop').band([0, SCENE_DURATION / 8]).loop();
            scene.add(b('wrapper').add(loopElm).band([0, SCENE_DURATION * (4 / 5)]));

            expectLocalTime(scene, loopElm,
                function(gtime) {
                    if (t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                    return gtime % (SCENE_DURATION / 8);
                });
        });

        it("animation loops properly inside of another element in complex bands structure", function() {
            var scene = b('scene');
            var loopElm = b('loop').band([1, SCENE_DURATION / 8]).loop();
            scene.add(b('wrapper').add(loopElm).band([2.2, SCENE_DURATION * (4 / 5)]));

            expectLocalTime(scene, loopElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                    return (gtime - 3.2) % ((SCENE_DURATION / 8) - 1);
                });
        });

        describe("with restriction", function() {

            it("animation loops specified number of times, when applied to root", function() {
                var scene = b('scene');
                var loopElm = b('loop').band([0, SCENE_DURATION / 8]).loop(3);
                scene.add(loopElm);

                expectLocalTime(scene, loopElm,
                    function(gtime) {
                        if (t_after_or_eq(gtime, (SCENE_DURATION / 8) * 3)) return false;
                        return gtime % (SCENE_DURATION / 8);
                    });
            });

            it("animation loops specified number of times inside of another element", function() {
                var scene = b('scene');
                var loopElm = b('loop').band([0, SCENE_DURATION / 8]).loop(2.7);
                scene.add(b('wrapper').add(loopElm).band([0, SCENE_DURATION * (4 / 5)]));

                expectLocalTime(scene, loopElm,
                    function(gtime) {
                        if (t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                        if (t_after_or_eq(gtime, (SCENE_DURATION / 8) * 2.7)) return false;
                        return gtime % (SCENE_DURATION / 8);
                    });
            });

            it("animation loops specified number of times inside of another element in complex bands structure", function() {
                var scene = b('scene');
                var loopElm = b('loop').band([1, SCENE_DURATION / 8]).loop(2.7);
                scene.add(b('wrapper').add(loopElm).band([2.2, SCENE_DURATION * (4 / 5)]));

                expectLocalTime(scene, loopElm,
                    function(gtime) {
                        if (t_before(gtime, 3.2) ||
                            t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                        if (t_after_or_eq(gtime, 3.2 + ((SCENE_DURATION / 8) - 1) * 2.7)) return false;
                        return (gtime - 3.2) % ((SCENE_DURATION / 8) - 1);
                    });
            });

        });

    });

    describe("bounce mode", function() {

        it("animation bounces properly, when applied to root", function() {
            var scene = b('scene');
            var bounceElm = b('bounce').band([0, SCENE_DURATION / 8]).bounce();
            scene.add(bounceElm);

            expectLocalTime(scene, bounceElm,
                function(gtime) {
                    var durtn = SCENE_DURATION / 8;
                    var fits = Math.floor(gtime / durtn);
                    return ((fits % 2) === 0) ? (gtime % durtn) : durtn - (gtime % durtn);
                });
        });

        it("animation bounces properly inside of another element", function() {
            var scene = b('scene');
            var bounceElm = b('bounce').band([0, SCENE_DURATION / 8]).bounce();
            scene.add(b('wrapper').add(bounceElm).band([0, SCENE_DURATION * (4 / 5)]));

            expectLocalTime(scene, bounceElm,
                function(gtime) {
                    if (t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                    var durtn = SCENE_DURATION / 8;
                    var fits = Math.floor(gtime / durtn);
                    return ((fits % 2) === 0) ? (gtime % durtn) : durtn - (gtime % durtn);
                });
        });

        it("animation bounces properly inside of another element in complex bands structure", function() {
            var scene = b('scene');
            var bounceElm = b('bounce').band([1, SCENE_DURATION / 8]).bounce();
            scene.add(b('wrapper').add(bounceElm).band([2.2, SCENE_DURATION * (4 / 5)]));

            expectLocalTime(scene, bounceElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                    var durtn = (SCENE_DURATION / 8) - 1;
                    var fits = Math.floor((gtime - 3.2) / durtn);
                    return ((fits % 2) === 0) ? ((gtime - 3.2) % durtn) : durtn - ((gtime - 3.2) % durtn);
                });
        });

        describe("with restriction", function() {

            it("animation bounces specified number of times, when applied to root", function() {
                var scene = b('scene');
                var bounceElm = b('bounce').band([0, SCENE_DURATION / 8]).bounce(3);
                scene.add(bounceElm);

                expectLocalTime(scene, bounceElm,
                    function(gtime) {
                        var durtn = SCENE_DURATION / 8;
                        if (t_after_or_eq(gtime, durtn * 3)) return false;
                        var fits = Math.floor(gtime / durtn);
                        return ((fits % 2) === 0) ? (gtime % durtn) : durtn - (gtime % durtn);
                    });
            });

            it("animation bounces specified number of times inside of another element", function() {
                var scene = b('scene');
                var bounceElm = b('bounce').band([0, SCENE_DURATION / 8]).bounce(2.3);
                scene.add(b('wrapper').add(bounceElm).band([0, SCENE_DURATION * (4 / 5)]));

                expectLocalTime(scene, bounceElm,
                    function(gtime) {
                        if (t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                        var durtn = SCENE_DURATION / 8;
                        if (t_after_or_eq(gtime, durtn * 2.3)) return false;
                        var fits = Math.floor(gtime / durtn);
                        return ((fits % 2) === 0) ? (gtime % durtn) : durtn - (gtime % durtn);
                    });
            });

            it("animation bounces specified number of times inside of another element and in complex bands structure", function() {
                var scene = b('scene');
                var bounceElm = b('bounce').band([1, SCENE_DURATION / 8]).bounce(2.3);
                scene.add(b('wrapper').add(bounceElm).band([2.2, SCENE_DURATION * (4 / 5)]));

                expectLocalTime(scene, bounceElm,
                    function(gtime) {
                        if (t_before(gtime, 3.2) ||
                            t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                        var durtn = (SCENE_DURATION / 8) - 1;
                        if (t_after_or_eq(gtime, 3.2 + (durtn * 2.3))) return false;
                        var fits = Math.floor((gtime - 3.2) / durtn);
                        return ((fits % 2) === 0) ? ((gtime - 3.2) % durtn) : durtn - ((gtime - 3.2) % durtn);
                    });
            });

        });

    });

});