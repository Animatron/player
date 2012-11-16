describe("tweens", function() {

    var b = Builder._$,
        B = Builder;

    describe("adding tweens should create modifiers with the given values", function() {

        // With this test we just ensure that, since creating tween creates a
        // conforming modifier, so basic features of tweens like passing bands
        // and inner time are already tested in modifiers section (they should to)

        var bld,
            elm;

        var addTweenSpy,
            addModifierSpy;

        var band = [1, 4],
            duration = band[1] - band[0],
            tween_band = [ duration / 4, 3 / 4 * duration ]; // try different bands?

        beforeEach(function() {
            bld = b().band(band);
            elm = bld.v;
            addTweenSpy    = spyOn(elm, 'addTween').andCallThrough();
            addModifierSpy = spyOn(elm, '__modify').andCallThrough();
        });

        // C.T_TRANSLATE   = 'TRANSLATE';
        // C.T_SCALE       = 'SCALE';
        // C.T_ROTATE      = 'ROTATE';
        // C.T_ROT_TO_PATH = 'ROT_TO_PATH';
        // C.T_ALPHA       = 'ALPHA';

        describe("the same should apply to tween method, no matter if it is", function() {

            var tween_type;

            varyAll([ { description: "translate tween",
                        prepare: function() { tween_type = anm.C.T_TRANSLATE; } },
                      { description: "scale tween",
                        prepare: function() { tween_type = anm.C.T_SCALE; } },
                      { description: "rotate tween",
                        prepare: function() { tween_type = anm.C.T_ROTATE; } },
                      { description: "rotate-to-path tween",
                        prepare: function() { tween_type = anm.C.T_ROT_TO_PATH; } },
                      { description: "or alpha tween",
                        prepare: function() { tween_type = anm.C.T_ALPHA; } }
                ], function() {

                    it("should pass null band if band is not specified", function() {
                        bld.tween(tween_type);

                        expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                   band: jasmine.undefined,
                                                                   data: jasmine.undefined,
                                                                   easing: jasmine.undefined });

                        expect(addModifierSpy).toHaveBeenCalledWith(anm.Element.TWEEN_MOD,
                                                                    anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                    jasmine.undefined,
                                                                    jasmine.any(Function), // anm.Tweens[tween_type]()
                                                                    jasmine.undefined,
                                                                    jasmine.undefined);
                    });

                    it("should apply a band, at least", function() {

                        bld.tween(tween_type, tween_band);
                        expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                   band: tween_band,
                                                                   data: jasmine.undefined,
                                                                   easing: jasmine.undefined });

                        expect(addModifierSpy).toHaveBeenCalledWith(anm.Element.TWEEN_MOD,
                                                                    anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                    tween_band,
                                                                    jasmine.any(Function), // anm.Tweens[tween_type]()
                                                                    jasmine.undefined,
                                                                    jasmine.undefined);

                    });

                    it("should apply data to a tween", function() {
                        // FIXME: we cannot check here if data was actually passed to a tween function, however it will be
                        // checked in action for separate types of tweens in the tests below

                        var data = { 'foo': 'bar' };

                        bld.tween(tween_type, tween_band, data);
                        expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                   band: tween_band,
                                                                   data: data,
                                                                   easing: jasmine.undefined });

                        expect(addModifierSpy).toHaveBeenCalledWith(anm.Element.TWEEN_MOD,
                                                                    anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                    tween_band,
                                                                    jasmine.any(Function), // anm.Tweens[tween_type]()
                                                                    jasmine.undefined,
                                                                    data);
                    });

                    it("should apply predefined easing to a tween", function() {
                        var easing = anm.C.E_INOUT; // all of the types are tested in modifiers spec

                        bld.tween(tween_type, tween_band, null, easing);
                        expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                   band: tween_band,
                                                                   data: null,
                                                                   easing: easing });

                        expect(addModifierSpy).toHaveBeenCalledWith(anm.Element.TWEEN_MOD,
                                                                    anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                    tween_band,
                                                                    jasmine.any(Function), // anm.Tweens[tween_type]()
                                                                    easing,
                                                                    null);
                    });

                    it("should apply function-based easing to a tween", function() {
                        // FIXME: we cannot check here if easing was actually passed to a tween function, however it will be
                        // checked in the tests below

                        var easing = function(t) { };

                        bld.tween(tween_type, tween_band, null, easing);
                        expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                   band: tween_band,
                                                                   data: null,
                                                                   easing: easing });

                        expect(addModifierSpy).toHaveBeenCalledWith(anm.Element.TWEEN_MOD,
                                                                    anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                    tween_band,
                                                                    jasmine.any(Function), // anm.Tweens[tween_type]()
                                                                    easing,
                                                                    null);

                    });

                    it("should apply predefined easing with data to a tween", function() {
                        var easing = anm.C.E_PATH; // all of the types are tested in modifiers spec
                        var easing_path = 'M10 10 L12 12 Z';
                        var built_easing = B.easingP(easing_path);

                        bld.tween(tween_type, tween_band, null, B.easingP(easing_path)); //, easing
                        expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                   band: tween_band,
                                                                   data: null,
                                                                   easing: built_easing });

                        expect(addModifierSpy).toHaveBeenCalledWith(anm.Element.TWEEN_MOD,
                                                                    anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                    tween_band,
                                                                    jasmine.any(Function), // anm.Tweens[tween_type]()
                                                                    built_easing,
                                                                    null);
                    });

                    it("should apply function-based easing with data to a tween", function() {

                        var easing = function(t) { };
                        var easing_data = { 'foo': 'bar' };
                        var built_easing = B.easingF(easing, easing_data);

                        // TODO: add ability to pass function as easing

                        bld.tween(tween_type, tween_band, null, built_easing); //, easing
                        expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                   band: tween_band,
                                                                   data: null,
                                                                   easing: built_easing });

                        expect(addModifierSpy).toHaveBeenCalledWith(anm.Element.TWEEN_MOD,
                                                                    anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                    tween_band,
                                                                    jasmine.any(Function), // anm.Tweens[tween_type]()
                                                                    built_easing,
                                                                    null);

                    });

                }
            );

        });


    });

    // TODO: test creating custom tweens or it is the same as modifiers?

    describe("different types of tweens", function() {

        var player;

        var FPS = 40;

        var CLOSE_FACTOR = 14;

        beforeEach(function() {

            spyOn(document, 'getElementById').andReturn(_mocks.canvas);
            _fake(_Fake.CVS_POS);

            _FrameGen.enable(FPS);

            // preview mode is enabled not to mess with still-preview used for video-mode
            // (it calls drawAt and causes modifiers to be called once more before starting playing)
            player = createPlayer('test-id', { mode: anm.C.M_PREVIEW });
        });

        afterEach(function() { _FrameGen.disable(); });

        var _duration = 2;

        function checkTweens(band, tweens, checking_f, message) {
            var scene = b();
            var elm = b().band(band);
            scene.add(elm);
            doAsync(player, {
                prepare: function() {
                    _each(tweens, function(tween) {
                        var method = tween[0],
                            attrs = tween.slice(1);
                        elm[method].apply(elm, attrs);
                    });
                    elm.modify(function(t, duration, data) {
                        /* if (!checking_f(this, t, player.state.time)) {
                            throw new Error(message || 'Time check failed');
                        } */
                        //return false;
                        checking_f(this, t, player.state.time);
                    });
                    return scene;
                },
                do: 'play', until: anm.C.STOPPED, timeout: _duration + .2
            });
        }

        describe("translate tween", function() {

            describe("should change x/y values of the state according to given direction for a single tween", function() {

                it("works in case of simple values", function() {
                    checkTweens([0, 1],
                                [ [ 'trans', [ 0, 1 ], [[0, 0], [10, 10]] ] ],
                                function(s, t, at) {
                                    expect(s.x).toBeCloseTo(at * 10, CLOSE_FACTOR);
                                    expect(s.y).toBeCloseTo(at * 10, CLOSE_FACTOR);
                                });
                });

                it("works in case of mixed values (incl. negative)", function() {
                    checkTweens([0, 1],
                                [ [ 'trans', [ 0, 1 ], [[12, 15], [8, -11]] ] ],
                                function(s, t, at) {
                                    expect(s.x).toBeCloseTo(12 + (at * (8 - 12)), CLOSE_FACTOR);
                                    expect(s.y).toBeCloseTo(15 + (at * (-11 - 15)), CLOSE_FACTOR);
                                });
                });

                it("works in case of floating values", function() {
                    checkTweens([0, 1],
                            [ [ 'trans', [ 0, 1 ], [[13, -17.1], [8.5, -11]] ] ],
                            function(s, t, at) {
                                expect(s.x).toBeCloseTo(13 +    (at * (8.5 - 13)), CLOSE_FACTOR);
                                expect(s.y).toBeCloseTo(-17.1 + (at * (-11 - -17.1)), CLOSE_FACTOR);
                            });
                });

                /* TODO:

                it("works in case of band not equal to element's band", function() {
                    checkTweens([.2, 1],
                                [ [ 'trans', [.1, .65], [[5, 10], [16, 17]] ] ],
                                function(s, t, at) {
                                    console.log(t, at, s.x, s.y);
                                    if (at < (.2 + .1)) {
                                        expect(s.x).toBe(5);
                                        expect(s.y).toBe(10);
                                        return true;
                                    }
                                    if (at > (.2 + .1 + .65)) {
                                        expect(s.x).toBe(16);
                                        expect(s.y).toBe(17);
                                        return true;
                                    }
                                    expect(s.x).toBeCloseTo(5  + (at - .1 - .2) * (16 - 5)  * (.65 - .1), CLOSE_FACTOR);
                                    expect(s.y).toBeCloseTo(10 + (at - .1 - .2) * (17 - 10) * (.65 - .1), CLOSE_FACTOR);
                                });
                }); */

            });

            describe("should sum x/y values of the state according to given direction for an overlapping tweens in a band of element", function() {



            });

            // TODO: test among with move()

        });

        // TODO: do we need to check matrix?

        // test tweens with no bands
        // translate tween should call translate by path
        // test translate by path separately
        // test fails if no data specified
        // should increase x/y values

        // FIXME: test that applying any tween calls b().modify

    });

    // TODO: ensure that tweens modifier is always new (instead, it rises an error that the element
    //       has this modifier already)
    // TODO: test the case when several tweens overlap (they always overlap now), test that state is changed correctly

    // TODO: check how tweens affect matrices, for single elements and for groups ?

});

// Tweens are called with values from 0 to 1, but modifiers with actual time, should it be changed?

// TODO: test working with bands
// TODO: test untweening