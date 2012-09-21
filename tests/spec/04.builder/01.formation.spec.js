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

        describe("cloning, especially", function() {

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
                this.fail('Not Implemented');
            });

            it("should clone text object of given builder's element, not to copy", function() {
                this.fail('Not Implemented');
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
                //         [modifier, data]
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
                var m_four_id = to_clone.modify(mod_four).get_m_id(),
                    m_five_id = to_clone.modify(mod_five).get_m_id();
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0].length).toBe(4);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0].length).toBe(3);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_four);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][3][0]).toBe(mod_five);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_three);
                to_clone.unmodify(m_four_id);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0].length).toBe(4);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0].length).toBe(3);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][2]).toBe(null);
                expect(to_clone.v._modifiers[anm.Element.USER_MOD][0][3][0]).toBe(mod_five);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2]).not.toBe(null);
                expect(instance.v._modifiers[anm.Element.USER_MOD][0][2][0]).toBe(mod_three);
                to_clone.unmodify(m_five_id);
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
                var p_four_id = to_clone.paint(pnt_four).get_p_id(),
                    p_five_id = to_clone.paint(pnt_five).get_p_id();
                expect(to_clone.v._painters[anm.Element.USER_PNT][0].length).toBe(4);
                expect(instance.v._painters[anm.Element.USER_PNT][0].length).toBe(3);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_four);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][3][0]).toBe(pnt_five);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_three);
                to_clone.unpaint(p_four_id);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0].length).toBe(4);
                expect(instance.v._painters[anm.Element.USER_PNT][0].length).toBe(3);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][2]).toBe(null);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][3][0]).toBe(pnt_five);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2]).not.toBe(null);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_three);
                to_clone.unpaint(p_five_id);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0].length).toBe(4);
                expect(instance.v._painters[anm.Element.USER_PNT][0].length).toBe(3);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][2]).toBe(null);
                expect(to_clone.v._painters[anm.Element.USER_PNT][0][3]).toBe(null);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2]).not.toBe(null);
                expect(instance.v._painters[anm.Element.USER_PNT][0][2][0]).toBe(pnt_three);
            });

            it("should clone data object of given builder's element, not to copy", function() {
                this.fail('Not Implemented');
            });

            it("should clone position and registration point of given builder's element, not to copy", function() {
                this.fail('Not Implemented');
            });

            it("should clone bands of given builder's element, not to copy", function() {
                this.fail('Not Implemented');
            });

            it("should clone keys object of given builder's element, not to copy", function() {
                this.fail('Not Implemented');
            });

            it("should not clone image object in given builder's element, just copy", function() {
                this.fail('Not Implemented');
            });

/*     var clone = this.clone();
    clone.children = [];
    var src_children = this.children;
    var trg_children = clone.children;
    for (var sci = 0, scl = src_children.length; sci < scl; sci++) {
        var csrc = src_children[sci],
            cclone = csrc.deepClone();
        cclone.parent = clone;
        trg_children.push(cclone);
    }
    clone.__data = obj_clone(this.__data);
    var src_x = this.xdata,
        trg_x = clone.xdata;
    if (src_x.path) trg_x.path = src_x.path.clone();
    //if (src_x.image) trg_x.image = src_x.image.clone();
    if (src_x.text) trg_x.text = src_x.text.clone();
    trg_x.pos = [].concat(src_x.pos);
    trg_x.reg = [].concat(src_x.reg);
    trg_x.lband = [].concat(src_x.lband);
    trg_x.gband = [].concat(src_x.gband);
    trg_x.keys = obj_clone(src_x.keys);
    return clone; */

        });

/*      this.v = obj.v.deepClone();
        this.x = this.v.xdata;
        this.f = this._extractFill(obj.f);
        this.s = this._extractStroke(obj.s);
        this.v.__b$ = this;
        return; */

    });

});