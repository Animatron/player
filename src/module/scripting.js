/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

(function() { // anonymous wrapper to exclude global context clash
  var C = anm.C,
      is = __anm.is;
  var _ResMan = __anm.resource_manager;

  C.MOD_SCRIPTING = 'scripting';
  if (anm.M[C.MOD_SCRIPTING]) throw new Error('SCRIPTING module already enabled');

  anm.M[C.MOD_SCRIPTING] = {};

  var E = anm.Element;

  var handler_map = {
    'click': C.X_MCLICK
  }, wrappers_map = {
    'click': [
      '(function(ctx) { ' +
         'return function(evt, t) { ' +
           'if (this.$.contains(evt.pos)) { ' +
             '(function(ctx, evt, t) { console.log(ctx, evt, t);',
                /* content */
             '}).call(this, ctx, evt, t);' +
           '}' +
         '}' +
      '})(____user_ctx)'
    ]
  };

  var ____user_ctx = { 'foo': 'bar' };

  E._customImporters.push(function(source, type, importer) {
    if ((type === 255) && source[8]) { // type === 255 is TYPE_LAYER, see animatron-importer.js
      var handlers = source[8];
      for (var handler_type in handlers) {
        var handler_code = wrappers_map[handler_type][0] +
                           handlers[handler_type] + wrappers_map[handler_type][1];

        eval('this.m_on(handler_map[handler_type], ' +
             handler_code + ');');
      }
    }
  });

})();