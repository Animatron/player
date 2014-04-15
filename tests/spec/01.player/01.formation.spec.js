/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when created,", function() {

    var initialRatio = anm.__dev._win().devicePixelRatio;

    describe("regarding canvas size", function() {

        var canvas,
            canvasId = 'my-canvas';
        var window_mock = _mocks.factory.window();

        beforeEach(function() {
            canvas = _mocks.factory.canvas(canvasId);
            _mocks.adaptDocument(document, function(id) {
                expect(id).toEqual(canvasId);
                return canvas;
            });
            _fake(_Fake.CVS_POS);

            anm.__dev._winf(window_mock);

            this.addMatchers(_matchers.size);
        });

        afterEach(function() { canvas.__resetMock();
                               anm.__dev._winf(window /* actual window */); });

        varyAll([{ description: "with standard display", prepare: function() { window_mock.devicePixelRatio = undefined; },
                                                         after:   function() { window_mock.devicePixelRatio = initialRatio; } },
                 { description: "with retina display", prepare: function() { window_mock.devicePixelRatio = 2; },
                                                       after: function() { window_mock.devicePixelRatio = initialRatio; } },
                 { description: "with 3.14 pixel ratio display", prepare: function() { window_mock.devicePixelRatio = 3.14; },
                                                                 after: function() { window_mock.devicePixelRatio = initialRatio; } }],
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
                // pay attention that size is set multiplied to the ratio here
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

            it("should use canvas size, given in options, even if there is size specified in element", function() {
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

            // may be its not ok to make presumptions like these, so we need to enfore user to use createPlayer options in all of the cases
            xit("should correct canvas size, if there is some specified in the element, to proper size", function() {
                var test_w = 670,
                    test_h = 360;

                canvas.setAttribute('width', test_w);
                canvas.setAttribute('height', test_h);

                createPlayer(canvasId);

                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);
            });

            // may be its not ok to make presumptions like these, so we need to enfore user to use createPlayer options in all of the cases
            xit("should correct canvas size, if there is some specified in styles, to proper size", function() {
                var test_w = 670,
                    test_h = 360;

                canvas.style.width = test_w + 'px';
                canvas.style.height = test_h + 'px';

                createPlayer(canvasId);

                expect(canvas).not.toHaveSize([ anm.Player.DEFAULT_CANVAS.width,
                                                anm.Player.DEFAULT_CANVAS.height ]);
                expect(canvas).toHaveSize([ test_w, test_h ]);
            });

        });

    });

    // test setting zoom from properties
    // also check that zoom was changed for scene.render when pixelRatio was changed
    // check new canvas __pxRatio attr was set
    // ensure that state.zoom wasn't changed, but state.ratio is used to render scene
    // ensure drawAt draws with correct zoom
    // also check if clearRect was called with correct parameters
    // test debug mode works with pixel-ratio
    // + images support
    // TODO: ensure controls and info blocks are rendered properly for different ratios
    // TODO: data- attributes
    // TODO: player.forSnapshot
    // canvas bg can use only solid colors or rgba and it should be transparent by default, overwritten only with options.
    // project bg may be either any gradient or any type of color, it should be used only when rendering project itself

    xit("not passes", function() {
        this.fail();
    });

    // test with passed element and id

});
