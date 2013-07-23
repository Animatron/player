/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("builder, regarding its formation techniques,", function() {

    var b = Builder._$,
        B = Builder;

    describe("when creating with no parameters,", function() {

        var instance;

        beforeEach(function() { instance = b(); });

        it("should init with no name", function() {
            expect(instance.n).toBe('');
        });

        it("should init with new element", function() {
            expect(instance.v).toBeDefined();
            expect(instance.v).toEqual(jasmine.any(anm.Element));
            expect(instance.v.parent).toBe(null);
            expect(instance.v.scene).toBe(null);
            expect(instance.v.children.length).toBe(0);
            expect(instance.v.name).toBe('');
        });

        it("should init with element's xdata", function() {
            expect(instance.x).toBeDefined();
            expect(instance.x).toBe(instance.v.xdata);
        });

        it("should set a secret pointer to builder to an element", function() {
            expect(instance.v.__b$).toBeDefined();
            expect(instance.v.__b$).toBe(instance);
        });

        it("should set fill to default fill", function() {
            expect(instance.f).toBeDefined();
            expect(instance.f).toBe(B.DEFAULT_FILL);
        });

        it("should set stroke to default stroke", function() {
            expect(instance.s).toBeDefined();
            expect(instance.s).toBe(B.DEFAULT_STROKE);
        });

    });

    describe("when creating with name as parameter,", function() {

        var instance,
            test_name = 'foo';

        beforeEach(function() { instance = b(test_name); });

        it("should init with given name", function() {
            expect(instance.n).toBe(test_name);
        });

        it("should init with new element with corresponding name", function() {
            expect(instance.v).toBeDefined();
            expect(instance.v).toEqual(jasmine.any(anm.Element));
            expect(instance.v.parent).toBe(null);
            expect(instance.v.scene).toBe(null);
            expect(instance.v.children.length).toBe(0);
            expect(instance.v.name).toBe(test_name);
        });

        it("should init with element's xdata", function() {
            expect(instance.x).toBeDefined();
            expect(instance.x).toBe(instance.v.xdata);
        });

        it("should set a secret pointer to builder to an element", function() {
            expect(instance.v.__b$).toBeDefined();
            expect(instance.v.__b$).toBe(instance);
        });

        it("should set fill to default fill", function() {
            expect(instance.f).toBeDefined();
            expect(instance.f).toBe(B.DEFAULT_FILL);
        });

        it("should set stroke to default stroke", function() {
            expect(instance.s).toBeDefined();
            expect(instance.s).toBe(B.DEFAULT_STROKE);
        });

    });

    describe("when creating with some element as parameter (name it \'wrapping\'),", function() {

        var instance,
            test_elem,
            inner_elem;

        it("should init with given element with all properties inherited", function() {
            test_elem = new anm.Element();
            test_elem.name = 'foo';
            inner_elem = new anm.Element();
            test_elem.add(inner_elem);

            instance = b(test_elem);

            expect(instance.v).toBeDefined();
            expect(instance.v).toEqual(jasmine.any(anm.Element));
            expect(instance.v).toBe(test_elem);
            expect(instance.v.children.length).toBe(1);
            expect(instance.v.children[0]).toBe(inner_elem);
            expect(instance.v.name).toBe(test_elem.name);
        });

        it("should init with given element's name", function() {
            test_elem = new anm.Element();
            test_elem.name = 'foo';
            instance = b(test_elem);

            expect(instance.n).toBe(test_elem.name);
        });

        it("should init with element's xdata", function() {
            test_elem = new anm.Element();
            instance = b(test_elem);

            expect(instance.x).toBeDefined();
            expect(instance.x).toBe(test_elem.xdata);
        });

        it("should set a secret pointer to builder to an element", function() {
            test_elem = new anm.Element();
            instance = b(test_elem);

            expect(instance.v.__b$).toBeDefined();
            expect(instance.v.__b$).toBe(instance);
        });

        it("should set fill to default fill if element's fill is not defined", function() {
            test_elem = new anm.Element();
            instance = b(test_elem);

            expect(instance.f).toBeDefined();
            expect(instance.f).toBe(B.DEFAULT_FILL);
        });

        it("should set stroke to default stroke if element's fill is not defined", function() {
            test_elem = new anm.Element();
            instance = b(test_elem);

            expect(instance.s).toBeDefined();
            expect(instance.s).toBe(B.DEFAULT_STROKE);
        });

        it("should set fill to element's path fill if it is defined", function() {
            test_elem = new anm.Element();
            test_elem.xdata.path = new anm.Path();
            test_elem.xdata.path.cfill('#607120');
            expect(test_elem.xdata.text).toBe(null);
            instance = b(test_elem);

            expect(instance.f).toBeDefined();
            expect(instance.f).toBe(test_elem.xdata.path.fill);
        });

        it("should set stroke to element's path stroke if it is defined", function() {
            test_elem = new anm.Element();
            test_elem.xdata.path = new anm.Path();
            test_elem.xdata.path.cstroke('#98ac52', 10);
            expect(test_elem.xdata.text).toBe(null);
            instance = b(test_elem);

            expect(instance.s).toBeDefined();
            expect(instance.s).toBe(test_elem.xdata.path.stroke);
        });

        it("should set fill to element's text fill if it is defined", function() {
            test_elem = new anm.Element();
            test_elem.xdata.text = new anm.Text();
            test_elem.xdata.text.cfill('#607120');
            expect(test_elem.xdata.path).toBe(null);
            instance = b(test_elem);

            expect(instance.f).toBeDefined();
            expect(instance.f).toBe(test_elem.xdata.text.fill);
        });

        it("should set stroke to element's text stroke if it is defined", function() {
            test_elem = new anm.Element();
            test_elem.xdata.text = new anm.Text();
            test_elem.xdata.text.cstroke('#98ac52', 10);
            expect(test_elem.xdata.path).toBe(null);
            instance = b(test_elem);

            expect(instance.s).toBeDefined();
            expect(instance.s).toBe(test_elem.xdata.text.stroke);
        });

    });

    describe("when creating with builder as parameter (name it \'cloning\'),", function() {

        var to_clone,
            instance;

        it("should initialize with the name of the given builder", function() {
            to_clone = b('foo');
            instance = b(to_clone);

            expect(instance.n).toBe(to_clone.n);
        });

        it("should set a secret pointer to current builder to an element", function() {
            to_clone = b();
            instance = b(to_clone);

            expect(instance.v.__b$).toBeDefined();
            expect(instance.v.__b$).not.toBe(to_clone);
            expect(instance.v.__b$).toBe(instance);
        });

        it("should also set default fill to new builder if fill in cloned builder is not defined", function() {
            to_clone = b();
            instance = b(to_clone);

            expect(to_clone.f).toBe(B.DEFAULT_FILL);
            expect(instance.f).toBe(B.DEFAULT_FILL);
        });

        it("should also set default stroke to new builder if fill in cloned builder is not defined", function() {
            to_clone = b();
            instance = b(to_clone);

            expect(to_clone.s).toBe(B.DEFAULT_STROKE);
            expect(instance.s).toBe(B.DEFAULT_STROKE);
        });

        describe("cloning data, especially", function() {

            it("should clone inner element, not to copy", function() {
                to_clone = b('Foo');
                instance = b(to_clone);

                expect(instance.v).not.toBe(to_clone.v);
                expect(instance.v.name).toBe('Foo');
            });

            it("should clone inner element's xdata, not to copy", function() {
                to_clone = b('Foo');
                instance = b(to_clone);

                expect(instance.v).not.toBe(to_clone.v);
                expect(to_clone.x).toBe(to_clone.v.xdata);
                expect(instance.x).toBe(instance.v.xdata);
                expect(instance.x).not.toBe(to_clone.v.xdata);
            });

            it("should clone children array of given builder's element, not to copy", function() {
                var child_one = b(),
                    child_two = b(),
                    child_three = b();
                to_clone = b().add(child_one).add(child_two);
                instance = b(to_clone);

                instance.add(child_three);
                expect(to_clone.v.children.length).toBe(2);
                expect(instance.v.children.length).toBe(3);
                expect(to_clone.v.children[0]).toBe(child_one.v);
                expect(to_clone.v.children[1]).toBe(child_two.v);
                expect(instance.v.children[2]).toBe(child_three.v);
            });

            it("should clone fill and stroke, not to copy", function() {
                to_clone = b().fill('#456789');
                instance = b(to_clone);

                expect(to_clone.f.color).toBe('#456789');
                expect(instance.f.color).toBe('#456789');

                to_clone.fill('#986754');
                expect(to_clone.f.color).toBe('#986754');
                expect(instance.f.color).toBe('#456789');

                to_clone = b().stroke('#456789', 5);
                instance = b(to_clone);

                expect(to_clone.s.color).toBe('#456789');
                expect(instance.s.color).toBe('#456789');

                to_clone.stroke('#986754', 10);
                expect(to_clone.s.color).toBe('#986754');
                expect(to_clone.s.width).toBe(10);
                expect(instance.s.color).toBe('#456789');
                expect(instance.s.width).toBe(5);
            })

            it("should deeply clone children array of given builder's element, not to copy", function() {
                var child_one = b(),
                    child_two = b(),
                    child_three = b();
                to_clone = b().add(child_one).add(child_two);
                instance = b(to_clone);

                instance.add(child_three);

                child_one.v.name = 'one';
                child_two.v.name = 'two';
                child_three.v.name = 'three';
                expect(to_clone.v.children.length).toBe(2);
                expect(instance.v.children.length).toBe(3);

                expect(to_clone.v.children[0]).toBe(child_one.v);
                expect(to_clone.v.children[0].parent).toBe(to_clone.v);
                expect(to_clone.v.children[0].name).toBe('one');
                expect(to_clone.v.children[1]).toBe(child_two.v);
                expect(to_clone.v.children[1].parent).toBe(to_clone.v);
                expect(to_clone.v.children[1].name).toBe('two');

                expect(instance.v.children[0]).not.toBe(child_one.v);
                expect(instance.v.children[0].parent).toBe(instance.v);
                expect(instance.v.children[0].name).not.toBe('one');
                expect(instance.v.children[1]).not.toBe(child_two.v);
                expect(instance.v.children[1].parent).toBe(instance.v);
                expect(instance.v.children[1].name).not.toBe('two');
                expect(instance.v.children[2]).toBe(child_three.v);
                expect(instance.v.children[2].parent).toBe(instance.v);
                expect(instance.v.children[2].name).toBe('three');
            });

            it("should clone path object of given builder's element, not to copy", function() {
                var path = B.path([[0, 0], [10, 10]]);
                to_clone = b().path([0, 0], path);
                instance = b(to_clone);
                var fill_color = '#456789';
                to_clone.fill(fill_color);

                expect(to_clone.x.path).toBe(path);
                expect(instance.x.path).toBeDefined();
                expect(instance.x.path).not.toBe(path);
                expect(to_clone.x.path.fill.color).toBe(fill_color);
                expect(instance.x.path.fill.color).not.toBe(fill_color);

                path = B.path([[0, 0], [10, 10]]);
                to_clone = b().path([0, 0], path).fill(fill_color);
                instance = b(to_clone);

                expect(instance.x.path).toBeDefined();
                expect(instance.x.path).not.toBe(path);
                expect(to_clone.x.path.fill.color).toBe(fill_color);
                expect(instance.x.path.fill.color).toBe(fill_color);

                var another_fill_color = '#986754';
                instance.x.path.cfill(another_fill_color);
                expect(to_clone.x.path.fill.color).toBe(fill_color);
                expect(instance.x.path.fill.color).not.toBe(fill_color);
                expect(instance.x.path.fill.color).toBe(another_fill_color);
            });

            it("should clone text object of given builder's element, not to copy", function() {
                var text = new anm.Text(['Hello', 'World'], 'sans-serif');
                to_clone = b().text([20, 20], text);
                instance = b(to_clone);
                var fill_color = '#456789';
                to_clone.fill(fill_color);

                expect(instance.x.text).toBeDefined();
                expect(instance.x.text).not.toBe(text);
                expect(to_clone.x.text.fill.color).toBe(fill_color);
                expect(instance.x.text.fill.color).not.toBe(fill_color);

                text = new anm.Text(['World', 'Hello'], 'sans-serif');
                to_clone = b().text([40, 40], text).fill(fill_color);
                instance = b(to_clone);

                expect(to_clone.x.text).toBe(text);
                expect(instance.x.text).toBeDefined();
                expect(instance.x.text).not.toBe(text);
                expect(to_clone.x.text.fill.color).toBe(fill_color);
                expect(instance.x.text.fill.color).toBe(fill_color);

                var another_fill_color = '#986754';
                instance.x.text.cfill(another_fill_color);
                expect(to_clone.x.text.fill.color).toBe(fill_color);
                expect(instance.x.text.fill.color).not.toBe(fill_color);
                expect(instance.x.text.fill.color).toBe(another_fill_color);

                text.lines[0] = 'Foo';
                expect(to_clone.x.text.lines[0]).toBe('Foo');
                expect(instance.x.text.lines[0]).toBe('World');
                expect(instance.x.text.lines[1]).toBe('Hello');
                expect(instance.x.text.lines.length).toBe(2);

                instance.x.text.lines[1] = 'Bar';
                expect(to_clone.x.text.lines[0]).toBe('Foo');
                expect(instance.x.text.lines[0]).toBe('World');
                expect(instance.x.text.lines[1]).toBe('Bar');
                expect(instance.x.text.lines.length).toBe(2);

                instance.x.text.lines.push('Doodle');
                expect(to_clone.x.text.lines.length).toBe(2);
                expect(instance.x.text.lines.length).toBe(3);
                expect(instance.x.text.lines[2]).toBe('Doodle');
            });

            it("should clone modifiers array of given builder's element, not to copy", function() {
                var mod_one = _mocks.factory.nop(),
                    mod_two = _mocks.factory.nop(),
                    mod_three = _mocks.factory.nop();
                to_clone = b().modify(mod_one).modify(mod_two);
                instance = b(to_clone);

                // inside elements, modifiers are stored in four-dimentional arrays, nested like this:
                // modifiers
                //   [group]
                //      [priority]
                //         [modifier, configuration]
                // any array may be null if there are no elements of this sub-group

                instance.modify(mod_three);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0].length).toBe(2);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0].length).toBe(3);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][0][0]).toBe(mod_one);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][1][0]).toBe(mod_two);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][0][0]).toBe(mod_one);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][1][0]).toBe(mod_two);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_three);

                var mod_four = _mocks.factory.nop(),
                    mod_five = _mocks.factory.nop();
                to_clone.modify(mod_four);
                to_clone.modify(mod_five)
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0].length).toBe(4);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0].length).toBe(3);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_four);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][3][0]).toBe(mod_five);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_three);
                to_clone.unmodify(mod_four);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0].length).toBe(4);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0].length).toBe(3);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][2]).toBe(null);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][3][0]).toBe(mod_five);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2]).not.toBe(null);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_three);
                to_clone.unmodify(mod_five);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0].length).toBe(4);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0].length).toBe(3);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][2]).toBe(null);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][3]).toBe(null);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2]).not.toBe(null);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_three);
            });

            it("should clone painters array of given builder's element, not to copy", function() {
                var pnt_one = _mocks.factory.nop(),
                    pnt_two = _mocks.factory.nop(),
                    pnt_three = _mocks.factory.nop();
                to_clone = b().paint(pnt_one).paint(pnt_two);
                instance = b(to_clone);

                // inside elements, painters are stored in four-dimentional arrays, nested like this:
                // painters
                //   [group]
                //      [priority]
                //         [painter, data]
                // any array may be null if there are no elements of this sub-group

                instance.paint(pnt_three);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0].length).toBe(2);
                expect(instance.v._painters[anm.Element.USER_PNT][0].length).toBe(3);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][0][0]).toBe(pnt_one);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][1][0]).toBe(pnt_two);
                expect(instance.v._painters[anm.Element.USER_PNT][0][0][0]).toBe(pnt_one);
                expect(instance.v._painters[anm.Element.USER_PNT][0][1][0]).toBe(pnt_two);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_three);

                var pnt_four = _mocks.factory.nop(),
                    pnt_five = _mocks.factory.nop();
                to_clone.paint(pnt_four);
                to_clone.paint(pnt_five);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0].length).toBe(4);
                expect(instance.v._painters[anm.Element.USER_PNT][0].length).toBe(3);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_four);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][3][0]).toBe(pnt_five);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_three);
                to_clone.unpaint(pnt_four);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0].length).toBe(4);
                expect(instance.v._painters[anm.Element.USER_PNT][0].length).toBe(3);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][2]).toBe(null);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][3][0]).toBe(pnt_five);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2]).not.toBe(null);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_three);
                to_clone.unpaint(pnt_five);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0].length).toBe(4);
                expect(instance.v._painters[anm.Element.USER_PNT][0].length).toBe(3);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][2]).toBe(null);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][3]).toBe(null);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2]).not.toBe(null);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_three);
            });

            it("should clone data object of given builder's element, not to copy", function() {
                var data = { 'foo': 42 };
                to_clone = b().data(data);
                instance = b(to_clone);

                expect(to_clone.v.__data).toBe(data);
                expect(instance.v.__data).not.toBe(data);

                data.bar = 5;
                expect(to_clone.v.__data.bar).toBe(5);
                expect(instance.v.__data['bar']).not.toBeDefined();

                data.foo = 21;
                expect(to_clone.v.__data.foo).toBe(21);
                expect(instance.v.__data.foo).toBe(42);
            });

            it("should clone position and pivot point of given builder's element, not to copy", function() {
                var pos = [ 1024, 768 ];
                to_clone = b();
                to_clone.x.pos = pos;
                instance = b(to_clone);

                expect(to_clone.x).toBe(to_clone.v.xdata);
                expect(instance.x).toBe(instance.v.xdata);
                expect(to_clone.x.pos).toBe(pos);
                expect(instance.x.pos).not.toBe(pos);

                pos[0] = 5;
                expect(to_clone.x.pos[0]).toBe(5);
                expect(instance.x.pos[0]).toBe(1024);

                pos[1] = 7;
                expect(to_clone.x.pos[1]).toBe(7);
                expect(instance.x.pos[1]).toBe(768);

                var pvt = [ .7, .9 ];
                to_clone = b();
                to_clone.x.pvt = pvt;
                instance = b(to_clone);

                expect(to_clone.x).toBe(to_clone.v.xdata);
                expect(instance.x).toBe(instance.v.xdata);
                expect(to_clone.x.pvt).toBe(pvt);
                expect(instance.x.pvt).not.toBe(pvt);

                pvt[0] = 1;
                expect(to_clone.x.pvt[0]).toBe(1);
                expect(instance.x.pvt[0]).toBe(.7);

                pvt[1] = 7;
                expect(to_clone.x.pvt[1]).toBe(7);
                expect(instance.x.pvt[1]).toBe(.9);
            });

            it("should clone bands of given builder's element, not to copy", function() {
                var band = [20, 16];
                to_clone = b().band(band);
                instance = b(to_clone);

                expect(to_clone.x).toBe(to_clone.v.xdata);
                expect(instance.x).toBe(instance.v.xdata);
                expect(to_clone.x.lband).toBe(band);
                expect(instance.x.lband).not.toBe(band);

                band[0] = 5;
                expect(to_clone.x.lband[0]).toBe(5);
                expect(instance.x.lband[0]).toBe(20);

                band[1] = 7;
                expect(to_clone.x.lband[1]).toBe(7);
                expect(instance.x.lband[1]).toBe(16);

                var gband = [20, 16];
                to_clone.x.gband = gband;
                instance = b(to_clone);

                expect(to_clone.x).toBe(to_clone.v.xdata);
                expect(instance.x).toBe(instance.v.xdata);
                expect(to_clone.x.gband).toBe(gband);
                expect(instance.x.gband).not.toBe(gband);

                gband[0] = 5;
                expect(to_clone.x.gband[0]).toBe(5);
                expect(instance.x.gband[0]).toBe(20);

                gband[1] = 7;
                expect(to_clone.x.gband[1]).toBe(7);
                expect(instance.x.gband[1]).toBe(16);
            });

            it("should clone keys object of given builder's element, not to copy", function() {
                var keys = { 'foo': 42 };
                to_clone = b();
                to_clone.x.keys = keys;
                instance = b(to_clone);

                expect(to_clone.x).toBe(to_clone.v.xdata);
                expect(instance.x).toBe(instance.v.xdata);
                expect(to_clone.x.keys).toBe(keys);
                expect(instance.x.keys).not.toBe(keys);

                keys.bar = 5;
                expect(to_clone.x.keys.bar).toBe(5);
                expect(instance.x.keys['bar']).not.toBeDefined();

                keys.foo = 21;
                expect(to_clone.x.keys.foo).toBe(21);
                expect(instance.x.keys.foo).toBe(42);
            });

            it("should not clone image object in given builder's element, just copy", function() {
                var fake_src = 'http://fake.img';
                var whenImgReady = jasmine.createSpy('img-ready').andCallFake(function() {
                    var created_image = to_clone.x.sheet._image;
                    instance = b(to_clone);

                    var sample_image = to_clone.x.sheet._image,
                        instance_image = instance.x.sheet._image;

                    expect(to_clone.x).toBe(to_clone.v.xdata);
                    expect(instance.x).toBe(instance.v.xdata);
                    expect(sample_image).toBe(created_image);
                    expect(instance_image).toBe(created_image);
                    expect(instance_image.src).toMatch(fake_src);
                    ImgFake.__stopFakes();
                });
                spyOn(document, 'createElement').andReturn(_mocks.factory.canvas());
                spyOn(window, 'Image').andCallFake(ImgFake);
                runs(function() {
                    to_clone = b().image([50, 50], fake_src, whenImgReady);
                });
                waitsFor(function() { return to_clone.x.sheet &&
                                             to_clone.x.sheet.ready; }, 500);
                runs(function() {
                    expect(whenImgReady).toHaveBeenCalled();
                });
            });

            // TODO: test images caching

        });

    });

});