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

    afterEach(function() { _FrameGen.disable(); });

    /* var scenes = { // TODO: include error test in each scene
        withInternalError: function() {
            var elm = new anm.Element();
            elm.addModifier(function(t, duration) {
                if (t > .5) {
                    some_undefined_var.foo = 'bar';
                }
            });

            var scene = new anm.Scene();
            scene.duration = 1;
            scene.add(elm);

            return scene;
        },
        withManualError: function() {
            var elm = new anm.Element();
            elm.addModifier(function(t) {
                if (t > .5) {
                    throw new Error('foo');
                }
            });

            var scene = new anm.Scene();
            scene.duration = 1;
            scene.add(elm);

            return scene;
        },
    } */

    it("muteErrors should be off by default", function() {
        expect(player.state.muteErrors).toBeFalsy();
    });

    describe("throwing errors and their types", function() {

        it("throws an error if modifier or painter code is incorrect (internal errors)", function() {
            player.state.muteErrors = false;

            var elm = new anm.Element();
            elm.addModifier(function(t, duration) {
                if (t > .5) {
                    some_undefined_var.foo = 'bar';
                }
            });

            var scene = new anm.Scene();
            scene.duration = 1;
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(Error));
                                             expect(err.message.indexOf('some_undefined_var')).not.toBe(-1);
                                             expect(player.state.happens).toBe(anm.C.NOTHING); }
                });
            })(this);
        });

        it("throws an error manually fired from modifier or painter (manually fired errors)", function() {
            player.state.muteErrors = false;

            var elm = new anm.Element();
            elm.addModifier(function(t) {
                if (t > .5) {
                    throw new Error('foo');
                }
            });

            var scene = new anm.Scene();
            scene.duration = 1;
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED, timeout: 1.2,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(Error));
                                             expect(err.message).toBe('foo');
                                             expect(player.state.happens).toBe(anm.C.NOTHING); }
                });
            })(this);
        });

        it("throws one when player was incorrectly initialized (player-related errors)", function() {
            player.state.muteErrors = false;

            try {
                player.play();
                this.fail('Should throw an error');
            } catch(err) { expect(err).toEqual(jasmine.any(anm.PlayerError));
                           expect(err.message).toBe(anm.Errors.P.NO_SCENE);
                           expect(player.state.happens).toBe(anm.C.NOTHING); }

            try {
                player.load();
                this.fail('Should throw an error');
            } catch(err) { expect(err).toEqual(jasmine.any(anm.PlayerError));
                           expect(err.message).toBe(anm.Errors.P.NO_SCENE_PASSED);
                           expect(player.state.happens).toBe(anm.C.NOTHING); }

            try {
                player.load(new anm.Scene());
                player.drawAt(anm.Player.NO_TIME);
                this.fail('Should throw an error');
            } catch(err) { expect(err).toEqual(jasmine.any(anm.PlayerError));
                           expect(err.message).toBe(anm.Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
                           expect(player.state.happens).toBe(anm.C.STOPPED); }
        });

        it("throws errors related to animations (animation errors)", function() {
            player.state.muteErrors = false;

            try {
                var elm = new anm.Element();
                elm.removeModifier(function(t) {});
                this.fail('Should throw an error');
            } catch(err) {
                expect(err).toEqual(jasmine.any(anm.AnimationError));
                expect(err.message).toBe(anm.Errors.A.MODIFIER_NOT_ATTACHED);
                expect(player.state.happens).toBe(anm.C.NOTHING);
            }

            var elm = new anm.Element();
            elm.addModifier(function(t, duration) {
                if (t > .5) {
                    elm.remove();
                }
            });

            var scene = new anm.Scene();
            scene.duration = 1;
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED, timeout: 1.2,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(anm.AnimationError));
                                             expect(err.message).toBe(anm.Errors.A.NO_ELEMENT_TO_REMOVE);
                                             expect(player.state.happens).toBe(anm.C.NOTHING); }
                });
            })(this);

        });

        it("throws a system error fired during the animation (system errors)", function() {
            player.state.muteErrors = false;

            var elm = new anm.Element();
            // since all system errors are hard-to-force, we throw one manually
            // directly from animation (this is not like we thrown some for manual errors test,
            // this is in purpose of emulation)
            elm.addModifier(function(t) {
                if (t > .2) {
                    throw new anm.SystemError('foo');
                }
            });

            var scene = new anm.Scene();
            scene.duration = 1;
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED, timeout: 1.2,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(anm.SystemError));
                                             expect(err.message).toBe('foo');
                                             expect(player.state.happens).toBe(anm.C.NOTHING); }
                });
            })(this);
        });

    });

    describe("handling errors", function() {

        describe("onerror handler", function() {

            describe("getting errors", function() {

                it("gets internal errors", function() {
                    player.state.muteErrors = false;

                    var elm = new anm.Element();
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            some_undefined_var.foo = 'bar';
                        }
                    });

                    var scene = new anm.Scene();
                    scene.duration = 1;
                    scene.add(elm);

                    var onerrorSpy = jasmine.createSpy('undefined-var-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(Error));
                        expect(err.message.indexOf('some_undefined_var')).not.toBe(-1);
                        expect(player.state.happens).toBe(anm.C.NOTHING);
                    });

                    player.onerror(onerrorSpy);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.STOPPED,
                            then: function() { spec.fail('Should not reach this block due to error'); },
                            onerror: function(err) { expect(onerrorSpy).toHaveBeenCalledOnce();
                                                     onerrorSpy.reset(); }
                        });
                    })(this);
                });

                it("gets manually-fired errors", function() {
                    player.state.muteErrors = false;

                    var elm = new anm.Element();
                    elm.addModifier(function(t) {
                        if (t > .5) {
                            throw new Error('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.duration = 1;
                    scene.add(elm);

                    var onerrorSpy = jasmine.createSpy('foo-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(Error));
                        expect(err.message).toBe('foo');
                        expect(player.state.happens).toBe(anm.C.NOTHING);
                    });

                    player.onerror(onerrorSpy);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.STOPPED, timeout: 1.2,
                            then: function() { spec.fail('Should not reach this block due to error'); },
                            onerror: function(err) { expect(onerrorSpy).toHaveBeenCalledOnce();
                                                     onerrorSpy.reset(); }
                        });
                    })(this);
                });

                it("gets player-related errors", function() {
                    player.state.muteErrors = false;

                    var playNoSceneOnerrorSpy = jasmine.createSpy('play-no-scene')
                                                       .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.PlayerError));
                        expect(err.message).toBe(anm.Errors.P.NO_SCENE);
                        expect(player.state.happens).toBe(anm.C.NOTHING);
                    });

                    player.onerror(playNoSceneOnerrorSpy);

                    try {
                        player.play();
                        this.fail('Should throw an error');
                    } catch(err) { expect(playNoSceneOnerrorSpy).toHaveBeenCalledOnce();
                                   playNoSceneOnerrorSpy.reset();  }

                    var loadNoSceneOnerrorSpy = jasmine.createSpy('load-no-scene')
                                                       .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.PlayerError));
                        expect(err.message).toBe(anm.Errors.P.NO_SCENE_PASSED);
                        expect(player.state.happens).toBe(anm.C.NOTHING);
                    });

                    player.onerror(loadNoSceneOnerrorSpy);

                    try {
                        player.load();
                        this.fail('Should throw an error');
                    } catch(err) { expect(loadNoSceneOnerrorSpy).toHaveBeenCalledOnce();
                                   loadNoSceneOnerrorSpy.reset();  }

                    var drawAtNoTimeOnerrorSpy = jasmine.createSpy('draw-at-no-time')
                                                        .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.PlayerError));
                        expect(err.message).toBe(anm.Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
                        expect(player.state.happens).toBe(anm.C.STOPPED);
                    });

                    player.onerror(drawAtNoTimeOnerrorSpy);

                    try {
                        player.load(new anm.Scene());
                        player.drawAt(anm.Player.NO_TIME);
                        this.fail('Should throw an error');
                    } catch(err) { expect(drawAtNoTimeOnerrorSpy).toHaveBeenCalledOnce();
                                   drawAtNoTimeOnerrorSpy.reset(); }

                    expect(playNoSceneOnerrorSpy).not.toHaveBeenCalled();
                    expect(loadNoSceneOnerrorSpy).not.toHaveBeenCalled();
                    expect(drawAtNoTimeOnerrorSpy).not.toHaveBeenCalled();
                });

                it("gets animation-related errors", function() {
                    player.state.muteErrors = false;

                    var removeModifierOnerrorSpy = jasmine.createSpy('remove-modifier')
                                                          .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.AnimationError));
                        expect(err.message).toBe(anm.Errors.A.MODIFIER_NOT_ATTACHED);
                        expect(player.state.happens).toBe(anm.C.NOTHING);
                    });

                    player.onerror(removeModifierOnerrorSpy);

                    try {
                        var elm = new anm.Element();
                        elm.removeModifier(function(t) {});
                        this.fail('Should throw an error');
                    } catch(err) {
                        expect(removeModifierOnerrorSpy).toHaveBeenCalledOnce();
                        removeModifierOnerrorSpy.reset();
                    }

                    var removeNothingOnerrorSpy = jasmine.createSpy('remove-nothing')
                                                         .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.AnimationError));
                        expect(err.message).toBe(anm.Errors.A.NO_ELEMENT_TO_REMOVE);
                        expect(player.state.happens).toBe(anm.C.NOTHING);
                    });

                    player.onerror(removeNothingOnerrorSpy);

                    var elm = new anm.Element();
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            elm.remove();
                        }
                    });

                    var scene = new anm.Scene();
                    scene.duration = 1;
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.STOPPED, timeout: 1.2,
                            then: function() { spec.fail('Should not reach this block due to error'); },
                            onerror: function(err) { expect(removeNothingOnerrorSpy).toHaveBeenCalledOnce();
                                                     removeNothingOnerrorSpy.reset(); }
                        });
                    })(this);
                });

                it("gets system errors", function() {
                    player.state.muteErrors = false;

                    var onerrorSpy = jasmine.createSpy('foo-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.SystemError));
                        expect(err.message).toBe('foo');
                        expect(player.state.happens).toBe(anm.C.NOTHING);
                    });

                    player.onerror(onerrorSpy);

                    var elm = new anm.Element();
                    // since all system errors are hard-to-force, we throw one manually
                    // directly from animation (this is not like we thrown some for manual errors test,
                    // this is in purpose of emulation)
                    elm.addModifier(function(t) {
                        if (t > .2) {
                            throw new anm.SystemError('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.duration = 1;
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.STOPPED, timeout: 1.2,
                            then: function() { spec.fail('Should not reach this block due to error'); },
                            onerror: function(err) { expect(onerrorSpy).toHaveBeenCalledOnce();
                                                     onerrorSpy.reset(); }
                        });
                    })(this);
                });

            });

            describe("suppressing errors", function() {

                it("suppresses internal errors", function() {
                    this.fail("NI");
                });

                it("suppresses manually-fired errors", function() {
                    this.fail("NI");
                });

                it("supresses player-related errors by default", function() {
                    this.fail("NI");
                });

                it("supresses animation-related errors by default", function() {
                    this.fail("NI");
                });

                it("supresses even system errors by default", function() {
                    this.fail("NI");
                });

            });

            describe("forcing errors to raise (with returning true)", function() {

                it("works for internal errors", function() {
                    this.fail("NI");
                });

                it("works for manually-fired errors", function() {
                    this.fail("NI");
                });

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

                it("mutes internal errors", function() {
                    this.fail("NI");
                });

                it("mutes manually-fired errors", function() {
                    this.fail("NI");
                });

                it("mutes player-related errors", function() {
                    this.fail("NI");
                });

                it("mutes animation-related errors", function() {
                    this.fail("NI");
                });

                it("mutes system errors", function() {
                    this.fail("NI");
                });

                describe("passes errors to onerror handler anyway", function() {

                    it("works for internal errors", function() {
                        this.fail("NI");
                    });

                    it("works for manually-fired errors", function() {
                        this.fail("NI");
                    });

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

            describe("when disabled", function() {

                it("do not mutes internal errors", function() {
                    this.fail("NI");
                });

                it("do not mutes manually-fired errors", function() {
                    this.fail("NI");
                });

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

                    it("works for internal errors", function() {
                        this.fail("NI");
                    });

                    it("works for manually-fired errors", function() {
                        this.fail("NI");
                    });

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

// TODO: show errors over the player or alert them, if not muted?