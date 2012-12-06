// TODO: errors, thrown in playing process (from modifiers), should be supressed (?), but passed to onerror handler
// TODO: errors, thrown in player creating process, should be shown in the console.
// TODO: errors should be thrown only once

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

    describe("throwing errors", function() {

        it("throws one when player was incorrectly initialized (player-related errors)", function() {
            player.state.muteErrors = false;

            try {
                player.play();
                this.fail('Should throw an error');
            } catch(e) { expect(e).toEqual(jasmine.any(anm.PlayerError));
                         expect(player.state.happens).toBe(anm.C.NOTHING); }

            try {
                player.load();
                this.fail('Should throw an error');
            } catch(e) { expect(e).toEqual(jasmine.any(anm.PlayerError));
                         expect(player.state.happens).toBe(anm.C.NOTHING); }

            try {
                player.load(new anm.Scene());
                player.drawAt(anm.Player.NO_TIME);
                this.fail('Should throw an error');
            } catch(e) { expect(e).toEqual(jasmine.any(anm.PlayerError));
                         expect(player.state.happens).toBe(anm.C.STOPPED); }
        });

        it("throws an error if modifier or painter code is incorrect (animation-related errors)", function() {
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
                then: function() { this.fail('Should not reach this block due to error'); }
            });

            this.fail("NI");
        });

        it("throws an error manually fired from modifier or painter (system errors)", function() {
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
                then: function() { this.fail('Should not reach this block due to error'); } // should not reach this code due to error
                // TODO: onerror: ensure if error was fired
            });

            this.fail("NI");
        });

        describe("any error is thrown only once", function() {

            // var elm = new anm.Element();

            // var childElm = new anm.Element();
            // elm.add(childElm);

            // var grandChildElm = new anm.Element();
            // childElm.add(grandChildElm);
            // grandChildElm.addModifier(function(t) {
            //     if (t > .5) {
            //         throw new Error('foo');
            //     }
            // });

            // var scene = new anm.Scene();
            // scene.duration = 1;

            // doAsync(player, scene, {
            //     do: 'play', until: anm.C.STOPPED, timeout: 1.2,
            //     then: function() { this.fail('Should not reach this block due to error'); } // should not reach here due to errors
            //     // TODO: onerror: check if it was fired only once
            // });

            it("works for player-related errors", function() {
                this.fail("NI");
            });

            it("works for animation-related errors", function() {
                this.fail("NI");
            });

            it("works for system errors", function() {
                this.fail("NI");
            });

        });

        it("different kinds of errors have different types", function() {

            // PlayerErr
            try {
                player.play();
                this.fail('Should throw an error');
            } catch(e) { console.log(e); expect(player.state.happens).toBe(anm.C.STOPPED); }

            // SysErr
            grandChildElm.addModifier(function(t) {
                if (t > .5) {
                    throw new Error('foo');
                }
            });

            // AnimErr
            elm.removeModifier(function(t) {});

            this.fail("NI");

        });

    });

    describe("handling errors", function() {

        describe("onerror handler", function() {

            describe("getting errors", function() {

                it("gets player-related errors", function() {
                    this.fail("NI");
                });

                it("gets animation-related errors", function() {
                    this.fail("NI");
                });

                it("gets system errors", function() {
                    this.fail("NI");
                });

            });

            describe("suppressing errors", function() {

                it("supresses player-related errors by default", function() {
                    this.fail("NI");
                });

                it("supresses animation-related errors by default", function() {
                    this.fail("NI");
                });

                it("do not supresses system errors by default", function() {
                    this.fail("NI");
                });

            });

            describe("forcing errors to raise (with returning true)", function() {

                it("works for player-related errors", function() {
                    this.fail("NI");
                });

                it("works for animation-related errors", function() {
                    this.fail("NI");
                });

                it("works for system errors", function() {
                    this.fail("NI");
                });

            });

        });

        describe("mute errors option", function() {

            describe("when enabled (by default)", function() {

                it("mutes player-related errors", function() {
                    this.fail("NI");
                });

                it("mutes animation-related errors", function() {
                    this.fail("NI");
                });

                it("do not mutes system errors", function() {
                    this.fail("NI");
                });

                describe("passes errors to onerror handler anyway", function() {

                    it("works for player-related errors", function() {
                        this.fail("NI");
                    });

                    it("works for animation-related errors", function() {
                        this.fail("NI");
                    });

                    it("works for system errors", function() {
                        this.fail("NI");
                    });

                });

            });

            describe("when disable", function() {

                it("do not mutes player-related errors", function() {
                    this.fail("NI");
                });

                it("do not mutes animation-related errors", function() {
                    this.fail("NI");
                });

                it("do not mutes system errors", function() {
                    this.fail("NI");
                });

                describe("passes errors to onerror handler anyway", function() {

                    it("works for player-related errors", function() {
                        this.fail("NI");
                    });

                    it("works for animation-related errors", function() {
                        this.fail("NI");
                    });

                    it("works for system errors", function() {
                        this.fail("NI");
                    });

                });

            });

        });

    });

});