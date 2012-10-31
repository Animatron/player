/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("regarding duration and bands in animations,", function() {

    var player;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fake(_Fake.CVS_POS);

        player = createPlayer('test-id');
    });

    describe("scene duration", function() {

        var scene;

        var expected_duration;

        beforeEach(function() {
            scene = new anm.Scene();
        });

        varyAll([

            { description: "in case of empty scene, duration will be zero,",
              prepare: function() { expected_duration = 0; } },

            { description: "in case of scene with no-band element, duration still will be zero",
              prepare: function() { scene.add(new anm.Element());
                                    expected_duration = 0; } },

            { description: "in case of scene with several no-band elements, duration still will be zero",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    expected_duration = 0; } },

            { description: "in case of scene with an element that has a simple band, duration with be equal to a band duration",
              prepare: function() { var elm = new anm.Element();
                                    elm.setBand([0, 5]);
                                    scene.add(elm);
                                    expected_duration = 5; } },

            { description: "in case of scene with an element that has a shifted band, duration with be equal to band start + band duration",
              prepare: function() { var elm = new anm.Element();
                                    elm.setBand([2, 15]);
                                    scene.add(elm);
                                    expected_duration = 17; } },

            { description: "in case of scene with some element that has a shifted band inside (set before adding), duration will be band start + band duration",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    inner.setBand([2, 17])
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    expected_duration = 19; } },

            { description: "in case of scene with some element that has a shifted band inside (set after adding), duration will be band start + band duration",
              prepare: function() { var root = new anm.Element();
                                    var inner = new anm.Element();
                                    root.add(new anm.Element());
                                    root.add(inner);
                                    inner.add(new anm.Element());
                                    scene.add(root);
                                    scene.add(new anm.Element());
                                    inner.setBand([2, 17])
                                    expected_duration = 19; } },

            { description: "in case of scene with several elements that has different bands, duration will be minimum-start + maximum-reachable root band",
              prepare: function() { var root1 = new anm.Element();
                                    var root2 = new anm.Element();
                                    var root3 = new anm.Element();
                                    var inner1 = new anm.Element();
                                    var inner2 = new anm.Element();
                                    var inner3 = new anm.Element();
                                    root1.setBand([1, 6]);
                                    root2.setBand([1, 5]);
                                    root2.add(inner1);
                                    inner1.setBand([2, 11]);
                                    inner3.setBand([0, 3]);
                                    scene.add(root1);
                                    scene.add(root2);
                                    scene.add(root3);
                                    root2.add(inner2);
                                    root2.add(inner3);
                                    root3.setBand([2, 7]);
                                    expected_duration = 9 /* root band maximum is 2 + 7, which is 9. */
                                                          /* [2, 11] is inside of [1, 6], so it should be cut to size; */ } },

            // TODO: test if element was live-added to a scene

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

        });

    });

    xdescribe("elements' bands", function() {

    });

    // FIXME: setting an element's band to [0, Number.MAX_VALUE] by default affects logic of relative modifier since their timing is
    //        based on band-relative calculations, but we also should allow user to live-change the band

});