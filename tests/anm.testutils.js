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

/* function fillMockWithSpies(mock) {
    for (prop in mock) {
        if (typeof mock[prop] == 'function') {
            mock[prop] = spyOn(mock, prop).andCallThrough();
        }
    }
} */

// TODO: integrate everywhere
/* function withPlayer(player) {
    var toCall = [];
    var stateToWaitFor,
        waitingTime,
        expectations;
    function postponeCall(func) {
        return function() { toCall.push([this, func, arguments]); }
    }
    return {
        play: postponeCall('play'),
        load: postponeCall('load'),
        stop: postponeCall('stop')
        waitToBe: function(state, time) {
            stateToWaitFor = state;
            waitingTime = time;
        },
        andCheck: function(f) { expectations = f; }
        run: function() {
            runs(function() {
                for (var ci = 0, cl = toCall.length; ci < cl; ci++) {
                    var f = toCall[ci];
                    f[0][f[1]].call(f[0], f[2]);
                }
            });

            waitsFor(function() {
                return player.state.happens === stateToWaitFor;
            }, waitingTime * 1000);

            runs(expectations);
        }
    }
} */

// TODO: function(prepareCanvasTest)

/*
       //this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();
*/