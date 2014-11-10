// Private configuration
// -----------------------------------------------------------------------------
var PRIVATE_CONF = '__anm_conf',
    C = require('./constants.js');

// private developer-related configuration
// TODO: merge actual properties with default values, if they are set
var conf = global[PRIVATE_CONF] || {
        logImport: false, // FIXME: create a hash-map of such values, by key
        logResMan: false, //        or just remove these flags in favor of log.debug
        logEvents: false,
        logLevel: C.L_ERROR | C.L_WARN | C.L_INFO,
        doNotLoadAudio: false,
        doNotLoadImages: false,
        doNotRenderShadows: false,
        engine: null
    };
global[PRIVATE_CONF] = conf;

module.exports = conf;
