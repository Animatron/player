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

  // Element functions
  // ----------------------------------------------------------------------------------------------------------------

  var _audio_customRender = function(gtime, ltime, ctx) {
    // TODO: remove
    return false;
  };

  var _onAudioStart = function(ltime, duration) {
    if (!this._audio_is_loaded || this._audio_is_playing) {
      return false;
    }

    this._audio_is_playing = true;
    this._audio.currentTime = this._audio_band_offset + ltime;
    this._audio.play();
  };

  var _onAudioStop = function(ltime, duration) {
    if (this._audio_is_playing) {
      this._audio.pause();
      this._audio_is_playing = false;
    }
  };

  E._audio_cache = {};

  E.prototype.importCustomData = function(object, type, importer) {
    if (("0e" == type)/*ANM*/ ||
        (14 == type)/*ANM_PUBLISH*/) {
      if (importer == "ANM") {
        this._audio_band_offset = object.bandOffset;
        this._audio_url = this._audio_format_url(object.url);
      } else if (importer == "ANM_PUBLISH") {
        /** audio **/
        /*
         * array {
         *     14;                         // 0
         *     string;                     // 1, url
         *     number;                     // 2, band offset
         * } *audio_element*;
         */
        this._audio_url = this._audio_format_url(object[1]);
        this._audio_band_offset = object[2];
      }
      this.isAudio = true;
      this._audio = null;
      this._audio_is_loaded = false;
      this._audio_is_playing = false;

      this.on(C.X_START, _onAudioStart);
      this.on(C.X_STOP, _onAudioStop);

      // assign custom render function
      this.__frameProcessors.push(_audio_customRender);

      this._audio_load();
    }
  };

  E.prototype._audio_format_url = function(url) {
    return url + (this._mpeg_supported() ? ".mp3" : ".ogg");
  };

  E.prototype._mpeg_supported = function() {
    var a = document.createElement('audio');
    return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
  }

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