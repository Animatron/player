/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

/*global Image: true, expect: true */
describe("image", function() {
    var b = Builder._$;
    describe("preloading", function() {
         it("callbacks on image loaded", function() {
             var done = false;
             var oldImage = Image;
             Image = function(s) {
                 var self = this;
                 setTimeout(function() {self.onload();}, 500);
             };
             runs(function() {
                 b().image([0,0], "test.png", function() {done = true;});
             });
             waitsFor(function() {return done;}, "The callback should fire", 800);
             runs(function() {
                expect( done ).toBeTruthy();
                Image = oldImage;
             });
         });
    });
    describe("caching", function() {
        it("second call callbacks without creating new Image", function() {
            var done = false;
            var oldImage = window.Image;
            var called = false;
            window.Image = function(s) {
                var self = this;
                setTimeout(function() {self.onload();}, 500);
            };
            runs(function() {
                b().image([0,0], "test.png", function() {done = true;});
            });
            waitsFor(function() {return done;}, "The callback should fire", 800);
            runs(function() {
                window.Image = function(s) {
                    called = true;
                };
                done = false;
                b().image([0,0], "test.png", function() {done = true;});
            });
            waitsFor(function() {return done;}, "The callback should fire", 800);
            runs(function() {
                expect( done ).toBeTruthy();
                expect( called ).toBeFalsy();
                window.Image = oldImage;
            });
        });
    });

});