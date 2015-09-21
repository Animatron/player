describe('loading modes', function() {

    var ELEMENT_ID = 'player-target';

    var JSON_SRC = './spec/empty.json';

    function FakeImporter() {};
    FakeImporter.prototype.load = function() { return new anm.Animation(); };
    anm.importers.register('fake', FakeImporter);

    function prepareDivElement(id) {
        var element = document.createElement('div');
        element.id = id;
        document.body.appendChild(element);
        return element;
    }

    function whenDocumentReady(f) {
        anm.engine.onDocReady(f);
    }

    function prepareJsonRequestStub() {
        jasmine.Ajax.stubRequest(JSON_SRC).andReturn({
            "responseText": '{}'
        });
    }

    function lastAjaxCall() {
        return jasmine.Ajax.requests.mostRecent();
    }

    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        anm.detachAllPlayers(); // this will also detach element if players were created
        anm.forgetAllPlayers();
        //if (element && element.parentNode) document.body.removeChild(element);
        jasmine.Ajax.uninstall();
    });

    it('`autoPlay` is off by default', function() {
        whenDocumentReady(function() {
            prepareDivElement(ELEMENT_ID);
            expect(anm.createPlayer(ELEMENT_ID).autoPlay).toBeFalsy();
        });
    });

    it('should have `rightaway` as default option', function() {
        whenDocumentReady(function() {
            prepareDivElement(ELEMENT_ID);
            expect(anm.createPlayer(ELEMENT_ID).loadingMode).toBe(anm.C.LM_RIGHTAWAY);
        });
    });

    xit('should fallback to `rightaway` if loadingMode is unknown', function() {
        whenDocumentReady(function() {
            prepareDivElement(ELEMENT_ID);
            var player = anm.createPlayer(ELEMENT_ID, { loadingMode: 'foobarbuz' });
            expect(player.loadingMode).toBe(anm.C.LM_RIGHTAWAY);
        });
    });

    describe('right away', function() {

        it('should not load anything when player created and source wasn\'t specified', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                anm.createPlayer(ELEMENT_ID);
                expect(lastAjaxCall()).not.toBeDefined();
            });
        });

        it('should indeed load animation passed to `load` call', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);
                var player = anm.createPlayer(ELEMENT_ID);
                var fakeImporter = anm.importers.create('fake');
                player.load(JSON_SRC, fakeImporter);
                expect(lastAjaxCall()).toBeDefined();
            });
        });

        it('should automatically load a scene when source specified with HTML attribute', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                anm.findAndInitPotentialPlayers();

                var lastCall = lastAjaxCall();
                expect(lastCall).toBeDefined();
                if (lastCall) { expect(lastCall.url).toBe(JSON_SRC) };
            });
        });

        it('should automatically load a scene when source passed with forSnapshot', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter);

                expect(lastAjaxCall()).toBeDefined();
            });
        });

        it('since autoPlay is off, should not play animation after a call to `load`', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);
                var player = anm.createPlayer(ELEMENT_ID);
                playSpy = spyOn(player, 'play');
                var fakeImporter = anm.importers.create('fake');
                player.load(JSON_SRC, fakeImporter);
                expect(playSpy).not.toHaveBeenCalled();
            });
        });

        it('since autoPlay is off, should not play animation even when source was specified with HTML attributes', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                var playSpy = jasmine.createSpy('play');
                anm.findAndInitPotentialPlayers({
                    handle: { 'play': playSpy }
                });

                expect(playSpy).not.toHaveBeenCalled();
            });
        });

        it('since autoPlay is off, should not play animation even when source was passed with forSnapshot call', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                var playSpy = jasmine.createSpy('play');
                var player = anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter, {
                    handle: { 'play': playSpy }
                });
                expect(playSpy).not.toHaveBeenLoaded();
            });
        });

        it('when autoPlay is on, yet should not play if no source was specified', function() {
            whenDocumentReady(function() {
                prepareDivElement(ELEMENT_ID);

                var player = anm.createPlayer(ELEMENT_ID, { autoPlay: true });
                playSpy = spyOn(player, 'play');
                expect(playSpy).not.toHaveBeenCalled();
            });
        });

        it('when autoPlay is on, should automatically play animation passed to a `load` call', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);
                var player = anm.createPlayer(ELEMENT_ID, { autoPlay: true });
                playSpy = spyOn(player, 'play');
                var fakeImporter = anm.importers.create('fake');
                player.load(JSON_SRC, fakeImporter);
                expect(playSpy).toHaveBeenCalled();
            });
        });

        it('when autoPlay is on, should automatically load and play animation specified with HTML attribute', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                var playSpy = jasmine.createSpy('play');
                anm.findAndInitPotentialPlayers({
                    autoPlay: true,
                    handle: { 'play': playSpy }
                });

                expect(playSpy).toHaveBeenCalled();
            });
        });

        it('when autoPlay is on, should automatically load and play animation passed with forSnapshot method', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                var playSpy = jasmine.createSpy('play');
                anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter, {
                    autoPlay: true,
                    handle: { 'play': playSpy }
                });

                expect(playSpy).toHaveBeenCalled();
            });
        });

    });

    describe('on request', function() {

        it('should not load anything when player created and source wasn\'t specified', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);
                anm.createPlayer(ELEMENT_ID, { loadingMode: anm.C.LM_ONREQUEST });
                expect(lastAjaxCall()).not.toBeDefined();
            });
        });

        it('still should not load anything even when source was specified with HTML attribute', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                anm.findAndInitPotentialPlayers({ loadingMode: anm.C.LM_ONREQUEST });
                expect(lastAjaxCall()).not.toBeDefined();
            });
        });

        it('still should not load anything even when source was passed with forSnapshot', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                var importLoadSpy = spyOn(fakeImporter, 'load').and.callThrough();
                anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter, {
                    loadingMode: anm.C.LM_ONREQUEST
                });

                expect(importLoadSpy).not.toHaveBeenCalled();
                expect(lastAjaxCall()).not.toBeDefined();
            });
        });

        it('should load animation when load called manually', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);
                var player = anm.createPlayer(ELEMENT_ID, { loadingMode: anm.C.LM_ONREQUEST });
                var fakeImporter = anm.importers.create('fake');
                player.load(JSON_SRC, fakeImporter);
                expect(lastAjaxCall()).toBeDefined();
            });
        });

        it('should load animation when load called manually w/o arguments and source was specified via HTML attribute', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                anm.findAndInitPotentialPlayers({ loadingMode: anm.C.LM_ONREQUEST });

                expect(lastAjaxCall()).not.toBeDefined();
                anm.player_manager.instances[0].load();
                expect(lastAjaxCall()).toBeDefined();
            });
        });

        it('should load animation when load called manually w/o arguments and source was provided with forSnapshot', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                var player = anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter, {
                    loadingMode: anm.C.LM_ONREQUEST
                });

                expect(lastAjaxCall()).not.toBeDefined();
                player.load();
                expect(lastAjaxCall()).toBeDefined();
            });
        });

        it('since autoPlay is off, should not play animation after a call to `load`', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);
                var player = anm.createPlayer(ELEMENT_ID, {
                    loadingMode: anm.C.LM_ONREQUEST
                });
                playSpy = spyOn(player, 'play');
                var fakeImporter = anm.importers.create('fake');
                player.load(JSON_SRC, fakeImporter);
                expect(playSpy).not.toHaveBeenCalled();
            });
        });

        it('since autoPlay is off, should not play animation after a call to `load` even when source was specified with HTML attributes', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                var playSpy = jasmine.createSpy('play');
                anm.findAndInitPotentialPlayers({
                    loadingMode: anm.C.LM_ONREQUEST,
                    handle: { 'play': playSpy }
                });

                expect(playSpy).not.toHaveBeenCalled();
            });
        });

        it('since autoPlay is off, should not play animation after a call to `load` even when source was passed with forSnapshot call', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                var player = anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter, {
                    loadingMode: anm.C.LM_ONREQUEST
                });
                playSpy = spyOn(player, 'play');
                player.load();
                expect(playSpy).not.toHaveBeenCalled();
            });
        });

        it('if autoPlay is on, should automatically play animation just after a call to `load`', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);
                var player = anm.createPlayer(ELEMENT_ID, {
                    loadingMode: anm.C.LM_ONREQUEST,
                    autoPlay: true
                });
                playSpy = spyOn(player, 'play');
                var fakeImporter = anm.importers.create('fake');
                player.load(JSON_SRC, fakeImporter);
                expect(playSpy).toHaveBeenCalled();
            });
        });

        it('if autoPlay is on and source was specified with HTML attributes, should automatically play animation just after a call to `load`', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                var playSpy = jasmine.createSpy('play');
                anm.findAndInitPotentialPlayers({
                    loadingMode: anm.C.LM_ONREQUEST,
                    autoPlay: true, handle: { 'play': playSpy }
                });
                anm.player_manager.instances[0].load();
                expect(playSpy).toHaveBeenCalled();
            });
        });

        it('if autoPlay is on and source was passed with forSnapshot call, should automatically play animation just after a call to `load`', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                var player = anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter, {
                    loadingMode: anm.C.LM_ONREQUEST
                });
                playSpy = spyOn(player, 'play');
                player.load();
                expect(playSpy).toHaveBeenCalled();
            });
        });

    });

    describe('on play', function() {

        it('should not load anything when player was created and source wasn\'t specified', function() {

        });

        it('if `load` was called before `play`, should postpone it to `play` call', function() {

        });

        it('should automatically load and play animation on `play` call when source was specified with HTML attribute', function() {

        });

        it('should automatically load and play animation on `play` call when source was passed with forSnapshot', function() {

        });

        it('should fail if `load` wasn\'t called before `play` and no source was specified', function() {

        });

        it('if autoPlay is on, should automatically load and play animation just after a call to `load`', function() {

        });

        it('if autoPlay is on and source was specified with HTML attributes, should automatically play animation right away', function() {

        });

        it('if autoPlay is on and source was passed with forSnapshot call, should automatically play animation right away', function() {

        });

    });

    xdescribe('onidle', function() {});

    xdescribe('onhover', function() {});

    xdescribe('wheninview', function() {});

});
