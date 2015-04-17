var errors = require('./errors.js');

// Modules
// -----------------------------------------------------------------------------
var modules = {};

modules.register = function(alias, conf) {
  if (modules[alias]) throw errors.system('Module ' + alias + ' is already registered!');
  modules[alias] = conf;
};

modules.get = function(alias) {
  return modules[alias];
};

modules.isAccessible = function(alias) {
  return typeof modules[alias] !== 'undefined';
};

module.exports = modules;
