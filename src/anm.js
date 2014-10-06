/*
* Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
* All rights are reserved.
*
* Animatron Player is licensed under the MIT License, see LICENSE.
*
* @VERSION
*/

// HERE GOES THE INITIALISATION OF ANM NAMESPACE, GLOBALS AND GLOBAL HELPERS

var PUBLIC_NAMESPACE = 'anm';

var ENGINE_VAR = '__anm_engine';

var C = require('./anm/constants.js');



// Engine
// -----------------------------------------------------------------------------

//todo: make other engines usable
var engine = require('./engine/dom-engine.js');


// Public Namespace
// -----------------------------------------------------------------------------
var anm = {
    global: global,
    'C': C,
    'M': require('./anm/modules.js'),
    'I': require('./anm/importers.js'),
    guid: guid,
    conf: require('./anm/conf.js'),
    is: require('./anm/is.js'), // typecheck, will be initialized below
    iter: require('./anm/iter.js'),
    log: require('./anm/log.js'),
    // Engine
    engine: engine,
    // FIXME: modules and engines should use require/define technique, with optional ? for tests
    // Events
    events: require('./anm/events.js'),
    // Managers
    resource_manager: require('./anm/resource_manager.js'),
    player_manager: require('./anm/player_manager.js'),

    loc: require('./anm/loc.js'),
    errors: require('./anm/errors.js')
};


// GUID
// -----------------------------------------------------------------------------

function guid() {
   return Math.random().toString(36).substring(2, 10) +
          Math.random().toString(36).substring(2, 10);
}



anm.registerAsModifier = function(f) {
    f[C.MARKERS.MODIFIER_MARKER] = true;
}

anm.registerAsPainter = function(f) {
    f[C.MARKERS.PAINTER_MARKER] = true;
}

// Export
// -----------------------------------------------------------------------------

global[PUBLIC_NAMESPACE] = anm;
module.exports = anm;
