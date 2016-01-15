/*
                                100
    +-root---------------------------------------------------+
    | +-e1-------------------------------------------------+ |
    | | +-e11--------------------+      (75,5)             | |
    | | |                        |        +-e12--+         | |
    | | |                        |        |     5|         | |
    | | |                     50 |        +------+      50 | |
    | | |                        |            5            | |
    | | |          50            |                         | |
    | | +------------------------+                         | |
    | +----------------------------------------------------+ |  100
    | +-e2 (0, 45) overlaps with e1------------------------+ |
    | |                                                    | |
    | |                                                    | |
    | |                                                    | |
    | |                                                 55 | |
    | |                                                    | |
    | |                                                    | |
    | |                                                    | |
    | +----------------------------------------------------+ |
    +--------------------------------------------------------+
 */

prettify();

describe('handling mouse in static objects', function() {

    // build scene

    var anim = new anm.Animation();
    var root = new anm.Element('root');
    var e1 = new anm.Element('e1');
    var e2 = new anm.Element('e2');
    var e11 = new anm.Element('e11');
    var e12 = new anm.Element('e12');

    function rectangle(x, y, width, height) {
        return new anm.Path().move(x,y)
                             .line(width,x).line(width,height)
                             .line(y,height).line(x,y);
    }

    root.path(rectangle(0, 0, 100, 100)).pivot(0, 0);
    e1.path(rectangle(0, 0, 100, 50)).pivot(0, 0);
    e11.path(rectangle(0, 0, 50, 50)).pivot(0, 0);
    e12.path(rectangle(0, 0, 5, 5)).move(75, 5).pivot(0, 0);
    e2.path(rectangle(0, 0, 100, 55)).move(0, 45).pivot(0, 0);

    /* TODO: test with
    root.path(rectangle(0, 0, 100, 100)).pivot(0, 0);
    e1.path(rectangle(0, 0, 100, 50)).pivot(0, 0);
    e11.path(rectangle(0, 0, 50, 50)).pivot(0, 0);
    e12.path(rectangle(75, 5, 5, 5)).pivot(0, 0);
    e2.path(rectangle(0, 45, 100, 55)).pivot(0, 0);
    */

    e1.add(e11);
    e1.add(e12);
    root.add(e1)
    root.add(e2);

    anim.add(root);

    anim.setDuration(10);

    var player;

    var canvas, wrapper;

    var CANVAS_X = 100,
        CANVAS_Y = 100;

    // function to fire canvas event

    function fireCanvasEvent(type, x, y) {
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent(type, true, true, window, 1,
                           x + CANVAS_X, y + CANVAS_Y, x + CANVAS_X, y + CANVAS_Y,
                           false, false, true, false, 0, null);
        canvas.dispatchEvent(evt);
    }

    // wait for document to be ready

    var documentReady = false;
    document.addEventListener('DOMContentLoaded', function() {
        documentReady = true;
    });

    function setupPlayer(done) {
        if (canvas || wrapper) {
            player.detach(); // will remove the wrapper div from the body
        }

        wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        wrapper.style.position = 'fixed';
        wrapper.style.top = CANVAS_X + 'px'; // test adapting canvas coordinates
        wrapper.style.left = CANVAS_Y + 'px'; // test adapting canvas coordinates
        wrapper.style.visibility = 'hidden';

        player = new anm.Player();

        player.init(wrapper, {
                        controlsEnabled: false,
                        infiniteDuration: true,
                        handleEvents: true,
                        autoPlay: true,
                        width: 200,
                        height: 200
                    });

        canvas = wrapper.getElementsByTagName('canvas')[0];

        player.load(anim, function() {
            player.play();
            done();
            //setTimeout(done, 100); // ensure at least one frame was rendered
        });
    }

    beforeEach(function(done) {

        if (documentReady) {
            setupPlayer(done);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setupPlayer(done);
            });
        }

    });

    afterEach(function() {
        anim.unsubscribeEvents(canvas);
        player.stop();
        anim.reset();
    });

    describe('handles clicks properly', function() {

        var MARKER = '\n';

        var targets = [ root, e1, e2, e11, e12 ];
        var events = [ 'mouseclick' ];

        var log = new EventLog(targets, events);

        beforeEach(function() {
            log.subscribe();
        });

        afterEach(function() {
            log.unsubscribe();
            log.clear();
        });

        it('passes click event to the appropriate element', function() {

            fireCanvasEvent('click', 10, 10);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mouseclick@10;10 -> e11' ].join(MARKER));

        });

        it('keeps passing click event to the subscribed element', function() {

            fireCanvasEvent('click', 10, 10);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mouseclick@10;10 -> e11' ].join(MARKER));

            log.clear();

            fireCanvasEvent('click', 25, 25);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mouseclick@25;25 -> e11' ].join(MARKER));

        });

        it('properly passes click events to corresponding handlers, according to overlaps', function() {

            fireCanvasEvent('click', 75, 25);
            expect(log.stringify(MARKER)).toEqual([ 'e1: mouseclick@75;25 -> e1' ].join(MARKER));

            log.clear();

            fireCanvasEvent('click', 76, 7);
            expect(log.stringify(MARKER)).toEqual([ 'e12: mouseclick@1;2 -> e12' ].join(MARKER));

            log.clear();

            fireCanvasEvent('click', 25, 47);
            expect(log.stringify(MARKER)).toEqual([ 'e2: mouseclick@25;2 -> e2' ].join(MARKER));

            log.clear();

            fireCanvasEvent('click', 75, 47);
            expect(log.stringify(MARKER)).toEqual([ 'e2: mouseclick@75;2 -> e2' ].join(MARKER));

        });

    });

    describe('handles moves and in/outs properly', function() {

        var MARKER = '\n';

        var targets = [ root, e1, e2, e11, e12 ];
        var events = [ 'mouseenter', 'mouseexit' ];

        var log = new EventLog(targets, events);

        beforeEach(function() {
            log.subscribe();
        });

        afterEach(function() {
            log.unsubscribe();
            log.clear();
        });

        /* it('transfers in/out event to the corresponding receivers', function() {
            expect({ type: 'mousemove', x: 25, y: 75 })
                .toBeHandledAs([ { in: e2,   target: e2, type: 'mouseenter', x: 25, y: 30 },
                                 { in: root, target: e2, type: 'mouseenter', x: 25, y: 30 } ]);

            fireCanvasEvent('mousemove', 10, 10);
        }); */

        it('in/out events properly work in sequences', function() {

            fireCanvasEvent('mousemove', 25, 75);
            expect(log.stringify(MARKER)).toEqual([ 'root: mouseenter@25;30 -> e2',
                                                    'e2: mouseenter@25;30 -> e2' ].join(MARKER));

            log.clear();

            fireCanvasEvent('mousemove', 25, 75);
            expect(log.stringify(MARKER)).toEqual('');

            fireCanvasEvent('mousemove', 26, 76);
            expect(log.stringify(MARKER)).toEqual('');

            fireCanvasEvent('mousemove', 25, 25);
            expect(log.stringify(MARKER)).toEqual([ 'e2: mouseexit@null;null -> e2',
                                                    'e1: mouseenter@25;25 -> e11',
                                                    'e11: mouseenter@25;25 -> e11' ].join(MARKER));

            log.clear();

            fireCanvasEvent('mousemove', 76, 6);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mouseexit@null;null -> e11',
                                                    'e12: mouseenter@1;1 -> e12' ].join(MARKER));

            log.clear();

            fireCanvasEvent('mousemove', 25, 75);
            expect(log.stringify(MARKER)).toEqual([ 'e12: mouseexit@null;null -> e12',
                                                    'e1: mouseexit@null;null -> e12',
                                                    'e2: mouseenter@25;30 -> e2' ].join(MARKER));

        });

    });

    describe('other types of events', function() {

        var MARKER = '\n';

        var targets = [ root, e1, e2, e11, e12 ];
        var events = [ 'mousemove', 'mousedown', 'mouseup', 'mousedoubleclick' ];

        var log = new EventLog(targets, events);

        beforeEach(function() {
            log.subscribe();
        });

        afterEach(function() {
            log.unsubscribe();
            log.clear();
        });

        it('properly handles mousemove event', function() {
            fireCanvasEvent('mousemove', 10, 10);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mousemove@10;10 -> e11',
                                                    'e1: mousemove@10;10 -> e1',
                                                    'root: mousemove@10;10 -> root' ].join(MARKER));
        });

        it('properly handles mousedown event', function() {
            fireCanvasEvent('mousedown', 10, 10);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mousedown@10;10 -> e11',
                                                    'e1: mousedown@10;10 -> e1',
                                                    'root: mousedown@10;10 -> root' ].join(MARKER));
        });

        it('properly handles mouseup event', function() {
            fireCanvasEvent('mouseup', 10, 10);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mouseup@10;10 -> e11',
                                                    'e1: mouseup@10;10 -> e1',
                                                    'root: mouseup@10;10 -> root' ].join(MARKER));
        });

        it('properly handles doubleclick event', function() {
            fireCanvasEvent('dblclick', 10, 10);
            expect(log.stringify(MARKER)).toEqual([ 'e11: mousedoubleclick@10;10 -> e11',
                                                    'e1: mousedoubleclick@10;10 -> e1',
                                                    'root: mousedoubleclick@10;10 -> root' ].join(MARKER));
        });

    });

});

xdescribe('handling mouse in transformed objects', function() {
});

xdescribe('handling mouse in animated objects', function() {
});

function prettify() {
    anm.Animation.prototype.jasmineToString = function() {
        return '[ Animation' + (this.name ? ' ' + this.name : '') + ' ]';
    }

    anm.Element.prototype.jasmineToString = function() {
        return '[ Element' + (this.name ? ' ' + this.name : '') + ' ' + this.id + ' ]';
    }

    anm.Scene.prototype.jasmineToString = function() {
        return '[ Scene' + (this.name ? ' ' + this.name : '') + ' ' + this.id + ' ]';
    }

}

function EventLog(targets, events) {
    this.log = [];
    this.handlers = {};
    this.targets = targets;
    this.events = events;
}
EventLog.prototype.add = function(target, eventType, event) {
    this.log.push(target.name + ': ' + eventType + '@' + event.x + ';' + event.y + (event.target ? ' -> ' + event.target.name : ''));
}
EventLog.prototype.clear = function() {
    this.log = [];
}
EventLog.prototype.stringify = function(marker) {
    return this.log.join(marker)
}
EventLog.prototype.subscribe = function() {
    var eventLog = this;
    var handlers = this.handlers,
        targets = this.targets,
        events = this.events;
    var target, handler_id, event_type;
    for (var i = 0; i < targets.length; i++) {
        target = targets[i];
        handlers[target.id] = {};
        for (var j = 0; j < events.length; j++) {
            event_type = events[j];
            handler_id = target.on(event_type, (function(event_type, target) {
                return function(evt) {
                    eventLog.add(target, event_type, evt);
                };
            })(event_type, target));
            handlers[target.id][event_type] = handler_id;
        }
    }
}
EventLog.prototype.unsubscribe = function() {
    var handlers = this.handlers,
        targets = this.targets,
        events = this.events;
    var target, event_type;
    for (var i = 0; i < targets.length; i++) {
        target = targets[i];
        var trg_handlers = handlers[target.id];
        for (var j = 0; j < events.length; j++) {
            event_type = events[j];
            target.unbind(event_type, trg_handlers[event_type]);
        }
    }
}
