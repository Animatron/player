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

  E.prototype._audio_stopPlay = function() {
    this._audio.pause();
    var ndx = P.__playing_audio.indexOf(this);
    if (ndx >= 0) {
      P.__playing_audio.splice(ndx, 1);
    }

    this._audio_is_playing = false;
  };

  // Element functions
  // ----------------------------------------------------------------------------------------------------------------

  var _audio_customRender = function(gtime, ltime, ctx) {
    if (!this._audio_is_loaded || !P.playerIsPlaying) {
      return false;
    }

    var bandEnded = ltime + this.xdata.lband[0] >= this.xdata.lband[1];

    //var ltime = this.ltime(gtime);
    if (!this._audio_is_playing && ltime >= 0 && !bandEnded) {
      this._audio_schedulePlay(ltime);
    }

    if (this._audio_is_playing && bandEnded) {
      this._audio_stopPlay();
    }

    return false;
  };

  E._audio_cache = {};

  E.prototype.importCustomData = function(object) {
    if (object.id.length > 2 && "0e" === object.id.substr(object.id.length - 2)) {
      this._audio_band_offset = object.bandOffset;
      this._audio_url = object.url;
      this.isAudio = true;
      this._audio = null;
      this._audio_is_loaded = false;
      this._audio_is_playing = false;

      // assign custom render function
      this.__frameProcessors.push(_audio_customRender);

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