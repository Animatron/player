/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player, when speaking about loading scenes,", function() {

    var player;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        player = createPlayer('test-id');
    });

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

    describe("loading with importer", function() {

        it("should accept importer", function() {
            try {
                player.load(new anm.Scene(), _mocks.factory.importer());
            } catch(e) {
                this.fail(e);
            }
        });

        it("should accept both duration and importer", function() {
            var scene = new anm.Scene();
            var duration = 15.2;
            try {
                player.load(scene, duration, _mocks.factory.importer());
            } catch(e) {
                this.fail(e);
            }
            expect(player.state.duration).toBe(duration);
        });

        it("should call importer methods in both cases", function() {
            var scene1 = new anm.Scene();
            var importer1 = _mocks.factory.importer();
            var duration = 20.3;

            var confAnimSpy1 = spyOn(importer1, 'configureAnim').andReturn({ fps: 23, duration: 42 }),
                confMetaSpy1 = spyOn(importer1, 'configureMeta').andReturn({ author: 'Mr. Foo' }),
                loadSpy1     = spyOn(importer1, 'load'         ).andReturn(scene1),
                callback1Spy = jasmine.createSpy('callback1');

            player.load(new anm.Scene(), duration, importer1, callback1Spy);

            expect(confAnimSpy1).toHaveBeenCalled();
            expect(confMetaSpy1).toHaveBeenCalled();
            expect(loadSpy1).toHaveBeenCalled();
            expect(callback1Spy).toHaveBeenCalledWith(scene1);
            expect(player.anim).toBe(scene1);
            expect(player.state.fps).toBe(23);
            expect(player.state.duration).toBe(duration);
            expect(player._metaInfo.author).toBe('Mr. Foo');

            var scene2 = new anm.Scene();
            var importer2 = _mocks.factory.importer();

            var confAnimSpy2 = spyOn(importer2, 'configureAnim').andReturn({ fps: 17, duration: 42 }),
                confMetaSpy2 = spyOn(importer2, 'configureMeta').andReturn({ author: 'Mr. Bar' }),
                loadSpy2     = spyOn(importer2, 'load'         ).andReturn(scene2),
                callback2Spy = jasmine.createSpy('callback2');

            player.load(new anm.Scene(), importer2, callback2Spy);

            expect(confAnimSpy2).toHaveBeenCalled();
            expect(confMetaSpy2).toHaveBeenCalled();
            expect(loadSpy2).toHaveBeenCalled();
            expect(callback2Spy).toHaveBeenCalledWith(scene2);
            expect(player.anim).toBe(scene2);
            expect(player.state.fps).toBe(17);
            expect(player.state.duration).toBe(42);
            expect(player._metaInfo.author).toBe('Mr. Bar');

        });

    });

    describe("setting duration with load method", function() {

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

        it("should also set a duration to a scene if it was passed to load method with importer", function() {
            var duration = 1.27;

            var scene = new anm.Scene();
            var elem = new anm.Element();
            elem.setBand([0, duration]);
            scene.add(elem);

            expect(scene.duration).not.toBeDefined();

            player.load(scene, duration, _mocks.factory.importer());

            expect(scene.duration).toBe(duration);
            expect(player.state.duration).toBe(duration);
        });

    });

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