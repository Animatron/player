describe("player, when speaking about playing,", function() {

    var player;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();

        player = createPlayer('test-id');
    });

    it("should use no duration for an empty scene", function() {
        player.load(new anm.Scene());
        expect(player.state.duration).toEqual(0);
    });

    it("should not play empty scene", function() {
        var scene = new anm.Scene();
        var renderSpy = spyOn(scene, 'render');
        player.load(scene);
        expect(renderSpy).not.toHaveBeenCalled();
    });

    it("should use default duration for a scene with element", function() {
        var scene = new anm.Scene();
        scene.add(new anm.Element());
        player.load(scene);
        expect(player.state.duration).toBe(anm.Scene.DEFAULT_VIDEO_DURATION);
    });

    it("should draw stop-frame when scene loaded", function() {
        var stopSpy = spyOn(player, 'stop');
        var drawSpy = spyOn(player, 'drawAt');
        var scene = new anm.Scene();
        scene.add(new anm.Element());
        player.load(scene);
        expect(stopSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledWith(anm.Scene.DEFAULT_VIDEO_DURATION
                                           * anm.Player.PREVIEW_POS);
    });

    // playing events to be fired

});