/*
 * Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

if (typeof __anm_engine === 'undefined') throw new Error('No engine found!');

__anm_engine.define('anm/modules/audio', ['anm', 'anm/Player'], function(anm/*, Player*/) {

  var C = anm.C,
      Tween = anm.Tween,
      Tweens = anm.Tweens;

  var _ResMan = anm.resource_manager;

  var m_ctx = {};

  var E = anm.Element;

  // Initialization
  // ----------------------------------------------------------------------------------------------------------------

  m_ctx._audio_ctx = function() {
    var context = window.webkitAudioContext || window.audioContext || window.AudioContext;
    return context ? new context() : null;
  }();

  C.T_VOLUME = 'VOLUME';
  Tween.TWEENS_PRIORITY[C.T_VOLUME] = Tween.TWEENS_COUNT++;
  Tweens[C.T_VOLUME] = function() {
    return function(t, duration, data) {
      if (!this.$._audio_is_loaded) return;
      this.$._audio.volume = data[0] * (1.0 - t) + data[1] * t;
    };
  };

  if (anm.isImporterAccessible('animatron')) { // FIXME: should test with require, in some optional way, like 'anm/import/animatron?'
    var Import = anm.getImporter('animatron').Import;
    var prev_tweentype = Import.tweentype;
    Import.tweentype = function(src) {
      if (src === 7) return C.T_VOLUME;
      return prev_tweentype.apply(this, arguments);
    }
    var prev_tweendata = Import.tweendata;
    Import.tweendata = function(type, src) {
      if ((type === C.T_VOLUME) && src) {
        if (src.length == 2) return src;
        if (src.length == 1) return [ src[0], src[0] ];
      }
      return prev_tweendata.apply(this, arguments);
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
    var current_time = this._audio_band_offset + ltime;

    if (m_ctx._audio_ctx) {
      this._source = m_ctx._audio_ctx.createBufferSource();
      this._source.buffer = this._audio;
      this._source.connect(m_ctx._audio_ctx.destination);

      if (this._source.play) {
        this._source.play(0, current_time);
      } else if (this._source.start) {
        this._source.start(0, current_time, this._source.buffer.duration - current_time);
      } else {
        this._source.noteGrainOn(0, current_time, this._source.buffer.duration - current_time);
      }
    } else {
      this._audio.currentTime = current_time;
      this._audio.volume = 1;
      this._audio.play();
    }
  };

  var _onAudioStopIfNotMaster = function(ltime, duration) {
    if (this._audio_master) return;
    _onAudioStop.call(this, ltime, duration);
  }

  var _onAudioStop = function(ltime, duration) {
    if (this._audio_is_playing) {
      try {
        if (m_ctx._audio_ctx) {
          if (this._source.stop) {
            this._source.stop(0);
          } else {
            this._source.noteOff(0);
          }

          this._source = null;
        } else {
          this._audio.pause();
          this._audio.volume = 0;
        }
      } catch (err) {
        // do noting
      }

      this._audio_is_playing = false;
    }
  };

  E._customImporters.push(function(source, type, importer) {
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
        this._audio_url = source[1];
        this._audio_band_offset = source[2];
        this._audio_master = source[3];
      } else if (importer == "ANM_INTACT") {
        this._audio_band_offset = source.bandOffset;
        this._audio_url = this._audio_format_url(source.url);
      }

      this.isAudio = true;
      this._audio = null;
      this._audio_is_loaded = false;
      this._audio_is_playing = false;
      this._audio_canPlay = false;

      this.on(C.X_START, _onAudioStart);
      this.on(C.X_STOP, _onAudioStopIfNotMaster);
      this.on(C.S_STOP, _onAudioStop);
      this.on(C.S_PAUSE, _onAudioStop);

      // assign custom render function
      this.__frameProcessors.push(_audio_customRender);
    }
  });

  E.prototype._audio_format_url = function(url) {
    return url + (this._ogg_supported() ? ".ogg" : ".mp3");
  };

  E.__test_elm = null;

  E.prototype._ogg_supported = function() {
    var a = E.__test_elm ? E.__test_elm : (E.__test_elm = document.createElement('audio'), E.__test_elm);
    return !!(a.canPlayType && a.canPlayType('audio/ogg;').replace(/no/, ''));
  }

  var prev__hasRemoteResources = E.prototype._hasRemoteResources;
  E.prototype._hasRemoteResources = function(scene, player) {
    return prev__hasRemoteResources.apply(this, arguments) || (this.isAudio && player.audioEnabled);
  }

  var prev__collectRemoteResources = E.prototype._collectRemoteResources;
  E.prototype._collectRemoteResources = function(scene, player) {
    var prev = prev__collectRemoteResources.apply(this, arguments);
    if (!player.audioEnabled) return prev;
    if (!this.isAudio) return prev;
        // return [ this._audio_url ].concat(prev || [])
    return prev ? [ this._audio_url ].concat(prev) : [ this._audio_url ];
  }

  var prev__loadRemoteResources = E.prototype._loadRemoteResources;
  E.prototype._loadRemoteResources = function(scene, player) {
    var prev = prev__loadRemoteResources.apply(this, arguments);
    if (this.isAudio && player.audioEnabled) this._audioLoad();
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

  // workaround, see http://stackoverflow.com/questions/10365335/decodeaudiodata-returning-a-null-error
  function syncStream(node){
    var buf8 = new Uint8Array(node.buf);
    buf8.indexOf = Array.prototype.indexOf;
    var i=node.sync, b=buf8;
    while(1) {
        node.retry++;
        i=b.indexOf(0xFF,i); if(i==-1 || (b[i+1] & 0xE0 == 0xE0 )) break;
        i++;
    }
    if(i!=-1) {
        var tmp=node.buf.slice(i); //carefull there it returns copy
        delete(node.buf); node.buf=null;
        node.buf=tmp;
        node.sync=i;
        return true;
    }
    return false;
  }

  E.prototype._audioLoad = function() {
    var me = this;

    _ResMan.loadOrGet(me._audio_url,
      function(notify_success, notify_error) { // loader
          if (anm.conf.doNotLoadAudio) {
            notify_error('Loading audio is turned off');
            return;
          }

          if (m_ctx._audio_ctx) {
            // use Web Audio API if possible
            var url = me._audio_format_url(me._audio_url);

            var node = {};

            var decode = function(node, url) {
              try {
                m_ctx._audio_ctx.decodeAudioData(node.buf, function onSuccess(decodedBuffer) {
                  notify_success(decodedBuffer);
                }, function(err) {
                  if (syncStream(node)) decode(node, url);
                });
              } catch(e) {
                notify_error('Unable to load audio ' + url + ': ' + e.message);
              }
            };

            var loadingDone = function(e) {
              var req = e.target;
              if (req.status == 200) {
                node.buf = req.response;
                node.sync = 0;
                node.retry = 0;
                decode(node);
              } else {
                notify_error('Unable to load audio ' + url + ': ' + req.statusText);
              }
            };

            node.xhr = new XMLHttpRequest();
            node.xhr.open('GET', url, true);
            node.xhr.responseType = 'arraybuffer';
            node.xhr.addEventListener('load', loadingDone, false);
            node.xhr.addEventListener('error', audioErrProxy(url, notify_error), false);
            node.xhr.send();
          } else {
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
              } else if (me._audio_canPlay && buffered.length != 1) {
                // will skip preloading since it seems like it will not work properly anyway:
                // it's a workaround for Android-based browsers which
                // will not allow prebuffering until user will explicitly allow it (by touching something)
                notify_success(el);
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
                src.addEventListener("error", notify_error, false);
                audio.appendChild(src);
            };

            try {
              document.getElementsByTagName("body")[0].appendChild(el);
              addSource(el, me._audio_url + ".mp3", "audio/mpeg");
              addSource(el, me._audio_url + ".ogg", "audio/ogg");
            } catch(e) { notify_error(e); }
          }
      },
      function(audio) { // oncomplete
          me._audio = audio;
          me._audio_is_loaded = true;
      },
      function(err) { anm.log.error(err ? (err.message || err) : 'Unknown error');
                      /* throw err; */ }); // onerror
  };

  anm.registerModule('audio', m_ctx);

  return m_ctx;

});
