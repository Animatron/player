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

        function setCanvasSize(canvas, size) {
            var pxRatio = window.devicePixelRatio || 1;
            canvas.setAttribute('width',  size[0] * pxRatio);
            canvas.setAttribute('height', size[1] * pxRatio);
            canvas.style.width  = size[0] + 'px';
            canvas.style.height = size[1] + 'px';
        }

        beforeEach(function() {
            canvas = _mocks.factory.canvas(canvasId);
            spyOn(document, 'getElementById').andCallFake(function(id) {
                expect(id).toEqual(canvasId);
                return canvas;
            });
            _fakeCallsForCanvasRelatedStuff();

            this.addMatchers({
                toHaveSizeDefined: function() {
                    var actual = this.actual;
                    var notText = this.isNot ? " not" : "";

                    var pxRatio = window.devicePixelRatio;

                    this.message = function () {
                        return "Expected " + actual + notText + " to have size defined";
                    }

                    return (typeof actual.width !== 'undefined') &&
                           (typeof actual.height !== 'undefined') &&
                           (typeof actual.getAttribute('width') !== 'undefined') &&
                           (typeof actual.getAttribute('height') !== 'undefined') &&
                           (typeof actual.style.width !== 'undefined') &&
                           (typeof actual.style.height !== 'undefined');
                },
                toHaveSize: function(expected) {
                    var actual = this.actual;
                    var notText = this.isNot ? " not" : "";

                    var pxRatio = window.devicePixelRatio || 1;

                    this.message = function () {
                        return "Expected " + actual + notText + " to have size equal to " + expected + ", " +
                               "but it has " + actual.getAttribute('width') + "x" + actual.getAttribute('height') + " " +
                               "and " + actual.style.width + ":" + actual.style.height + " in CSS";
                    }

                    return (actual.getAttribute('width')  == (expected[0] * pxRatio)) &&
                           (actual.getAttribute('height') == (expected[1] * pxRatio)) &&
                           (actual.style.width  == (expected[0] + 'px')) &&
                           (actual.style.height == (expected[1] + 'px'));
                }
            })
        });

        varyAll([{ description: "with standard display", prepare: function() { window.devicePixelRatio = undefined; } },
                 { description: "with retina display", prepare: function() { window.devicePixelRatio = 2; } },
                 { description: "with 3.14 pixel ratio display", prepare: function() { window.devicePixelRatio = 3.14; } }],
                 function() {

            it("should use default canvas size, if there is no size specified either in element or in options", function() {
                expect(canvas).not.toHaveSizeDefined();

                createPlayer(canvasId);
                expect(canvas).toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                            anm.Player.DEFAULT_CANVAS.height ]);

                canvas.__resetMock();
                expect(canvas).not.toHaveSizeDefined();

                createPlayer(canvasId, { 'anim': { 'bgfill': { color: '#fa07a7' } } });
                expect(canvas).toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                            anm.Player.DEFAULT_CANVAS.height ]);
            });

            it("should use canvas size, given in options, if there is no size specified in element", function() {
                expect(canvas).not.toHaveSizeDefined();

                var test_w = 521,
                    test_h = 741;
                expect(test_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(test_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                createPlayer(canvasId, { 'anim': { 'width': test_w, 'height': test_h } });
                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);

                canvas.__resetMock();
                expect(canvas).not.toHaveSizeDefined();

                test_w = 1018,
                test_h = 254;
                expect(test_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(test_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                createPlayer(canvasId, { 'anim': { 'width': test_w, 'height': test_h } });
                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);

            });

            it("should use canvas size, given in element, if there is no size specified in options", function() {
                expect(canvas).not.toHaveSizeDefined();

                var test_w = 521,
                    test_h = 741;
                expect(test_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(test_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                setCanvasSize(canvas, [ test_w, test_h ]);
                createPlayer(canvasId);
                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);

                canvas.__resetMock();
                expect(canvas).not.toHaveSizeDefined();

                test_w = 1018,
                test_h = 254;
                expect(test_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(test_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                setCanvasSize(canvas, [ test_w, test_h ]);
                createPlayer(canvasId, { 'anim': { 'bgfill': { color: '#fa07a7' } } });
                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);

            });

            it("should use canvas size, given in option, even if there is size specified in element", function() {
                expect(canvas).not.toHaveSizeDefined();

                var test_w = 521,
                    test_h = 741;
                var atest_w = 1018,
                    atest_h = 257;
                expect(atest_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(atest_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                expect(test_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(test_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                setCanvasSize(canvas, [ atest_w, atest_h ]);
                expect(canvas).toHaveSize([ atest_w, atest_h ]);
                createPlayer(canvasId, { 'anim': { 'width': test_w, 'height': test_h } });
                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);

                canvas.__resetMock();
                expect(canvas).not.toHaveSizeDefined();

                var test_w = 357,
                    test_h = 642;
                var atest_w = 219,
                    atest_h = 2350;
                expect(atest_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(atest_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                expect(test_w).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(test_h).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                setCanvasSize(canvas, [ atest_w, atest_h ]);
                expect(canvas).toHaveSize([ atest_w, atest_h ]);
                createPlayer(canvasId, { 'anim': { 'width': test_w, 'height': test_h } });
                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);

            });

        });

    });

    // also check that zoom was changed for scene.render when pixelRatio was changed
    // TODO: data- attributes
    // TODO: player.forSnapshot

    xit("not passes", function() {
        this.fail();
    });

    // test with passed element and id

});