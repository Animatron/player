/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function _fakeCallsForCanvasRelatedStuff() {

    if (window) spyOn(window, 'addEventListener').andCallFake(_mocks._empty);

    spyOn(anm.Player, '_saveCanvasPos').andCallFake(_mocks.saveCanvasFake);

    if (jasmine.Clock.isInstalled()) {
        jasmine.Clock.uninstallMock();
    }

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

function _s4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
   return (_s4()+_s4()+'-'+_s4()+'-'+_s4()+'-'+_s4()+'-'+_s4()+_s4()+_s4());
}

function varyAll(conditions, tests) {
    for (var ci = 0, cl = conditions.length; ci < cl; ci++) {
        var condition = conditions[ci];
        describe(condition.description, function() {
            beforeEach(condition.prepare);

            tests();
        });
    }
}

/* conf = {
    [ prepare: function() {...}, ]
    run: function() {},
    [ beforeEnd: function() {...}, ]
    ( until: <state>[, timeout: 2],
      | waitFor: function() {}, )
    then: function() {}
}; */
function withPlayer(player, conf) {
    runs(function() {
        if (conf.prepare) conf.prepare();
        conf.run();
    });

    if (conf.waitFor) {
        waitsFor(conf.waitFor);
    } else {
        if (typeof conf.until === 'undefined') throw new Error('conf.until (value) or conf.waitFor (function) is required');
        waitsFor(function() {
            if (conf.beforeEnd) conf.beforeEnd();
            return player.happens.state === conf.until;
        }, conf.timeout ? conf.timeout*1000 : 2000);
    }

    runs(function() {
        if (conf.then) conf.then();
    });
}