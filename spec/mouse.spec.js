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

    // function to fire canvas event

    function fireCanvasEvent(type, x, y) {
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent(type, true, true, window, 1, x, y, x, y, false, false, true, false, 0, null);
        canvas.dispatchEvent(evt);
    }

    // wait for document to be ready

    var documentReady = false;
    document.addEventListener('DOMContentLoaded', function() {
        documentReady = true;
    });

    var customMatchers = prepareCustomMatchers(fireCanvasEvent);

    function setupPlayer(done) {
        if (canvas || wrapper) {
            player.detach(); // will remove the wrapper div from the body
        }

        wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        wrapper.style.position = 'fixed';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
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

        player.load(anim, done).play();
    }

    beforeEach(function(done) {

        jasmine.addMatchers(customMatchers);

        if (documentReady) {
            setupPlayer(done);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setupPlayer(done);
            });
        }

    });

    afterEach(function() {
        player.anim.unsubscribeEvents(canvas);
    });

    describe('handles clicks properly', function() {

        // TODO: split into subtests

        it('passes click event to the Animation', function() {

            expect({ type: 'click', x: 10, y: 10 })
               .toBeHandledAs({ type: 'mouseclick', target: anim, x: 10, y: 10, in: anim });

        });

        it('passes click event to the root element', function() {

            expect({ type: 'click', x: 10, y: 10 })
               .toBeHandledAs({ type: 'mouseclick', target: e11, x: 10, y: 10, in: root });

        });

        it('passes click event to the first subscribed element', function() {

            expect({ type: 'click', x: 10, y: 10 })
               .toBeHandledAs({ type: 'mouseclick', target: e11, x: 10, y: 10 });

            expect({ type: 'click', x: 25, y: 25 })
               .toBeHandledAs({ type: 'mouseclick', target: e11, x: 25, y: 25 });

        });

        it('properly passes click events to corresponding handlers, according to overlaps', function() {

            expect({ type: 'click', x: 75, y: 25 })
               .toBeHandledAs({ type: 'mouseclick', target: e1, x: 75, y: 25 });

            expect({ type: 'click', x: 76, y: 7 })
               .toBeHandledAs({ type: 'mouseclick', target: e12, x: 1, y: 2 });

            expect({ type: 'click', x: 25, y: 47 })
               .toBeHandledAs({ type: 'mouseclick', target: e2, x: 25, y: 2 });

            expect({ type: 'click', x: 75, y: 47 })
               .toBeHandledAs({ type: 'mouseclick', target: e2, x: 75, y: 2 });

        });

    });

    describe('handles moves and in/outs properly', function() {

        // TODO: split into subtests

        it('mouse move is catched by the root element', function() {

            expect({ type: 'mousemove', x: 50, y: 50 })
               .toBeHandledAs({ type: 'mousemove', target: root, x: 50, y: 50 });

        });

        it('catches moving mouse over the root element once', function() {

            expect({ type: 'mousemove', x: 101, y: 101 }); // just move, do not expect anything

            expect({ type: 'mousemove', x: 50, y: 50 })
               .toBeHandledAs({ type: 'mouseover', target: root });

            expect({ type: 'mousemove', x: 51, y: 51 })
               .not.toBeHandledAs({ type: 'mouseover', target: root });

            expect({ type: 'mousemove', x: 52, y: 52 })
               .not.toBeHandledAs({ type: 'mouseover', target: root });

            expect({ type: 'mousemove', x: 101, y: 101 })
               .not.toBeHandledAs({ type: 'mouseover', target: root });

        });

        it('catches moving mouse out of the root element once', function() {

            expect({ type: 'mousemove', x: 50, y: 50 }); // just move, do not expect anything

            expect({ type: 'mousemove', x: 101, y: 101 })
                .toBeHandledAs({ type: 'mouseout', target: root, x: 101, y: 101 });

            expect({ type: 'mousemove', x: 102, y: 102 })
                .not.toBeHandledAs({ type: 'mouseout', target: root });

        });

        it('bubbles and transfers in/out events to the corresponding receivers', function() {

            expect({ type: 'mousemove', x: 25, y: 25 })
                .toBeHandledAs([ { target: e2, type: 'mouseout' },
                                 { target: e1, type: 'mouseover' },
                                 { target: e11, type: 'mouseover' } ]);

            expect({ type: 'mousemove', x: 76, y: 6 })
                .toBeHandledAs([ { target: e11, type: 'mouseout' },
                                 { target: e12, type: 'mouseover' } ]);

            expect({ type: 'mousemove', x: 25, y: 75 })
                .toBeHandledAs([ { target: e12, type: 'mouseout' },
                                 { target: e1, type: 'mouseout' },
                                 { target: e2, type: 'mouseover' } ]);

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

function prepareCustomMatchers(fireCanvasEvent) {
    return {
        toBeHandledAs: function() {
            return {
                compare: function(expected, actual) {
                    //console.log(arguments);

                    var toFire = Array.isArray(expected) ? expected : [ expected ],
                        toTest = Array.isArray(actual) ? actual : [ actual ];

                    var handledEvents = [];
                    var eventSpies = [];


                    // create spies and assign handlers collecting the corresponding events
                    var eventSpy;
                    for (var i = 0; i < toTest.length; i++) {
                        var expectation = toTest[i];
                        var listeningElement = (expectation.in || expectation.target);
                        var targetName = (expectation.target instanceof anm.Animation ? 'animation' : expectation.target.name);
                        eventSpy = jasmine.createSpy(targetName + '-' + expectation.type)
                                          .and.callFake(function(evt) {
                                              handledEvents.push(evt);
                                          });
                        listeningElement.on(expectation.type, eventSpy);
                        eventSpies.push(eventSpy);
                    }
                    expect(toTest.length).toEqual(eventSpies.length);

                    // fire the events in order
                    for (i = 0; i < toFire.length; i++) {
                        var declaration = toFire[i];
                        fireCanvasEvent(declaration.type, declaration.x, declaration.y);
                    }

                    // ensure all events came in expected order and are equal to expectations
                    expect(toTest.length).toEqual(handledEvents.length);
                    for (i = 0; i < handledEvents.length; i++) {
                        delete toTest[i]['in'];
                        expect(handledEvents[i]).toEqual(jasmine.objectContaining(toTest[i]));
                    }

                    // ensure all spice have been called
                    for (i = 0; i < eventSpies.length; i++) {
                        expect(eventSpies[i]).toHaveBeenCalled();
                        eventSpies[i].calls.reset();
                        //expect(eventSpies[i]).toHaveBeenCalledOnce(); ?
                    }

                    return { pass: true }
                }
            }
        }
    }
}
