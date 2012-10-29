/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("builder, regarding modifiers,", function() {

    var player,
        C = anm.C;

    var b = Builder._$,
        B = Builder;

    var FPS = 10;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fake(_Fake.CVS_POS);

        _FrameGen.enable(FPS);

        // preview mode is enabled not to mess with still-preview used for video-mode
        // (it calls drawAt and causes modifiers to be called once more before starting playing)
        player = createPlayer('test-id', { mode: C.M_PREVIEW });
    });

    afterEach(function() { _FrameGen.disable(); });

    describe("independently of modifier class,", function() {

        var curClass; // function that creates first arguments for a 'modify' call, it is done
                      // to vary all of modifier types

        var _duration = 1,
            _timeout = _duration + .2,
            _run = function() { player.play(); };

        // FIXME: test duration is accessible inside of the modifier
        // FIXME: test easings

        varyAll([ {
                    description: "either it is a default modifier (band is equal to element's band),",
                    prepare: function() { curClass = function(spy) { return [ spy ] } }
                  }, {
                    description: "either it is a band-restricted modifier,",
                    prepare: function() { curClass = function(spy) { return [ [ 0, _duration ], spy ] } }
                  }, {
                    description: "or it is a trigger-like modifier,",
                    prepare: function() { curClass = function(spy) { return [ _duration / 4, spy ] };
                                          _run = function() { player.play(_duration / 4, 1, 1 / (FPS * 2)); }; }
                  } ],  function() {

            it("should call given modifier", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');

                doAsync(player, {
                    prepare: function() { scene.modify.apply(scene, curClass(modifierSpy));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy.callCount).toBeGreaterThan(0); }
                });
            });

            it("should call modifier given to a child", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');

                var target = b();
                scene.add(b().add(b().add(target)));

                doAsync(player, {
                    prepare: function() { target.modify.apply(target, curClass(modifierSpy));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy.callCount).toBeGreaterThan(0); }
                });
            });

            it("should allow removing given modifier", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');

                doAsync(player, {
                    prepare: function() { scene.modify.apply(scene, curClass(modifierSpy));
                                          scene.unmodify(modifierSpy);
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).not.toHaveBeenCalled(); }
                });
            });

            it("should allow removing given modifier from a child", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy');

                var target = b();
                scene.add(b().add(b().add(target)));

                doAsync(player, {
                    prepare: function() { target.modify.apply(target, curClass(modifierSpy));
                                          target.unmodify(modifierSpy);
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy).not.toHaveBeenCalled(); }
                });
            });

            it("should pass data to the modifier", function() {
                scene = b('scene').band([0, _duration]);

                var expectedData = { 'foo': 42 };

                var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, data) {
                    expect(data).toBeDefined();
                    expect(data).toBe(expectedData);
                    expect(data.foo).toBeDefined();
                    expect(data.foo).toBe(42);
                });

                doAsync(player, {
                    prepare: function() { scene.modify.apply(scene, curClass(modifierSpy).concat([expectedData]));
                                          return scene; },
                    run: _run, until: C.STOPPED, timeout: _timeout,
                    then: function() { expect(modifierSpy.callCount).toBeGreaterThan(0); }
                });

            });

            it("should set `this` in modifier to element's temporary state", function() {
                scene = b('scene').band([0, _duration]);

                var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                    expect(this).toBe(scene.v._state);
                });

                doAsync(player, {
                    prepare: function() { scene.modify.apply(scene, curClass(modifierSpy));
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

                    doAsync(player, {
                        prepare: function() { for (var i = 0; i < spiesCount; i++) {
                                                  scene.modify.apply(scene, curClass(modifierSpies[i]));
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

                    doAsync(player, {
                        prepare: function() {
                            scene.modify.apply(scene, curClass(modifierSpy));
                            scene.paint(paintSpy);
                            return scene;
                        },
                        run: _run, until: C.STOPPED, timeout: _timeout,
                        then: function() { expect(modifierSpy).toHaveBeenCalled();
                                           expect(paintSpy).not.toHaveBeenCalled(); }
                    });

                });

                it("disabling should disable child elements", function() {
                    var scene = b('scene').band([0, 1]);

                    var childSpies = [];
                    var spiesCount = 4;

                    var sceneSpy = jasmine.createSpy('scene-modifier-spy');

                    var disablingSpy = jasmine.createSpy('disabling-modifier-spy').andCallFake(
                        function(t) { return false; }
                    );

                    for (var i = 0; i < spiesCount; i++) {
                        childSpies.push(jasmine.createSpy('child-spy-'+i));
                    }

                    doAsync(player, {
                        prepare: function() {

                            scene.modify(sceneSpy);

                            var parent = b();
                            parent.modify.apply(parent, curClass(disablingSpy));
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

        describe("default modifiers,", function() {

            // FIXME: use varyAll to test also in drawAt and after a time-jump
            // TODO: test timing (localTime) in more cases (with varyAll)
            // TODO: move doAsync similar calls to some function

            describe("adding them and the way it affects their bands", function() {

                it("should add modifier and call it", function() {
                    scene = b('scene').band([0, 3]);

                    var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                        expect(t).toBeGreaterThanOrEqual(0);
                        expect(t).toBeLessThanOrEqual(1);
                    });

                    doAsync(player, {
                        prepare: function() { scene.modify(modifierSpy);
                                              return scene; },
                        do: 'play', until: C.STOPPED, timeout: 1.2,
                        then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                    });

                });

                it("should add modifier and call it inside its local band", function() {
                    scene = b('scene').band([0, 2]);

                    var target = b().band([.3, 1.5]);

                    scene.add(b().add(b().add(target)));

                    var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                        expect(t * (1.5 - .3)).toEqual(player.state.time - .3);
                        expect(t).toBeGreaterThanOrEqual(0);
                        expect(t).toBeLessThanOrEqual(1);
                    });

                    doAsync(player, {
                        prepare: function() { target.modify(modifierSpy);
                                              return scene; },
                        do: 'play', until: C.STOPPED, timeout: 2.2,
                        then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                    });

                });

                it("should add modifier to a child and call it", function() {
                    scene = b('scene').band([0, 1]);

                    var target = b();

                    scene.add(b().add(b().add(target)));

                    var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                        expect(t).toBeGreaterThanOrEqual(0);
                        expect(t).toBeLessThanOrEqual(1);
                    });

                    doAsync(player, {
                        prepare: function() { target.modify(modifierSpy);
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

                    var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                        expect(t * (.42 - .11)).toEqual(player.state.time - .2 - .11);
                        expect(t).toBeGreaterThanOrEqual(0);
                        expect(t).toBeLessThanOrEqual(1);
                    });

                    doAsync(player, {
                        prepare: function() { target.modify(modifierSpy);
                                              return scene; },
                        do: 'play', until: C.STOPPED, timeout: 1.2,
                        then: function() { expect(modifierSpy).toHaveBeenCalled(); }
                    });

                });

                it("should pass element's band duration inside", function() {
                    scene = b('scene').band([2, 3]);

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
                                expect(duration).toBe(bands[i][1] - bands[i][0]);
                            }
                        })(i)));
                        scene.add(b().band(bands[i]).modify(spies[i]));
                    }

                    doAsync(player, {
                        scene: scene,
                        do: 'play', until: C.STOPPED, timeout: 3.2,
                        then: function() { _each(spies, function(spy) { expect(spy).toHaveBeenCalled(); } ); }
                    });

                });

                it("should add several modifiers and call all of them", function() {
                    scene = b('scene').band([0, 1]);

                    var modifierSpies = [];
                    var spiesCount = 10;

                    for (var i = 0; i < spiesCount; i++) {
                        modifierSpies.push(jasmine.createSpy('modifier-spy-'+i).andCallFake(
                            function(t) {
                                expect(t).toBeGreaterThanOrEqual(0);
                                expect(t).toBeLessThanOrEqual(1);
                            }
                        ));
                    }

                    doAsync(player, {
                        prepare: function() { for (var i = 0; i < spiesCount; i++) {
                                                  scene.modify(modifierSpies[i]);
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

                    var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
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
                    });

                    doAsync(player, {
                        prepare: function() {
                            scene.modify(modifierSpy);
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
                            return function(t, removeTime) {
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
                            } })(i)));
                    };

                    doAsync(player, {
                        prepare: function() {
                            for (var i = (spiesCount - 1); i >= 0; i--) {
                                scene.modify(modifierSpies[i],
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

            var _duration = 1,
                _timeout = _duration + .2;

            var scene = b();

            var CLOSE_FACTOR = 14; // digits following floating point

            // FIXME: test that 0-duration throws error
            // FIXME: test that applying any tween calls b().modify

            varyAll([ {
                    description: "when assigned to the scene",
                    prepare: function() { target = scene;
                                          trg_band = [ 0, _duration ];
                                          trg_duration = _duration;
                                          target.band(trg_band); }
                }, {
                    description: "when assigned to the child whose band is narrower than scene band",
                    prepare: function() { trg_band = [ _duration / 6, (_duration / 6) * 5 ];
                                          trg_duration = trg_band[1] - trg_band[0];
                                          target = b().band(trg_band);
                                          scene.add(b().add(b().add(target))); }
                }, {
                    description: "when assigned to the grand-child whose parent band is narrower than scene band",
                    prepare: function() { trg_band = [ _duration / 7, (_duration / 7) * 4 ];
                                          trg_duration = trg_band[1] - trg_band[0];
                                          target = b();
                                          scene.add(b().add(b().add(target)).band(trg_band)); }
                } ], function() {

                describe("and when a frame requested", function() {

                    var _whatToRun,
                        _waitFor;

                    function expectAtTime(conf) {
                        var bands = __num(conf.bands[0]) ? [ conf.bands ] : _arrayFrom(conf.bands),
                            modifiers = _arrayFrom(conf.modifiers),
                            expectations = _arrayFrom(conf.expectations),
                            spies = [];
                        _each(modifiers, function(modifier, idx) { spies.push(jasmine.createSpy('mod-'+idx).andCallFake(modifier)); });
                        doAsync(player, {
                            prepare: function() { _each(spies, function(spy, idx) { target.modify(bands[idx], spy); });
                                                  return scene; },
                            run: _whatToRun(conf.time), waitFor: _waitFor, timeout: _timeout,
                            then: function() { _each(expectations, function(expectation) { expectation(); });
                                               _each(spies, function(spy) { expect(spy).toHaveBeenCalledOnce();
                                                                            target.unmodify(spy); }); }
                        });
                    }

                    varyAll([ { description: "while just momentary playing,", prepare: function() {
                                    _whatToRun = function(t) {
                                        return function() {
                                            player.play(t, 1, 0.1);
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
                            mod_duration; // duration of the modifier band

                        varyAll([ { description: "and modifier band is equal to parent band",
                                    prepare: function() { mod_band = [ 0, trg_duration ];
                                                          mod_duration = trg_duration; } },
                                  { description: "and modifier band is at the start of parent band",
                                    prepare: function() { mod_band = [ 0, trg_duration / 3 ];
                                                          mod_duration = mod_band[1] - mod_band[0]; } },
                                  { description: "and modifier band is at the end of parent band",
                                    prepare: function() { mod_band = [ (trg_duration / 3) * 2, trg_duration ];
                                                          mod_duration = mod_band[1] - mod_band[0]; } },
                                  { description: "and modifier band is somewhere in the middle of parent band",
                                    prepare: function() { mod_band = [ trg_duration / 4, trg_duration / 3 ];
                                                          mod_duration = mod_band[1] - mod_band[0]; } } ], function() {

                            it("should pass modifier band duration inside", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t, duration) {
                                        expect(duration).toBe(mod_duration);
                                    },
                                    time: trg_band[0] + (mod_band[0] / 3) });
                            });

                            describe("in favor of alignment,", function() {

                                it("should call modifier before the fact when its band has started and pass the starting time inside", function() {
                                    expectAtTime({
                                        bands: mod_band,
                                        modifiers: function(t) {
                                            expect(t).toBe(0);
                                        },
                                        time: ( (mod_band[0] > 0)
                                               ? trg_band[0] + (mod_band[0] / 2)
                                               : trg_band[0] ) });
                                });

                                it("should call modifier after the fact when its band has finished and pass the ending time inside", function() {
                                    var mod_duration = mod_band[1] - mod_band[0];
                                    expectAtTime({
                                        bands: mod_band,
                                        modifiers: function(t) {
                                            expect(t).toBe(1);
                                        },
                                        time: ( (mod_duration < trg_duration)
                                               ? trg_band[0] + mod_band[1] +
                                                 ((trg_duration - mod_band[1]) / 2)
                                               : trg_band[1] ) });
                                });

                                it("should just pass the local time to modifier (and, for sure, call it), if its band is within current time", function() {
                                    var mod_duration = mod_band[1] - mod_band[0];
                                    expectAtTime({
                                        bands: mod_band,
                                        modifiers: function(t) {
                                            expect(t).toBeGreaterThan(0);
                                            expect(t).toBeLessThan(1);
                                            expect(t).toBeCloseTo(1/3, CLOSE_FACTOR);
                                        },
                                        time: trg_band[0] + mod_band[0] + (mod_duration / 3) });
                                });

                            });

                        });

                        describe("if band exceeds the wrapper after the end,", function() {

                            var diff;

                            beforeEach(function() {
                                mod_band = [ trg_duration / 4, trg_duration + 1 ];
                                mod_duration = mod_band[1] - mod_band[0];
                                diff = (trg_band[0] + mod_band[0] + mod_duration) - trg_band[1];
                            });

                            it("should keep passing a starting time if when its band hasn't started", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBe(0);
                                    },
                                    time: trg_band[0] + (trg_duration / 5) });
                            });

                            it("should pass actual local time value when intersection was not reached", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBeGreaterThan(0);
                                        expect(t).toBeLessThan(1 - (diff / mod_duration));
                                        expect(t).toBeCloseTo(((trg_duration / 3) - mod_band[0]) / mod_duration, CLOSE_FACTOR);
                                    },
                                    time: trg_band[0] + (trg_duration / 3) });
                            });

                            it("should pass the intersection time in the end of wrapper band", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBeCloseTo(1 - (diff / mod_duration), CLOSE_FACTOR);
                                    },
                                    time: trg_band[1] });
                            });

                        });

                        describe("if band exceeds the wrapper before the start,", function() {

                            var start_diff = 1;

                            beforeEach(function() {
                                mod_band = [ -start_diff, trg_duration / 4 ];
                                mod_duration = mod_band[1] - mod_band[0];
                            });

                            it("should pass intersection time when position is at start of the wrapper", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBe(start_diff / mod_duration);
                                    },
                                    time: trg_band[0] });
                            });

                            it("should pass actual local time value when intersection was passed", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBeGreaterThan(start_diff / mod_duration);
                                        expect(t).toBeLessThan(1);
                                        expect(t).toBeCloseTo(((trg_duration / 5) + start_diff) / mod_duration, CLOSE_FACTOR);
                                    },
                                    time: trg_band[0] + (trg_duration / 5) });
                            });

                            it("should pass the end time when its band was finished", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBe(1);
                                    },
                                    time: trg_band[0] + (trg_duration / 3) });
                            });

                        });

                        describe("if band exceeds the wrapper from both ends,", function() {

                            var start_diff = 1.2,
                                end_diff = 1;

                            beforeEach(function() {
                                mod_band = [ -start_diff, trg_duration + end_diff ];
                                mod_duration = mod_band[1] - mod_band[0];
                            });

                            it("should pass intersection time when position is at start of the wrapper", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBe(start_diff / mod_duration);
                                    },
                                    time: trg_band[0] });
                            });

                            it("should pass actual local time value when intersection was not reached", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBeGreaterThan(start_diff / mod_duration);
                                        expect(t).toBeLessThan(1 - (end_diff / mod_duration));
                                        expect(t).toBeCloseTo(((trg_duration / 3) + start_diff) / mod_duration, CLOSE_FACTOR);
                                    },
                                    time: trg_band[0] + (trg_duration / 3) });
                            });

                            it("should pass the end-intersection time when position is at the end of the wrapper", function() {
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        // FIXME: (mod_duration - end_diff) fails here due to rounding problem
                                        expect(t).toBe((start_diff + trg_duration) / mod_duration);
                                    },
                                    time: trg_band[1] });
                            });

                        });

                        describe("in favor of sequences,", function() {

                            var one_fifth;

                            beforeEach(function() { one_fifth = trg_duration / 5; });

                            var band1, band2,
                                band1_duration, band2_duration;

                            // NB: modifiers added in reverse order to ensure order do not affects sequencing,
                            //     so band2 goes before band1 and so the expectations are also swapped

                            describe("if other modifier goes a bit after the current one,", function() {

                                beforeEach(function() {
                                    band1 = [ one_fifth * 3, one_fifth * 4 ],
                                    band2 = [ one_fifth, one_fifth * 2 ],
                                    band1_duration = band1[1] - band1[0],
                                    band2_duration = band2[1] - band2[0];
                                });

                                it("in period before first, should call first one with start value and next one also with start value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBe(0); },
                                            function(t) { expect(t).toBe(0); }
                                        ], time: trg_band[0] + (one_fifth / 2) });
                                });

                                it("during the first one, should call first one with actual value and next one with start value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBe(0); },
                                            function(t) { expect(t).toBeGreaterThan(0);
                                                          expect(t).toBeLessThan(1);
                                                          expect(t).toBeCloseTo((one_fifth * 0.5) / band2_duration, CLOSE_FACTOR); }
                                        ], time: trg_band[0] + (one_fifth * 1.5) });
                                });

                                it("during the period between them, should call first one with end value and next one with start value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBe(0); },
                                            function(t) { expect(t).toBe(1); }
                                        ], time: trg_band[0] + (one_fifth * 2.5) });
                                });

                                it("during the second one, should call first one with end value and next one with actual value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBeGreaterThan(0);
                                                          expect(t).toBeLessThan(1);
                                                          expect(t).toBeCloseTo((one_fifth * 0.5) / band1_duration, CLOSE_FACTOR); },
                                            function(t) { expect(t).toBe(1); }
                                        ], time: trg_band[0] + (one_fifth * 3.5) });
                                });

                                it("after the second one, should call first one with end value and next one with end value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBe(1); },
                                            function(t) { expect(t).toBe(1); }
                                        ], time: trg_band[0] + (one_fifth * 4.5) });
                                });

                            });

                            describe("if next modifier overlaps the end of the current one,", function() {

                                beforeEach(function() {
                                    band1 = [ one_fifth * 2.3, one_fifth * 4 ],
                                    band2 = [ one_fifth, one_fifth * 2.7 ],
                                    band1_duration = band1[1] - band1[0],
                                    band2_duration = band2[1] - band2[0];
                                });

                                it("in period before first, should call first one with start value and next one also with start value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBe(0); },
                                            function(t) { expect(t).toBe(0); }
                                        ], time: trg_band[0] + (one_fifth / 2) });
                                });

                                it("during the first one, but not the overlapping period, should call first one with actual value and next one with start value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBe(0); },
                                            function(t) { expect(t).toBeGreaterThan(0);
                                                          expect(t).toBeLessThan(1);
                                                          expect(t).toBeCloseTo(one_fifth / band2_duration, CLOSE_FACTOR); }
                                        ], time: trg_band[0] + (one_fifth * 2) });
                                });

                                it("during the overlapping period, should call first one with actual value and next one also with actual value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBeGreaterThan(0);
                                                          expect(t).toBeLessThan(1);
                                                          expect(t).toBeCloseTo((one_fifth * 0.2) / band1_duration, CLOSE_FACTOR); },
                                            function(t) { expect(t).toBeGreaterThan(0);
                                                          expect(t).toBeLessThan(1);
                                                          expect(t).toBeCloseTo((one_fifth * 1.5) / band2_duration, CLOSE_FACTOR); }
                                        ], time: trg_band[0] + (one_fifth * 2.5) });
                                });

                                it("during the second one, but not the overlapping period, should call first one with end value and next one with actual value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBeGreaterThan(0);
                                                          expect(t).toBeLessThan(1);
                                                          expect(t).toBeCloseTo((one_fifth * 0.7) / band1_duration, CLOSE_FACTOR); },
                                            function(t) { expect(t).toBe(1); }
                                        ], time: trg_band[0] + (one_fifth * 3) });
                                });

                                it("after the second one, should call first one with end value and next one with end value", function() {
                                    expectAtTime({
                                        bands: [ band1, band2 ],
                                        modifiers: [
                                            function(t) { expect(t).toBe(1); },
                                            function(t) { expect(t).toBe(1); }
                                        ], time: trg_band[0] + (one_fifth * 4.5) });
                                });

                            });

                            // TODO: test exceeding bands

                        });

                    });

                });

                describe("during playing process,", function() {

                    var one_fifth;

                    beforeEach(function() { one_fifth = trg_duration / 5; });

                    function whilePlaying(bands, modifiers) {
                        var bands = __num(bands[0]) ? [ bands ] : _arrayFrom(bands),
                            modifiers = _arrayFrom(modifiers),
                            spies = [];
                        _each(modifiers, function(modifier, idx) {
                            spies.push(jasmine.createSpy('mod-'+idx).andCallFake(modifier));
                        });
                        doAsync(player, {
                            prepare: function() { _each(spies, function(spy, idx) {
                                                      target.modify(bands[idx], spy);
                                                  }); return scene; },
                            do: 'play', until: C.STOPPED, timeout: _timeout,
                            then: function() { /*_each(expectations, function(expectation) { expectation(); });*/
                                               _each(spies, function(spy) { expect(spy).toHaveBeenCalled();
                                                                            target.unmodify(spy); }); }
                        });
                    }

                    function localTime(parent_band, band) {
                        return player.state.time - parent_band[0] - band[0];
                    }

                    function timeBetween(parent_band, low, high) {
                        var parent_time = player.state.time - parent_band[0];
                        return (parent_time >= low) &&
                               (parent_time < high);
                    }

                    function checkWithBands(bands) {
                        var bands = __num(bands[0]) ? [ bands ] : _arrayFrom(bands);
                        var modifiers = [];
                        _each(bands, function(band) {
                            modifiers.push(function(t, duration) {
                                var _start = band[0],
                                    _end = band[1],
                                    _band_duration = _end - _start;
                                if (timeBetween(trg_band, 0, _start)) {
                                    expect(t).toBe(0);
                                }
                                if (timeBetween(trg_band, _start, _end)) {
                                    expect(t).toBeGreaterThanOrEqual(0);
                                    expect(t).toBeLessThan(1);
                                    expect(t).toEqual(localTime(trg_band, band) / _band_duration);
                                }
                                if (timeBetween(trg_band, _end, trg_duration)) {
                                    expect(t).toBe(1);
                                }
                                expect(duration).toBe(band[1] - band[0]);
                            });
                        });
                        whilePlaying(bands, modifiers);
                    }

                    var checkWithBand = checkWithBands;

                    describe("same rules should apply with a single modifier, independently of position, it", function() {

                        it("may be just somewhere inside of the wrapper band", function() {
                            checkWithBand([ one_fifth * 1.5, one_fifth * 4 ]);
                        });

                        it("may be aligned to start of the wrapper band", function() {
                            checkWithBand([ 0, one_fifth * 3 ]);
                        });

                        it("may be aligned to end of the wrapper band", function() {
                           checkWithBand([ one_fifth * 2, trg_duration ]);
                        });

                        it("may be equal to wrapper band", function() {
                            checkWithBand([ 0, trg_duration ]);
                        });

                        it("may exceed the wrapper band", function() {
                            checkWithBand([ -1, trg_duration + 1 ]);
                        });

                    });

                    describe("and a sequence of them", function() {

                        it("if they follow one another", function() {
                            checkWithBands([ [ one_fifth * 3, one_fifth * 4 ],
                                             [ one_fifth * 1, one_fifth * 2 ] ]);
                        });

                        it("or if they overlap", function() {
                            checkWithBands([ [ one_fifth * 2, one_fifth * 4 ],
                                             [ one_fifth * 1, one_fifth * 3 ] ]);
                        });

                        it("or if they overlap with exceeding", function() {
                            checkWithBands([ [ one_fifth * 2, one_fifth * 6 ],
                                             [ -one_fifth, one_fifth * 2.999 ] ]); // failed with one_fifth * 3 due to
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
                var modifySpy = spyOn(trg, 'modify');
                trg.at(2.2, modifier, data, priority);
                expect(modifySpy).toHaveBeenCalledOnce();
                expect(modifySpy).toHaveBeenCalledWith(2.2, modifier, data, priority);
            })

            var scene,
                target;

            var trg_band,
                trg_duration;

            var _duration = 2.5,
                _timeout = 1.7;

            beforeEach(function() {
                scene = b('scene').band([0, _duration]);
                scene.duration = _duration;
                player.load(scene);
            });

            var modifier_time;

            var CLOSE_FACTOR = 14; // digits following floating point

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

                varyAll([ { prepare: function() { modifier_time = 0; },
                            description: "and modifier time is at the exact start of the target" },
                          { prepare: function() { modifier_time = (1 / 15) * trg_duration; },
                            description: "and modifier time is very-very close to the start of the target" },
                          { prepare: function() { modifier_time = (1 / 14) * trg_duration; },
                            description: "and modifier time is very close to the start of the target" },
                          { prepare: function() { modifier_time = (1 / 10) * trg_duration; },
                            description: "and modifier time is close to the start of the target" },
                          { prepare: function() { modifier_time = (1 / 4)   * trg_duration; },
                            description: "and modifier time is near to the start of the target" },
                          { prepare: function() { modifier_time = (1 / 2)   * trg_duration; },
                            description: "and modifier time is in the middle of the target" },
                          { prepare: function() { modifier_time = (3 / 4)   * trg_duration; },
                            description: "and modifier time is near to the end of the target" },
                          { prepare: function() { modifier_time = (9 / 10) * trg_duration; },
                            description: "and modifier time is close to the end of the target" },
                          { prepare: function() { modifier_time = (13 / 14) * trg_duration; },
                            description: "and modifier time is very close to the end of the target" },
                          { prepare: function() { modifier_time = (14 / 15) * trg_duration; },
                            description: "and modifier time is even closer to the end of the target" },
                          { prepare: function() { modifier_time = trg_duration; },
                            description: "and modifier time is at the exact end of the target" }
                        ], function() {

                    it("should call a modifier exactly once", function() {
                        var modifierSpy = jasmine.createSpy('modifier-spy');

                        doAsync(player, {
                            prepare: function() { target.modify(0.3, modifierSpy); },
                            do: 'play', until: C.STOPPED, timeout: _timeout,
                            then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                               target.unmodify(modifierSpy); }
                        });

                    });

                    it("should call a modifier at given time or a bit later", function() {
                        var calledAt = -1;
                        var expectedT = 0.7;

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                            expect(t).toBeGreaterThanOrEqual(expectedT);
                            expect(t).toBeCloseTo(expectedT, CLOSE_FACTOR);
                            expect(calledAt).not.toBeGreaterThan(0); // ensure not called before
                            calledAt = t;
                        });

                        doAsync(player, {
                            prepare: function() { scene.at(expectedT, modifierSpy); },
                            do: 'play', until: C.STOPPED, timeout: _timeout,
                            then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                               expect(calledAt).toBeGreaterThanOrEqual(expectedT);
                                               expect(calledAt).toBeCloseTo(expectedT, CLOSE_FACTOR); }
                        });

                    });

                    it("should pass target band duration inside the modifier", function() {
                        var expectedT = 0.7;

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, duration) {
                            expect(duration).toEqual(trg_duration);
                        });

                        doAsync(player, {
                            prepare: function() { scene.at(expectedT, modifierSpy); },
                            do: 'play', until: C.STOPPED, timeout: _timeout,
                            then: function() { expect(modifierSpy).toHaveBeenCalledOnce(); }
                        });

                    });

                    var _whatToRun,
                        _valueTest;

                    function expectToCall(modifier, modTime, playTime, callback) {
                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(modifier);
                        doAsync(player, {
                            prepare: function() { target.modify(modTime, modifierSpy); },
                            run: _whatToRun(playTime), until: C.STOPPED, timeout: _timeout,
                            then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                               target.unmodify(modifierSpy);
                                               if (callback) callback(); }
                        });
                    };

                    function expectNotToCall(modifier, modTime, playTime, callback) {
                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(modifier);
                        doAsync(player, {
                            prepare: function() { target.modify(modTime, modifierSpy); },
                            run: _whatToRun(playTime), until: C.STOPPED, timeout: _timeout,
                            then: function() { expect(modifierSpy).not.toHaveBeenCalledOnce();
                                               target.unmodify(modifierSpy);
                                               if (callback) callback(); }
                        });
                    };

                    var mFPS = 1 / FPS,
                        FPS_ERR = anm.Element._FPS_ERROR;

                    function playValueTest(t, time) { return ((t >= 0) && (t <= trg_duration)) &&
                                                             (((t >= time) && (t <= time + (mFPS * FPS_ERR))) ||
                                                              ((t < time)  && __close(t, time, 10))); }
                    function drawValueTest(t, time) { return ((t >= 0) && (t <= trg_duration)) &&
                                                             ( Math.round(t    * Math.pow(10, CLOSE_FACTOR)) ==
                                                               Math.round(time * Math.pow(10, CLOSE_FACTOR)) ); }
                    function fitsScene(mod_time) { return (trg_band[0] + mod_time >= 0) && (trg_band[0] + mod_time <= _duration); }

                    varyAll( [
                          { description: "short-playing-period",
                            prepare: function() {
                                _whatToRun = function(time) {
                                    return function() { if (!fitsScene(time)) throw new Error('Time doesn\'t fit the scene');
                                                        player.play(trg_band[0] + time, 1, mFPS * 3); }
                                };
                                _valueTest = playValueTest;
                            } },
                          { description: "if rendering was requested",
                            prepare: function() {
                                _whatToRun = function(time) {
                                    return function() { if (!fitsScene(time)) throw new Error('Time doesn\'t fit the scene');
                                                        player.drawAt(trg_band[0] + time); }
                                };
                                _valueTest = drawValueTest;
                            } }
                          /* TODO: { description: "if time-jump was performed",
                            prepare: function() {} } */
                        ], function() {

                        it("should call a modifier if current frame matches its time", function() {
                            expectToCall(function(t) {
                                expect(_valueTest(t, modifier_time)).toBeTruthy();
                            }, modifier_time, modifier_time);
                        });

                        it("should not call a modifier if current frame requested is after (even a little bit) its time, except the cases when it predicts not to be fast enough to be called in the end of the bands", function() {
                            var calls = [];
                            for (var delta = .01, to = mFPS * 1.5; delta < to; delta += .01) {
                                var later_time = modifier_time + (mFPS * FPS_ERR) + delta;
                                if (fitsScene(later_time)) {
                                    (function(later_time) {
                                        if ((modifier_time <= (trg_duration - mFPS)) ||
                                            (later_time <= (trg_band[0] + trg_duration - mFPS)) ||
                                            ((later_time >= (trg_band[0] + trg_duration + mFPS)) && fitsScene(later_time))) {
                                            calls.push(function() {
                                                expectNotToCall(_mocks.nop, modifier_time,
                                                                later_time, this.next);
                                            });
                                        } else if (fitsScene(later_time)) {
                                            calls.push(function() {
                                                expectToCall(function(t) {
                                                    expect(_valueTest(t, modifier_time)).toBeTruthy();
                                                }, modifier_time, later_time, this.next);
                                            });
                                        }
                                    }(later_time));
                                }
                            }
                            if ((trg_band[0] + modifier_time + (mFPS * FPS_ERR) + 0.01) <= _duration) {
                                expect(calls.length).toBeGreaterThan(0);
                            }
                            if (calls.length > 0) queue(calls);
                        });

                        it("should call a modifier again and again if current frame matches its time", function() {
                            var calls = [];
                            for (var i = 0; i < 10; i++) {
                                calls.push(function() {
                                    expectToCall(function(t) {
                                        expect(_valueTest(t, modifier_time)).toBeTruthy();
                                    }, modifier_time, modifier_time, this.next);
                                });
                            }
                            queue(calls);
                        });

                    });

                    it("should call a modifier if frame-time wasn't fit to actual time while playing (from earlier point), but was fit to a time a bit later.", function() {
                        var calls = [];
                        var fraction = 4 / 5;
                        /* console.log('===================');
                        console.log('mFPS', mFPS);
                        console.log('fraction', mFPS * fraction); */
                        for (var delta = fraction * mFPS; delta > 0; delta -= .005) {
                            var call_at = trg_band[0] + (modifier_time - delta);
                            if (call_at < 0) call_at = 0;
                            if ((call_at >= trg_band[0]) &&
                                (call_at + mFPS) <= (trg_band[0] + trg_duration)) {
                                (function(call_at) {
                                    calls.push(function() {
                                        (function(next) {
                                            /* console.log('------------------');
                                            console.log('requested time is', call_at);
                                            console.log('target band start is', trg_band[0]);
                                            console.log('target band duration is', trg_duration);
                                            console.log('modifier time is', modifier_time); */
                                            var modifierSpy = jasmine.createSpy('modifier-spy')
                                                .andCallFake(function(t) {
                                                    //console.log('modifier was called at', t, 'value test:', playValueTest(t, modifier_time));
                                                    expect(playValueTest(t, modifier_time)).toBeTruthy();
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
                        if (calls.length > 0) queue(calls);
                    });

                    // TODO: test enabling/disabling elements
                    // TODO: test adding same trigger-modifier to different elements and calling it from one,
                    //       does not affects its playing at other elements
                });

            });

        });

    });

    // TODO: test different types of modifiers working simultaneously in one test
    // TODO: ensure removing fails if modifier wasn't added to element
    // TODO: test jumping in time
    // TODO: test that modifier added to some element, which then was cloned, may be easily removed from the last
    // TODO: test that error is fired if modifier was already added to this element
    // TODO: test that modify/paint/unmodify/unpaint/at do not break chaining
    // TODO: test adding one modifier to several elements and removing it then
    // TODO: ensure that if time-triggered modifier fails time-check all next modifiers are called
    // TODO: change time-value for all of modifiers to 0..1 value?

    // TODO: test events

});