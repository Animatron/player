var conf = require('./conf.js'),
    C = require('./constants.js')

var nop = function() {};
var console = global.console || {
    log: nop, info: nop, warn: nop, error: nop
};
var log = {
    debug: function() { if (conf.logLevel & C.L_DEBUG) (console.debug || console.log).apply(console, arguments); },
    info:  function() { if (conf.logLevel & C.L_INFO)  (console.info  || console.log).apply(console, arguments); },
    warn:  function() { if (conf.logLevel & C.L_WARN)  (console.warn  || console.log).apply(console, arguments); },
    error: function() { if (conf.logLevel & C.L_ERROR) (console.error || console.log).apply(console, arguments); },
};

module.exports = log;
