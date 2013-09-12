/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("project meta information", function() {

    var importer,
    project;

    beforeEach(function() {
        importer = new AnimatronImporter();
        project = createAnmProject();

        spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
        _fake(_Fake.CVS_POS);
    });

    it("should load project duration into scene", function() {
        project.meta.duration = 15.2;
        injectEmptyAnmScene(project);

        var scene = importer.load(project);

        expect(scene.duration).toBe(project.meta.duration);
    });

    it("should also pass duration to player when loading such project", function() {
        project.meta.duration = 217.6;
        injectEmptyAnmScene(project);

        var player = createPlayer('foo', { mode: anm.C.M_SANDBOX });
        player.load(project, importer);

        expect(player.anim.duration).toBe(217.6);
        expect(player.state.duration).toBe(217.6);
    });

});