/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about modes,", function() {

    var player,
        C = anm.C;

    beforeEach(function() {
        this.addMatchers(_matchers);

        _mocks.canvas.__resetMock();
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fake(_Fake.CVS_POS);

        player = new anm.Player();
    });

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

        it("in preview mode (for the tool), the still-preview should not be shown", function() {
            var scene = new anm.Scene();
            scene.duration = 2.2;

            player.init('fake', { mode: C.M_PREVIEW }).load(scene);
            expect(drawAtSpy).not.toHaveBeenCalled();
            drawAtSpy.reset();

            player.play();
            expect(drawAtSpy).not.toHaveBeenCalled();
            player.stop();
        });

        it("in dynamic mode (for the games), the still-preview should also not be shown", function() {
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

            it("should be infinite in dynamic mode", function() {
                var scene = new anm.Scene();
                player.init('fake', { mode: C.M_DYNAMIC }).load(scene);
                expect(scene.duration).toBe(Number.MAX_VALUE);

                var elm = new anm.Element();
                elm.setBand([0, 12]);
                scene.add(elm);

                player.play();
                expect(scene.duration).toBe(Number.MAX_VALUE);
                expect(player.state.duration).toBe(Number.MAX_VALUE);
            });

            it("should be finite in video mode", function() {
                var scene = new anm.Scene();
                player.init('fake', { mode: C.M_VIDEO }).load(scene);
                expect(scene.duration).toBe(0);

                var elm = new anm.Element();
                elm.setBand([0, 12]);
                scene.add(elm);

                player.play();
                expect(scene.duration).toBe(12);
                expect(player.state.duration).toBe(12);
            });

            it("should be finite in preview mode", function() {
                var scene = new anm.Scene();
                player.init('fake', { mode: C.M_PREVIEW }).load(scene);
                expect(scene.duration).toBe(0);

                var elm = new anm.Element();
                elm.setBand([0, 12]);
                scene.add(elm);

                player.play();
                expect(scene.duration).toBe(12);
                expect(player.state.duration).toBe(12);
            });

        });

    });

    // TODO: test the same for remote scenes?
    // test modes where controls or info are separately switched
    // controls and info must be rendered and visible when required, check for scroll also
    // test several players to catch events simultaneously
    // drawing preview in several modes

});