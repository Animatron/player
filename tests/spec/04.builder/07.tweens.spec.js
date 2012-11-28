describe("tweens", function() {

    var b = Builder._$,
        B = Builder;

    describe("static modification", function() {

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

    });

    describe("while in playing", function() {

        // TODO: test creating custom tweens or it is the same as modifiers?

        var player;

        var FPS = 40;

        var CLOSE_FACTOR = 11;

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
                        checking_f(this, player.state.time, t);
                    });
                    return scene;
                },
                do: 'play', until: anm.C.STOPPED, timeout: _duration + .2
            });
        }

        describe("the way tweens apply, by type", function() {

            it("keeps default values in state when there are no tweens", function() {
                checkTweens([0, 1],
                            [ ],
                            function(s, at) {
                                expect(s.x).toBe(0);
                                expect(s.y).toBe(0);
                                expect(s.sx).toBe(1);
                                expect(s.sy).toBe(1);
                                expect(s.angle).toBe(0);
                                expect(s.alpha).toBe(1);
                            });
            });

            describe("translate tween", function() {

                describe("single one", function() {

                    describe("will change x/y values of the state according to given direction", function() {

                        it("works in case of simple values", function() {
                            checkTweens([0, 1],
                                        [ [ 'trans', [ 0, 1 ], [[0, 0], [10, 10]] ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo(at * 10, CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(at * 10, CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of zero", function() {
                            checkTweens([0, 1],
                                        [ [ 'trans', [ 0, 1 ], [[0, 11], [20, 0]] ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo( 0 + at * (20 -  0), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(11 + at * ( 0 - 11), CLOSE_FACTOR);
                                        });

                            // both zero?
                        });

                        it("works in case of mixed values (incl. negative)", function() {
                            checkTweens([0, 1],
                                        [ [ 'trans', [ 0, 1 ], [[12, 15], [8, -11]] ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo(12 + (at * (    8 - 12)), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(15 + (at * ((-11) - 15)), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of floating values", function() {
                            checkTweens([0, 1],
                                        [ [ 'trans', [ 0, 1 ], [[13, -17.1], [8.5, -11]] ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo(     13 + (at * (  8.5 -      13)), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo((-17.1) + (at * ((-11) - (-17.1))), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of band not equal to element's band", function() {
                            checkTweens([.2, 2],
                                        [ [ 'trans', [.1, 1.65], [[5, 10], [16, 17]] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at < (.2 + .1)) {
                                                expect(s.x).toBe(5);
                                                expect(s.y).toBe(10);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.2 + 1.65)) {
                                                expect(s.x).toBe(16);
                                                expect(s.y).toBe(17);
                                                return true;
                                            }
                                            // during the tween
                                            expect(s.x).toBeCloseTo( 5 + (((at - .2 - .1) / (1.65 - .1)) * (16 -  5)), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(10 + (((at - .2 - .1) / (1.65 - .1)) * (17 - 10)), CLOSE_FACTOR);
                                        });
                        });

                    });

                });

                describe("several ones", function() {

                    describe("default implementation", function() {

                        describe("will override x/y values with ones from the last modifier of the state according to given direction", function() {

                            describe("non-overlapping bands", function() {

                                it("last-added modifier goes after the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'trans', [  .3,   .9 ], [[6,  4], [9,    15]] ],
                                                  [ 'trans', [ 1.1, 1.85 ], [[3, 19], [8.4, -11]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.x).toBe(3);
                                                        expect(s.y).toBe(19);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + 1.85)) {
                                                        expect(s.x).toBeCloseTo( 3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo(19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe(8.4);
                                                    expect(s.y).toBe(-11);
                                                });
                                });

                                it("last-added modifier goes before the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'trans', [ 1.1, 1.85 ], [[3, 19], [8.4, -11]] ],
                                                  [ 'trans', [  .3,   .9 ], [[6,  4], [9,    15]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.x).toBe(6);
                                                        expect(s.y).toBe(4);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + .9)) {
                                                        expect(s.x).toBeCloseTo(6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo(4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe(9);
                                                    expect(s.y).toBe(15);
                                                });
                                });

                            });

                            describe("overlapping bands", function() {

                                it("last-added modifier starting point goes after the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'trans', [.12,    .9 ], [[ 5, 12], [3.2, 40]] ],
                                                  [ 'trans', [ .5,  1.56 ], [[-1,  9], [0,   16]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .5)) {
                                                        expect(s.x).toBe(-1);
                                                        expect(s.y).toBe( 9);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + 1.56)) {
                                                        expect(s.x).toBeCloseTo(-1 + (((at - .5 - .2) / (1.56 - .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo( 9 + (((at - .5 - .2) / (1.56 - .5)) * (16 -    9)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe( 0);
                                                    expect(s.y).toBe(16);
                                                });
                                });

                                it("last-added modifier starting point goes before the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'trans', [ .5,  1.56 ], [[-1,  9], [0,   16]] ],
                                                  [ 'trans', [.12,    .9 ], [[ 5, 12], [3.2, 40]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.x).toBe(5);
                                                        expect(s.y).toBe(12);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + .9)) {
                                                        expect(s.x).toBeCloseTo( 5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo(12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe(3.2);
                                                    expect(s.y).toBe(40);
                                                });
                                });

                            });

                            it("works with more than two tweens", function() {
                                checkTweens([.1, 3],
                                            [ [ 'trans', [   0,   1 ], [[5, 5], [10, 12]] ],
                                              [ 'trans', [   1, 1.5 ], [[7, 7], [9,  11]] ],
                                              [ 'trans', [ 1.3,   2 ], [[9, 8], [11, 22]] ] ],
                                            function(s, at) {
                                                // before the tween
                                                if (at < (.1 + 1.3)) {
                                                    expect(s.x).toBe(9);
                                                    expect(s.y).toBe(8);
                                                    return true;
                                                }
                                                // after the tween
                                                if (at > (.1 + 2)) {
                                                    expect(s.x).toBe(11);
                                                    expect(s.y).toBe(22);
                                                    return true;
                                                }
                                                // during the tween
                                                expect(s.x).toBeCloseTo(9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                expect(s.y).toBeCloseTo(8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                            });
                            });

                        });

                    });

                    /* // TODO: implement smart technique
                    xdescribe("smart implementation", function() {

                        describe("should sum x/y values of the state according to given direction", function() {

                            it("works with non-overlapping bands", function() {
                                checkTweens([.15, 2],
                                            [ [ 'trans', [  .3,   .9 ], [[6,  4], [9,    15]] ],
                                              [ 'trans', [ 1.1, 1.85 ], [[3, 19], [8.4, -11]] ] ],
                                            function(s, at) {
                                                // before first tween
                                                if (at < (.15 + .3)) {
                                                    expect(s.x).toBe(6 +  3);
                                                    expect(s.y).toBe(4 + 19);
                                                    return true;
                                                }
                                                // during first tween
                                                if (at < (.15 + .9)) {
                                                    expect(s.x).toBeCloseTo( 3 + 6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)),  CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(19 + 4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after first tween, before second
                                                if (at < (.15 + 1.1)) {
                                                    expect(s.x).toBe( 9 +  3);
                                                    expect(s.y).toBe(15 + 19);
                                                    return true;
                                                }
                                                // during second tween
                                                if (at < (.15 + 1.85)) {
                                                    expect(s.x).toBeCloseTo( 9 +  3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(15 + 19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after second tween
                                                expect(s.x).toBe( 9 +   8.4);
                                                expect(s.y).toBe(15 + (-11));
                                            });
                            });

                            it("works with overlapping bands", function() {
                                checkTweens([.2, 1.8],
                                            [ [ 'trans', [.12,    .9 ], [[ 5, 12], [3.2, 40]] ],
                                              [ 'trans', [ .5,  1.56 ], [[-1,  9], [0,   16]] ] ],
                                            function(s, at) {
                                                // before first tween
                                                if (at < (.2 + .12)) {
                                                    expect(s.x).toBe( 5 + (-1));
                                                    expect(s.y).toBe(12 +    9);
                                                    return true;
                                                }
                                                // during first tween, before overlap period
                                                if (at < (.2 + .5)) {
                                                    expect(s.x).toBeCloseTo((-1) +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(   9 + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // during overlap period
                                                if (at < (.2 + .9)) {
                                                    expect(s.x).toBeCloseTo(   5 + (((at - .12 - .2) / (  .9 - .12)) * (3.2 -    5)) +
                                                                            (-1) + (((at -  .5 - .2) / (1.56 -  .5)) * (  0 - (-1))), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(  12 + (((at - .12 - .2) / (  .9 - .12)) * ( 40 -   12)) +
                                                                               9 + (((at -  .5 - .2) / (1.56 -  .5)) * ( 16 -    9)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // during second tween, after overlap period
                                                if (at < (.2 + 1.56)) {
                                                    expect(s.x).toBeCloseTo(3.2 + (-1) + (((at -  .5 - .2) / (1.56 -  .5)) * (  0 - (-1))), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo( 40 +    9 + (((at -  .5 - .2) / (1.56 -  .5)) * ( 16 -    9)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after second tween
                                                expect(s.x).toBe(3.2 +  0);
                                                expect(s.y).toBe( 40 + 16);
                                            });
                            });

                            // it("works with more than two tweens", function() {
                            //     checkTweens([0, 3],
                            //                 [ [ 'trans', [   0,   1 ], [[5, 5], [10, 12]] ],
                            //                   [ 'trans', [   1, 1.5 ], [[7, 7], [9,  11]] ],
                            //                   [ 'trans', [ 1.5, 1.5 ], [[9, 8], [11, 22]] ] ],
                            //                 function(s, at) {

                            //                 });
                            // });

                        });

                    }); */

                    // TODO: test among with move()

                });

            });

            describe("translate-to-path tween", function() {

                describe("single one", function() {

                    describe("will change x/y values of the state according to given direction", function() {

                        it("works in case of simple values", function() {
                            checkTweens([0, 1],
                                        [ [ 'transP', [ 0, 1 ], 'M1 1 L12 12 Z' ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo(1 + at * (12 - 1), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(1 + at * (12 - 1), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of zero", function() {
                            checkTweens([0, 1],
                                        [ [ 'transP', [ 0, 1 ], 'M0 11 L20 0 Z' ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo( 0 + at * (20 -  0), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(11 + at * ( 0 - 11), CLOSE_FACTOR);
                                        });

                            // both zero?
                        });

                        it("works in case of mixed values (incl. negative)", function() {
                            checkTweens([0, 1],
                                        [ [ 'transP', [ 0, 1 ], 'M12 15 L8 -11 Z' ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo(12 + (at * (    8 - 12)), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(15 + (at * ((-11) - 15)), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of floating values", function() {
                            checkTweens([0, 1],
                                        [ [ 'transP', [ 0, 1 ], 'M13 -17.1 L8.5 -11 Z' ] ],
                                        function(s, at) {
                                            expect(s.x).toBeCloseTo(     13 + (at * (  8.5 -      13)), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo((-17.1) + (at * ((-11) - (-17.1))), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of band not equal to element's band", function() {
                            checkTweens([.2, 2],
                                        [ [ 'transP', [.1, 1.65], 'M5 10 L16 17 Z' ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at < (.2 + .1)) {
                                                expect(s.x).toBe(5);
                                                expect(s.y).toBe(10);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.2 + 1.65)) {
                                                expect(s.x).toBe(16);
                                                expect(s.y).toBe(17);
                                                return true;
                                            }
                                            // during the tween
                                            expect(s.x).toBeCloseTo( 5 + (((at - .2 - .1) / (1.65 - .1)) * (16 -  5)), CLOSE_FACTOR);
                                            expect(s.y).toBeCloseTo(10 + (((at - .2 - .1) / (1.65 - .1)) * (17 - 10)), CLOSE_FACTOR);
                                        });
                        });

                    });

                });

                describe("several ones", function() {

                    describe("default implementation", function() {

                        describe("will override x/y values of the state according to given direction", function() {

                            describe("non-overlapping bands", function() {

                                it("last-added modifier goes just after the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'transP', [  .3,   .9 ], 'M6 4 L9 15 Z'     ],
                                                  [ 'transP', [ 1.1, 1.85 ], 'M3 19 L8.4 -11 Z' ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.x).toBe(3);
                                                        expect(s.y).toBe(19);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + 1.85)) {
                                                        expect(s.x).toBeCloseTo( 3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo(19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe(8.4);
                                                    expect(s.y).toBe(-11);
                                                });
                                });

                                it("last-added modifier goes just before the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'transP', [ 1.1, 1.85 ], 'M3 19 L8.4 -11 Z' ],
                                                  [ 'transP', [  .3,   .9 ], 'M6 4 L9 15 Z'     ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.x).toBe(6);
                                                        expect(s.y).toBe(4);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + .9)) {
                                                        expect(s.x).toBeCloseTo(6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo(4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe(9);
                                                    expect(s.y).toBe(15);
                                                });
                                });

                            });

                            describe("overlapping bands", function() {

                                it("last-added modifier starting point goes after the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'transP', [.12,    .9 ], 'M5 12 L3.2 40 Z' ],
                                                  [ 'transP', [ .5,  1.56 ], 'M-1 9 L0 16 Z'   ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .5)) {
                                                        expect(s.x).toBe(-1);
                                                        expect(s.y).toBe( 9);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + 1.56)) {
                                                        expect(s.x).toBeCloseTo(-1 + (((at - .5 - .2) / (1.56 - .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo( 9 + (((at - .5 - .2) / (1.56 - .5)) * (16 -    9)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe( 0);
                                                    expect(s.y).toBe(16);
                                                });
                                });

                                it("last-added modifier starting point goes before the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'transP', [ .5,  1.56 ], 'M-1 9 L0 16 Z'   ],
                                                  [ 'transP', [.12,    .9 ], 'M5 12 L3.2 40 Z' ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.x).toBe(5);
                                                        expect(s.y).toBe(12);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + .9)) {
                                                        expect(s.x).toBeCloseTo( 5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                        expect(s.y).toBeCloseTo(12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.x).toBe(3.2);
                                                    expect(s.y).toBe(40);
                                                });
                                });


                            });

                            it("works with more than two tweens", function() {
                                checkTweens([.1, 3],
                                            [ [ 'transP', [   0,   1 ], 'M5 5 L10 12 Z' ],
                                              [ 'transP', [   1, 1.5 ], 'M7 7 L9 11 Z'  ],
                                              [ 'transP', [ 1.3,   2 ], 'M9 8 L11 22 Z' ] ],
                                            function(s, at) {
                                                // before the tween
                                                if (at < (.1 + 1.3)) {
                                                    expect(s.x).toBe(9);
                                                    expect(s.y).toBe(8);
                                                    return true;
                                                }
                                                // after the tween
                                                if (at > (.1 + 2)) {
                                                    expect(s.x).toBe(11);
                                                    expect(s.y).toBe(22);
                                                    return true;
                                                }
                                                // during the tween
                                                expect(s.x).toBeCloseTo(9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                expect(s.y).toBeCloseTo(8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                            });
                            });

                        });

                    });

                    /* TODO:
                    xdescribe("smart implementation", function() {

                        describe("should sum x/y values of the state according to given direction for several tweens in a band of element", function() {

                            it("works with non-overlapping bands", function() {
                                checkTweens([.15, 2],
                                            [ [ 'transP', [  .3,   .9 ], 'M6 4 L9 15 Z' ],
                                              [ 'transP', [ 1.1, 1.85 ], 'M3 19 L8.4 -11 Z' ] ],
                                            function(s, at) {
                                                // before first tween
                                                if (at < (.15 + .3)) {
                                                    expect(s.x).toBe(6 +  3);
                                                    expect(s.y).toBe(4 + 19);
                                                    return true;
                                                }
                                                // during first tween
                                                if (at < (.15 + .9)) {
                                                    expect(s.x).toBeCloseTo( 3 + 6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)),  CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(19 + 4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after first tween, before second
                                                if (at < (.15 + 1.1)) {
                                                    expect(s.x).toBe( 9 +  3);
                                                    expect(s.y).toBe(15 + 19);
                                                    return true;
                                                }
                                                // during second tween
                                                if (at < (.15 + 1.85)) {
                                                    expect(s.x).toBeCloseTo( 9 +  3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(15 + 19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after second tween
                                                expect(s.x).toBe( 9 +   8.4);
                                                expect(s.y).toBe(15 + (-11));
                                            });
                            });

                            it("works with overlapping bands", function() {
                                checkTweens([.2, 1.8],
                                            [ [ 'transP', [.12,    .9 ], 'M5 12 L3.2 40 Z' ],
                                              [ 'transP', [ .5,  1.56 ], 'M-1 9 L0 16 Z' ] ],
                                            function(s, at) {
                                                // before first tween
                                                if (at < (.2 + .12)) {
                                                    expect(s.x).toBe( 5 + (-1));
                                                    expect(s.y).toBe(12 +    9);
                                                    return true;
                                                }
                                                // during first tween, before overlap period
                                                if (at < (.2 + .5)) {
                                                    expect(s.x).toBeCloseTo((-1) +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(   9 + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // during overlap period
                                                if (at < (.2 + .9)) {
                                                    expect(s.x).toBeCloseTo(   5 + (((at - .12 - .2) / (  .9 - .12)) * (3.2 -    5)) +
                                                                            (-1) + (((at -  .5 - .2) / (1.56 -  .5)) * (  0 - (-1))), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo(  12 + (((at - .12 - .2) / (  .9 - .12)) * ( 40 -   12)) +
                                                                               9 + (((at -  .5 - .2) / (1.56 -  .5)) * ( 16 -    9)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // during second tween, after overlap period
                                                if (at < (.2 + 1.56)) {
                                                    expect(s.x).toBeCloseTo(3.2 + (-1) + (((at -  .5 - .2) / (1.56 -  .5)) * (  0 - (-1))), CLOSE_FACTOR);
                                                    expect(s.y).toBeCloseTo( 40 +    9 + (((at -  .5 - .2) / (1.56 -  .5)) * ( 16 -    9)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after second tween
                                                expect(s.x).toBe(3.2 +  0);
                                                expect(s.y).toBe( 40 + 16);
                                            });
                            });

                            // it("works with more than two tweens", function() {
                            //     checkTweens([0, 3],
                            //                 [ [ 'transP', [   0,   1 ], ... ],
                            //                   [ 'transP', [   1, 1.5 ], ... ],
                            //                   [ 'transP', [ 1.5, 1.5 ], ... ] ],
                            //                 function(s, at) {
                            //
                            //                 });
                            // });

                        });

                    });*/

                });

                // TODO: test among with move()
                // TODO: test curve segments or combinations?

            });

            describe("scale tween", function() {

                describe("single one", function() {

                    describe("will change sx/sy values of the state according to given values", function() {

                        it("works in case of simple values", function() {
                            checkTweens([0, 1],
                                        [ [ 'scale', [ 0, 1 ], [ [2, 3], [10, 20] ] ] ],
                                        function(s, at) {
                                            expect(s.sx).toBeCloseTo((2 * (1.0 - at)) + (10 * at), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((3 * (1.0 - at)) + (20 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of zero", function() {
                            checkTweens([0, 1],
                                        [ [ 'scale', [ 0, 1 ], [ [0, 3], [4, 0] ] ] ],
                                        function(s, at) {
                                            expect(s.sx).toBeCloseTo((0 * (1.0 - at)) + (4 * at), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((3 * (1.0 - at)) + (0 * at), CLOSE_FACTOR);
                                        });

                            // both zero?
                        });

                        it("works in case of mixed values (incl. negative)", function() {
                            checkTweens([0, 1],
                                        [ [ 'scale', [ 0, 1 ], [ [-1, 3], [11, -5] ] ] ],
                                        function(s, at) {
                                            expect(s.sx).toBeCloseTo(((-1) * (1.0 - at)) + (  11 * at), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((   3 * (1.0 - at)) + ((-5) * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of floating values", function() {
                            checkTweens([0, 1],
                                        [ [ 'scale', [ 0, 1 ], [ [-1.1, 2.3], [6, 14.7] ] ] ],
                                        function(s, at) {
                                            expect(s.sx).toBeCloseTo(((-1.1) * (1.0 - at)) + (6    * at), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((   2.3 * (1.0 - at)) + (14.7 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of band not equal to element's band", function() {
                            checkTweens([.2, 2],
                                        [ [ 'scale', [.2, 1.3], [[6, 9], [12, 9.5]] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at < (.2 + .2)) {
                                                expect(s.sx).toBe(6);
                                                expect(s.sy).toBe(9);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.2 + 1.3)) {
                                                expect(s.sx).toBe(12);
                                                expect(s.sy).toBe(9.5);
                                                return true;
                                            }
                                            // during the tween
                                            var adt = (at - .2 - .2) / (1.3 - .2);
                                            expect(s.sx).toBeCloseTo((6 * (1.0 - adt)) + ( 12 * adt), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((9 * (1.0 - adt)) + (9.5 * adt), CLOSE_FACTOR);
                                        });
                        });

                    });

                });

                describe("several ones", function() {

                    describe("default implementation", function() {

                        describe("will override sx/sy values of the state according to given values", function() {

                            describe("non-overlapping bands", function() {

                                it("last-added modifier goes just after the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'scale', [  .3,   .9 ], [[6,  4], [  9,  15]] ],
                                                  [ 'scale', [ 1.1, 1.83 ], [[3, 19], [8.4, -11]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.sx).toBe(3);
                                                        expect(s.sy).toBe(19);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + 1.83)) {
                                                        expect(s.sx).toBeCloseTo( 3 + (((at - 1.1 - .15) / (1.83 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo(19 + (((at - 1.1 - .15) / (1.83 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe(8.4);
                                                    expect(s.sy).toBe(-11);
                                                });

                                });

                                it("last-added modifier goes just before the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'scale', [ 1.1, 1.83 ], [[3, 19], [8.4, -11]] ],
                                                  [ 'scale', [  .3,   .9 ], [[6,  4], [  9,  15]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.sx).toBe(6);
                                                        expect(s.sy).toBe(4);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + .9)) {
                                                        expect(s.sx).toBeCloseTo(6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo(4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe(9);
                                                    expect(s.sy).toBe(15);
                                                });
                                });

                            });

                            describe("overlapping bands", function() {

                                it("last-added modifier starting point goes after the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'scale', [.12,   .9], [[ 5, 12], [3.2, 40]] ],
                                                  [ 'scale', [.54, 1.63], [[-1,  9], [  0, 16]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .54)) {
                                                        expect(s.sx).toBe(-1);
                                                        expect(s.sy).toBe( 9);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + 1.63)) {
                                                        expect(s.sx).toBeCloseTo(-1 + (((at - .54 - .2) / (1.63 - .54)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo( 9 + (((at - .54 - .2) / (1.63 - .54)) * (16 -    9)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe( 0);
                                                    expect(s.sy).toBe(16);
                                                });
                                });

                                it("last-added modifier starting point goes before the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'scale', [.54, 1.63], [[-1,  9], [  0, 16]] ],
                                                  [ 'scale', [.12,   .9], [[ 5, 12], [3.2, 40]] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.sx).toBe(5);
                                                        expect(s.sy).toBe(12);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + .9)) {
                                                        expect(s.sx).toBeCloseTo( 5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo(12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe(3.2);
                                                    expect(s.sy).toBe(40);
                                                });
                                });


                            });

                            it("works with more than two tweens", function() {
                                checkTweens([.1, 3],
                                            [ [ 'scale', [   0,   1 ], [ [5, 5], [10, 12] ] ],
                                              [ 'scale', [   1, 1.5 ], [ [7, 7], [ 9, 11] ] ],
                                              [ 'scale', [ 1.3,   2 ], [ [9, 8], [11, 22] ] ] ],
                                            function(s, at) {
                                                // before the tween
                                                if (at < (.1 + 1.3)) {
                                                    expect(s.sx).toBe(9);
                                                    expect(s.sy).toBe(8);
                                                    return true;
                                                }
                                                // after the tween
                                                if (at > (.1 + 2)) {
                                                    expect(s.sx).toBe(11);
                                                    expect(s.sy).toBe(22);
                                                    return true;
                                                }
                                                // during the tween
                                                expect(s.sx).toBeCloseTo(9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                expect(s.sy).toBeCloseTo(8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                            });
                            });

                        });

                    });

                    /* TODO: xdescribe("smart implementation", function() {

                        it("works with non-overlapping bands", function() {
                            checkTweens([.15, 2],
                                        [ [ 'scale', [  .3,   .9 ], [[6,  4], [  9,  15]] ],
                                          [ 'scale', [ 1.1, 1.83 ], [[3, 19], [8.4, -11]] ] ],
                                        function(s, at) {
                                            // before first tween
                                            if (at < (.15 + .3)) {
                                                expect(s.sx).toBe(6 *  3);
                                                expect(s.sy).toBe(4 * 19);
                                                return true;
                                            }
                                            // during first tween
                                            if (at < (.15 + .9)) {
                                                var adt = (at - .3 - .15) / (.9 - .3);
                                                expect(s.sx).toBeCloseTo( 3 * ((6 * (1.0 - adt)) + ( 9 * adt)), CLOSE_FACTOR);
                                                expect(s.sy).toBeCloseTo(19 * ((4 * (1.0 - adt)) + (15 * adt)), CLOSE_FACTOR);
                                                return true;
                                            }
                                            // after first tween, before second
                                            if (at < (.15 + 1.1)) {
                                                expect(s.sx).toBe(9  *  3);
                                                expect(s.sy).toBe(15 * 19);
                                                return true;
                                            }
                                            // during second tween
                                            if (at < (.15 + 1.83)) {
                                                var adt = (at - 1.1 - .15) / (1.83 - 1.1);
                                                expect(s.sx).toBeCloseTo( 9 * (( 3 * (1.0 - adt)) + (  8.4 * adt)), CLOSE_FACTOR);
                                                expect(s.sy).toBeCloseTo(15 * ((19 * (1.0 - adt)) + ((-11) * adt)), CLOSE_FACTOR);
                                                return true;
                                            }
                                            // after second tween
                                            expect(s.sx).toBe( 9 *   8.4);
                                            expect(s.sy).toBe(15 * (-11));
                                        });
                        });

                        it("works with overlapping bands", function() {
                            checkTweens([.2, 1.8],
                                        [ [ 'scale', [.12,   .9], [[ 5, 12], [3.2, 40]] ],
                                          [ 'scale', [.54, 1.63], [[-1,  9], [  0, 16]] ] ],
                                        function(s, at) {
                                            // before first tween
                                            if (at < (.2 + .12)) {
                                                expect(s.sx).toBe( 5 * (-1));
                                                expect(s.sy).toBe(12 *    9);
                                                return true;
                                            }
                                            // during first tween, before overlap period
                                            if (at < (.2 + .54)) {
                                                var adt = (at - .12 - .2) / (.9 - .12);
                                                expect(s.sx).toBeCloseTo((-1) * (( 5 * (1.0 - adt)) + (3.2 * adt)), CLOSE_FACTOR);
                                                expect(s.sy).toBeCloseTo(   9 * ((12 * (1.0 - adt)) + ( 40 * adt)), CLOSE_FACTOR);
                                                return true;
                                            }
                                            // during overlap period
                                            if (at < (.2 + .9)) {
                                                var adt1 = (at - .12 - .2) / (  .9 - .12),
                                                    adt2 = (at - .54 - .2) / (1.63 - .54);
                                                expect(s.sx).toBeCloseTo(((   5 * (1.0 - adt1)) + (3.2 * adt1)) *
                                                                         (((-1) * (1.0 - adt2)) + (  0 * adt2)), CLOSE_FACTOR);
                                                expect(s.sy).toBeCloseTo(((  12 * (1.0 - adt1)) + ( 40 * adt1)) *
                                                                         ((   9 * (1.0 - adt2)) + ( 16 * adt2)), CLOSE_FACTOR);
                                                return true;
                                            }
                                            // during second tween, after overlap period
                                            if (at < (.2 + 1.63)) {
                                                var adt = (at - .54 - .2) / (1.63 - .54);
                                                expect(s.sx).toBeCloseTo(3.2 * (((-1) * (1.0 - adt)) + ( 0 * adt)), CLOSE_FACTOR);
                                                expect(s.sy).toBeCloseTo( 40 * ((   9 * (1.0 - adt)) + (16 * adt)), CLOSE_FACTOR);
                                                return true;
                                            }
                                            // after second tween
                                            expect(s.sx).toBe(3.2 *  0);
                                            expect(s.sy).toBe( 40 * 16);
                                        });
                        });

                        // it("works with more than two tweens", function() {
                        //    checkTweens([0, 3],
                        //                [ [ 'scale', [   0,   1 ], [[5, 5], [10, 12]] ],
                        //                  [ 'scale', [   1, 1.5 ], [[7, 7], [9,  11]] ],
                        //                  [ 'scale', [ 1.5, 1.5 ], [[9, 8], [11, 22]] ] ],
                        //                function(s, at) {
                        //
                        //                });
                        // });

                    }); */

                });

            });

            describe("xscale tween", function() {

                describe("single one", function() {

                    describe("will change sx/sy values of the state according to given values", function() {

                        it("works in case of simple values", function() {
                            checkTweens([0, 1],
                                        [ [ 'xscale', [ 0, 1 ], [2, 20] ] ],
                                        function(s, at) {
                                            expect(s.sx).toBeCloseTo((2 * (1.0 - at)) + (20 * at), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((2 * (1.0 - at)) + (20 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of mixed values (incl. negative)", function() {
                            checkTweens([0, 1],
                                        [ [ 'xscale', [ 0, 1 ], [-1, 3] ] ],
                                        function(s, at) {
                                            expect(s.sx).toBeCloseTo(((-1) * (1.0 - at)) + (3 * at), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo(((-1) * (1.0 - at)) + (3 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of floating values", function() {
                            checkTweens([0, 1],
                                        [ [ 'xscale', [ 0, 1 ], [6, 14.7] ] ],
                                        function(s, at) {
                                            expect(s.sx).toBeCloseTo((6 * (1.0 - at)) + (14.7 * at), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((6 * (1.0 - at)) + (14.7 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of band not equal to element's band", function() {
                            checkTweens([.2, 2],
                                        [ [ 'xscale', [.25, 1.3], [12, 9.5] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at < (.2 + .25)) {
                                                expect(s.sx).toBe(12);
                                                expect(s.sy).toBe(12);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.2 + 1.3)) {
                                                expect(s.sx).toBe(9.5);
                                                expect(s.sy).toBe(9.5);
                                                return true;
                                            }
                                            // during the tween
                                            var adt = (at - .25 - .2) / (1.3 - .25);
                                            expect(s.sx).toBeCloseTo((12 * (1.0 - adt)) + (9.5 * adt), CLOSE_FACTOR);
                                            expect(s.sy).toBeCloseTo((12 * (1.0 - adt)) + (9.5 * adt), CLOSE_FACTOR);
                                        });
                        });

                    });

                });


                describe("several ones", function() {

                    describe("default implementation", function() {

                        describe("will override sx/sy values of the state according to given values", function() {

                            describe("non-overlapping bands", function() {

                                it("last-added modifier goes just after the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'xscale', [ .3,   .9], [  4,  15] ],
                                                  [ 'xscale', [1.1, 1.73], [8.4, -11] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.sx).toBe(8.4);
                                                        expect(s.sy).toBe(8.4);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + 1.73)) {
                                                        expect(s.sx).toBeCloseTo(8.4 + (((at - 1.1 - .15) / (1.73 - 1.1)) * ((-11) - 8.4)), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo(8.4 + (((at - 1.1 - .15) / (1.73 - 1.1)) * ((-11) - 8.4)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe(-11);
                                                    expect(s.sy).toBe(-11);
                                                });

                                });

                                it("last-added modifier goes just before the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'xscale', [1.1, 1.73], [8.4, -11] ],
                                                  [ 'xscale', [ .3,   .9], [  4,  15] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.sx).toBe(4);
                                                        expect(s.sy).toBe(4);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.15 + .9)) {
                                                        expect(s.sx).toBeCloseTo(4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo(4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe(15);
                                                    expect(s.sy).toBe(15);
                                                });
                                });

                            });

                            describe("overlapping bands", function() {

                                it("last-added modifier starting point goes after the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'xscale', [.12,   .9 ], [3.2, 40] ],
                                                  [ 'xscale', [.54, 1.63 ], [ .2, 16] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .54)) {
                                                        expect(s.sx).toBe(.2);
                                                        expect(s.sy).toBe(.2);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + 1.63)) {
                                                        expect(s.sx).toBeCloseTo(.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2)), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo(.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe(16);
                                                    expect(s.sy).toBe(16);
                                                });
                                });

                                it("last-added modifier starting point goes before the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'xscale', [.54,  1.63 ], [ .2, 16] ],
                                                  [ 'xscale', [.12,    .9 ], [3.2, 40] ] ],
                                                function(s, at) {
                                                    // before last-added tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.sx).toBe(3.2);
                                                        expect(s.sy).toBe(3.2);
                                                        return true;
                                                    }
                                                    // during last-added tween
                                                    if (at < (.2 + .9)) {
                                                        expect(s.sx).toBeCloseTo(3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2)), CLOSE_FACTOR);
                                                        expect(s.sy).toBeCloseTo(3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after last-added tween
                                                    expect(s.sx).toBe(40);
                                                    expect(s.sy).toBe(40);
                                                });
                                });


                            });

                            it("works with more than two tweens", function() {
                                checkTweens([.1, 3],
                                            [ [ 'scale', [   0,   1 ], [ [5, 5], [10, 12] ] ],
                                              [ 'scale', [   1, 1.5 ], [ [7, 7], [ 9, 11] ] ],
                                              [ 'scale', [ 1.3,   2 ], [ [9, 8], [11, 22] ] ] ],
                                            function(s, at) {
                                                // before the tween
                                                if (at < (.1 + 1.3)) {
                                                    expect(s.sx).toBe(9);
                                                    expect(s.sy).toBe(8);
                                                    return true;
                                                }
                                                // after the tween
                                                if (at > (.1 + 2)) {
                                                    expect(s.sx).toBe(11);
                                                    expect(s.sy).toBe(22);
                                                    return true;
                                                }
                                                // during the tween
                                                expect(s.sx).toBeCloseTo(9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                expect(s.sy).toBeCloseTo(8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                            });
                            });

                        });

                    });

                    /* TODO:
                    xdescribe("smart implementation", function() {

                        describe("should multiply sx/sy values of the state according to given values for several tweens in a band of element", function() {

                            it("works with non-overlapping bands", function() {
                                checkTweens([.15, 2],
                                            [ [ 'xscale', [ .3,   .9], [  4,  15] ],
                                              [ 'xscale', [1.1, 1.73], [8.4, -11] ] ],
                                            function(s, at) {
                                                // before first tween
                                                if (at < (.15 + .3)) {
                                                    expect(s.sx).toBe(4 * 8.4);
                                                    expect(s.sy).toBe(4 * 8.4);
                                                    return true;
                                                }
                                                // during first tween
                                                if (at < (.15 + .9)) {
                                                    var adt = (at - .3 - .15) / (.9 - .3);
                                                    expect(s.sx).toBeCloseTo(8.4 * ((4 * (1.0 - adt)) + (15 * adt)), CLOSE_FACTOR);
                                                    expect(s.sy).toBeCloseTo(8.4 * ((4 * (1.0 - adt)) + (15 * adt)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after first tween, before second
                                                if (at < (.15 + 1.1)) {
                                                    expect(s.sx).toBe(15 * 8.4);
                                                    expect(s.sy).toBe(15 * 8.4);
                                                    return true;
                                                }
                                                // during second tween
                                                if (at < (.15 + 1.73)) {
                                                    var adt = (at - 1.1 - .15) / (1.73 - 1.1);
                                                    expect(s.sx).toBeCloseTo(15 * ((8.4 * (1.0 - adt)) + ((-11) * adt)), CLOSE_FACTOR);
                                                    expect(s.sy).toBeCloseTo(15 * ((8.4 * (1.0 - adt)) + ((-11) * adt)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after second tween
                                                expect(s.sx).toBe(15 * (-11));
                                                expect(s.sy).toBe(15 * (-11));
                                            });
                            });

                            it("works with overlapping bands", function() {
                                checkTweens([.2, 1.8],
                                            [ [ 'xscale', [.12,    .9 ], [3.2, 40] ],
                                              [ 'xscale', [.54,  1.63 ], [ .2, 16] ] ],
                                            function(s, at) {
                                                // before first tween
                                                if (at < (.2 + .12)) {
                                                    expect(s.sx).toBe(3.2 * .2);
                                                    expect(s.sy).toBe(3.2 * .2);
                                                    return true;
                                                }
                                                // during first tween, before overlap period
                                                if (at < (.2 + .54)) {
                                                    var adt = (at - .12 - .2) / (.9 - .12);
                                                    expect(s.sx).toBeCloseTo(.2 * ((3.2 * (1.0 - adt)) + (40 * adt)), CLOSE_FACTOR);
                                                    expect(s.sy).toBeCloseTo(.2 * ((3.2 * (1.0 - adt)) + (40 * adt)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // during overlap period
                                                if (at < (.2 + .9)) {
                                                    var adt1 = (at - .12 - .2) / (  .9 - .12),
                                                        adt2 = (at - .54 - .2) / (1.63 - .54);
                                                    expect(s.sx).toBeCloseTo(((3.2 * (1.0 - adt1)) + (40 * adt1)) *
                                                                             (( .2 * (1.0 - adt2)) + (16 * adt2)), CLOSE_FACTOR);
                                                    expect(s.sy).toBeCloseTo(((3.2 * (1.0 - adt1)) + (40 * adt1)) *
                                                                             (( .2 * (1.0 - adt2)) + (16 * adt2)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // during second tween, after overlap period
                                                if (at < (.2 + 1.63)) {
                                                    var adt = (at - .54 - .2) / (1.63 - .54);
                                                    expect(s.sx).toBeCloseTo(40 * ((.2 * (1.0 - adt)) + (16 * adt)), CLOSE_FACTOR);
                                                    expect(s.sy).toBeCloseTo(40 * ((.2 * (1.0 - adt)) + (16 * adt)), CLOSE_FACTOR);
                                                    return true;
                                                }
                                                // after second tween
                                                expect(s.sx).toBe(40 * 16);
                                                expect(s.sy).toBe(40 * 16);
                                            });
                            });

                            // it("works with more than two tweens", function() {
                            //    checkTweens([0, 3],
                            //                [ [ 'xscale', [   0,   1 ], [[5, 5], [10, 12]] ],
                            //                  [ 'xscale', [   1, 1.5 ], [[7, 7], [9,  11]] ],
                            //                  [ 'xscale', [ 1.5, 1.5 ], [[9, 8], [11, 22]] ] ],
                            //                function(s, at) {
                            //
                            //                });
                            // });

                        });

                    }); */


                });

            });

            describe("rotate tween", function() {

                describe("single one", function() {

                    describe("will change angle value of the state according to given rotation", function() {

                        it("works in case of simple values", function() {
                            checkTweens([0, 1],
                                        [ [ 'rotate', [ 0, 1 ], [Math.PI / 2, Math.PI] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo(((Math.PI / 2) * (1.0 - at)) + (Math.PI * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of zero", function() {
                            checkTweens([0, 1],
                                        [ [ 'rotate', [ 0, 1 ], [0, Math.PI / 3] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo((0 * (1.0 - at)) + ((Math.PI / 3) * at), CLOSE_FACTOR);
                                        });

                            // both zero, left zero?
                        });

                        it("works in case of mixed values (incl. negative)", function() {
                            checkTweens([0, 1],
                                        [ [ 'rotate', [ 0, 1 ], [2 * -(Math.PI / 5), Math.PI / 3] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo(((2 * -(Math.PI / 5)) * (1.0 - at)) + ((Math.PI / 3) * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of floating values", function() {
                            checkTweens([0, 1],
                                        [ [ 'rotate', [ 0, 1 ], [.8 * Math.PI, 2.1 * Math.PI] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo(((.8 * Math.PI) * (1.0 - at)) + ((2.1 * Math.PI) * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of band not equal to element's band", function() {
                            checkTweens([.18, 1.76],
                                        [ [ 'rotate', [.32, 1.64], [Math.PI / 6, Math.PI / 2] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at < (.18 + .32)) {
                                                expect(s.angle).toBe(Math.PI / 6);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.18 + 1.64)) {
                                                expect(s.angle).toBe(Math.PI / 2);
                                                return true;
                                            }
                                            // during the tween
                                            var adt = (at - .32 - .18) / (1.64 - .32);
                                            expect(s.angle).toBeCloseTo(((Math.PI / 6) * (1.0 - adt)) + ((Math.PI / 2) * adt), CLOSE_FACTOR);
                                        });
                        });

                    });

                });

                describe("several ones", function() {

                    describe("default implementation", function() {

                        describe("will override angle value of the state according to given rotation", function() {

                            describe("non-overlapping bands", function() {

                                it("last-added modifier goes just after the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'rotate', [ .3,   .9], [      4,   15] ],
                                                  [ 'rotate', [1.1, 1.81], [Math.PI, 0.11] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.angle).toBe(Math.PI);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.15 + 1.81)) {
                                                        expect(s.angle).toBe(0.11);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                    expect(s.angle).toBeCloseTo((Math.PI * (1.0 - adt)) + (0.11 * adt), CLOSE_FACTOR);
                                                });
                                });

                                it("last-added modifier goes just before the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'rotate', [1.1, 1.81], [Math.PI, 0.11] ],
                                                  [ 'rotate', [ .3,   .9], [      4,   15] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.angle).toBe(4);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.15 + .9)) {
                                                        expect(s.angle).toBe(15);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - .3 - .15) / (.9 - .3);
                                                    expect(s.angle).toBeCloseTo((4 * (1.0 - adt)) + (15 * adt), CLOSE_FACTOR);
                                                });
                                });

                            });

                            describe("overlapping bands", function() {

                                it("last-added modifier starting point goes after the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'rotate', [.12,    .9 ], [3.14,     2 * Math.PI] ],
                                                  [ 'rotate', [.54,  1.63 ], [ .22, Math.PI * 3 / 5] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.2 + .54)) {
                                                        expect(s.angle).toBe(.22);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.2 + 1.63)) {
                                                        expect(s.angle).toBe(Math.PI * 3 / 5);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - .54 - .2) / (1.63 - .54);
                                                    expect(s.angle).toBeCloseTo((.22 * (1.0 - adt)) + ((Math.PI * 3 / 5) * adt), CLOSE_FACTOR);
                                                });

                                });

                                it("last-added modifier starting point goes before the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'rotate', [.54,  1.63 ], [ .22, Math.PI * 3 / 5] ],
                                                  [ 'rotate', [.12,    .9 ], [3.14,     2 * Math.PI] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.angle).toBe(3.14);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.2 + .9)) {
                                                        expect(s.angle).toBe(2 * Math.PI);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - .12 - .2) / (.9 - .12);
                                                    expect(s.angle).toBeCloseTo((3.14 * (1.0 - adt)) + ((2 * Math.PI) * adt), CLOSE_FACTOR);
                                                });
                                });

                            });

                            it("works with more than two tweens", function() {

                                checkTweens([.1, 3],
                                            [ [ 'rotate', [   0,   1 ], [ Math.PI * 1 / 6,   Math.PI / 5 ] ],
                                              [ 'rotate', [   1, 1.5 ], [         Math.PI,   Math.PI / 2 ] ],
                                              [ 'rotate', [ 1.3,   2 ], [ Math.PI * 5 / 4, 1.9 * Math.PI ] ] ],
                                            function(s, at) {
                                                // before the tween
                                                if (at < (.1 + 1.3)) {
                                                    expect(s.angle).toBe(Math.PI * 5 / 4);
                                                    return true;
                                                }
                                                // after the tween
                                                if (at > (.1 + 2)) {
                                                    expect(s.angle).toBe(1.9 * Math.PI);
                                                    return true;
                                                }
                                                // during the tween
                                                var adt = (at - 1.3 - .1) / (2 - 1.3);
                                                expect(s.angle).toBeCloseTo(((Math.PI * 5 / 4) * (1.0 - adt)) + ((1.9 * Math.PI) * adt), CLOSE_FACTOR);
                                            });

                            });

                        });

                        /* TODO: xdescribe("smart implementation", function{} {

                            describe("should sum angle value of the state according to given rotation for several tweens in a band of element", function() {

                                it("works with non-overlapping bands", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'rotate', [ .3,   .9], [      4,   15] ],
                                                  [ 'rotate', [1.1, 1.81], [Math.PI, 0.11] ] ],
                                                function(s, at) {
                                                    // before first tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.angle).toBe(4 + Math.PI);
                                                        return true;
                                                    }
                                                    // during first tween
                                                    if (at < (.15 + .9)) {
                                                        var adt = (at - .3 - .15) / (.9 - .3);
                                                        expect(s.angle).toBeCloseTo(Math.PI + ((4 * (1.0 - adt)) + (15 * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after first tween, before second
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.angle).toBe(15 + Math.PI);
                                                        return true;
                                                    }
                                                    // during second tween
                                                    if (at < (.15 + 1.81)) {
                                                        var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                        expect(s.angle).toBeCloseTo(15 + ((Math.PI * (1.0 - adt)) + (0.11 * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    expect(s.angle).toBe(0.11 + 15);
                                                });
                                });

                                it("works with overlapping bands", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'rotate', [.12,    .9 ], [3.14,     2 * Math.PI] ],
                                                  [ 'rotate', [.54,  1.63 ], [ .22, Math.PI * 3 / 5] ] ],
                                                function(s, at) {
                                                    // before first tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.angle).toBe(3.14 + .22);
                                                        return true;
                                                    }
                                                    // during first tween, before overlap period
                                                    if (at < (.2 + .54)) {
                                                        var adt = (at - .12 - .2) / (.9 - .12);
                                                        expect(s.angle).toBeCloseTo(.22 + ((3.14 * (1.0 - adt)) + ((2 * Math.PI) * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // during overlap period
                                                    if (at < (.2 + .9)) {
                                                        var adt1 = (at - .12 - .2) / (  .9 - .12),
                                                            adt2 = (at - .54 - .2) / (1.63 - .54);
                                                        expect(s.angle).toBeCloseTo(((3.14 * (1.0 - adt1)) + (    (2 * Math.PI) * adt1)) +
                                                                                    (( .22 * (1.0 - adt2)) + ((Math.PI * 3 / 5) * adt2)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // during second tween, after overlap period
                                                    if (at < (.2 + 1.63)) {
                                                        var adt = (at - .54 - .2) / (1.63 - .54);
                                                        expect(s.angle).toBeCloseTo((2 * Math.PI) + ((.22 * (1.0 - adt)) + ((Math.PI * 3 / 5) * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after second tween
                                                    expect(s.angle).toBe((2 * Math.PI) + (Math.PI * 3 / 5));
                                                });
                                });

                                // it("works with more than two tweens", function() {
                                //    checkTweens([0, 3],
                                //                [ [ 'rotate', [   0,   1 ], [[5, 5], [10, 12]] ],
                                //                  [ 'rotate', [   1, 1.5 ], [[7, 7], [9,  11]] ],
                                //                  [ 'rotate', [ 1.5, 1.5 ], [[9, 8], [11, 22]] ] ],
                                //                function(s, at) {
                                //
                                //                });
                                // });

                            });

                        });  */

                    });

                });

            });

            describe("rotate-to-path tween", function() {

                describe("single one", function() {

                    describe("should change angle value of the state according to given path", function() {

                        it("works in case of simple values", function() {
                            checkTweens([0, 1],
                                        [ [ 'transP',  [ 0, 1 ], 'M0 0 L12 12 Z' ],
                                          [ 'rotateP', [ 0, 1 ] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo(at !== 0 ? (Math.PI / 4) : 0, CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of zero", function() {
                            checkTweens([0, 1],
                                        [ [ 'transP',  [ 0, 1 ], 'M0 0 L0 0 Z' ],
                                          [ 'rotateP', [ 0, 1 ] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo(0, CLOSE_FACTOR);
                                        });

                            // both zero?
                        });

                        it("works in case of mixed values (incl. negative)", function() {
                            checkTweens([0, 1],
                                        [ [ 'transP',  [ 0, 1 ], 'M0 -10 L0 10 Z' ],
                                          [ 'rotateP', [ 0, 1 ] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo(at !== 0 ? (Math.PI / 2) : Math.PI, CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of floating values", function() {
                            var x0 = Math.cos(4 * Math.PI / 3),
                                y0 = Math.sin(4 * Math.PI / 3),
                                x1 = Math.cos(    Math.PI / 3),
                                y1 = Math.sin(    Math.PI / 3);
                            checkTweens([0, 1],
                                        [ [ 'transP',  [ 0, 1 ], 'M'+x0+' '+y0+' L'+x1+' '+y1+' Z' ],
                                          [ 'rotateP', [ 0, 1 ] ] ],
                                        function(s, at) {
                                            expect(s.angle).toBeCloseTo(at !== 0 ? (Math.PI / 3) : -(5 * Math.PI / 6), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of band not equal to element's band", function() {
                            checkTweens([.5, 1.9],
                                        [ [ 'transP',  [.1, 1.2], 'M0 0 L-8 -8 Z' ],
                                          [ 'rotateP', [.1, 1.2] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at <= (.5 + .1)) {
                                                expect(s.angle).toBe(0);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.5 + 1.2)) {
                                                expect(s.angle).toBe(-(3 * Math.PI / 4));
                                                return true;
                                            }
                                            // during the tween
                                            expect(s.angle).toBeCloseTo(-(3 * Math.PI / 4), CLOSE_FACTOR);
                                        });
                        });

                        // FIXME: test for several paths applied

                        it("works if path band exceeds rotateP band", function() {
                            checkTweens([.5, 1.9],
                                        [ [ 'transP',  [.1, 1.2], 'M0 0 L-8 -8 Z' ],
                                          [ 'rotateP', [.5, 1.2] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at <= (.5 + .5)) {
                                                expect(s.angle).toBe(0);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.5 + 1.2)) {
                                                expect(s.angle).toBe(-(3 * Math.PI / 4));
                                                return true;
                                            }
                                            // during the tween
                                            expect(s.angle).toBeCloseTo(-(3 * Math.PI / 4), CLOSE_FACTOR);
                                        });
                        });

                        it("works if there is no path at the part of a band", function() {
                            checkTweens([.5, 1.9],
                                        [ [ 'transP',  [.5, 1.2], 'M0 0 L-8 -8 Z' ],
                                          [ 'rotateP', [.1, 1.2] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at <= (.5 + .1)) {
                                                expect(s.angle).toBe(0);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.5 + 1.2)) {
                                                expect(s.angle).toBe(-(3 * Math.PI / 4));
                                                return true;
                                            }
                                            // during the tween
                                            expect(s.angle).toBeCloseTo(-(3 * Math.PI / 4), CLOSE_FACTOR);
                                        });
                        });

                        it("uses the last path when there are several paths inside of a tween band", function() {
                            checkTweens([.5, 1.9],
                                        [ [ 'transP',  [.1,  .5], 'M0 0 L-8 -8 Z' ],
                                          [ 'transP',  [.5, 1.2], 'M0 0 L12 12 Z' ],
                                          [ 'rotateP', [.1, 1.2] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at <= (.5 + .1)) {
                                                expect(s.angle).toBe(0);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.5 + 1.2)) {
                                                expect(s.angle).toBe(Math.PI / 4);
                                                return true;
                                            }
                                            // during the tween
                                            expect(s.angle).toBeCloseTo(Math.PI / 4, CLOSE_FACTOR);
                                        });
                        });

                    });

                });

                describe("several ones", function() {

                    it("should override angle value of the state according to current path", function() {
                        checkTweens([.5, 1.9],
                                    [ [ 'transP',  [.1,  .5], 'M0 0 L-8 -8 Z' ],
                                      [ 'rotateP', [.1, 1.2] ],
                                      [ 'rotateP', [.5, 1.2] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at <= (.5 + .5)) {
                                                expect(s.angle).toBe(0);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.5 + 1.2)) {
                                                expect(s.angle).toBe(-(3 * Math.PI / 4));
                                                return true;
                                            }
                                            // during the tween
                                            expect(s.angle).toBeCloseTo(-(3 * Math.PI / 4), CLOSE_FACTOR);
                                        });
                    });

                    // FIXME: test other cases: where bands overlap or not

                });

            });

            describe("alpha tween", function() {

                describe("single one", function() {

                    describe("will change alpha value of the state", function() {

                        it("works in case of simple values", function() {
                            checkTweens([0, 1],
                                        [ [ 'alpha', [ 0, 1 ], [3, 1] ] ],
                                        function(s, at) {
                                            expect(s.alpha).toBeCloseTo((3 * (1.0 - at)) + (1 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of zero", function() {
                            checkTweens([0, 1],
                                        [ [ 'alpha', [ 0, 1 ], [8, 0] ] ],
                                        function(s, at) {
                                            expect(s.alpha).toBeCloseTo((8 * (1.0 - at)) + (0 * at), CLOSE_FACTOR);
                                        });

                            // both zero, left zero?
                        });

                        it("works in case of mixed values (incl. negative)", function() {
                            checkTweens([0, 1],
                                        [ [ 'alpha', [ 0, 1 ], [-1, 6] ] ],
                                        function(s, at) {
                                            expect(s.alpha).toBeCloseTo(((-1) * (1.0 - at)) + (6 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of floating values", function() {
                            checkTweens([0, 1],
                                        [ [ 'alpha', [ 0, 1 ], [.8, 1.2] ] ],
                                        function(s, at) {
                                            expect(s.alpha).toBeCloseTo((.8 * (1.0 - at)) + (1.2 * at), CLOSE_FACTOR);
                                        });
                        });

                        it("works in case of band not equal to element's band", function() {
                            checkTweens([.18, 1.76],
                                        [ [ 'alpha', [.32, 1.64], [.5, .84] ] ],
                                        function(s, at) {
                                            // before the tween
                                            if (at < (.18 + .32)) {
                                                expect(s.alpha).toBe(.5);
                                                return true;
                                            }
                                            // after the tween
                                            if (at > (.18 + 1.64)) {
                                                expect(s.alpha).toBe(.84);
                                                return true;
                                            }
                                            // during the tween
                                            var adt = (at - .32 - .18) / (1.64 - .32);
                                            expect(s.alpha).toBeCloseTo((.5 * (1.0 - adt)) + (.84 * adt), CLOSE_FACTOR);
                                        });
                        });

                    });

                });

                describe("several ones", function() {

                    describe("default implementation", function() {

                        describe("will override alpha value of the state", function() {

                            describe("non-overlapping bands", function() {

                                it("last-added modifier goes just after the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'alpha', [ .3,   .9], [.3, 1.1] ],
                                                  [ 'alpha', [1.1, 1.81], [.1,  .9] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.alpha).toBe(.1);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.15 + 1.81)) {
                                                        expect(s.alpha).toBe(.9);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                    expect(s.alpha).toBeCloseTo((.1 * (1.0 - adt)) + (.9 * adt), CLOSE_FACTOR);
                                                });
                                });

                                it("last-added modifier goes just before the first in timeline", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'alpha', [1.1, 1.81], [.1,  .9] ],
                                                  [ 'alpha', [ .3,   .9], [.3, 1.1] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.alpha).toBe(.3);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.15 + .9)) {
                                                        expect(s.alpha).toBe(1.1);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - .3 - .15) / (.9 - .3);
                                                    expect(s.alpha).toBeCloseTo((.3 * (1.0 - adt)) + (1.1 * adt), CLOSE_FACTOR);
                                                });
                                });

                            });

                            describe("overlapping bands", function() {

                                it("last-added modifier starting point goes after the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'alpha', [.12,    .9 ], [.25,  5] ],
                                                  [ 'alpha', [.54,  1.63 ], [  7, 20] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.2 + .54)) {
                                                        expect(s.alpha).toBe(7);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.2 + 1.63)) {
                                                        expect(s.alpha).toBe(20);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - .54 - .2) / (1.63 - .54);
                                                    expect(s.alpha).toBeCloseTo((7 * (1.0 - adt)) + (20 * adt), CLOSE_FACTOR);
                                                });
                                });

                                it("last-added modifier starting point goes before the first in timeline", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'alpha', [.54,  1.63 ], [  7, 20] ],
                                                  [ 'alpha', [.12,    .9 ], [.25,  5] ] ],
                                                function(s, at) {
                                                    // before the tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.alpha).toBe(.25);
                                                        return true;
                                                    }
                                                    // after the tween
                                                    if (at > (.2 + .9)) {
                                                        expect(s.alpha).toBe(5);
                                                        return true;
                                                    }
                                                    // during the tween
                                                    var adt = (at - .12 - .2) / (.9 - .12);
                                                    expect(s.alpha).toBeCloseTo((.25 * (1.0 - adt)) + (5 * adt), CLOSE_FACTOR);
                                                });

                                });

                            });

                            it("works with more than two tweens", function() {

                                checkTweens([.1, 3],
                                            [ [ 'alpha', [   0,   1 ], [ .2, .18 ] ],
                                              [ 'alpha', [   1, 1.5 ], [ .5,  .8 ] ],
                                              [ 'alpha', [ 1.3,   2 ], [ .6, .97 ] ] ],
                                            function(s, at) {
                                                // before the tween
                                                if (at < (.1 + 1.3)) {
                                                    expect(s.alpha).toBe(.6);
                                                    return true;
                                                }
                                                // after the tween
                                                if (at > (.1 + 2)) {
                                                    expect(s.alpha).toBe(.97);
                                                    return true;
                                                }
                                                // during the tween
                                                var adt = (at - 1.3 - .1) / (2 - 1.3);
                                                expect(s.alpha).toBeCloseTo((.6 * (1.0 - adt)) + (.97 * adt), CLOSE_FACTOR);
                                            });

                            });

                        });

                        /* TODO: xdescribe("smart implementation", function{} {

                            describe("should multiply alpha value of the state according to given opacity for several tweens in a band of element", function() {

                                it("works with non-overlapping bands", function() {
                                    checkTweens([.15, 2],
                                                [ [ 'alpha', [ .3,   .9], [.3, 1.1] ],
                                                  [ 'alpha', [1.1, 1.81], [.1,  .9] ] ],
                                                function(s, at) {
                                                    // before first tween
                                                    if (at < (.15 + .3)) {
                                                        expect(s.alpha).toBe(.3 * 0.1);
                                                        return true;
                                                    }
                                                    // during first tween
                                                    if (at < (.15 + .9)) {
                                                        var adt = (at - .3 - .15) / (.9 - .3);
                                                        expect(s.alpha).toBeCloseTo(0.1 * ((.3 * (1.0 - adt)) + (1.1 * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after first tween, before second
                                                    if (at < (.15 + 1.1)) {
                                                        expect(s.alpha).toBe(.1 * 1.1);
                                                        return true;
                                                    }
                                                    // during second tween
                                                    if (at < (.15 + 1.81)) {
                                                        var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                        expect(s.alpha).toBeCloseTo(1.1 * ((.1 * (1.0 - adt)) + (0.9 * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    expect(s.alpha).toBe(1.1 * .9);
                                                });
                                });

                                it("works with overlapping bands", function() {
                                    checkTweens([.2, 1.8],
                                                [ [ 'alpha', [.12,    .9 ], [.25,  5] ],
                                                  [ 'alpha', [.54,  1.63 ], [  7, 20] ] ],
                                                function(s, at) {
                                                    // before first tween
                                                    if (at < (.2 + .12)) {
                                                        expect(s.alpha).toBe(.25 * 7);
                                                        return true;
                                                    }
                                                    // during first tween, before overlap period
                                                    if (at < (.2 + .54)) {
                                                        var adt = (at - .12 - .2) / (.9 - .12);
                                                        expect(s.alpha).toBeCloseTo(7 * ((.25 * (1.0 - adt)) + (5 * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // during overlap period
                                                    if (at < (.2 + .9)) {
                                                        var adt1 = (at - .12 - .2) / (  .9 - .12),
                                                            adt2 = (at - .54 - .2) / (1.63 - .54);
                                                        expect(s.alpha).toBeCloseTo(((.25 * (1.0 - adt1)) + ( 5 * adt1)) *
                                                                                    ((  7 * (1.0 - adt2)) + (20 * adt2)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // during second tween, after overlap period
                                                    if (at < (.2 + 1.63)) {
                                                        var adt = (at - .54 - .2) / (1.63 - .54);
                                                        expect(s.alpha).toBeCloseTo(5 * ((7 * (1.0 - adt)) + (20 * adt)), CLOSE_FACTOR);
                                                        return true;
                                                    }
                                                    // after second tween
                                                    expect(s.alpha).toBe(5 * 20);
                                                });
                                });

                                // it("works with more than two tweens", function() {
                                //    checkTweens([0, 3],
                                //                [ [ 'alpha', [   0,   1 ], [[5, 5], [10, 12]] ],
                                //                  [ 'alpha', [   1, 1.5 ], [[7, 7], [9,  11]] ],
                                //                  [ 'alpha', [ 1.5, 1.5 ], [[9, 8], [11, 22]] ] ],
                                //                function(s, at) {
                                //                });
                                // });

                            });

                        }); */

                    });

                });

            });

            // TODO: do we need to check matrix?

            // test tweens with no bands
            // translate tween should call translate by path
            // test fails if no data specified

        });

        describe("tweens easing", function() {

            describe("works for all types of tweens", function() {

                var tween_type;

                // TODO: test all types of easings? (easing should complexly be tested in modifiers, though)

                describe("translate tween", function() {

                    it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'trans', [ 0, 1 ], [[0, 0], [10, 40]], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        expect(s.x).toBeCloseTo((1 - at) * 10, CLOSE_FACTOR);
                                        expect(s.y).toBeCloseTo((1 - at) * 40, CLOSE_FACTOR);
                                    });
                    });

                    it("supports overriden easing in narrow band", function() {
                        checkTweens([.1, 1.5],
                                    [ [ 'trans', [ .3, 1 ], [[50, 11], [10, 40]], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        // before tween
                                        if (at < (.1 + .3)) {
                                            expect(s.x).toBe(10);
                                            expect(s.y).toBe(40);
                                            return true;
                                        }
                                        // after tween
                                        if (at > (.1 + 1)) {
                                            expect(s.x).toBe(50);
                                            expect(s.y).toBe(11);
                                            return true;
                                        }
                                        // during tween
                                        var adt = (at - .3 - .1) / (1 - .3);
                                        expect(s.x).toBeCloseTo(50 + ((1 - adt) * (10 - 50)), CLOSE_FACTOR);
                                        expect(s.y).toBeCloseTo(11 + ((1 - adt) * (40 - 11)), CLOSE_FACTOR);
                                    });
                    });

                    it("supports predefined in narrow band", function() {
                        var seg = anm.Easing.__SEGS['EIN'];
                        checkTweens([.1, 1.5],
                                    [ [ 'trans', [ .3, 1 ], [[50, 11], [10, 40]], anm.C.E_EIN ] ],
                                    function(s, at) {
                                        var adt;
                                        if (at < (.1 + .3)) adt = 0;
                                        else if (at > (.1 + 1)) adt = 1;
                                        else adt = (at - .3 - .1) / (1 - .3);
                                        // return seg.atT([0, 0], t)[1];
                                        var seg_t = seg.atT([0, 0], adt)[1];
                                        expect(s.x).toBeCloseTo(50 + (seg_t * (10 - 50)), CLOSE_FACTOR);
                                        expect(s.y).toBeCloseTo(11 + (seg_t * (40 - 11)), CLOSE_FACTOR);
                                    });
                    });

                });

                describe("translate-to-path tween", function() {

                    it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'transP', [ 0, 1 ], 'M0 0 L10 40 Z', function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        expect(s.x).toBeCloseTo((1 - at) * 10, CLOSE_FACTOR);
                                        expect(s.y).toBeCloseTo((1 - at) * 40, CLOSE_FACTOR);
                                    });
                    });

                    it("supports overriden easing in narrow band", function() {
                        checkTweens([.1, 1.5],
                                    [ [ 'transP', [ .3, 1 ], 'M50 11 L10 40 Z', function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        // before tween
                                        if (at < (.1 + .3)) {
                                            expect(s.x).toBe(10);
                                            expect(s.y).toBe(40);
                                            return true;
                                        }
                                        // after tween
                                        if (at > (.1 + 1)) {
                                            expect(s.x).toBe(50);
                                            expect(s.y).toBe(11);
                                            return true;
                                        }
                                        // during tween
                                        var adt = (at - .3 - .1) / (1 - .3);
                                        expect(s.x).toBeCloseTo(50 + ((1 - adt) * (10 - 50)), CLOSE_FACTOR);
                                        expect(s.y).toBeCloseTo(11 + ((1 - adt) * (40 - 11)), CLOSE_FACTOR);
                                    });
                    });

                    it("supports predefined in narrow band", function() {
                        var seg = anm.Easing.__SEGS['EIN'];
                        checkTweens([.1, 1.5],
                                    [ [ 'transP', [ .3, 1 ], 'M50 11 L10 40 Z', anm.C.E_EIN ] ],
                                    function(s, at) {
                                        var adt;
                                        if (at < (.1 + .3)) adt = 0;
                                        else if (at > (.1 + 1)) adt = 1;
                                        else adt = (at - .3 - .1) / (1 - .3);
                                        // return seg.atT([0, 0], t)[1];
                                        var seg_t = seg.atT([0, 0], adt)[1];
                                        expect(s.x).toBeCloseTo(50 + (seg_t * (10 - 50)), CLOSE_FACTOR);
                                        expect(s.y).toBeCloseTo(11 + (seg_t * (40 - 11)), CLOSE_FACTOR);
                                    });
                    });

                });

                describe("scale tween", function() {

                    it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'scale', [ 0, 1 ], [[0, 0], [.25, 1]], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        expect(s.sx).toBeCloseTo((1 - at) * .25, CLOSE_FACTOR);
                                        expect(s.sy).toBeCloseTo((1 - at) *   1, CLOSE_FACTOR);
                                    });
                    });

                    it("supports overriden easing in narrow band", function() {
                        checkTweens([.1, 1.5],
                                    [ [ 'scale', [ .3, 1 ], [[.5, .11], [.25, 1]], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        // before tween
                                        if (at < (.1 + .3)) {
                                            expect(s.sx).toBe(.25);
                                            expect(s.sy).toBe(  1);
                                            return true;
                                        }
                                        // after tween
                                        if (at > (.1 + 1)) {
                                            expect(s.sx).toBe( .5);
                                            expect(s.sy).toBe(.11);
                                            return true;
                                        }
                                        // during tween
                                        var adt = (at - .3 - .1) / (1 - .3);
                                        expect(s.sx).toBeCloseTo( .5 + ((1 - adt) * (.25 -  .5)), CLOSE_FACTOR);
                                        expect(s.sy).toBeCloseTo(.11 + ((1 - adt) * (  1 - .11)), CLOSE_FACTOR);
                                    });
                    });

                    it("supports predefined in narrow band", function() {
                        var seg = anm.Easing.__SEGS['EIN'];
                        checkTweens([.1, 1.5],
                                    [ [ 'scale', [ .3, 1 ], [[.5, .11], [.25, 1]], anm.C.E_EIN ] ],
                                    function(s, at) {
                                        var adt;
                                        if (at < (.1 + .3)) adt = 0;
                                        else if (at > (.1 + 1)) adt = 1;
                                        else adt = (at - .3 - .1) / (1 - .3);
                                        // return seg.atT([0, 0], t)[1];
                                        var seg_t = seg.atT([0, 0], adt)[1];
                                        expect(s.sx).toBeCloseTo( .5 + (seg_t * (.25 -  .5)), CLOSE_FACTOR);
                                        expect(s.sy).toBeCloseTo(.11 + (seg_t * (  1 - .11)), CLOSE_FACTOR);
                                    });
                    });

                });

                describe("xscale tween", function() {

                    it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'xscale', [ 0, 1 ], [0, .7], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        expect(s.sx).toBeCloseTo((1 - at) * .7, CLOSE_FACTOR);
                                        expect(s.sy).toBeCloseTo((1 - at) * .7, CLOSE_FACTOR);
                                    });
                    });

                    it("supports overriden easing in narrow band", function() {
                        checkTweens([.1, 1.5],
                                    [ [ 'xscale', [ .3, 1 ], [.5, 2.1], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        // before tween
                                        if (at < (.1 + .3)) {
                                            expect(s.sx).toBe(2.1);
                                            expect(s.sy).toBe(2.1);
                                            return true;
                                        }
                                        // after tween
                                        if (at > (.1 + 1)) {
                                            expect(s.sx).toBe(.5);
                                            expect(s.sy).toBe(.5);
                                            return true;
                                        }
                                        // during tween
                                        var adt = (at - .3 - .1) / (1 - .3);
                                        expect(s.sx).toBeCloseTo(.5 + ((1 - adt) * (2.1 - .5)), CLOSE_FACTOR);
                                        expect(s.sy).toBeCloseTo(.5 + ((1 - adt) * (2.1 - .5)), CLOSE_FACTOR);
                                    });
                    });

                    it("supports predefined in narrow band", function() {
                        var seg = anm.Easing.__SEGS['EIN'];
                        checkTweens([.1, 1.5],
                                    [ [ 'xscale', [ .3, 1 ], [.5, 2.1], anm.C.E_EIN ] ],
                                    function(s, at) {
                                        var adt;
                                        if (at < (.1 + .3)) adt = 0;
                                        else if (at > (.1 + 1)) adt = 1;
                                        else adt = (at - .3 - .1) / (1 - .3);
                                        // return seg.atT([0, 0], t)[1];
                                        var seg_t = seg.atT([0, 0], adt)[1];
                                        expect(s.sx).toBeCloseTo(.5 + (seg_t * (2.1 - .5)), CLOSE_FACTOR);
                                        expect(s.sy).toBeCloseTo(.5 + (seg_t * (2.1 - .5)), CLOSE_FACTOR);
                                    });
                    });

                });

                describe("rotate tween", function() {

                    it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'rotate', [ 0, 1 ], [0, Math.PI / 2], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        expect(s.angle).toBeCloseTo((1 - at) * Math.PI / 2, CLOSE_FACTOR);
                                    });
                    });

                    it("supports overriden easing in narrow band", function() {
                        checkTweens([.1, 1.5],
                                    [ [ 'rotate', [ .3, 1 ], [Math.PI / 2, 3 * Math.PI / 4], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        // before tween
                                        if (at < (.1 + .3)) {
                                            expect(s.angle).toBe(3 * Math.PI / 4);
                                            return true;
                                        }
                                        // after tween
                                        if (at > (.1 + 1)) {
                                            expect(s.angle).toBe(Math.PI / 2);
                                            return true;
                                        }
                                        // during tween
                                        var adt = (at - .3 - .1) / (1 - .3);
                                        expect(s.angle).toBeCloseTo((Math.PI / 2) +
                                              ((1 - adt) * ((3 * Math.PI / 4) - (Math.PI / 2))), CLOSE_FACTOR);
                                    });
                    });

                    it("supports predefined in narrow band", function() {
                        var seg = anm.Easing.__SEGS['EIN'];
                        checkTweens([.1, 1.5],
                                    [ [ 'rotate', [ .3, 1 ], [Math.PI / 2, 3 * Math.PI / 4], anm.C.E_EIN ] ],
                                    function(s, at) {
                                        var adt;
                                        if (at < (.1 + .3)) adt = 0;
                                        else if (at > (.1 + 1)) adt = 1;
                                        else adt = (at - .3 - .1) / (1 - .3);
                                        // return seg.atT([0, 0], t)[1];
                                        var seg_t = seg.atT([0, 0], adt)[1];
                                        expect(s.angle).toBeCloseTo((Math.PI / 2) +
                                              (seg_t * ((3 * Math.PI / 4) - (Math.PI / 2))), CLOSE_FACTOR);
                                    });
                    });

                });

                describe("rotate-to-path tween", function() {

                    // FIXME: check with transP and complex path
                    /* it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'trans', [0, .5], [ [0, 0], [10, 10] ] ],
                                      [ 'trans', [.5, 1], [ [0, 0], [0, -10] ] ],
                                      [ 'rotateP', [ 0, 1 ], function(t) { return (t == 1) ? 0 : 1; } ] ],
                                    function(s, at) {
                                        if (at > .5) expect(s.angle).toBeCloseTo(Math.PI / 4, CLOSE_FACTOR);
                                        else expect(s.angle).toBeCloseTo(-(Math.PI / 2), CLOSE_FACTOR);
                                    });
                    }); */

                    it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'trans', [0, 1], [ [0, 0], [0, -10] ] ],
                                      [ 'rotateP', [ 0, 1 ], function(t) { return (t == 1) ? 0 : 1; } ] ],
                                    function(s, at) {
                                        if (at == 1) expect(s.angle).toBe(0, CLOSE_FACTOR);
                                        else expect(s.angle).toBeCloseTo(-(Math.PI / 2), CLOSE_FACTOR);
                                    });
                    });

                    // FIXME: test
                    /* it("supports overriden easing in narrow band", function() {
                        checkTweens([.1, 1.5],
                                    [ [ 'trans', [ .3, 1 ], [ [0, 0], [0, -10] ] ],
                                      [ 'rotateP', [ .3, 1 ], function(t) { return (t == 1) ? 0 : 1; } ] ],
                                    function(s, at) {
                                        if (at > (.1 + .3)) expect(s.angle).toBe(0, CLOSE_FACTOR);
                                        else expect(s.angle).toBeCloseTo(-(Math.PI / 2), CLOSE_FACTOR);
                                    });
                    }); */

                    // FIXME: test
                    /* it("supports predefined in narrow band", function() {
                        var seg = anm.Easing.__SEGS['EIN'];
                        checkTweens([.1, 1.5],
                                    [ [ 'rotate', [ .3, 1 ], [Math.PI / 2, 3 * Math.PI / 4], anm.C.E_EIN ] ],
                                    function(s, at) {
                                        var adt;
                                        if (at < (.1 + .3)) adt = 0;
                                        else if (at > (.1 + 1)) adt = 1;
                                        else adt = (at - .3 - .1) / (1 - .3);
                                        // return seg.atT([0, 0], t)[1];
                                        var seg_t = seg.atT([0, 0], adt)[1];
                                        expect(s.angle).toBeCloseTo((Math.PI / 2) +
                                              (seg_t * ((3 * Math.PI / 4) - (Math.PI / 2))), CLOSE_FACTOR);
                                    });
                    }); */

                });

                describe("alpha tween", function() {

                    it("supports overriden easing", function() {
                        checkTweens([0, 1],
                                    [ [ 'alpha', [ 0, 1 ], [0, .4], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        expect(s.alpha).toBeCloseTo((1 - at) * .4, CLOSE_FACTOR);
                                    });
                    });

                    it("supports overriden easing in narrow band", function() {
                        checkTweens([.1, 1.5],
                                    [ [ 'alpha', [ .3, 1 ], [.3, 1], function(t) { return 1 - t; } ] ],
                                    function(s, at) {
                                        // before tween
                                        if (at < (.1 + .3)) {
                                            expect(s.alpha).toBe(1);
                                            return true;
                                        }
                                        // after tween
                                        if (at > (.1 + 1)) {
                                            expect(s.alpha).toBe(.3);
                                            return true;
                                        }
                                        // during tween
                                        var adt = (at - .3 - .1) / (1 - .3);
                                        expect(s.alpha).toBeCloseTo(.3 + ((1 - adt) * (1 - .3)), CLOSE_FACTOR);
                                    });
                    });

                    it("supports predefined in narrow band", function() {
                        var seg = anm.Easing.__SEGS['EIN'];
                        checkTweens([.1, 1.5],
                                    [ [ 'alpha', [ .3, 1 ], [.3, 1], anm.C.E_EIN ] ],
                                    function(s, at) {
                                        var adt;
                                        if (at < (.1 + .3)) adt = 0;
                                        else if (at > (.1 + 1)) adt = 1;
                                        else adt = (at - .3 - .1) / (1 - .3);
                                        // return seg.atT([0, 0], t)[1];
                                        var seg_t = seg.atT([0, 0], adt)[1];
                                        expect(s.alpha).toBeCloseTo(.3 + (seg_t * (1 - .3)), CLOSE_FACTOR);
                                    });
                    });

                });

            });

        });

        // TODO: test priorities

    });

    // TODO: ensure that tweens modifier is always new (instead, it rises an error that the element
    //       has this modifier already)
    // TODO: test the case when several tweens overlap (they always overlap now), test that state is changed correctly

    // TODO: check how tweens affect matrices, for single elements and for groups ?

});

// TODO: test working with bands
// TODO: test untweening