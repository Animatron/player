/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _Fake = {};
_Fake.SKIP_EVENTS = 0; // do not listen events
_Fake.CVS_POS = 1; // canvas position
//_Fake.JSM_CLOCK = 2; // disable jasmine clock
//_Fake.FRAME_GEN = 3; // frame calls

var _window = jasmine.getGlobal();

function _fake(what) {
    if (!what) throw new Error('Please specify what to fake');
    what = _arrayFrom(what);
    _each(what, function(option) {
        switch (option) {
            case _Fake.SKIP_EVENTS: __skipEvents(); break;
            case _Fake.CVS_POS: __stubSavePos(); break;
            //case _Fake.JSM_CLOCK: __disableJsmClock(); break;
            //case _Fake.FRAME_GEN: _mockFrameGen(/*60*/); break;
            default: throw new Error('Unknown option ' + option);
        }
    });
}

function __skipEvents() { if (_window) spyOn(_window, 'addEventListener').andCallFake(_mocks._empty); }
function __stubSavePos() { spyOn(anm.Player, '_saveCanvasPos').andCallFake(_mocks.saveCanvasFake); }

var _FrameGen = (function() {

    var realDateNow = Date.now;

    var requestSpy, cancelSpy;

    var clock = jasmine.Clock;

    function _enable(fps) {

        if (_window) {

            var period = 1000 / (fps || 60);

            clock.useMock();
            var timer = clock.defaultFakeTimer;
            Date.now = function() { return timer.nowMillis; }

            function stubFrameGen(callback) {
                clock.tick(period);
                callback();
                // return _window.setTimeout(callback, period);
            };

            if (_window.requestAnimationFrame) {
                requestSpy = spyOn(_window, 'requestAnimationFrame').andCallFake(stubFrameGen);
            } else if (_window.webkitRequestAnimationFrame) {
                requestSpy = spyOn(_window, 'webkitRequestAnimationFrame').andCallFake(stubFrameGen);
            } else if (_window.mozRequestAnimationFrame) {
                requestSpy = spyOn(_window, 'mozRequestAnimationFrame').andCallFake(stubFrameGen);
            } else if (_window.oRequestAnimationFrame) {
                requestSpy = spyOn(_window, 'oRequestAnimationFrame').andCallFake(stubFrameGen);
            } else if (_window.msRequestAnimationFrame) {
                requestSpy = spyOn(_window, 'msRequestAnimationFrame').andCallFake(stubFrameGen);
            } else if (anm) {
                _window.__anm__frameGen = stubFrameGen;
                requestSpy = spyOn(_window, '__anm__frameGen').andCallThrough();
            } else {
                requestSpy = jasmine.createSpy('request-frame-spy').andCallFake(stubFrameGen);
            }

            function stubFrameRem(id) {
                //if (clock.isInstalled()) clock.uninstallMock();
                //return _window.clearTimeout(id);
            };

            if (_window.cancelAnimationFrame) {
                cancelSpy = spyOn(_window, 'cancelAnimationFrame').andCallFake(stubFrameRem);
            } else if (_window.webkitCancelAnimationFrame) {
                cancelSpy = spyOn(_window, 'webkitCancelAnimationFrame').andCallFake(stubFrameRem);
            } else if (_window.mozCancelAnimationFrame) {
                cancelSpy = spyOn(_window, 'mozCancelAnimationFrame').andCallFake(stubFrameRem);
            } else if (_window.oCancelAnimationFrame) {
                cancelSpy = spyOn(_window, 'oCancelAnimationFrame').andCallFake(stubFrameRem);
            } else if (_window.msCancelAnimationFrame) {
                cancelSpy = spyOn(_window, 'msCancelAnimationFrame').andCallFake(stubFrameRem);
            } else if (anm) {
                _window.__anm__frameRem = stubFrameRem;
                requestSpy = spyOn(_window, '__anm__frameRem').andCallThrough();
            } else {
                cancelSpy = jasmine.createSpy('cancel-frame-spy').andCallFake(stubFrameGen);
            }

        } else throw new Error('No window object');
    }

    function _disable() {
        //if (clock && clock.isInstalled()) clock.uninstallMock();
        Date.now = realDateNow;
        //requestSpy.andCallThrough();
        //cancelSpy.andCallThrough();
    }

    return {
        enabled: false,
        enable: function(fps) { if (this.enabled) throw new Error('Already enabled');
                                _enable(fps); this.enabled = true; },
        disable: function() { if (!this.enabled) throw new Error('Not enabled');
                              _disable(); this.enabled = false; }
    }

})();

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
            beforeEach(condition.prepare); // TODO: rename `prepare` to `before`
            if (condition.after) afterEach(condition.after);

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

function queue(fs) {
    var q = [];
        count = fs.length;
    for (var i = 0; i < count; i++) {
        q.push((function(i) {
            return function(next) {
                return function() {
                    fs[i].call({ next: next });
                };
            }
        })(i));
    }
    while (count--) {
        q[count] = q[count](q[count+1] || null);
    };
    q[0]();
}

function __close(n1, n2, precision) { // matches player implementation
    if (!(precision === 0)) {
        precision = precision || 2;
    }
    var multiplier = Math.pow(10, precision);
    return Math.round(n1 * multiplier) ==
           Math.round(n2 * multiplier);
}

// TODO: tests for utils