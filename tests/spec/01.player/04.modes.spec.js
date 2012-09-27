/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about modes,", function() {

    var player,
        C = anm.C;

    var checkModeSpy,
        enableControlsSpy, disableControlsSpy,
        enableInfoSpy, disableInfoSpy,
        renderControlsSpy,
        subscribeDynamicsSpy;

    beforeEach(function() {
        this.addMatchers(_matchers);

        _mocks.canvas.__resetMock();
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();

        player = new anm.Player();

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

    // test modes where controls or info are separately switched
    // controls and info must be rendered and visible when required, check for scroll also
    // test several players to catch events simultaneously
    // drawing preview in several modes

});