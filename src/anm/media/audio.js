var C = require('../constants.js'),
    engine = require('engine'),
    ResMan = require('../resource_manager.js'),
    conf = require('../conf.js'),
    log = require('../log.js');

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

function audioErrProxy(src, pass_to) {
  return function(err) {
    // e_.MEDIA_ERR_ABORTED=1
    // e_.MEDIA_ERR_NETWORK=2
    // e_.MEDIA_ERR_DECODE=3
    // e_.MEDIA_ERR_SRC_NOT_SUPPORTED=4
    // e_.MEDIA_ERR_ENCRYPTED=5
    pass_to(new Error('Failed to load audio file from ' + src + ' with error code: ' +
                      err.currentTarget.error.code));
  };
}

var testAudio = engine.createAudio(),
    oggSupported =  !!(testAudio.canPlayType && testAudio.canPlayType('audio/ogg;').replace(/no/, ''));

var audioExt = oggSupported ? '.ogg' : '.mp3';
var audioType = oggSupported ? 'audio/ogg' : 'audio/mp3';

function getAudioContext() {
    if (engine.isLocal) {
        // we will not be able to load the audio as an ArrayBuffer
        // when we're under file protocol, so we shall have to
        // fall back to <audio> when playing locally.
        return null;
    }

    var AudioContext = global.AudioContext || global.webkitAudioContext;
    if (!AudioContext) {
      return null;
    }

    if(global.anmAudioContext) {
        return global.anmAudioContext;
    }

    try {
      var ctx = new AudioContext();
      return (global.anmAudioContext = ctx);
    } catch (e) {
      return null;
    }
}

var audioContext = getAudioContext();

/**
 * @class anm.Audio
 */
function Audio(url) {
    this.url = url + audioExt;
    this.loaded = false;
    this.playing = false;
    this.canPlay = false;
    this.volume = 1;
    this.audio = null;
}
/** @private @method load */
Audio.prototype.load = function(player) {
    var me = this;
    ResMan.loadOrGet(player.id, me.url,
      function(notify_success, notify_error) { // loader
          var url = me.url;
          if (engine.isHttps) {
              url = url.replace('http:', 'https:');
          }

          if (anm.conf.doNotLoadAudio) {
            notify_error('Loading audio is turned off');
            return;
          }

          if (audioContext) {
            // use Web Audio API if possible

            var node = {};

            var decode = function(node, url) {
              try {
                audioContext.decodeAudioData(node.buf, function onSuccess(decodedBuffer) {
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
            var el = engine.createAudio();
            el.setAttribute("preload", "auto");

            var progressListener = function(e) {
              var buffered = el.buffered;
              if (buffered.length == 1) {
                  if (el.readyState === 4) {
                    el.removeEventListener("progress", progressListener, false);
                    el.removeEventListener("canplay", canPlayListener, false);
                    notify_success(el);
                    return;
                  }

                  if (me.canPlay && window.chrome) {
                    el.volume = 0;
                    el.currentTime = end;
                    el.play();
                    el.pause();
                  }
              } else if (me.canPlay && buffered.length != 1) {
                // will skip preloading since it seems like it will not work properly anyway:
                // it's a workaround for Android-based browsers which
                // will not allow prebuffering until user will explicitly allow it (by touching something)
                notify_success(el);
              }
            };

            var canPlayListener = function(e) {
              me.canPlay = true;
              progressListener(e);
            };

            el.addEventListener("progress", progressListener, false);
            el.addEventListener("canplay", canPlayListener, false);
            el.addEventListener("error", audioErrProxy(url, notify_error), false);

            var addSource = function(audio, url, type) {
                var src = engine.createSource();
                src.type = type;
                src.src = url;
                src.addEventListener("error", notify_error, false);
                audio.appendChild(src);
            };

            try {
              engine.appendToBody(el);
              addSource(el, url, audioType);
            } catch(e) { notify_error(e); }
          }
      },
      function(audio) { // oncomplete
          me.audio = audio;
          me.loaded = true;
          if (player.muted) {
              me.mute();
          }

      },
      function(err) { log.error(err ? (err.message || err) : 'Unknown error');
                      /* throw err; */ });
};
/** @private @method play */
Audio.prototype.play = function(ltime, duration) {
    if (!this.loaded || this.playing) {
      return false;
    }

    this.playing = true;
    var current_time = this.offset + ltime;

    if (audioContext) {
      if (current_time > this.audio.duration) {
        this._audio_is_playing = false;
        return;
      }

      this._source = audioContext.createBufferSource();
      this._source.buffer = this.audio;
      this._gain = audioContext.createGain();
      this._source.connect(this._gain);
      this._gain.connect(audioContext.destination);
      this._gain.gain.value = this.volume;

      if (this._source.play) {
        this._source.play(0, current_time);
      } else if (this._source.start) {
        this._source.start(0, current_time, this._source.buffer.duration - current_time);
      } else {
        this._source.noteGrainOn(0, current_time, this._source.buffer.duration - current_time);
      }
    } else {
      this.audio.currentTime = current_time;
      this.audio.volume = this.volume;
      this.audio.play();
    }
};
/** @private @method stop */
Audio.prototype.stop = function() {
    if (!this.playing) {
        return;
    }
    try {
        if (audioContext) {
            if (this._source.stop) {
                this._source.stop(0);
            } else {
                this._source.noteOff(0);
            }
            this._source = null;
        } else {
            this.audio.pause();
            this.audio.volume = 0;
        }
    } catch (err) {
        // do nothing
    }
    this.playing = false;
};
/** @private @method stopIfNotMaster */
Audio.prototype.stopIfNotMaster = function() {
    if (!this.master) this.stop();
};
/**
 * @method setVolume
 * @chainable
 * @deprecated will be renamed to `.volume()`, will be both getter and setter
 *
 * Change audio volume on the fly
 *
 * @param {Number} volume Volume value
 * @return {anm.Audio}
 */
Audio.prototype.setVolume = function(volume) {
    if (this.muted) {
        this.unmuteVolume = volume;
        return;
    }
    this.volume = volume;
    if (this._gain) {
        this._gain.gain.value = volume;
    } else if (this.audio) {
        this.audio.volume = volume;
    }
    return this;
};
/**
 * @method mute
 *
 * Mute this audio
 */
Audio.prototype.mute = function() {
    if (this.muted) {
        return;
    }
    this.unmuteVolume = this.volume;
    this.setVolume(0);
    this.muted = true;
};
/**
 * @method unmute
 *
 * Unmute this audio
 */
Audio.prototype.unmute = function() {
    if (!this.muted) {
        return;
    }
    this.muted = false;
    this.setVolume(this.unmuteVolume);
};
/**
 * @method toggleMute
 *
 * Toggle mute value of this audio
 */
Audio.prototype.toggleMute = function() {
    if (this.muted) {
        this.unmute();
    } else {
        this.mute();
    }
};
/** @private @method connect */
Audio.prototype.connect = function(element) {
    var me = this;
    element.on(C.X_START, function() {
        me.play.apply(me, arguments);
    });
    element.on(C.X_STOP, function() {
        me.stopIfNotMaster();
    });
    var stop = function() {
        me.stop();
    };
    element.on(C.S_STOP, stop);
    element.on(C.S_PAUSE, stop);
};

module.exports = Audio;
