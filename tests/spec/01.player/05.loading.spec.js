/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about loading scenes,", function() {

    var player;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
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

    it("duration should be 0 when no scene loaded", function() {
        expect(player.anim).toBe(null);
        expect(player.state.duration).toBe(0);
    });

    it("should use duration that fits narrowest band of elements", function() {
        var duration = 1.27;

        var scene = new anm.Scene();
        var elem = new anm.Element();
        elem.setBand([0, duration]);
        scene.add(elem);

        expect(scene.duration).toBe(duration);

        player.load(scene);

        expect(player.state.duration).toBe(duration);

        // TODO: test with different durations, while playing, and with different children
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