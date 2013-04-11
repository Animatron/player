/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("image", function() {
    var b = Builder._$;

    var imgSpy;

    beforeEach(function() { spyOn(document, 'createElement').andReturn(_mocks.factory.canvas());
                            imgSpy = spyOn(window, 'Image').andCallFake(ImgFake); });

    afterEach(function() { ImgFake.__stopFakes(); })

    describe("preloading", function() {
         it("callbacks on image loaded", function() {
             var test_elm = b();
             var callbackSpy = jasmine.createSpy('callback');
             runs(function() {
                 test_elm.image([0,0], "test.png", callbackSpy);
             });
             waitsFor(function() { return test_elm.x.sheet &&
                                          test_elm.x.sheet.ready; }, "Image should load properly", 800);
             runs(function() {
                expect(test_elm.x.sheet).toBeDefined();
                expect(test_elm.x.sheet._image).toBeDefined();
                expect(test_elm.x.sheet._image.src).toBe("test.png");
                expect(callbackSpy).toHaveBeenCalled();
             });
         });
    });
    describe("caching", function() {
        it("second call to the same url performs a callback without creating new Image", function() {
            imgSpy.reset();
            var test_url = 'test' + (Math.random() * 100) + '.png';

            var callback1Spy = jasmine.createSpy('callback1');
            var elm1 = b();

            var callback2Spy = jasmine.createSpy('callback2');
            var elm2 = b();

            runs(function() {
                elm1.image([0,0], test_url, callback1Spy);
            });
            waitsFor(function() {return elm1.x.sheet &&
                                        elm1.x.sheet.ready;}, "Image should load properly", 800);
            runs(function() {
                expect(imgSpy).toHaveBeenCalled();
                expect(callback1Spy).toHaveBeenCalled();
                expect(elm1.x.sheet).toBeDefined();
                expect(elm1.x.sheet._image).toBeDefined();
                expect(elm1.x.sheet._image.src).toBe(test_url);
            });

            runs(function() {
                imgSpy.reset();
                elm2.image([0,0], test_url, callback2Spy);
            });
            waitsFor(function() {return elm2.x.sheet &&
                                        elm2.x.sheet.ready;}, "Image should load properly", 800);
            runs(function() {
                expect(imgSpy).not.toHaveBeenCalled();
                expect(callback2Spy).toHaveBeenCalled();
                expect(elm2.x.sheet).toBeDefined();
                expect(elm2.x.sheet._image).toBeDefined();
                expect(elm2.x.sheet._image.src).toBe(test_url);
            });

        });

        it("second call to the different url performs a callback and creates new Image", function() {
            imgSpy.reset();
            var test_url = 'test' + (Math.random() * 100) + '.png';

            var callback1Spy = jasmine.createSpy('callback1');
            var elm1 = b();

            var callback2Spy = jasmine.createSpy('callback2');
            var elm2 = b();

            runs(function() {
                elm1.image([0,0], test_url, callback1Spy);
            });
            waitsFor(function() {return elm1.x.sheet &&
                                        elm1.x.sheet.ready;}, "Image should load properly", 800);
            runs(function() {
                expect(imgSpy).toHaveBeenCalled();
                expect(callback1Spy).toHaveBeenCalled();
                expect(elm1.x.sheet).toBeDefined();
                expect(elm1.x.sheet._image).toBeDefined();
                expect(elm1.x.sheet._image.src).toBe(test_url);
            });

            runs(function() {
                imgSpy.reset();
                elm2.image([0,0], test_url + '.foo', callback2Spy);
            });
            waitsFor(function() {return elm2.x.sheet &&
                                        elm2.x.sheet.ready;}, "Image should load properly", 800);
            runs(function() {
                expect(imgSpy).toHaveBeenCalled();
                expect(callback2Spy).toHaveBeenCalled();
                expect(elm2.x.sheet).toBeDefined();
                expect(elm2.x.sheet._image).toBeDefined();
                expect(elm2.x.sheet._image.src).toBe(test_url + '.foo');
            });

        });

    });

    // TODO: onerror callback for an image/sheet

});