/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("builder, regarding enabling/disabling elements", function() {

    var b = Builder._$;

    var instance;

    beforeEach(function() {
        instance = b();
        instance.add(b())
                .add(b())
                .add(b().add(b()).add(b()))
                .add(b().add(b()))
                .add(b());
    });

    it("should disable all children of disabled element", function() {
        expect(instance.v.disabled).toBeFalsy();
        instance.v.travelChildren(function(elm) {
            expect(elm.disabled).toBeFalsy();
        });

        instance.disable();

        expect(instance.v.disabled).toBeTruthy();
        instance.v.travelChildren(function(elm) {
            expect(elm.disabled).toBeTruthy();
        });
    });

    it("should enable all children of enabled again element back after disabling", function() {
        instance.disable();
        instance.enable();

        expect(instance.v.disabled).toBeFalsy();
        instance.v.travelChildren(function(elm) {
            expect(elm.disabled).toBeFalsy();
        });
    });

    it("should disable all children of disabled again element back after disabling and enabling", function() {
        instance.disable();
        instance.enable();
        instance.disable();

        expect(instance.v.disabled).toBeTruthy();
        instance.v.travelChildren(function(elm) {
            expect(elm.disabled).toBeTruthy();
        });
    });

});
