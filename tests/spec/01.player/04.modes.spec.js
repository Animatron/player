/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about modes,", function() {

    var player,
        C = anm.C;

    var FPS = 20, _fg;

    beforeEach(function() {
        this.addMatchers(_matchers.calls);

        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn().run(FPS);

        player = new anm.Player();
    });

    afterEach(function() { _fg.stop().destroy(); });

    describe("controls/info block and subscribing events, especially", function() {

        var checkModeSpy,
            enableControlsSpy, disableControlsSpy,
            enableInfoSpy, disableInfoSpy,
            renderControlsSpy,
            subscribeDynamicsSpy,
            drawAtSpy;

        beforeEach(function() {
            checkModeSpy = spyOn(player, '_checkMode').andCallThrough();
            enableControlsSpy = spyOn(player, '_enableControls').andCallThrough();
            disableControlsSpy = spyOn(player, '_disableControls').andCallThrough();
            enableInfoSpy = spyOn(player, '_enableInfo').andCallThrough();
            disableInfoSpy = spyOn(player, '_disableInfo').andCallThrough();
            renderControlsSpy = spyOn(player, '_renderControlsAt').andCallThrough();
            subscribeDynamicsSpy = spyOn(player, '__subscribeDynamicEvents').andCallThrough();

        });

        it("should show controls and information by default", function() {
            player.init('fake');

            expect(player.mode).toBe(C.M_VIDEO);

            expect(checkModeSpy).toHaveBeenCalledOnce();
            expect(player.controls).toBeDefined();
            expect(player.info).toBeDefined();

            expect(enableControlsSpy).toHaveBeenCalledOnce();
            expect(disableControlsSpy).not.toHaveBeenCalled();
            expect(enableInfoSpy).toHaveBeenCalledOnce();
            expect(disableInfoSpy).not.toHaveBeenCalled();
            expect(renderControlsSpy).not.toHaveBeenCalled();

            var scene = new anm.Scene();
            scene.duration = 1;
            player.load(new anm.Scene());

            expect(renderControlsSpy).toHaveBeenCalledWith(0);
            renderControlsSpy.reset();

            player.play();

            expect(renderControlsSpy).toHaveBeenCalled();

            expect(subscribeDynamicsSpy).not.toHaveBeenCalled();

            player.stop();
        });

        it("should show controls and information in video mode", function() {
            player.init('fake', { mode: C.M_VIDEO });

            expect(player.mode).toBe(C.M_VIDEO);

            expect(checkModeSpy).toHaveBeenCalledOnce();
            expect(player.controls).toBeDefined();
            expect(player.info).toBeDefined();

            expect(enableControlsSpy).toHaveBeenCalledOnce();
            expect(disableControlsSpy).not.toHaveBeenCalled();
            expect(enableInfoSpy).toHaveBeenCalledOnce();
            expect(disableInfoSpy).not.toHaveBeenCalled();
            expect(renderControlsSpy).not.toHaveBeenCalled();

            player.load(new anm.Scene());

            expect(renderControlsSpy).toHaveBeenCalledWith(0);
            renderControlsSpy.reset();

            player.play();

            expect(renderControlsSpy).toHaveBeenCalled();

            expect(subscribeDynamicsSpy).not.toHaveBeenCalled();

            player.stop();
        });

        it("should not show controls and information in dynamic mode "+
           "and should subscribe to events", function() {

            player.init('fake', { mode: C.M_DYNAMIC });

            expect(player.mode).toBe(C.M_DYNAMIC);

            expect(checkModeSpy).toHaveBeenCalledOnce();
            expect(player.controls).toBe(null);
            expect(player.info).toBe(null);

            expect(enableControlsSpy).not.toHaveBeenCalled();
            expect(disableControlsSpy).not.toHaveBeenCalled(); // nothing to disable
            expect(enableInfoSpy).not.toHaveBeenCalled();
            expect(disableInfoSpy).not.toHaveBeenCalled();  // nothing to disable
            expect(renderControlsSpy).not.toHaveBeenCalled();

            expect(player.canvas.hasAttribute('tabindex')).toBeFalsy();
            expect(subscribeDynamicsSpy).not.toHaveBeenCalled();

            var scene = new anm.Scene();

            player.load(scene);

            expect(player.canvas.hasAttribute('tabindex')).toBeTruthy();
            expect(subscribeDynamicsSpy).toHaveBeenCalledWith(scene);

            expect(renderControlsSpy).not.toHaveBeenCalled();

            player.play();

            expect(renderControlsSpy).not.toHaveBeenCalled();

            player.stop();
        });

        it("should not show controls and information in preview mode, "+
           "but also not subscribe to events", function() {

            player.init('fake', { mode: C.M_PREVIEW });

            expect(player.mode).toBe(C.M_PREVIEW);

            expect(checkModeSpy).toHaveBeenCalledOnce();
            expect(player.controls).toBe(null);
            expect(player.info).toBe(null);

            expect(enableControlsSpy).not.toHaveBeenCalled();
            expect(disableControlsSpy).not.toHaveBeenCalled(); // nothing to disable
            expect(enableInfoSpy).not.toHaveBeenCalled();
            expect(disableInfoSpy).not.toHaveBeenCalled();  // nothing to disable
            expect(renderControlsSpy).not.toHaveBeenCalled();

            expect(player.canvas.hasAttribute('tabindex')).toBeFalsy();
            expect(subscribeDynamicsSpy).not.toHaveBeenCalled();

            var scene = new anm.Scene();

            player.load(scene);

            expect(player.canvas.hasAttribute('tabindex')).toBeFalsy();
            expect(subscribeDynamicsSpy).not.toHaveBeenCalled();

            expect(renderControlsSpy).not.toHaveBeenCalled();

            player.play();

            expect(renderControlsSpy).not.toHaveBeenCalled();

            player.stop();
        });

    });

    describe("drawing preview-still, especially", function() {

        beforeEach(function() {
            drawAtSpy = spyOn(player, 'drawAt').andCallThrough();
        });

        describe("in video mode (which is default), preview should be shown for different durations correctly:", function() {

            var _duration = -1;

            varyAll([ { description: "for scene with duration 0",
                        prepare: function() { _duration = 0; } },
                      { description: "for scene with duration 1.5",
                        prepare: function() { _duration = 1.5; } },
                      { description: "for scene with duration 3",
                        prepare: function() { _duration = 3; } },
                      { description: "for scene with duration 5.2",
                        prepare: function() { _duration = 5.2; } } ], function() {

                it("should be at correct position", function() {
                    var scene = new anm.Scene();
                    scene.duration = _duration;

                    player.init('fake').load(scene);
                    expect(drawAtSpy).toHaveBeenCalledWith(_duration * anm.Player.PREVIEW_POS);
                    drawAtSpy.reset();

                    player.play();
                    expect(drawAtSpy).not.toHaveBeenCalled();
                    player.stop();
                });

            });

        });

        it("in preview mode (for the tool), the still-preview should be shown", function() {
            var scene = new anm.Scene();
            scene.duration = 2.2;

            player.init('fake', { mode: C.M_PREVIEW }).load(scene);
            expect(drawAtSpy).toHaveBeenCalledWith(2.2 * anm.Player.PREVIEW_POS);
            drawAtSpy.reset();

            player.play();
            expect(drawAtSpy).not.toHaveBeenCalled();
            player.stop();
        });

        // TODO test that last frame is shown when finished playing for preview and video modes

        it("in dynamic mode (for the games), the still-preview should not be shown", function() {
            var scene = new anm.Scene();
            scene.duration = 3.7;

            player.init('fake', { mode: C.M_DYNAMIC }).load(scene);
            expect(drawAtSpy).not.toHaveBeenCalled();
            drawAtSpy.reset();

            player.play();
            expect(drawAtSpy).not.toHaveBeenCalled();
            player.stop();
        });

        describe("scene duration, according to the mode", function() {

            describe("in dynamic mode", function() {

                it("should be infinite if scene with element was loaded into a player", function() {
                    var scene = new anm.Scene();
                    player.init('fake', { mode: C.M_DYNAMIC });
                    expect(scene.duration).not.toBeDefined();

                    var elm = new anm.Element();
                    elm.setBand([0, 12]);
                    scene.add(elm);

                    player.load(scene);
                    expect(scene.duration).toBe(Infinity);
                    expect(player.state.duration).toBe(Infinity);
                    player.play();
                    expect(scene.duration).toBe(Infinity);
                    expect(player.state.duration).toBe(Infinity);
                    player.stop();
                });

                it("should stay inifinite if empty scene was added to a player", function() {
                    var scene = new anm.Scene();
                    player.init('fake', { mode: C.M_DYNAMIC }).load(scene);
                    expect(scene.duration).toBe(Infinity);

                    var elm = new anm.Element();
                    elm.setBand([0, 12]);
                    scene.add(elm);

                    player.play();
                    expect(scene.duration).toBe(Infinity);
                    expect(player.state.duration).toBe(Infinity);
                    player.stop();
                });

            });

            describe("in video mode", function() {

                it("should be default if scene with element was loaded into a player", function() {
                    var scene = new anm.Scene();
                    player.init('fake', { mode: C.M_VIDEO });
                    expect(scene.duration).not.toBeDefined();

                    var elm = new anm.Element();
                    elm.setBand([0, 12]);
                    scene.add(elm);

                    player.load(scene);
                    expect(scene.duration).toBe(anm.Scene.DEFAULT_LEN);
                    expect(player.state.duration).toBe(anm.Scene.DEFAULT_LEN);
                    player.play();
                    expect(scene.duration).toBe(anm.Scene.DEFAULT_LEN);
                    expect(player.state.duration).toBe(anm.Scene.DEFAULT_LEN);
                    player.stop();
                });

                it("should be 0 if empty scene was added to a player", function() {
                    var scene = new anm.Scene();
                    player.init('fake', { mode: C.M_VIDEO }).load(scene);
                    expect(scene.duration).toBe(0);

                    var elm = new anm.Element();
                    elm.setBand([0, 12]);
                    scene.add(elm);

                    player.play();
                    expect(scene.duration).toBe(0);
                    expect(player.state.duration).toBe(0);
                    player.stop();
                });

            });

            describe("in preview mode", function() {

                it("and be default if some element was added before loading scene into player", function() {
                    var scene = new anm.Scene();
                    player.init('fake', { mode: C.M_PREVIEW });
                    expect(scene.duration).not.toBeDefined();

                    var elm = new anm.Element();
                    elm.setBand([0, 12]);
                    scene.add(elm);

                    player.load(scene);
                    expect(scene.duration).toBe(anm.Scene.DEFAULT_LEN);
                    expect(player.state.duration).toBe(anm.Scene.DEFAULT_LEN);
                    player.play();
                    expect(scene.duration).toBe(anm.Scene.DEFAULT_LEN);
                    expect(player.state.duration).toBe(anm.Scene.DEFAULT_LEN);
                    player.stop();
                });

                it("should be 0 if empty scene was added to a player", function() {
                    var scene = new anm.Scene();
                    player.init('fake', { mode: C.M_PREVIEW }).load(scene);
                    expect(scene.duration).toBe(0);

                    var elm = new anm.Element();
                    elm.setBand([0, 12]);
                    scene.add(elm);

                    player.play();
                    expect(scene.duration).toBe(0);
                    expect(player.state.duration).toBe(0);
                    player.stop();
                });

            });

        });

    });

    // TODO: test the same for remote scenes?
    // test modes where controls or info are separately switched
    // controls and info must be rendered and visible when required, check for scroll also
    // test several players to catch events simultaneously
    // drawing preview in several modes

});