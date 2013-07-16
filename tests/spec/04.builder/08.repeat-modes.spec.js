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

    // FIXME: replace these calls with _matchers.time calls
    function t_before      (t0, t1) { return t_cmp(t0, t1) <  0; }
    function t_before_or_eq(t0, t1) { return t_cmp(t0, t1) <= 0; }
    function t_after       (t0, t1) { return t_cmp(t0, t1) >  0; }
    function t_after_or_eq (t0, t1) { return t_cmp(t0, t1) >= 0; }

    beforeEach(function() {
        this.addMatchers(_matchers.time);

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
                var realOnFrame = subj.v.onframe;
                var onframe_call_t = null;
                var onframeSpy = spyOn(subj.v, 'onframe').andCallFake(function(time) {
                    onframe_call_t = time;
                    realOnFrame.call(this, time);
                });
                afterFrameSpy = jasmine.createSpy('afterframe').andCallFake(function(glob_t) {
                    var expected_call_t = func(glob_t);
                    // console.log('global', glob_t, 'expected', expected_call_t, 'actual', onframe_call_t);
                    if (expected_call_t !== false) { expect(onframeSpy).toHaveBeenCalled()
                                                     expect(onframe_call_t).toHappenIn(t_cmp, expected_call_t); }
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
            scene.add(b('wrapper').band([0, SCENE_DURATION / 2])
                                  .add(onceElm));

            expectLocalTime(scene, onceElm,
                function(gtime) {
                    if (t_after(gtime, (SCENE_DURATION / 3))) return false;
                    else return gtime;
                });
        });

        it("animation works once inside of another element in complex bands structure", function() {
            var scene = b('scene');
            var onceElm = b('once').band([1, SCENE_DURATION / 8]).once();
            scene.add(b('wrapper').band([2.2, SCENE_DURATION / 2])
                                  .add(onceElm));

            expectLocalTime(scene, onceElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, 2.2 + (SCENE_DURATION / 8)) ||
                        t_after(gtime, SCENE_DURATION / 2)) return false;
                    return gtime - 3.2;
                });
        });

        it("animation works once inside of tinier element in complex bands structure", function() {
            var scene = b('scene');
            var onceElm = b('once').band([1, SCENE_DURATION / 2]).once();
            scene.add(b('wrapper').band([2.2, SCENE_DURATION / 8])
                                  .add(onceElm));

            expectLocalTime(scene, onceElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION / 8)) return false;
                    return gtime - 3.2;
                });
        });

        describe("properly affects child element with its own mode", function() {

            /*it("if child element has default repeat mode", function() {

            });*/

            it("if child element has once repeat mode", function() {
                var scene = b('scene');
                var onceElm = b('once').band([1, SCENE_DURATION / 6]).once();
                var childElm = b('child').band([0.5, 1]).once();
                scene.add(
                    b('wrapper').band([2.2, SCENE_DURATION / 2])
                                .add(onceElm.add(childElm))
                );

                var child_start = 2.2 + 1 + 0.5,
                    child_end   = 2.2 + 1 + 1;
                expectLocalTime(scene, childElm,
                    function(gtime) {
                        if (t_before(gtime, child_start) ||
                            t_after(gtime, child_end)) return false;
                        return gtime - child_start;
                    });
            });

            it("if child element has loop repeat mode", function() {
                var scene = b('scene');
                var onceElm = b('once').band([1, SCENE_DURATION / 6]).once();
                var childElm = b('child').band([0.5, 1]).loop();
                scene.add(
                    b('wrapper').band([2.2, SCENE_DURATION / 2])
                                .add(onceElm.add(childElm))
                );

                var once_end = 2.2 + (SCENE_DURATION / 6),
                    child_start = 2.2 + 1 + 0.5,
                    child_duration = 1 - 0.5;
                expectLocalTime(scene, childElm,
                    function(gtime) {
                        if (t_before(gtime, child_start) ||
                            t_after(gtime, once_end)) return false;
                        return (gtime - child_start) % child_duration;
                    });
            });

            it("if child element has restricted-loop repeat mode", function() {
                var scene = b('scene');
                var onceElm = b('once').band([1, SCENE_DURATION / 6]).once();
                var childElm = b('child').band([0.5, 1]).loop(3);
                scene.add(
                    b('wrapper').band([2.2, SCENE_DURATION / 2])
                                .add(onceElm.add(childElm))
                );

                var child_start = 2.2 + 1 + 0.5,
                    child_duration = 1 - 0.5,
                    loop_end = child_start + (child_duration * 3);
                expectLocalTime(scene, childElm,
                    function(gtime) {
                        if (t_before(gtime, child_start) ||
                            t_after(gtime, loop_end)) return false;
                        return (gtime - child_start) % child_duration;
                    });
            });

            it("if child element has bounce repeat mode", function() {
                var scene = b('scene');
                var onceElm = b('once').band([1, SCENE_DURATION / 6]).once();
                var childElm = b('child').band([0.5, 1]).bounce();
                scene.add(
                    b('wrapper').band([2.2, SCENE_DURATION / 2])
                                .add(onceElm.add(childElm))
                );

                var once_end = 2.2 + (SCENE_DURATION / 6),
                    child_start = 2.2 + 1 + 0.5,
                    child_duration = 1 - 0.5;
                expectLocalTime(scene, childElm,
                    function(gtime) {
                        var fits = Math.floor((gtime - child_start) / child_duration);
                        if (t_before(gtime, child_start) ||
                            t_after(gtime, once_end)) return false;
                        return ((fits % 2) === 0)
                               ? (gtime - child_start) % child_duration
                               : child_duration - ((gtime - child_start) % child_duration);
                    });
            });

            it("if child element has restricted-bounce repeat mode", function() {
                var scene = b('scene');
                var onceElm = b('once').band([1, SCENE_DURATION / 6]).once();
                var childElm = b('child').band([0.5, 1]).bounce(3);
                scene.add(
                    b('wrapper').band([2.2, SCENE_DURATION / 2])
                                .add(onceElm.add(childElm))
                );

                var child_start = 2.2 + 1 + 0.5,
                    child_duration = 1 - 0.5,
                    bounce_end = child_start + (child_duration * 3);
                expectLocalTime(scene, childElm,
                    function(gtime) {
                        var fits = Math.floor((gtime - child_start) / child_duration);
                        if (t_before(gtime, child_start) ||
                            t_after(gtime, bounce_end)) return false;
                        return ((fits % 2) === 0)
                               ? (gtime - child_start) % child_duration
                               : child_duration - ((gtime - child_start) % child_duration);
                    });
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
            scene.add(b('wrapper').band([0, SCENE_DURATION / 2])
                                  .add(stayElm));

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
            scene.add(b('wrapper').band([2.2, SCENE_DURATION / 2])
                                  .add(stayElm));

            expectLocalTime(scene, stayElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION / 2)) return false;
                    if (t_after(gtime, 2.2 + (SCENE_DURATION / 8)) &&
                        t_before_or_eq(gtime, SCENE_DURATION / 2)) return (SCENE_DURATION / 8) - 1;
                    return gtime - 3.2;
                });
        });

        it("animation stays inside of tinier element in complex bands structure", function() {
            var scene = b('scene');
            var stayElm = b('stay').band([1, SCENE_DURATION / 2]).stay();
            scene.add(b('wrapper').band([2.2, SCENE_DURATION / 8])
                                  .add(stayElm));

            expectLocalTime(scene, stayElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, (SCENE_DURATION / 8))) return false;
                    else return gtime - 3.2;
                });
        });

        describe("properly affects child element with its own mode", function() {

            it("if child element has once repeat mode and positioned in the middle of the parent", function() {
                var scene = b('scene');
                var stayElm = b('stay').band([1, SCENE_DURATION / 6]).stay();
                var childElm = b('child').band([0.5, 1]).once();
                scene.add(
                    b('wrapper').band([2.2, SCENE_DURATION / 2])
                                .add(stayElm.add(childElm))
                );

                var wrapper_end = SCENE_DURATION / 2,
                    child_start = 2.2 + 1 + 0.5,
                    child_end   = 2.2 + 1 + 1;
                expectLocalTime(scene, childElm,
                    function(gtime) {
                        if (t_before(gtime, child_start)) return false;
                        if (t_after(gtime, child_end)) return false;
                        return gtime - child_start;
                    });
            });

            it("if child element has once repeat mode and positioned in the end of the parent", function() {
                var scene = b('scene');
                var stayElm = b('stay').band([1, SCENE_DURATION / 6]).stay();
                var parent_duration = (SCENE_DURATION / 6) - 1,
                    loc_child_start = (parent_duration / 3) * 2,
                    loc_child_end = parent_duration /*!->*/ + 1;
                var childElm = b('child').band([ loc_child_start,
                                                 loc_child_end ]).once();
                scene.add(
                    b('wrapper').band([2.2, SCENE_DURATION / 2])
                                .add(stayElm.add(childElm))
                );

                var wrapper_end = SCENE_DURATION / 2,
                    parent_end  = 2.2 + (SCENE_DURATION / 6),
                    child_start = 2.2 + 1 + loc_child_start,
                    child_end   = 2.2 + 1 + loc_child_end,
                    child_duration = child_end - child_start;
                /*console.log('parent_duration', parent_duration,
                            'child_duration', child_duration);
                console.log('loc_child_start', loc_child_start,
                            'loc_child_end', loc_child_end);
                console.log('child_start', child_start,
                            'child_end', child_end);*/
                expect(child_duration).toEqual(loc_child_end - loc_child_start);
                expectLocalTime(scene, childElm,
                    function(gtime) {
                        if (t_before(gtime, child_start)
                            || t_after(gtime, wrapper_end)) return false;
                        if (t_after(gtime, parent_end)) return (child_duration /*!->*/ - 1);
                        return gtime - child_start;
                    });
            });

            /* it("if child element has loop repeat mode", function() {
                // FIXME: TODO
            });

            it("if child element has restricted-loop repeat mode", function() {
                // FIXME: TODO
            });

            it("if child element has bounce repeat mode", function() {
                // FIXME: TODO
            });

            it("if child element has restricted-bounce repeat mode", function() {
                // FIXME: TODO
            }); */

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
            scene.add(b('wrapper').band([0, SCENE_DURATION * (4 / 5)])
                                  .add(loopElm));

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

        it("animation loops properly inside of another element in complex bands structure - 2", function() {
            var scene = b('scene');
            var loopElm = b('loop').band([1, SCENE_DURATION * (1.5 / 5)]).loop();
            scene.add(b('wrapper').add(loopElm).band([2.2, SCENE_DURATION * (4 / 5)]));

            expectLocalTime(scene, loopElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                    return (gtime - 3.2) % ((SCENE_DURATION * (1.5 / 5)) - 1);
                });
        });

        it("animation loops properly inside of element tinier than one cycle and complex bands structure", function() {
            var scene = b('scene');
            var loopElm = b('loop').band([1, SCENE_DURATION * (2 / 5)]).loop();
            scene.add(b('wrapper').add(loopElm).band([2.2, SCENE_DURATION * (1 / 5)]));

            expectLocalTime(scene, loopElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION * (1 / 5))) return false;
                    return (gtime - 3.2) % ((SCENE_DURATION * (2 / 5)) - 1);
                });
        });

        /* describe("properly affects child element with its own mode", function() {
            // FIXME: TODO
        }); */

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

            it("animation loops specified number of times it has space to fit inside of another element in complex bands structure", function() {
                var scene = b('scene');
                var loopElm = b('loop').band([1, SCENE_DURATION / 8]).loop(11);
                scene.add(b('wrapper').add(loopElm).band([2.2, SCENE_DURATION * (4 / 5)]));

                expectLocalTime(scene, loopElm,
                    function(gtime) {
                        if (t_before(gtime, 3.2) ||
                            t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                        return (gtime - 3.2) % ((SCENE_DURATION / 8) - 1);
                    });
            });

            it("animation loops specified number of times inside of element tinier than one cycle and complex bands structure", function() {
                var scene = b('scene');
                var loopElm = b('loop').band([1, SCENE_DURATION * (2 / 5)]).loop(11);
                scene.add(b('wrapper').add(loopElm).band([2.2, SCENE_DURATION * (1 / 5)]));

                expectLocalTime(scene, loopElm,
                    function(gtime) {
                        if (t_before(gtime, 3.2) ||
                            t_after(gtime, SCENE_DURATION * (1 / 5))) return false;
                        return (gtime - 3.2) % ((SCENE_DURATION * (2 / 5)) - 1);
                    });
            });

            /* describe("properly affects child element with its own mode", function() {
                // FIXME: TODO
            }); */

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

        it("animation bounces properly inside of another element in complex bands structure - 2", function() {
            var scene = b('scene');
            var bounceElm = b('bounce').band([1, SCENE_DURATION * (1.5 / 5)]).bounce();
            scene.add(b('wrapper').add(bounceElm).band([2.2, SCENE_DURATION * (4 / 5)]));

            expectLocalTime(scene, bounceElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION * (4 / 5))) return false;
                    var durtn = (SCENE_DURATION * (1.5 / 5)) - 1;
                    var fits = Math.floor((gtime - 3.2) / durtn);
                    return ((fits % 2) === 0) ? ((gtime - 3.2) % durtn) : durtn - ((gtime - 3.2) % durtn);
                });
        });

        it("animation bounces properly inside of element tinier than one cycle and complex bands structure", function() {
            var scene = b('scene');
            var bounceElm = b('bounce').band([1, SCENE_DURATION * (2 / 5)]).bounce();
            scene.add(b('wrapper').add(bounceElm).band([2.2, SCENE_DURATION * (1 / 5)]));

            expectLocalTime(scene, bounceElm,
                function(gtime) {
                    if (t_before(gtime, 3.2) ||
                        t_after(gtime, SCENE_DURATION * (1 / 5))) return false;
                    var durtn = (SCENE_DURATION * (2 / 5)) - 1;
                    return (gtime - 3.2) % durtn;
                });
        });

        /* describe("properly affects child element with its own mode", function() {
            // FIXME: TODO
        }); */

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

            it("animation bounces specified number of times it has space to fit inside of another element in complex bands structure", function() {
                var scene = b('scene');
                var bounceElm = b('bounce').band([1, SCENE_DURATION / 8]).bounce(11);
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

            it("animation bounces specified number of times inside of element tinier than one cycle and complex bands structure", function() {
                var scene = b('scene');
                var bounceElm = b('bounce').band([1, SCENE_DURATION * (2 / 5)]).bounce(11);
                scene.add(b('wrapper').add(bounceElm).band([2.2, SCENE_DURATION * (1 / 5)]));

                expectLocalTime(scene, bounceElm,
                    function(gtime) {
                        if (t_before(gtime, 3.2) ||
                            t_after(gtime, SCENE_DURATION * (1 / 5))) return false;
                        var durtn = (SCENE_DURATION * (2 / 5)) - 1;
                        return (gtime - 3.2) % durtn;
                    });

            });

            /* describe("properly affects child element with its own mode", function() {
                // FIXME: TODO
            }); */

        });

    });

});