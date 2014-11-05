/*
* Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
* All rights are reserved.
*
* Animatron Player is licensed under the MIT License, see LICENSE.
*
* @VERSION
*/

var Player = anm.Player;

var E = anm.Element;

var is = anm.utils.is;

E._customImporters.push(function(source, type, importer, import_id) {
  if (importer === 'ANM') {

    switch(type) {
      case 2: // TYPE_SCENE
        if (source[4] && is.not_empty(source[4])) throw new Error('Scripting is temporarily not supported');
      case 255: // TYPE_LAYER
        if (source[8] && is.not_empty(source[8])) throw new Error('Scripting is temporarily not supported');
    }
  }
});

var conf = {};

anm.modules.register('scripting', conf);
