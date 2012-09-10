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

    it("should apply mask to an element", function() {

        var saveSpy = spyOn(_mocks.context2d, 'save');
        var restoreSpy = spyOn(_mocks.context2d, 'restore');

        var maskPaintSpy = jasmine.createSpy('mask-paint').andCallFake(function(ctx) {
            expect(saveSpy).toHaveBeenCalled();
            expect(elemPaintSpy).not.toHaveBeenCalled();
            expect(clipSpy).not.toHaveBeenCalled();
            expect(transformSpy).not.toHaveBeenCalled();

            saveSpy.reset();
        });

        var clipSpy = spyOn(_mocks.context2d, 'clip').andCallFake(function() {
            expect(maskPaintSpy).toHaveBeenCalled();
            expect(elemPaintSpy).not.toHaveBeenCalled();
            expect(transformSpy).not.toHaveBeenCalled();

            maskPaintSpy.reset();
        });

        var elemPaintSpy = jasmine.createSpy('elem-paint').andCallFake(function(ctx) {
            expect(maskPaintSpy).not.toHaveBeenCalled();
            expect(clipSpy).toHaveBeenCalled();
            expect(transformSpy).toHaveBeenCalled();

            elemPaintSpy.reset();
            clipSpy.reset();
            maskPaintSpy.reset();
            saveSpy.reset();
            restoreSpy.reset();
            transformSpy.reset();
        });

        var scene = b().band([0, .5]);
        var elem = b().paint(elemPaintSpy);
        var mask = b().paint(maskPaintSpy);

        var transformSpy = spyOn(elem.v, 'transform').andCallThrough();

        scene.add(elem);

        elem.mask(mask);

        runs(function() {
            player.load(scene).play();
        });

        waitsFor(function() {
            return player.state.happens === C.STOPPED;
        }, 700);

        runs(function() {
            expect(saveSpy).not.toHaveBeenCalled();
            expect(restoreSpy).toHaveBeenCalled();
        })
    });

});