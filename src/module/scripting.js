/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

(function() { // anonymous wrapper to exclude global context clash
  var C = anm.C;
  var _ResMan = __anm.resource_manager;

  C.MOD_SCRIPTING = 'scripting';
  if (anm.M[C.MOD_SCRIPTING]) throw new Error('SCRIPTING module already enabled');

  anm.M[C.MOD_SCRIPTING] = {};

  var E = anm.Element;

  var handler_map = {
    'click': C.X_CLICK
  };

  E._customImporters.push(function(object, source, type, importer) {
    if (source[8]) { // handlers
      var handlers = source[8];
      for (var handler_type in handlers) {
        if (handlers.hasOwnProperty(handler_type)) {
          var type_handlers = handlers[handler_type];
          for (var i = 0, il = type_handlers.length; i < il; i++) {
            object.m_on(handler_map[handler_type], eval('function() { ' + type_handlers[i] + '}'));
          }
        }
      }
    }
  });

})();