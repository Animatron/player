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
            expect(elm_v.state.alpha).toBe(1);
            expect(elm_v.bstate.alpha).toBe(0.999);
            elm.opacity(0.756);
            expect(elm_v.state.alpha).toBe(1);
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

            var translateSpy = spyOn(Transform_mock.instance, 'translate');

            elm.pos([5, 15]);

            player.load(elm).drawAt(0);

            expect(translateSpy).toHaveBeenCalledWith(5, 15);
            translateSpy.reset();

            elm.move([7, 215.3]);
            player.drawAt(0);
            expect(translateSpy).toHaveBeenCalledWith(7, 215.3);
            translateSpy.reset();

            elm.trans([2, 4], [[7, 2], [8, 5]]);

            player.drawAt(0);
            expect(translateSpy).toHaveBeenCalledWith(7, 215.3);
            translateSpy.reset();

            player.drawAt(2);
            expect(translateSpy).toHaveBeenCalledWith(14, 217.3);
            translateSpy.reset();

            player.drawAt(3);
            expect(translateSpy).toHaveBeenCalledWith(14.5, 218.8);
            translateSpy.reset();

            player.drawAt(4);
            expect(translateSpy).toHaveBeenCalledWith(15, 220.3);
            translateSpy.reset();
        });

        it("applies base angle change", function() {
            var elm = b(),
                elm_v = elm.v;

            var rotateSpy = spyOn(Transform_mock.instance, 'rotate');

            elm.angle(Math.PI / 4);

            player.load(elm).drawAt(0);

            expect(rotateSpy).toHaveBeenCalledWith(Math.PI / 4);
            rotateSpy.reset();

            elm.slope(Math.PI / 3);
            player.drawAt(0);
            expect(rotateSpy).toHaveBeenCalledWith(Math.PI / 3);
            rotateSpy.reset();

            elm.turn(2 * Math.PI / 3);
            player.drawAt(0);
            expect(rotateSpy).toHaveBeenCalledWith(2 * Math.PI / 3);
            rotateSpy.reset();

            elm.rotate([2, 4], [ Math.PI / 3, 2 * Math.PI / 3 ]);

            player.drawAt(0);
            expect(rotateSpy).toHaveBeenCalledWith(2 * Math.PI / 3);
            rotateSpy.reset();

            player.drawAt(2);
            expect(rotateSpy).toHaveBeenCalledWith(3 * Math.PI / 3);
            rotateSpy.reset();

            player.drawAt(3);
            expect(rotateSpy).toHaveBeenCalledWith(3.5 * Math.PI / 3);
            rotateSpy.reset();

            player.drawAt(4);
            expect(rotateSpy).toHaveBeenCalledWith(4 * Math.PI / 3);
            rotateSpy.reset();
        });

        it("applies base scale change", function() {
            var elm = b(),
                elm_v = elm.v;

            var scaleSpy = spyOn(Transform_mock.instance, 'scale');

            elm.size([2.1, 0.3]);
            // size / resize / proportions

            player.load(elm).drawAt(0);

            expect(scaleSpy).toHaveBeenCalledWith(2.1, 0.3);
            scaleSpy.reset();

            elm.resize([0.8, 5]);
            player.drawAt(0);
            expect(scaleSpy).toHaveBeenCalledWith(0.8, 5);
            scaleSpy.reset();

            elm.proportions([2, 0.65]);
            player.drawAt(0);
            expect(scaleSpy).toHaveBeenCalledWith(2, 0.65);
            scaleSpy.reset();

            elm.scale([2, 4], [[3, 0.2], [6, 4]]);

            player.drawAt(0);
            expect(scaleSpy).toHaveBeenCalledWith(2, 0.65);
            scaleSpy.reset();

            player.drawAt(2);
            expect(scaleSpy).toHaveBeenCalledWith(6, 0.13);
            scaleSpy.reset();

            player.drawAt(3);
            expect(scaleSpy).toHaveBeenCalledWith(9, 0.13+((2.6-0.13)/2));
            scaleSpy.reset();

            player.drawAt(4);
            expect(scaleSpy).toHaveBeenCalledWith(12, 2.6);
            scaleSpy.reset();
        });

        it("applies base alpha change", function() {
            var elm = b(),
                elm_v = elm.v;

            var orig_transform = elm_v.transform;
            var transformSpy = spyOn(elm_v, 'transform').andCallFake();
            function expect_next_alpha(val) {
                transformSpy.andCallFake(function(ctx) {
                    orig_transform.apply(elm_v, arguments);
                    expect(ctx.globalAlpha).toBe(val);
                });
            }

            elm.opacity(0.2);
            expect_next_alpha(0.2);
            player.load(elm).drawAt(0);

            elm.opacity(0.7);
            expect_next_alpha(0.7);
            player.drawAt(0);

            elm.alpha([2, 4], [.5, 2]);

            expect_next_alpha(0.7);
            player.drawAt(0);

            expect_next_alpha(0.35);
            player.drawAt(2);

            expect_next_alpha(0.875);
            player.drawAt(3);

            expect_next_alpha(1.4);
            player.drawAt(4);
        });

        xit("applies all changes done with init()", function() {
            this.fail('TODO');
        });

        xit("applies base time position change", function() {
            this.fail('TODO');
        });

    });

    xdescribe("pivot", function() {

        xit("should be implemented", function() {
            this.fail('TODO');
        });

    });

    // TODO: test normalized paths!
    // TODO: test constants!
    // TODO: test xdata.reg (non-relative shift) among with xdata.pvt (relative shift)
    // TODO: test coordinates in painters

});