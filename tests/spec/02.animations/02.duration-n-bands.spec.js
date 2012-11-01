/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("regarding duration and bands in animations,", function() {

    var player;

    var DEFAULT_VIDEO_DURATION = anm.Scene.DEFAULT_VIDEO_DURATION;
    var DEFAULT_ELEMENT_LENGTH = anm.Element.DEFAULT_LEN;
    var DEFAULT_ELEMENT_BAND = [ 0, DEFAULT_ELEMENT_LENGTH ];

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fake(_Fake.CVS_POS);

        player = createPlayer('test-id');
    });

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

    describe("element duration", function() {

        it("should be equal to default length if band is not specified", function() {
            var elm = new anm.Element();
            expect(elm.duration()).toBe(DEFAULT_ELEMENT_LENGTH);
        });

        it("should equal to actual duration if its band starts at zero", function() {
            var elm = new anm.Element();
            elm.setBand([0, 51]);
            expect(elm.duration()).toEqual(51);
        });

        it("should equal to actual duration if its band happens during time", function() {
            var elm = new anm.Element();
            elm.setBand([12, 73]);
            expect(elm.duration()).toEqual(61);
        });

        it("should equal to actual duration if its band starts below zero", function() {
            var elm = new anm.Element();
            elm.setBand([-23.5, 11.2]);
            expect(elm.duration()).toEqual(34.7);
        });

        it("should equal to actual duration if its band is totally placed below zero", function() {
            var elm = new anm.Element();
            elm.setBand([-20.1, -3]);
            expect(elm.duration()).toEqual(17.1);
        });

        it("should not depend on how deep is it inside of the structure", function() {
            var root = new anm.Element();
            var leaf = new anm.Element();
            var subleaf = new anm.Element();
            root.add(leaf);
            root.setBand([-20, 60]);
            leaf.setBand([8, 19]);
            leaf.add(subleaf);
            subleaf.setBand([-2, 4]);
            expect(subleaf.duration()).toBe(6);
        });

    });

    describe("elements' bands", function() {

        it("should set a band to a default band if element band wasn't set", function() {
            var elm = new anm.Element();
            expect(elm.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(elm.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
        });

        it("should set both gband and lband to an element", function() {
            var elm = new anm.Element();
            elm.setBand([3, 10]);
            expect(elm.xdata.lband).toEqual([3, 10]);
            expect(elm.xdata.gband).toEqual([3, 10]);
        });

        it("should not change the value of no-band of an element even when its child has a band", function() {
            var child = new anm.Element();
            child.setBand([1, 20]);
            var elm = new anm.Element();
            elm.add(child);
            expect(child.xdata.lband).toEqual([1, 20]);
            expect(child.xdata.gband).toEqual([1, 20]);
            expect(elm.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(elm.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
        });

        it("should not change the value of no-band of an element even when its child's band was changed after the actual adding fact", function() {
            var child = new anm.Element();
            var elm = new anm.Element();
            elm.add(child);
            child.setBand([2, 17]);
            expect(child.xdata.lband).toEqual([2, 17]);
            expect(child.xdata.gband).toEqual([2, 17]);
            expect(elm.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(elm.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
        });

        it("should correct the child global band to a parent band, if it has one", function() {
            var child = new anm.Element();
            var elm = new anm.Element();
            elm.setBand([2, 15]);
            child.setBand([3, 10]);
            elm.add(child);
            expect(child.xdata.lband).toEqual([3, 10]);
            expect(child.xdata.gband).toEqual([2+3, 2+10]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);
        });

        it("should correct the child global band to a parent band, if it has one, even if band was set after the actual adding fact", function() {
            var child = new anm.Element();
            var elm = new anm.Element();
            child.setBand([3, 10]);
            elm.add(child);
            elm.setBand([2, 15]);
            expect(child.xdata.lband).toEqual([3, 10]);
            expect(child.xdata.gband).toEqual([2+3, 2+10]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);
        });

        it("should not crop the child global band to a parent band, if child band exceeds the parent one", function() {
            // while rendering, element will not pass .fits() test if its parent band is narrower than its own band,
            // so it is ok to have a wider global band for it.

            // child band = parent start

            var child = new anm.Element();
            var elm = new anm.Element();
            elm.setBand([2, 15]);
            child.setBand([3, 30]);
            elm.add(child);
            expect(child.xdata.lband).toEqual([3, 30]);
            expect(child.xdata.gband).toEqual([2+3, 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            child = new anm.Element();
            elm = new anm.Element();
            elm.setBand([2, 15]);
            child.setBand([-5, 10]);
            elm.add(child);
            expect(child.xdata.lband).toEqual([-5, 10]);
            expect(child.xdata.gband).toEqual([2+(-5), 2+10]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            child = new anm.Element();
            elm = new anm.Element();
            elm.setBand([2, 15]);
            child.setBand([-5, 30]);
            elm.add(child);
            expect(child.xdata.lband).toEqual([-5, 30]);
            expect(child.xdata.gband).toEqual([2+(-5), 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            child = new anm.Element();
            elm = new anm.Element();
            elm.setBand([2, 15]);
            child.setBand([22, 30]);
            elm.add(child);
            expect(child.xdata.lband).toEqual([22, 30]);
            expect(child.xdata.gband).toEqual([2+22, 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            var grandchild = new anm.Element();
            child = new anm.Element();
            elm = new anm.Element();
            elm.setBand([2, 15]);
            child.setBand([22, 30]);
            grandchild.setBand([1, 53]);
            elm.add(child);
            child.add(grandchild);
            expect(grandchild.xdata.lband).toEqual([1, 53]);
            expect(grandchild.xdata.gband).toEqual([2+22+1, 2+22+53]);
            expect(child.xdata.lband).toEqual([22, 30]);
            expect(child.xdata.gband).toEqual([2+22, 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);
        });

        it("should not crop the child global band to a parent band, if child band exceeds the parent one, even if band was set after the actual adding fact", function() {
            // while rendering, element will not pass .fits() test if its parent band is narrower than its own band,
            // so it is ok to have a wider global band for it.

            var child = new anm.Element();
            var elm = new anm.Element();
            child.setBand([3, 30]);
            elm.add(child);
            elm.setBand([2, 15]);
            expect(child.xdata.lband).toEqual([3, 30]);
            expect(child.xdata.gband).toEqual([2+3, 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            child = new anm.Element();
            elm = new anm.Element();
            child.setBand([-5, 10]);
            elm.add(child);
            elm.setBand([2, 15]);
            expect(child.xdata.lband).toEqual([-5, 10]);
            expect(child.xdata.gband).toEqual([2+(-5), 2+10]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            child = new anm.Element();
            elm = new anm.Element();
            child.setBand([-5, 30]);
            elm.add(child);
            elm.setBand([2, 15]);
            expect(child.xdata.lband).toEqual([-5, 30]);
            expect(child.xdata.gband).toEqual([2+(-5), 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            child = new anm.Element();
            elm = new anm.Element();
            child.setBand([22, 30]);
            elm.add(child);
            elm.setBand([2, 15]);
            expect(child.xdata.lband).toEqual([22, 30]);
            expect(child.xdata.gband).toEqual([2+22, 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);

            var grandchild = new anm.Element();
            child = new anm.Element();
            elm = new anm.Element();
            elm.add(child);
            child.add(grandchild);
            elm.setBand([2, 15]);
            child.setBand([22, 30]);
            grandchild.setBand([1, 53]);
            expect(grandchild.xdata.lband).toEqual([1, 53]);
            expect(grandchild.xdata.gband).toEqual([2+22+1, 2+22+53]);
            expect(child.xdata.lband).toEqual([22, 30]);
            expect(child.xdata.gband).toEqual([2+22, 2+30]);
            expect(elm.xdata.lband).toEqual([2, 15]);
            expect(elm.xdata.gband).toEqual([2, 15]);
        });

        /* function expectInTree(tree, expectations) {
            function buildLeaves(data) {
                var leaves = [];
                _each(data, function(value) {
                    if (!__array(value) || __num(value)) {
                        var elm = new anm.Element();
                        if (value) elm.setBand(value);
                        leaves.push(elm);
                    } else {
                        leaves.push(buildLeaves(value));
                    }
                });
                return leaves;
            }

            var builtTree = buildLeaves(tree);

            _each(expectations, function(expectation) {
                var coord =
            });
        } */

        it("should set a band to default band if no element in a complex structure has a band set", function() {
            var elms = [];

            var root = new anm.Element(); elms.push(root);
            var leaf1 = new anm.Element(); elms.push(leaf1);
            var leaf2 = new anm.Element(); elms.push(leaf2);
            var leaf3 = new anm.Element(); elms.push(leaf3);
            var subleaf1 = new anm.Element(); elms.push(subleaf1);
            var subleaf2 = new anm.Element(); elms.push(subleaf2);
            var subleaf3 = new anm.Element(); elms.push(subleaf3);

            leaf2.add(subleaf1);
            leaf2.add(subleaf2);
            leaf3.add(subleaf3);
            root.add(leaf1);
            root.add(leaf2);
            root.add(leaf3);

            _each(elms, function(elm) {
                expect(elm.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
                expect(elm.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
            });

        });

        it("should keep global band of a parent element empty if band is set to one of its children", function() {
            var root = new anm.Element();
            var leaf1 = new anm.Element();
            var leaf2 = new anm.Element();
            var leaf3 = new anm.Element();
            var subleaf1 = new anm.Element();
            var subleaf2 = new anm.Element();
            var subleaf3 = new anm.Element();

            leaf1.add(subleaf1);
            leaf2.add(subleaf2);
            leaf2.add(subleaf3);
            root.add(leaf1);
            root.add(leaf2);
            root.add(leaf3);

            subleaf3.setBand([2, 7]);

            expect(leaf1.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf1.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf2.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf2.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf3.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf3.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);

            expect(root.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(root.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
        });

        it("if parent already has a band, it should correct the local band of a child to its band, but granparent's band should stay default", function() {
            var root = new anm.Element();
            var leaf1 = new anm.Element();
            var leaf2 = new anm.Element();
            var leaf3 = new anm.Element();
            var subleaf1 = new anm.Element();
            var subleaf2 = new anm.Element();
            var subleaf3 = new anm.Element();

            leaf1.add(subleaf1);
            leaf2.add(subleaf2);
            leaf2.add(subleaf3);
            root.add(leaf1);
            root.add(leaf2);
            root.add(leaf3);

            leaf2.setBand([3, 15]);
            subleaf3.setBand([2, 7]);

            expect(root.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(root.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf1.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf1.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf3.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf3.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);

            expect(subleaf3.xdata.lband).toEqual([2, 7]);
            expect(subleaf3.xdata.gband).toEqual([DEFAULT_ELEMENT_BAND[0]+3+2,
                                                  DEFAULT_ELEMENT_BAND[0]+3+7]);
        });

        it("if grand-parent already has a band, it should also correct the local band both of a child and grand-child", function() {
            var root = new anm.Element();
            var leaf1 = new anm.Element();
            var leaf2 = new anm.Element();
            var leaf3 = new anm.Element();
            var subleaf1 = new anm.Element();
            var subleaf2 = new anm.Element();
            var subleaf3 = new anm.Element();

            leaf1.add(subleaf1);
            leaf2.add(subleaf2);
            leaf2.add(subleaf3);
            root.add(leaf1);
            root.add(leaf2);
            root.add(leaf3);

            leaf2.setBand([3, 14]);
            subleaf3.setBand([2, 7]);
            root.setBand([2, 20]);

            expect(leaf1.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf1.xdata.gband).toEqual([2+DEFAULT_ELEMENT_BAND[0],
                                               2+DEFAULT_ELEMENT_BAND[1]]);
            expect(leaf3.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf3.xdata.gband).toEqual([2+DEFAULT_ELEMENT_BAND[0],
                                               2+DEFAULT_ELEMENT_BAND[1]]);

            expect(root.xdata.lband).toEqual([2, 20]);
            expect(root.xdata.gband).toEqual([2, 20]);
            expect(leaf2.xdata.lband).toEqual([3, 14]);
            expect(leaf2.xdata.gband).toEqual([2+3, 2+14]);
            expect(subleaf3.xdata.lband).toEqual([2, 7]);
            expect(subleaf3.xdata.gband).toEqual([2+3+2, 2+3+7]);
        });

        it("if there are several children, their band should also be aligned to a parent", function() {
            var root = new anm.Element();
            var leaf1 = new anm.Element();
            var leaf2 = new anm.Element();
            var leaf3 = new anm.Element();
            var subleaf1 = new anm.Element();
            var subleaf2 = new anm.Element();
            var subleaf3 = new anm.Element();

            leaf1.add(subleaf1);
            leaf2.add(subleaf2);
            leaf2.add(subleaf3);
            root.add(leaf1);
            root.add(leaf2);
            root.add(leaf3);

            leaf2.setBand([1, 22]);
            subleaf2.setBand([3, 12]);
            subleaf3.setBand([2, 7]);

            expect(leaf1.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf1.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf3.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf3.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(root.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(root.xdata.gband).toEqual(DEFAULT_ELEMENT_BAND);

            expect(subleaf2.xdata.lband).toEqual([3, 12]);
            expect(subleaf2.xdata.gband).toEqual([DEFAULT_ELEMENT_BAND[0]+1+3,
                                                  DEFAULT_ELEMENT_BAND[0]+1+12]);
            expect(subleaf3.xdata.lband).toEqual([2, 7]);
            expect(subleaf3.xdata.gband).toEqual([DEFAULT_ELEMENT_BAND[0]+1+2,
                                                  DEFAULT_ELEMENT_BAND[0]+1+7]);

            //subleaf2.setBand([3, 12]);
            //subleaf3.setBand([2, 7]);
            leaf2.setBand([4, 11]);

            expect(subleaf2.xdata.lband).toEqual([3, 12]);
            expect(subleaf2.xdata.gband).toEqual([DEFAULT_ELEMENT_BAND[0]+4+3,
                                                  DEFAULT_ELEMENT_BAND[0]+4+12]);
            expect(subleaf3.xdata.lband).toEqual([2, 7]);
            expect(subleaf3.xdata.gband).toEqual([DEFAULT_ELEMENT_BAND[0]+4+2,
                                                  DEFAULT_ELEMENT_BAND[0]+4+7]);
        });

        it("should catch the changes of a parent band and change child band accordingly", function() {
            var child = new anm.Element();
            var elm = new anm.Element();
            child.setBand([2, 15]);
            elm.add(child);
            elm.setBand([2, 19]);
            expect(child.xdata.lband).toEqual([2, 15]);
            expect(child.xdata.gband).toEqual([2+2, 2+15]);
            expect(elm.xdata.lband).toEqual([2, 19]);
            expect(elm.xdata.gband).toEqual([2, 19]);
            elm.setBand([3, 17]);
            expect(child.xdata.lband).toEqual([2, 15]);
            expect(child.xdata.gband).toEqual([3+2, 3+15]);
            elm.setBand([7, 100]);
            expect(child.xdata.lband).toEqual([2, 15]);
            expect(child.xdata.gband).toEqual([7+2, 7+15]);
            child.setBand([4, 12]);
            expect(child.xdata.lband).toEqual([4, 12]);
            expect(child.xdata.gband).toEqual([7+4, 7+12]);
            elm.setBand([6, 19]);
            expect(child.xdata.lband).toEqual([4, 12]);
            expect(child.xdata.gband).toEqual([6+4, 6+12]);
        });

        it("should catch the changes of a grand-parent band and change grand-child band accordingly", function() {
            var subleaf = new anm.Element();
            var leaf = new anm.Element();
            var root = new anm.Element();
            subleaf.setBand([1, 3]);
            leaf.add(subleaf);
            root.add(leaf);
            root.setBand([2, 10]);
            leaf.setBand([0, 5]);
            expect(root.xdata.lband).toEqual([2, 10]);
            expect(root.xdata.gband).toEqual([2, 10]);
            expect(leaf.xdata.lband).toEqual([0, 5]);
            expect(leaf.xdata.gband).toEqual([2+0, 2+5]);
            expect(subleaf.xdata.lband).toEqual([1, 3]);
            expect(subleaf.xdata.gband).toEqual([2+0+1, 2+0+3]);
            root.setBand([1, 9]);
            expect(leaf.xdata.lband).toEqual([0, 5]);
            expect(leaf.xdata.gband).toEqual([1+0, 1+5]);
            expect(subleaf.xdata.lband).toEqual([1, 3]);
            expect(subleaf.xdata.gband).toEqual([1+0+1, 1+0+3]);
            root.setBand([-2, 6]);
            expect(leaf.xdata.lband).toEqual([0, 5]);
            expect(leaf.xdata.gband).toEqual([(-2)+0, (-2)+5]);
            expect(subleaf.xdata.lband).toEqual([1, 3]);
            expect(subleaf.xdata.gband).toEqual([(-2)+0+1, (-2)+0+3]);
            leaf.setBand([-3, 12]);
            expect(leaf.xdata.lband).toEqual([-3, 12]);
            expect(leaf.xdata.gband).toEqual([(-2)+(-3), (-2)+12]);
            expect(subleaf.xdata.lband).toEqual([1, 3]);
            expect(subleaf.xdata.gband).toEqual([(-2)+(-3)+1, (-2)+(-3)+3]);
        });

        it("if parent element has default band, it still should align a band of a child", function() {
            var subleaf = new anm.Element();
            var leaf = new anm.Element();
            var root = new anm.Element();
            subleaf.setBand([1, 3]);
            leaf.add(subleaf);
            root.add(leaf);
            root.setBand([2, 10]);
            expect(root.xdata.lband).toEqual([2, 10]);
            expect(root.xdata.gband).toEqual([2, 10]);
            expect(leaf.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf.xdata.gband).toEqual([2+DEFAULT_ELEMENT_BAND[0],
                                              2+DEFAULT_ELEMENT_BAND[1]]);
            expect(subleaf.xdata.lband).toEqual([1, 3]);
            expect(subleaf.xdata.gband).toEqual([2+DEFAULT_ELEMENT_BAND[0]+1,
                                                 2+DEFAULT_ELEMENT_BAND[0]+3]);
            root.setBand([1, 9]);
            expect(leaf.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf.xdata.gband).toEqual([1+DEFAULT_ELEMENT_BAND[0],
                                              1+DEFAULT_ELEMENT_BAND[1]]);
            expect(subleaf.xdata.lband).toEqual([1, 3]);
            expect(subleaf.xdata.gband).toEqual([1+DEFAULT_ELEMENT_BAND[0]+1,
                                                 1+DEFAULT_ELEMENT_BAND[0]+3]);
            root.setBand([-2, 6]);
            expect(leaf.xdata.lband).toEqual(DEFAULT_ELEMENT_BAND);
            expect(leaf.xdata.gband).toEqual([(-2)+DEFAULT_ELEMENT_BAND[0],
                                              (-2)+DEFAULT_ELEMENT_BAND[1]]);
            expect(subleaf.xdata.lband).toEqual([1, 3]);
            expect(subleaf.xdata.gband).toEqual([(-2)+DEFAULT_ELEMENT_BAND[0]+1,
                                                 (-2)+DEFAULT_ELEMENT_BAND[0]+3]);
        });

    });

    // FIXME: setting an element's band to [0, Number.MAX_VALUE] by default affects logic of relative modifier since their timing is
    //        based on band-relative calculations, but we also should allow user to live-change the band

});