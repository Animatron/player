var conf = require('./conf.js'),
    C = require('./constants.js');

var nop = function() {};
var c = global.console || {log: nop, info: nop, warn: nop, error: nop},
    сonsole;
if (global.console) {
    console = {
        log: c.debug || c.log,
        info: c.info || c.log,
        warn: c.warn || c.log,
        error: c.error || c.log
    };
    if (!c.log.apply) {
        //in ie9, console.log isn't a real Function object and does not have .apply()
        //we will have to remedy this using Function.prototype.bind()
        console.log = Function.prototype.bind.call(console.log, c);
        console.info = Function.prototype.bind.call(console.info, c);
        console.warn = Function.prototype.bind.call(console.warn, c);
        console.error = Function.prototype.bind.call(console.log, c);
    }
}

var log = {
    debug: function() { if (conf.logLevel & C.L_DEBUG) console.log.apply(c, arguments); },
    info:  function() { if (conf.logLevel & C.L_INFO)  console.info.apply(c, arguments); },
    warn:  function() { if (conf.logLevel & C.L_WARN)  console.warn.apply(c, arguments); },
    error: function() { if (conf.logLevel & C.L_ERROR) console.error.apply(c, arguments); }
};

module.exports = log;
