function _fakeCallsForCanvasRelatedStuff() {
    spyOn(anm.Player, '_saveCanvasPos').andCallFake(function(cvs) {
        cvs.__rOffsetLeft = 40;
        cvs.__rOffsetTop = 40;
    });
}