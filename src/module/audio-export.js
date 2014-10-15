/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */


var Player = anm.Player,
    C = anm.C;

Player.prototype.exportAudio = function() {
  var result = [];
  if (this.anim) {
    this.anim.traverse(function(elm) {
      if (elm.is(C.ET_AUDIO)) {
        result.push({ 'url': elm._audio_url,
                      'band_offset': elm._audio_band_offset,
                      'start': elm.gband[0],
                      'end': elm.gband[1] });
      }
    });
  }

  return JSON.stringify(result);
};

var conf = {};
anm.modules.register('audio-export', conf);
