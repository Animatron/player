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
        test_elm.add(new anm.Element());
        test_elm.setBand([2, 17]);
        root1.add(test_elm);
        root2.add(inner);

        try {
            inner.add(test_elm);
            this.fail();
        } catch(e) {
            // expect(e.message)
        };

        try {
            inner.add(test_elm.clone());
        } catch(e) {
            this.fail();
        };

    });


});