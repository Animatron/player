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
        //if (element && element.parentNode) document.body.removeChild(element);
        jasmine.Ajax.uninstall();
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
                var importLoadSpy = spyOn(fakeImporter, 'load').and.callThrough();
                anm.Player.forSnapshot(ELEMENT_ID, JSON_SRC, fakeImporter);

                expect(importLoadSpy).toHaveBeenCalled();
                expect(lastAjaxCall()).toBeDefined();
            });
        });

        it('should not load anything when player created and source wasn\'t specified', function() {
            whenDocumentReady(function() {
                prepareJsonRequestStub();
                prepareDivElement(ELEMENT_ID);

                anm.createPlayer(ELEMENT_ID);
                expect(lastAjaxCall()).not.toBeDefined();
            });
        });

    });

    describe('on request', function() {

        it('should not load anything when player created and source wasn\'t specified', function() {
            whenDocumentReady(function() {
                prepareDivElement(ELEMENT_ID);
                var loadSpy = jasmine.createSpy('load');
                anm.createPlayer(ELEMENT_ID, { loadingMode: anm.C.LM_ONREQUEST });
                expect(lastAjaxCall()).not.toBeDefined();
            });
        });

        it('still should not load anything even when source was specified with HTML attribute', function() {
            whenDocumentReady(function() {
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_SRC);
                element.setAttribute('anm-importer', 'fake');

                anm.findAndInitPotentialPlayers({ loadingMode: anm.C.LM_ONREQUEST });
                expect(lastAjaxCall()).not.toBeDefined();
            });
        });

        it('still should not load anything even when source was passed with forSnapshot', function() {

        });

        it('should load animation when load called manually', function() {

        });

        it('should load animation when load called manually w/o arguments and source was specified', function() {

        });

    });

    describe('on play', function() {

        it('should not load anything when player was created', function() {

        });

        it('should load animation when `load` was called manually', function() {

        });

        it('should load animation before playing if `load` wasn\'t called before `play`', function() {

        });

    });

    xdescribe('onload', function() {});

    xdescribe('onidle', function() {});

    xdescribe('onhover', function() {});

    xdescribe('wheninview', function() {});

});
