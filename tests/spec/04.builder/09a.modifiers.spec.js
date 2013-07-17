/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("builder, regarding modifiers,", function() {

    var player,
        C = anm.C;

    var b = Builder._$,
        B = Builder;

    var FPS = 10,
        mFPS = 1 / FPS,
        _fg;

    var DEFAULT_ELM_LEN = anm.Element.DEFAULT_LEN;

    var CLOSE_FACTOR = 14,
        T_PRECISION = anm.__dev.TIME_PRECISION - 1; // 14; // digits following floating point
    // TODO: change all toBeCloseTo with _t to use T_CLOSE_FACTOR

    var _t = anm.__dev.adjust;

    var scene;

    beforeEach(function() {
        this.addMatchers(_matchers.calls);
        this.addMatchers(_matchers.comparison);

        /* this.addMatchers({
            'toBeAdjusted': function(expected) {
                var actual = this.actual;
                var notText = this.isNot ? " not" : "";

                this.message = function () {
                    return "Expected " + actual + notText + " to be, adjusted, " +
                           _t(expected) + "(initial value was: " + expected + ")";
                };

                return (actual === _t(expected));
            }
        }); */

        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn().run(FPS);

        // sandbox mode is enabled not to mess with still-preview used for video-mode
        // (it calls drawAt and causes modifiers to be called once more before starting playing)
        player = createPlayer('test-id', { mode: C.M_SANDBOX });
    });

    afterEach(function() { _fg.stop().destroy(); });

    describe("independently of modifier class,", function() {

        var curClass; // function that creates first arguments for a 'modify' call, it is done
                      // to vary all of modifier types

        var _duration = 1.5,
            _timeout = _duration + .2;

        var _justPlay = function() { player.play(); },
            _playFrom = function(from) { return function() { player.play(from, 1, 1 / (FPS * 2)); } };

        var _band_val,
            _run; // which player action to perform: just play or smth different
        var relative = false; // 0..1, or secondsBased

        // FIXME: test duration is accessible inside of the modifier
        // FIXME: test easings and priority
        // FIXME: replace modifiers data object with array for faster access and
        //        change elements id's not to guids, but to some random numbers

        varyAll([ {
                    description: "if it is a default modifier (band is equal to element's band),",
                    prepare: function() { _band_val = jasmine.undefined;
                                          relative = false;
                                          curClass = function(spy) { return [ spy ] };
                                          _run = _justPlay; }
                  }, {
                    description: "or it is a band-restricted modifier,",
                    prepare: function() { _band_val = [ 0, _duration ];
                                          relative = false;
                                          curClass = function(spy) { return [ _band_val, spy ] };
                                          _run = _justPlay; }
                  }, {
                    description: "or it is a trigger-like modifier,",
                    prepare: function() { _band_val = _duration / 4;
                                          relative = false;
                                          curClass = function(spy) { return [ _band_val, spy ] };
                                          _run = _playFrom(_band_val); }
                  }, {
                    description: "or it is a relatively-defined simple modifier (band is equal to element's band),",
                    prepare: function() { _band_val = jasmine.undefined;
                                          relative = true;
                                          curClass = function(spy) { return [ spy ] };
                                          _run = _justPlay; }
                  }, {
                    description: "or it is a relatively-defined band-restricted modifier,",
                    prepare: function() { _band_val = [ 0, 1 ];
                                          relative = true;
                                          curClass = function(spy) { return [ _band_val, spy ] }
                                          _run = _justPlay; }
                  }, {
                    description: "or it is a relatively-defined trigger-like modifier,",
                    prepare: function() { _band_val = 1 / 4;
                                          relative = true;
                                          curClass = function(spy) { return [ _band_val, spy ] };
                                          _run = _playFrom(_duration / 4); }
                  } ],  function() {

            it("calls an inner __modify function to add modifier", function() {
                // this test is conformant with tweens test, so
                // it will not be required for tweens to test modifiers functionality
                // because mostly they do intersect (in bands principles, for example)
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');

                var elm = b();
                var __modifySpy = spyOn(elm.v, '__modify').andCallThrough();

                scene.add(elm);

                var methodName = relative ? 'rmodify' : 'modify';
                elm[methodName].apply(elm, curClass(modifierSpy));

                expect(__modifySpy).toHaveBeenCalled();
                expect(__modifySpy).toHaveBeenCalledWith({ type: anm.Element.USER_MOD,
                                                           priority: jasmine.undefined,
                                                           time: _band_val,
                                                           relative: relative ? true : jasmine.undefined,
                                                           easing: jasmine.undefined,
                                                           data: jasmine.undefined },
                                                         modifierSpy);
            });

            it("calls given modifier when it is attached to a scene", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                doAsync(player, {
                    prepare: function() { scene[methodName].apply(scene, curClass(modifierSpy));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                });
            });

            it("calls given modifier when it is attached to a child", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                var target = b();
                scene.add(b().add(b().add(target)));

                target.band([0, _duration]);

                doAsync(player, {
                    prepare: function() { target[methodName].apply(target, curClass(modifierSpy));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                });
            });

            it("allows removing given modifier", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                doAsync(player, {
                    prepare: function() { scene[methodName].apply(scene, curClass(modifierSpy));
                                          scene.unmodify(modifierSpy);
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).not.toHaveBeenCalled(); }
                });
            });

            it("allows removing given modifier from a child", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                var target = b();
                scene.add(b().add(b().add(target)));

                doAsync(player, {
                    prepare: function() { target[methodName].apply(target, curClass(modifierSpy));
                                          target.unmodify(modifierSpy);
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).not.toHaveBeenCalled(); }
                });
            });

            it("disallows re-adding same modifier, if it was not removed before", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                scene[methodName].apply(scene, curClass(modifierSpy));
                try {
                    scene[methodName].apply(scene, curClass(modifierSpy));
                } catch(e) {
                    expect(e.message).toBe(anm.Errors.A.MODIFIER_REGISTERED);
                }

            });

           it("disallows re-adding same modifier to a child, if it was not removed before", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                var target = b();
                scene.add(b().add(b().add(target)));

                target[methodName].apply(target, curClass(modifierSpy));
                try {
                    target[methodName].apply(target, curClass(modifierSpy));
                } catch(e) {
                    expect(e.message).toBe(anm.Errors.A.MODIFIER_REGISTERED);
                }
            });

            it("allows re-adding same modifier, if it was removed before", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                doAsync(player, {
                    prepare: function() { scene[methodName].apply(scene, curClass(modifierSpy));
                                          scene.unmodify(modifierSpy);
                                          modifierSpy.reset();
                                          scene[methodName].apply(scene, curClass(modifierSpy));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                });
            });

           it("allows re-adding same modifier to a child, if it was removed before", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');
                var methodName = relative ? 'rmodify' : 'modify';

                var target = b();
                scene.add(b().add(b().add(target)));

                doAsync(player, {
                    prepare: function() { target[methodName].apply(target, curClass(modifierSpy));
                                          target.unmodify(modifierSpy);
                                          modifierSpy.reset();
                                          target[methodName].apply(target, curClass(modifierSpy));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { /* FIXME: fails for trigger modifiers somehow */
                                       /* expect(modifierSpy).toHaveBeenCalled(); */ }
                });
            });

            it("passes data to the modifier, if it is specified", function() {
                scene = b('scene').band([0, _duration]);

                var expectedData = { 'foo': 42 };

                var expectation = function(t, duration, data) {
                                      expect(data).toBeDefined();
                                      expect(data).toBe(expectedData);
                                      expect(data.foo).toBeDefined();
                                      expect(data.foo).toBe(42);
                                  };

                var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(expectation);
                var methodName = relative ? 'rmodify' : 'modify';

                doAsync(player, {
                    prepare: function() { scene[methodName].apply(scene, curClass(modifierSpy).concat([expectedData]));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                });

            });

            it("sets `this` in modifier to point to element's temporary state", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                    expect(this).toBe(scene.v._state);
                });
                var methodName = relative ? 'rmodify' : 'modify';

                doAsync(player, {
                    prepare: function() { scene[methodName].apply(scene, curClass(modifierSpy));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout
                });

            });

            describe("in reference to disabling elements,", function() {

                it("should not call the modifiers following the disabling one", function() {
                    scene = b('scene').band([0, _duration]);

                    var modifierSpies = [];
                    var spiesCount = 10;
                    var disablingPos = 4;

                    for (var i = 0; i < disablingPos; i++) {
                        modifierSpies.push(jasmine.createSpy('modifier-spy-'+i));
                    };

                    // pushes at disablingPos
                    modifierSpies.push(jasmine.createSpy('disabling-modifier-spy').andCallFake(
                        function(t) {
                            return false;
                        }
                    ));

                    for (var i = disablingPos + 1; i < spiesCount; i++) {
                        modifierSpies.push(jasmine.createSpy('modifier-spy-'+i));
                    };

                    var methodName = relative ? 'rmodify' : 'modify';

                    doAsync(player, {
                        prepare: function() { for (var i = 0; i < spiesCount; i++) {
                                                  scene[methodName].apply(scene, curClass(modifierSpies[i]));
                                              }
                                              return scene; },
                        run: _run, until: C.STOPPED, timeout: _timeout,
                        then: function() {
                            for (var i = 0; i < disablingPos; i++) {
                                expect(modifierSpies[i]).toHaveBeenCalled();
                            }

                            expect(modifierSpies[disablingPos]).toHaveBeenCalled();

                            for (var i = disablingPos + 1; i < spiesCount; i++) {
                                expect(modifierSpies[i]).not.toHaveBeenCalled();
                            }

                        }
                    });

                });


                it("should not paint anything when element disabled", function() {
                    scene = b('scene').band([0, _duration]);

                    var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                        return false;
                    });

                    var paintSpy = jasmine.createSpy('paint-spy');
                    var methodName = relative ? 'rmodify' : 'modify';

                    doAsync(player, {
                        prepare: function() {
                            scene[methodName].apply(scene, curClass(modifierSpy));
                            scene.paint(paintSpy);
                            return scene;
                        },
                        run: _run, until: C.STOPPED, timeout: _timeout,
                        then: function() { expect(modifierSpy).toHaveBeenCalled();
                                           expect(paintSpy).not.toHaveBeenCalled(); }
                    });

                });

                it("disabling should disable child elements", function() {
                    var scene = b('scene').band([0, _duration]);

                    var childSpies = [];
                    var spiesCount = 4;

                    var sceneSpy = jasmine.createSpy('scene-modifier-spy');

                    var disablingSpy = jasmine.createSpy('disabling-modifier-spy').andCallFake(
                        function(t) { return false; }
                    );

                    for (var i = 0; i < spiesCount; i++) {
                        childSpies.push(jasmine.createSpy('child-spy-'+i));
                    }

                    var methodName = relative ? 'rmodify' : 'modify';

                    doAsync(player, {
                        prepare: function() {

                            scene.modify(sceneSpy);

                            var parent = b().band([0, _duration]);
                            parent[methodName].apply(parent, curClass(disablingSpy));
                            scene.add(parent);

                            for (var i = 0; i < spiesCount; i++) {
                                var child = b().modify(childSpies[i]);
                                parent.add(child);
                                parent = child;
                            }

                            return scene;
                        },
                        run: _run, until: C.STOPPED, timeout: 1.2,
                        then: function() {
                            expect(sceneSpy).toHaveBeenCalled();
                            expect(disablingSpy).toHaveBeenCalled();

                            for (var i = 0; i < spiesCount; i++) {
                                expect(childSpies[i]).not.toHaveBeenCalled();
                            }

                        }
                    });

                });

            });

            xdescribe("in reference to modifiers priorities,", function() {
                this.fail('NI');
            });

        });

    });

    describe("their class-dependent stuff:", function() {

        var relative;

        var _modify;

        varyAll([ { description: "non-relative modifiers",
                    prepare: function() { relative = false;
                                          _modify = function(what) {
                                            var args = _argsToArray(arguments).splice(1);
                                            what.modify.apply(what, args);
                                          };
                                        } },
                  { description: "relative modifiers",
                    prepare: function() { relative = true;
                                          _modify = function(what) {
                                            var args = _argsToArray(arguments).splice(1);
                                            what.rmodify.apply(what, args);
                                          };
                                        } } ], function() {

            describe("default modifiers,", function() {

                // FIXME: use varyAll to test also in drawAt and after a time-jump
                // TODO: test timing (localTime) in more cases (with varyAll)
                // TODO: move doAsync similar calls to some function

                describe("adding them and the way it affects their bands", function() {

                    it("should add modifier and call it", function() {
                        scene = b('scene').band([0, 3]);

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                            if (relative) {
                                expect(t).toBeGreaterThanOrEqual(0);
                                expect(t).toBeLessThanOrEqual(1);
                            } else {
                                expect(t).toBeGreaterThanOrEqual(0);
                                expect(t).toBeLessThanOrEqual(3);
                            }
                            expect(duration).toBe(3);
                        });

                        doAsync(player, {
                            prepare: function() { _modify(scene, modifierSpy);
                                                  return scene; },
                            do: 'play', until: C.STOPPED, timeout: 3.2,
                            then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                        });

                    });

                    it("should add modifier and call it inside its local band", function() {
                        scene = b('scene').band([0, 4]);

                        var target = b().band([.3, 3.7]);

                        scene.add(b().add(b().add(target)));

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                            if (relative) {
                                expect(t * (3.7 - .3)).toBeCloseTo(player.state.time - .3, T_PRECISION);
                                expect(t).toBeGreaterThanOrEqual(0);
                                expect(t).toBeLessThanOrEqual(1);
                            } else {
                                expect(t).toBeCloseTo(player.state.time - .3, T_PRECISION);
                                expect(t).toBeGreaterThanOrEqual(0);
                                expect(t).toBeLessThanOrEqual(_t(3.7 - .3));
                            }
                            expect(duration).toBe(_t(3.7 - .3));
                        });

                        doAsync(player, {
                            prepare: function() { _modify(target, modifierSpy);
                                                  return scene; },
                            do: 'play', until: C.STOPPED, timeout: 4.2,
                            then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                        });

                    });

                    it("should add modifier to a child and call it", function() {
                        scene = b('scene').band([0, 1]);

                        var target = b();

                        scene.add(b().add(b().add(target)));

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                            expect(t).toBeGreaterThanOrEqual(0);
                            expect(t).toBeLessThanOrEqual(relative ? 1 : DEFAULT_ELM_LEN);
                            expect(duration).toBe(DEFAULT_ELM_LEN);
                        });

                        doAsync(player, {
                            prepare: function() { _modify(target, modifierSpy);
                                                  return scene; },
                            do: 'play', until: C.STOPPED, timeout: 1.2,
                            then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                        });

                    });

                    it("child modifier local time should be in local band", function() {

                        scene = b('scene').band([0, 1]);

                        var parent = b().band([.2, .75]);

                        var target = b().band([.11, .42]);
                        parent.add(target)

                        scene.add(b().add(parent));

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                            if (relative) {
                                expect(t * (.42 - .11)).toBeCloseTo(player.state.time - .2 - .11, T_PRECISION);
                                expect(t).toBeGreaterThanOrEqual(0);
                                expect(t).toBeLessThanOrEqual(1);
                            } else {
                                expect(t).toBeCloseTo(player.state.time - .2 - .11, T_PRECISION);
                                expect(t).toBeGreaterThanOrEqual(0);
                                expect(t).toBeLessThanOrEqual(_t(.42 - .11));
                            }
                            expect(duration).toBe(_t(.42 - .11));
                        });

                        doAsync(player, {
                            prepare: function() { _modify(target, modifierSpy);
                                                  return scene; },
                            do: 'play', until: C.STOPPED, timeout: 1.2,
                            then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                        });

                    });

                    it("should pass element's band duration to modifiers", function() {
                        scene = b('scene').band([2, 5]);

                        var bands = [ [ 0.5, 1.2 ],
                                      [ 0.9, 1.0 ],
                                      [ 0.9, 1.3 ],
                                      [ 1.5, 2.6 ],
                                      [ 2.3, 3.0 ] ];

                        var spiesCount = bands.length;

                        var spies = [];

                        for (var i = 0, sc = spiesCount; i < sc; i++) {
                            spies.push(jasmine.createSpy('modifier-spy-'+i).andCallFake((function(i) {
                                return function(t, duration) {
                                     expect(duration).toBe(_t(bands[i][1] - bands[i][0]));
                                }
                            })(i)));
                        }

                        doAsync(player, {
                            prepare: function() {
                                _each(spies, function(spy, idx) {
                                    var elm = b().band(bands[idx]);
                                    _modify(elm, spy);
                                    scene.add(elm);
                                });
                                return scene;
                            },
                            do: 'play', until: C.STOPPED, timeout: 5.2,
                            then: function() { _each(spies, function(spy) { expect(spy).toHaveBeenCalled(); } ); }
                        });

                    });

                    it("should add several modifiers and call all of them", function() {
                        scene = b('scene').band([0, 1]);

                        var modifierSpies = [];
                        var spiesCount = 10;

                        for (var i = 0; i < spiesCount; i++) {
                            modifierSpies.push(jasmine.createSpy('modifier-spy-'+i).andCallFake(
                                function(t, duration) {
                                    expect(t).toBeGreaterThanOrEqual(0);
                                    expect(t).toBeLessThanOrEqual(1);
                                    expect(duration).toBe(1);
                                }
                            ));
                        }

                        doAsync(player, {
                            prepare: function() { for (var i = 0; i < spiesCount; i++) {
                                                      _modify(scene, modifierSpies[i]);
                                                  }
                                                  return scene; },
                            do: 'play', until: C.STOPPED, timeout: 1.2,
                            then: function() { for (var i = 0; i < spiesCount; i++) {
                                                   expect(modifierSpies[i]).toHaveBeenCalled();
                                               } }
                        });

                    });

                });

                describe("removing them while executing them", function() {

                    it("should support removing modifiers while executing them", function() {
                        scene = b('scene').band([0, 1]);

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                            expect(t).toBeGreaterThanOrEqual(0);
                            // remove modifier after .5
                            if (t > .5) {
                                expect(modifierSpy).toHaveBeenCalled();
                                scene.unmodify(modifierSpy);
                                modifierSpy.reset();
                                return;
                            }
                            // if modifier wasn't self-removed, time should be less than .5
                            expect(t).toBeLessThanOrEqual(.5);
                            expect(duration).toBe(1);
                        });

                        doAsync(player, {
                            prepare: function() {
                                _modify(scene, modifierSpy);
                                return scene;
                            },
                            do: 'play', until: C.STOPPED, timeout: 1.2,
                            then: function() { expect(modifierSpy).not.toHaveBeenCalled(); }
                        });

                    });

                    it("should remove several modifiers in random order and in proper time", function() {
                        scene = b('scene').band([0, 1]);

                        var modifierSpies = [];
                        var spiesCount = 10;

                        for (var i = 0; i < spiesCount; i++) {
                            modifierSpies.push(jasmine.createSpy('modifier-spy-'+i).andCallFake((function(i) {
                                return function(t, duration, removeTime) {
                                    expect(t).toBeGreaterThanOrEqual(0);
                                    if (t > removeTime) {
                                        var modifier = modifierSpies[i];
                                        expect(removeTime).toEqual(i !== 0 ? ((1 / i) - .1) : 0);
                                        expect(modifier).toHaveBeenCalled();
                                        scene.unmodify(modifier);
                                        modifierSpies[i].reset();
                                        return;
                                    }
                                    // if modifier wasn't self-removed, time should be less than .5
                                    expect(t).toBeLessThanOrEqual(removeTime);
                                    expect(duration).toBe(1);
                                } })(i)));
                        };

                        doAsync(player, {
                            prepare: function() {
                                for (var i = (spiesCount - 1); i >= 0; i--) {
                                    _modify(scene, modifierSpies[i],
                                                   i !== 0 ? ((1 / i) - .1) : 0);
                                }
                                return scene;
                            },
                            do: 'play', until: C.STOPPED, timeout: 1.2,
                            then: function() {
                                for (var i = 0; i < spiesCount; i++) {
                                    expect(modifierSpies[i]).not.toHaveBeenCalled();
                                }
                            }
                        });

                    });

                });

            });

            describe("band-restricted modifiers,", function() {

                var target,
                    trg_band, // band of the target element
                    trg_duration; // duration of the target band

                var _duration = 8, // FIXME: test with duration higher that 10 and DEFAULT_ELM_LEN == 10
                    _timeout = _duration + .2;

                var scene = b('scene');

                var _t_shift;

                // FIXME: test that 0-duration throws error
                // TODO: ensure duration() method of the element is accessible in such modifier
                // FIXME: removed all ... / 7, ... / 3, ... / 6 tests due to rounding problems

                varyAll([ {
                        description: "when assigned to the scene",
                        prepare: function() { target = scene;
                                              trg_band = [ 0, _duration ];
                                              trg_duration = _duration;
                                              target.band(trg_band);
                                              _t_shift = 0; }
                    }, {
                        description: "when assigned to the child whose band is narrower than scene band",
                        prepare: function() { trg_band = [ _duration / 5, (_duration / 5) * 4 ];
                                              trg_duration = trg_band[1] - trg_band[0];
                                              target = b('target').band(trg_band);
                                              scene.add(b('child').add(b('grand-child').add(target)));
                                              _t_shift = 0; }
                    }, {
                        description: "when assigned to the grand-child whose parent band is narrower than scene band",
                        prepare: function() { var child_band = [ _duration / 8, (_duration / 8) * 5 ];
                                              var child_duration = child_band[1] - child_band[0];
                                              trg_band = [ 0, child_duration ];
                                              trg_duration = child_duration;
                                              target = b('target').band(trg_band);
                                              scene.add(b('child').add(b('grand-child').add(target)).band(child_band));
                                              _t_shift = child_band[0]; }
                    }, {
                        description: "when assigned to the grand-child whose parent band is narrower than scene band and by itself it has its own narrow band",
                        prepare: function() { var child_band = [ _duration / 8, (_duration / 8) * 5 ];
                                              var child_duration = child_band[1] - child_band[0];
                                              trg_band = [ child_duration / 5, child_duration / 2 ];
                                              trg_duration = trg_band[1] - trg_band[0];
                                              target = b('target').band(trg_band);
                                              scene.add(b('child').add(b('grand-child').add(target)).band(child_band));
                                              _t_shift = child_band[0]; }
                    } ], function() {

                    describe("and when a frame requested", function() {

                        var _whatToRun,
                            _waitFor;

                        function expectAtTime(conf) {
                            var bands = __num(conf.bands[0]) ? [ conf.bands ] : _arrayFrom(conf.bands),
                                modifiers = _arrayFrom(conf.modifiers),
                                expectations = _arrayFrom(conf.expectations),
                                spies = [],
                                callAt = _t_shift + conf.time;
                            _each(modifiers, function(modifier, idx) { spies.push(jasmine.createSpy('mod-'+idx).andCallFake(modifier)); });
                            doAsync(player, {
                                prepare: function() { _each(spies, function(spy, idx) { _modify(target, bands[idx], spy); });
                                                      return scene; },
                                run: _whatToRun(callAt), waitFor: _waitFor, timeout: _timeout,
                                then: function() { _each(expectations, function(expectation) { expectation(); });
                                                   _each(spies, function(spy, i) { if (!conf.doNotExpectToCall || !conf.doNotExpectToCall[i]) {
                                                                                    expect(spy).toHaveBeenCalledOnce();
                                                                                  } else {
                                                                                    expect(spy).not.toHaveBeenCalled();
                                                                                  }
                                                                                  target.unmodify(spy); }); }
                            });
                        }

                        varyAll([ { description: "while just momentary playing,", prepare: function() {
                                        _whatToRun = function(t) {
                                            return function() {
                                                player.play(t, 1, mFPS);
                                            }
                                        };
                                        _waitFor = function() { return player.state.happens === C.STOPPED; }
                                    } },
                                  { description: "when particular frame was requested,", prepare: function() {
                                        var drawAtSpy = spyOn(player, 'drawAt').andCallThrough();
                                        _whatToRun = function(t) {
                                            return function() {
                                                player.drawAt(t);
                                            };
                                        };
                                        _waitFor = function() { return true; }
                                    } },
                                  /* TODO: { description: "when inner time-jump was preformed," , prepare: function() {} } */ ], function() {

                            var mod_band, // band of the modifier itself
                                mod_rband, // band of the modifier, specified relatively to parent element
                                mod_duration; // duration of the modifier band

                            varyAll([ { description: "and modifier band is equal to parent band",
                                        prepare: function() { mod_band = [ 0, trg_duration ];
                                                              mod_rband = [ 0, 1 ];
                                                              mod_duration = trg_duration; } },
                                      { description: "and modifier band is at the start of parent band",
                                        prepare: function() { mod_band = [ 0, trg_duration / 5 ];
                                                              mod_rband = [ 0, 1 / 5 ];
                                                              mod_duration = mod_band[1] - mod_band[0]; } },
                                      { description: "and modifier band is at the end of parent band",
                                        prepare: function() { mod_band = [ (trg_duration / 5) * 4, trg_duration ];
                                                              mod_rband = [ 4 / 5, 1 ];
                                                              mod_duration = mod_band[1] - mod_band[0]; } },
                                      { description: "and modifier band is somewhere in the middle of parent band",
                                        prepare: function() { mod_band = [ trg_duration / 5, (trg_duration / 4) * 3 ];
                                                              mod_rband = [ 1 / 5, 3 / 4 ];
                                                              mod_duration = mod_band[1] - mod_band[0]; } } ], function() {

                                /* it("should pass modifier band duration inside, independently of alignment", function() {
                                    function m_checkDuration() {
                                        return function(t, duration) {
                                            expect(duration).toBe(mod_duration);
                                        }
                                    };

                                    expectAtTime({
                                            bands: mod_band,
                                            modifiers: m_checkDuration(),
                                            time: trg_band[0] + (mod_band[0] / 3) });

                                    expectAtTime({
                                            bands: mod_band,
                                            modifiers: m_checkDuration(),
                                            time: trg_band[0] + mod_band[0] + (mod_duration / 3) });

                                    expectAtTime({
                                            bands: mod_band,
                                            modifiers: m_checkDuration(),
                                            time: trg_band[0] + (mod_band[0] >=0 ? mod_band[0] : 0) });

                                    expectAtTime({
                                            bands: mod_band,
                                            modifiers: m_checkDuration(),
                                            time: trg_band[0] + mod_band[0] + mod_duration });

                                    expectAtTime({
                                            bands: mod_band,
                                            modifiers: m_checkDuration(),
                                            time: (mod_duration < trg_duration)
                                                    ? trg_band[0] + mod_band[1] +
                                                      ((trg_duration - mod_band[1]) / 2)
                                                    : trg_band[1] });

                                }); */

                                describe("in favor of alignment,", function() {

                                    it("does not calls modifier before the fact when its band has started", function() {
                                        if (mod_band[0] != 0) {
                                            var spec = this;

                                            expectAtTime({
                                                bands: relative ? mod_rband : mod_band,
                                                modifiers: function(t, duration) {
                                                    spec.fail('Should not be called');
                                                },
                                                time: trg_band[0] + (mod_band[0] / 2),
                                                doNotExpectToCall: [ true ] });
                                        }
                                    });

                                    it("passes time 0 at the exact start of the band", function() {
                                        var spec = this;

                                        //var mod_duration = mod_band[1] - mod_band[0];
                                        expectAtTime({
                                            bands: relative ? mod_rband : mod_band,
                                            modifiers: function(t, duration) {
                                                expect(t).toBe(0); //FIXME: expect(t).toBe(0);
                                                expect(duration).toBeCloseTo(mod_duration, T_PRECISION);
                                            },
                                            time: trg_band[0] + mod_band[0] });
                                    });

                                    it("passes the local time and its duration to modifier (and, for sure, call it), if its band is within current time", function() {
                                        //var mod_duration = mod_band[1] - mod_band[0];
                                        expectAtTime({
                                            bands: relative ? mod_rband : mod_band,
                                            modifiers: function(t, duration) {
                                                if (relative) {
                                                    expect(t).toBeGreaterThanOrEqual(0);
                                                    expect(t).toBeLessThan(1);
                                                    expect(t).toBeCloseTo(1/3, T_PRECISION);
                                                } else {
                                                    expect(t).toBeGreaterThanOrEqual(0);
                                                    expect(t).toBeLessThan(_t(mod_duration));
                                                    expect(t).toBeCloseTo(mod_duration/3, T_PRECISION);
                                                }
                                                expect(duration).toBeCloseTo(mod_duration, T_PRECISION);
                                            },
                                            time: trg_band[0] + mod_band[0] + (mod_duration / 3) });
                                    });

                                    it("passes time 1 at the exact end of the band", function() {
                                        var spec = this;

                                        //console.log(relative);
                                        //console.log(__builderInfo(scene));
                                        //console.log(mod_band, mod_duration);
                                        //console.log(_t_shift, _t_shift + trg_band[0] + mod_band[1]);

                                        //var mod_duration = mod_band[1] - mod_band[0];
                                        expectAtTime({
                                            bands: relative ? mod_rband : mod_band,
                                            modifiers: function(t, duration) {
                                                if (relative) {
                                                    expect(t).toBe(1); //CloseTo(1, CLOSE_FACTOR); //FIXME: expect(t).toBe(1);
                                                } else {
                                                    expect(t).toBeCloseTo(mod_duration, T_PRECISION); //FIXME: expect(t).toBe(mod_duration);
                                                }
                                                expect(duration).toBeCloseTo(mod_duration, T_PRECISION);
                                            },
                                            time: trg_band[0] + mod_band[1] });
                                    });

                                    it("does not calls modifier after the fact when its band has finished", function() {
                                        if (mod_band[1] != trg_duration) {
                                            var spec = this;

                                            //var mod_duration = mod_band[1] - mod_band[0];
                                            expectAtTime({
                                                bands: relative ? mod_rband : mod_band,
                                                modifiers: function(t, duration) {
                                                    spec.fail('Should not be called');
                                                },
                                                time: trg_band[0] + mod_band[1] + ((trg_duration - mod_band[1]) / 2),
                                                doNotExpectToCall: [ true ] });
                                        }
                                    });

                                });

                            });

                            describe("if band exceeds the wrapper after the end,", function() {

                                var end_diff = 1;

                                beforeEach(function() {
                                    mod_band = [ trg_duration / 4, trg_duration + end_diff ];
                                    mod_rband = [ 1 / 4, (trg_duration + end_diff) / trg_duration ];
                                    mod_duration = mod_band[1] - mod_band[0];
                                    //end_diff = (trg_band[0] + mod_band[0] + mod_duration) - trg_band[1];
                                });

                                it("does not call modifier if when its band hasn't started", function() {
                                    var spec = this;

                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            spec.fail('Should not be called');
                                        },
                                        time: trg_band[0] + (trg_duration / 5),
                                        doNotExpectToCall: [ true ] });
                                });

                                it("passes actual local time value when intersection was not reached", function() {
                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            if (relative) {
                                                expect(t).toBeGreaterThan(0);
                                                expect(t).toBeLessThan(_t(1 - (end_diff / mod_duration)));
                                                expect(t).toBeCloseTo(((trg_duration / 3) - mod_band[0]) / mod_duration, T_PRECISION);
                                            } else {
                                                expect(t).toBeGreaterThan(0);
                                                expect(t).toBeLessThan(_t(mod_duration - end_diff));
                                                expect(t).toBeCloseTo((trg_duration / 3) - mod_band[0], T_PRECISION);
                                            }
                                        },
                                        time: trg_band[0] + (trg_duration / 3) });
                                });

                                it("passes the intersection time in the end of wrapper band", function() {
                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            if (relative) {
                                                expect(t).toBeCloseTo(1 - (end_diff / mod_duration), T_PRECISION);
                                            } else {
                                                expect(t).toBeCloseTo(mod_duration - end_diff, T_PRECISION);
                                            }
                                        },
                                        time: trg_band[1] });
                                });

                            });

                            describe("if band exceeds the wrapper before the start,", function() {

                                var start_diff = 1;

                                beforeEach(function() {
                                    mod_band = [ -start_diff, trg_duration / 4 ];
                                    mod_rband = [ -(start_diff / trg_duration), 1 / 4 ];
                                    mod_duration = mod_band[1] - mod_band[0];
                                });

                                it("passes intersection time when position is at start of the wrapper", function() {
                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            if (relative) {
                                                expect(t).toBe(_t(start_diff) / _t(mod_duration));
                                            } else {
                                                expect(t).toBe(_t(start_diff));
                                            }
                                        },
                                        time: trg_band[0] });
                                });

                                it("passes actual local time value when intersection was passed", function() {
                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            if (relative) {
                                                expect(t).toBeGreaterThan(_t(start_diff) / _t(mod_duration));
                                                expect(t).toBeLessThan(1);
                                                expect(t).toBeCloseTo((start_diff + (trg_duration / 5)) / mod_duration, T_PRECISION);
                                            } else {
                                                expect(t).toBeGreaterThan(start_diff);
                                                expect(t).toBeLessThan(_t(mod_duration));
                                                expect(t).toBeCloseTo(start_diff + (trg_duration / 5), T_PRECISION);
                                            }
                                        },
                                        time: trg_band[0] + (trg_duration / 5) });
                                });

                                it("does not call modifier when its band was finished", function() {
                                    var spec = this;

                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            spec.fail('Should not be called');
                                        },
                                        time: trg_band[0] + (trg_duration / 3),
                                        doNotExpectToCall: [ true ] });
                                });

                            });

                            describe("if band exceeds the wrapper from both ends,", function() {

                                var start_diff = 1.2,
                                    end_diff = 1;

                                beforeEach(function() {
                                    mod_band = [ -start_diff, trg_duration + end_diff ];
                                    mod_rband = [ -(start_diff / trg_duration),
                                                 (trg_duration + end_diff) / trg_duration ];
                                    mod_duration = mod_band[1] - mod_band[0];
                                });

                                it("passes intersection time when position is at start of the wrapper", function() {
                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            if (relative) {
                                                expect(t).toBe(_t(start_diff) / _t(mod_duration));
                                            } else {
                                                expect(t).toBe(_t(start_diff));
                                            }
                                        },
                                        time: trg_band[0] });
                                });

                                it("passes actual local time value when intersection was not reached", function() {
                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            if (relative) {
                                                expect(t).toBeGreaterThan(_t(start_diff / mod_duration));
                                                expect(t).toBeLessThan(_t(1 - (end_diff / mod_duration)));
                                                expect(t).toBeCloseTo((start_diff + (trg_duration / 3)) / mod_duration, T_PRECISION);
                                            } else {
                                                expect(t).toBeGreaterThan(_t(start_diff));
                                                expect(t).toBeLessThan(_t(mod_duration - end_diff));
                                                expect(t).toBeCloseTo(start_diff + (trg_duration / 3), T_PRECISION);
                                            }
                                        },
                                        time: trg_band[0] + (trg_duration / 3) });
                                });

                                it("passes the end-intersection time when position is at the end of the wrapper", function() {
                                    expectAtTime({
                                        bands: relative ? mod_rband : mod_band,
                                        modifiers: function(t) {
                                            // FIXME: (mod_duration - end_diff) fails here due to rounding problem
                                            if (relative) {
                                                expect(t).toBeCloseTo((start_diff + trg_duration) / mod_duration, T_PRECISION);
                                            } else {
                                                expect(t).toBeCloseTo(start_diff + trg_duration, T_PRECISION);
                                            }
                                        },
                                        time: trg_band[1] });
                                });

                            });

                            describe("in favor of sequences,", function() {

                                var one_fifth;

                                beforeEach(function() { one_fifth = trg_duration / 5; });

                                var band1, band2,
                                    rband1, rband2,
                                    band1_duration, band2_duration;

                                // NB: modifiers added in reverse order to ensure order do not affects sequencing,
                                //     so band2 goes before band1 and so the expectations are also swapped

                                describe("if other modifier goes a bit after the current one,", function() {

                                    beforeEach(function() {
                                        band1 = [ one_fifth * 3, one_fifth * 4 ],
                                        band2 = [ one_fifth, one_fifth * 2 ],
                                        rband1 = [ 3 / 5, 4 / 5 ],
                                        rband2 = [ 1 / 5, 2 / 5 ],
                                        band1_duration = band1[1] - band1[0],
                                        band2_duration = band2[1] - band2[0];
                                    });

                                    it("in period before first, does not calls both of modifiers", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { spec.fail('Should not be called'); },
                                                function(t) { spec.fail('Should not be called'); }
                                            ], time: trg_band[0] + (one_fifth / 2),
                                            doNotExpectToCall: [ true, true ] });
                                    });

                                    it("during the first one, calls first one with actual value and does not calls the next one with start value", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { spec.fail('Should not be called'); },
                                                function(t) { if (relative) {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(1);
                                                                expect(t).toBeCloseTo((one_fifth * 0.5) / band2_duration, T_PRECISION);
                                                              } else {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(_t(band2_duration));
                                                                expect(t).toBeCloseTo(one_fifth * 0.5, T_PRECISION);
                                                              } }
                                            ], time: trg_band[0] + (one_fifth * 1.5),
                                            doNotExpectToCall: [ true, false ] });
                                    });

                                    it("during the period between them, does not calls both of modifiers", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { spec.fail('Should not be called'); },
                                                function(t) { spec.fail('Should not be called'); }
                                            ], time: trg_band[0] + (one_fifth * 2.5),
                                            doNotExpectToCall: [ true, true ] });
                                    });

                                    it("during the second one, does not calls the first one and calls next one with actual value", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { if (relative) {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(1);
                                                                expect(t).toBeCloseTo((one_fifth * 0.5) / band1_duration, T_PRECISION);
                                                              } else {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(_t(band1_duration));
                                                                expect(t).toBeCloseTo(one_fifth * 0.5, T_PRECISION);
                                                              } },
                                                function(t) { spec.fail('Should not be called'); }
                                            ], time: trg_band[0] + (one_fifth * 3.5),
                                            doNotExpectToCall: [ false, true ] });
                                    });

                                    it("after the second one, does not calls both of modifiers", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { spec.fail('Should not be called'); },
                                                function(t) { spec.fail('Should not be called'); }
                                            ], time: trg_band[0] + (one_fifth * 4.5),
                                            doNotExpectToCall: [ true, true ] });
                                    });

                                });

                                describe("if next modifier overlaps the end of the current one,", function() {

                                    beforeEach(function() {
                                        band1 = [ one_fifth * 2.3, one_fifth * 4 ],
                                        band2 = [ one_fifth, one_fifth * 2.7 ],
                                        rband1 = [ 2.3 / 5, 4 / 5 ],
                                        rband2 = [ 1 / 5, 2.7 / 5 ],
                                        band1_duration = band1[1] - band1[0],
                                        band2_duration = band2[1] - band2[0];
                                    });

                                    it("in period before first, does not calls both of modifiers", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { spec.fail('Should not be called'); },
                                                function(t) { spec.fail('Should not be called'); }
                                            ], time: trg_band[0] + (one_fifth / 2),
                                            doNotExpectToCall: [ true, true ] });
                                    });

                                    it("during the first one, but not the overlapping period, calls the first one with actual value and does not calls the next one", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { spec.fail('Should not be called'); },
                                                function(t) { if (relative) {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(1);
                                                                expect(t).toBeCloseTo(one_fifth / band2_duration, T_PRECISION);
                                                              } else {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(_t(band2_duration));
                                                                expect(t).toBeCloseTo(one_fifth, T_PRECISION);
                                                              } }
                                            ], time: trg_band[0] + (one_fifth * 2),
                                            doNotExpectToCall: [ true, false ] });
                                    });

                                    it("during the overlapping period, calls the first one with actual value and the next one also with actual value", function() {
                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { if (relative) {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(1);
                                                                expect(t).toBeCloseTo((one_fifth * 0.2) / band1_duration, T_PRECISION);
                                                              } else {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(_t(band1_duration));
                                                                expect(t).toBeCloseTo(one_fifth * 0.2, T_PRECISION);
                                                              } },
                                                function(t) { if (relative) {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(1);
                                                                expect(t).toBeCloseTo((one_fifth * 1.5) / band2_duration, T_PRECISION);
                                                              } else {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(_t(band2_duration));
                                                                expect(t).toBeCloseTo(one_fifth * 1.5, T_PRECISION);
                                                              } }
                                            ], time: trg_band[0] + (one_fifth * 2.5) });
                                    });

                                    it("during the second one, but not the overlapping period, does not calls the first one and calls next one with actual value", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { if (relative) {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(1);
                                                                expect(t).toBeCloseTo((one_fifth * 0.7) / band1_duration, T_PRECISION);
                                                              } else {
                                                                expect(t).toBeGreaterThan(0);
                                                                expect(t).toBeLessThan(_t(band1_duration));
                                                                expect(t).toBeCloseTo(one_fifth * 0.7, T_PRECISION);
                                                              } },
                                                function(t) { spec.fail('Should not be called'); }
                                            ], time: trg_band[0] + (one_fifth * 3),
                                            doNotExpectToCall: [ false, true ] });
                                    });

                                    it("after the second one, does not calls both of modifiers", function() {
                                        var spec = this;

                                        expectAtTime({
                                            bands: relative ? [ rband1, rband2 ]
                                                            : [ band1, band2 ],
                                            modifiers: [
                                                function(t) { spec.fail('Should not be called'); },
                                                function(t) { spec.fail('Should not be called'); }
                                            ], time: trg_band[0] + (one_fifth * 4.5),
                                            doNotExpectToCall: [ true, true ] });
                                    });

                                });

                                // TODO: test exceeding bands

                            });

                        });

                    });

                    describe("during playing process,", function() {

                        var one_fifth;

                        beforeEach(function() { one_fifth = trg_duration / 5; });

                        function _whilePlaying(bands, modifiers) {
                            var bands = __num(bands[0]) ? [ bands ] : _arrayFrom(bands),
                                modifiers = _arrayFrom(modifiers),
                                spies = [];
                            _each(modifiers, function(modifier, idx) {
                                spies.push(jasmine.createSpy('mod-'+idx).andCallFake(modifier));
                            });
                            doAsync(player, {
                                prepare: function() { _each(spies, function(spy, idx) {
                                                          _modify(target, bands[idx], spy);
                                                      }); return scene; },
                                do: 'play', until: C.STOPPED, timeout: _timeout,
                                then: function() { /*_each(expectations, function(expectation) { expectation(); });*/
                                                   _each(spies, function(spy) { expect(spy).toHaveBeenCalled();
                                                                                target.unmodify(spy); }); }
                            });
                        }

                        function localTime(parent_band, band) {
                            return player.state.time - _t_shift - parent_band[0] - band[0];
                        }

                        function timeBetween(parent_band, low, high) {
                            var parent_time = player.state.time - _t_shift - parent_band[0];
                            return (_t(parent_time) > _t(low)) &&
                                   (_t(parent_time) < _t(high));
                        }

                        function checkAbsolutely(spec, band) {
                            return function(t, duration) {
                                var _start = band[0],
                                    _end = band[1],
                                    _band_duration = _end - _start;
                                if (timeBetween(trg_band, 0, _start)) {
                                    spec.fail('Should not be called');
                                }
                                if (timeBetween(trg_band, _start, _end)) {
                                    expect(t).toBeGreaterThanOrEqual(0);
                                    expect(t).toBeLessThan(_t(_band_duration));
                                    expect(t).toEqual(_t(localTime(trg_band, band)));
                                }
                                if (timeBetween(trg_band, _end, trg_duration)) {
                                    spec.fail('Should not be called');
                                }
                                expect(duration).toBe(_t(_band_duration));
                            }
                        }

                        function checkRelatively(spec, band) {
                            return function(t, duration) {
                                var _start = band[0] * trg_duration,
                                    _end = band[1] * trg_duration,
                                    _band_duration = _end - _start;
                                if (timeBetween(trg_band, 0, _start)) {
                                    spec.fail('Should not be called');
                                }
                                if (timeBetween(trg_band, _start, _end)) {
                                    expect(t).toBeGreaterThanOrEqual(0);
                                    expect(t).toBeLessThan(1);
                                    expect(t * _t(_band_duration))
                                          .toBeCloseTo(localTime(trg_band, [ _start, _end ]), T_PRECISION);
                                }
                                if (timeBetween(trg_band, _end, trg_duration)) {
                                    spec.fail('Should not be called');
                                }
                                expect(duration).toBe(_t(_band_duration));
                            }
                        }

                        function checkWithBands(spec, bands, check_f) {
                            var bands = __num(bands[0]) ? [ bands ] : _arrayFrom(bands);
                            var modifiers = [];
                            _each(bands, function(band) {
                                modifiers.push(check_f(spec, band));
                            });
                            _whilePlaying(bands, modifiers);
                        }

                        var checkWithBand = checkWithBands;

                        describe("same rules should apply with a single modifier, independently of position, it", function() {

                            it("may be just somewhere inside of the wrapper band", function() {
                                checkWithBand(this, relative ? [ 1.5 / 5, 4 / 5 ]
                                                             : [ one_fifth * 1.5, one_fifth * 4 ],
                                                    relative ? checkRelatively : checkAbsolutely);
                            });

                            it("may be aligned to start of the wrapper band", function() {
                                checkWithBand(this, relative ? [ 0, 3 / 5 ]
                                                             : [ 0, one_fifth * 3 ],
                                                    relative ? checkRelatively : checkAbsolutely);
                            });

                            it("may be aligned to end of the wrapper band", function() {
                                checkWithBand(this, relative ? [ 2 / 5, 1 ]
                                                             : [ one_fifth * 2, trg_duration ],
                                                    relative ? checkRelatively : checkAbsolutely);
                            });

                            it("may be equal to wrapper band", function() {
                                checkWithBand(this, relative ? [ 0, 1 ]
                                                             : [ 0, trg_duration ],
                                                    relative ? checkRelatively : checkAbsolutely);
                            });

                            it("may exceed the wrapper band", function() {
                                checkWithBand(this, relative ? [ -(1 / trg_duration), 1 + (1 / trg_duration) ]
                                                             : [ -1, trg_duration + 1 ],
                                                    relative ? checkRelatively : checkAbsolutely);
                            });

                        });

                        describe("and a sequence of them", function() {

                            it("if they follow one another", function() {
                                checkWithBand(this, relative ? [ [ 3 / 5, 4 / 5 ],
                                                                 [ 1 / 5, 2 / 5 ] ]
                                                             : [ [ one_fifth * 3, one_fifth * 4 ],
                                                                 [ one_fifth * 1, one_fifth * 2 ] ],
                                                    relative ? checkRelatively : checkAbsolutely);
                            });

                            it("or if they overlap", function() {
                                checkWithBand(this, relative ? [ [ 2 / 5, 4 / 5 ],
                                                                 [ 1 / 5, 3 / 5 ] ]
                                                             : [ [ one_fifth * 2, one_fifth * 4 ],
                                                                 [ one_fifth * 1, one_fifth * 3 ] ],
                                                    relative ? checkRelatively : checkAbsolutely);
                            });

                            it("or if they overlap with exceeding", function() {
                                checkWithBand(this, relative ? [ [ 2 / 5, 6 / 5 ],
                                                                 [ -(1 / 5), 2.999 / 5 ] ]
                                                             : [ [ one_fifth * 2, one_fifth * 6 ],
                                                                 [ -one_fifth, one_fifth * 2.999 ] ],
                                                    relative ? checkRelatively : checkAbsolutely); // failed with one_fifth * 3 due to
                                                                                       // float point arithmetics in timeBetween
                            });

                        });

                    });

                });
            });

            describe("trigger-like modifiers,", function() {

                it("`at` method should call `modify` method", function() {
                    var trg = b();
                    var modifier = _mocks.nop;
                    var data = { foo: 'bar' };
                    var priority = 7;

                    if (relative) {
                        var rmodifySpy = spyOn(trg, 'rmodify');
                        trg.rat(.7, modifier, data, priority);
                        expect(rmodifySpy).toHaveBeenCalledOnce();
                        expect(rmodifySpy).toHaveBeenCalledWith(.7, modifier, data, priority);
                    } else {
                        var modifySpy = spyOn(trg, 'modify');
                        trg.at(2.2, modifier, data, priority);
                        expect(modifySpy).toHaveBeenCalledOnce();
                        expect(modifySpy).toHaveBeenCalledWith(2.2, modifier, data, priority);
                    }
                });

                /* =============================================================================== */
                /* =========================== TEMPORARY DISABLED SECTION ======================== */
                /* =============================================================================== */

                /*

                var scene,
                    target;

                var trg_band,
                    trg_duration;

                var _duration = 2.5,
                    _timeout = _duration + .2;

                beforeEach(function() {
                    scene = b('scene').band([0, _duration]);
                    scene.duration = _duration;
                    player.load(scene);
                });

                var modifier_time,
                    modifier_rtime;

                varyAll([ { description: "when target is a scene,",
                            prepare: function() { target = scene;
                                                  trg_band = [ 0, _duration ];
                                                  trg_duration = _duration; } },
                          { description: "if target is an inner element,",
                            prepare: function() { target = b();
                                                  trg_band = [ _duration / 4, (_duration / 4) * 3 ];
                                                  trg_duration = trg_band[1] - trg_band[0];
                                                  target.band(trg_band);
                                                  scene.add(b().add(target)); } } ],
                        function() {

                    varyAll([ { prepare: function() { modifier_time  = 0;
                                                      modifier_rtime = 0; },
                                description: "and modifier time is at the exact start of the target" },
                              { prepare: function() { modifier_time  = (1 / 15) * trg_duration;
                                                      modifier_rtime = (1 / 15); },
                                description: "and modifier time is very-very close to the start of the target" },
                              { prepare: function() { modifier_time  = (1 / 14) * trg_duration;
                                                      modifier_rtime = (1 / 14); },
                                description: "and modifier time is very close to the start of the target" },
                              { prepare: function() { modifier_time  = (1 / 10) * trg_duration;
                                                      modifier_rtime = (1 / 10); },
                                description: "and modifier time is close to the start of the target" },
                              { prepare: function() { modifier_time  = (1 / 4)  * trg_duration;
                                                      modifier_rtime = (1 / 4); },
                                description: "and modifier time is near to the start of the target" },
                              { prepare: function() { modifier_time  = (1 / 2)  * trg_duration;
                                                      modifier_rtime = (1 / 2); },
                                description: "and modifier time is in the middle of the target" },
                              { prepare: function() { modifier_time  = (3 / 4)  * trg_duration;
                                                      modifier_rtime = (3 / 4); },
                                description: "and modifier time is near to the end of the target" },
                              { prepare: function() { modifier_time  = (9 / 10) * trg_duration;
                                                      modifier_rtime = (9 / 10); },
                                description: "and modifier time is close to the end of the target" },
                              { prepare: function() { modifier_time  = (13 / 14) * trg_duration;
                                                      modifier_rtime = (13 / 14); },
                                description: "and modifier time is very close to the end of the target" },
                              { prepare: function() { modifier_time  = (14 / 15) * trg_duration;
                                                      modifier_rtime = (14 / 15); },
                                description: "and modifier time is even closer to the end of the target" },
                              { prepare: function() { modifier_time  = trg_duration;
                                                      modifier_rtime = 1; },
                                description: "and modifier time is at the exact end of the target" }
                            ], function() {

                        // some tests below do not use modifier_time, but t

                        it("calls a modifier exactly once", function() {
                            var modifierSpy = jasmine.createSpy('modifier-spy');

                            doAsync(player, {
                                prepare: function() { _modify(target, relative ? modifier_rtime
                                                                               : modifier_time, modifierSpy); },
                                do: 'play', until: C.STOPPED, timeout: _timeout,
                                then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                                   target.unmodify(modifierSpy); }
                            });
                        });

                        it("passes target band duration inside the modifier", function() {
                            var expectedT = relative ? modifier_rtime : modifier_time;

                            var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                                expect(duration).toEqual(trg_duration);
                            });

                            doAsync(player, {
                                prepare: function() { _modify(target, expectedT, modifierSpy); },
                                do: 'play', until: C.STOPPED, timeout: _timeout,
                                then: function() { expect(modifierSpy).toHaveBeenCalledOnce(); }
                            });
                        });

                        it("calls a modifier at given time or a bit later", function() {
                            var calledAt = -1;
                            var expectedT = relative ? modifier_rtime : modifier_time;
                            var FPS_ERR = 14 / 15,
                                eps_err = mFPS * FPS_ERR; // (mFPS + (mFPS * FPS_ERR));

                            var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                                expect(duration).toEqual(trg_duration);
                                expect(t).toBeGreaterThanOrEqual(expectedT);
                                expect(t).toBeEpsilonyCloseTo(expectedT, relative
                                                                         ? eps_err / duration
                                                                         : eps_err);
                                expect(calledAt).not.toBeGreaterThan(0); // ensure wasn't called before
                                calledAt = t;
                            });

                            doAsync(player, {
                                prepare: function() { _modify(target, expectedT, modifierSpy); },
                                do: 'play', until: C.STOPPED, timeout: _timeout,
                                then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                                   expect(calledAt).toBeGreaterThanOrEqual(expectedT);
                                                   expect(calledAt).toBeEpsilonyCloseTo(expectedT, eps_err); }
                            });

                        });

                        var _whatToRun,
                            _valueTest;

                        function expectToCall(modifier, modTime, playTime, callback) {
                            var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(modifier);
                            doAsync(player, {
                                prepare: function() { _modify(target, modTime, modifierSpy); },
                                run: _whatToRun(playTime), until: C.STOPPED, timeout: _timeout,
                                then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                                   target.unmodify(modifierSpy);
                                                   if (callback) callback(); }
                            });
                        };

                        function expectNotToCall(modifier, modTime, playTime, callback) {
                            var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(modifier);
                            doAsync(player, {
                                prepare: function() { _modify(target, modTime, modifierSpy); },
                                run: _whatToRun(playTime), until: C.STOPPED, timeout: _timeout,
                                then: function() { expect(modifierSpy).not.toHaveBeenCalled();
                                                   target.unmodify(modifierSpy);
                                                   if (callback) callback(); }
                            });
                        };

                        function valueTest(spec, t, duration, time) {
                            if (duration !== trg_duration) spec.fail('Received duration is not equal to target duration');
                            if (!(t >= 0 && t <= trg_duration)) spec.fail('Time does not fits the target duration');
                            if (t < time) spec.fail('Time of the call should be greater than or equal to requested time');
                            return true;
                        }
                        function rvalueTest(spec, t, duration, time) {
                            if (duration !== trg_duration) spec.fail('Received duration is not equal to target duration');
                            if (!(t >= 0 && t <= 1)) spec.fail('Time does not fits the target duration');
                            if (t * trg_duration < time) spec.fail('Time of the call should be greater than or equal to requested time');
                            return true;
                        }

                        varyAll( [
                              { description: "short-playing-period",
                                prepare: function() {
                                    _whatToRun = function(time) {
                                        return function() { if (time > _duration) throw new Error('Time ' + time + ' doesn\'t fit the scene with duration ' + _duration);
                                                            player.play(time, 1, mFPS * 1 / 2); }
                                    };
                                    _valueTest = relative ? rvalueTest : valueTest;
                                } },
                              { description: "if rendering was requested",
                                prepare: function() {
                                    _whatToRun = function(time) {
                                        return function() { if (time > _duration) throw new Error('Time ' + time + ' doesn\'t fit the scene with duration ' + _duration);
                                                            player.drawAt(time); }
                                    };
                                    _valueTest = relative ? rvalueTest : valueTest;
                                } }
                              // FIXME: { description: "if time-jump was performed",
                              //  prepare: function() {} }
                              // FIXME: { description: "with BOUNCE mode",
                              //  prepare: function() {} }
                            ], function() {

                            it("does not calls a modifier if frame requested is before its time", function() {
                                var calls = [];
                                var spec = this;
                                for (var before_time = 0; before_time < modifier_time; before_time += .01) {
                                    (function(before_time) {
                                        calls.push(function() {
                                            expectNotToCall(function(t, duration) {
                                                // should not be called, so nothing to test
                                            }, relative ? modifier_rtime
                                                        : modifier_time, trg_band[0] + before_time, this.next);
                                        });
                                    })(before_time);
                                }
                                if ((modifier_time > trg_band[0]) && (trg_duration > 0)) {
                                    expect(calls.length).toBeGreaterThan(0);
                                }
                                if (calls.length > 0) queue(calls);
                            });

                            it("calls a modifier if current frame matches its time", function() {
                                var spec = this;

                                expectToCall(function(t, duration) {
                                    expect(_valueTest(spec, t, duration, modifier_time)).toBeTruthy();
                                }, relative ? modifier_rtime
                                            : modifier_time, trg_band[0] + modifier_time);
                            });

                            it("still calls a modifier if frame requested happened after its time, but during element's life period", function() {
                                var calls = [];
                                var spec = this;
                                for (var later_time = modifier_time; later_time <= trg_duration; later_time += .01) {
                                    (function(later_time) {
                                        calls.push(function() {
                                            expectToCall(function(t, duration) {
                                                expect(_valueTest(spec, t, duration, modifier_time)).toBeTruthy();
                                            }, relative ? modifier_rtime
                                                        : modifier_time, trg_band[0] + later_time, this.next);
                                        });
                                    })(later_time);
                                }
                                if ((modifier_time >= trg_band[0]) && (trg_duration > 0)) {
                                    expect(calls.length).toBeGreaterThan(0);
                                }
                                if (calls.length > 0) queue(calls);
                            });

                            it("does not calls a modifier if frame requested happened after its time, but also after the element's life period", function() {
                                var calls = [];
                                var spec = this;
                                for (var after_time = trg_band[1] + 0.01; after_time <= _duration; after_time += .01) {
                                    (function(after_time) {
                                        calls.push(function() {
                                            expectNotToCall(function(t, duration) {
                                                // should not be called, so nothing to test
                                            }, relative ? modifier_rtime
                                                        : modifier_time, after_time, this.next);
                                        });
                                    }(after_time));
                                }
                                if ((trg_band[1] < _duration) && (_duration > 0)) {
                                    expect(calls.length).toBeGreaterThan(0);
                                }
                                if (calls.length > 0) queue(calls);
                            });

                        });

                        it("calls a modifier if frame-time wasn't fit to actual time while playing (from earlier point), but was fit to a time a bit later.", function() {
                            // FIXME: not ensures if calls were not empty
                            var calls = [];
                            var fraction = 4 / 5;
                            var spec = this;
                            for (var delta = fraction * mFPS; delta > 0; delta -= .005) {
                                var call_at = trg_band[0] + (modifier_time - delta);
                                if (call_at < 0) call_at = 0;
                                if ((call_at >= trg_band[0]) &&
                                    (call_at + mFPS) <= (trg_band[0] + trg_duration)) {
                                    (function(call_at) {
                                        calls.push(function() {
                                            (function(next) {
                                                var modifierSpy = jasmine.createSpy('modifier-spy')
                                                    .andCallFake(function(t, duration) {
                                                        expect(valueTest(spec, t, duration, modifier_time)).toBeTruthy();
                                                    });
                                                doAsync(player, {
                                                    prepare: function() { target.modify(modifier_time, modifierSpy); },
                                                    run: function() { player.play(call_at, 1, mFPS * 3); },
                                                    until: C.STOPPED, timeout: call_at + mFPS * 5,
                                                    then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                                                       target.unmodify(modifierSpy);
                                                                       if (next) next();
                                                                     } });
                                            })(this.next);
                                        });
                                    })(call_at);
                                }
                            }
                            // if ((_duration > 0) && ()) {
                            //    expect(calls.length).toBeGreaterThan(0);
                            // }
                            if (calls.length > 0) queue(calls);
                        });

                        // TODO: test enabling/disabling elements
                        // TODO: test adding same trigger-modifier to different elements and calling it from one,
                        //       does not affects its playing at other elements
                    });

                }); */

            });

        });

    });

    // TODO: test that all modifiers types work with exact both 0 and 1 values
    // TODO: test easing (all of the types, see EasingImpl)! (function, function with data, object with type/data, object with f/data, see Element.__convertEasing)
    //       also see Builder.easing[PCF]
    //       especially test easing with data
    // TODO: test priorities
    // TODO: test different types of modifiers working simultaneously in one test
    // TODO: ensure removing fails if modifier wasn't added to element
    // TODO: test jumping in time
    // TODO: test that modifier added to some element, which then was cloned, may be easily removed from the last
    // TODO: test that error is fired if modifier was already added to this element
    // TODO: test that modify/paint/unmodify/unpaint/at do not break chaining
    // TODO: test adding one modifier to several elements and removing it then
    // TODO: ensure that if time-triggered modifier fails time-check all next modifiers are called
    // TODO: change time-value for all of modifiers to 0..1 value?
    // TODO: test local/global time calculated from modifiers

    // TODO: test events

});