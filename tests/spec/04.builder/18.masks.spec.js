/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("builder, regarding masks", function() {

    var player,
        C = anm.C;

    var b = Builder._$,
        B = Builder;

    var FPS = 20, _fg;

    var mainCanvas;

    var SCENE_WIDTH = 350;
    var SCENE_HEIGHT = 275;

    beforeEach(function() {
        this.addMatchers(_matchers.size);
        this.addMatchers(_matchers.calls);

        mainCanvas = _mocks.factory.canvas();

        spyOn(document, 'getElementById').andReturn(mainCanvas);
        _fake(_Fake.CVS_POS);

        mainCanvas.setAttribute('width',  SCENE_WIDTH);
        mainCanvas.setAttribute('height', SCENE_HEIGHT);

        _fg = _FrameGen.spawn().run(FPS);

        player = createPlayer('test-id');
    });

    afterEach(function() { _fg.stop().destroy(); });

    it("mask drawing sequence should be right", function() {

        //var saveSpy = spyOn(_mocks.context2d, 'save');
        //var restoreSpy = spyOn(_mocks.context2d, 'restore');

        var maskCanvas = _mocks.factory.canvas();
        var maskContext = maskCanvas.getContext('2d');

        var backCanvas = _mocks.factory.canvas();
        var backContext = backCanvas.getContext('2d');

        var mainContext = mainCanvas.getContext('2d');

        expect(maskContext).not.toBe(mainContext);
        expect(maskContext).not.toBe(backContext);
        expect(backContext).not.toBe(mainContext);

        var maskCanvasWasCreated = false;
        var backCanvasWasCreated = false;

        var maskCanvasWasRemoved = false;
        var backCanvasWasRemoved = false;

        var creatingCanvasesWasCalledBefore = false;

        var firstPass = true;

        var prevCreateElement = document.createElement;
        var createElementSpy = spyOn(document, 'createElement').andCallFake(function(elmType) {
            expect(elmType).toEqual('canvas');
            if (!maskCanvasWasCreated || maskCanvasWasRemoved) {
                maskCanvasWasCreated = true;
                maskCanvasWasRemoved = false;
                return maskCanvas; }
            if (!backCanvasWasCreated || backCanvasWasRemoved) {
                backCanvasWasCreated = true;
                backCanvasWasRemoved = false;
                return backCanvas; }
            //return _mocks.factory.element();
        });
        spyOn(player, 'drawAt').andCallFake(_mocks.nop); // it messes with tests while not required for them

        var mainCtxDrawImageSpy = spyOn(mainContext, 'drawImage').andCallThrough();
        var backCtxDrawImageSpy = spyOn(backContext, 'drawImage').andCallThrough();

        var elemPaintSpy = jasmine.createSpy('elem-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(mainContext);
            expect(mainContext.globalCompositeOperation).toEqual('source-over');

            expect(maskPaintSpy).not.toHaveBeenCalled();
            expect(maskedPaintSpy).not.toHaveBeenCalled();
            if (!firstPass) expect(elem2PaintSpy).toHaveBeenCalled();
            elem2PaintSpy.reset();

            expect(createElementSpy).not.toHaveBeenCalled();
            expect(mainCtxDrawImageSpy).not.toHaveBeenCalled();
            expect(backCtxDrawImageSpy).not.toHaveBeenCalled();
        });

        var maskedPaintSpy = jasmine.createSpy('masked-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(backContext);

            expect(maskedTransformSpy).toHaveBeenCalled();
            expect(maskedTransformSpy).toHaveBeenCalledWith(backContext);

            /*expect(maskedDrawSpy).toHaveBeenCalled();
            expect(maskedDrawSpy).toHaveBeenCalledWith(backContext);*/

            // TODO: expect backCtx.clearRect to be called

            expect(maskCanvasWasCreated).toBeTruthy();
            expect(backCanvasWasCreated).toBeTruthy();

            if (!creatingCanvasesWasCalledBefore) {
                expect(createElementSpy).toHaveBeenCalled();
                expect(createElementSpy.callCount).toBe(2);
                createElementSpy.reset();
                creatingCanvasesWasCalledBefore = true;
            } else expect(createElementSpy).not.toHaveBeenCalled();

            expect(masked.v.__mask).toBe(mask.v);
            expect(masked.v.__backCvs).toBe(backCanvas);
            expect(masked.v.__backCtx).toBe(backContext);
            expect(masked.v.__maskCvs).toBe(maskCanvas);
            expect(masked.v.__maskCtx).toBe(maskContext);

            expect(maskCanvas.getAttribute('width')).toEqual(SCENE_WIDTH * 2);
            expect(maskCanvas.getAttribute('height')).toEqual(SCENE_HEIGHT * 2);
            expect(backCanvas.getAttribute('width')).toEqual(SCENE_WIDTH * 2);
            expect(backCanvas.getAttribute('height')).toEqual(SCENE_HEIGHT * 2);

            expect(mainContext.globalCompositeOperation).toEqual('source-over');
            expect(maskContext.globalCompositeOperation).toEqual('source-over');
            expect(backContext.globalCompositeOperation).toEqual('source-over');

            // TODO: ensure masked children were rendered

            expect(maskPaintSpy).not.toHaveBeenCalled();
            expect(elemPaintSpy).toHaveBeenCalledOnce();
            expect(elemPaintSpy).toHaveBeenCalledWith(mainContext, undefined);
            elemPaintSpy.reset();
            expect(elem2PaintSpy).not.toHaveBeenCalled();

            expect(mainCtxDrawImageSpy).not.toHaveBeenCalled();
            expect(backCtxDrawImageSpy).not.toHaveBeenCalled();
        });

        var maskPaintSpy = jasmine.createSpy('mask-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(maskContext);

            expect(mainContext.globalCompositeOperation).toEqual('source-over');
            expect(maskContext.globalCompositeOperation).toEqual('source-over');
            expect(backContext.globalCompositeOperation).toEqual('destination-in');

            expect(maskedPaintSpy).toHaveBeenCalledOnce();
            expect(maskedPaintSpy).toHaveBeenCalledWith(backContext, undefined);
            maskedPaintSpy.reset();

            expect(createElementSpy).not.toHaveBeenCalled();
            expect(elemPaintSpy).not.toHaveBeenCalled();
            expect(elem2PaintSpy).not.toHaveBeenCalled();
            elem2PaintSpy.reset();

            expect(mainCtxDrawImageSpy).not.toHaveBeenCalled();
            expect(backCtxDrawImageSpy).not.toHaveBeenCalled();
        });

        var elem2PaintSpy = jasmine.createSpy('elem2-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(mainContext);
            expect(mainContext.globalCompositeOperation).toEqual('source-over');
            expect(maskContext.globalCompositeOperation).toEqual('source-over');
            expect(backContext.globalCompositeOperation).toEqual('source-over');

            expect(createElementSpy).not.toHaveBeenCalled();
            expect(elemPaintSpy).not.toHaveBeenCalled();
            expect(maskedPaintSpy).not.toHaveBeenCalled();
            expect(maskPaintSpy).toHaveBeenCalledOnce();
            expect(maskPaintSpy).toHaveBeenCalledWith(maskContext, undefined);
            maskPaintSpy.reset();

            expect(mainCtxDrawImageSpy).toHaveBeenCalledOnce();
            expect(backCtxDrawImageSpy).toHaveBeenCalledOnce();
            // TODO: ensure backCtxDrawImageSpy was called before mainCtxDrawImageSpy
            expect(backCtxDrawImageSpy).toHaveBeenCalledWith(maskCanvas, 0, 0, SCENE_WIDTH * 2, SCENE_HEIGHT * 2);
            expect(mainCtxDrawImageSpy).toHaveBeenCalledWith(backCanvas, -SCENE_WIDTH, -SCENE_HEIGHT, SCENE_WIDTH * 2, SCENE_HEIGHT * 2);

            mainCtxDrawImageSpy.reset();
            backCtxDrawImageSpy.reset();

            expect(backCanvasWasRemoved).toBeFalsy();
            expect(maskCanvasWasRemoved).toBeFalsy();

            if (firstPass) firstPass = false;
        });

        var scene = b().band([0, .5]);
        var elem = b().paint(elemPaintSpy);
        var masked = b().paint(maskedPaintSpy);
        var mask = b().paint(maskPaintSpy);
        var elem2 = b().paint(elem2PaintSpy);

        var maskedTransformSpy = spyOn(masked.v, 'transform').andCallThrough();
        var maskedDrawSpy = spyOn(masked.v, 'draw').andCallThrough();
        var removeCanvasesSpy = spyOn(masked.v, '__removeMaskCanvases').andCallFake(function() {
            expect(this).toBe(masked.v);
            if (this.__maskCvs) { this.__maskCvs = null;
                                  creatingCanvasesWasCalledBefore = false;
                                  maskCanvasWasRemoved = true; }
            if (this.__backCvs) { this.__backCvs = null;
                                  creatingCanvasesWasCalledBefore = false;
                                  backCanvasWasRemoved = true; }
        });
        //.andCallFake(_mocks.nop);

        scene.add(elem);
        scene.add(masked);
        scene.add(elem2);

        masked.mask(mask);

        doAsync(player, scene, {
            do: 'play', until: C.STOPPED, timeout: 0.7,
            then: function() {
                expect(maskCanvasWasRemoved).toBeTruthy();
                expect(backCanvasWasRemoved).toBeTruthy();

                expect(elemPaintSpy).not.toHaveBeenCalled();
                expect(maskPaintSpy).not.toHaveBeenCalled();
                expect(maskedPaintSpy).not.toHaveBeenCalled();
                expect(elem2PaintSpy).toHaveBeenCalled();
                elem2PaintSpy.reset();
                expect(mainCtxDrawImageSpy).not.toHaveBeenCalled();
                expect(backCtxDrawImageSpy).not.toHaveBeenCalled();
            }
        });

    });

    // TODO: check alpha applied ok both for mask and for masked element

    // TODO: check for child elements, complex elements and stuff

    // TODO: ensure removing mask (and loading new scene or playing from start) disposes canvas element

});