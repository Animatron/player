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