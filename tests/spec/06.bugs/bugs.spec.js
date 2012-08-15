describe("as for known bugs,", function() {

    var player;
    var b = Builder._$;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
    })

    it("#34213789 (problems with rendering players/controls at demo page) shall pass",
    function() {
        var scrollListener;
        var resizeListener;

        if (!window) throw new Error('May be tested only in browser environment');

        spyOn(anm.Player, '_saveCanvasPos').andCallFake(function(cvs) {
            cvs.__rOffsetLeft = 40;
            cvs.__rOffsetTop = 40;
        });

        spyOn(window, 'addEventListener').andCallFake(function(evt, func) {
            if (evt === 'scroll') scrollListener = func;
            if (evt === 'resize') resizeListener = func;
        });

        player = createPlayer('test-id');
        expect(scrollListener).toBeDefined();
        expect(resizeListener).toBeDefined();

        player.load(b().rect([100, 70], [70, 70])
                       .fill('#009')
                       .stroke('#f00', 3));
    });

});