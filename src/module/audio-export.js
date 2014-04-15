/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

if (typeof __anm_engine === 'undefined') throw new Error('No engine found!');

__anm_engine.define('anm/modules/audio-export', ['anm', 'anm/Player'], function(anm/*, Player*/) {

var Player = anm.Player;

var _export_audio_data = function(data) {
  return {
    "url": data.$._audio_url,
    "band_offset": data.$._audio_band_offset,
    "start": data.gband[0],
    "end": data.gband[1]
  };
};

Player.prototype.exportAudio = function() {
  var result = [];
  if (this.anim) {
    this.anim.visitElems(function(el) {
      if (el.isAudio != undefined && el.isAudio) {
        result.push(_export_audio_data(el.xdata));
      }
    });
  }

  return JSON.stringify(result);
};

var conf = {};

anm.registerModule('audio-export', conf);

return conf;

});
