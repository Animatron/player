var conf = require('./conf.js'),
    C = require('./constants.js');

var nop = function() {};
var c = global.console || {log: nop, info: nop, warn: nop, error: nop},
    anmConsole;
if (global.console) {
    anmConsole = {
        log: c.debug || c.log,
        info: c.info || c.log,
        warn: c.warn || c.log,
        error: c.error || c.log
    };
    if (!c.log.apply) {
        //in ie9, console.log isn't a real Function object and does not have .apply()
        //we will have to remedy this using Function.prototype.bind()
        anmConsole.log = Function.prototype.bind.call(anmConsole.log, c);
        anmConsole.info = Function.prototype.bind.call(anmConsole.info, c);
        anmConsole.warn = Function.prototype.bind.call(anmConsole.warn, c);
        anmConsole.error = Function.prototype.bind.call(anmConsole.log, c);
    }
}

var log = {
    debug: function() { if (conf.logLevel & C.L_DEBUG) anmConsole.log.apply(c, arguments); },
    info:  function() { if (conf.logLevel & C.L_INFO)  anmConsole.info.apply(c, arguments); },
    warn:  function() { if (conf.logLevel & C.L_WARN)  anmConsole.warn.apply(c, arguments); },
    error: function() { if (conf.logLevel & C.L_ERROR) anmConsole.error.apply(c, arguments); }
};

module.exports = log;
