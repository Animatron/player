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
        _fakeCallsForCanvasRelatedStuff();

        player = createPlayer('test-id');
    });

    it("does not accepts empty scene to load", function() {
        try {
            player.load();
        } catch(e) {
            expect(e.message).toBe(anm.Player.NO_SCENE_PASSED_ERR);
        }
    });

    // load event to be fired
    // loading different types of objects
    // loading is impossible while playing
    // player.load("some://fake.url"); expect(player.state.happens).toBe(C.NOTHING);
    // duration
    // test remote loading

});