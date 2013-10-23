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
      'function(evt, t) { if (this.$.contains(evt.pos)) { ', /* content */ ' } }'
    ]
  };

  E._customImporters.push(function(source, type, importer) {
    if ((type === 255) && source[8]) { // type === 255 is TYPE_LAYER, see animatron-importer.js
      var handlers = source[8];
      for (var handler_type in handlers) {
        var handler_code = handlers[handler_type];
        /* this.m_on(handler_map[handler_type], function(evt, t) {
          if (this.$.contains(evt.pos, null)) {
            console.log('Click');
          }
        }); */
        console.log(wrappers_map[handler_type][0] + handler_code + wrappers_map[handler_type][1]);
        console.log('function() { ' + handler_code + ' }');

        //this.m_on(handler_map[handler_type], eval('return function() { ' + handler_code + ' }'));
        eval('this.m_on(handler_map[handler_type], ' +
             /*'function() { ' + handler_code + ' })'*/
             wrappers_map[handler_type][0] + handler_code + wrappers_map[handler_type][1] + ');');
      }
    }
  });

})();