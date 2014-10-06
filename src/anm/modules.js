// Modules
// -----------------------------------------------------------------------------
var M = {};

M.register = function(alias, conf) {
  if (M[alias]) throw new Error('Module ' + alias + ' is already registered!');
  M[alias] = conf;
};

M.get = function(alias) {
  return M[alias];
};

M.isAccessible = function(alias) {
  return typeof M[alias] !== 'undefined';
};

module.exports = M;
