describe("builder, regading iterations, ", function() {

    /* var player,
        C = anm.C; */

    var b = Builder._$,
        B = Builder;

    /* beforeEach(function() {
        this.addMatchers(_matchers);

        spyOn(document, 'getElementById').andReturn(_mocks.canvas);
        _fakeCallsForCanvasRelatedStuff();
    }); */

    describe("each/deach methods", function() {

        it("should visit each child element in case of simple iteration", function() {
            var count = 10;

            var spies = [];

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
                var spy = jasmine.createSpy('test-spy-'+i);
                elem.__test_method = spy;
                spies.push(spy);
            }

            root.each(function(elm) {
                b(elm).__test_method();
            });

            for (var i = 0; i < count; i++) {
                expect(spies[i]).toHaveBeenCalled();
            }
        });

        it("should not visit grand*-child elements in case of simple iteration", function() {
            var count = 10;

            var spies = [];

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
                elem.__test_method = function() {};
                var subElem = b('sub-elem-'+i);
                elem.add(subElem);
                var spy = jasmine.createSpy('test-spy-'+i);
                subElem.__test_method = spy;
                spies.push(spy);
            }

            root.each(function(elm) {
                b(elm).__test_method();
            });

            for (var i = 0; i < count; i++) {
                expect(spies[i]).not.toHaveBeenCalled();
            }
        });

        it("should visit each child and grand*-child element in case of deep iteration", function() {
            var spies = [];

            var root = b('root');

            for (var i = 0; i < 10; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
                var spy = jasmine.createSpy('test-spy-'+i);
                elem.__test_method = spy;
                spies.push(spy);

                var subElem1 = b('elem-'+i+'-sub1');
                elem.add(subElem1);
                var spySub1 = jasmine.createSpy('test-spy-'+i+'-sub1');
                subElem1.__test_method = spySub1;
                spies.push(spySub1);

                var subElem2 = b('elem-'+i+'-sub2');
                elem.add(subElem2);
                var spySub2 = jasmine.createSpy('test-spy-'+i+'-sub2');
                subElem2.__test_method = spySub2;
                spies.push(spySub2);

                for (var j = 0; j < 10; j++) {
                    var subSubElem = b('elem-'+i+'-sub2-sub'+j);
                    subElem2.add(subSubElem);
                    var spySubSub = jasmine.createSpy('test-spy-'+i+'-sub2-sub'+j);
                    subSubElem.__test_method = spySubSub;
                    spies.push(spySubSub);
                }
            }

            root.deach(function(elm) {
                b(elm).__test_method();
            });

            for (var i = 0, il = spies.length; i < il; i++) {
                expect(spies[i]).toHaveBeenCalled();
            }
        });

        it("should throw an error if removing happens during simple iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.each(function(elm) {
                    root.remove(elm);
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should throw an error if detaching happens during simple iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.each(function(elm) {
                    elm.detach();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should throw an error when iterated element is expected to be cleared during simple iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.each(function(elm) {
                    root.clear();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

       it("should not throw an error when child element is expected to be cleared during simple iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.each(function(elm) {
                    elm.clear();
                });

            } catch(e) {
                this.fail(e);
            }

        });

        it("should throw an error if removing happens during deep iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i).add(b('child-of-'+i));
                root.add(elem);
            }

            try {

                root.deach(function(elm) {
                    root.remove(elm);
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should throw an error if detaching happens during deep iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i).add(b('child-of-'+i));
                root.add(elem);
            }

            try {

                root.deach(function(elm) {
                    elm.detach();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should throw an error when iterated element is expected to be cleared during deep iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.deach(function(elm) {
                    root.clear();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

       it("should not throw an error when child element is expected to be cleared during deep iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.deach(function(elm) {
                    elm.clear();
                });

            } catch(e) {
                this.fail(e);
            }

        });

        xit("should safely visit elements in case of iteration, even if they are actively used", function() {

        });

        xit("should safely visit elements in case of deep iteration, even if they are actively used", function() {

        });

    });

    describe("iter/diter methods", function() {

        it("should visit each child element in case of simple iteration", function() {
            var count = 10;

            var spies = [];

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
                var spy = jasmine.createSpy('test-spy-'+i);
                elem.__test_method = spy;
                spies.push(spy);
            }

            root.iter(function(elm) {
                b(elm).__test_method();
            });

            for (var i = 0; i < count; i++) {
                expect(spies[i]).toHaveBeenCalled();
            }
        });

        it("should not visit grand*-child elements in case of simple iteration", function() {
            var count = 10;

            var spies = [];

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
                elem.__test_method = function() {};
                var subElem = b('sub-elem-'+i);
                elem.add(subElem);
                var spy = jasmine.createSpy('test-spy-'+i);
                subElem.__test_method = spy;
                spies.push(spy);
            }

            root.iter(function(elm) {
                b(elm).__test_method();
            });

            for (var i = 0; i < count; i++) {
                expect(spies[i]).not.toHaveBeenCalled();
            }
        });

        it("should visit each child and grand*-child element in case of deep iteration", function() {
            var spies = [];

            var root = b('root');

            for (var i = 0; i < 10; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
                var spy = jasmine.createSpy('test-spy-'+i);
                elem.__test_method = spy;
                spies.push(spy);

                var subElem1 = b('elem-'+i+'-sub1');
                elem.add(subElem1);
                var spySub1 = jasmine.createSpy('test-spy-'+i+'-sub1');
                subElem1.__test_method = spySub1;
                spies.push(spySub1);

                var subElem2 = b('elem-'+i+'-sub2');
                elem.add(subElem2);
                var spySub2 = jasmine.createSpy('test-spy-'+i+'-sub2');
                subElem2.__test_method = spySub2;
                spies.push(spySub2);

                for (var j = 0; j < 10; j++) {
                    var subSubElem = b('elem-'+i+'-sub2-sub'+j);
                    subElem2.add(subSubElem);
                    var spySubSub = jasmine.createSpy('test-spy-'+i+'-sub2-sub'+j);
                    subSubElem.__test_method = spySubSub;
                    spies.push(spySubSub);
                }
            }

            root.diter(function(elm) {
                b(elm).__test_method();
            });

            for (var i = 0, il = spies.length; i < il; i++) {
                expect(spies[i]).toHaveBeenCalled();
            }
        });

        it("should disallow removing elements in case of calling .remove method during safe-iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.iter(function(elm) {
                    root.remove(elm);
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }
        });

        it("should disallow detaching elements in case of calling .remove method during safe-iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.iter(function(elm) {
                    elm.detach();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should disallow removing elements in case of calling .remove method during safe-deep-iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i).add(b('child-of-'+i));
                root.add(elem);
            }

            try {

                root.diter(function(elm) {
                    root.remove(elm);
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should disallow detaching elements in case of calling .remove method during safe-deep-iteratio", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i).add(b('child-of-'+i));
                root.add(elem);
            }

            try {

                root.diter(function(elm) {
                    elm.detach();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }
        });

        it("should disallow clearing iterated element during safe-iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.iter(function(elm) {
                    root.clear();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should allow clearing child elements during safe-iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.iter(function(elm) {
                    elm.clear();
                });

            } catch(e) {
                this.fail(e);
            }

        });

        it("should disallow clearing iterated element during safe-deep-iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.diter(function(elm) {
                    root.clear();
                });

                this.fail('Should throw exception');

            } catch(e) {
                expect(e.message).toBe(anm.Player.UNSAFE_TO_REMOVE_ERR);
            }

        });

        it("should allow clearing child elements during safe-deep-iteration", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.diter(function(elm) {
                    elm.clear();
                });

            } catch(e) {
                this.fail(e);
            }

        });

        it("should safely remove elements in case of safe-iteration with returning false", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i);
                root.add(elem);
            }

            try {

                root.iter(function(elm) {
                    expect(elm).toBeDefined();
                    return false;
                });

                expect(root.v.children.length).toBe(0);

            } catch(e) {
                this.fail(e);
            }
        });

        it("should safely remove elements even during safe-deep-iteration with returning false", function() {
            var count = 10;

            var root = b('root');

            for (var i = 0; i < count; i++) {
                var elem = b('elem-'+i).add(b('child-of-'+i));
                root.add(elem);
            }

            try {

                root.diter(function(elm) {
                    expect(elm).toBeDefined();
                    expect(elm.children.length).toBe(0); // should remove children before calling this function
                    return false;
                });

                expect(root.v.children.length).toBe(0);

            } catch(e) {
                this.fail(e);
            }

        });

        xit("should safely visit elements in case of safe-iteration, even if they are actively used", function() {

        });

        xit("should safely visit elements in case of safe-deep-iteration, even if they are actively used", function() {

        });

        xit("should safely remove elements in case of safe-iteration, even if they are actively used", function() {

        });

        xit("should safely remove elements in case of safe-deep-iteration, even if they are actively used", function() {

        });

        xit("should call post-remove function for every removed element", function() {
        });

        xit("should call post-remove function for every detached element", function() {
        });

    });

});