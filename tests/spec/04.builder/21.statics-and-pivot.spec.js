// file://localhost/Users/shamansir/Workspace/js-player/tests/04.builder.tests.html?spec=static%20modification
// file://localhost/Users/shamansir/Workspace/js-player/tests/04.builder.tests.html?spec=builder%2C%20regarding%20masks
// file://localhost/Users/shamansir/Workspace/js-player/tests/04.builder.tests.html?spec=tweens%20while%20in%20playing%3B%20changed%20base%20state

describe("static modification", function() {

    var b = Builder._$;

    it("by default base state is empty", function() {
        var elm = b(),
            bs = elm.v.bstate;
        expect(bs.x).toBe(0);
        expect(bs.y).toBe(0);
        expect(bs.angle).toBe(0);
        expect(bs.sx).toBe(1);
        expect(bs.sy).toBe(1);
        expect(bs.alpha).toBe(1);
        expect(bs.p).toBe(null);
        expect(bs.t).toBe(null);
        expect(bs.key).toBe(null);
    });

    it("as well as the dynamic state (just to ensure)", function() {
        var elm = b(),
            s = elm.v.state;
        expect(s.x).toBe(0);
        expect(s.y).toBe(0);
        expect(s.angle).toBe(0);
        expect(s.sx).toBe(1);
        expect(s.sy).toBe(1);
        expect(s.alpha).toBe(1);
        expect(s.p).toBe(null);
        expect(s.t).toBe(null);
        expect(s.key).toBe(null);
    });

    describe("allows to change base state as a whole", function() {

        it("changes the whole state with a single call to init()", function() {
            var elm = b();
            var ts = {
                x: 20.5, y: 1355,
                angle: 3 * Math.PI / 2,
                sx: 22.46, sy: 0.015,
                alpha: 0.84,
                // TODO: test p, t, and key
            }
            elm.init(ts);
            var bs = elm.v.bstate;
            expect(bs.x).toBe(ts.x);
            expect(bs.y).toBe(ts.y);
            expect(bs.angle).toBe(ts.angle);
            expect(bs.sx).toBe(ts.sx);
            expect(bs.sy).toBe(ts.sy);
            expect(bs.alpha).toBe(ts.alpha);
        });

        xit("only appends modifications from sequenced init() calls, not overwrites", function() {
            this.fail();
        });

    });

    describe("allows to change base state values individually", function() {

        it("allows to change base position", function() {
            var elm = b(),
                elm_v = elm.v;
            expect(elm_v.state.x).toBe(0);
            expect(elm_v.state.y).toBe(0);
            elm.pos([5, 15]);
            expect(elm_v.state.x).toBe(0);
            expect(elm_v.state.y).toBe(0);
            expect(elm_v.bstate.x).toBe(5);
            expect(elm_v.bstate.y).toBe(15);
            elm.move([6.2, 13]); // alias for .pos()
            expect(elm_v.state.x).toBe(0);
            expect(elm_v.state.y).toBe(0);
            expect(elm_v.bstate.x).toBe(6.2);
            expect(elm_v.bstate.y).toBe(13);
        });

        it("allows to change base angle", function() {
            var elm = b(),
                elm_v = elm.v;
            expect(elm_v.state.angle).toBe(0);
            elm.angle(Math.PI);
            expect(elm_v.state.angle).toBe(0);
            expect(elm_v.bstate.angle).toBe(Math.PI);
            elm.slope(1.2 * Math.PI); // alias for .angle()
            expect(elm_v.state.angle).toBe(0);
            expect(elm_v.bstate.angle).toBe(1.2 * Math.PI);
            elm.turn(2 * Math.PI / 3); // alias for .angle()
            expect(elm_v.state.angle).toBe(0);
            expect(elm_v.bstate.angle).toBe(2 * Math.PI / 3);
        });

        it("allows to change base scale", function() {
            var elm = b(),
                elm_v = elm.v;
            expect(elm_v.state.sx).toBe(1);
            expect(elm_v.state.sy).toBe(1);
            elm.size([7.1, 15]);
            expect(elm_v.state.sx).toBe(1);
            expect(elm_v.state.sy).toBe(1);
            expect(elm_v.bstate.sx).toBe(7.1);
            expect(elm_v.bstate.sy).toBe(15);
            elm.resize([0.25, 11]); // alias for .size()
            expect(elm_v.state.sx).toBe(1);
            expect(elm_v.state.sy).toBe(1);
            expect(elm_v.bstate.sx).toBe(0.25);
            expect(elm_v.bstate.sy).toBe(11);
            elm.proportions([1006.27, 123]); // alias for .size()
            expect(elm_v.state.sx).toBe(1);
            expect(elm_v.state.sy).toBe(1);
            expect(elm_v.bstate.sx).toBe(1006.27);
            expect(elm_v.bstate.sy).toBe(123);
        });

        it("allows to change base alpha", function() {
            var elm = b(),
                elm_v = elm.v;
            expect(elm_v.state.alpha).toBe(1);
            elm.opacity(0.999);
            expect(elm_v.state.alpha).toBe(0);
            expect(elm_v.bstate.alpha).toBe(0.999);
            elm.opacity(0.756);
            expect(elm_v.state.alpha).toBe(0);
            expect(elm_v.bstate.alpha).toBe(0.756);
        });

        xit("allows to change base time position", function() {
            this.fail();
        });

    });

    describe("properly applies base state changes", function() {

        var player;

        var actual_Transform = window.Transform,
            Transform_mock = _mocks.factory.transform();

        beforeEach(function() {
            spyOn(document, 'getElementById').andReturn(_mocks.factory.canvas());
            _fake(_Fake.CVS_POS);

            player = createPlayer('test');
            window.Transform = Transform_mock;
        });

        afterEach(function() {
            window.Transform = actual_Transform;
        });

        it("applies base position change", function() {
            var elm = b(),
                elm_v = elm.v;

            var transSpy = spyOn(Transform_mock.instance, 'translate');

            elm.pos([5, 15]);

            player.load(elm).drawAt(0);

            expect(transSpy).toHaveBeenCalledWith(5, 15);
            transSpy.reset();

            elm.move([7, 215.3]);
            player.drawAt(0);
            expect(transSpy).toHaveBeenCalledWith(7, 215.3);
            transSpy.reset();

            b().trans([2, 4], [[7, 2], [8, 3]]);

            player.drawAt(0);
            expect(transSpy).toHaveBeenCalledWith(7, 215.3);
            transSpy.reset();

            player.drawAt(2);
            expect(transSpy).toHaveBeenCalledWith(7, 17);
            transSpy.reset();

            player.drawAt(4);
            expect(transSpy).toHaveBeenCalledWith(10, 18);
            transSpy.reset();
        });

        it("applies base angle change", function() {
            this.fail('TODO');
        });

        it("applies base scale change", function() {
            this.fail('TODO');
        });

        it("applies base alpha change", function() {
            this.fail('TODO');
        });

        xit("applies base time position change", function() {
            this.fail('TODO');
        });

        it("applies all changes done with init()", function() {
            this.fail('TODO');
        });

    });

    it("should be implemented", function() {

        // TODO: remove lx & ly, rx & ry ?
    });

});

/* // base (initial) state of the element
Element.createBaseState = function() {
    return { 'x': 0, 'y': 0,   // dynamic position
             'angle': 0,       // rotation angle
             'sx': 1, 'sy': 1, // scale by x / by y
             'alpha': 1,       // opacity
             'p': null, 't': null, 'key': null };
                               // cur local time (p) or 0..1 time (t) or by key (p have highest priority),
                               // if both are null — stays as defined
}
// state of the element
Element.createState = function(owner) {
    return { 'x': 0, 'y': 0,   // dynamic position
             'lx': 0, 'ly': 0, // static position
             'rx': 0, 'ry': 0, // registration point shift
             'angle': 0,       // rotation angle
             'sx': 1, 'sy': 1, // scale by x / by y
             'alpha': 1,       // opacity
             'p': null, 't': null, 'key': null,
                               // cur local time (p) or 0..1 time (t) or by key (p have highest priority),
                               // if both are null — stays as defined
             '_matrix': new Transform(),
             '_evts': {},
             '_evt_st': 0,
             '$': owner };
}; */