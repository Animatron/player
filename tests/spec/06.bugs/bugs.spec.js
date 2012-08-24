/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("as for known bugs,", function() {

    var player;

    var b = Builder._$,
        C = anm.C;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        this.addMatchers(_matchers);
    })

    describe('#34591729 should work as expected:', function() {

        it('should not call modifiers of the elements immediately after the fact they were removed', function() {

            _fakeCallsForCanvasRelatedStuff();

            var player = createPlayer('foo', { mode: C.M_DYNAMIC });
            var rect1 = b().rect([50, 50], 70);
            var rect2 = b().rect([100, 100], 70);
            var rect3 = b().rect([150, 150], 70);
            var rect4 = b().rect([40, 40], 70);
            var scene = b('scene').band([0, 10])
                                  .add(rect1)
                                  .add(rect2)
                                  .add(rect3)
                                  .add(rect4);

            var rect1Removed = false,
                rect3Removed = false,
                rect4Removed = false;

            var m_doNothing1Spy = jasmine.createSpy('do-noth-1');
            var m_doNothing2Spy = jasmine.createSpy('do-noth-2');
            var m_doNothing3Spy = jasmine.createSpy('do-noth-3');
            var m_doNothing4Spy = jasmine.createSpy('do-noth-4');

            rect1.modify(m_doNothing1Spy);
            rect2.modify(m_doNothing2Spy);
            rect3.modify(m_doNothing3Spy);
            rect4.modify(m_doNothing4Spy);

            var m_removeRectSpy;
            var m_selfRemoveSpy;

            runs(function() {

                m_removeRectSpy = jasmine.createSpy('remove-rect')
                                         .andCallFake(function(t) {
                                            if ((t > .5) && !rect1Removed) {
                                                scene.remove(rect1);
                                                expect(m_doNothing1Spy).toHaveBeenCalled();
                                                m_doNothing1Spy.reset();
                                                rect1Removed = true;
                                            }
                                         });
                m_selfRemoveSpy = jasmine.createSpy('self-remove')
                                         .andCallFake(function(t) {
                                            if ((t > .4) && !rect4Removed) {
                                                this.$.parent.remove(this.$);
                                                expect(m_doNothing4Spy).toHaveBeenCalled();
                                                m_doNothing4Spy.reset();
                                                rect4Removed = true;
                                            }
                                         });

                rect2.modify(m_removeRectSpy);
                rect4.modify(m_selfRemoveSpy);

                player.load(scene).play();

                setTimeout(function() {
                    scene.remove(rect3);
                    expect(m_doNothing3Spy).toHaveBeenCalled();
                    m_doNothing3Spy.reset();
                    rect3Removed = true;
                }, 550);

            });

            waitsFor(function() { return rect1Removed && rect3Removed && rect4Removed; }, 700);

            runs(function() {
                expect(rect1Removed).toBeTruthy();
                expect(rect3Removed).toBeTruthy();
                expect(rect4Removed).toBeTruthy();

                expect(m_removeRectSpy).toHaveBeenCalled();
                expect(m_selfRemoveSpy).toHaveBeenCalled();
                expect(m_doNothing2Spy).toHaveBeenCalled();

                expect(m_doNothing1Spy).not.toHaveBeenCalled();
                expect(m_doNothing3Spy).not.toHaveBeenCalled();
                expect(m_doNothing4Spy).not.toHaveBeenCalled();

                player.stop();
            });

        });

        it('should not call modifiers of the elements immediately after the fact they were disabled', function() {
            _fakeCallsForCanvasRelatedStuff();

            var player = createPlayer('foo', { mode: C.M_DYNAMIC });
            var rect1 = b().rect([10, 10], 70);
            var rect2 = b().rect([20, 20], 70);
            var rect3 = b().rect([30, 30], 70);
            var scene = b('scene').band([0, 10])
                                  .add(rect1)
                                  .add(rect2)
                                  .add(rect3);

            var rect1Disabled = false,
                rect3Disabled = false;

            var m_doNothing1Spy = jasmine.createSpy('do-noth-1');
            var m_doNothing2Spy = jasmine.createSpy('do-noth-2');
            var m_doNothing3Spy = jasmine.createSpy('do-noth-3');

            rect1.modify(m_doNothing1Spy);
            rect2.modify(m_doNothing2Spy);
            rect3.modify(m_doNothing3Spy);

            var m_disableRectSpy;

            runs(function() {

                m_disableRectSpy = jasmine.createSpy('disable-rect')
                                         .andCallFake(function(t) {
                                            if ((t > .5) && !rect1Disabled) {
                                                expect(m_doNothing1Spy).toHaveBeenCalled();
                                                rect1.disable();
                                                m_doNothing1Spy.reset();
                                                rect1Disabled = true;
                                            }
                                         });

                rect2.modify(m_disableRectSpy);

                player.load(scene).play();

                setTimeout(function() {
                    expect(m_doNothing3Spy).toHaveBeenCalled();
                    rect3.disable();
                    m_doNothing3Spy.reset();
                    rect3Disabled = true;
                }, 550);


            });

            waitsFor(function() { return rect1Disabled && rect3Disabled; }, 700);

            runs(function() {
                expect(rect1Disabled).toBeTruthy();
                expect(rect3Disabled).toBeTruthy();

                expect(m_disableRectSpy).toHaveBeenCalled();
                expect(m_doNothing2Spy).toHaveBeenCalled();

                expect(m_doNothing1Spy).not.toHaveBeenCalled();
                expect(m_doNothing3Spy).not.toHaveBeenCalled();

                player.stop();
            });

        });

        xit('should fire an error if element removed twice', function() {
        });

        xit('should remove safely a lot of elements', function() {
        });

        xit('should not break painiting of the element', function() {
        });

    });

    it('#34641813 should work as expected (__stopAnim should stop the player-related animation, not the global one)',
    function() {

        _fakeCallsForCanvasRelatedStuff();

        var player = createPlayer('foo');

        var started, stopSpy;

        runs(function() {
            stopSpy = spyOn(player, 'stop').andCallThrough();
            var scene = new anm.Scene();
            scene.add(new anm.Element());
            scene.duration = 1;
            player.load(scene).play();
        });

        waitsFor(function() {
            if (player.state.happens === C.STOPPED) {
                expect(stopSpy).toHaveBeenCalled();
                stopSpy.reset();
                return true;
            };
        }, 1100);

        runs(function() {
            started = Date.now();
        });

        waitsFor(function() { return ((Date.now() - started) > 1500); }, 2000);

        runs(function() {
            expect(stopSpy).not.toHaveBeenCalled();
        });

        // __stopAnim should stop the exact animation __nextFrame started, not the global animation id

    });

    xit('#34641967 should work as expected (controls should allow to jump while playing)', function() {

        // it is not possible to jump in time while playing
    });

    xdescribe("#34213789 should work as expected (controls should be rendered correcly in all use-cases)",
    function() {

        xit('foo', function() {});

        // things to test:

        // test if width and height are _not_ applied through canvas.width / canvas.height
        // — it erases the content of canvas — but through style and setAttribute
        // (it includes controls canvas)

        // info-block and controls correctly change their position after scrolling and
        // resizing, player continues playing scene if it was played (keeps state)

        // _checkMode is called once and when mode was defined (through options or directly,
        // before load)

        // ensure controls are not rendered at time < 0

        // controls are visible when playing stopped or paused

        // time font is correct

        // test the order of applying options / preparing canvas / scene / showing controls / info blocks to look logical

        // test changeRect to be called only if rect was changed

        // test getPosAndRedraw

        // is _saveCanvasPos required?

        // test controls are rendered/updated exactly once when required

        // ensure controls are not rendered when there's nothing loaded in player

    });

});