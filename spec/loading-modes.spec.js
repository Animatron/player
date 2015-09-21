describe('loading modes', function() {

    var ELEMENT_ID = 'player-target';

    var JSON_NODE_SRC = '/base/spec/empty.json';

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

    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        anm.detachAllPlayers(); // this will also detach element if players were created
        //if (element && element.parentNode) document.body.removeChild(element);
        jasmine.Ajax.uninstall();
    });

    it('should have `rightaway` as default option', function(done) {
        whenDocumentReady(function() {
            prepareDivElement(ELEMENT_ID);
            expect(anm.createPlayer(ELEMENT_ID).loadingMode).toBe(anm.C.LM_RIGHTAWAY);
            done();
        });
    });

    describe('right away', function() {

        it('should automatically load a scene when source specified with HTML attribute', function(done) {
            whenDocumentReady(function() {
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_NODE_SRC);
                element.setAttribute('anm-importer', 'fake');

                anm.findAndInitPotentialPlayers({ 'handle': { 'load': function(animation) {
                    expect(animation).toBeDefined();
                    done();
                } } });
            });
        });

        it('should automatically load a scene when source passed with forSnapshot', function(done) {
            whenDocumentReady(function() {
                prepareDivElement(ELEMENT_ID);

                var fakeImporter = anm.importers.create('fake');
                var importLoadSpy = spyOn(fakeImporter, 'load').and.callThrough();
                anm.Player.forSnapshot(ELEMENT_ID, JSON_NODE_SRC, fakeImporter, function(animation) {
                    expect(animation).toBeDefined();
                    expect(importLoadSpy).toHaveBeenCalled();
                    done();
                });
            });
        });

        it('should not load anything when player created and source wasn\'t specified', function(done) {
            whenDocumentReady(function() {
                prepareDivElement(ELEMENT_ID);
                var loadSpy = jasmine.createSpy('load');
                anm.createPlayer(ELEMENT_ID, { handle: { 'load': loadSpy } });
                expect(loadSpy).not.toHaveBeenCalled();

                done();
            });
        });

    });

    describe('on request', function() {

        it('should not load anything when player created and source wasn\'t specified', function(done) {
            whenDocumentReady(function() {
                prepareDivElement(ELEMENT_ID);
                var loadSpy = jasmine.createSpy('load');
                anm.createPlayer(ELEMENT_ID, { loadingMode: anm.C.LM_ONREQUEST,
                                               handle: { 'load': loadSpy } });
                expect(loadSpy).not.toHaveBeenCalled();

                done();
            });
        });

        it('still should not load anything even when source was specified with HTML attribute', function(done) {
            whenDocumentReady(function() {
                var element = prepareDivElement(ELEMENT_ID);

                element.setAttribute('anm-player-target', true);
                element.setAttribute('anm-src', JSON_NODE_SRC);
                element.setAttribute('anm-importer', 'fake');

                anm.findAndInitPotentialPlayers({ 'handle': { 'load': function(animation) {
                    expect(animation).toBeDefined();
                    done();
                } } });
            });
        });

        it('still should not load anything even when source was with forSnapshot', function() {

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
