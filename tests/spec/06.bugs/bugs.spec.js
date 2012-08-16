describe("as for known bugs,", function() {

    var player;

    it("should be stubby", function() {
        expect(true).toBeTruthy();
    });

    /* var b = Builder._$,
        C = anm.C;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        this.addMatchers(_matchers);
    })

    it("#34213789 (problems with rendering players/controls at demo page) shall pass",
    function() {

        if (!window) throw new Error('May be tested only in browser environment');

        // TODO: ensure controls are not rendered at time < 0
        //       ensure controls and scene are rendered after scroll/resize

        spyOn(anm.Player, '_saveCanvasPos').andCallFake(function(cvs) {
            cvs.__rOffsetLeft = 40;
            cvs.__rOffsetTop = 40;
        });

        player = new anm.Player();

        var playerCheckModeSpy = spyOn(player, '_checkMode').andCallThrough();
        var playerDrawAtSpy = spyOn(player, 'drawAt').andCallThrough();

        player.init('test-id');

        expect(playerCheckModeSpy).toHaveBeenCalledOnce();

        //var controlsRenderSpy = spyOn(player.controls, 'render').andCallThrough();
        //var controlsUpdateSpy = spyOn(player.controls, 'update').andCallThrough();

        expect(player.mode).toBe(C.M_VIDEO);
        expect(player.controls).toBeDefined();
        expect(player.info).toBeDefined();

        var controls = player.controls;

        expect(controls.hidden).toBeTruthy();

        //expect(controlsRenderSpy).toHaveBeenCalledOnce();
        //expect(controlsUpdateSpy).toHaveBeenCalledOnce();

        player.load(b().rect([100, 70], [70, 70])
                       .fill('#009')
                       .stroke('#f00', 3));

        expect(player.state.happens).toBe(C.STOPPED);
        //expect(controlsRenderSpy).not.toHaveBeenCalledWith(-1);
        expect(playerDrawAtSpy).toHaveBeenCalledWith(anm.Scene.DEFAULT_VIDEO_DURATION
                                                   * anm.Player.PREVIEW_POS);

        //expect(controlsRenderSpy).toHaveBeenCalledWith(player.state, 0);
        //expect(controlsRenderSpy).not.toHaveBeenCalledWith(player.state, Player.NO_TIME);
        //expect(controlsUpdateSpy).toHaveBeenCalledOnce();
        expect(controls.hidden).toBeTruthy();

        expect(controls.canvas.width).toEqual(anm.Player.DEFAULT_CANVAS.width);
        expect(controls.canvas.height).toBeGreaterThan(0);

    }); */

});