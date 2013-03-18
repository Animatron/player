/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about loading scenes,", function() {

    var player;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        player = createPlayer('test-id');
    });

    it("does not accepts empty scene to load", function() {
        try {
            player.load();
        } catch(e) {
            expect(e.message).toBe(anm.Errors.P.NO_SCENE_PASSED);
        }
    });

    it("duration should be not defined when no scene loaded", function() {
        expect(player.anim).toBeNull();
        expect(player.state.duration).not.toBeDefined();
    });

    it("should use default scene duration even if elements inside has narrower bands", function() {
        var duration = 1.27;

        var scene = new anm.Scene();
        var elem = new anm.Element();
        elem.setBand([0, duration]);
        scene.add(elem);

        expect(scene.duration).not.toBeDefined();

        player.load(scene);

        expect(player.state.duration).toBe(anm.Scene.DEFAULT_LEN);

        // TODO: test with different durations, while playing, and with different children
    });

    describe("loading with importer", function() {

        // TODO:

    });

    describe("setting duration with load method", function() {

        it("should set a duration to a scene if it was passed to load method", function() {
            var duration = 1.27;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            scene.add(elem);

            expect(scene.duration).not.toBeDefined();

            player.load(scene, duration);

            expect(scene.duration).toBe(duration);
            expect(player.state.duration).toBe(duration);
        });

        it("should also set a duration to a scene if it was passed to load method with importer", function() {
            var duration = 1.27;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            scene.add(elem);

            expect(scene.duration).not.toBeDefined();

            player.load(scene, duration, _mocks.factory.importer());

            expect(scene.duration).toBe(duration);
            expect(player.state.duration).toBe(duration);
        });

    });

    // load event to be fired
    // loading different types of objects
    // loading is impossible while playing
    // draw loading splash while loading
    // player.load("some://real.url?param1=val1&param2=val2"...) to load to options
    // player.load("some://fake.url"); expect(player.state.happens).toBe(C.NOTHING);
    // test async callback to be called
    // scene width and height should be equal to canvas width/height
    // duration
    // test remote loading
    // test that one element may be re-used in other players/scenes

});