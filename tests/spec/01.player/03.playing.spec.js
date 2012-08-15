describe("player, when speaking about playing,", function() {

    var player;
    var P = anm.Player;

    beforeEach(function() {
        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _addPlayerStaticSpies();
        player = new anm.Player();
    });



});