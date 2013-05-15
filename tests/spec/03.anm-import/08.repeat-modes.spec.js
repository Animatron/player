/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("importing repeat modes", function() {

    var importer,
        project;

    beforeEach(function() {
        importer = new AnimatronImporter();
        project = createAnmProject();
    });

    it("should import deprecated version of repeat modes correctly", function() {

        injectAnmScene(project,
            [ { name: 'no-end' },
              { name: 'null-end', '#on-end': null },
              { name: 'stop-end', '#on-end': 'STOP' },
              { name: 'loop-end', '#on-end': 'LOOP' },
              { name: 'bounce-end', '#on-end': 'BOUNCE' },
              { name: 'wrapper', layers: [
                    { name: 'loop-end-inside', '#on-end': 'LOOP' }
                ] } ]);

        var scene = importer.load(project);

        expect(scene.findByName('no-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('null-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('stop-end').xdata.mode).toBe(anm.C.R_STAY);
        expect(scene.findByName('loop-end').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('bounce-end').xdata.mode).toBe(anm.C.R_BOUNCE);
        expect(scene.findByName('loop-end-inside').xdata.mode).toBe(anm.C.R_LOOP);

    });

});