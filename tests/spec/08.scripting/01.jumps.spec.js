/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */
describe('jumps', function() {

    var player, importer, canvasMock;
    var FPS = 60, _fg;
    var C = anm.C;

    beforeEach(function() {
        this.addMatchers(_matchers.comparison);

        canvasMock = _mocks.factory.canvas();
        _mocks.adaptDocument(document, function() { return canvasMock; });

        _fake(_Fake.CVS_POS);
        _fg = _FrameGen.spawn().run(FPS);

        player = createPlayer('test-id-jumps');
        importer = new AnimatronImporter();
    });

    afterEach(function() { _fg.stop().destroy(); });

    it("to the specified scene", function() {
        var json = '{"meta":{"id":"cccf8c5233b022df7630e3c8","created":1384959947986,"modified":1384959947986,"author":"Alexey Pegov","description":"","name":"BACK TO THE FUTURE III","copyright":"Copyright (c) by Alexey Pegov","duration":30.0,"numberOfScenes":3,"projectAccessType":"Public","projectAccessReadOnly":true},"anim":{"dimension":[550.0,450.0],"framerate":24.0,"background":"#ffffff","elements":[[2,"FIRST",10.0,[[1,"Shape 2","","",[116.0,39.5],"",4,[[4,[],"","M196.058 355.294 L196.058 355.294 Z"]],{}],[2,"Shape 1","","",[103.0,25.0],"",4,[[4,[],"","M311.058 83.794 L311.058 83.794 Z"]],{"m_up":"this.jumpToScene(\'SECOND\');"}],[3,"SCENE 1","","",[158.0,43.5],"",4,[[4,[],"","M270.058 215.294 L270.058 215.294 Z"]],{}]]],[5,"#00bf00","","","M0.0 0.0 L232.0 0.0 L232.0 79.0 L0.0 79.0 L0.0 0.0 M0.0 0.0 Z"],[5,"#bf0000","","","M0.0 0.0 L206.0 0.0 L206.0 50.0 L0.0 50.0 L0.0 0.0 M0.0 0.0 Z"],[4,"#2291ea","","","72px Verdana","","SCENE 1",0],[2,"SECOND",10.0,[[5,"Shape 2","","",[145.5,42.0],"",4,[[4,[],"","M264.5 363.0 L264.5 363.0 Z"]],{}],[6,"Shape 1","","",[121.5,38.5],"",4,[[4,[],"","M325.5 79.5 L325.5 79.5 Z"]],{}],[7,"SCENE 2","","",[158.0,43.5],"",4,[[4,[],"","M274.0 215.5 L274.0 215.5 Z"]],{}]]],[5,"#00bf00","","","M0.0 0.0 L291.0 0.0 L291.0 84.0 L0.0 84.0 L0.0 0.0 M0.0 0.0 Z"],[5,"#0060bf","","","M0.0 0.0 L243.0 0.0 L243.0 77.0 L0.0 77.0 L0.0 0.0 M0.0 0.0 Z"],[4,"#ff0000","","","72px Verdana","","SCENE 2",0],[2,"THIRD",10.0,[[9,"Shape 1","","",[130.5,51.5],"",4,[[4,[],"","M325.5 84.5 L325.5 84.5 Z"]],{}],[10,"3","","",[158.0,43.5],"",4,[[4,[],"","M275.0 215.5 L275.0 215.5 Z"]],{}]]],[5,"#bf0000","","","M0.0 0.0 L261.0 0.0 L261.0 103.0 L0.0 103.0 L0.0 0.0 M0.0 0.0 Z"],[4,"#00bf00","","","72px Verdana","","SCENE 3",0],[2,"$$$LIBRARY$$$",10.0,[]]],"scenes":[0,4,8]}}';

        var checkModeSpy = spyOn(player, '_checkMode').andCallThrough();

        var playSpy;
        doAsync(player, {
            scene: null,
            /*prepare: function() {
                return null; // [ JSON.parse(json), new AnimatronImporter() ];
            },*/
            run: function() {
                player.load(JSON.parse(json), new AnimatronImporter());

                // TODO: move all these expectations below to different tests, like:
                //       - checks mode after loading scene with scripting
                //       - keeps duration (or makes infinite) after loading scene with scripting
                //       - plays from start after loading scene with scripting
                //       - saves player instance pointer to scene

                // TODO: test with async resources (!)

                //expect(handleXSpy).toHaveBeenCalledWith(C.S_LOAD, scene);
                expect(checkModeSpy).toHaveBeenCalled();

                expect(player.state.happens).toBe(C.PLAYING);
                expect(player.state.duration).toBe(Infinity);
                expect(player.state.from).toBe(0);
                expect(player.mode).toBe(C.M_DYNAMIC);

                expect(player.anim.__player_instance).toBe(player);

                playSpy = jasmine.createSpy('playSpy').andCallFake(function() {
                    expect(player.state.time).toBeEpsilonyCloseTo(10.0, 0.1);
                    player.stop();
                });

                player.on(C.S_PLAY, playSpy);

                setTimeout(function() {
                    player.anim.tree[0].children[1].fire(C.X_MUP, {})
                }, 300);
            },
            until: C.STOPPED, timeout: 0.8,
            then: function() {
                expect(playSpy).toHaveBeenCalled();
            }
        });
    });

});
