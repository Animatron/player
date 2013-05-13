/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("repeat mode", function() {

    var player;

    var FPS = 30,
        SCENE_DURATION = 10;

    var b = Builder._$;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);

        _fg = _FrameGen.spawn().run(FPS);

        // sandbox mode is enabled not to mess with still-preview used for video-mode
        // (it calls drawAt and causes modifiers to be called once more before starting playing)
        player = createPlayer('test-id', { mode: anm.C.M_SANDBOX });
    });

    function expectTime(conf) {
        var scene = b('scene');
        scene.add(conf.subj);

        var afterFrameSpy;

        doAsync(player, {
            prepare: function() {
                var onframeSpy = spyOn(conf.subj.v, 'onframe');
                afterFrameSpy = jasmine.createSpy('afterframe').andCallFake(function(glob_t) {
                    var expected_result = conf.func(glob_t);
                    if (expected_result !== false) expect(onframeSpy).toHaveBeenCalledWith(expected_result);
                    else expect(onframeSpy).not.toHaveBeenCalled();
                    onframeSpy.reset();
                });
                player.afterFrame(afterFrameSpy);
                scene.duration = SCENE_DURATION;
                return scene;
            },
            do: 'play', until: anm.C.STOPPED, timeout: SCENE_DURATION + 2,
            then: function() { expect(afterFrameSpy).toHaveBeenCalled(); }
        });
    }

    it("once mode works properly", function() {
        var onceElm = b('once').band([0, SCENE_DURATION / 2]).once();

        expectTime({
            subj: onceElm,
            func: function(gtime) {
                if (gtime > (SCENE_DURATION / 2)) return false;
                else return gtime;
            }});
    });

});