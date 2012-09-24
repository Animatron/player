/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when created,", function() {

    describe("regarding canvas size", function() {

        var canvas,
            canvasId = 'my-canvas';

        beforeEach(function() {
            canvas = _mocks.factory.canvas(canvasId);
            spyOn(document, 'getElementById').andCallFake(function(id) {
                expect(id).toEqual(canvasId);
                return canvas;
            });
        });

        it("should use default canvas size, if there is no size specified neither in element nor in options", function() {
            expect(canvas.width).not.toBeDefined();
            expect(canvas.height).not.toBeDefined();
            expect(canvas.getAttribute('width')).not.toBeDefined();
            expect(canvas.getAttribute('height')).not.toBeDefined();

            var player1 = createPlayer(canvasId);
            expect(canvas.getAttribute('width')).toBe(anm.Player.DEFAULT_CANVAS.width);
            expect(canvas.getAttribute('height')).toBe(anm.Player.DEFAULT_CANVAS.height);
            expect(canvas.style.width).toBe(anm.Player.DEFAULT_CANVAS.width + 'px');
            expect(canvas.style.height).toBe(anm.Player.DEFAULT_CANVAS.width + 'px');

            canvas.__resetMock();

            expect(canvas.width).not.toBeDefined();
            expect(canvas.height).not.toBeDefined();
            expect(canvas.getAttribute('width')).not.toBeDefined();
            expect(canvas.getAttribute('height')).not.toBeDefined();

            var player1 = createPlayer(canvasId, { 'anim': { 'bgfill': { color: '#fa07a7' } } });
            expect(canvas.getAttribute('width')).toBe(anm.Player.DEFAULT_CANVAS.width);
            expect(canvas.getAttribute('height')).toBe(anm.Player.DEFAULT_CANVAS.height);
            expect(canvas.style.width).toBe(anm.Player.DEFAULT_CANVAS.width + 'px');
            expect(canvas.style.height).toBe(anm.Player.DEFAULT_CANVAS.width + 'px');
        });

        xit("should use default canvas size, if there is no size specified neither in element nor in options", function() {
            this.fail("Not implemented");
        });

        // TODO: test Retina and stuff

    });

    xit("not passes", function() {
        this.fail();
    });

    // test with passed element and id

});