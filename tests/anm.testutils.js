/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function _fakeCallsForCanvasRelatedStuff() {
    if (window) spyOn(window, 'addEventListener').andCallFake(_mocks._empty);

    // TODO: substite nextFrame with setTimeout

    spyOn(anm.Player, '_saveCanvasPos').andCallFake(_mocks.saveCanvasFake);
}