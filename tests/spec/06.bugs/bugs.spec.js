/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("as for known bugs,", function() {

    var player;

    var b = Builder._$,
        C = anm.C;

    var FPS = 20, _fg;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        //this.addMatchers(_matchers);
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn().run(FPS);
    });

    afterEach(function() { _fg.stop().destroy(); });

    describe('#34591729 should work as expected:', function() {

        it('should not call modifiers of the elements immediately after the fact they were removed', function() {

            var duration = 10;

            var player = createPlayer('foo'/*, { mode: C.M_DYNAMIC }*/);
            var rect1 = b().rect([50, 50], 70);
            var rect2 = b().rect([100, 100], 70);
            var rect3 = b().rect([150, 150], 70);
            var rect4 = b().rect([40, 40], 70);
            var scene = b('scene').band([0, duration])
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

            var removeAt = 1 / 3;
            var selfRemoveAt = 1 / 4;

            expect(selfRemoveAt).toBeLessThan(removeAt);

            doAsync(player, {
                prepare: function() {
                    m_removeRectSpy = jasmine.createSpy('remove-rect')
                                             .andCallFake(function(t) {
                                                //console.log(this.$.xdata.lband[0], this.$.xdata.lband[1], t);
                                                if ((t > removeAt) && !rect1Removed) {
                                                    scene.remove(rect1);
                                                    //console.log('remove 1');
                                                    expect(m_doNothing1Spy).toHaveBeenCalled();
                                                    m_doNothing1Spy.reset();
                                                    rect1Removed = true;
                                                }
                                             });
                    m_selfRemoveSpy = jasmine.createSpy('self-remove')
                                             .andCallFake(function(t) {
                                                //console.log(this.$.xdata.lband[0], this.$.xdata.lband[1], t);
                                                if ((t > selfRemoveAt) && !rect4Removed) {
                                                    this.$.parent.remove(this.$);
                                                    //console.log('remove 4');
                                                    expect(m_doNothing4Spy).toHaveBeenCalled();
                                                    m_doNothing4Spy.reset();
                                                    rect4Removed = true;
                                                }
                                             });

                    rect2.modify(m_removeRectSpy);
                    rect4.modify(m_selfRemoveSpy);

                    return scene;
                },
                run: function() {
                    setTimeout(function() { // since play is sync (not async) with jasmine Clock mock,
                                            // we should set timeout before starting to play
                        expect(m_doNothing3Spy).toHaveBeenCalled();
                        scene.remove(rect3);
                        //console.log('remove 3');
                        m_doNothing3Spy.reset();
                        rect3Removed = true;
                    }, ((removeAt * duration) * 1000) + 50);

                    player.play();

                },
                waitFor: function() {
                    return rect1Removed && rect3Removed && rect4Removed;
                }, timeout: (removeAt * duration) + .2,
                then: function() {
                    expect(rect1Removed).toBeTruthy();
                    expect(rect3Removed).toBeTruthy();
                    expect(rect4Removed).toBeTruthy();

                    expect(m_removeRectSpy).toHaveBeenCalled();
                    expect(m_selfRemoveSpy).toHaveBeenCalled();
                    expect(m_doNothing2Spy).toHaveBeenCalled();

                    expect(m_doNothing1Spy).not.toHaveBeenCalled();
                    expect(m_doNothing3Spy).not.toHaveBeenCalled();
                    expect(m_doNothing4Spy).not.toHaveBeenCalled();
                }
            });

        });

        it('should not call modifiers of the elements immediately after the fact they were disabled', function() {

            var duration = 10;

            var player = createPlayer('foo'/*, { mode: C.M_DYNAMIC }*/); // TODO: varyAll with mode?
            var rect1 = b().rect([10, 10], 70);
            var rect2 = b().rect([20, 20], 70);
            var rect3 = b().rect([30, 30], 70);
            var scene = b('scene').band([0, duration])
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

            var disableAt = 1 / 4;

            doAsync(player, {
                prepare: function() {
                    m_disableRectSpy = jasmine.createSpy('disable-rect')
                                         .andCallFake(function(t) {
                                            if ((t > disableAt) && !rect1Disabled) {
                                                expect(m_doNothing1Spy).toHaveBeenCalled();
                                                rect1.disable();
                                                m_doNothing1Spy.reset();
                                                rect1Disabled = true;
                                            }
                                         });

                    rect2.modify(m_disableRectSpy);

                    return scene;
                },
                run: function() {
                    setTimeout(function() { // since play is sync (not async) with jasmine Clock mock,
                                            // we should set timeout before starting to play
                        expect(m_doNothing3Spy).toHaveBeenCalled();
                        rect3.disable();
                        m_doNothing3Spy.reset();
                        rect3Disabled = true;
                    }, ((disableAt * duration) * 1000) + 50);

                    player.play();
                },
                waitFor: function() {
                    return rect1Disabled && rect3Disabled;
                }, timeout: (disableAt * duration) + .2,
                then: function() {
                    expect(rect1Disabled).toBeTruthy();
                    expect(rect3Disabled).toBeTruthy();

                    expect(m_disableRectSpy).toHaveBeenCalled();
                    expect(m_doNothing2Spy).toHaveBeenCalled();

                    expect(m_doNothing1Spy).not.toHaveBeenCalled();
                    expect(m_doNothing3Spy).not.toHaveBeenCalled();
                }
            });

        });

        xit('should fire an error if element removed twice', function() {
            // TODO!
        });

        xit('should fire an error if element added twice', function() {
            // TODO!
        });

        xit('should remove safely a lot of elements', function() {
        });

        xit('should not break painiting of the element', function() {
        });

    });

    it('#34641813 should work as expected (__stopAnim should stop the player-related animation, not the global one)',
    function() {

        var player = createPlayer('foo');

        var started, stopSpy;

        doAsync(player, {
            prepare: function() {
                stopSpy = spyOn(player, 'stop').andCallThrough();
                var scene = new anm.Scene();
                scene.add(new anm.Element());
                scene.duration = 1;
                return scene;
            },
            do: 'play', until: C.STOPPED, timeout: 1.3,
            beforeEnd: function() {
                expect(stopSpy).toHaveBeenCalled();
                stopSpy.reset();
            },
            afterThat: function() {
                runs(function() {
                    started = Date.now();
                });

                waitsFor(function() {
                    jasmine.Clock.tick(50); // clocks mock is not ticking while not playing
                    return ((Date.now() - started) > 1500);
                }, 2000);

                runs(function() {
                    expect(stopSpy).not.toHaveBeenCalled();
                });
            }
        });

        // __stopAnim should stop the exact animation __nextFrame started, not the global animation id

    });

    xit('#34258001 should work as expected (intersects should not hang)', function() {
        expect(false).toBeTruthy();
    });

    it('#35304529 should work as expected (events happened while an element was disabled should not fire when it was re-enabled)', function() {

        var player = createPlayer('foo'/*, { mode: C.M_DYNAMIC }*/);

        var enabledB1AndWaitedABit = false;

        var b1, b2, b3;

        var b1ClickSpy, b2ClickSpy, b3ClickSpy;

        doAsync(player, {
            prepare: function() {
                var scene = b('scene').band([0, 1.5]);

                b1 = b('b1').on(C.X_MCLICK,
                b1ClickSpy = jasmine.createSpy('b1-click-spy'));

                b2 = b("b2").on(C.X_MCLICK,
                                b2ClickSpy = jasmine.createSpy('b2-click-spy')
                                                    .andCallFake(function(evt) {
                                                        b1.disable();
                                                    }));

                b3 = b("b3").on(C.X_MCLICK,
                                b3ClickSpy = jasmine.createSpy('b3-click-spy')
                                                    .andCallFake(function(evt) {
                                                        b1.enable();
                                                    }));

                scene.add(b1).add(b2).add(b3);

                return scene;
            },
            run: function() {
                setTimeout(function() {  // since play is sync (not async) with jasmine Clock mock,
                                         // we should set timeouts before starting to play
                    b2.v.fire(C.X_MCLICK, {});

                    setTimeout(function() {
                        expect(b2ClickSpy).toHaveBeenCalled();
                        b1.v.fire(C.X_MCLICK, {});

                            setTimeout(function() {
                                expect(b1ClickSpy).not.toHaveBeenCalled();
                                b3.v.fire(C.X_MCLICK, {});

                                setTimeout(function() {
                                    expect(b3ClickSpy).toHaveBeenCalled();
                                    enabledB1AndWaitedABit = true;
                                }, 150);
                            }, 200);
                    }, 200);
                }, 200);

                player.play();
            },
            waitFor: function() { return enabledB1AndWaitedABit; }, timeout: 1.1,
            then: function() { expect(b1ClickSpy).not.toHaveBeenCalled(); }
        });

    });

    // TODO: enable, if it is important
    xit('floating point rounding error and inconsistence', function() {
        var _duration = 1.5;

        var player = createPlayer('foo', { mode: C.M_DYNAMIC });

        var child_band = [ _duration / 8, (_duration / 8) * 5 ];
        var child_duration = child_band[1] - child_band[0];
        var trg_band = [ 0, child_duration ];
        var trg_duration = child_duration;

        var target = b('target').band(trg_band);
        var scene = b('scene');
        scene.add(b('child').add(b('grand-child').add(target)).band(child_band));

        var mod_band = [ 0, trg_duration / 5 ];
        // If you will change mod_band to target
        var mod_duration = mod_band[1] - mod_band[0];

        var spy = jasmine.createSpy('mod-spy').andCallFake(function() { /* ... */ });

        var timeToPlay = child_band[0] + trg_band[0] + mod_band[1];
        console.log('bebebe', mod_band, target.v.xdata.gband, timeToPlay);
        // modifier should be called, because it is the last moment of it's own band,
        // but it is not, since 0.3375 - 0.1875 === 0.15000000000000002, and not 0.15,
        // where 0.3375 is global time (timeToPlay), 0.1875 is the start point of the target's global band,
        // and 0.15 is the modifier's band end point.
        //
        // this example, of course is not, the single one, it may fail on recent variants of
        // floating points, due to this subtraction, you may try to replace numbers with different ones
        // and relatively recently you'll get the same bug, if they are fractions.
        //
        // it will be ok, however, if _duration will be 1, 1.1, 1.2...

        // NB: mod_band = [ 0, timeToPlay + mod_band[1] - timeToPlay ];
        //     and this trick will solve the problem, though

        doAsync(player, {
            prepare: function() { target.modify(mod_band, spy);
                                  console.log(__builderInfo(scene));
                                  return scene; },
            run: function() { player.play(timeToPlay, 1, 1 / FPS); },
            until: anm.C.STOPPED, timeout: _duration + .2,
            then: function() { expect(spy).toHaveBeenCalled();
                               target.unmodify(spy); }
        });
    });

    xit('#34641967 should work as expected (controls should allow to jump while playing)', function() {
        // it was not possible to jump in time while playing
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