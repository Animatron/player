/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("importing repeat modes", function() {

    var importer,
        project;

    beforeEach(function() {
        // FIXME: update to standard compact importer
        importer = new AnimatronIntactImporter();
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
        expect(scene.findByName('stop-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('loop-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('bounce-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('loop-end-inside').xdata.mode).toBe(anm.C.R_ONCE);

    });

    it("should import new version of repeat modes correctly", function() {

        injectAnmScene(project,
            [ { name: 'no-end' },
              { name: 'null-end', "end": null },
              { name: 'null-type-end', "end": { 'type': null } },
              { name: 'once-end', "end": { 'type': 'once' } },
              { name: 'stay-end', "end": { 'type': 'stay' } },
              { name: 'loop-end', "end": { 'type': 'loop' } },
              { name: 'loop-counter-end', "end": { 'type': 'loop', 'counter': 4 } },
              { name: 'loop-no-counter-end', "end": { 'type': 'loop' } },
              { name: 'loop-null-counter-end', "end": { 'type': 'loop', 'counter': undefined } },
              { name: 'loop-zero-counter-end', "end": { 'type': 'loop', 'counter': 0 } },
              { name: 'bounce-end', "end": { 'type': 'bounce' } },
              { name: 'bounce-counter-end', "end": { 'type': 'bounce', 'counter': 4 } },
              { name: 'bounce-no-counter-end', "end": { 'type': 'bounce' } },
              { name: 'bounce-null-counter-end', "end": { 'type': 'bounce', 'counter': undefined } },
              { name: 'bounce-zero-counter-end', "end": { 'type': 'bounce', 'counter': 0 } },
              { name: 'wrapper', layers: [
                    { name: 'loop-end-inside', "end": { 'type': 'loop' } },
                    { name: 'loop-counter-end-inside', "end": { 'type': 'loop', 'counter': 7 } }
                ] } ]);

        var scene = importer.load(project);

        expect(scene.findByName('no-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('null-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('null-type-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('once-end').xdata.mode).toBe(anm.C.R_ONCE);
        expect(scene.findByName('stay-end').xdata.mode).toBe(anm.C.R_STAY);
        expect(scene.findByName('loop-end').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-counter-end').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-counter-end').xdata.nrep).toBe(4);
        expect(scene.findByName('loop-end').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-no-counter-end').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-no-counter-end').xdata.nrep).toBe(Infinity);
        expect(scene.findByName('loop-null-counter-end').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-null-counter-end').xdata.nrep).toBe(Infinity);
        expect(scene.findByName('loop-zero-counter-end').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-zero-counter-end').xdata.nrep).toBe(0);
        expect(scene.findByName('bounce-end').xdata.mode).toBe(anm.C.R_BOUNCE);
        expect(scene.findByName('bounce-counter-end').xdata.mode).toBe(anm.C.R_BOUNCE);
        expect(scene.findByName('bounce-counter-end').xdata.nrep).toBe(4);
        expect(scene.findByName('bounce-no-counter-end').xdata.mode).toBe(anm.C.R_BOUNCE);
        expect(scene.findByName('bounce-no-counter-end').xdata.nrep).toBe(Infinity);
        expect(scene.findByName('bounce-null-counter-end').xdata.mode).toBe(anm.C.R_BOUNCE);
        expect(scene.findByName('bounce-null-counter-end').xdata.nrep).toBe(Infinity);
        expect(scene.findByName('bounce-zero-counter-end').xdata.mode).toBe(anm.C.R_BOUNCE);
        expect(scene.findByName('bounce-zero-counter-end').xdata.nrep).toBe(0);
        expect(scene.findByName('loop-end-inside').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-counter-end-inside').xdata.mode).toBe(anm.C.R_LOOP);
        expect(scene.findByName('loop-counter-end-inside').xdata.nrep).toBe(7);

    });

    // TODO: test loop mode to pass it's mode to children, if it's a group

});
