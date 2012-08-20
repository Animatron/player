describe("player, when speaking about initialization,", function() {

    var player;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();

        player = new anm.Player();
    });

    it("should be stopped at start", function() {
        var stopSpy = spyOn(player, 'stop');
        player.init('test-id');
        expect(stopSpy).toHaveBeenCalledOnce();
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
        expect(splashSpy).toHaveBeenCalledOnce();
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

    it("should prevent playing just after initialization", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        try {
            player.play();
        } catch(e) {
            expect(e.message).toBe(anm.Player.NO_SCENE_ERR);
        }
    });

    it("should prevent pausing just after initialization", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        try {
            player.pause();
        } catch(e) {
            expect(e.message).toBe(anm.Player.NO_SCENE_ERR);
        }
    });

    it("should prevent double-stopping just after initialization", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        try {
            player.stop();
        } catch(e) {
            expect(e.message).toBe(anm.Player.NO_SCENE_ERR);
        }
    });

    it("playing time should be not defined when no scene loaded", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        expect(anm.Player.NO_TIME).not.toEqual(0);
        expect(anm.Player.NO_TIME).not.toBeGreaterThan(0);
        expect(player.state.time).toBe(anm.Player.NO_TIME);
    });

    it("duration should be 0 when no scene loaded", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        expect(player.state.duration).toBe(0);
    });

    it("zoom should be 1 when no scene loaded", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        expect(player.state.zoom).toBe(1);
    });

    // test if configuration (options) correctly applied (including modules?)
    // test createPlayer itself
    // test width and height behaviour
    // ensure checkMode is called once
    // test several player are correclty acting at one page
    // test canvas is always prepared in _init_ method, and calling new Player() is just constructor
    // test the order of applying options / preparing canvas / scene / showing controls / info blocks to look logical
    // test configuration through data-attributes

});