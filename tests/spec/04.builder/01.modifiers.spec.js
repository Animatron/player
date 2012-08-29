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

    // TODO: data and other parameters

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
            expect(modifierSpy.callCount).toBeGreaterThan(0);
            player.stop();
        });

    });

    it("should support removing modifiers", function() {
        scene = b('scene').band([0, 1]);

        var modifierId;

        var modifierSpy = jasmine.createSpy('modifier-spy').andCallFake(function(t) {
            expect(t).toBeGreaterThanOrEqual(0);
            expect(t).toBeLessThanOrEqual(.5);
            expect(modifierId).toBeDefined();
            if (t > .5) {
                expect(modifierSpy).toHaveBeenCalled();
                scene.unmodify(modifierId);
                modifierSpy.reset();
            }
        });

        runs(function() {
            modifierId = scene.modify(modifierSpy);
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

    });

});