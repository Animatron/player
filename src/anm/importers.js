// Importers
// -----------------------------------------------------------------------------
var I = {};

I.register = function(alias, conf) {
  if (I[alias]) throw new Error('Importer ' + alias + ' is already registered!');
  I[alias] = conf;
};

I.get = function(alias) {
  return I[alias];
};

I.create = function(alias) {
  return new I[alias]();
};

I.isAccessible = function(alias) {
  return typeof I[alias] !== 'undefined';
};

module.exports = I;
