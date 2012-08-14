describe("player, when speaking about", function() {

    var player;
    var P = anm.Player;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _addPlayerStaticSpies();
        player = new anm.Player();
    });

    it("should be stopped at start", function() {
        var stopSpy = spyOn(player, 'stop');
        player.init('test-id');
        expect(stopSpy).toHaveBeenCalled();
    });

    it("should not start playing just after initialization", function() {
        var playSpy = spyOn(player, 'play');
        player.init('test-id');
        expect(playSpy).not.toHaveBeenCalled();
    });

    it("should not pause just after initialization", function() {
        var pauseSpy = spyOn(player, 'pause');
        player.init('test-id');
        expect(pauseSpy).not.toHaveBeenCalled();
    });

    it("should show splash screen when initialized", function() {
        var splashSpy = spyOn(player, 'drawSplash');
        player.init('test-id');
        expect(splashSpy).toHaveBeenCalled();
    });

    it("should not draw anything except splash when intialized", function() {
        var drawAtSpy = spyOn(player, 'drawAt');
        player.init('test-id');
        expect(drawAtSpy).not.toHaveBeenCalled();
    });

    it("should have no scene when created", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
    });

    /*

    // FIXME: calls toThrow not inside of this context

    it("should prevent playing just after initialization", function() {
        //var playSpy = spyOn(player, 'play').andCallThrough();
        player.init('test-id');
        //expect(playSpy).toThrow(P.NO_SCENE_ERR);
        expect(player.play).toThrow(P.NO_SCENE_ERR);
    });

    it("should prevent pausing just after initialization", function() {
        var pauseSpy = spyOn(player, 'pause').andCallThrough();
        player.init('test-id');
        expect(pauseSpy).toThrow(P.NO_SCENE_ERR);
    });

    it("should prevent double-stopping just after initialization", function() {
        var stopSpy = spyOn(player, 'stop').andCallThrough();
        player.init('test-id');
        expect(stopSpy).toThrow(P.NO_SCENE_ERR);
    }); */

    it("playing time should be -1 when no scene loaded", function() {
        player.init('test-id');
        expect(P.NO_TIME).not.toEqual(0);
        expect(P.NO_TIME).not.toBeGreaterThan(0);
        expect(player.state.time).toEqual(P.NO_TIME);
    });

});