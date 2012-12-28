/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

describe("structure", function() {

    it("should not allow to add the same element to a scene, but allow to add its clone", function() {
        var scene = new anm.Scene();
        var root1 = new anm.Element();
        var root2 = new anm.Element();
        var inner = new anm.Element();
        var test_elm = new anm.Element();
        var test_child = new anm.Element();
        test_elm.add(test_child);
        test_elm.setBand([2, 17]);
        root1.add(test_elm);
        root2.add(inner);
        inner.add(test_elm);
        scene.add(root1);

        try {
            scene.add(root2);
            this.fail('No exception was thrown');
        } catch(e) {
            expect(e.message).toBe(anm.Errors.A.ELEMENT_IS_REGISTERED); // TODO: include element name in error
        };

        try {
            inner.add(test_elm.clone());
            // should throw an exception because its child is already registered in scene
            this.fail('No exception was thrown');
        } catch(e) {
            expect(e.message).toBe(anm.Errors.A.ELEMENT_IS_REGISTERED); // TODO: include element name in error
        };

        try {
            inner.add(test_elm.clone());
            // should throw an exception because its child is already registered in scene
            this.fail('No exception was thrown');
        } catch(e) {
            expect(e.message).toBe(anm.Errors.A.ELEMENT_IS_REGISTERED); // TODO: include element name in error
        };

        test_elm.remove(test_child);
        try {
            inner.add(test_elm.clone());
        } catch(e) {
            this.fail('Should not throw any exception');
        }

    });

    it("should throw an exception when trying to remove the element that wasn't added to the scene", function() {
        var scene = new anm.Scene();
        var subj = new anm.Element();
        var some = new anm.Element();

        scene.add(some);

        try {
            scene.remove(subj);
            this.fail('No exception was thrown');
        } catch(e) {
            expect(e.message).toBe(anm.Errors.A.ELEMENT_IS_NOT_REGISTERED); // TODO: include element name in error
        }
    });

});