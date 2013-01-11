// ======= TESTS =========

describe("utils", function() {

    /*TODO: describe("frame-generator", function() {
        expect(Date.now()).toBeGreaterThan(0);
        var fps = 70;
        _FrameGen.enable(fps);
        _FrameGen.disable();
    });*/

// FIXME: frame generator fails with stack overflow if game is in infinite playing

    describe("vary all", function() {

        var externalBeforeEachSpy = jasmine.createSpy('external-before-each-spy');

        /*var describeWrapper = { describe: describe };

        var describeSpy;*/

        beforeEach(externalBeforeEachSpy/*.andCallFake(function() {
            //describeSpy = spyOn(itWrapper, 'describe').andCallThrough();
            describeSpy = spyOn(jasmine.getEnv(), 'describe').andCallThrough();
            console.log('assigning describe spy', jasmine.getEnv().describe);
        })*/);

        // TODO: test with ten variants, using loops

        var prepareOneSpyCalled   = false,
            prepareTwoSpyCalled   = false,
            prepareThreeSpyCalled = false;

        var prepareOneSpy   = jasmine.createSpy('prepare-one-spy'),
            prepareTwoSpy   = jasmine.createSpy('prepare-two-spy'),
            prepareThreeSpy = jasmine.createSpy('prepare-three-spy');

        var wrapFunctionSpy  = jasmine.createSpy('wrapping-function'),
            checkFunctionSpy = jasmine.createSpy('check-function'),
            innerDescribeSpy = jasmine.createSpy('inner-describe'),
            innerItSpy1      = jasmine.createSpy('inner-it-1'),
            innerItSpy2      = jasmine.createSpy('inner-it-2');

        function resetPrepareSpies() {
            prepareOneSpy.reset();
            prepareTwoSpy.reset();
            prepareThreeSpy.reset();
        };

        varyAll([
            { description: "prepare one",   prepare: prepareOneSpy.andCallFake(function()
                            { prepareOneSpyCalled = true;   }) },
            { description: "prepare two",   prepare: prepareTwoSpy.andCallFake(function()
                            { prepareTwoSpyCalled = true;   }) },
            { description: "prepare three", prepare: prepareThreeSpy.andCallFake(function()
                            { prepareThreeSpyCalled = true; }) } ],

            wrapFunctionSpy.andCallFake(function() {

                it("test pass for it", checkFunctionSpy.andCallFake(function() {

                    expect(externalBeforeEachSpy).toHaveBeenCalled();

                    if (prepareThreeSpyCalled) {
                        expect(prepareThreeSpy).toHaveBeenCalled();
                        expect(prepareOneSpy).not.toHaveBeenCalled();
                        expect(prepareTwoSpy).not.toHaveBeenCalled();
                        //expect(describe).toHaveBeenCalledWith("prepare three", mainFunctionSpy);
                        expect(prepareOneSpyCalled).toBeTruthy();
                        expect(prepareTwoSpyCalled).toBeTruthy();
                    } else if (prepareTwoSpyCalled) {
                        expect(prepareTwoSpy).toHaveBeenCalled();
                        expect(prepareOneSpy).not.toHaveBeenCalled();
                        expect(prepareThreeSpy).not.toHaveBeenCalled();
                        //expect(describe).toHaveBeenCalledWith("prepare two", mainFunctionSpy);
                        expect(prepareOneSpyCalled).toBeTruthy();
                        expect(prepareThreeSpyCalled).toBeFalsy();
                    } else if (prepareOneSpyCalled) {
                        expect(prepareOneSpy).toHaveBeenCalled();
                        expect(prepareTwoSpy).not.toHaveBeenCalled();
                        expect(prepareThreeSpy).not.toHaveBeenCalled();
                        //expect(describe).toHaveBeenCalledWith("prepare one", mainFunctionSpy);
                        expect(prepareTwoSpyCalled).toBeFalsy();
                        expect(prepareThreeSpyCalled).toBeFalsy();
                    }

                    expect(prepareOneSpyCalled ||
                           prepareTwoSpyCalled ||
                           prepareThreeSpyCalled).toBeTruthy();

                    externalBeforeEachSpy.reset();

                    resetPrepareSpies();
                }));

                describe("test pass for describe", innerDescribeSpy.andCallFake(function() {
                    it("inner test pass for it #1", innerItSpy1.andCallFake(resetPrepareSpies));
                    it("inner test pass for it #2", innerItSpy2.andCallFake(resetPrepareSpies));

                    resetPrepareSpies();
                }));

                // TODO: test inner varyAll

            }) );

        it("should have been called all spies", function() {
            expect(wrapFunctionSpy.callCount).toBe(3);
            expect(checkFunctionSpy.callCount).toBe(3);
            expect(innerDescribeSpy.callCount).toBe(3);
            expect(innerItSpy1.callCount).toBe(3);
            expect(innerItSpy2.callCount).toBe(3);
            //expect(itSpy.callCount).toBe(3);
            expect(externalBeforeEachSpy).toHaveBeenCalled();
            expect(prepareOneSpyCalled).toBeTruthy();
            expect(prepareTwoSpyCalled).toBeTruthy();
            expect(prepareThreeSpyCalled).toBeTruthy();
        })

    });

    // TODO: test doAsync (+ always stop player if waitFor failed)
    // TODO: test it-variant of varyAll

    // TODO: test matchers

    // TODO: test _each()
    // TODO: test _arrayFrom()
    // TODO: test __builder()
    // TODO: test __array()
    // TODO: test __num()
    // TODO: test travel()
    // TODO: test queue()
    // TODO: test __close
    // TODO: test fake()

    // test mocks ?

});
