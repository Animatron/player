/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function _fakeCallsForCanvasRelatedStuff() {
    if (window) spyOn(window, 'addEventListener').andCallFake(_mocks._empty);

    spyOn(anm.Player, '_saveCanvasPos').andCallFake(_mocks.saveCanvasFake);

    if (window) {
        function stubFrameGen(callback) {
            return window.setTimeout(callback, 1000 / 60);
        };

        if (window.requestAnimationFrame) {
            spyOn(window, 'requestAnimationFrame').andCallFake(stubFrameGen);
        } else if (window.webkitRequestAnimationFrame) {
            spyOn(window, 'webkitRequestAnimationFrame').andCallFake(stubFrameGen);
        } else if (window.mozRequestAnimationFrame) {
            spyOn(window, 'mozRequestAnimationFrame').andCallFake(stubFrameGen);
        } else if (window.oRequestAnimationFrame) {
            spyOn(window, 'oRequestAnimationFrame').andCallFake(stubFrameGen);
        } else if (window.msRequestAnimationFrame) {
            spyOn(window, 'msRequestAnimationFrame').andCallFake(stubFrameGen);
        }

        function stubFrameRem(id) {
            return window.clearTimeout(id);
        };

        if (window.cancelAnimationFrame) {
            spyOn(window, 'cancelAnimationFrame').andCallFake(stubFrameRem);
        } else if (window.webkitCancelAnimationFrame) {
            spyOn(window, 'webkitCancelAnimationFrame').andCallFake(stubFrameRem);
        } else if (window.mozCancelAnimationFrame) {
            spyOn(window, 'mozCancelAnimationFrame').andCallFake(stubFrameRem);
        } else if (window.oCancelAnimationFrame) {
            spyOn(window, 'oCancelAnimationFrame').andCallFake(stubFrameRem);
        } else if (window.msCancelAnimationFrame) {
            spyOn(window, 'msCancelAnimationFrame').andCallFake(stubFrameRem);
        }

    }

}