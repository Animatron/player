/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("tweens", function() {

    var b = Builder._$,
        B = Builder;

    var t_adjust = anm.__dev.adjust;

    var t_cmp = anm.__dev.t_cmp; // FIXME: test t_cmp separately

    // FIXME: replace these calls with _matchers.time calls
    function t_before      (t0, t1) { return t_cmp(t0, t1) <  0; }
    function t_before_or_eq(t0, t1) { return t_cmp(t0, t1) <= 0; }
    function t_after       (t0, t1) { return t_cmp(t0, t1) >  0; }
  //function t_after_or_eq (t0, t1) { return t_cmp(t0, t1) >= 0; }

    describe("static modification", function() {

        describe("adding tweens should create modifiers with the given values", function() {

            // With this test we just ensure that, since creating tween creates a
            // conforming modifier, so basic features of tweens like passing bands
            // and inner time are already tested in modifiers section (they should to)

            var bld,
                elm;

            var addTweenSpy,
                addModifierSpy;

            var relative;

            var band = [1, 4],
                duration = band[1] - band[0],
                tween_band;

            beforeEach(function() {
                bld = b().band(band);
                elm = bld.v;
                addTweenSpy    = spyOn(elm, 'addTween').andCallThrough();
                addModifierSpy = spyOn(elm, '__modify').andCallThrough();
            });

            describe("the same should apply to tween method, no matter if it is", function() {

                var tween_type;

                varyAll([ { description: "translate tween",
                            prepare: function() { tween_type = anm.C.T_TRANSLATE;
                                                  tween_band = [ duration / 4, 3 / 4 * duration ];
                                                  relative = false; } },
                          { description: "scale tween",
                            prepare: function() { tween_type = anm.C.T_SCALE;
                                                  tween_band = [ duration / 4, 3 / 4 * duration ];
                                                  relative = false; } },
                          { description: "rotate tween",
                            prepare: function() { tween_type = anm.C.T_ROTATE;
                                                  tween_band = [ duration / 4, 3 / 4 * duration ];
                                                  relative = false; } },
                          { description: "rotate-to-path tween",
                            prepare: function() { tween_type = anm.C.T_ROT_TO_PATH;
                                                  tween_band = [ duration / 4, 3 / 4 * duration ];
                                                  relative = false; } },
                          { description: "alpha tween",
                            prepare: function() { tween_type = anm.C.T_ALPHA;
                                                  tween_band = [ duration / 4, 3 / 4 * duration ];
                                                  relative = false; } },
                          { description: "relative translate tween",
                            prepare: function() { tween_type = anm.C.T_TRANSLATE;
                                                  tween_band = [ 1 / 4, 3 / 4 ];
                                                  relative = true; } },
                          { description: "relative scale tween",
                            prepare: function() { tween_type = anm.C.T_SCALE;
                                                  tween_band = [ 1 / 4, 3 / 4 ];
                                                  relative = true; } },
                          { description: "rrelative rotate tween",
                            prepare: function() { tween_type = anm.C.T_ROTATE;
                                                  tween_band = [ 1 / 4, 3 / 4 ];
                                                  relative = true; } },
                          { description: "relative rotate-to-path tween",
                            prepare: function() { tween_type = anm.C.T_ROT_TO_PATH;
                                                  tween_band = [ 1 / 4, 3 / 4 ];
                                                  relative = true; } },
                          { description: "or relative alpha tween",
                            prepare: function() { tween_type = anm.C.T_ALPHA;
                                                  tween_band = [ 1 / 4, 3 / 4 ];
                                                  relative = true; } }
                    ], function() {

                        it("should pass null band if band is not specified", function() {

                            if (!relative){
                                bld.tween(tween_type);
                            } else {
                                bld.rtween(tween_type);
                            }

                            expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                       time: jasmine.undefined,
                                                                       relative: relative ? true : jasmine.undefined,
                                                                       data: jasmine.undefined,
                                                                       easing: jasmine.undefined });

                            expect(addModifierSpy).toHaveBeenCalledWith({ type: anm.Element.TWEEN_MOD,
                                                                          priority: anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                          time: jasmine.undefined,
                                                                          relative: relative ? true : jasmine.undefined,
                                                                          easing: jasmine.undefined,
                                                                          data: jasmine.undefined },
                                                                        jasmine.any(Function)); // anm.Tweens[tween_type]());
                        });

                        it("should apply a band, at least", function() {

                            if (!relative){
                                bld.tween(tween_type, tween_band);
                            } else {
                                bld.rtween(tween_type, tween_band);
                            }

                            expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                       time: tween_band,
                                                                       relative: relative ? true : jasmine.undefined,
                                                                       data: jasmine.undefined,
                                                                       easing: jasmine.undefined });

                            expect(addModifierSpy).toHaveBeenCalledWith({ type: anm.Element.TWEEN_MOD,
                                                                          priority: anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                          time: tween_band,
                                                                          relative: relative ? true : jasmine.undefined,
                                                                          easing: jasmine.undefined,
                                                                          data: jasmine.undefined },
                                                                        jasmine.any(Function)); // anm.Tweens[tween_type]()

                        });

                        it("should apply data to a tween", function() {
                            // FIXME: we cannot check here if data was actually passed to a tween function, however it will be
                            // checked in action for separate types of tweens in the tests below

                            var data = { 'foo': 'bar' };

                            if (!relative){
                                bld.tween(tween_type, tween_band, data);
                            } else {
                                bld.rtween(tween_type, tween_band, data);
                            }

                            expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                       time: tween_band,
                                                                       relative: relative ? true : jasmine.undefined,
                                                                       data: data,
                                                                       easing: jasmine.undefined });

                            expect(addModifierSpy).toHaveBeenCalledWith({ type: anm.Element.TWEEN_MOD,
                                                                          priority: anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                          time: tween_band,
                                                                          relative: relative ? true : jasmine.undefined,
                                                                          easing: jasmine.undefined,
                                                                          data: data },
                                                                        jasmine.any(Function)); // anm.Tweens[tween_type]()
                        });

                        it("should apply predefined easing to a tween", function() {
                            var easing = anm.C.E_INOUT; // all of the types are tested in modifiers spec

                            if (!relative){
                                bld.tween(tween_type, tween_band, null, easing);
                            } else {
                                bld.rtween(tween_type, tween_band, null, easing);
                            }

                            expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                       time: tween_band,
                                                                       relative: relative ? true : jasmine.undefined,
                                                                       data: null,
                                                                       easing: easing });

                            expect(addModifierSpy).toHaveBeenCalledWith({ type: anm.Element.TWEEN_MOD,
                                                                          priority: anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                          time: tween_band,
                                                                          relative: relative ? true : jasmine.undefined,
                                                                          easing: easing,
                                                                          data: null },
                                                                        jasmine.any(Function)); // anm.Tweens[tween_type]()
                        });

                        it("should apply function-based easing to a tween", function() {
                            // FIXME: we cannot check here if easing was actually passed to a tween function, however it will be
                            // checked in the tests below

                            var easing = function(t) { };

                            if (!relative){
                                bld.tween(tween_type, tween_band, null, easing);
                            } else {
                                bld.rtween(tween_type, tween_band, null, easing);
                            }

                            expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                       time: tween_band,
                                                                       relative: relative ? true : jasmine.undefined,
                                                                       data: null,
                                                                       easing: easing });

                            expect(addModifierSpy).toHaveBeenCalledWith({ type: anm.Element.TWEEN_MOD,
                                                                          priority: anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                          time: tween_band,
                                                                          relative: relative ? true : jasmine.undefined,
                                                                          easing: easing,
                                                                          data: null },
                                                                        jasmine.any(Function)); // anm.Tweens[tween_type]()

                        });

                        it("should apply predefined easing with data to a tween", function() {
                            var easing = anm.C.E_PATH; // all of the types are tested in modifiers spec
                            var easing_path = 'M10 10 L12 12 Z';
                            var built_easing = B.easingP(easing_path);

                            if (!relative){
                                bld.tween(tween_type, tween_band, null, B.easingP(easing_path));
                            } else {
                                bld.rtween(tween_type, tween_band, null, B.easingP(easing_path));
                            }

                            expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                       time: tween_band,
                                                                       relative: relative ? true : jasmine.undefined,
                                                                       data: null,
                                                                       easing: built_easing });

                            expect(addModifierSpy).toHaveBeenCalledWith({ type: anm.Element.TWEEN_MOD,
                                                                          priority: anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                          time: tween_band,
                                                                          relative: relative ? true : jasmine.undefined,
                                                                          easing: built_easing,
                                                                          data: null },
                                                                        jasmine.any(Function)); // anm.Tweens[tween_type]()
                        });

                        it("should apply function-based easing with data to a tween", function() {

                            var easing = function(t) { };
                            var easing_data = { 'foo': 'bar' };
                            var built_easing = B.easingF(easing, easing_data);

                            // TODO: add ability to pass function as easing

                            if (!relative){
                                bld.tween(tween_type, tween_band, null, built_easing);
                            } else {
                                bld.rtween(tween_type, tween_band, null, built_easing);
                            }

                            expect(addTweenSpy).toHaveBeenCalledWith({ type: tween_type,
                                                                       time: tween_band,
                                                                       relative: relative ? true : jasmine.undefined,
                                                                       data: null,
                                                                       easing: built_easing });

                            expect(addModifierSpy).toHaveBeenCalledWith({ type: anm.Element.TWEEN_MOD,
                                                                          priority: anm.Tween.TWEENS_PRIORITY[tween_type],
                                                                          time: tween_band,
                                                                          relative: relative ? true : jasmine.undefined,
                                                                          easing: built_easing,
                                                                          data: null },
                                                                        jasmine.any(Function)); // anm.Tweens[tween_type]()

                        });

                    }
                );

            });


        });

    });

    describe("while in playing;", function() {

        // TODO: test creating custom tweens or it is the same as modifiers?

        var player;

        var FPS = 40, _fg; //40; // 120; // 200;

        var CLOSE_FACTOR = 11;

        beforeEach(function() {

            spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
            _fake(_Fake.CVS_POS);

            _fg = _FrameGen.spawn().run(FPS);

            var C = anm.C;

            player = createPlayer('test-id', { mode: C.M_SANDBOX });
        });

        afterEach(function() { _fg.stop().destroy(); });

        var _duration = 2;

        function checkTweens(bs, band, tweens, checking_f, message) {
            var scene = b();
            var elm = b().band(band);
            elm.init(bs);
            scene.add(elm);
            doAsync(player, {
                prepare: function() {
                    _each(tweens, function(tween) {
                        var method = tween[0],
                            attrs = tween.slice(1);
                        elm[method].apply(elm, attrs);
                    });
                    elm.modify(function(t, duration, data) {
                        //var at = player.state.time;
                        //if (check_conf.before && t_cmp(at, ))
                        checking_f(this, player.state.time, t);
                        /* if (!checking_f(this, t, player.state.time)) {
                            throw new Error(message || 'Time check failed');
                        } */
                        //return false;
                    });
                    return scene;
                },
                do: 'play', until: anm.C.STOPPED, timeout: _duration + .2
            });
        }

        var bs; // base_state;

        varyAll([ { description: "empty base state",
                    prepare: function() {
                        bs = { x: 0, y: 0,
                           sx: 1, sy: 1,
                           angle: 0, alpha: 1 };
                    } }/* TODO: finish ,
                    { description: "changed base state",
                    prepare: function() {
                        bs = { x: 32, y: 17.5,
                           sx: 1.7, sy: 30,
                           angle: Math.PI / 5, alpha: 0.75 };
                    } }*/ ], function() {

          describe("the way tweens apply, by type;", function() {

              it("keeps default values in state when there are no tweens", function() {
                  checkTweens(bs, [0, 1],
                              [ ],
                              function(s, at) {
                                  expect(s.x).toBe(bs.x);
                                  expect(s.y).toBe(bs.y);
                                  expect(s.sx).toBe(bs.sx);
                                  expect(s.sy).toBe(bs.sy);
                                  expect(s.angle).toBe(bs.angle);
                                  expect(s.alpha).toBe(bs.alpha);
                              });
              });

              describe("translate tween", function() {

                  // FIXME: add tests for relative tweens

                  describe("single one", function() {

                      describe("will change x/y values of the state according to given direction", function() {

                          it("works in case of simple values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'trans', [ 0, 1 ], [[0, 0], [10, 10]] ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x + at * 10, CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + at * 10, CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of zero", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'trans', [ 0, 1 ], [[0, 11], [20, 0]] ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x +  0 + at * (20 -  0), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + 11 + at * ( 0 - 11), CLOSE_FACTOR);
                                          });

                              // both zero?
                          });

                          it("works in case of mixed values (incl. negative)", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'trans', [ 0, 1 ], [[12, 15], [8, -11]] ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x + 12 + (at * (    8 - 12)), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + 15 + (at * ((-11) - 15)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of floating values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'trans', [ 0, 1 ], [[13, -17.1], [8.5, -11]] ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x +      13 + (at * (  8.5 -      13)), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + (-17.1) + (at * ((-11) - (-17.1))), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of band not equal to element's band", function() {
                              checkTweens(bs, [.2, 2],
                                          [ [ 'trans', [.1, 1.65], [[5, 10], [16, 17]] ] ],
                                          function(s, at) {
                                              // before the tween
                                              if (t_before(at, .2 + .1)) {
                                                  expect(s.x).toBe(bs.x);
                                                  expect(s.y).toBe(bs.y);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .2 + 1.65)) {
                                                  expect(s.x).toBe(bs.x);
                                                  expect(s.y).toBe(bs.y);
                                                  return true;
                                              }
                                              // during the tween
                                              expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .2 - .1) / (1.65 - .1)) * (16 -  5)), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + 10 + (((at - .2 - .1) / (1.65 - .1)) * (17 - 10)), CLOSE_FACTOR);
                                          });
                          });

                      });

                  });

                  describe("several ones", function() {

                      describe("default implementation", function() {

                          describe("will override x/y values with ones from the last modifier of the state according to given direction", function() {

                              describe("non-overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'trans', [  .3,   .9 ], [[6,  4], [9,    15]] ],
                                                    [ 'trans', [ 1.1, 1.85 ], [[3, 19], [8.4, -11]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x + 6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.85)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'trans', [ 1.1, 1.85 ], [[3, 19], [8.4, -11]] ],
                                                    [ 'trans', [  .3,   .9 ], [[6,  4], [9,    15]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x + 6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.85)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });

                              });

                              describe("overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'trans', [.12,    .9 ], [[ 5, 12], [3.2, 40]] ],
                                                    [ 'trans', [ .5,  1.56 ], [[-1,  9], [0,   16]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .5)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x + -1 + (((at - .5 - .2) / (1.56 -  .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y +  9 + (((at - .5 - .2) / (1.56 -  .5)) * (16 -    9)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.56)) {
                                                          expect(s.x).toBeCloseTo(bs.x + -1 + (((at - .5 - .2) / (1.56 - .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y +  9 + (((at - .5 - .2) / (1.56 - .5)) * (16 -    9)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'trans', [ .5,  1.56 ], [[-1,  9], [0,   16]] ],
                                                    [ 'trans', [.12,    .9 ], [[ 5, 12], [3.2, 40]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .5)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.56)) {
                                                          expect(s.x).toBeCloseTo(bs.x + -1 + (((at - .5 - .2) / (1.56 - .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y +  9 + (((at - .5 - .2) / (1.56 - .5)) * (16 -    9)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });

                              });

                              it("works with more than two tweens", function() {
                                  checkTweens(bs, [.1, 3],
                                              [ [ 'trans', [   0,   1 ], [[5, 5], [10, 12]] ],
                                                [ 'trans', [   1, 1.5 ], [[7, 7], [9,  11]] ],
                                                [ 'trans', [ 1.3,   2 ], [[9, 8], [11, 22]] ] ],
                                              function(s, at) {
                                                  // before the first tween
                                                  if (t_before(at, .1 + 0)) {
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                      return true;
                                                  }
                                                  // during the first tween
                                                  if (t_before(at, .1 + 1)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 5 + (((at - 0 - .1) / (1 - 0)) * (10 - 5)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 5 + (((at - 0 - .1) / (1 - 0)) * (12 - 5)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the second tween, but before the third one
                                                  if (t_before(at, .1 + 1.3)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 7 + (((at - 1 - .1) / (1.5 - 1)) * ( 9 - 7)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 7 + (((at - 1 - .1) / (1.5 - 1)) * (11 - 7)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during both the second and the third tweens
                                                  if (t_before_or_eq(at, .1 + 1.5)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the third tween, but after the second one
                                                  if (t_before_or_eq(at, .1 + 2)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // after the third tween
                                                  expect(s.x).toBe(bs.x);
                                                  expect(s.y).toBe(bs.y);
                                              });
                              });

                          });

                      });

                      // TODO: test among with move()

                  });

              });

              describe("translate-to-path tween", function() {

                  describe("single one", function() {

                      describe("will change x/y values of the state according to given direction", function() {

                          it("works in case of simple values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP', [ 0, 1 ], 'M1 1 L12 12 Z' ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x + 1 + at * (12 - 1), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + 1 + at * (12 - 1), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of zero", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP', [ 0, 1 ], 'M0 11 L20 0 Z' ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x +  0 + at * (20 -  0), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + 11 + at * ( 0 - 11), CLOSE_FACTOR);
                                          });

                              // both zero?
                          });

                          it("works in case of mixed values (incl. negative)", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP', [ 0, 1 ], 'M12 15 L8 -11 Z' ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x + 12 + (at * (    8 - 12)), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + 15 + (at * ((-11) - 15)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of floating values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP', [ 0, 1 ], 'M13 -17.1 L8.5 -11 Z' ] ],
                                          function(s, at) {
                                              expect(s.x).toBeCloseTo(bs.x +      13 + (at * (  8.5 -      13)), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + (-17.1) + (at * ((-11) - (-17.1))), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of band not equal to element's band", function() {
                              checkTweens(bs, [.2, 2],
                                          [ [ 'transP', [.1, 1.65], 'M5 10 L16 17 Z' ] ],
                                          function(s, at) {
                                              // before the tween
                                              if (t_before(at, .2 + .1)) {
                                                  expect(s.x).toBe(bs.x);
                                                  expect(s.y).toBe(bs.y);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .2 + 1.65)) {
                                                  expect(s.x).toBe(bs.x);
                                                  expect(s.y).toBe(bs.y);
                                                  return true;
                                              }
                                              // during the tween
                                              expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .2 - .1) / (1.65 - .1)) * (16 -  5)), CLOSE_FACTOR);
                                              expect(s.y).toBeCloseTo(bs.y + 10 + (((at - .2 - .1) / (1.65 - .1)) * (17 - 10)), CLOSE_FACTOR);
                                          });
                          });

                      });

                  });

                  describe("several ones", function() {

                      describe("default implementation", function() {

                          describe("will override x/y values of the state according to given direction", function() {

                              describe("non-overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'transP', [  .3,   .9 ], 'M6 4 L9 15 Z'     ],
                                                    [ 'transP', [ 1.1, 1.85 ], 'M3 19 L8.4 -11 Z' ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x + 6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.85)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'transP', [ 1.1, 1.85 ], 'M3 19 L8.4 -11 Z' ],
                                                    [ 'transP', [  .3,   .9 ], 'M6 4 L9 15 Z'     ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x + 6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.85)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  3 + (((at - 1.1 - .15) / (1.85 - 1.1)) * (  8.4 -  3)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 19 + (((at - 1.1 - .15) / (1.85 - 1.1)) * ((-11) - 19)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });

                              });

                              describe("overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'transP', [.12,    .9 ], 'M5 12 L3.2 40 Z' ],
                                                    [ 'transP', [ .5,  1.56 ], 'M-1 9 L0 16 Z'   ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .5)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x + -1 + (((at - .5 - .2) / (1.56 - .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y +  9 + (((at - .5 - .2) / (1.56 - .5)) * (16 -    9)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.56)) {
                                                          expect(s.x).toBeCloseTo(bs.x + -1 + (((at - .5 - .2) / (1.56 - .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y +  9 + (((at - .5 - .2) / (1.56 - .5)) * (16 -    9)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'transP', [ .5,  1.56 ], 'M-1 9 L0 16 Z'   ],
                                                    [ 'transP', [.12,    .9 ], 'M5 12 L3.2 40 Z' ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.x).toBe(bs.x);
                                                          expect(s.y).toBe(bs.y);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .5)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.x).toBeCloseTo(bs.x +  5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5)), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y + 12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.56)) {
                                                          expect(s.x).toBeCloseTo(bs.x + -1 + (((at - .5 - .2) / (1.56 - .5)) * ( 0 - (-1))), CLOSE_FACTOR);
                                                          expect(s.y).toBeCloseTo(bs.y +  9 + (((at - .5 - .2) / (1.56 - .5)) * (16 -    9)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                  });
                                  });


                              });

                              it("works with more than two tweens", function() {
                                  checkTweens(bs, [.1, 3],
                                              [ [ 'transP', [   0,   1 ], 'M5 5 L10 12 Z' ],
                                                [ 'transP', [   1, 1.5 ], 'M7 7 L9 11 Z'  ],
                                                [ 'transP', [ 1.3,   2 ], 'M9 8 L11 22 Z' ] ],
                                              function(s, at) {
                                                  // before the first tween
                                                  if (t_before(at, .1 + 0)) {
                                                      expect(s.x).toBe(bs.x);
                                                      expect(s.y).toBe(bs.y);
                                                      return true;
                                                  }
                                                  // during the first tween
                                                  if (t_before(at, .1 + 1)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 5 + (((at - 0 - .1) / (1 - 0)) * (10 - 5)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 5 + (((at - 0 - .1) / (1 - 0)) * (12 - 5)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the second tween, but before the third one
                                                  if (t_before(at, .1 + 1.3)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 7 + (((at - 1 - .1) / (1.5 - 1)) * ( 9 - 7)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 7 + (((at - 1 - .1) / (1.5 - 1)) * (11 - 7)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during both the second and the third tweens
                                                  if (t_before_or_eq(at, .1 + 1.5)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the third tween, but after the second one
                                                  if (t_before_or_eq(at, .1 + 2)) {
                                                      expect(s.x).toBeCloseTo(bs.x + 9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9)), CLOSE_FACTOR);
                                                      expect(s.y).toBeCloseTo(bs.y + 8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // after the third tween
                                                  expect(s.x).toBe(bs.x);
                                                  expect(s.y).toBe(bs.y);
                                              });
                              });

                          });

                      });

                  });

                  // TODO: test among with move()
                  // TODO: test curve segments or combinations?

              });

              describe("scale tween", function() {

                  describe("single one", function() {

                      describe("will change sx/sy values of the state according to given values", function() {

                          it("works in case of simple values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'scale', [ 0, 1 ], [ [2, 3], [10, 20] ] ] ],
                                          function(s, at) {
                                              expect(s.sx).toBeCloseTo(bs.sx * ((2 * (1.0 - at)) + (10 * at)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((3 * (1.0 - at)) + (20 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of zero", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'scale', [ 0, 1 ], [ [0, 3], [4, 0] ] ] ],
                                          function(s, at) {
                                              expect(s.sx).toBeCloseTo(bs.sx * ((0 * (1.0 - at)) + (4 * at)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((3 * (1.0 - at)) + (0 * at)), CLOSE_FACTOR);
                                          });

                              // both zero?
                          });

                          it("works in case of mixed values (incl. negative)", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'scale', [ 0, 1 ], [ [-1, 3], [11, -5] ] ] ],
                                          function(s, at) {
                                              expect(s.sx).toBeCloseTo(bs.sx * (((-1) * (1.0 - at)) + (  11 * at)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((   3 * (1.0 - at)) + ((-5) * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of floating values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'scale', [ 0, 1 ], [ [-1.1, 2.3], [6, 14.7] ] ] ],
                                          function(s, at) {
                                              expect(s.sx).toBeCloseTo(bs.sx * (((-1.1) * (1.0 - at)) + (6    * at)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((   2.3 * (1.0 - at)) + (14.7 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of band not equal to element's band", function() {
                              checkTweens(bs, [.2, 2],
                                          [ [ 'scale', [.2, 1.3], [[6, 9], [12, 9.5]] ] ],
                                          function(s, at) {
                                              // before the tween
                                              if (t_before(at, .2 + .2)) {
                                                  expect(s.sx).toBe(bs.sx);
                                                  expect(s.sy).toBe(bs.sy);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .2 + 1.3)) {
                                                  expect(s.sx).toBe(bs.sx);
                                                  expect(s.sy).toBe(bs.sy);
                                                  return true;
                                              }
                                              // during the tween
                                              var adt = (at - .2 - .2) / (1.3 - .2);
                                              expect(s.sx).toBeCloseTo(bs.sx * ((6 * (1.0 - adt)) + ( 12 * adt)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((9 * (1.0 - adt)) + (9.5 * adt)), CLOSE_FACTOR);
                                          });
                          });

                      });

                  });

                  describe("several ones", function() {

                      describe("default implementation", function() {

                          describe("will override sx/sy values of the state according to given values", function() {

                              describe("non-overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'scale', [  .3,   .9 ], [[6,  4], [  9,  15]] ],
                                                    [ 'scale', [ 1.1, 1.83 ], [[3, 19], [8.4, -11]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.83)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * ( 3 + (((at - 1.1 - .15) / (1.83 - 1.1)) * (  8.4 -  3))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (19 + (((at - 1.1 - .15) / (1.83 - 1.1)) * ((-11) - 19))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });

                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'scale', [ 1.1, 1.83 ], [[3, 19], [8.4, -11]] ],
                                                    [ 'scale', [  .3,   .9 ], [[6,  4], [  9,  15]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (6 + (((at - .3 - .15) / (.9 - .3)) * ( 9 - 6))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.83)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * ( 3 + (((at - 1.1 - .15) / (1.83 - 1.1)) * (  8.4 -  3))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (19 + (((at - 1.1 - .15) / (1.83 - 1.1)) * ((-11) - 19))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });
                                  });

                              });

                              describe("overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'scale', [.12,   .9], [[ 5, 12], [3.2, 40]] ],
                                                    [ 'scale', [.54, 1.63], [[-1,  9], [  0, 16]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * ( 5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (-1 + (((at - .54 - .2) / (1.63 -  .54)) * ( 0 - (-1)))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * ( 9 + (((at - .54 - .2) / (1.63 -  .54)) * (16 -    9))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (-1 + (((at - .54 - .2) / (1.63 - .54)) * ( 0 - (-1)))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * ( 9 + (((at - .54 - .2) / (1.63 - .54)) * (16 -    9))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'scale', [.54, 1.63], [[-1,  9], [  0, 16]] ],
                                                    [ 'scale', [.12,   .9], [[ 5, 12], [3.2, 40]] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * ( 5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * ( 5 + (((at - .12 - .2) / (.9 - .12)) * (3.2 -  5))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (12 + (((at - .12 - .2) / (.9 - .12)) * ( 40 - 12))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (-1 + (((at - .54 - .2) / (1.63 - .54)) * ( 0 - (-1)))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * ( 9 + (((at - .54 - .2) / (1.63 - .54)) * (16 -    9))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });
                                  });


                              });

                              it("works with more than two tweens", function() {
                                  checkTweens(bs, [.1, 3],
                                              [ [ 'scale', [   0,   1 ], [ [5, 5], [10, 12] ] ],
                                                [ 'scale', [   1, 1.5 ], [ [7, 7], [ 9, 11] ] ],
                                                [ 'scale', [ 1.3,   2 ], [ [9, 8], [11, 22] ] ] ],
                                              function(s, at) {
                                                  // before the first tween
                                                  if (t_before(at, .1 + 0)) {
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                      return true;
                                                  }
                                                  // during the first tween
                                                  if (t_before(at, .1 + 1)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (5 + (((at - 0 - .1) / (1 - 0)) * (10 - 5))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (5 + (((at - 0 - .1) / (1 - 0)) * (12 - 5))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the second tween, but before the third one
                                                  if (t_before(at, .1 + 1.3)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (7 + (((at - 1 - .1) / (1.5 - 1)) * ( 9 - 7))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (7 + (((at - 1 - .1) / (1.5 - 1)) * (11 - 7))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during both the second and the third tweens
                                                  if (t_before_or_eq(at, .1 + 1.5)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the third tween, but after the second one
                                                  if (t_before_or_eq(at, .1 + 2)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (9 + (((at - 1.3 - .1) / (2 - 1.3)) * (11 - 9))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (8 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 8))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // after the third tween
                                                  expect(s.sx).toBe(bs.sx);
                                                  expect(s.sy).toBe(bs.sy);
                                              });
                              });

                          });

                      });

                  });

              });

              describe("xscale tween", function() {

                  describe("single one", function() {

                      describe("will change sx/sy values of the state according to given values", function() {

                          it("works in case of simple values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'xscale', [ 0, 1 ], [2, 20] ] ],
                                          function(s, at) {
                                              expect(s.sx).toBeCloseTo(bs.sx * ((2 * (1.0 - at)) + (20 * at)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((2 * (1.0 - at)) + (20 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of mixed values (incl. negative)", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'xscale', [ 0, 1 ], [-1, 3] ] ],
                                          function(s, at) {
                                              expect(s.sx).toBeCloseTo(bs.sx * (((-1) * (1.0 - at)) + (3 * at)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * (((-1) * (1.0 - at)) + (3 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of floating values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'xscale', [ 0, 1 ], [6, 14.7] ] ],
                                          function(s, at) {
                                              expect(s.sx).toBeCloseTo(bs.sx * ((6 * (1.0 - at)) + (14.7 * at)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((6 * (1.0 - at)) + (14.7 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of band not equal to element's band", function() {
                              checkTweens(bs, [.2, 2],
                                          [ [ 'xscale', [.25, 1.3], [12, 9.5] ] ],
                                          function(s, at) {
                                              // before the tween
                                              if (t_before(at, .2 + .25)) {
                                                  expect(s.sx).toBe(bs.sx);
                                                  expect(s.sy).toBe(bs.sy);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .2 + 1.3)) {
                                                  expect(s.sx).toBe(bs.sx);
                                                  expect(s.sy).toBe(bs.sy);
                                                  return true;
                                              }
                                              // during the tween
                                              var adt = (at - .25 - .2) / (1.3 - .25);
                                              expect(s.sx).toBeCloseTo(bs.sx * ((12 * (1.0 - adt)) + (9.5 * adt)), CLOSE_FACTOR);
                                              expect(s.sy).toBeCloseTo(bs.sy * ((12 * (1.0 - adt)) + (9.5 * adt)), CLOSE_FACTOR);
                                          });
                          });

                      });

                  });

                  describe("several ones", function() {

                      describe("default implementation", function() {

                          describe("will override sx/sy values of the state according to given values", function() {

                              describe("non-overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'xscale', [ .3,   .9], [  4,  15] ],
                                                    [ 'xscale', [1.1, 1.73], [8.4, -11] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.73)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (8.4 + (((at - 1.1 - .15) / (1.73 - 1.1)) * ((-11) - 8.4))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (8.4 + (((at - 1.1 - .15) / (1.73 - 1.1)) * ((-11) - 8.4))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });

                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'xscale', [1.1, 1.73], [8.4, -11] ],
                                                    [ 'xscale', [ .3,   .9], [  4,  15] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (4 + (((at - .3 - .15) / (.9 - .3)) * (15 - 4))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.73)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (8.4 + (((at - 1.1 - .15) / (1.73 - 1.1)) * ((-11) - 8.4))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (8.4 + (((at - 1.1 - .15) / (1.73 - 1.1)) * ((-11) - 8.4))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });
                                  });

                              });

                              describe("overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'xscale', [.12,   .9 ], [3.2, 40] ],
                                                    [ 'xscale', [.54, 1.63 ], [ .2, 16] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'xscale', [.54,  1.63 ], [ .2, 16] ],
                                                    [ 'xscale', [.12,    .9 ], [3.2, 40] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.sx).toBe(bs.sx);
                                                          expect(s.sy).toBe(bs.sy);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (3.2 + (((at - .12 - .2) / (.9 - .12)) * (40 - 3.2))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          expect(s.sx).toBeCloseTo(bs.sx * (.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2))), CLOSE_FACTOR);
                                                          expect(s.sy).toBeCloseTo(bs.sy * (.2 + (((at - .54 - .2) / (1.63 - .54)) * (16 - .2))), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                  });
                                  });


                              });

                              it("works with more than two tweens", function() {
                                  checkTweens(bs, [.1, 3],
                                              [ [ 'xscale', [   0,   1 ], [5, 12] ],
                                                [ 'xscale', [   1, 1.5 ], [7, 11] ],
                                                [ 'xscale', [ 1.3,   2 ], [9, 22] ] ],
                                              function(s, at) {
                                                  // before the first tween
                                                  if (t_before(at, .1 + 0)) {
                                                      expect(s.sx).toBe(bs.sx);
                                                      expect(s.sy).toBe(bs.sy);
                                                      return true;
                                                  }
                                                  // during the first tween
                                                  if (t_before(at, .1 + 1)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (5 + (((at - 0 - .1) / (1 - 0)) * (12 - 5))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (5 + (((at - 0 - .1) / (1 - 0)) * (12 - 5))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the second tween, but before the third one
                                                  if (t_before(at, .1 + 1.3)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (7 + (((at - 1 - .1) / (1.5 - 1)) * (11 - 7))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (7 + (((at - 1 - .1) / (1.5 - 1)) * (11 - 7))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during both the second and the third tweens
                                                  if (t_before_or_eq(at, .1 + 1.5)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (9 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 9))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (9 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 9))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the third tween, but after the second one
                                                  if (t_before_or_eq(at, .1 + 2)) {
                                                      expect(s.sx).toBeCloseTo(bs.sx * (9 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 9))), CLOSE_FACTOR);
                                                      expect(s.sy).toBeCloseTo(bs.sy * (9 + (((at - 1.3 - .1) / (2 - 1.3)) * (22 - 9))), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // after the third tween
                                                  expect(s.sx).toBe(bs.sx);
                                                  expect(s.sy).toBe(bs.sy);
                                              });
                              });

                          });

                      });

                  });

              });

              describe("rotate tween", function() {

                  describe("single one", function() {

                      describe("will change angle value of the state according to given rotation", function() {

                          it("works in case of simple values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'rotate', [ 0, 1 ], [Math.PI / 2, Math.PI] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + ((Math.PI / 2) * (1.0 - at)) + (Math.PI * at), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of zero", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'rotate', [ 0, 1 ], [0, Math.PI / 3] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + (0 * (1.0 - at)) + ((Math.PI / 3) * at), CLOSE_FACTOR);
                                          });

                              // both zero, left zero?
                          });

                          it("works in case of mixed values (incl. negative)", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'rotate', [ 0, 1 ], [2 * -(Math.PI / 5), Math.PI / 3] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + ((2 * -(Math.PI / 5)) * (1.0 - at)) + ((Math.PI / 3) * at), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of floating values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'rotate', [ 0, 1 ], [.8 * Math.PI, 2.1 * Math.PI] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + ((.8 * Math.PI) * (1.0 - at)) + ((2.1 * Math.PI) * at), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of band not equal to element's band", function() {
                              checkTweens(bs, [.18, 1.76],
                                          [ [ 'rotate', [.32, 1.64], [Math.PI / 6, Math.PI / 2] ] ],
                                          function(s, at) {
                                              // before the tween
                                              if (t_before(at, .18 + .32)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .18 + 1.64)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // during the tween
                                              var adt = (at - .32 - .18) / (1.64 - .32);
                                              expect(s.angle).toBeCloseTo(bs.angle + ((Math.PI / 6) * (1.0 - adt)) + ((Math.PI / 2) * adt), CLOSE_FACTOR);
                                          });
                          });

                      });

                  });

                  describe("several ones", function() {

                      describe("default implementation", function() {

                          describe("will override angle value of the state according to given rotation", function() {

                              describe("non-overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'rotate', [ .3,   .9], [      4,   15] ],
                                                    [ 'rotate', [1.1, 1.81], [Math.PI, 0.11] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.angle).toBe(bs.angle);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          var adt = (at - .3 - .15) / (.9 - .3);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (4 * (1.0 - adt)) + (15 * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.angle).toBe(bs.angle);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.81)) {
                                                          var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (Math.PI * (1.0 - adt)) + (0.11 * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.angle).toBe(bs.angle);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'rotate', [1.1, 1.81], [Math.PI, 0.11] ],
                                                    [ 'rotate', [ .3,   .9], [      4,   15] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.angle).toBe(bs.angle);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          var adt = (at - .3 - .15) / (.9 - .3);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (4 * (1.0 - adt)) + (15 * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.angle).toBe(bs.angle);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.81)) {
                                                          var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (Math.PI * (1.0 - adt)) + (0.11 * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.angle).toBe(bs.angle);
                                                  });
                                  });

                              });

                              describe("overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'rotate', [.12,    .9 ], [3.14,     2 * Math.PI] ],
                                                    [ 'rotate', [.54,  1.63 ], [ .22, Math.PI * 3 / 5] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.angle).toBe(bs.angle);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          var adt = (at - .12 - .2) / (.9 - .12);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (3.14 * (1.0 - adt)) + ((2 * Math.PI) * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both the first and the second tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          var adt = (at - .54 - .2) / (1.63 - .54);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (.22 * (1.0 - adt)) + ((Math.PI * 3 / 5) * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          var adt = (at - .54 - .2) / (1.63 - .54);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (.22 * (1.0 - adt)) + ((Math.PI * 3 / 5) * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.angle).toBe(bs.angle);
                                                  });

                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'rotate', [.54,  1.63 ], [ .22, Math.PI * 3 / 5] ],
                                                    [ 'rotate', [.12,    .9 ], [3.14,     2 * Math.PI] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.angle).toBe(bs.angle);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          var adt = (at - .12 - .2) / (.9 - .12);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (3.14 * (1.0 - adt)) + ((2 * Math.PI) * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both the first and the second tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          var adt = (at - .12 - .2) / (.9 - .12);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (3.14 * (1.0 - adt)) + ((  2 * Math.PI  ) * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          var adt = (at - .54 - .2) / (1.63 - .54);
                                                          expect(s.angle).toBeCloseTo(bs.angle + (.22 * (1.0 - adt)) + ((Math.PI * 3 / 5) * adt), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.angle).toBe(bs.angle);
                                                  });
                                  });

                              });

                              it("works with more than two tweens", function() {

                                  checkTweens(bs, [.1, 3],
                                              [ [ 'rotate', [   0,   1 ], [ Math.PI * 1 / 6,   Math.PI / 5 ] ],
                                                [ 'rotate', [   1, 1.5 ], [         Math.PI,   Math.PI / 2 ] ],
                                                [ 'rotate', [ 1.3,   2 ], [ Math.PI * 5 / 4, 1.9 * Math.PI ] ] ],
                                              function(s, at) {
                                                  // before the first tween
                                                  if (t_before(at, .1 + 0)) {
                                                      expect(s.angle).toBe(bs.angle);
                                                      return true;
                                                  }
                                                  // during the first tween
                                                  if (t_before(at, .1 + 1)) {
                                                      var adt = (at - 0 - .1) / (1 - 0);
                                                      expect(s.angle).toBeCloseTo(bs.angle + ((Math.PI * 1 / 6) * (1.0 - adt)) + ((Math.PI / 5) * adt), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the second tween, but before the third one
                                                  if (t_before(at, .1 + 1.3)) {
                                                      var adt = (at - 1 - .1) / (1.5 - 1);
                                                      expect(s.angle).toBeCloseTo(bs.angle + (Math.PI * (1.0 - adt)) + ((Math.PI / 2) * adt), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during both the second and the third tweens
                                                  if (t_before_or_eq(at, .1 + 1.5)) {
                                                      var adt = (at - 1.3 - .1) / (  2 - 1.3);
                                                      expect(s.angle).toBeCloseTo(bs.angle + ((Math.PI * 5 / 4) * (1.0 - adt)) + ((1.9 * Math.PI) * adt), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the third tween, but after the second one
                                                  if (t_before_or_eq(at, .1 + 2)) {
                                                      var adt = (at - 1.3 - .1) / (2 - 1.3);
                                                      expect(s.angle).toBeCloseTo(bs.angle + ((Math.PI * 5 / 4) * (1.0 - adt)) + ((1.9 * Math.PI) * adt), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // after the third tween
                                                  expect(s.angle).toBe(bs.angle);
                                              });

                              });

                          });

                      });

                  });

              });

              describe("rotate-to-path tween", function() {

                  describe("single one", function() {

                      describe("should change angle value of the state according to given path", function() {

                          it("works in case of simple values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP',  [ 0, 1 ], 'M0 0 L12 12 Z' ],
                                            [ 'rotateP', [ 0, 1 ] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + (at !== 0 ? (Math.PI / 4) : 0), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of zero", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP',  [ 0, 1 ], 'M0 0 L0 0 Z' ],
                                            [ 'rotateP', [ 0, 1 ] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + 0, CLOSE_FACTOR);
                                          });

                              // both zero?
                          });

                          it("works in case of mixed values (incl. negative)", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP',  [ 0, 1 ], 'M0 -10 L0 10 Z' ],
                                            [ 'rotateP', [ 0, 1 ] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + (at !== 0 ? (Math.PI / 2) : Math.PI), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of floating values", function() {
                              var x0 = Math.cos(4 * Math.PI / 3),
                                  y0 = Math.sin(4 * Math.PI / 3),
                                  x1 = Math.cos(    Math.PI / 3),
                                  y1 = Math.sin(    Math.PI / 3);
                              checkTweens(bs, [0, 1],
                                          [ [ 'transP',  [ 0, 1 ], 'M'+x0+' '+y0+' L'+x1+' '+y1+' Z' ],
                                            [ 'rotateP', [ 0, 1 ] ] ],
                                          function(s, at) {
                                              expect(s.angle).toBeCloseTo(bs.angle + (at !== 0 ? (Math.PI / 3) : -(5 * Math.PI / 6)), CLOSE_FACTOR);
                                          });
                          });

                          // angle has the value of 0 in the very first point, so some comparisons differ to other tween types

                          it("works in case of band not equal to element's band", function() {
                              checkTweens(bs, [.5, 1.9],
                                          [ [ 'transP',  [.1, 1.2], 'M0 0 L-8 -8 Z' ],
                                            [ 'rotateP', [.1, 1.2] ] ],
                                          function(s, at) {
                                              // before the tween or at t == 0 for rotation
                                              if (t_before_or_eq(at, .5 + .1)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .5 + 1.2)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // during the tween
                                              expect(s.angle).toBeCloseTo(bs.angle + (-(3 * Math.PI / 4)), CLOSE_FACTOR);
                                          });
                          });

                          // FIXME: test for several paths applied

                          it("works if path band exceeds rotateP band", function() {
                              checkTweens(bs, [.5, 1.9],
                                          [ [ 'transP',  [.1, 1.2], 'M0 0 L-8 -8 Z' ],
                                            [ 'rotateP', [.5, 1.2] ] ],
                                          function(s, at) {
                                              // before the tween or at t == 0 for rotation
                                              if (t_before_or_eq(at, .5 + .5)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .5 + 1.2)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // during the tween
                                              expect(s.angle).toBeCloseTo(bs.angle + (-(3 * Math.PI / 4)), CLOSE_FACTOR);
                                          });
                          });

                          it("works if there is no path at some part of a band", function() {
                              checkTweens(bs, [.5, 1.9],
                                          [ [ 'transP',  [.5, 1.2], 'M0 0 L-8 -8 Z' ],
                                            [ 'rotateP', [.1, 1.2] ] ],
                                          function(s, at) {
                                              // before the path tween
                                              // (rot-to-path tween do gives 0 in first point of tween (t == 0),
                                              //  however since there's no path there anyway for that moment,
                                              //  we make no equal-comparison for the path tween)
                                              if (t_before(at, .5 + .5)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // after the path tween
                                              if (t_after(at, .5 + 1.2)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // during the tween
                                              expect(s.angle).toBeCloseTo(bs.angle + (-(3 * Math.PI / 4)), CLOSE_FACTOR);
                                          });
                          });

                          it("uses the last path when there are several paths inside of a tween band", function() {
                              checkTweens(bs, [.5, 1.9],
                                          [ [ 'transP',  [.1,  .5], 'M0 0 L-8 -8 Z' ],
                                            [ 'transP',  [.5, 1.2], 'M0 0 L12 12 Z' ],
                                            [ 'rotateP', [.1, 1.2] ] ],
                                          function(s, at) {
                                              // before the path tweens
                                              // (since rot-to-path path gives 0 at t == 0, and
                                              //  path tween matches its start, we actually do equal-comparison)
                                              if (t_before_or_eq(at, .5 + .1)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // during the first path tween
                                              if (t_before(at, .5 + .5)) {
                                                  expect(s.angle).toBeCloseTo(bs.angle + (-(3 * Math.PI / 4)), CLOSE_FACTOR);
                                                  return true;
                                              }
                                              // during the second path tween
                                              if (t_before_or_eq(at, .5 + 1.2)) {
                                                  expect(s.angle).toBeCloseTo(bs.angle + (Math.PI / 4), CLOSE_FACTOR);
                                                  return true;
                                              }
                                              // after the tweens
                                              expect(s.angle).toBe(bs.angle);
                                          });
                          });

                      });

                  });

                  describe("several ones", function() {

                      it("should override angle value of the state according to current path", function() {
                          checkTweens(bs, [.5, 1.9],
                                      [ [ 'transP',  [.1,   .5], 'M0 0 L-8 -8 Z' ],
                                        [ 'rotateP', [.1, 1.05] ],
                                        [ 'rotateP', [.5,  1.2] ] ],
                                          function(s, at) {
                                              // before the first tween
                                              // (since rot-to-path path gives 0 at t == 0, and
                                              //  path tween matches its start, we actually do equal-comparison)
                                              if (t_before_or_eq(at, .5 + .1)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // during the first tween, but before the second one
                                              if (t_before(at, .5 + .5)) {
                                                  expect(s.angle).toBeCloseTo(bs.angle + (-(3 * Math.PI / 4)), CLOSE_FACTOR);
                                                  return true;
                                              }
                                              // during both the first and the second tweens
                                              if (t_before_or_eq(at, .5 + 1.05)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // during the second tween, but after the first one
                                              if (t_before_or_eq(at, .5 + 1.2)) {
                                                  expect(s.angle).toBe(bs.angle);
                                                  return true;
                                              }
                                              // after the second tween
                                              expect(s.angle).toBe(bs.angle);
                                          });
                      });

                      // FIXME: test other cases: where bands overlap or not

                  });

              });

              describe("alpha tween", function() {

                  describe("single one", function() {

                      describe("will change alpha value of the state", function() {

                          it("works in case of simple values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'alpha', [ 0, 1 ], [3, 1] ] ],
                                          function(s, at) {
                                              expect(s.alpha).toBeCloseTo(bs.alpha * ((3 * (1.0 - at)) + (1 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of zero", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'alpha', [ 0, 1 ], [8, 0] ] ],
                                          function(s, at) {
                                              expect(s.alpha).toBeCloseTo(bs.alpha * ((8 * (1.0 - at)) + (0 * at)), CLOSE_FACTOR);
                                          });

                              // both zero, left zero?
                          });

                          it("works in case of mixed values (incl. negative)", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'alpha', [ 0, 1 ], [-1, 6] ] ],
                                          function(s, at) {
                                              expect(s.alpha).toBeCloseTo(bs.alpha * (((-1) * (1.0 - at)) + (6 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of floating values", function() {
                              checkTweens(bs, [0, 1],
                                          [ [ 'alpha', [ 0, 1 ], [.8, 1.2] ] ],
                                          function(s, at) {
                                              expect(s.alpha).toBeCloseTo(bs.alpha * ((.8 * (1.0 - at)) + (1.2 * at)), CLOSE_FACTOR);
                                          });
                          });

                          it("works in case of band not equal to element's band", function() {
                              checkTweens(bs, [.18, 1.76],
                                          [ [ 'alpha', [.32, 1.64], [.5, .84] ] ],
                                          function(s, at) {
                                              // before the tween
                                              if (t_before(at, .18 + .32)) {
                                                  expect(s.alpha).toBe(bs.alpha);
                                                  return true;
                                              }
                                              // after the tween
                                              if (t_after(at, .18 + 1.64)) {
                                                  expect(s.alpha).toBe(bs.alpha);
                                                  return true;
                                              }
                                              // during the tween
                                              var adt = (at - .32 - .18) / (1.64 - .32);
                                              expect(s.alpha).toBeCloseTo(bs.alpha * ((.5 * (1.0 - adt)) + (.84 * adt)), CLOSE_FACTOR);
                                          });
                          });

                      });

                  });

                  describe("several ones", function() {

                      describe("default implementation", function() {

                          describe("will override alpha value of the state", function() {

                              describe("non-overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'alpha', [ .3,   .9], [.3, 1.1] ],
                                                    [ 'alpha', [1.1, 1.81], [.1,  .9] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.alpha).toBe(bs.alpha);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          var adt = (at - .3 - .15) / (.9 - .3);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((.3 * (1.0 - adt)) + (1.1 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.alpha).toBe(bs.alpha);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.81)) {
                                                          var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((.1 * (1.0 - adt)) + (.9 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.alpha).toBe(bs.alpha);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.15, 2],
                                                  [ [ 'alpha', [1.1, 1.81], [.1,  .9] ],
                                                    [ 'alpha', [ .3,   .9], [.3, 1.1] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .15 + .3)) {
                                                          expect(s.alpha).toBe(bs.alpha);
                                                          return true;
                                                      }
                                                      // during the first tween
                                                      if (t_before_or_eq(at, .15 + .9)) {
                                                          var adt = (at - .3 - .15) / (.9 - .3);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((.3 * (1.0 - adt)) + (1.1 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // between the both tweens
                                                      if (t_before(at, .15 + 1.1)) {
                                                          expect(s.alpha).toBe(bs.alpha);
                                                          return true;
                                                      }
                                                      // during the second tween
                                                      if (t_before_or_eq(at, .15 + 1.81)) {
                                                          var adt = (at - 1.1 - .15) / (1.81 - 1.1);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((.1 * (1.0 - adt)) + (.9 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.alpha).toBe(bs.alpha);
                                                  });
                                  });

                              });

                              describe("overlapping bands", function() {

                                  it("works with sequential tweens", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'alpha', [.12,    .9 ], [.25,  5] ],
                                                    [ 'alpha', [.54,  1.63 ], [  7, 20] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.alpha).toBe(bs.alpha);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          var adt = (at - .12 - .2) / (.9 - .12);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((.25 * (1.0 - adt)) + (5 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both the first and the second tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          var adt = (at - .54 - .2) / (1.63 - .54);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((7 * (1.0 - adt)) + (20 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          var adt = (at - .54 - .2) / (1.63 - .54);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((7 * (1.0 - adt)) + (20 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.alpha).toBe(bs.alpha);
                                                  });
                                  });

                                  it("works with tweens that were added in reverse order", function() {
                                      checkTweens(bs, [.2, 1.8],
                                                  [ [ 'alpha', [.54,  1.63 ], [  7, 20] ],
                                                    [ 'alpha', [.12,    .9 ], [.25,  5] ] ],
                                                  function(s, at) {
                                                      // before the first tween
                                                      if (t_before(at, .2 + .12)) {
                                                          expect(s.alpha).toBe(bs.alpha);
                                                          return true;
                                                      }
                                                      // during the first tween, but before the second one
                                                      if (t_before(at, .2 + .54)) {
                                                          var adt = (at - .12 - .2) / (.9 - .12);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((.25 * (1.0 - adt)) + (5 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during both the first and the second tweens
                                                      if (t_before_or_eq(at, .2 + .9)) {
                                                          var adt = (at - .12 - .2) / (.9 - .12);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((.25 * (1.0 - adt)) + (5 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // during the second tween, but after the first one
                                                      if (t_before_or_eq(at, .2 + 1.63)) {
                                                          var adt = (at - .54 - .2) / (1.63 - .54);
                                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((7 * (1.0 - adt)) + (20 * adt)), CLOSE_FACTOR);
                                                          return true;
                                                      }
                                                      // after the second tween
                                                      expect(s.alpha).toBe(bs.alpha);
                                                  });

                                  });

                              });

                              it("works with more than two tweens", function() {

                                  checkTweens(bs, [.1, 3],
                                              [ [ 'alpha', [   0,   1 ], [ .2, .18 ] ],
                                                [ 'alpha', [   1, 1.5 ], [ .5,  .8 ] ],
                                                [ 'alpha', [ 1.3,   2 ], [ .6, .97 ] ] ],
                                              function(s, at) {
                                                  // before the first tween
                                                  if (t_before(at, .1 + 0)) {
                                                      expect(s.alpha).toBe(bs.alpha);
                                                      return true;
                                                  }
                                                  // during the first tween
                                                  if (t_before(at, .1 + 1)) {
                                                      var adt = (at - 0 - .1) / (1 - 0);
                                                      expect(s.alpha).toBeCloseTo(bs.alpha * ((.2 * (1.0 - adt)) + (.18 * adt)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the second tween, but before the third one
                                                  if (t_before(at, .1 + 1.3)) {
                                                      var adt = (at - 1 - .1) / (1.5 - 1);
                                                      expect(s.alpha).toBeCloseTo(bs.alpha * ((.5 * (1.0 - adt)) + (.8 * adt)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during both the second and the third tweens
                                                  if (t_before_or_eq(at, .1 + 1.5)) {
                                                      var adt = (at - 1.3 - .1) / (2 - 1.3);
                                                      expect(s.alpha).toBeCloseTo(bs.alpha * ((.6 * (1.0 - adt)) + (.97 * adt)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // during the third tween, but after the second one
                                                  if (t_before_or_eq(at, .1 + 2)) {
                                                      var adt = (at - 1.3 - .1) / (2 - 1.3);
                                                      expect(s.alpha).toBeCloseTo(bs.alpha * ((.6 * (1.0 - adt)) + (.97 * adt)), CLOSE_FACTOR);
                                                      return true;
                                                  }
                                                  // after the third tween
                                                  expect(s.alpha).toBe(bs.alpha);
                                              });

                              });

                          });

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
                  // FIXME: easing functions are different for relative and not-relative tweens

                  describe("translate tween", function() {

                      it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'trans', [ 0, 1 ], [[0, 0], [10, 40]], function(t) { return 1 - t; } ] ],
                                      function(s, at) {
                                          expect(s.x).toBeCloseTo(bs.x + (1 - at) * 10, CLOSE_FACTOR);
                                          expect(s.y).toBeCloseTo(bs.y + (1 - at) * 40, CLOSE_FACTOR);
                                      });
                      });

                      it("supports overriden easing in narrow band", function() {
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'trans', [ .3, 1 ], [[50, 11], [10, 40]], function(t, len) { return len - t; } ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // during tween
                                          var adt = (at - .3 - .1) / (1 - .3);
                                          expect(s.x).toBeCloseTo(bs.x + 50 + ((1 - adt) * (10 - 50)), CLOSE_FACTOR);
                                          expect(s.y).toBeCloseTo(bs.y + 11 + ((1 - adt) * (40 - 11)), CLOSE_FACTOR);
                                      });
                      });

                      it("supports predefined easing in narrow band", function() {
                          var seg = anm.Easing.__SEGS['EIN'];
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'trans', [ .3, 1 ], [[50, 11], [10, 40]], anm.C.E_EIN ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // during tween
                                          var seg_t = seg.atT([0, 0], t_adjust(at - .3 - .1) / t_adjust(1 - .3))[1];
                                          expect(s.x).toBeCloseTo(bs.x + 50 + (seg_t * (10 - 50)), CLOSE_FACTOR);
                                          expect(s.y).toBeCloseTo(bs.y + 11 + (seg_t * (40 - 11)), CLOSE_FACTOR);
                                      });
                      });

                  });

                  describe("translate-to-path tween", function() {

                      it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'transP', [ 0, 1 ], 'M0 0 L10 40 Z', function(t) { return 1 - t; } ] ],
                                      function(s, at) {
                                          expect(s.x).toBeCloseTo(bs.x + (1 - at) * 10, CLOSE_FACTOR);
                                          expect(s.y).toBeCloseTo(bs.y + (1 - at) * 40, CLOSE_FACTOR);
                                      });
                      });

                      it("supports overriden easing in narrow band", function() {
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'transP', [ .3, 1 ], 'M50 11 L10 40 Z', function(t, len) { return len - t; } ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // during tween
                                          var adt = (at - .3 - .1) / (1 - .3);
                                          expect(s.x).toBeCloseTo(bs.x + 50 + ((1 - adt) * (10 - 50)), CLOSE_FACTOR);
                                          expect(s.y).toBeCloseTo(bs.y + 11 + ((1 - adt) * (40 - 11)), CLOSE_FACTOR);
                                      });
                      });

                      it("supports predefined easing in narrow band", function() {
                          var seg = anm.Easing.__SEGS['EIN'];
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'transP', [ .3, 1 ], 'M50 11 L10 40 Z', anm.C.E_EIN ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.x).toBe(bs.x);
                                              expect(s.y).toBe(bs.y);
                                              return true;
                                          }
                                          // during tween
                                          var seg_t = seg.atT([0, 0], (at - .3 - .1) / (1 - .3))[1];
                                          expect(s.x).toBeCloseTo(bs.x + 50 + (seg_t * (10 - 50)), CLOSE_FACTOR);
                                          expect(s.y).toBeCloseTo(bs.y + 11 + (seg_t * (40 - 11)), CLOSE_FACTOR);
                                      });
                      });

                  });

                  describe("scale tween", function() {

                      it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'scale', [ 0, 1 ], [[0, 0], [.25, 1]], function(t) { return 1 - t; } ] ],
                                      function(s, at) {
                                          expect(s.sx).toBeCloseTo(bs.sx * ((1 - at) * .25), CLOSE_FACTOR);
                                          expect(s.sy).toBeCloseTo(bs.sy * ((1 - at) *   1), CLOSE_FACTOR);
                                      });
                      });

                      it("supports overriden easing in narrow band", function() {
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'scale', [ .3, 1 ], [[.5, .11], [.25, 1]], function(t, len) { return len - t; } ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // during tween
                                          var adt = (at - .3 - .1) / (1 - .3);
                                          expect(s.sx).toBeCloseTo(bs.sx * ( .5 + ((1 - adt) * (.25 -  .5))), CLOSE_FACTOR);
                                          expect(s.sy).toBeCloseTo(bs.sy * (.11 + ((1 - adt) * (  1 - .11))), CLOSE_FACTOR);
                                      });
                      });

                      it("supports predefined easing in narrow band", function() {
                          var seg = anm.Easing.__SEGS['EIN'];
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'scale', [ .3, 1 ], [[.5, .11], [.25, 1]], anm.C.E_EIN ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // during tween
                                          var seg_t = seg.atT([0, 0], (at - .3 - .1) / (1 - .3))[1];
                                          expect(s.sx).toBeCloseTo(bs.sx * ( .5 + (seg_t * (.25 -  .5))), CLOSE_FACTOR);
                                          expect(s.sy).toBeCloseTo(bs.sy * (.11 + (seg_t * (  1 - .11))), CLOSE_FACTOR);
                                      });
                      });

                  });

                  describe("xscale tween", function() {

                      it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'xscale', [ 0, 1 ], [0, .7], function(t) { return 1 - t; } ] ],
                                      function(s, at) {
                                          expect(s.sx).toBeCloseTo(bs.sx * ((1 - at) * .7), CLOSE_FACTOR);
                                          expect(s.sy).toBeCloseTo(bs.sy * ((1 - at) * .7), CLOSE_FACTOR);
                                      });
                      });

                      it("supports overriden easing in narrow band", function() {
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'xscale', [ .3, 1 ], [.5, 2.1], function(t, len) { return len - t; } ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // during tween
                                          var adt = (at - .3 - .1) / (1 - .3);
                                          expect(s.sx).toBeCloseTo(bs.sx * (.5 + ((1 - adt) * (2.1 - .5))), CLOSE_FACTOR);
                                          expect(s.sy).toBeCloseTo(bs.sy * (.5 + ((1 - adt) * (2.1 - .5))), CLOSE_FACTOR);
                                      });
                      });

                      it("supports predefined easing in narrow band", function() {
                          var seg = anm.Easing.__SEGS['EIN'];
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'xscale', [ .3, 1 ], [.5, 2.1], anm.C.E_EIN ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.sx).toBe(bs.sx);
                                              expect(s.sy).toBe(bs.sy);
                                              return true;
                                          }
                                          // during tween
                                          var seg_t = seg.atT([0, 0], (at - .3 - .1) / (1 - .3))[1];
                                          expect(s.sx).toBeCloseTo(bs.sx * (.5 + (seg_t * (2.1 - .5))), CLOSE_FACTOR);
                                          expect(s.sy).toBeCloseTo(bs.sy * (.5 + (seg_t * (2.1 - .5))), CLOSE_FACTOR);
                                      });
                      });

                  });

                  describe("rotate tween", function() {

                      it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'rotate', [ 0, 1 ], [0, Math.PI / 2], function(t) { return 1 - t; } ] ],
                                      function(s, at) {
                                          expect(s.angle).toBeCloseTo(bs.angle + (1 - at) * Math.PI / 2, CLOSE_FACTOR);
                                      });
                      });

                      it("supports overriden easing in narrow band", function() {
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'rotate', [ .3, 1 ], [Math.PI / 2, 3 * Math.PI / 4], function(t, len) { return len - t; } ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.angle).toBe(bs.angle);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.angle).toBe(bs.angle);
                                              return true;
                                          }
                                          // during tween
                                          var adt = (at - .3 - .1) / (1 - .3);
                                          expect(s.angle).toBeCloseTo(bs.angle + (Math.PI / 2) +
                                               ((1 - adt) * ((3 * Math.PI / 4) - (Math.PI / 2))), CLOSE_FACTOR);
                                      });
                      });

                      it("supports predefined in narrow band", function() {
                          var seg = anm.Easing.__SEGS['EIN'];
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'rotate', [ .3, 1 ], [Math.PI / 2, 3 * Math.PI / 4], anm.C.E_EIN ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.angle).toBe(bs.angle);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.angle).toBe(bs.angle);
                                              return true;
                                          }
                                          // during tween
                                          var seg_t = seg.atT([0, 0], (at - .3 - .1) / (1 - .3))[1];
                                          expect(s.angle).toBeCloseTo(bs.angle + (Math.PI / 2) +
                                                   (seg_t * ((3 * Math.PI / 4) - (Math.PI / 2))), CLOSE_FACTOR);
                                      });
                      });

                  });

                  describe("rotate-to-path tween", function() {

                      // FIXME: check with transP and complex path
                      /* it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'trans', [0, .5], [ [0, 0], [10, 10] ] ],
                                        [ 'trans', [.5, 1], [ [0, 0], [0, -10] ] ],
                                        [ 'rotateP', [ 0, 1 ], function(t) { return (t == 1) ? 0 : 1; } ] ],
                                      function(s, at) {
                                          if (at > .5) expect(s.angle).toBeCloseTo(bs.angle + Math.PI / 4, CLOSE_FACTOR);
                                          else expect(s.angle).toBeCloseTo(bs.angle + -(Math.PI / 2), CLOSE_FACTOR);
                                      });
                      }); */

                      it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'trans', [0, 1], [ [0, 0], [0, -10] ] ],
                                        [ 'rotateP', [ 0, 1 ], function(t) { return (t == 1) ? 0 : 1; } ] ],
                                      function(s, at) {
                                          if (at == 1) expect(s.angle).toBe(bs.angle +              0, CLOSE_FACTOR);
                                          else  expect(s.angle).toBeCloseTo(bs.angle + -(Math.PI / 2), CLOSE_FACTOR);
                                      });
                      });

                      // FIXME: test
                      /* it("supports overriden easing in narrow band", function() {
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'trans', [ .3, 1 ], [ [0, 0], [0, -10] ] ],
                                        [ 'rotateP', [ .3, 1 ], function(t) { return (t == 1) ? 0 : 1; } ] ],
                                      function(s, at) {
                                          if (t_after(at, .1 + .3)) expect(s.angle).toBe(bs.angle + 0, CLOSE_FACTOR);
                                          else expect(s.angle).toBeCloseTo(bs.angle + -(Math.PI / 2), CLOSE_FACTOR);
                                      });
                      }); */

                      // FIXME: test
                      /* it("supports predefined in narrow band", function() {
                          var seg = anm.Easing.__SEGS['EIN'];
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'rotate', [ .3, 1 ], [Math.PI / 2, 3 * Math.PI / 4], anm.C.E_EIN ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.angle).toBe(bs.angle);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.angle).toBe(bs.angle);
                                              return true;
                                          }
                                          // during tween
                                          var seg_t = seg.atT([0, 0], (at - .3 - .1) / (1 - .3))[1];
                                          expect(s.angle).toBeCloseTo(bs.angle + (Math.PI / 2) +
                                                (seg_t * ((3 * Math.PI / 4) - (Math.PI / 2))), CLOSE_FACTOR);
                                      });
                      }); */

                  });

                  describe("alpha tween", function() {

                      it("supports overriden easing", function() {
                          checkTweens(bs, [0, 1],
                                      [ [ 'alpha', [ 0, 1 ], [0, .4], function(t) { return 1 - t; } ] ],
                                      function(s, at) {
                                          expect(s.alpha).toBeCloseTo(bs.alpha * ((1 - at) * .4), CLOSE_FACTOR);
                                      });
                      });

                      it("supports overriden easing in narrow band", function() {
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'alpha', [ .3, 1 ], [.3, 1], function(t, len) { return len - t; } ] ],
                                      function(s, at) {
                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.alpha).toBe(bs.alpha);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.alpha).toBe(bs.alpha);
                                              return true;
                                          }
                                          // during tween
                                          var adt = (at - .3 - .1) / (1 - .3);
                                          expect(s.alpha).toBeCloseTo(bs.alpha * (.3 + ((1 - adt) * (1 - .3))), CLOSE_FACTOR);
                                      });
                      });

                      it("supports predefined easing in narrow band", function() {
                          var seg = anm.Easing.__SEGS['EIN'];
                          checkTweens(bs, [.1, 1.5],
                                      [ [ 'alpha', [ .3, 1 ], [.3, 1], anm.C.E_EIN ] ],
                                      function(s, at) {

                                          // before tween
                                          if (t_before(at, .1 + .3)) {
                                              expect(s.alpha).toBe(bs.alpha);
                                              return true;
                                          }
                                          // after tween
                                          if (t_after(at, .1 + 1)) {
                                              expect(s.alpha).toBe(bs.alpha);
                                              return true;
                                          }
                                          // during tween
                                          var seg_t = seg.atT([0, 0], (at - .3 - .1) / (1 - .3))[1];
                                          expect(s.alpha).toBeCloseTo(bs.alpha * (.3 + (seg_t * (1 - .3))), CLOSE_FACTOR);
                                      });
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