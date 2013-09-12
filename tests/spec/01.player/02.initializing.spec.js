/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about initialization,", function() {

    var player;

    var FPS = 40, _fg;

    beforeEach(function() {
        this.addMatchers(_matchers.calls);

        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn().run(FPS);

        player = new anm.Player();
    });

    afterEach(function() { _fg.stop().destroy(); });

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
        var splashSpy = spyOn(player, '_drawSplash');
        player.init('test-id');
        expect(splashSpy).toHaveBeenCalled/*Once*/();
        // canvas may be resized or re-rendered several times,
        // so splash may be drawn several times also
        // for the moment first call is from forceRedraw when reconfiguring canvas at start
        // and second one when stopping player in postInit()
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
            expect(e.message).toBe(anm.Errors.P.NO_SCENE);
        }
    });

    it("should prevent pausing just after initialization", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        try {
            player.pause();
        } catch(e) {
            expect(e.message).toBe(anm.Errors.P.NO_SCENE);
        }
    });

    it("should prevent double-stopping just after initialization", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        try {
            player.stop();
        } catch(e) {
            expect(e.message).toBe(anm.Errors.P.NO_SCENE);
        }
    });

    it("playing time should be not defined when no scene loaded", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        expect(anm.Player.NO_TIME).not.toEqual(0);
        expect(anm.Player.NO_TIME).not.toBeGreaterThan(0);
        expect(player.state.time).toBe(anm.Player.NO_TIME);
    });

    it("duration should not be defined when no scene loaded", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        expect(player.state.duration).not.toBeDefined();
    });

    it("zoom should be 1 when no scene loaded", function() {
        player.init('test-id');
        expect(player.anim).toBe(null);
        expect(player.state.zoom).toBe(1);
    });

    it("player should throw errors by default", function() {
        var test = this;

        player.init('test-id');
        var scene = new anm.Scene();
        var elm = new anm.Element();
        elm.addModifier(function(t) {
            throw new Error('Boo');
        });
        scene.add(elm);

        try {
            doAsync(player, scene, {
                do: 'play', until: anm.C.STOPPED, timeout: 1,
                then: function() { test.fail('Should throw an error'); },
            });
        } catch(e) {
            expect(e.message).toEqual('Boo');
        }
    });

    xdescribe("configuration", function() {

    });

    // test if configuration (options) correctly applied (including modules?)
    // test configuration through data-attributes, including loop-mode
    // player.load("some://real.url?param1=val1&param2=val2"...) to load to options
    // ensure that canvas attributes has higher priority for player size and properly applied for different ratios
    // test that drawAt (scene preview) is only called for VIDEO mode
    // test createPlayer itself
    // test width and height behaviour
    // ensure checkMode is called once
    // test several player are correclty acting at one page
    // test canvas is always prepared in _init_ method, and calling new Player() is just constructor
    // test the order of applying options / preparing canvas / scene / showing controls / info blocks to look logical

});