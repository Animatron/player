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
      Tween = anm.Tween,
      Tweens = anm.Tweens;
  var _ResMan = __anm.resource_manager;

  C.MOD_AUDIO = 'audio';
  if (anm.M[C.MOD_AUDIO]) throw new Error('AUDIO module already enabled');

  anm.M[C.MOD_AUDIO] = {};

  var E = anm.Element;

  // Initialization
  // ----------------------------------------------------------------------------------------------------------------

  C.T_VOLUME = 'VOLUME';
  Tween.TWEENS_PRIORITY[C.T_VOLUME] = Tween.TWEENS_COUNT++;
  Tweens[C.T_VOLUME] = function() {
    return function(t, duration, data) {
      if (!this.$._audio_is_loaded) return;
      this.$._audio.volume = data[0] * (1.0 - t) + data[1] * t;
    };
  };

  if (anm.I['ANM']) {
    var Import = anm.I['ANM'];
    var prev_tweentype = Import.tweentype;
    Import.tweentype = function(src) {
      if (src === 7) return C.T_VOLUME;
      return prev_tweentype(src);
    }
    var prev_tweendata = Import.tweendata;
    Import.tweendata = function(type, src) {
      if ((type === C.T_VOLUME) && src) {
        if (src.length == 2) return src;
        if (src.length == 1) return [ src[0], src[0] ];
      }
      return prev_tweendata(src);
    }
  }

  // Element functions
  // ----------------------------------------------------------------------------------------------------------------

  var _audio_customRender = function(gtime, ltime, ctx) {
    // TODO: remove
    //return false;
  };

  var _onAudioStart = function(ltime, duration) {
    if (!this._audio_is_loaded || this._audio_is_playing) {
      return false;
    }

    this._audio_is_playing = true;
    this._audio.currentTime = this._audio_band_offset + ltime;
    this._audio.volume = 1;
    this._audio.play();
  };

  var _onAudioStop = function(ltime, duration) {
    if (this._audio_is_playing) {
      this._audio.pause();
      this._audio_is_playing = false;
      this._audio.volume = 0;
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
        this._audio_url = object[1];
        this._audio_band_offset = object[2];
      } else if (importer == "ANM_INTACT") {
        this._audio_band_offset = object.bandOffset;
        this._audio_url = this._audio_format_url(object.url);
      }

      this.isAudio = true;
      this._audio = null;
      this._audio_is_loaded = false;
      this._audio_is_playing = false;
      this._audio_canPlay = false;

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

  function audioErrProxy(src, pass_to) {
    return function(err) {
      // e_.MEDIA_ERR_ABORTED=1
      // e_.MEDIA_ERR_NETWORK=2
      // e_.MEDIA_ERR_DECODE=3
      // e_.MEDIA_ERR_SRC_NOT_SUPPORTED=4
      // e_.MEDIA_ERR_ENCRYPTED=5
      pass_to(new Error('Failed to load audio file from ' + src + ' with error code: ' +
                        err.currentTarget.error.code));
    }
  };

  E.prototype._audio_load = function() {
    var me = this;

    _ResMan.loadOrGet(me._audio_url,
      function(notify_success, notify_error) { // loader
          var el = document.createElement("audio");
          el.setAttribute("preload", "auto");

          var progressListener = function(e) {
            var buffered = el.buffered;
            if (buffered.length == 1) {
                var end = buffered.end(0);
                if (el.duration - end < 0.05) {
                  el.removeEventListener("progress", progressListener, false);
                  el.removeEventListener("canplay", canPlayListener, false);
                  notify_success(el);
                  return;
                }

                if (me._audio_canPlay && window.chrome) {
                  el.volume = 0;
                  el.currentTime = end;
                  el.play();
                  el.pause();
                }
            }
          };

          var canPlayListener = function(e) {
            me._audio_canPlay = true;
            progressListener(e);
          };

          el.addEventListener("progress", progressListener, false);
          el.addEventListener("canplay", canPlayListener, false);
          el.addEventListener("error", audioErrProxy(me._audio_url, notify_error), false);

          var addSource = function(audio, url, type) {
              var src = document.createElement("source");
              src.type = type;
              src.src = url;
              audio.appendChild(src);
          };

          try {
            document.getElementsByTagName("body")[0].appendChild(el);
            addSource(el, me._audio_url + ".mp3", "audio/mpeg");
            addSource(el, me._audio_url + ".ogg", "audio/ogg");
          } catch(e) { notify_error(e); }
      },
      function(audio) { // oncomplete
          me._audio = audio;
          me._audio_is_loaded = true;
      },
      function(err) { __anm.console.error(err.message || err);
                      /* throw err; */ }); // onerror
  };

})();