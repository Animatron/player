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
  var Player = anm.Player;

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
             '(function(ctx, evt, t) { ',
                /* content */
             '}).call(this.$.bstate, ctx, evt, t);' +
           '}' +
         '}' +
      '})(____user_ctx)'
    ]
  };

  var ____user_ctx = { 'foo': 'bar' };

  var last_scene_is_dynamic;

  E._customImporters.push(function(source, type, importer) {
    if ((type === 255) && source[8]) { // type === 255 is TYPE_LAYER, see animatron-importer.js
      var handlers = source[8];
      for (var handler_type in handlers) {
        var handler_code = wrappers_map[handler_type][0] +
                           handlers[handler_type] + wrappers_map[handler_type][1];

        last_scene_is_dynamic = true;
        eval('this.m_on(handler_map[handler_type], ' +
             handler_code + ');');
      }
    }
  });

  var prev_forSnapshot = Player.forSnapshot;
  Player.forSnapshot = function(canvasId, snapshotUrl, importer, callback) {
    last_scene_is_dynamic = false;
    var player = prev_forSnapshot.call(this, canvasId, snapshotUrl, importer, function() {
      if (last_scene_is_dynamic) {
          player.mode = C.M_DYNAMIC;
          player._checkMode();
          player.play();
      }
      last_scene_is_dynamic = false;
      if (callback) callback();
    });
    return player;
  }

})();