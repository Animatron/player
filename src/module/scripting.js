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

  function user_ctx(elm) {
    var ctx = elm.bstate;
    ctx.findByName = function(name) {
      anm.findByName(elm.scene, name);
    };

    ctx.$ = elm;
    return ctx;
  }

  var BOUNDS_PAIR = [
      '(function(ctx) { ' +
        'return function(evt, t) { ' +
          'if (this.$.contains(evt.pos)) { ' +
            '(function(ctx, evt, t) { ',
                /* content */
            '}).call(user_ctx(this.$), ctx, evt, t);' +
          '}' +
        '}' +
      '})(____user_ctx)'];

  var NO_BOUNDS_PAIR = [
      '(function(ctx) { ' +
        'return function(evt, t) { ' +
          '(function(ctx, evt, t) { ',
              /* content */
          '}).call(user_ctx(this.$), ctx, evt, t);' +
        '}' +
      '})(____user_ctx)'];

  var handler_map = {
    'click': C.X_MCLICK,
    'dclick': C.X_MDCLICK, /* who need this? */
    'm_up': C.X_MUP,
    'm_down': C.X_MDOWN,
    'm_enter': C.X_MMOVE,
    'm_leave': C.X_MMOVE,
    'm_penter': C.X_MOVER, /* enter the player canvas */
    'm_pleave': C.X_MOUT, /* out of the player canvas */
    'm_move': C.X_MMOVE,
    'k_up': C.X_KUP,
    'k_down': C.X_KDOWN,
    'k_press': C.X_KPRESS
  }, wrappers_map = {
    'click': BOUNDS_PAIR,
    'dclick': BOUNDS_PAIR,
    'mup': BOUNDS_PAIR,
    'm_up': BOUNDS_PAIR,
    'm_down': BOUNDS_PAIR,
    'm_enter': [
      '(function(ctx) { ' +
        'return function(evt, t) { ' +
          'if ((this.$.__last_p_in == undefined || !this.$.contains(this.$.__last_p_in)) && this.$.contains(evt.pos)) { ' +
            '(function(ctx, evt, t) { ',
              /* content */
            '}).call(user_ctx(this.$), ctx, evt, t);' +
          '}' +
          'this.$.__last_p_in = evt.pos;' +
        '}' +
      '})(____user_ctx)'],
    'm_leave': [
      '(function(ctx) { ' +
        'return function(evt, t) { ' +
          'if (this.$.__last_p_out != undefined && this.$.contains(this.$.__last_p_out) && !this.$.contains(evt.pos)) { ' +
            '(function(ctx, evt, t) { ',
              /* content */
            '}).call(user_ctx(this.$), ctx, evt, t);' +
          '}' +
          'this.$.__last_p_out = evt.pos;' +
        '}' +
      '})(____user_ctx)'],
    'm_penter': BOUNDS_PAIR,
    'm_pleave': BOUNDS_PAIR,
    'm_move': NO_BOUNDS_PAIR, /* no boundaries check so MOVE is handled at the whole player canvas! */
    'k_up': NO_BOUNDS_PAIR,
    'k_down': NO_BOUNDS_PAIR,
    'k_press': NO_BOUNDS_PAIR
  };

  var ____user_ctx = { 'foo': 'bar' };

  var is_dynamic = {}; // map project id to flag

  E._customImporters.push(function(source, type, importer, import_id) {
    if ((importer === 'ANM') &&
        (type === 255) && // type === 255 is TYPE_LAYER, see animatron-importer.js
        source[8]) { // source[8] contains all scripts code
      var handlers = source[8];
      for (var handler_type in handlers) {
        var handler_code = wrappers_map[handler_type][0] +
                           handlers[handler_type] + wrappers_map[handler_type][1];

        is_dynamic[import_id] = true;
        eval('this.m_on(handler_map[handler_type], ' +
             handler_code + ');');
      }
    }
  });

  __anm.player_manager.on(C.S_NEW_PLAYER, function(player) {
    player.on(C.S_LOAD, function(scene) {
      if (is_dynamic[scene.__import_id]) { // __import_id is equal to prj_id passed to customImporter,
                                           // if it is actually the same scene that was imported there
         player.mode = C.M_DYNAMIC;
         player._checkMode();
         player.play();
      }
    });
  });

})();