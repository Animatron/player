/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

xdescribe("stub spec", function() {

    xit("should be stubby", function() {
        expect(true).toBeTruthy();
    });

    // TODO: ensure that elements id's using guid does not affect any logic
    // FIXME: setting an element's band to [0, Number.MAX_VALUE] by default affects logic of relative modifier since their timing is
    //        based on band-relative calculations, but we also should allow user to live-change the band

});