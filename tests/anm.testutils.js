function _fakeCallsForCanvasRelatedStuff() {
    if (window) spyOn(window, 'addEventListener').andCallFake(function() { });

    spyOn(anm.Player, '_saveCanvasPos').andCallFake(function(cvs) {
        cvs.__rOffsetLeft = 40;
        cvs.__rOffsetTop = 40;
    });
}