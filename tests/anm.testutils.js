/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _Fake = {};
_Fake.SKIP_EVENTS = 0; // do not listen events
_Fake.CVS_POS = 1; // canvas position
//_Fake.GET_CANVAS = 2; // asking for canvas
//_Fake.JSM_CLOCK = 3; // disable jasmine clock
//_Fake.FRAME_GEN = 4; // frame calls
//_Fake.IMAGES = 5; // images objects

var _window = jasmine.getGlobal();

var JSON = JSON || Json;

function _fake(what) {
    if (!what) throw new Error('Please specify what to fake');
    what = _arrayFrom(what);
    _each(what, function(option) {
        switch (option) {
            case _Fake.SKIP_EVENTS: __skipEvents(); break;
            case _Fake.CVS_POS: __stubSavePos(); break;
            /* case _Fake.GET_CANVAS: if (what.length > 1) { __stubCanvas(); }
                                      else { return __stubCanvas(); }; break; */
            //case _Fake.JSM_CLOCK: __disableJsmClock(); break;
            //case _Fake.FRAME_GEN: _mockFrameGen(/*60*/); break;
            //case _Fake.IMAGES: __stubImages(); break;
            default: throw new Error('Unknown option ' + option);
        }
    });
}

function __skipEvents() { if (_window) spyOn(_window, 'addEventListener').andCallFake(_mocks._empty); }
function __stubSavePos() { spyOn(anm.Player, '_saveCanvasPos').andCallFake(_mocks.saveCanvasFake); }
// spying on getElementById should be direct not to get bugs like when you don't know where it fails
/*function __stubCanvas() { var canvasStub = _mocks.factory.canvas();
                            spyOn(document, 'getElementById').andReturn(canvasStub);
                            return canvasStub; } */
/* function __stubImages() { spyOn(_window, 'Image').andCallFake(ImgFake); }*/

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

            if (requestSpy) throw new Error(ID_STR + ': Already running a request spy from ' + requestSpy.__fg_id + ', ensure to stop previous one');
            if (cancelSpy)  throw new Error(ID_STR + ': Already running a cancel spy from '  +  cancelSpy.__fg_id + ', ensure to finish stopping generator before');

            var period = 1000 / (fps || 60);

            clock.useMock();
            var timer = clock.defaultFakeTimer;
            Date.now = function() { return timer.nowMillis; }

            // console.log(ID_STR + ': Clock emulation enabled');

            function stubFrameGen(callback) {
                if (!clock.isInstalled()) throw new Error(ID_STR + ': Clock mock is not installed');
                if (opts.synchronous) {
                    clock.tick(period);
                    callback();
                } else {
                    runs(function() {
                        clock.tick(period);
                        callback();
                    });
                }
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

        if (!requestSpy.__fg_id == id) throw new Error(ID_STR + ': ' + requestSpy.__fg_id + ' was launched before stopping this frame-generator, so there is a possible leak');
        if (!cancelSpy.__fg_id == id)  throw new Error(ID_STR + ': ' +  cancelSpy.__fg_id + ' was launched before stopping this frame-generator, so there is a possible leak');

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

function _argsToArray(val) {
    return Array.prototype.slice.call(val);
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

        if (_scene) {
            if (!__array(_scene)) { player.load(_scene); }
            else { player.load.apply(player, _scene); }
        }
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

var AjaxFaker = (function() {

    var started = false;

    var subscribers = {};

    var realXMLHttpRequest = _window.XMLHttpRequest,
        realActiveXObject = _window.ActiveXObject;

    function FakeXMLXttpRequest() {
        this.lastURL = null;
        this.readyState = 4;
        this.status = 200;
    }

    FakeXMLXttpRequest.prototype.open = function(meth, url) { this.lastURL = url; };
    FakeXMLXttpRequest.prototype.send = function() {
        if (!this.lastURL) throw new Error('No request was opened');
        var result = null;
        var _s = subscribers[this.lastURL];
        if (_s) {
            for (var i = 0; i < _s.length; i++) {
                result = _s[i](this.lastURL);
            }
        };
        this.responseText = result;
        if (this.onreadystatechange) this.onreadystatechange({ responseText: result });
    };

    function __start() {
        if (started) throw new Error('Ajax Faker is already started!');
        started = true;

        _window.ActiveXObject = null;

        _window.XMLHttpRequest = FakeXMLXttpRequest;
    }

    function __stop() {
        if (!started) throw new Error('Ajax Faker is already stopped!');
        started = false;

        _window.XMLHttpRequest = realXMLHttpRequest;
        _window.ActiveXObject = realActiveXObject;
    }

    function __subscribe(url, f) {
        if (!subscribers[url]) subscribers[url] = [];
        subscribers[url].push(f);
    }

    /* function __unsubscribe(url) {
        subscribers[url] = null;
    } */

    return { start: __start,
             subscribe: __subscribe,
             /* unsubscribe: __unsubscribe, */
             stop: __stop,
             isStarted: function() { return started; } }

})();

var _running_img_fakes = [];
function ImgFake() {
    this.src = null;
    var me = this;
    me.addEventListener = function() {};
    this.__anm_interval = setInterval(function() {
        if (me.__anm_load_called) return;
        if (me.src != null) {
            me.__anm_load_called = true;
            me.onload();
        }
    }, 200);
    _running_img_fakes.push(this);
    setTimeout(function() {
        if (!me.stopped) {
            clearInterval(me.__anm_interval);
            throw new Error('Please stop ImgFake when you do not need it with ImgFake.__stopFakes static method');
            if (me.src == null) throw new Error('Also, notice that you have not assigned anything to src of the image');
        }
    }, 5000);
}
ImgFake.prototype = Image.prototype;
ImgFake.__stopFakes = function() {
    var i = _running_img_fakes.length;
    while (i--) { var fake = _running_img_fakes[i];
                  clearInterval(fake.__anm_interval);
                  fake.stopped = true; }

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

function __elmInfo(elm) {
    return (elm.name ? elm.name + ': ' : '') +
           '{' + elm.id + '} ' +
           '[' + elm.xdata.lband[0] + ', ' + elm.xdata.lband[1] + '] / ' +
           '[' + elm.xdata.gband[0] + ', ' + elm.xdata.gband[1] + '] ' +
           '(' + elm.duration() + ')';
}

function __deepInfo(elm, level) {
    var result = '\n';
    var prefix = '', level = level || 0, i = level;
    while (i--) prefix += '__';
    result += prefix + ' ' + __elmInfo(elm);
    elm.visitChildren(function(ielm) {
        result += __deepInfo(ielm, level + 1);
    });
    return result;
}

function __builderInfo(bld) {
    return __deepInfo(bld.v);
}

function setCanvasSize(canvas, size) {
    var pxRatio = anm.engine.PX_RATIO || 1;
    canvas.setAttribute('width',  size[0] * pxRatio);
    canvas.setAttribute('height', size[1] * pxRatio);
    canvas.style.width  = size[0] + 'px';
    canvas.style.height = size[1] + 'px';
}
