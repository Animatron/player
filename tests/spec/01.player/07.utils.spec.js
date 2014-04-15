/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("player utilities", function() {

    describe("time comparison core", function() {

        // FIXME: the incorrect test, because it tests function, but not the appliance of this function,
        //        probably every expectation should be a separate 'it'-spec

        var t_cmp = anm.__dev.t_cmp;

        it("problem still exists", function() {
            expect(0.1 + 0.2).toBeGreaterThan(0.3);
        });

        it("compares the time in easy cases", function() {

            expect(t_cmp(0, 7)).toBeLessThan(0);
            expect(t_cmp(7, 7)).toEqual(0);
            expect(t_cmp(7, 0)).toBeGreaterThan(0);

            expect(t_cmp(-7, 2)).toBeLessThan(0);
            expect(t_cmp(-7, -7)).toEqual(0);
            expect(t_cmp(7, 2)).toBeGreaterThan(0);

            expect(t_cmp(0, 0)).toEqual(0);

        });

        it("compares the time in hard cases", function() {

            expect(t_cmp(0.00000000002, 7)).toBeLessThan(0);
            expect(t_cmp(7, 7)).toEqual(0);
            expect(t_cmp(7, 0.00000000002)).toBeGreaterThan(0);

            expect(t_cmp(0.00000000002, 7.00000000002)).toBeLessThan(0);
            expect(t_cmp(7.99999999998, 7.99999999998)).toEqual(0);
            expect(t_cmp(7.99999999998, 8)).toEqual(0);
            expect(t_cmp(8.00010000002, 7.99999999998)).toBeGreaterThan(0);

            expect(t_cmp(-7.00000000002, 2.00000000002)).toBeLessThan(0);
            expect(t_cmp(-7.00000000002, -6.9999999998)).toEqual(0);
            expect(t_cmp(-7.00000000002, -7.00000000002)).toEqual(0);
            expect(t_cmp(7.00000000002, 2.00000000002)).toBeGreaterThan(0);

        });

    });

    describe("time adjusting", function() {
        var adjust = anm.__dev.adjust;

        it("adjusts to some digit", function() {
            expect(adjust(0)).toBe(0);
            expect(adjust(-3)).toBe(-3);
            expect(adjust(0.1)).toBe(0.1);
            expect(adjust(.1 + .2)).toBe(.3);
            expect(adjust(7.00000000002)).toBe(7);
            expect(adjust(-7.00000000002)).toBe(-7);
            expect(adjust(251739)).toBe(251739);
            expect(adjust(251739.00000000004)).toBe(251739);
        });
    });

});
