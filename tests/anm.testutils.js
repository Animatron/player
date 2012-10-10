/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _Fake = {};
_Fake.SKIP_EVENTS = 0, // do not listen events
_Fake.CVS_POS = 1, // canvas position
_Fake.JSM_CLOCK = 2, // disable jasmine clock
_Fake.FRAME_GEN = 3; // frame calls

function _fake(what) {
    if (!what) throw new Error('Please specify what to fake');
    what = _arrayFrom(what);
    _each(what, function(option) {
        switch (option) {
            case _Fake.SKIP_EVENTS: __skipEvents(); break;
            case _Fake.CVS_POS: __stubSavePos(); break;
            case _Fake.JSM_CLOCK: __disableJsmClock(); break;
            case _Fake.FRAME_GEN: _mockFrameGen(/*60*/); break;
        }
    });
}

function __skipEvents() { if (window) spyOn(window, 'addEventListener').andCallFake(_mocks._empty); }
function __stubSavePos() { spyOn(anm.Player, '_saveCanvasPos').andCallFake(_mocks.saveCanvasFake); }
function _mockFrameGen(fps) {
    console.log('mocking frame-generator with fps ' + fps);
    if (window) {
        var period = 1000 / (fps || 60);

        function stubFrameGen(callback) {
            console.log('framegen');
            return window.setTimeout(callback, period);
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
            console.log('framerem');
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
function __disableJsmClock() {
    if (jasmine.Clock.isInstalled()) {
        jasmine.Clock.uninstallMock();
    }
}

function _s4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
   return (_s4()+_s4()+'-'+_s4()+'-'+_s4()+'-'+_s4()+'-'+_s4()+_s4()+_s4());
}

function _each(arr, func) {
    for (var i = 0, il = arr.length; i < il; i++) {
        func(arr[i], i);
    }
}

function _arrayFrom(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [ val ];
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

// type-check

function __builder(obj) {
    return (typeof Builder !== 'undefined') &&
           (obj instanceof Builder);
}

function __array(obj) {
    return Array.isArray(obj);
}

function __num(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/* conf = {
    prepare: function() {...} | scene: Object
    do: action | run: function() {},
    [ beforeEnd: function() {...}, ]
    ( until: <state>[, timeout: 2],
      | waitFor: function() {}[, timeout: 2], )
    [ then: function() {} ]
}; */
function doAsync(player, conf) {
    var conf,
        _scene,
        _timeout;

    if (arguments.length === 3) {
        _scene = arguments[1];
        conf = arguments[2];
    } else if (arguments.length === 2) {
        conf = arguments[1];
    } else throw new Error('Not enough arguments');

    if (!_scene) _scene = conf.prepare ? conf.prepare.call(player) : undefined;

    if (_scene) player.load(_scene);
    _timeout = conf.timeout || (_scene ? (_scene.duration + .2) : 2);
    _timeout *= 1000;

    runs(function() {
        if (conf.do) player[conf.do]();
        else if (conf.run) conf.run.call(player);
        else player.play();
    });

    if (conf.waitFor) {
        waitsFor(function() {
            return conf.waitFor.call(player);
        }, _timeout);
    } else {
        var expectedState = (typeof conf.until !== 'undefined') ? conf.until : anm.C.STOPPED;
        waitsFor(function() {
            var finished = (player.state.happens === expectedState);
            if (finished && conf.beforeEnd) conf.beforeEnd.call(player);
            return finished;
        }, _timeout);
    }

    if (conf.afterThat) conf.afterThat.call(player);

    runs(function() {
        if (conf.then) conf.then.call(player);
        player.stop();
    });
}

function travel(f, elms) {
    for (var i = 0; i < elms.length; i++) {
        f(elms[i]);
        travel(f, elms[i].children);
    }
}

// TODO: tests for utils