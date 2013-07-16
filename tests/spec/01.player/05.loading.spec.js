/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about loading scenes,", function() {

    var player;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        player = createPlayer('test-id', { mode: anm.C.M_SANDBOX });

        AjaxFaker.start();
    });

    afterEach(function() { AjaxFaker.stop(); });

    it("does not accepts empty scene to load", function() {
        try {
            player.load();
        } catch(e) {
            expect(e.message).toBe(anm.Errors.P.NO_SCENE_PASSED);
        }
    });

    it("duration should be not defined when no scene loaded", function() {
        expect(player.anim).toBeNull();
        expect(player.state.duration).not.toBeDefined();
    });

    it("should use default scene duration even if elements inside has narrower bands", function() {
        var duration = 1.27;

        var scene = new anm.Scene();
        var elem = new anm.Element();
        elem.setBand([0, duration]);
        scene.add(elem);

        expect(scene.duration).not.toBeDefined();

        player.load(scene);

        expect(player.state.duration).toBe(anm.Scene.DEFAULT_LEN);

        // TODO: test with different durations, while playing, and with different children
    });

    describe("when just loading", function() {

        var _toLoad,
            _callback,
            _testScene;

        varyAll([ { description: "a scene,", prepare: function() {
                        _toLoad = new anm.Scene();
                        _testScene = function(actual) {
                            expect(actual).toBe(_toLoad);
                        }
                    } },
                  { description: "number of clips,", prepare: function() {
                        _toLoad = [ new anm.Element(), new anm.Element(),
                                    new anm.Element(), new anm.Element() ];
                        _testScene = function(actual) {
                            expect(actual.tree[0].children.length).toBe(4);
                        }
                    } } ], function() {

            it("should load given scene", function() {
                try {
                    player.load(_toLoad);
                } catch(e) {
                    this.fail(e);
                }
                _testScene(player.anim);
            });

            it("should load given scene and call a callback", function() {
                var callbackSpy = jasmine.createSpy('callback').andCallFake(function(scene) {
                    _testScene(scene);
                });

                try {
                    player.load(_toLoad, callbackSpy);
                } catch(e) {
                    this.fail(e);
                }
                _testScene(player.anim);
                expect(callbackSpy).toHaveBeenCalled();
            });

            it("should load given scene and set a duration to it", function() {
                var duration = 2.93;

                try {
                    player.load(_toLoad, duration);
                } catch(e) {
                    this.fail(e);
                }
                _testScene(player.anim);
                expect(player.anim.duration).toBe(duration);
            });

            it("should load given scene and set a duration to it and call a callback", function() {
                var duration = 3.97;
                var callbackSpy = jasmine.createSpy('callback').andCallFake(function(scene) {
                    _testScene(scene);
                });

                try {
                    player.load(_toLoad, duration, callbackSpy);
                } catch(e) {
                    this.fail(e);
                }
                _testScene(player.anim);
                expect(player.anim.duration).toBe(duration);
                expect(callbackSpy).toHaveBeenCalled();
            });

        });

    });

    describe("when loading with importer", function() {

        var _source,
            _testResult;

        varyAll([ { description: "some object,", prepare: function() {
                        _source = {};
                        _testImportObject = function(importObj) {
                            expect(importObj).toBe(_source);
                        }
                    } },
                  { description: "by URL,", prepare: function() {
                        _source = 'http://fake.url';
                        var testHash = '54f3dfe3016de10c27a006f37fefb529af801f43';
                        _scene = { foo_: testHash };
                        AjaxFaker.subscribe('http://fake.url', function() {
                            return '{ "foo_": "' + testHash + '" }';
                        });
                        _testImportObject = function(importObj) {
                            expect(importObj.foo_).toBeDefined();
                            expect(importObj.foo_).toEqual(testHash);
                        }
                    } } ], function() {

            it("should accept importer and load the scene it returns", function() {
                var importer = _mocks.factory.importer(),
                    scene = new anm.Scene();

                importer.load = function(_in) {
                    _testImportObject(_in);
                    return scene;
                }

                try {
                    player.load(_source, importer);
                } catch(e) {
                    this.fail(e);
                }
                expect(player.anim).toBe(scene);
            });

            it("should accept both duration and importer and load the scene last returns", function() {
                var importer = _mocks.factory.importer(),
                    scene = new anm.Scene();
                var duration = 15.2;

                importer.load = function(_in) {
                    _testImportObject(_in);
                    return scene;
                }

                try {
                    player.load(_source, duration, importer);
                } catch(e) {
                    this.fail(e);
                }
                expect(player.state.duration).toBe(duration);
                expect(player.anim).toBe(scene);
            });

            it("should call importer methods if duration is not defined", function() {

                var importer = _mocks.factory.fullImporter(),
                    sceneToReturn = new anm.Scene();

                var confAnimSpy = spyOn(importer, 'configureAnim').andReturn({ fps: 17, duration: 42 }),
                    confMetaSpy = spyOn(importer, 'configureMeta').andReturn({ author: 'Mr. Bar' }),
                    loadSpy     = spyOn(importer, 'load'         ).andCallFake(function(_in) {
                        _testImportObject(_in);
                        return sceneToReturn;
                    }),
                    callbackSpy = jasmine.createSpy('callback').andCallFake(function(scene) {
                        expect(scene).toBe(sceneToReturn);
                    });

                player.load(_source, importer, callbackSpy);

                expect(confAnimSpy).toHaveBeenCalled();
                expect(confMetaSpy).toHaveBeenCalled();
                expect(loadSpy).toHaveBeenCalled();
                expect(callbackSpy).toHaveBeenCalled();
                expect(player.anim).toBe(sceneToReturn);
                expect(player.state.fps).toBe(17);
                expect(player.state.duration).toBe(42);
                expect(player._metaInfo.author).toBe('Mr. Bar');

            });

            it("should call importer methods if duration is defined", function() {

                var importer = _mocks.factory.fullImporter(),
                    sceneToReturn = new anm.Scene();
                var duration = 20.3;

                var confAnimSpy = spyOn(importer, 'configureAnim').andReturn({ fps: 23, duration: 42 }),
                    confMetaSpy = spyOn(importer, 'configureMeta').andReturn({ author: 'Mr. Foo' }),
                    loadSpy     = spyOn(importer, 'load'         ).andCallFake(function(_in) {
                        _testImportObject(_in);
                        return sceneToReturn;
                    }),
                    callbackSpy = jasmine.createSpy('callback').andCallFake(function(scene) {
                        expect(scene).toBe(sceneToReturn);
                    });

                player.load(_source, duration, importer, callbackSpy);

                expect(confAnimSpy).toHaveBeenCalled();
                expect(confMetaSpy).toHaveBeenCalled();
                expect(loadSpy).toHaveBeenCalled();
                expect(callbackSpy).toHaveBeenCalled();
                expect(player.anim).toBe(sceneToReturn);
                expect(player.state.fps).toBe(23);
                expect(player.state.duration).toBe(duration);
                expect(player._metaInfo.author).toBe('Mr. Foo');

            });

        });

    });

    describe("setting duration with load method and no (or empty) importer", function() {

        // TODO: also test with builder and other variants

        it("should set a duration to a scene if it was passed to load method", function() {
            var duration = 1.27;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            scene.add(elem);

            expect(scene.duration).not.toBeDefined();

            player.load(scene, duration);

            expect(scene.duration).toBe(duration);
            expect(player.state.duration).toBe(duration);
        });

        it("should also set a duration to a scene if it was passed to load method even with importer", function() {
            var duration = 1.27;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            scene.add(elem);

            expect(scene.duration).not.toBeDefined();

            player.load(scene, duration, _mocks.factory.importer());

            expect(player.anim).toBe(scene); // it shows that importer.load was not called since it is empty
            expect(scene.duration).toBe(duration);
            expect(player.state.duration).toBe(duration);
        });

    });

});

describe("regarding setting zoom, when loading a scene", function() {

    describe("regarding zoom", function() {

        var canvas,
            canvasId = 'my-canvas';

        var scaleSpy;

        var window_mock = _mocks.factory.window(),
            initialRatio = anm.__dev._win().devicePixelRatio;

        function createSceneWithSize(size) {
            var scene = new anm.Scene();
            scene.width = size[0];
            scene.height = size[1];
            return scene;
        }

        function testZoomWith(conf) {
            canvas.__resetMock();
            expect(canvas).not.toHaveSizeDefined();
            var player = conf.player(canvasId);
            var cvs_size = conf.expected_cvs_size;
            var scn_size = conf.scn_size;
            expect(canvas).toHaveSize(cvs_size);

            var scene = createSceneWithSize(scn_size);

            player.load(scene);
            player.drawAt(0);
            if (conf.expected_zoom != 1) {
                expect(scaleSpy).toHaveBeenCalledWith(conf.expected_zoom,
                                                      conf.expected_zoom);
            }
            expect(scaleSpy).toHaveBeenCalledWith(conf.expected_scale[0],
                                                  conf.expected_scale[1]);
            var pxRatio = window_mock.devicePixelRatio;
            if (pxRatio && (pxRatio != 1)) {
                expect(scaleSpy).toHaveBeenCalledWith(pxRatio,
                                                      pxRatio);
            }
            scaleSpy.reset();
            expect(player.state.zoom).toBe(conf.expected_zoom);

        }

        beforeEach(function() {
            canvas = _mocks.factory.canvas(canvasId);
            spyOn(document, 'getElementById').andCallFake(function(id) {
                expect(id).toEqual(canvasId);
                return canvas;
            });
            _fake(_Fake.CVS_POS);

            anm.__dev._winf(window_mock);

            this.addMatchers(_matchers.size);

            scaleSpy = spyOn(canvas.getContext('2d'), 'scale');

            // TODO: also test with importer
        });

        afterEach(function() { canvas.__resetMock();
                               anm.__dev._winf(window /* actual window */); });

        varyAll([{ description: "with standard display",
                   prepare: function() { window_mock.devicePixelRatio = undefined; },
                   after: function() { window_mock.devicePixelRatio = initialRatio; } },
                 { description: "with retina display",
                   prepare: function() { window_mock.devicePixelRatio = 2; },
                   after: function() { window_mock.devicePixelRatio = initialRatio; } },
                 { description: "with 3.14 pixel ratio display",
                   prepare: function() { window_mock.devicePixelRatio = 3.14; },
                   after: function() { window_mock.devicePixelRatio = initialRatio; } } ],
                 function() {

            it("should zoom a loaded scene to default canvas size after loading, if there is no canvas size specified either in element or in options", function() {

                var exp_scale;

                expect(915).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(214).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                exp_scale = Math.min(anm.Player.DEFAULT_CANVAS.width  / 915,
                                     anm.Player.DEFAULT_CANVAS.height / 214);
                testZoomWith({
                    player: function(id) { return createPlayer(id); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ anm.Player.DEFAULT_CANVAS.width,
                                         anm.Player.DEFAULT_CANVAS.height ],
                    expected_zoom: 1,
                    expected_scale: [ exp_scale, exp_scale ]
                });

                expect(727).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(820).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                exp_scale = Math.min(anm.Player.DEFAULT_CANVAS.width  / 727,
                                     anm.Player.DEFAULT_CANVAS.height / 820);
                testZoomWith({
                    player: function(id) { return createPlayer(id); },
                    scn_size: [ 727, 820 ],
                    expected_cvs_size: [ anm.Player.DEFAULT_CANVAS.width,
                                         anm.Player.DEFAULT_CANVAS.height ],
                    expected_zoom: 1,
                    expected_scale: [ exp_scale, exp_scale ]
                });

                expect(515).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(515).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                exp_scale = Math.min(anm.Player.DEFAULT_CANVAS.width  / 515,
                                     anm.Player.DEFAULT_CANVAS.height / 515);
                testZoomWith({
                    player: function(id) { return createPlayer(id); },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ anm.Player.DEFAULT_CANVAS.width,
                                         anm.Player.DEFAULT_CANVAS.height ],
                    expected_zoom: 1,
                    expected_scale: [ exp_scale, exp_scale ]
                });

            });

            it("should zoom a loaded scene to default canvas size after loading, if there is no canvas size specified either in element or in options, but there was some zoom predefined", function() {

                expect(915).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(214).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                exp_scale = Math.min(anm.Player.DEFAULT_CANVAS.width  / 915,
                                     anm.Player.DEFAULT_CANVAS.height / 214);
                testZoomWith({
                    player: function(id) { return createPlayer(id, { zoom: 1.2 }); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ anm.Player.DEFAULT_CANVAS.width,
                                         anm.Player.DEFAULT_CANVAS.height ],
                    expected_zoom: 1.2,
                    expected_scale: [ exp_scale, exp_scale ]
                });

                expect(327).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(820).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                exp_scale = Math.min(anm.Player.DEFAULT_CANVAS.width  / 327,
                                     anm.Player.DEFAULT_CANVAS.height / 820);
                testZoomWith({
                    player: function(id) { return createPlayer(id, { zoom: 6.3 }); },
                    scn_size: [ 327, 820 ],
                    expected_cvs_size: [ anm.Player.DEFAULT_CANVAS.width,
                                         anm.Player.DEFAULT_CANVAS.height ],
                    expected_zoom: 6.3,
                    expected_scale: [ exp_scale, exp_scale ]
                });

                expect(515).not.toEqual(anm.Player.DEFAULT_CANVAS.width);
                expect(515).not.toEqual(anm.Player.DEFAULT_CANVAS.height);
                exp_scale = Math.min(anm.Player.DEFAULT_CANVAS.width  / 515,
                                     anm.Player.DEFAULT_CANVAS.height / 515);
                testZoomWith({
                    player: function(id) { return createPlayer(id, { zoom: 7.5 }); },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ anm.Player.DEFAULT_CANVAS.width,
                                         anm.Player.DEFAULT_CANVAS.height ],
                    expected_zoom: 7.5,
                    expected_scale: [ exp_scale, exp_scale ]
                });

            });

            it("should zoom a loaded scene to canvas size, given in options, if there is no canvas size specified in element", function() {

                testZoomWith({
                    player: function(id) { return createPlayer(id, { anim: { width: 220, height: 110 } }); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 220 / 915, 220 / 915 ]
                });

                testZoomWith({
                    player: function(id) { return createPlayer(id, { anim: { width: 220, height: 110 } }); },
                    scn_size: [ 327, 820 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 110 / 820, 110 / 820 ]
                });

                testZoomWith({
                    player: function(id) { return createPlayer(id, { anim: { width: 220, height: 110 } }); },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 110 / 515, 110 / 515 ]
                });

                testZoomWith({
                    player: function(id) { return createPlayer(id, { anim: { width: 220, height: 110 } }); },
                    scn_size: [ 550, 275 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 220 / 550, 110 / 275 ]
                });

            });

            it("should zoom a loaded scene to canvas size, given in options, if there is no canvas size specified in element, but there was some zoom predefined", function() {

                testZoomWith({
                    player: function(id) { return createPlayer(id, { zoom: 1.2, anim: { width: 220, height: 110 } }); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1.2,
                    expected_scale: [ 220 / 915, 220 / 915 ]
                });

                testZoomWith({
                    player: function(id) { return createPlayer(id, { zoom: 6.3, anim: { width: 220, height: 110 } }); },
                    scn_size: [ 327, 820 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 6.3,
                    expected_scale: [ 110 / 820, 110 / 820 ]
                });

                testZoomWith({
                    player: function(id) { return createPlayer(id, { zoom: 7.5, anim: { width: 220, height: 110 } }); },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 7.5,
                    expected_scale: [ 110 / 515, 110 / 515 ]
                });

                testZoomWith({
                    player: function(id) { return createPlayer(id, { zoom: 2.7,  anim: { width: 220, height: 110 } }); },
                    scn_size: [ 550, 275 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 2.7,
                    expected_scale: [ 220 / 550, 110 / 275 ]
                });

            });

            it("should zoom a loaded scene to canvas size, given in element, if there is no canvas size specified in options", function() {

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 1,
                    expected_scale: [ 365 / 915, 365 / 915 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id); },
                    scn_size: [ 327, 820 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 1,
                    expected_scale: [ 750 / 820, 750 / 820 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id); },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 1,
                    expected_scale: [ 365 / 515, 365 / 515 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id); },
                    scn_size: [ 219, 450 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 1,
                    expected_scale: [ 365 / 219, 750 / 450 ]
                });

            });

            it("should zoom a loaded scene to canvas size, given in element, if there is no canvas size specified in options, but there was some zoom predefined", function() {

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 1.2 }); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 1.2,
                    expected_scale: [ 365 / 915, 365 / 915 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 6.3 }); },
                    scn_size: [ 327, 820 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 6.3,
                    expected_scale: [ 750 / 820, 750 / 820 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 7.5 }); },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 7.5,
                    expected_scale: [ 365 / 515, 365 / 515 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 2.7 }); },
                    scn_size: [ 219, 450 ],
                    expected_cvs_size: [ 365, 750 ],
                    expected_zoom: 2.7,
                    expected_scale: [ 365 / 219, 750 / 450 ]
                });

            });

            it("should zoom a loaded scene to canvas size, given in options, even if there is canvas size specified in element", function() {

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { anim: { width: 220, height: 110 } }); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 220 / 915, 220 / 915 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { anim: { width: 220, height: 110 } });  },
                    scn_size: [ 327, 820 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 110 / 820, 110 / 820 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { anim: { width: 220, height: 110 } });  },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 110 / 515, 110 / 515 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { anim: { width: 220, height: 110 } }); },
                    scn_size: [ 550, 275 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1,
                    expected_scale: [ 220 / 550, 110 / 275 ]
                });

            });

            it("should zoom a loaded scene to canvas size, given in options, even if there is canvas size specified in element, but there was some zoom predefined", function() {
                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 1.2, anim: { width: 220, height: 110 } }); },
                    scn_size: [ 915, 214 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 1.2,
                    expected_scale: [ 220 / 915, 220 / 915 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 6.3, anim: { width: 220, height: 110 } }); },
                    scn_size: [ 327, 820 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 6.3,
                    expected_scale: [ 110 / 820, 110 / 820 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 7.5, anim: { width: 220, height: 110 } }); },
                    scn_size: [ 515, 515 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 7.5,
                    expected_scale: [ 110 / 515, 110 / 515 ]
                });

                testZoomWith({
                    player: function(id) { setCanvasSize(canvas, [ 365, 750 ]);
                                           return createPlayer(id, { zoom: 2.7, anim: { width: 220, height: 110 } }); },
                    scn_size: [ 550, 275 ],
                    expected_cvs_size: [ 220, 110 ],
                    expected_zoom: 2.7,
                    expected_scale: [ 220 / 550, 110 / 275 ]
                });
            });

            // TODO: test loading with embedding
        });

    });

    // ensure that canvas attributes has higher priority than options.anim for player size
    //   and are properly applied for different ratios;
    // ensure the main action to set player 'global' size will be canvas attributes or
    //   probably add this params to options to be 'global' in difference with options.anim width/height
    // load event to be fired
    // loading different types of objects
    // loading is impossible while playing
    // draw loading splash while loading
    // player.load("some://real.url?param1=val1&param2=val2"...) to load to options
    // player.load("some://fake.url"); expect(player.state.happens).toBe(C.NOTHING);
    // test async callback to be called
    // scene width and height should be equal to canvas width/height
    // duration
    // test remote loading
    // test that one element may be re-used in other players/scenes

});