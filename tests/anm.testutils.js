/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function _fakeCallsForCanvasRelatedStuff() {
    if (window) spyOn(window, 'addEventListener').andCallFake(function() { });

    spyOn(anm.Player, '_saveCanvasPos').andCallFake(function(cvs) {
        cvs.__rOffsetLeft = 40;
        cvs.__rOffsetTop = 40;
    });
}