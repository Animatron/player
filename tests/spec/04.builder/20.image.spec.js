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
                console.log("1");
                var self = this;
                setTimeout(function() {self.onload();}, 500);
            };
            runs(function() {
                b().image([0,0], "test.png", function() {done = true;});
            });
            waitsFor(function() {return done;}, "The callback should fire", 800);
            runs(function() {
                window.Image = function(s) {
                    console.log("2");
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