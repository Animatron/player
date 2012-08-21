/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("as for known bugs,", function() {

    var player;

    it("should be stubby", function() {
        expect(true).toBeTruthy();
    });

    var b = Builder._$,
        C = anm.C;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        this.addMatchers(_matchers);
    })

    it('#34591729 should work as expected (disable modifiers among with removing/disabling elements)', function() {
        _fakeCallsForCanvasRelatedStuff();

        jasmine.Clock.useMock();

        var player = createPlayer('foo');
        var rect1 = b().rect([50, 50], 70);
        var rect2 = b().rect([100, 100], 70);
        var rect3 = b().rect([150, 150], 70);
        var scene = b('scene').band([0, 10])
                              .add(rect1)
                              .add(rect2)
                              .add(rect3);

        var rectRemoved = false;

        var m_doNothing1Spy = jasmine.createSpy('do-noth-1');
        var m_doNothing2Spy = jasmine.createSpy('do-noth-2');
        var m_doNothing3Spy = jasmine.createSpy('do-noth-3');
        var m_removeRectSpy = jasmine.createSpy('remove-rect')
                                     .andCallFake(function(t) {
                                        if ((t > 1) && !rectRemoved) {
                                            scene.remove(rect1);
                                            rectRemoved = true;
                                        }
                                     })

        rect1.modify(m_doNothing1Spy);
        rect2.modify(m_doNothing2Spy);
        rect2.modify(m_removeRectSpy);
        rect3.modify(m_doNothing3Spy);

        player.load(scene).play();

        setTimeout(function() {
            scene.remove(rect3);
        }, 1000);

        jasmine.Clock.tick(250);

        expect(m_doNothing1Spy).toHaveBeenCalled();
        expect(m_doNothing2Spy).toHaveBeenCalled();
        expect(m_doNothing3Spy).toHaveBeenCalled();
        expect(m_removeRectSpy).toHaveBeenCalled();

        jasmine.Clock.tick(250);

        expect(m_doNothing1Spy).toHaveBeenCalled();
        expect(m_doNothing2Spy).toHaveBeenCalled();
        expect(m_doNothing3Spy).toHaveBeenCalled();
        expect(m_removeRectSpy).toHaveBeenCalled();

        jasmine.Clock.tick(510); // 1010 in sum

        m_doNothing1Spy.reset();
        m_doNothing2Spy.reset();
        m_doNothing3Spy.reset();
        m_removeRectSpy.reset();

        jasmine.Clock.tick(500);

        expect(m_removeRectSpy).toHaveBeenCalled();
        expect(m_doNothing1Spy).not.toHaveBeenCalled();
        expect(m_doNothing2Spy).toHaveBeenCalled();
        expect(m_doNothing3Spy).not.toHaveBeenCalled();

    });

    xit('#34641813 should work as expected (__stopAnim should stop the player-related animation, not the global one)',
    function() {

        // things to test:

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