/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("scene duration", function() {

    var player;

    var b = Builder._$;

    var DEFAULT_SCENE_LENGTH = anm.Scene.DEFAULT_LEN;

    beforeEach(function() {
        _mocks.adaptDocument(document);
        _fake(_Fake.CVS_POS);
    });

    var _mode;
    var _builder;
    var _durationValue = undefined,
        _durationWasSet = false;
    var _player;

    varyAll([ { description: "when in standard mode", prepare: function() { _mode = anm.C.M_VIDEO;
                                                                            _player = createPlayer('test_id'); } },
              { description: "when in preview mode",  prepare: function() { _mode = anm.C.M_PREVIEW;
                                                                            _player = createPlayer('test_id', { mode: _mode }); } },
              { description: "when in dynamic mode",  prepare: function() { _mode = anm.C.M_DYNAMIC;
                                                                            _player = createPlayer('test_id', { mode: _mode }); } }

    ], function() {

        varyAll([ { description: "when builder is empty",
                    prepare: function() { _builder = b(); } },
                  { description: "when builder has some elements with no-defined bands",
                    prepare: function() { _builder = b().add(b().add(b())); } },
                  { description: "when builder is narrow-band element",
                    prepare: function() { _builder = b().band([0, 5]); } },
                  { description: "when builder has narrow-band element",
                    prepare: function() { _builder = b().add(b().band([0, 5])); } },
                  { description: "when builder is wide-band element",
                    prepare: function() { _builder = b().band([10, 1005]); } },
                  { description: "when builder has wide-band element",
                    prepare: function() { _builder = b().add(b().band([10, 1005])); } }

        ], function() {

            varyAll([ { description: "duration is 0",                             prepare: function() { _durationValue = 0; } },
                      { description: "duration is some random value",             prepare: function() { _durationValue = 27.3; /*Math.random() * 100*/ } },
                      { description: "duration is 10",                            prepare: function() { _durationValue = 10; } },
                      { description: "duration is negative",                      prepare: function() { _durationValue = -17.2; } },
                      { description: "duration is equal to default scene length", prepare: function() { _durationValue = DEFAULT_SCENE_LENGTH; } }

            ], function() {

                varyAll([ { description: "but duration is not set in any way",
                            prepare: function() { _durationWasSet = false;
                                                  _player.load(_builder); } },
                          { description: "duration was set with the help of a method",
                            prepare: function() { _durationWasSet = true;
                                                  _builder.duration(_durationValue);
                                                  _player.load(_builder); } },
                          { description: "duration was set with the help of a property",
                            prepare: function() { _durationWasSet = true;
                                                  _builder.d = _durationValue;
                                                  _player.load(_builder); } },
                          { description: "duration was set with the help of the method, but after loading",
                            prepare: function() { _durationWasSet = false;
                                                  _player.load(_builder);
                                                  _builder.duration(_durationValue); } },
                          { description: "duration was set with the help of a property, but after loading",
                            prepare: function() { _durationWasSet = false;
                                                  _player.load(_builder);
                                                  _builder.d = _durationValue; } },
                          { description: "duration was set via load method argument",
                            prepare: function() { _durationWasSet = true;
                                                  _player.load(_builder, _durationValue); } }

                ], function() {

                    it("duration should be overriden, if it was defined", function() {
                        if (_durationWasSet) {
                            expect(_builder.v.scene.duration).toBeDefined();
                            expect(_player.anim.duration)    .toBeDefined();
                            expect(_player.state.duration)   .toBeDefined();
                        }
                    });

                    it("duration should be default, or infinite for dynamic mode, if it was not especially set", function() {
                        if (!_durationWasSet) {
                            var notDynamic = (_mode != anm.C.M_DYNAMIC);
                            expect(_builder.v.scene.duration).toBe(notDynamic ? DEFAULT_SCENE_LENGTH : Infinity);
                            expect(_player.anim.duration)    .toBe(notDynamic ? DEFAULT_SCENE_LENGTH : Infinity);
                            expect(_player.state.duration)   .toBe(notDynamic ? DEFAULT_SCENE_LENGTH : Infinity);
                        }
                    });

                    it("if duration was set and is positive or 0, it should be equal to given value", function() {
                        if (_durationWasSet && (_durationValue >= 0)) {
                            expect(_builder.v.scene.duration).toBe(_durationValue);
                            expect(_player.anim.duration)    .toBe(_durationValue);
                            expect(_player.state.duration)   .toBe(_durationValue);
                        }
                    });

                    it("negative duration should be converted to 0, if set", function() {
                        if (_durationWasSet && (_durationValue < 0)) {
                            expect(_builder.v.scene.duration).toBe(0);
                            expect(_player.anim.duration)    .toBe(0);
                            expect(_player.state.duration)   .toBe(0);
                        }
                    });

                    /* it("duration property of builder should be set, if duration iself was defined", function() {
                        if (_durationWasSetBeforeLoad || _durationWasSetAfterLoad) {
                            expect(_builder.d).toBeDefined();
                            expect(_builder.d).toBe(_durationValue > 0 ? _durationValue : 0);
                        } else {
                            expect(_builder.d).not.toBeDefined();
                        }
                    }); */

                });

            });

        });

    });

    it("builder should not allow setting duration from children methods", function() {
        try {
            b().add(b().add(b().duration(14)));
        } catch(e) {
            expect(e).toBeDefined();
            expect(e.message).toBe('Please set duration only through the root Builder instance');
        }

        try {
            b().add(b().duration()).duration(14);
        } catch(e) {
            expect(e).toBeDefined();
            expect(e.message).toBe('Please set duration only through the root Builder instance');
        }

        try {
            b().add(b()).duration(14);
        } catch(e) {
            this.fail('Should not fire exception');
        }
    });

});

xdescribe("element band", function() {

});
