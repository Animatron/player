describe("image", function() {
    var b = Builder._$,
        B = Builder;
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
             waitsFor(function() {return done}, "The callback should fire", 800);
             runs(function() {
                expect( done ).toBeTruthy();
                Image = oldImage;
             });
         });
    });

});