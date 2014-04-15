/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

xdescribe("versions in player", function() {

    xit("player should have version", function() {
        expect(createPlayer('stub').version).toBeDefined();
        expect(createPlayer('stub').version).toBeGreaterThan(0);
    });

});
