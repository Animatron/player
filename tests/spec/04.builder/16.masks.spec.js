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
        var maskContext = maskCanvas.getContext('2d');

        var mainCanvas = _mocks.canvas;
        var mainContext = mainCanvas.getContext('2d');

        expect(maskContext).not.toBe(mainContext);

        var createdMaskCanvas = false;

        var createCanvasSpy = spyOn(document, 'createElement').andCallFake(function(elmType) {
            expect(elmType).toEqual('canvas');
            return maskCanvas;
        });
        var drawImageSpy = spyOn(mainContext, 'drawImage').andCallThrough();

        var elemPaintSpy = jasmine.createSpy('elem-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(mainContext);
            expect(mainContext.globalCompositeOperation).toEqual('source-over');

            expect(maskPaintSpy).not.toHaveBeenCalled();
            expect(maskedPaintSpy).not.toHaveBeenCalled();

            expect(createCanvasSpy).not.toHaveBeenCalled();
            expect(drawImageSpy).not.toHaveBeenCalled();
        });

        var maskPaintSpy = jasmine.createSpy('mask-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(maskContext);
            expect(maskCanvas.width).toEqual(mainCanvas.width);
            expect(maskCanvas.height).toEqual(mainCanvas.height);
            expect(mainContext.globalCompositeOperation).toEqual('source-over');
            expect(maskContext.globalCompositeOperation).toEqual('source-over');
            /*expect(maskContext.fillStyle).toBe('black');
            expect(maskContext.strokeStyle).toBe('rgba(0,0,0,1)');*/

            if (!createdMaskCanvas) {
                expect(createCanvasSpy).toHaveBeenCalled();
                createCanvasSpy.reset();
                createdMaskCanvas = true;
            } else expect(createCanvasSpy).not.toHaveBeenCalled();

            expect(elemPaintSpy).toHaveBeenCalledOnce();
            expect(elemPaintSpy).toHaveBeenCalledWith(mainContext, undefined);
            elemPaintSpy.reset();
            elem2PaintSpy.reset();

            expect(maskedPaintSpy).not.toHaveBeenCalled();
            expect(drawImageSpy).not.toHaveBeenCalled();
        });

        var maskedPaintSpy = jasmine.createSpy('masked-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(maskContext);
            // TODO: expect clearRect to be called
            expect(mainContext.globalCompositeOperation).toEqual('source-over');
            expect(maskContext.globalCompositeOperation).toEqual('source-in');

            expect(createCanvasSpy).not.toHaveBeenCalled();
            expect(elemPaintSpy).not.toHaveBeenCalled();
            expect(elem2PaintSpy).not.toHaveBeenCalled();

            expect(maskPaintSpy).toHaveBeenCalledOnce();
            expect(maskPaintSpy).toHaveBeenCalledWith(maskContext, undefined);
            maskPaintSpy.reset();

            expect(drawImageSpy).not.toHaveBeenCalled();
        });

        var elem2PaintSpy = jasmine.createSpy('elem2-paint').andCallFake(function(ctx) {
            expect(ctx).toBe(mainContext);
            expect(mainContext.globalCompositeOperation).toEqual('source-over');
            expect(maskContext.globalCompositeOperation).toEqual('source-over');

            expect(maskPaintSpy).not.toHaveBeenCalled();
            expect(elemPaintSpy).not.toHaveBeenCalled();
            expect(maskedPaintSpy).toHaveBeenCalledOnce();
            expect(maskedPaintSpy).toHaveBeenCalledWith(maskContext, undefined);
            maskedPaintSpy.reset();

            expect(drawImageSpy).toHaveBeenCalledOnce();
            expect(drawImageSpy).toHaveBeenCalledWith(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height);
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