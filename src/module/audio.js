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
  var _ResMan = __anm.resource_manager;

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

  E.prototype.importCustomData = function(object, type, importer) {
    if ((14 == type)/*ANM*/ ||
        ("0e" == type)/*ANM_INTACT*/) {
      if (importer == "ANM") {
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
      } else if (importer == "ANM_INTACT") {
        this._audio_band_offset = object.bandOffset;
        this._audio_url = this._audio_format_url(object.url);
      }

      this.isAudio = true;
      this._audio = null;
      this._audio_is_loaded = false;
      this._audio_is_playing = false;

      this.on(C.X_START, _onAudioStart);
      this.on(C.X_STOP, _onAudioStop);
      this.on(C.S_STOP, _onAudioStop);
      this.on(C.S_PAUSE, _onAudioStop);

      // assign custom render function
      this.__frameProcessors.push(_audio_customRender);

      this._audio_load();
    }
  };

  E.prototype._audio_format_url = function(url) {
    return url + (this._mpeg_supported() ? ".mp3" : ".ogg");
  };

  E.__test_elm = null;
  E.prototype._mpeg_supported = function() {
    var a = E.__test_elm ? E.__test_elm : (E.__test_elm = document.createElement('audio'), E.__test_elm);
    return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
  }

  var prev__hasRemoteResources = E.prototype._hasRemoteResources;
  E.prototype._hasRemoteResources = function() {
    return prev__hasRemoteResources.call(this, arguments) || this.isAudio;
  }

  var prev__getRemoteResources = E.prototype._getRemoteResources;
  E.prototype._getRemoteResources = function() {
    var prev = prev__getRemoteResources.call(this, arguments);
    if (!this.isAudio && !prev) return null;
    if (!this.isAudio) return prev;
        // return [ this._audio_url ].concat(prev || [])
    return prev ? [ this._audio_url ].concat(prev) : [ this._audio_url ];
  }

  E.prototype._audio_load = function() {
    var me = this;

    _ResMan.loadOrGet(me._audio_url,
      function(onsuccess, onerror) { // loader
          var el = document.createElement("audio");
          el.setAttribute("preload", "auto");
          el.addEventListener("loadeddata", function(e) {
            onsuccess(el);
          }, false);
          el.addEventListener("error", onerror, false);

          try {
            document.getElementsByTagName("body")[0].appendChild(el);
            el.src = me._audio_url;
          } catch(e) {
            onerror(e);
            throw new Error('Audio at ' + me._audio_url + ' is not accessible');
          }
      },
      function(audio) {  // oncomplete
          me._audio = audio;
          me._audio_is_loaded = true;
          if (callback) callback.call(me, audio);
      });

  };

})();