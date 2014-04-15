/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("importing masks", function() {

    var importer,
        project;

    beforeEach(function() {
        // FIXME: update to standard compact importer
        importer = new AnimatronIntactImporter();
        project = createAnmProject();
    });

    it("should import masks in proper order", function() {
        injectAnmScene(project,
            [ { name: "noname" },
              { name: "masks-inside", layers: [
                { name: "bg" },
                { name: "mask",
                  '#masked': 2,
                  layers: [ { name: "mask-part-1" },
                            { name: "mask-part-2" } ] },
                { name: "masked1" },
                { name: "masked2" },
                { name: "not-masked" }
              ] } ]);

        var scene = importer.load(project);

        var masksInside = scene.findByName('masks-inside');
        var masked1Elm = scene.findByName('masked1');
        var masked2Elm = scene.findByName('masked2');
        var notMaskedElm = scene.findByName('not-masked');
        var bgElm = scene.findByName('bg');
        try {
            scene.findByName('mask');
        } catch(e) {
            expect(e.message).toBe("mask was not found");
        }

        expect(masksInside.children.length).toBe(4);
        expect(masksInside.children[0]).toBe(notMaskedElm)
        expect(masksInside.children[1]).toBe(masked2Elm);
        expect(masksInside.children[2]).toBe(masked1Elm);
        expect(masksInside.children[3]).toBe(bgElm);

        var maskElm = masked1Elm.__mask;
        expect(maskElm).toBeDefined;
        expect(masked2Elm.__mask).toBe(maskElm);
        expect(maskElm.name).toBe("mask");
        expect(maskElm.children.length).toBe(2);
        expect(maskElm.children[0].name).toBe("mask-part-2");
        expect(maskElm.children[1].name).toBe("mask-part-1");

        expect(masksInside.__mask).not.toBeDefined();
        expect(bgElm.__mask).not.toBeDefined();
        expect(notMaskedElm.__mask).not.toBeDefined();
    });

    it("should fire an error if number of masked elements not matches the elements count below the mask", function() {
        function expectAnErrorForProject(structure) {
            var project = createAnmProject();
            injectAnmScene(project, structure);
            try {
                importer.load(project);
            } catch(e) {
                expect(e.message).toBe('No layers collected to apply mask');
            }
        }

        expectAnErrorForProject(
            [ { name: "bg" },
              { name: "mask",
                masked: 2,
                layers: [ { name: "mask-part-1" },
                          { name: "mask-part-2" } ] } ]);

        expectAnErrorForProject(
            [ { name: "mask",
                masked: 8,
                layers: [ ]
              } ] );

        expectAnErrorForProject(
            [ { name: "mask",
                masked: 1,
                layers: [ ]
              } ] );

        expectAnErrorForProject(
            [ { name: "mask",
                masked: 2,
                layers: [ ]
              },
              { name: "not-enough" } ] );

    });

    // TODO: test importing masks, single-layered or multi-layered, also if masked is 0

});
