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

        player = createPlayer('test-id');
    });

    it("should pass data to the modifier", function() {
        scene = b('scene').band([0, 1]);

        var expectedData = { 'foo': 42 };

        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t, data) {
            expect(data).toBeDefined();
            expect(data).toBe(expectedData);
            expect(data.foo).toBeDefined();
            expect(data.foo).toBe(42);
        });

        runs(function() {
            scene.modify(modifierSpy, expectedData);
            player.load(scene).play();
        });

        waitsFor(function() {
            return player.state.happens === C.STOPPED;
        }, 1100);

        runs(function() {
            expect(modifierSpy.callCount).toBeGreaterThan(0);
            player.stop();
        });
    });

    it("should set `this` in modifier to element's temporary state", function() {
        scene = b('scene').band([0, 1]);

        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
            expect(this).toBe(scene.v._state);
        });

        runs(function() {
            scene.modify(modifierSpy);
            player.load(scene).play();
        });

        waitsFor(function() {
            return player.state.happens === C.STOPPED;
        }, 1100);

        runs(function() {
            player.stop();
        });
    });

    describe("and especially, adding modifiers,", function() {

        it("should add modifier and call it", function() {
            scene = b('scene').band([0, 1]);

            var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                expect(t).toBeGreaterThanOrEqual(0);
                expect(t).toBeLessThanOrEqual(1);
            });

            runs(function() {
                scene.modify(modifierSpy);
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                expect(modifierSpy).toHaveBeenCalled();
                player.stop();
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

            runs(function() {
                target.modify(modifierSpy);
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                expect(modifierSpy).toHaveBeenCalled();
                player.stop();
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

            runs(function() {
                target.modify(modifierSpy);
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                expect(modifierSpy).toHaveBeenCalled();
                player.stop();
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
            };

            runs(function() {
                for (var i = 0; i < spiesCount; i++) {
                    scene.modify(modifierSpies[i]);
                }
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                for (var i = 0; i < spiesCount; i++) {
                    expect(modifierSpies[i]).toHaveBeenCalled();
                }
                player.stop();
            });

        });

    });

    describe("and especially, disabling elements,", function() {

        it("should not paint anything when element disabled", function() {
            scene = b('scene').band([0, 1]);

            var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
                return false;
            });

            var paintSpy = jasmine.createSpy('paint-spy');

            runs(function() {
                scene.modify(modifierSpy);
                scene.paint(paintSpy);
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                expect(modifierSpy).toHaveBeenCalled();
                expect(paintSpy).not.toHaveBeenCalled();
                player.stop();
            });

        });

        it("should not call the modifiers after the disabling one", function() {
            scene = b('scene').band([0, 1]);

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

            runs(function() {
                for (var i = 0; i < spiesCount; i++) {
                    scene.modify(modifierSpies[i]);
                }
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {

                for (var i = 0; i < disablingPos; i++) {
                    expect(modifierSpies[i]).toHaveBeenCalled();
                }

                expect(modifierSpies[disablingPos]).toHaveBeenCalled();

                for (var i = disablingPos + 1; i < spiesCount; i++) {
                    expect(modifierSpies[i]).not.toHaveBeenCalled();
                }

                player.stop();
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

            runs(function() {
                scene.modify(sceneSpy);

                var parent = b().modify(disablingSpy);
                scene.add(parent);

                for (var i = 0; i < spiesCount; i++) {
                    var child = b().modify(childSpies[i]);
                    parent.add(child);
                    parent = child;
                }

                player.load(scene).play();

            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                expect(sceneSpy).toHaveBeenCalled();
                expect(disablingSpy).toHaveBeenCalled();

                for (var i = 0; i < spiesCount; i++) {
                    expect(childSpies[i]).not.toHaveBeenCalled();
                }

                player.stop();
            });
        });

    });

    describe("and especially, removing modifiers,", function() {

        it("should support removing modifiers", function() {
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

            runs(function() {
                scene.modify(modifierSpy);
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                expect(modifierSpy).not.toHaveBeenCalled();
                player.stop();
            });

        });

        it("should remove several modifiers in proper time", function() {
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

            runs(function() {
                for (var i = (spiesCount - 1); i >= 0; i--) {
                    scene.modify(modifierSpies[i],
                                 i !== 0 ? ((1 / i) - .1) : 0);
                }
                player.load(scene).play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1100);

            runs(function() {
                for (var i = 0; i < spiesCount; i++) {
                    expect(modifierSpies[i]).not.toHaveBeenCalled();
                }
                player.stop();
            });

        });

        // TODO: ensure removing fails if modifier wasn't added to element
        // TODO: test that modifier added to some element, which then was cloned, may be easily removed from the last
        // TODO: test that error is fired if modifier was already added to this element
        // TODO: test adding one modifier to several elements and removing it then

    });

    xdescribe("and especially, modifiers priorities,", function() {

    });

    // TODO: test events

    describe("and especially, exact-time-modifiers,", function() {

        var scene;

        beforeEach(function() {
            scene = b('scene').band([0, 1.5]);
            player.load(scene);
        });

        it("should call a modifier exactly once", function() {
            var modifierSpy = jasmine.createSpy('modifier-spy');

            runs(function() {
                scene.at(1.1, modifierSpy);
                player.play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1700);

            runs(function() {
                expect(modifierSpy).toHaveBeenCalledOnce();
                player.stop();
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

            runs(function() {
                scene.at(expectedT, modifierSpy);
                player.play();
            });

            waitsFor(function() {
                return player.state.happens === C.STOPPED;
            }, 1700);

            runs(function() {
                expect(modifierSpy).toHaveBeenCalledOnce();
                expect(calledAt).toBeGreaterThan(0);
                expect(calledAt).toBeGreaterThanOrEqual(0.7);
                expect(calledAt).toBeLessThan(0.9);
                player.stop();
            });
        });

        // TODO: should pass data

        // TODO: element.state should be `this`

    });

});