/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about playing,", function() {

    var player,
        C = anm.C;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();

        player = createPlayer('test-id');
    });

    it("should not play anything just after loading a scene", function() {
        var playSpy = spyOn(player, 'play');
        player.load(new anm.Scene());
        expect(playSpy).not.toHaveBeenCalled();
    });

    it("should use no duration for an empty scene", function() {
        player.load(new anm.Scene());
        expect(player.state.duration).toEqual(0);
    });

    it("should use default duration for a scene with element", function() {
        var scene = new anm.Scene();
        scene.add(new anm.Element());
        player.load(scene);
        expect(player.state.duration).toBe(anm.Scene.DEFAULT_VIDEO_DURATION);
    });

    it("should try to draw stop-frame of an empty scene at 0, " +
       "when it will be loaded into player", function() {
        var drawSpy = spyOn(player, 'drawAt').andCallThrough();

        var scene = new anm.Scene();
        var renderSpy = spyOn(scene, 'render').andCallThrough();

        player.load(scene);

        expect(drawSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledWith(0);
        expect(renderSpy).toHaveBeenCalled();
    });

    it("should draw stop-frame at preview position when scene loaded", function() {
        var stopSpy = spyOn(player, 'stop').andCallThrough();
        var drawSpy = spyOn(player, 'drawAt').andCallThrough();

        var scene = new anm.Scene();
        scene.add(new anm.Element());
        player.load(scene);

        expect(stopSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledOnce();
        // P.S. draws at PREVIEW_POS only in C.M_VIDEO mode
        expect(drawSpy).toHaveBeenCalledWith(anm.Scene.DEFAULT_VIDEO_DURATION
                                           * anm.Player.PREVIEW_POS);
    });

    it("should keep player.anim to point to current scene", function() {
        var scene = new anm.Scene();
        player.load(scene);
        expect(player.anim).toBe(scene);

        var anotherScene = new anm.Scene();
        anotherScene.add(new anm.Element());
        player.load(anotherScene);
        expect(player.anim).toBe(anotherScene);

        player.load(scene);
        expect(player.anim).toBe(scene);

        try { player.load(null); } catch(e) {};
        expect(player.anim).toBe(null);
    });

    describe("should keep its state conforming to the situation, so", function() {

        it("should have state.happens equal to nothing, if no scene loaded", function() {
            expect(player.state.happens).toBe(C.NOTHING);
        });

        it("should have state.happens equal to stopped, if scene loaded, but not played", function() {
            expect(player.state.happens).toBe(C.NOTHING);
            player.load(new anm.Scene());
            expect(player.state.happens).toBe(C.STOPPED);
        });

        it("should have state.happens equal to nothing, if no scene passed to load", function() {
            expect(player.state.happens).toBe(C.NOTHING);
            player.load(new anm.Scene());
            expect(player.state.happens).toBe(C.STOPPED);
            try { player.load(null); } catch(e) {};
            expect(player.anim).toBe(null);
            expect(player.state.happens).toBe(C.NOTHING);
        });

        it("should have state.happens equal to playing, if started playing", function() {
            var scene = new anm.Scene();
            scene.add(new anm.Element());
            player.load(scene);
            expect(player.anim).not.toBe(null);
            player.play();
            expect(player.state.happens).toBe(C.PLAYING);
            player.stop();
            player.play(2);
            expect(player.state.happens).toBe(C.PLAYING);
        });

        it("should have state.happens equal to stopped, " +
           "if requested time exceeds scene duration when asking to play", function() {
            player.load(new anm.Scene());
            expect(player.anim).not.toBe(null);
            player.play();
            expect(player.state.happens).toBe(C.PLAYING);
            player.stop();
            player.play(2);
            expect(player.state.happens).toBe(C.STOPPED);
        });

        it("should have state.happens equal to stopped, if started playing and then stopped", function() {
            player.load(new anm.Scene());
            player.play();
            player.stop();
            expect(player.state.happens).toBe(C.STOPPED);
        });

        it("should have state.happens equal to paused, if started playing and then paused", function() {
            player.load(new anm.Scene());
            player.play();
            player.pause();
            expect(player.state.happens).toBe(C.PAUSED);
            player.stop();
            player.play();
            player.pause();
            expect(player.state.happens).toBe(C.PAUSED);
        });

    });

    it("should not allow to pause when stopped", function() {
        player.load(new anm.Scene());
        player.play();
        player.stop();
        expect(player.state.happens).toBe(C.STOPPED);
        try {
            player.pause();
        } catch(e) {
            expect(e.message).toBe(anm.Player.PAUSING_WHEN_STOPPED_ERR);
        }
    });

    it("should pause at a time where pause was called", function() {
        runs(function() {
            var scene = new anm.Scene();
            scene.add(new anm.Element());
            player.load(scene);

            player.play();

            setTimeout(function() {
                player.pause();
            }, 600);
        });

        waitsFor(function() {
            return player.state.happens === C.PAUSED;
        }, 1000);

        // FIXME: fails if tab is not active, possibly
        //        because requestAnimationFrame is disabled
        //        when tab is in background, replace it with fake
        runs(function() {
            expect(player.state.happens).toBe(C.PAUSED);
            expect(player.state.time).toBeCloseTo(0.6, 0.2);
        });
    });

    // player should be stopped when finished playing scene (or paused or repeat, if defined in options)
    // playing events to be fired
    // draw loading splash while loading
    // test if while preview is shown at preview time pos, controls are at 0
    // state.from
    // errors

});