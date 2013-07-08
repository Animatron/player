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

  C.MOD_AUDIO = 'audio';
  if (anm.M[C.MOD_AUDIO]) throw new Error('AUDIO module already enabled');

  anm.M[C.MOD_AUDIO] = {};

  var E = anm.Element;
  var P = anm.Player;

  // Initialize player listener
  // ----------------------------------------------------------------------------------------------------------------

  P.playerIsPlaying = false;

  function onPlay() {
    P.playerIsPlaying = true;
  }

  function onStop() {
    P.playerIsPlaying = false;
    for (var i in P.__playing_audio) {
      var el = P.__playing_audio.pop();
      el._audio.pause();
      el._audio_is_playing = false;
    }
  }

  function onPause() {
    onStop();
  }

  P.addNewInstanceListener(function() {
     var player = this;
    player.on('play', onPlay);
    player.on('pause', onPause);
    player.on('stop', onStop);
  });

  // Audio initialization
  // ----------------------------------------------------------------------------------------------------------------

  P.__playing_audio = [];

  E.prototype._audio_schedulePlay = function(ltime, gtime) {
    P.__playing_audio.push(this);
    this._audio_is_playing = true;
    this._audio.currentTime = this._audio_band_offset + ltime;
    this._audio.play();
  };

  // Element functions
  // ----------------------------------------------------------------------------------------------------------------

  var _audio_customRender = function(ctx, gtime) {
    if (!this._audio_is_loaded || !P.playerIsPlaying) {
      return false;
    }

    var ltime = this.ltime(gtime);
    if (ltime >= 0 && !this._audio_is_playing) {
      this._audio_schedulePlay(ltime);
    }

    return false;
  };

  E._audio_cache = {};

  E.prototype.collectCustomData = function(object) {
    if (object.id.length > 2 && "0e" === object.id.substr(object.id.length - 2)) {
      this._audio_band_offset = object.bandOffset;
      this._audio_url = object.url;
      this.isAudio = true;
      this._audio = null;
      this._audio_is_loaded = false;
      this._audio_is_playing = false;

      // assign custom render function
      this.customRender = _audio_customRender;

      this._audio_load();
    }
  };

  E.prototype._audio_load = function() {
    var me = this;

    function whenDone(audio) {
      me._audio = audio;
      me._audio_is_loaded = true;
    }

    var _cached = E._audio_cache[this.url];
    if (_cached) {
      if (_cached.data_loaded) {
        whenDone(_cached.audio);
      } else {
        _cached.listeners.push(whenDone);
      }
    } else {
      _cached = {};
      _cached.listeners = [whenDone];
      _cached.data_loaded = false;
      _cached.audio = null;
      E._audio_cache[this.url] = _cached;

      var el = document.createElement("audio");
      el.setAttribute("preload", "auto");
      el.addEventListener("loadeddata", function(e) {
        _cached.data_loaded = true;
        _cached.audio = el;
        while (true) {
          var listener = _cached.listeners.pop();
          if (listener) {
            listener.call(me, el);
            continue;
          }

          break;
        }
      }, false);

      try {
        document.getElementsByTagName("body")[0].appendChild(el);
        el.src = this._audio_url;
      } catch(e) {
        throw new Error('Audio at ' + me.src + ' is not accessible');
      }
    }
  };

})();