prettify();

describe('handling mouse in static objects', function() {

    function buildSimpleAnimation() {
        var anim = new anm.Animation();
        var rect = new anm.Element('rect');

        rect.path(rectangle(0, 0, 20, 20)).move(75, 5).pivot(0, 0);

        anim.add(rect);
        anim.setDuration(10);

        return {
            anim: anim,
            rect: rect
        }
    }

    function buildLayeredAnimation() {
        var anim = new anm.Animation();
        var root = new anm.Element('root');
        var e1 = new anm.Element('e1');
        var e11 = new anm.Element('e11');
        var e12 = new anm.Element('e12');
        var e2 = new anm.Element('e2');
        var e21 = new anm.Element('e21');

        root.path(rectangle(0, 0, 100, 100)).pivot(0, 0);
        e1.path(rectangle(0, 0, 100, 50)).pivot(0, 0);
        e11.path(rectangle(0, 0, 50, 50)).pivot(0, 0);
        e12.path(rectangle(0, 0, 5, 5)).move(75, 5).pivot(0, 0);
        e2.path(rectangle(0, 0, 100, 55)).move(0, 45).pivot(0, 0);
        e21.path(rectangle(0, 0, 100, 55)).move(0, 0).pivot(0, 0);

        /* TODO: test with
        root.path(rectangle(0, 0, 100, 100)).pivot(0, 0);
        e1.path(rectangle(0, 0, 100, 50)).pivot(0, 0);
        e11.path(rectangle(0, 0, 50, 50)).pivot(0, 0);
        e12.path(rectangle(75, 5, 5, 5)).pivot(0, 0);
        e2.path(rectangle(0, 45, 100, 55)).pivot(0, 0);
        */

        e1.add(e11);
        e1.add(e12);
        e2.add(e21);
        root.add(e1)
        root.add(e2);

        anim.add(root);

        anim.setDuration(10);

        return {
            anim: anim,
            root: root,
            e1: e1, e11: e11, e12: e12,
            e2: e2, e21: e21
        }
    }

    function buildAnimationWithGroups() {
        var anim = new anm.Animation(),
            group = new anm.Element('group'),
            child1 = new anm.Element('child1'),
            child2 = new anm.Element('child2'),
            notChild = new anm.Element('notChild');

        child1.path(rectangle(0, 0, 20, 20)).move(40, 40).pivot(0, 0);
        child2.path(rectangle(0, 0, 30, 30)).move(50, 50).pivot(0, 0);
        notChild.path(rectangle(0, 0, 5, 5)).move(50, 50).pivot(0, 0);

        group.add(child1);
        group.add(child2);

        anim.add(group);
        anim.add(notChild);
        anim.setDuration(10);

        return {
            anim: anim,
            group: group, child1: child1, child2: child2,
            notChild: notChild
        }
    }

    function rectangle(x, y, width, height) {
        return new anm.Path().move(x,y)
                             .line(width,x).line(width,height)
                             .line(y,height).line(x,y);
    }

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

    function setupPlayer(anim, done) {
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
        | |  +- e21 fully covers e2 --                         | |
        | |  |                                                 | |
        | |  |                                                 | |
        | |  |                                              55 | |
        | |  |                                                 | |
        | |  |                                                 | |
        | |  +-----------------------                          | |
        | +----------------------------------------------------+ |
        +--------------------------------------------------------+

     */

    describe('layered animation', function() {

        var anim;
        var root, e1, e11, e12, e2, e21;

        beforeEach(function(done) {

            animData = buildLayeredAnimation();

            anim = animData.anim;
            root = animData.root;
            e1 = animData.e1; e11 = animData.e11; e12 = animData.e12;
            e2 = animData.e2; e21 = animData.e21;

            if (documentReady) {
                setupPlayer(anim, done);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    setupPlayer(anim, done);
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

            var log;

            beforeEach(function() {
                log = new EventLog([ root, e1, e2, e11, e12, e21 ], [ 'mouseclick' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('passes click event to the appropriate element', function() {

                fireCanvasEvent('click', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mouseclick@25;25 -> e11' ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 75, 25);
                // e1 is an empty container so it fires no events
                expect(log.stringify(MARKER)).toEqual([ ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 25, 47);
                expect(log.stringify(MARKER)).toEqual([ 'e21: mouseclick@25;2 -> e21' ].join(MARKER));

            });

            it('keeps passing click event to the subscribed element', function() {

                fireCanvasEvent('click', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mouseclick@10;10 -> e11' ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mouseclick@25;25 -> e11' ].join(MARKER));

            });

            it('properly passes click events to corresponding handlers, according to overlaps', function() {

                fireCanvasEvent('click', 76, 7);
                expect(log.stringify(MARKER)).toEqual([ 'e12: mouseclick@1;2 -> e12' ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 25, 47);
                expect(log.stringify(MARKER)).toEqual([ 'e21: mouseclick@25;2 -> e21' ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 75, 47);
                expect(log.stringify(MARKER)).toEqual([ 'e21: mouseclick@75;2 -> e21' ].join(MARKER));

            });

            it('properly dispatches click events to the parent', function() {
                fireCanvasEvent('click', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mouseclick@25;25 -> e11' ].join(MARKER));

                log.clear(); log.unsubscribe([e11], ['mouseclick']);

                fireCanvasEvent('click', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'e1: mouseclick@25;25 -> e1' ].join(MARKER));

                log.clear(); log.unsubscribe([e1], ['mouseclick']);

                fireCanvasEvent('click', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'root: mouseclick@25;25 -> root' ].join(MARKER));

                log.clear(); log.unsubscribe([root], ['mouseclick']);

                fireCanvasEvent('click', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ ].join(MARKER));
            });

        });

        describe('handles moves and enter/exits & move properly', function() {

            var MARKER = '\n';

            var log;

            beforeEach(function() {
                log = new EventLog([ root, e1, e11, e12, e2, e21 ],
                                   [ 'mouseenter', 'mouseexit', 'mousemove' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('in/out events properly work in sequences', function() {

                fireCanvasEvent('mousemove', 25, 75);
                expect(log.stringify(MARKER)).toEqual([ 'root: mouseenter@null;null -> e21',
                                                        'e2: mouseenter@null;null -> e21',
                                                        'e21: mouseenter@null;null -> e21',
                                                        'e21: mousemove@25;30 -> e21' ].join(MARKER));

                log.clear();

                fireCanvasEvent('mousemove', 25, 75);
                expect(log.stringify(MARKER)).toEqual('');

                fireCanvasEvent('mousemove', 26, 76);
                expect(log.stringify(MARKER)).toEqual([ 'e21: mousemove@26;31 -> e21' ].join(MARKER));

                log.clear();

                fireCanvasEvent('mousemove', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'e21: mouseexit@null;null -> e21',
                                                        'e2: mouseexit@null;null -> e21',
                                                        'e1: mouseenter@null;null -> e11',
                                                        'e11: mouseenter@null;null -> e11',
                                                        'e11: mousemove@25;25 -> e11' ].join(MARKER));

                log.clear();

                fireCanvasEvent('mousemove', 76, 6);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mouseexit@null;null -> e11',
                                                        'e12: mouseenter@null;null -> e12',
                                                        'e12: mousemove@1;1 -> e12' ].join(MARKER));

                log.clear();

                fireCanvasEvent('mousemove', 25, 75);
                expect(log.stringify(MARKER)).toEqual([ 'e12: mouseexit@null;null -> e12',
                                                        'e1: mouseexit@null;null -> e12',
                                                        'e2: mouseenter@null;null -> e21',
                                                        'e21: mouseenter@null;null -> e21',
                                                        'e21: mousemove@25;30 -> e21' ].join(MARKER));

            });

        });

        describe('test mouse release event', function() {

            var MARKER = '\n';

            var log;

            beforeEach(function() {
                log = new EventLog([ root, e1, e11, e12, e2, e21 ],
                                   [ 'mouseenter', 'mouseexit', 'mouseup', 'mousedown', 'mousemove' ]);
                log.subscribe();
            })

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('handles mouse release and corresponding events in proper order', function() {
                fireCanvasEvent('mousemove', 77, 7);
                fireCanvasEvent('mousedown', 77, 7);
                fireCanvasEvent('mousemove', 25, 6);
                fireCanvasEvent('mouseup', 25, 6);
                expect(log.stringify(MARKER)).toEqual([ 'root: mouseenter@null;null -> e12',
                                                        'e1: mouseenter@null;null -> e12',
                                                        'e12: mouseenter@null;null -> e12',
                                                        'e12: mousemove@2;2 -> e12',
                                                        'e12: mousedown@2;2 -> e12',
                                                        'e12: mouseexit@null;null -> e12',
                                                        'e11: mouseenter@null;null -> e11',
                                                        'e11: mousemove@25;6 -> e11',
                                                        'e12: mouseup@-50;1 -> e12' ].join(MARKER));
            });

        });

        describe('properly passes mousemove events to parent', function() {

            var MARKER = '\n';

            beforeEach(function() {
                log = new EventLog([ root, e1, e11, e12, e2, e21 ],
                                   [ 'mousemove' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('dispatches mousemove event to parent', function() {

                fireCanvasEvent('mousemove', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mousemove@25;25 -> e11' ].join(MARKER));

                log.clear(); log.unsubscribe([e11], ['mousemove']);

                fireCanvasEvent('mousemove', 26, 26);
                expect(log.stringify(MARKER)).toEqual([ 'e1: mousemove@26;26 -> e1' ].join(MARKER));

                log.clear(); log.unsubscribe([e1], ['mousemove']);

                fireCanvasEvent('mousemove', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ 'root: mousemove@25;25 -> root' ].join(MARKER));

                log.clear(); log.unsubscribe([root], ['mousemove']);

                fireCanvasEvent('mousemove', 25, 25);
                expect(log.stringify(MARKER)).toEqual([ ].join(MARKER));

            });

        });

        describe('other types of events', function() {

            var MARKER = '\n';

            beforeEach(function() {
                log = new EventLog([ e11 ],
                                   [ 'mousemove', 'mousedown', 'mouseup', 'mousedoubleclick' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('properly handles mousemove event', function() {
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mousemove@10;10 -> e11' ].join(MARKER));
            });

            it('properly handles mousedown and mouseup events', function() {
                fireCanvasEvent('mousedown', 10, 10);
                fireCanvasEvent('mouseup', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mousedown@10;10 -> e11', 'e11: mouseup@10;10 -> e11' ].join(MARKER));
            });

            it('properly handles doubleclick event', function() {
                fireCanvasEvent('dblclick', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'e11: mousedoubleclick@10;10 -> e11' ].join(MARKER));
            });

        });

    });

    /*                                                          ∞
        +-anim- - - - - - - - - - - - - - - - - - - - - - - - - -
        |
                                            (75,5)
        |                                     +-rect--+
                                              |     20|
        |                                     |       |
                                              +-------+
        |                                         20

      ∞ |                                                                    */

    describe('single-shape animation', function() {

        var anim,
            rect;

        beforeEach(function(done) {

            animData = buildSimpleAnimation();

            anim = animData.anim;
            rect = animData.rect;

            if (documentReady) {
                setupPlayer(anim, done);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    setupPlayer(anim, done);
                });
            }

        });

        afterEach(function() {
            anim.unsubscribeEvents(canvas);
            player.stop();
            anim.reset();
        });

        describe('should properly handle click events in one-element animation', function() {
            var MARKER = '\n';

            beforeEach(function() {
                log = new EventLog([ rect ],
                                   [ 'mouseclick' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('properly fires click to the element', function() {
                fireCanvasEvent('click', 76, 6);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mouseclick@1;1 -> rect' ].join(MARKER));
            });

            it('properly fires click to the element twice', function() {
                fireCanvasEvent('click', 76, 6);
                fireCanvasEvent('click', 77, 7);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mouseclick@1;1 -> rect',
                                                        'rect: mouseclick@2;2 -> rect' ].join(MARKER));
            });

            xit('properly passes click to the parent if element is not subscribed to click', function() {
                log.unsubscribe([ rect ], [ 'mouseclick' ]);

                fireCanvasEvent('click', 76, 6);
                expect(log.stringify(MARKER)).toEqual([ 'root: mouseclick@76;6 -> root' ].join(MARKER));
            });
        });

        describe('should properly handle enter/exit events in one-element animation', function() {

            var MARKER = '\n';

            beforeEach(function() {
                log = new EventLog([ rect ],
                                   [ 'mouseenter', 'mouseexit' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('properly fires enter and exit for the element', function() {
                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mouseenter@null;null -> rect',
                                                        'rect: mouseexit@null;null -> rect' ].join(MARKER));
            });

            it('properly fires enter and exit for the element several times', function() {
                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mouseenter@null;null -> rect',
                                                        'rect: mouseexit@null;null -> rect',
                                                        'rect: mouseenter@null;null -> rect',
                                                        'rect: mouseexit@null;null -> rect' ].join(MARKER));
            });

            it('properly fires mousemove when element is not subscribed to in/outs', function() {
                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mouseenter@null;null -> rect',
                                                        'rect: mouseexit@null;null -> rect',
                                                        'rect: mouseenter@null;null -> rect',
                                                        'rect: mouseexit@null;null -> rect' ].join(MARKER));
            });

        });

        describe('should properly fire mousemove events together with in/outs', function() {
            var MARKER = '\n';

            beforeEach(function() {
                log = new EventLog([ rect ],
                                   [ 'mousemove', 'mouseenter', 'mouseexit' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('properly fires enter and exit with move for the element', function() {
                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mouseenter@null;null -> rect',
                                                        'rect: mousemove@1;1 -> rect',
                                                        'rect: mouseexit@null;null -> rect' ].join(MARKER));
            });

            it('properly fires enter and exit for the element several times', function() {
                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mouseenter@null;null -> rect',
                                                        'rect: mousemove@1;1 -> rect',
                                                        'rect: mouseexit@null;null -> rect',
                                                        'rect: mouseenter@null;null -> rect',
                                                        'rect: mousemove@1;1 -> rect',
                                                        'rect: mouseexit@null;null -> rect' ].join(MARKER));
            });

            it('properly fires only mousemove event at least once', function() {
                log.unsubscribe([ rect ], [ 'mouseenter', 'mouseexit' ]);

                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mousemove@1;1 -> rect' ].join(MARKER));
            });

            it('properly fires only mousemove event several times', function() {
                log.unsubscribe([ rect ], [ 'mouseenter', 'mouseexit' ]);

                fireCanvasEvent('mousemove', 10, 10);
                fireCanvasEvent('mousemove', 76, 6);
                fireCanvasEvent('mousemove', 77, 7);
                fireCanvasEvent('mousemove', 10, 10);
                expect(log.stringify(MARKER)).toEqual([ 'rect: mousemove@1;1 -> rect',
                                                        'rect: mousemove@2;2 -> rect' ].join(MARKER));
            });

        });

    });

    /*
                                                               ∞
        +-group- - - - - - - - - - - - - - - - - - - - - - - - -
        |

        |
               (40,40) 20
        |      +---------+ <-- child1
               | (50,50) |
        |   20 |   +---+--------+
               |   +---+ 5 <------------ this small one (`notChild`) is not in group !!
        |      +---| 5          | 30
                   |            | <-- child2
        |          |            |
                   +------------+
        |                30

      ∞ |                                                                    */

    describe('animation with grouped children', function() {

        var anim,
            group, child1, child2, notChild;

        beforeEach(function(done) {

            animData = buildAnimationWithGroups();

            anim = animData.anim;
            group = animData.group;
            child1 = animData.child1;
            child2 = animData.child2;
            notChild = animData.notChild;

            if (documentReady) {
                setupPlayer(anim, done);
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    setupPlayer(anim, done);
                });
            }

        });

        afterEach(function() {
            anim.unsubscribeEvents(canvas);
            player.stop();
            anim.reset();
        });

        describe('should properly handle events in groups', function() {

            var MARKER = '\n';

            beforeEach(function() {
                log = new EventLog([ group, child1, child2, notChild ],
                                   [ 'mouseclick', 'mouseenter', 'mouseexit' ]);
                log.subscribe();
            });

            afterEach(function() {
                log.unsubscribe();
                log.clear();
            });

            it('properly fires click to the elements in the group and outside', function() {
                fireCanvasEvent('click', 56, 56);
                expect(log.stringify(MARKER)).toEqual([ 'child2: mouseclick@6;6 -> child2' ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 10, 10);
                expect(log.stringify(MARKER)).toEqual('');

                log.clear();

                fireCanvasEvent('click', 42, 45);
                expect(log.stringify(MARKER)).toEqual([ 'child1: mouseclick@2;5 -> child1' ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 62, 65);
                expect(log.stringify(MARKER)).toEqual([ 'child2: mouseclick@12;15 -> child2' ].join(MARKER));

                log.clear();

                fireCanvasEvent('click', 52, 53);
                expect(log.stringify(MARKER)).toEqual([ 'notChild: mouseclick@2;3 -> notChild' ].join(MARKER));
            });

            it('properly fires enter and exit for the element', function() {
                fireCanvasEvent('mousemove', 53, 53);
                fireCanvasEvent('mousemove', 60, 60);
                fireCanvasEvent('mousemove', 56, 56);
                expect(log.stringify(MARKER)).toEqual([ 'notChild: mouseenter@null;null -> notChild',
                                                        'notChild: mouseexit@null;null -> notChild',
                                                        'group: mouseenter@null;null -> child2',
                                                        'child2: mouseenter@null;null -> child2' ].join(MARKER));

                log.clear()

                fireCanvasEvent('mousemove', 53, 53);
                fireCanvasEvent('mousemove', 45, 45);
                expect(log.stringify(MARKER)).toEqual([ 'child2: mouseexit@null;null -> child2',
                                                        'group: mouseexit@null;null -> child2',
                                                        'notChild: mouseenter@null;null -> notChild',
                                                        'notChild: mouseexit@null;null -> notChild',
                                                        'group: mouseenter@null;null -> child1',
                                                        'child1: mouseenter@null;null -> child1' ].join(MARKER));
            });

            it('properly dispatches enter and exit to the parent elements', function() {
                log.unsubscribe([ notChild, child2 ], [ 'mouseenter', 'mouseexit' ]);

                fireCanvasEvent('mousemove', 53, 53);
                fireCanvasEvent('mousemove', 60, 60);
                fireCanvasEvent('mousemove', 56, 56);
                expect(log.stringify(MARKER)).toEqual([ 'group: mouseenter@null;null -> child2' ].join(MARKER));

                log.clear()

                fireCanvasEvent('mousemove', 53, 53);
                fireCanvasEvent('mousemove', 45, 45);
                expect(log.stringify(MARKER)).toEqual([ 'group: mouseexit@null;null -> child2',
                                                        'group: mouseenter@null;null -> child1',
                                                        'child1: mouseenter@null;null -> child1' ].join(MARKER));
            });

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
EventLog.prototype.unsubscribe = function(targets, events) {
    var handlers = this.handlers,
        targets = targets || this.targets,
        events = events || this.events;
    var target, event_type;
    for (var i = 0; i < targets.length; i++) {
        target = targets[i];
        var trg_handlers = handlers[target.id];
        if (!trg_handlers) continue;
        for (var j = 0; j < events.length; j++) {
            event_type = events[j];
            if (typeof trg_handlers[event_type] === 'undefined') continue;
            target.unbind(event_type, trg_handlers[event_type]);
            delete trg_handlers[event_type];
        }
    }
}
