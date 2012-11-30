// TODO: errors, thrown in playing process (from modifiers), should be supressed (?), but passed to onerror handler
// TODO: errors, thrown in player creating process, should be shown in the console.
// TODO: errors should be thrown only once

// TODO: test muteErrors

describe("errors", function() {

    var player;

    var FPS = 15;

    beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fake(_Fake.CVS_POS);

        _FrameGen.enable(FPS);

        player = createPlayer('test-id');
    });

    afterEach(function() { _FrameGen.disable() });

    it("throws one when player was incorrectly initialized", function() {
        try {
            player.play();
            this.fail();
        } catch(e) { console.log(e); expect(player.state.happens).toBe(anm.C.STOPPED); }
    });

    it("throws an error if modifier or painter code is incorrect", function() {
        var elm = new anm.Element();
        elm.addModifier(function(t) {
            if (t > .5) {
                some_undefined_var.foo = 'bar';
            }
        });

        var scene = new anm.Scene();
        scene.duration = 1;

        doAsync(player, scene, {
            do: 'play', until: anm.C.STOPPED, timeout: 1.2,
            then: function() { this.fail(); /* should not reach this code due to error */ }
        });
    });

    it("throws an error manually fired from modifier or painter", function() {
        var elm = new anm.Element();
        elm.addModifier(function(t) {
            if (t > .5) {
                throw new Error('foo');
            }
        });

        var scene = new anm.Scene();
        scene.duration = 1;

        doAsync(player, scene, {
            do: 'play', until: anm.C.STOPPED, timeout: 1.2,
            then: function() { this.fail(); /* should not reach this code due to error */ }
            // TODO: onerror: ensure if error was fired
        });
    });

    it("throws any error only once", function() {
        var elm = new anm.Element();

        var childElm = new anm.Element();
        elm.add(childElm);

        var grandChildElm = new anm.Element();
        childElm.add(grandChildElm);
        grandChildElm.addModifier(function(t) {
            if (t > .5) {
                throw new Error('foo');
            }
        });

        var scene = new anm.Scene();
        scene.duration = 1;

        doAsync(player, scene, {
            do: 'play', until: anm.C.STOPPED, timeout: 1.2,
            then: function() { this.fail(); /* should not reach this code due to error */ }
            // TODO: onerror: check if it was fired only once
        });

    });

    xit("initialization-related error and playing-related error have different types", function() {


    });

    // TODO: test both for PlayerError and AnimationError
    // TODO: options.muteErrors
    // TODO: do not mute SysErrors

    describe("onerror handler", function() {

        it("supresses initialization-related errors if onerror handler is specified", function() {

        });

        it("supresses playing-related errors if onerror handler is specified", function() {

        });

        it("passes all types of errors to onerror handler", function() {

        });

    });



});