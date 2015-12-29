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

    var canvas;

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

    function setupPlayer() {
        var canvas = document.createElement('canvas');
        document.body.appendChild(canvas);

        var player = new anm.Player(canvas, {
                        controlsEnabled: false,
                        infiniteDuration: true,
                        handleEvents: true
                     });
        player.load(anim);

        canvas.addEventListener('click', function() { console.log(arguments); });

        fireCanvasEvent('click', 50, 75);
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

    it('works', function() { expect(true).toBeTruthy(); });

});
