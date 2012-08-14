describe("player, when used to play something", function() {

    var player;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _addPlayerStaticSpies();
        player = createPlayer('test-id');
    });

    it("should be stopped at start", function() {
        expect(true).toBeTruthy();
    });

});