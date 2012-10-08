/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("builder, regarding modifiers", function() {

    var player,
        C = anm.C;

    var b = Builder._$,
        B = Builder;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();

        // preview mode is enabled not to mess with still-preview used for video-mode
        // (it calls drawAt and causes modifiers to be called once more before starting playing)
        player = createPlayer('test-id', { mode: C.M_PREVIEW });
    });

    describe("independently of modifier class,", function() {

        var curClass; // function that creates first arguments for a 'modify' call, it is done
                      // to vary all of modifier types

        var _duration = 1,
            _timeout = _duration + .2,
            _run = function() { player.play(); };

        varyAll([ {
                    description: "either it is a default modifier (band is equal to element's band),",
                    prepare: function() { curClass = function(spy) { return [ spy ] } }
                  }, {
                    description: "either it is a band-restricted modifier,",
                    prepare: function() { curClass = function(spy) { return [ [ 0, _duration ], spy ] } }
                  }, {
                    description: "or it is a trigger-like modifier,",
                    prepare: function() { curClass = function(spy) { return [ 0, spy ] };
                                          _duration = anm.Player.TRIG_TIMEOUT; /* to ensure that it will be called */
                                          _timeout = _duration + .2;
                                          _run = function() { player.drawAt(_duration / 4); }; }
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
                        run: _run, until: C.STOPPED, timeout: _duration + .2,
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

            });

        });

    });

    describe("class-dependent stuff", function() {

        describe("default modifiers", function() {

            // FIXME: use varyAll to test also in drawAt and after a time-jump
            // TODO: move doAsync similar calls to some function

            describe("adding them and the way it affects their bands", function() {

                it("should add modifier and call it", function() {
                    scene = b('scene').band([0, 1]);

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
                        expect(t).toBeGreaterThanOrEqual(0);
                        expect(t).toBeLessThanOrEqual(1.5 - .3);
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
                        expect(t).toBeGreaterThanOrEqual(0);
                        expect(t).toBeLessThanOrEqual(.31);
                    });

                    doAsync(player, {
                        prepare: function() { target.modify(modifierSpy);
                                              return scene; },
                        do: 'play', until: C.STOPPED, timeout: 1.2,
                        then: function() { expect(modifierSpy).toHaveBeenCalled(); }
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
                mod_band; // band of the modifier itself

            var _duration = 1,
                _timeout = _duration + .2;

            var scene = b();

            varyAll([ {
                    description: "when assigned to the scene",
                    prepare: function() { target = scene;
                                          trg_band = [ 0, _duration ];
                                          target.band(trg_band); }
                }, {
                    description: "when assigned to the child whose band is narrower than scene band",
                    prepare: function() { trg_band = [ _duration / 6, (_duration / 6) * 5 ];
                                          target = b().band(trg_band);
                                          scene.add(b().add(b().add(target))); }
                }, {
                    description: "when assigned to the grand-child whose parent band is narrower than scene band",
                    prepare: function() { trg_band = [ _duration / 7, (_duration / 7) * 4 ];
                                          target = b();
                                          scene.add(b().add(b().add(target)).band(trg_band)); }
                } ], function() {

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
                                           _each(spies, function(spy) { expect(spy).toHaveBeenCalled(); }); }
                    });
                }

                varyAll([ { description: "while just momentary playing,", prepare: function() {
                                _whatToRun = function(t) {
                                    return function() {
                                        player.play(t);
                                        setTimeout(function() { player.stop() }, 100);
                                    }
                                };
                                _waitFor = function() { return player.state.happens === C.STOPPED; }
                            } },
                          { description: "when particular frame was requested,", prepare: function() {
                                var drawAtSpy = spyOn(player, 'drawAt').andCallThrough();
                                _whatToRun = function(t) {
                                    return function() {
                                        setTimeout(function() { player.drawAt(t) }, 50);
                                    };
                                };
                                _waitFor = function() { return (drawAtSpy.callCount > 0); }
                            } },
                          /* TODO: { description: "when inner time-jump was preformed," , prepare: function() {} } */ ], function() {

                    varyAll([ { description: "and modifier band is equal to parent band",
                                prepare: function() { mod_band = trg_band; } },
                              { description: "and modifier band is at the start of parent band",
                                prepare: function() { var trg_duration = trg_band[1] - trg_band[0];
                                                      mod_band = [ 0, trg_duration / 3 ]; } },
                              { description: "and modifier band is at the end of parent band",
                                prepare: function() { var trg_duration = trg_band[1] - trg_band[0];
                                                      mod_band = [ (trg_duration / 3) * 2, trg_duration ]; } },
                              { description: "and modifier band is somewhere in the middle of parent band",
                                prepare: function() { var trg_duration = trg_band[1] - trg_band[0];
                                                      mod_band = [ trg_duration / 4, trg_duration / 3 ]; } } ], function() {

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
                                        expect(t).toBe(mod_duration);
                                    },
                                    time: ( (mod_band[1] < trg_duration)
                                           ? trg_band[0] + trg_duration - ((trg_duration - mod_band[1]) / 2)
                                           : trg_band[1] ) });
                            });

                            it("should just pass the local time to modifier (and, for sure, call it), if its band is within current time", function() {
                                var mod_duration = mod_band[1] - mod_band[0];
                                expectAtTime({
                                    bands: mod_band,
                                    modifiers: function(t) {
                                        expect(t).toBeGreaterThanOrEqual(mod_band[0]);
                                        expect(t).toBeLessThanOrEqual(mod_band[1]);
                                    },
                                    time: trg_band[0] + mod_band[0] + (mod_duration / 3) });
                            });

                            // TODO: test negative bands

                        });

                    });

                    describe("in favor of sequences,", function() {

                        var one_fifth = duration / 5;

                        describe("if other modifier goes a bit after the current one,", function() {

                            var band1 = [ one_fifth * 3, one_fifth * 4 ],
                                band2 = [ one_fifth, one_fifth * 2 ];

                            it("in period before first, should call first one with start value and next one also with start value", function() {
                                this.fail('NI');
                            });

                            it("during the first one, should call first one with actual value and next one with start value", function() {
                                this.fail('NI');
                            });

                            it("during the period between them, should call first one with end value and next one with start value", function() {
                                this.fail('NI');
                            });

                            it("during the second one, should call first one with end value and next one with actual value", function() {
                                this.fail('NI');
                            });

                            it("after the second one, should call first one with end value and next one with end value", function() {
                                this.fail('NI');
                            });

                        });

                        describe("if next modifier overlaps the end of the current one,", function() {

                            it("in period before first, should call first one with start value and next one also with start value", function() {
                                this.fail('NI');
                            });

                            it("during the first one, but not the overlapping period, should call first one with actual value and next one with start value", function() {
                                this.fail('NI');
                            });

                            it("during the overlapping period, should call first one with actual value and next one with actual value", function() {
                                this.fail('NI');
                            });

                            it("during the second one, but not the overlapping period, should call first one with end value and next one with actual value", function() {
                                this.fail('NI');
                            });

                            it("after the second one, should call first one with end value and next one with end value", function() {
                                this.fail('NI');
                            });

                        });

                    });

                });

                describe("during playing process,", function() {

                    it("same rules should work with a single modifier", function() {
                        this.fail('NI');
                    });

                    it("and a sequence of them", function() {
                        this.fail('NI');
                    });

                });

                // TODO: test the cases when modifier band exceeds wrapping element band

            });
        });

        describe("trigger-like modifiers,", function() {

            it("`at` method should be deprecated", function() {
                expect(b().at).not.toBeDefined();
            })

            var scene;

            var _duration = 2.5;

            beforeEach(function() {
                scene = b('scene').band([0, _duration]);
                scene.duration = _duration;
                player.load(scene);
            });

            var modifierTime;

            varyAll([ { description: "if target is a scene,",
                        prepare: function() {} },
                      { description: "if target is an inner element,",
                        prepare: function() {} } ],
                    function() {

                varyAll([ { prepare: function() { modifierTime = _duration / 4; },
                            description: "and modifier time is near to the start of the target (duration: " + _duration + ", t: " + _duration / 4 + ")" },
                          { prepare: function() { modifierTime = _duration / 2; },
                            description: "and modifier time is near to the middle of the target (duration: " + _duration + ", t: " + _duration / 2 + ")" },
                          { prepare: function() { modifierTime = (_duration / 4) * 3; },
                            description: "and modifier time is near to the end of the target (duration: " + _duration + ", t: " + (_duration / 4) * 3 + ")" },
                          { prepare: function() { modifierTime = 0; },
                            description: "and modifier time is at the exact start of the target (duration: " + _duration + ", t: " + 0 + ")" },
                          { prepare: function() { modifierTime = 0; },
                            description: "and modifier time is at the exact end of the target (duration: " + _duration + ", t: " + _duration + ")" }
                        ], function() {

                    it("should call a modifier exactly once", function() {
                        var modifierSpy = jasmine.createSpy('modifier-spy');

                        doAsync(player, {
                            prepare: function() { scene.at(1.1, modifierSpy); },
                            do: 'play', until: C.STOPPED, timeout: 1.7,
                            then: function() { expect(modifierSpy).toHaveBeenCalledOnce(); }
                        });

                    });

                    it("should call a modifier at given time or a bit later", function() {
                        var calledAt = -1;
                        var expectedT = 0.7;

                        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                            expect(t).toBeGreaterThanOrEqual(expectedT);
                            expect(calledAt).not.toBeGreaterThan(0); // ensure not called before
                            calledAt = t;
                        });

                        doAsync(player, {
                            prepare: function() { scene.at(expectedT, modifierSpy); },
                            do: 'play', until: C.STOPPED, timeout: 1.7,
                            then: function() { expect(modifierSpy).toHaveBeenCalledOnce();
                                               expect(calledAt).toBeGreaterThan(0);
                                               expect(calledAt).toBeGreaterThanOrEqual(0.7);
                                               expect(calledAt).toBeLessThan(0.9); }
                        });

                    });

                    varyAll( [
                          { description: "if rendering was requested",
                            prepare: function() {} },
                          { description: "if time-jump was performed",
                            prepare: function() {} }
                        ], function() {

                        it("previous frame position should be cleared", function() {
                            this.fail("NI");
                        });

                        it("should call a modifier if current frame matches its time", function() {
                            this.fail("NI");
                        });

                        it("should not call a modifier if current frame is after (even a little bit) its time", function() {
                            this.fail("NI");
                        });

                        it("should call a modifier again and again if current frame matches its time", function() {
                            this.fail("NI");
                        });

                    });

                    describe("during playing process,", function() {

                        it("should call a modifier if current frame is a bit after its time and previous frame happened before its time", function() {
                            this.fail("NI");
                        });

                        it("should not call a modifier if current frame is a bit after its time, but modifier was already called", function() {
                            this.fail("NI");
                        });

                        it("should not call a modifier if current frame is long after its time", function() {
                            this.fail("NI");
                        });

                        it("should call a modifier again and again if current frame fits its allowed period", function() {
                            this.fail("NI");
                        });

                        it("should not call a modifier again and again if current frame does not fits its allowed period", function() {
                            this.fail("NI");
                        });

                    });

                    // TODO: test enabling/disabling elements
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

    // TODO: test events

});