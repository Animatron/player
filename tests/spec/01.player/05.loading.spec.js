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

});