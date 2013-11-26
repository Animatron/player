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

  var __findByName = function(elm) {
    return function(name, context) {
      return anm.findByName(context || elm.scene, name);
    };
  };

  var __jumpToScene = function(elm) {
    return function(name) {
      var scenes = this.findByName(name);
      if (scenes.length) {
        elm.scene.invokeLater(function() {
          if (elm.scene.__player_instance) {
              elm.scene.__player_instance.pause();
              elm.scene.__player_instance.play(scenes[0].xdata.gband[0]);
          }
        });
      }
    };
  };

  var __jumpToTime = function(elm) {
    return function(t) {
      elm.scene.invokeLater(function() {
        if (elm.scene.__player_instance) {
            elm.scene.__player_instance.pause();
            elm.scene.__player_instance.play(t);
        }
      });
    };
  };

  function user_ctx(elm) {
    var ctx = elm.bstate || {};
    ctx.findByName = __findByName(elm);
    ctx.jumpToScene = __jumpToScene(elm);
    ctx.jumpToTime = __jumpToTime(elm);
    ctx.$ = elm;
    return ctx;
  };

  function _tpl_base(inner) {
    return '(function(ctx) { ' +
        'return function(evt, t) { ' +
          inner +
        '}' +
      '})(____user_ctx)';
  };

  function tpl(bounds, inner) {
    if (bounds) {
      return _tpl_base(
        'if (this.$.contains(evt.pos, t)) { ' +
          '(function(ctx, evt, t) { ' +
            'var _b = Builder._$;' +
              inner +
          '\n}).call(user_ctx(this.$ || this), ctx, evt, t);' +
        '}');
    } else {
      return _tpl_base(
        '(function(ctx, evt, t) { ' +
          'var _b = Builder._$;' +
              inner +
          '\n}).call(user_ctx(this.$ || this), ctx, evt, t);');
    }
  };

  var handler_map = {
    'click': C.X_MCLICK,
    'm_up': C.X_MUP,
    'm_down': C.X_MDOWN,
    'm_enter': C.X_MMOVE,
    'm_leave': C.X_MMOVE,
    'm_move': C.X_MMOVE,
    'k_up': C.X_KUP,
    'k_down': C.X_KDOWN,
    'k_press': C.X_KPRESS,
    'init': C.S_LOAD
  };

  function iterate_handlers(handlers, e_type) {
    if (!handlers) return false;
    var result = false;
    for (var handler_type in handlers) {
      var body = handlers[handler_type];

      var handler_code;
      switch(handler_type) {
        case 'm_move', 'm_up', 'k_up', 'k_down', 'k_press':
          handler_code = tpl(false, body);
          break;
        case 'm_enter':
          handler_code = _tpl_base(
          'if ((this.$.__last_p_in == undefined || !this.$.contains(this.$.__last_p_in, t)) && this.$.contains(evt.pos, t)) { ' +
            '(function(ctx, evt, t) { ' +
              'var _b = Builder._$;' +
              body +
            '\n}).call(user_ctx(this.$ || this), ctx, evt, t);' +
          '}' +
          'this.$.__last_p_in = evt.pos;');
          break;
        case 'm_leave':
          handler_code = _tpl_base(
            'if (this.$.__last_p_out != undefined && this.$.contains(this.$.__last_p_out, t) && !this.$.contains(evt.pos, t)) { ' +
            '(function(ctx, evt, t) { ' +
              'var _b = Builder._$;' +
              body +
            '\n}).call(user_ctx(this.$ || this), ctx, evt, t);' +
          '}' +
          'this.$.__last_p_out = evt.pos;');
          break;
        default:
          handler_code = tpl(e_type == 255, body);
          break;
      }

      result = true;
      var registar = handler_type == 'init' ? 'on' : 'm_on';
      eval('this.' + registar + '(handler_map[handler_type], ' + handler_code + ');');
    }

    return result;
  };

  var ____user_ctx = { 'foo': 'bar' };

  var is_dynamic = {}; // map project id to flag

  E._customImporters.push(function(source, type, importer, import_id) {
    if (importer === 'ANM') {
      switch(type) {
        case 2: // TYPE_SCENE
          is_dynamic[import_id] = iterate_handlers.call(this, source[5]);
          break;
        case 255: // TYPE_LAYER
          is_dynamic[import_id] = iterate_handlers.call(this, source[8]);
          break;
        default:
          break;
      }
    }
  });

  __anm.player_manager.on(C.S_NEW_PLAYER, function(player) {
    player.on(C.S_LOAD, function(scene) {
      if (is_dynamic[scene.__import_id]) { // __import_id is equal to prj_id passed to customImporter,
                                           // if it is actually the same scene that was imported there
         player.mode = C.M_DYNAMIC;
         player.anim.setDuration(Infinity); // sure? :^)
         player._checkMode();
         scene.__player_instance = player;
         player.play();
      }
    });
  });

})();