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
    | +-e2-------------------------------------------------+ |
    | |                                                    | |
    | |                                                    | |
    | |                                                    | |
    | |                                                 50 | |
    | |                                                    | |
    | |                                                    | |
    | |                                                    | |
    | +----------------------------------------------------+ |
    +--------------------------------------------------------+
 */

describe('handling mouse', function() {

    // build scene

    var anim = new anm.Animation();
    var root = new anm.Element('root');
    var e1 = new anm.Element('e1');
    var e2 = new anm.Element('e2');
    var e11 = new anm.Element('e11');
    var e12 = new anm.Element('e12');

    root.add(e1)
    root.add(e2);
    e1.add(e11);
    e1.add(e12);

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

    function stringifyMouseEvent(evt) {
        return evt.type + ':' + evt.target.getPath() + '@' + evt.x + ';' + evt.y;
    }

    var ANM_TO_CVS_EVT = {
        'mouseclick': 'click'
    };

    function expectToHandle(target, type, x, y, definition) {
        var eventSpy = jasmine.createSpy(target.name + '-' + type).and.callFake(function(evt) {
            expect(stringifyMouseEvent(evt)).toBe('mouseclick:anim@10,10');
        });

        target.on(type, eventSpy);

        fireCanvasEvent(ANM_TO_CVS_EVT[type], x, y);

        expect(eventSpy).toHaveBeenCalled();
    };

    function setupPlayer() {
        if (!canvas) {
            wrapper = document.createElement('div');
            document.body.appendChild(wrapper);
        } else {
            player.detach();
        }

        player = new anm.Player();

        player.init(wrapper, {
                        controlsEnabled: false,
                        infiniteDuration: true,
                        handleEvents: true,
                        width: 200,
                        height: 200
                    });

        canvas = wrapper.getElementsByTagName('canvas')[0];

        player.load(anim);
    }

    beforeEach(function(done) {

        if (documentReady) {
            setupPlayer();
            done();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setupPlayer();
                done();
            });
        }

    });

    it('animation handles clicks', function() {

        expectToHandle(anim, 'mouseclick', 10, 10,
                       'mouseclick:anim@10,10');

    });

    it('root handles clicks', function() {

        expectToHandle(root, 'mouseclick', 10, 10,
                       'mouseclick:root@10,10');


    });

});
