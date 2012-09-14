describe("masks", function() {

    var player,
        C = anm.C;

    var b = Builder._$,
        B = Builder;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();

        player = createPlayer('test-id');
    });

    it("mask drawing sequence should be right", function() {

        //var saveSpy = spyOn(_mocks.context2d, 'save');
        //var restoreSpy = spyOn(_mocks.context2d, 'restore');

        var maskCanvas = _mocks.factory.canvas();
        var maskCtx = maskCanvas.getContext('2d');

        var mainCanvas = _mocks.canvas;
        var mainCtx = mainCanvas.getContext('2d');

        expect(maskCtx).not.toBe(mainCtx);

        var createCanvasSpy = spyOn(document, 'createElement').andCallFake(function(elmType) {
            expect(elmType).toEqual('canvas');
            return maskCanvas;
        });
        var drawImageSpy = spyOn(mainCtx, 'drawImage').andCallThrough();

        var elemPaintSpy = jasmine.createSpy('elem-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(mainCtx);
            expect(mainCtx.globalCompositeOperation).toEqual('source-over');

            expect(maskPaintSpy).not.toHaveBeenCalled();
            expect(maskedPaintSpy).not.toHaveBeenCalled();

            expect(createCanvasSpy).not.toHaveBeenCalled();
            expect(drawImageSpy).not.toHaveBeenCalled();
        });

        var maskPaintSpy = jasmine.createSpy('mask-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(maskCtx);
            expect(maskCanvas.width).toEqual(mainCanvas.width);
            expect(maskCanvas.height).toEqual(mainCanvas.height);
            expect(mainCtx.globalCompositeOperation).toEqual('source-over');
            expect(maskCtx.globalCompositeOperation).toEqual('source-over');
            /*expect(maskCtx.fillStyle).toBe('black');
            expect(maskCtx.strokeStyle).toBe('rgba(0,0,0,1)');*/

            expect(createCanvasSpy).toHaveBeenCalled();
            createCanvasSpy.reset();

            expect(elemPaintSpy).toHaveBeenCalledOnce();
            expect(elemPaintSpy).toHaveBeenCalledWith(mainCtx, undefined);
            elemPaintSpy.reset();

            expect(maskedPaintSpy).not.toHaveBeenCalled();
            expect(drawImageSpy).not.toHaveBeenCalled();
        });

        var maskedPaintSpy = jasmine.createSpy('masked-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(maskCtx);
            expect(mainCtx.globalCompositeOperation).toEqual('source-over');
            expect(maskCtx.globalCompositeOperation).toEqual('source-in');

            expect(createCanvasSpy).not.toHaveBeenCalled();
            expect(elemPaintSpy).not.toHaveBeenCalled();

            expect(maskPaintSpy).toHaveBeenCalledOnce();
            expect(maskPaintSpy).toHaveBeenCalledWith(maskCtx, undefined);
            maskPaintSpy.reset();

            expect(drawImageSpy).not.toHaveBeenCalled();
        });

        var elem2PaintSpy = jasmine.createSpy('elem2-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(mainCtx);
            expect(mainCtx.globalCompositeOperation).toEqual('source-over');
            expect(maskCtx.globalCompositeOperation).toEqual('source-over');
            // expect mask-canvas to be removed?

            expect(maskPaintSpy).not.toHaveBeenCalled();
            expect(maskedPaintSpy).toHaveBeenCalledOnce();
            expect(maskedPaintSpy).toHaveBeenCalledwith(maskCtx, undefined);
            maskedPaintSpy.reset();

            expect(drawImageSpy).toHaveBeenCalledOnce();
            expect(drawImageSpy).toHaveBeenCalledWith(maskCtx, 0, 0, maskCvs.width, maskCvs.height);
            drawImageSpy.reset();
        });

        var scene = b().band([0, .5]);
        var elem = b().paint(elemPaintSpy);
        var masked = b().paint(maskedPaintSpy);
        var mask = b().paint(maskPaintSpy);
        var elem2 = b().paint(elem2PaintSpy);

        scene.add(elem);
        scene.add(masked);
        scene.add(elem2);

        masked.mask(mask);

        runs(function() {
            player.load(scene).play();
        });

        waitsFor(function() {
            return player.state.happens === C.STOPPED;
        }, 700);

        runs(function() {
            //expect(saveSpy).not.toHaveBeenCalled();
            //expect(restoreSpy).toHaveBeenCalled();

            expect(maskedPaintSpy).not.toHaveBeenCalled();
            expect(elem2PaintSpy).toHaveBeenCalledOnce();
            expect(drawImageSpy).not.toHaveBeenCalled();
        })
    });

    // TODO: mask canvas created during render process, but once

    // TODO: check for child elements, complex elements and stuff

    // TODO: ensure removing mask disposes canvas element

});