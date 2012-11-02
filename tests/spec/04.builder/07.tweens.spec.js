xdescribe("tweens", function() {

    describe("different types of tweens", function() {

        it("not implemented", function() {
            this.fail('NI');
        });

        // FIXME: test that applying any tween calls b().modify

    });

    // TODO: ensure that tweens modifier is always new (instead, it rises an error that the element
    //       has this modifier already)

});

// Tweens are called with values from 0 to 1, but modifiers with actual time, should it be changed?

// TODO: test working with bands
// TODO: test untweening