var errors = require('./errors.js');

// Importers
// -----------------------------------------------------------------------------
var importers = {};

importers.register = function(alias, conf) {
  if (importers[alias]) throw errors.system('Importer ' + alias + ' is already registered!');
  importers[alias] = conf;
};

importers.get = function(alias) {
  return importers[alias];
};

importers.create = function(alias) {
  return new importers[alias]();
};

importers.isAccessible = function(alias) {
  return typeof importers[alias] !== 'undefined';
};

module.exports = importers;
