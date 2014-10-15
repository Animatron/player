/*
* Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
* All rights are reserved.
*
* Animatron Player is licensed under the MIT License, see LICENSE.
*
* @VERSION
*/

var _ResMan = anm.resource_manager;
var Player = anm.Player;

var is = anm.utils.is;
var C = anm.constants;
var E = anm.Element;

var $log = anm.log;

var __findByName = function(elm) {
  return function(name, context) {
    return anm.find(context || elm.anim, name);
  };
};

var __jumpToScene = function(elm) {
  return function(name) {
    var scenes = this.find(name);
    if (scenes.length) {
      elm.scene.invokeLater(function() {
        if (elm.scene.__player_instance) {
            elm.scene.__player_instance.pause();
            elm.scene.__player_instance.play(scenes[0].gband[0]);
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
  // FIXME: this will fail in scripting
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
      'var elm = this.$ || this; ' +
      'if (elm.contains(evt.pos, t)) { ' +
        '(function(ctx, evt, t) { ' +
          'var _b = anm.Builder._$;' +
            inner +
        '\n}).call(user_ctx(elm), ctx, evt, t);' +
      '}');
  } else {
    return _tpl_base(
      'var elm = this.$ || this; ' +
      '(function(ctx, evt, t) { ' +
        'var _b = anm.Builder._$;' +
            inner +
        '\n}).call(user_ctx(elm), ctx, evt, t);');
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
        'var elm = this.$ || this; ' +
        'if ((elm.__last_p_in == undefined || !elm.contains(elm.__last_p_in, t)) && elm.contains(evt.pos, t)) { ' +
          '(function(ctx, evt, t) { ' +
            'var _b = anm.Builder._$;' +
            body +
          '\n}).call(user_ctx(elm), ctx, evt, t);' +
        '}' +
        'elm.__last_p_in = evt.pos;');
        break;
      case 'm_leave':
        handler_code = _tpl_base(
          'var elm = this.$ || this; ' +
          'if (elm.__last_p_out != undefined && elm.contains(elm.__last_p_out, t) && !elm.contains(evt.pos, t)) { ' +
          '(function(ctx, evt, t) { ' +
            'var _b = anm.Builder._$;' +
            body +
          '\n}).call(user_ctx(elm), ctx, evt, t);' +
        '}' +
        'elm.__last_p_out = evt.pos;');
        break;
      default:
        handler_code = tpl(e_type == 255, body);
        break;
    }

    result = true;
    var registrar = handler_type == 'init' ? 'on' : 'm_on';
    try {
      eval('this.' + registrar + '(handler_map[handler_type], ' + handler_code + ');');
    } catch(e) { $log.error('A potential error in scripting code, skipping: ' + handler_code); }
  }

  return result;
};

var ____user_ctx = { 'foo': 'bar' };

var is_dynamic = {}; // map project id to flag

E._customImporters.push(function(source, type, importer, import_id) {
  if (importer === 'ANM') {
    switch(type) {
      case 2: // TYPE_SCENE
        is_dynamic[import_id] = iterate_handlers.call(this, source[4], type) || is_dynamic[import_id];
        break;
      case 255: // TYPE_LAYER
        is_dynamic[import_id] = iterate_handlers.call(this, source[8], type) || is_dynamic[import_id];
        break;
      default:
        break;
    }
  }
});

anm.player_manager.on(C.S_NEW_PLAYER, function(player) {
  player.on(C.S_LOAD, function(scene) {
    if (is_dynamic[scene.__import_id]) { // __import_id is equal to prj_id passed to customImporter,
                                         // if it is actually the same scene that was imported there
       player.mode = C.M_DYNAMIC;
       player.anim.duration = Infinity; // sure? :^)
       player._updateMode();
       scene.__player_instance = player;
       player.play();
    }
  });
});

var conf = {};

anm.modules.register('scripting', conf);
