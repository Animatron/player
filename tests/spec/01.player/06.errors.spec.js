/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

// TODO: errors, thrown in playing process (from modifiers), should be supressed (?), but passed to onerror handler
// TODO: errors, thrown in player creating process, should be shown in the console.
// TODO: errors should be thrown only once
// TODO: special error state for player?

describe("errors", function() {

    var player;

    var FPS = 15, _fg;

    beforeEach(function() {
        this.addMatchers(_matchers.calls);

        _mocks.adaptDocument(document);
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn({ synchronous: true }).run(FPS);

        player = createPlayer('test-id');
    });

    afterEach(function() { _fg.stop().destroy(); });

    /* var scenes = { // TODO: include error test in each scene
        withInternalError: function() {
            var elm = new anm.Element();
            elm.addModifier(function(t, duration) {
                if (t > .5) {
                    some_undefined_var.foo = 'bar';
                }
            });

            var scene = new anm.Scene();
            scene.add(elm);
            scene.duration = 1;

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
            scene.add(elm);
            scene.duration = 1;

            return scene;
        },
    } */

    it("muteErrors should be off by default", function() {
        // FIXME: there should be off / system / all modes, system should be the default one
        expect(player.state.muteErrors).toBeFalsy();
    });

    describe("throwing errors and their types", function() {

        it("throws an error if modifier or painter code is incorrect (internal errors)", function() {
            player.state.muteErrors = false;

            var elm = new anm.Element();
            elm.setBand([0, 1]);
            elm.addModifier(function(t, duration) {
                if (t > .5) {
                    some_undefined_var.foo = 'bar';
                }
            });

            var scene = new anm.Scene();
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(Error));
                                             expect(err.message.indexOf('some_undefined_var')).not.toBe(-1);
                                             expect(player.state.happens).toBe(anm.C.ERROR); }
                });
            })(this);
        });

        it("throws an error manually fired from modifier or painter (manually fired errors)", function() {
            player.state.muteErrors = false;

            var elm = new anm.Element();
            elm.setBand([0, 1]);
            elm.addModifier(function(t) {
                if (t > .5) {
                    throw new Error('foo');
                }
            });

            var scene = new anm.Scene();
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(Error));
                                             expect(err.message).toBe('foo');
                                             expect(player.state.happens).toBe(anm.C.ERROR); }
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
                           expect(player.state.happens).toBe(anm.C.ERROR); }

            try {
                player.load();
                this.fail('Should throw an error');
            } catch(err) { expect(err).toEqual(jasmine.any(anm.PlayerError));
                           expect(err.message).toBe(anm.Errors.P.NO_SCENE_PASSED);
                           expect(player.state.happens).toBe(anm.C.ERROR); }

            try {
                player.load(new anm.Scene());
                player.drawAt(anm.Player.NO_TIME);
                this.fail('Should throw an error');
            } catch(err) { expect(err).toEqual(jasmine.any(anm.PlayerError));
                           expect(err.message).toBe(anm.Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
                           expect(player.state.happens).toBe(anm.C.ERROR); }
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
            elm.setBand([0, 1]);
            elm.addModifier(function(t, duration) {
                if (t > .5) {
                    elm.remove();
                }
            });

            var scene = new anm.Scene();
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(anm.AnimationError));
                                             expect(err.message).toBe(anm.Errors.A.NO_ELEMENT_TO_REMOVE);
                                             expect(player.state.happens).toBe(anm.C.ERROR); }
                });
            })(this);

        });

        it("throws a system error fired during the animation (system errors)", function() {
            player.state.muteErrors = false;

            var elm = new anm.Element();
            elm.setBand([0, 1]);
            // since all system errors are hard-to-force, we throw one manually
            // directly from animation (this is not like we thrown some for manual errors test,
            // this is in purpose of emulation)
            elm.addModifier(function(t) {
                if (t > .2) {
                    throw new anm.SystemError('foo');
                }
            });

            var scene = new anm.Scene();
            scene.add(elm);

            (function(spec) {
                doAsync(player, scene, {
                    do: 'play', until: anm.C.STOPPED,
                    then: function() { spec.fail('Should not reach this block due to error'); },
                    onerror: function(err) { expect(err).toEqual(jasmine.any(anm.SystemError));
                                             expect(err.message).toBe('foo');
                                             expect(player.state.happens).toBe(anm.C.ERROR); }
                });
            })(this);
        });

    });

    describe("handling errors", function() {

        describe("onerror handler", function() {

            describe("gets an error and raises it anyaway", function() {

                it("gets internal errors", function() {
                    player.state.muteErrors = false;

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            some_undefined_var.foo = 'bar';
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    var onerrorSpy = jasmine.createSpy('undefined-var-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(Error));
                        expect(err.message.indexOf('some_undefined_var')).not.toBe(-1);
                        expect(player.state.happens).toBe(anm.C.ERROR);
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
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t) {
                        if (t > .5) {
                            throw new Error('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    var onerrorSpy = jasmine.createSpy('foo-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(Error));
                        expect(err.message).toBe('foo');
                        expect(player.state.happens).toBe(anm.C.ERROR);
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

                it("gets player-related errors", function() {
                    player.state.muteErrors = false;

                    var playNoSceneOnerrorSpy = jasmine.createSpy('play-no-scene')
                                                       .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.PlayerError));
                        expect(err.message).toBe(anm.Errors.P.NO_SCENE);
                        expect(player.state.happens).toBe(anm.C.ERROR);
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
                        expect(player.state.happens).toBe(anm.C.ERROR);
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
                        expect(player.state.happens).toBe(anm.C.ERROR);
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

                    var removeNothingOnerrorSpy = jasmine.createSpy('remove-nothing')
                                                         .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.AnimationError));
                        expect(err.message).toBe(anm.Errors.A.NO_ELEMENT_TO_REMOVE);
                        expect(player.state.happens).toBe(anm.C.ERROR);
                    });

                    player.onerror(removeNothingOnerrorSpy);

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            elm.remove();
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.STOPPED,
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
                        expect(player.state.happens).toBe(anm.C.ERROR);
                    });

                    player.onerror(onerrorSpy);

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    // since all system errors are hard-to-force, we throw one manually
                    // directly from animation (this is not like we thrown some for manual errors test,
                    // this is in purpose of emulation)
                    elm.addModifier(function(t) {
                        if (t > .2) {
                            throw new anm.SystemError('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.STOPPED,
                            then: function() { spec.fail('Should not reach this block due to error'); },
                            onerror: function(err) { expect(onerrorSpy).toHaveBeenCalledOnce();
                                                     onerrorSpy.reset(); }
                        });
                    })(this);
                });

            });

            describe("suppressing errors (with returning true)", function() {

                it("suppresses internal errors", function() {
                    player.state.muteErrors = false;

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            some_undefined_var.foo = 'bar';
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    var onerrorSpy = jasmine.createSpy('undefined-var-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(Error));
                        expect(err.message.indexOf('some_undefined_var')).not.toBe(-1);
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(onerrorSpy);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { expect(onerrorSpy).toHaveBeenCalledOnce();
                                               onerrorSpy.reset(); },
                            onerror: function(err) { spec.fail('Error should be supressed'); }
                        });
                    })(this);
                });

                it("suppresses manually-fired errors", function() {
                    player.state.muteErrors = false;

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t) {
                        if (t > .5) {
                            throw new Error('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    var onerrorSpy = jasmine.createSpy('foo-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(Error));
                        expect(err.message).toBe('foo');
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(onerrorSpy);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { expect(onerrorSpy).toHaveBeenCalledOnce();
                                               onerrorSpy.reset(); },
                            onerror: function(err) { spec.fail('Error should be supressed'); }
                        });
                    })(this);
                });

                it("supresses player-related errors by default", function() {
                    player.state.muteErrors = false;

                    var playNoSceneOnerrorSpy = jasmine.createSpy('play-no-scene')
                                                       .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.PlayerError));
                        expect(err.message).toBe(anm.Errors.P.NO_SCENE);
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(playNoSceneOnerrorSpy);

                    try {
                        player.play();
                    } catch(err) { this.fail('Should supress the error'); }
                    expect(playNoSceneOnerrorSpy).toHaveBeenCalled();
                    playNoSceneOnerrorSpy.reset();

                    var loadNoSceneOnerrorSpy = jasmine.createSpy('load-no-scene')
                                                       .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.PlayerError));
                        expect(err.message).toBe(anm.Errors.P.NO_SCENE_PASSED);
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(loadNoSceneOnerrorSpy);

                    try {
                        player.load();
                    } catch(err) { this.fail('Should supress the error'); }
                    expect(loadNoSceneOnerrorSpy).toHaveBeenCalledOnce();
                    loadNoSceneOnerrorSpy.reset();

                    var drawAtNoTimeOnerrorSpy = jasmine.createSpy('draw-at-no-time')
                                                        .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.PlayerError));
                        expect(err.message).toBe(anm.Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(drawAtNoTimeOnerrorSpy);

                    try {
                        player.load(new anm.Scene());
                        player.drawAt(anm.Player.NO_TIME);
                    } catch(err) { this.fail('Should supress the error'); }
                    expect(drawAtNoTimeOnerrorSpy).toHaveBeenCalledOnce();
                    drawAtNoTimeOnerrorSpy.reset();

                    expect(playNoSceneOnerrorSpy).not.toHaveBeenCalled();
                    expect(loadNoSceneOnerrorSpy).not.toHaveBeenCalled();
                    expect(drawAtNoTimeOnerrorSpy).not.toHaveBeenCalled();
                });

                it("supresses animation-related errors by default", function() {
                    player.state.muteErrors = false;

                    var removeNothingOnerrorSpy = jasmine.createSpy('remove-nothing')
                                                         .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.AnimationError));
                        expect(err.message).toBe(anm.Errors.A.NO_ELEMENT_TO_REMOVE);
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(removeNothingOnerrorSpy);

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            elm.remove();
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { expect(removeNothingOnerrorSpy).toHaveBeenCalledOnce();
                                               removeNothingOnerrorSpy.reset(); },
                            onerror: function(err) { spec.fail('Error should be supressed'); }
                        });
                    })(this);
                });

                it("supresses even system errors by default", function() {
                    player.state.muteErrors = false;

                    var onerrorSpy = jasmine.createSpy('foo-handler')
                                            .andCallFake(function(err) {
                        expect(err).toEqual(jasmine.any(anm.SystemError));
                        expect(err.message).toBe('foo');
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(onerrorSpy);

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    // since all system errors are hard-to-force, we throw one manually
                    // directly from animation (this is not like we thrown some for manual errors test,
                    // this is in purpose of emulation)
                    elm.addModifier(function(t) {
                        // if we will use .2, then a callback to fire after load()
                        // will sequentially call stop(), and than drawAt() to draw
                        // a still frame after loading, "foo" will be fired since
                        // it matches 1/3 of the scene for the preview, and then
                        // (since error is supressed) play() will be called when
                        // there is no scene at all
                        if (t > .5) {
                            throw new anm.SystemError('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { expect(onerrorSpy).toHaveBeenCalledOnce();
                                               onerrorSpy.reset(); },
                            onerror: function(err) { spec.fail('Error should be supressed'); }
                        });
                    })(this);
                });

                it("errors come in order", function() {
                    player.state.muteErrors = false;

                    var spec = this;

                    var receivedPlayerError = false,
                        receivedAnimationError = false;

                    var onerrorSpy = jasmine.createSpy('onerror-handler')
                                            .andCallFake(function(err) {
                        if (!receivedPlayerError && !receivedAnimationError) {
                            expect(err).toEqual(jasmine.any(anm.PlayerError));
                            expect(err.message).toBe(anm.Errors.P.NO_SCENE);
                            receivedPlayerError = true;
                        } else if (receivedPlayerError && !receivedAnimationError) {
                            expect(err).toEqual(jasmine.any(anm.AnimationError));
                            expect(err.message).toBe('foo');
                            receivedAnimationError = true;
                        } else {
                            spec.fail('Player-error should be received before Animation-error');
                        }
                        expect(player.state.happens).toBe(anm.C.ERROR);
                        return true;
                    });

                    player.onerror(onerrorSpy);

                    player.play();

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t) {
                        if (t > .4) {
                            throw new anm.AnimationError('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    doAsync(player, scene, {
                        do: 'play', until: anm.C.ERROR,
                        then: function() { expect(receivedPlayerError).toBeTruthy();
                                           expect(receivedAnimationError).toBeTruthy();
                                           expect(onerrorSpy.callCount).toBe(2);
                                           onerrorSpy.reset(); },
                        onerror: function(err) { spec.fail('Any error should be supressed'); } });
                });

            });

        });

        describe("mute errors option", function() {

            describe("when enabled", function() {

                it("mutes internal errors", function() {
                    player.state.muteErrors = true;

                    var wasInErronousCode = false;

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            wasInErronousCode = true;
                            some_undefined_var.foo = 'bar';
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { expect(wasInErronousCode).toBeTruthy(); },
                            onerror: function(err) { spec.fail('Error should be muted'); }
                        });
                    })(this);
                });

                it("mutes manually-fired errors", function() {
                    player.state.muteErrors = true;

                    var wasInErronousCode = false;

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t) {
                        if (t > .5) {
                            wasInErronousCode = true;
                            throw new Error('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { expect(wasInErronousCode).toBeTruthy(); },
                            onerror: function(err) { spec.fail('Error should be muted'); }
                        });
                    })(this);
                });

                it("mutes player-related errors", function() {
                    player.state.muteErrors = true;

                    try {
                        player.play();
                    } catch(err) { this.fail('Should mute the error');  }

                    try {
                        player.load();
                    } catch(err) { this.fail('Should mute the error');  }

                    try {
                        player.load(new anm.Scene());
                        player.drawAt(anm.Player.NO_TIME);
                    } catch(err) { this.fail('Should mute the error'); }
                });

                it("mutes animation-related errors", function() {
                    player.state.muteErrors = true;

                    var wasInErronousCode = false;

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    elm.addModifier(function(t, duration) {
                        if (t > .5) {
                            wasInErronousCode = true;
                            elm.remove();
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { expect(wasInErronousCode).toBeTruthy(); },
                            onerror: function(err) { spec.fail('Error should be muted'); }
                        });
                    })(this);
                });

                it("*not* mutes system errors", function() {
                    player.state.muteErrors = true;

                    var wasInErronousCode = false;

                    var elm = new anm.Element();
                    elm.setBand([0, 1]);
                    // since all system errors are hard-to-force, we throw one manually
                    // directly from animation (this is not like we thrown some for manual errors test,
                    // this is in purpose of emulation)
                    elm.addModifier(function(t) {
                        // if we will use .2, then a callback to fire after load()
                        // will sequentially call stop(), and than drawAt() to draw
                        // a still frame after loading, "foo" will be fired since
                        // it matches 1/3 of the scene for the preview, and then
                        // (since error is supressed) play() will be called when
                        // there is no scene at all
                        if (t > .5) {
                            wasInErronousCode = true;
                            throw new anm.SystemError('foo');
                        }
                    });

                    var scene = new anm.Scene();
                    scene.add(elm);

                    (function(spec) {
                        doAsync(player, scene, {
                            do: 'play', until: anm.C.ERROR,
                            then: function() { spec.fail('Error should not be muted');  },
                            onerror: function(err) { expect(wasInErronousCode).toBeTruthy();
                                                     expect(err).toEqual(jasmine.any(anm.SystemError));
                                                     expect(err.message).toBe('foo');
                                                     expect(player.state.happens).toBe(anm.C.ERROR); }
                        });
                    })(this);
                });

                describe("passes errors to onerror handler anyway", function() {

                    it("works for internal errors", function() {
                        player.state.muteErrors = true;

                        var elm = new anm.Element();
                        elm.setBand([0, 1]);
                        elm.addModifier(function(t, duration) {
                            if (t > .5) {
                                some_undefined_var.foo = 'bar';
                            }
                        });

                        var scene = new anm.Scene();
                        scene.add(elm);

                        var onerrorSpy = jasmine.createSpy('undefined-var-handler')
                                                .andCallFake(function(err) {
                            expect(err).toEqual(jasmine.any(Error));
                            expect(err.message.indexOf('some_undefined_var')).not.toBe(-1);
                            expect(player.state.happens).toBe(anm.C.ERROR);
                        });

                        player.onerror(onerrorSpy);

                        (function(spec) {
                            doAsync(player, scene, {
                                do: 'play', until: anm.C.ERROR,
                                then: function() { expect(onerrorSpy).toHaveBeenCalledOnce();
                                                   onerrorSpy.reset(); },
                                onerror: function(err) { spec.fail('Error should be muted'); }
                            });
                        })(this);
                    });

                    it("works for manually-fired errors", function() {
                        player.state.muteErrors = true;

                        var elm = new anm.Element();
                        elm.setBand([0, 1]);
                        elm.addModifier(function(t) {
                            if (t > .5) {
                                throw new Error('foo');
                            }
                        });

                        var scene = new anm.Scene();
                        scene.add(elm);

                        var onerrorSpy = jasmine.createSpy('foo-handler')
                                                .andCallFake(function(err) {
                            expect(err).toEqual(jasmine.any(Error));
                            expect(err.message).toBe('foo');
                            expect(player.state.happens).toBe(anm.C.ERROR);
                        });

                        player.onerror(onerrorSpy);

                        (function(spec) {
                            doAsync(player, scene, {
                                do: 'play', until: anm.C.ERROR,
                                then: function() { expect(onerrorSpy).toHaveBeenCalledOnce();
                                                   onerrorSpy.reset(); },
                                onerror: function(err) { spec.fail('Error should be muted'); }
                            });
                        })(this);
                    });

                    it("works for player-related errors", function() {
                        player.state.muteErrors = true;

                        var playNoSceneOnerrorSpy = jasmine.createSpy('play-no-scene')
                                                           .andCallFake(function(err) {
                            expect(err).toEqual(jasmine.any(anm.PlayerError));
                            expect(err.message).toBe(anm.Errors.P.NO_SCENE);
                            expect(player.state.happens).toBe(anm.C.ERROR);
                        });

                        player.onerror(playNoSceneOnerrorSpy);

                        try {
                            player.play();
                            expect(playNoSceneOnerrorSpy).toHaveBeenCalledOnce();
                            playNoSceneOnerrorSpy.reset();
                        } catch(err) { this.fail('Should mute the error');  }

                        var loadNoSceneOnerrorSpy = jasmine.createSpy('load-no-scene')
                                                           .andCallFake(function(err) {
                            expect(err).toEqual(jasmine.any(anm.PlayerError));
                            expect(err.message).toBe(anm.Errors.P.NO_SCENE_PASSED);
                            expect(player.state.happens).toBe(anm.C.ERROR);
                        });

                        player.onerror(loadNoSceneOnerrorSpy);

                        try {
                            player.load();
                            expect(loadNoSceneOnerrorSpy).toHaveBeenCalledOnce();
                            loadNoSceneOnerrorSpy.reset();
                        } catch(err) { this.fail('Should mute the error'); }

                        var drawAtNoTimeOnerrorSpy = jasmine.createSpy('draw-at-no-time')
                                                            .andCallFake(function(err) {
                            expect(err).toEqual(jasmine.any(anm.PlayerError));
                            expect(err.message).toBe(anm.Errors.P.PASSED_TIME_VALUE_IS_NO_TIME);
                            expect(player.state.happens).toBe(anm.C.ERROR);
                        });

                        player.onerror(drawAtNoTimeOnerrorSpy);

                        try {
                            player.load(new anm.Scene());
                            player.drawAt(anm.Player.NO_TIME);
                            expect(drawAtNoTimeOnerrorSpy).toHaveBeenCalledOnce();
                            drawAtNoTimeOnerrorSpy.reset();
                        } catch(err) { this.fail('Should mute the error'); }

                        expect(playNoSceneOnerrorSpy).not.toHaveBeenCalled();
                        expect(loadNoSceneOnerrorSpy).not.toHaveBeenCalled();
                        expect(drawAtNoTimeOnerrorSpy).not.toHaveBeenCalled();
                    });

                    it("works for animation-related errors", function() {
                        player.state.muteErrors = true;

                        var removeNothingOnerrorSpy = jasmine.createSpy('remove-nothing')
                                                             .andCallFake(function(err) {
                            expect(err).toEqual(jasmine.any(anm.AnimationError));
                            expect(err.message).toBe(anm.Errors.A.NO_ELEMENT_TO_REMOVE);
                            expect(player.state.happens).toBe(anm.C.ERROR);
                        });

                        player.onerror(removeNothingOnerrorSpy);

                        var elm = new anm.Element();
                        elm.setBand([0, 1]);
                        elm.addModifier(function(t, duration) {
                            if (t > .5) {
                                elm.remove();
                            }
                        });

                        var scene = new anm.Scene();
                        scene.add(elm);

                        (function(spec) {
                            doAsync(player, scene, {
                                do: 'play', until: anm.C.ERROR,
                                then: function() { expect(removeNothingOnerrorSpy).toHaveBeenCalledOnce();
                                                   removeNothingOnerrorSpy.reset(); },
                                onerror: function(err) { spec.fail('Error should be muted'); }
                            });
                        })(this);
                    });

                    it("works for system errors (do not mutes them)", function() {
                        player.state.muteErrors = true;

                        var onerrorSpy = jasmine.createSpy('foo-handler')
                                                .andCallFake(function(err) {
                            expect(err).toEqual(jasmine.any(anm.SystemError));
                            expect(err.message).toBe('foo');
                            expect(player.state.happens).toBe(anm.C.ERROR);
                        });

                        player.onerror(onerrorSpy);

                        var elm = new anm.Element();
                        elm.setBand([0, 1]);
                        // since all system errors are hard-to-force, we throw one manually
                        // directly from animation (this is not like we thrown some for manual errors test,
                        // this is in purpose of emulation)
                        elm.addModifier(function(t) {
                            // if we will use .2, then a callback to fire after load()
                            // will sequentially call stop(), and than drawAt() to draw
                            // a still frame after loading, "foo" will be fired since
                            // it matches 1/3 of the scene for the preview, and then
                            // (since error is supressed) play() will be called when
                            // there is no scene at all
                            if (t > .5) {
                                throw new anm.SystemError('foo');
                            }
                        });

                        var scene = new anm.Scene();
                        scene.add(elm);

                        (function(spec) {
                            doAsync(player, scene, {
                                do: 'play', until: anm.C.ERROR,
                                then: function() { spec.fail('Error should not be muted'); },
                                onerror: function(err) { expect(onerrorSpy).toHaveBeenCalledOnce();
                                                         onerrorSpy.reset(); }
                            });
                        })(this);
                    });

                });

            });

            describe("when disabled (by default)", function() {

                it("since mute-errors option is off by default (true if this test passes), this part is absolutely the same to previous checks", function() {
                    expect(player.state.muteErrors).toBeFalsy();
                });

                /* it("do not mutes internal errors", function() {
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

                }); */

            });

        });

    });

});

// TODO: change try { ... this.fail(...); } catch (e) ( expect(e).toBe(...) ) to expect(fn).toThrow()?
// TODO: show errors over the player or alert them, if not muted?
// TODO: it should be allowed to mute errors depending on the current mode of a player (i.e. M_PREVIEW == do mute)
