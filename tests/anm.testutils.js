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

    var _registry = {};

    var realDateNow = Date.now;

    var requestSpy, cancelSpy;

    var clock = jasmine.Clock;

    function __findBrowserFrameSequencerName(_window) {
             if (_window.requestAnimationFrame)       { return 'requestAnimationFrame'; }
        else if (_window.webkitRequestAnimationFrame) { return 'webkitRequestAnimationFrame'; }
        else if (_window.mozRequestAnimationFrame)    { return 'mozRequestAnimationFrame'; }
        else if (_window.oRequestAnimationFrame)      { return 'oRequestAnimationFrame'; }
        else if (_window.msRequestAnimationFrame)     { return 'msRequestAnimationFrame'; }
        else return null;
    }
    function __findBrowserAnimationStopperName(_window) {
             if (_window.cancelAnimationFrame)       { return 'cancelAnimationFrame'; }
        else if (_window.webkitCancelAnimationFrame) { return 'webkitCancelAnimationFrame'; }
        else if (_window.mozCancelAnimationFrame)    { return 'mozCancelAnimationFrame'; }
        else if (_window.oCancelAnimationFrame)      { return 'oCancelAnimationFrame'; }
        else if (_window.msCancelAnimationFrame)     { return 'msCancelAnimationFrame'; }
        else return null;
    }

    function __id_str(id) {
        return 'Frame-Generator(' + id + ')';
    }

    function _run(id, fps) {
        var ID_STR = __id_str(id);
        var INSTANCE = _registry[id];

        var opts = INSTANCE.opts;

        // // console.log('Running ' + ID_STR + ' with FPS ' + fps);

        var consoleMode = false;

        if (INSTANCE.running) throw new Error(ID_STR + ' is already running!');

        if (_window) {

            if (requestSpy) throw new Error(ID_STR + ': Already running a request spy from ' + requestSpy.__fg_id);
            if (cancelSpy)  throw new Error(ID_STR + ': Already running a cancel spy from '  +  cancelSpy.__fg_id);

            var period = 1000 / (fps || 60);

            clock.useMock();
            var timer = clock.defaultFakeTimer;
            Date.now = function() { return timer.nowMillis; }

            // console.log(ID_STR + ': Clock emulation enabled');

            function stubFrameGen(callback) {
                if (!clock.isInstalled()) throw new Error(ID_STR + ': Clock mock is not installed');
                //if (!consoleMode) {
                var doSyncWay = (consoleMode && opts.console && opts.console.synchronous) ||
                                (!consoleMode && opts.browser && opts.browser.synchronous);
                if (doSyncWay) {
                    clock.tick(period);
                    callback();
                } else {
                    runs(function() {
                        clock.tick(period);
                        callback();
                    });
                }
                /*} else {
                    var finished, error;
                    runs(function() {
                        try {
                            clock.tick(period);
                            callback();
                            finished = true;
                        } catch(e) {
                            //console.log(e);
                            error = e;
                        }
                    });
                    //waitsFor(function() { return finished || error }, 1000);
                    //runs(function() { if (error) throw error; });
                }*/
                // return _window.setTimeout(callback, period);
            };

            var sequencerName = __findBrowserFrameSequencerName(_window);

            if (sequencerName) { // we're in browser
                // console.log(ID_STR + ': emulating frame generator with browser ' + sequencerName);
                requestSpy = spyOn(_window, sequencerName).andCallFake(stubFrameGen);
            } else if (anm) {
                // console.log(ID_STR + ': no browser generator found, but anm namespace exists, subscribing __anm__frameGen');
                _window.__anm__frameGen = stubFrameGen;
                requestSpy = spyOn(_window, '__anm__frameGen').andCallThrough();
                consoleMode = true;
            } else throw new Error(ID_STR + ': no native generator found to attach spy to'); /*{
                // console.log(ID_STR + ': no generator found at all, creating own spy');
                requestSpy = jasmine.createSpy('request-frame-spy').andCallFake(stubFrameGen);
            }*/
            requestSpy.__fg_id = id;

            function stubFrameRem(id) {
                if (!clock.isInstalled()) throw new Error(ID_STR + ': Clock mock is not installed');
                clock.reset();
                //return _window.clearTimeout(id);
                //forcedOff = true;
            };

            var removerName = __findBrowserAnimationStopperName(_window);

            if (removerName) { // we're in browser
                // console.log(ID_STR + ': emulating frame stopper with browser ' + removerName);
                cancelSpy = spyOn(_window, removerName).andCallFake(stubFrameRem);
            } else if (anm) {
                // console.log(ID_STR + ': no browser stopper found, but anm namespace exists, subscribing __anm__frameRem');
                _window.__anm__frameRem = stubFrameRem;
                cancelSpy = spyOn(_window, '__anm__frameRem').andCallThrough();
            } else throw new Error(ID_STR + ': no native frame-remover found to attach spy to'); /* {
                // console.log(ID_STR + ': no stopper found at all, creating own spy');
                cancelSpy = jasmine.createSpy('cancel-frame-spy').andCallFake(stubFrameRem);
            } */
            cancelSpy.__fg_id = id;

            INSTANCE.running = true;

            return INSTANCE;

        } else throw new Error(ID_STR + ': No window object');
    }

    function _stop(id) {
        var ID_STR = __id_str(id);
        var INSTANCE = _registry[id];

        // console.log('Stopping ' + ID_STR);

        if (!INSTANCE.running) throw new Error(ID_STR + ' is already stopped!');

        if (!requestSpy.__fg_id == id) throw new Error(ID_STR + ': ' + requestSpy.__fg_id + ' was launched before stopping this frame-generator');
        if (!cancelSpy.__fg_id == id)  throw new Error(ID_STR + ': ' +  cancelSpy.__fg_id + ' was launched before stopping this frame-generator');

        // console.log(ID_STR + ': Clock emulation disabled');

        Date.now = realDateNow;

        requestSpy = null;
        cancelSpy  = null;

        INSTANCE.running = false;

        return INSTANCE;
    }

    function _destroy(id) {
        var ID_STR = __id_str(id);
        var INSTANCE = _registry[id];

        // console.log('Destroying ' + ID_STR);

        if (INSTANCE.running) throw new Error(ID_STR + ' is running, cannot destroy!');

        _registry[id] = null;

        return INSTANCE;
    }

    function _create(id, opts) {
        var ID_STR = __id_str(id);
        // console.log('Creating ' + ID_STR);

        if (_registry[id]) throw new Error(ID_STR + ' already exists');
        var instance = {
            id: id,
            opts: opts || {},
            running: false,
            run: function(fps) { return _run(id, fps); },
            stop: function() { return _stop(id); },
            destroy: function() { return _destroy(id); }
        };
        _registry[id] = instance;
        return instance;
    }

    return {
        spawn: function(opts) {
            return _create(guid(), opts);
        }
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
        describe(condition.description, (function(condition) { return function() {
            beforeEach(condition.prepare); // TODO: rename `prepare` to `before`
            if (condition.after) afterEach(condition.after);

            tests();
        } })(condition));
    }
}

/* function varyAll(conditions, tests) {
    for (var ci = 0, cl = conditions.length; ci < cl; ci++) {
        var condition = conditions[ci];
        it(condition.description, (function(condition) { return function() {
            condition.prepare(); // TODO: rename `prepare` to `before`

            tests();

            if (condition.after) condition.after();
        } })(condition));
    }
} */

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
    [ then: function() {} ],
    [ onerror: function(err) {} ]
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

    var _errors = [];

    function reportOrThrow(err) {
        if (conf.onerror) { conf.onerror(err); _errors.push(err); }
        else { throw err; };
    }
    function thereWereErrors() { return _errors.length > 0; }

    try {
        if (!_scene) _scene = conf.prepare ? conf.prepare.call(player) : undefined;

        if (_scene) player.load(_scene);
        _timeout = conf.timeout || (_scene ? (_scene.duration + .2) : 2);
        _timeout *= 1000;
    } catch(err) { reportOrThrow(err); }

    runs(function() {
        if (thereWereErrors()) return;
        try {
            if (conf.do) player[conf.do]();
            else if (conf.run) conf.run.call(player);
            else player.play();
        } catch(err) { reportOrThrow(err); }
    });

    if (conf.waitFor) {
        waitsFor(function() {
            if (thereWereErrors()) return true;
            try {
               return conf.waitFor.call(player);
            } catch(err) { reportOrThrow(err); }
        }, _timeout);
    } else {
        var expectedState = (typeof conf.until !== 'undefined') ? conf.until : anm.C.STOPPED;
        waitsFor(function() {
            if (thereWereErrors()) return true;
            try {
                var finished = (player.state.happens === expectedState);
                if (finished && conf.beforeEnd) conf.beforeEnd.call(player);
                return finished;
            } catch(err) { reportOrThrow(err); }
        }, _timeout);
    }

    runs(function() {
        if (thereWereErrors()) return;
        try {
            if (conf.afterThat) conf.afterThat.call(player);
        } catch(err) { reportOrThrow(err); }
    });

    runs(function() {
        if (thereWereErrors()) return;
        try {
            if (conf.then) conf.then.call(player);
            player.stop();
        } catch(err) { reportOrThrow(err); }
    });

}

/*function asyncSeq() {
    var fs = arguments,
        player = fs[0],

    if (!player) throw new Error('Please pass error');

}*/

// FIMXE: in doAsync, if you specify both scene as argument and conf.prepare, conf.prepare
//        will be silently not called

// TODO: some function to mock just everything required to create player and return it

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