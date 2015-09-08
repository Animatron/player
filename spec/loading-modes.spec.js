describe('loading modes', function() {

    var elmId = 'player-target',
        elm;

    var player;

    beforeEach(function() {
        elm = document.createElement('div');
        elm.id = elmId;
        document.body.appendChild(elm);
    });

    afterEach(function() {
        if (player) {
            player.detach();
        }
        document.body.removeChild(elm);
    });

    it('should have `rightaway` as default option', function() {
        expect(anm.createPlayer(elmId).loadingMode).toBe(anm.C.LM_RIGHTAWAY);
    });

    describe('right away', function() {

        it('should automatically load a scene when source specified with attribute', function() {

        });

        it('should automatically load a scene when source passed with forSnapshot', function() {

        });

        it('should not load anything when player created and source wasn\'t specified', function() {

        });

    });

    describe('on request', function() {

        it('should not load anything when player created and source wasn\'t specified', function() {

        });

        it('still should not load anything even when source was specified with HTML attribute', function() {

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

    xdescribe('onload');

    xdescribe('onidle');

    xdescribe('onhover');

    xdescribe('wheninview');

});
