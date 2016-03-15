var conf = require('../conf.js'),
    log = require('../log.js'),
    utils = require('../utils.js');

var C = require('../constants.js');

var errors = require('../errors.js');

var engine = require('engine');

var ResMan = require('../resource_manager.js');

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

    if (global.anmAudioContext) {
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
    this.url = /\.\w+$/i.test(url) ? url : url + audioExt;
    this.ready = false;
    this.playing = false;
    this.canPlay = false;
    this.volume = 1;
    this.audio = null;
}
/** @private @method load */
Audio.prototype.load = function(uid, player) {
    var me = this;
    ResMan.loadOrGet(uid, me.url,
      function(notify_success, notify_error, notify_progress) { // loader
          var url = engine.checkMediaUrl(me.url);

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
                  // 0 == HAVE_NOTHING
                  // 1 == HAVE_METADATA
                  // 2 == HAVE_CURRENT_DATA
                  // 3 == HAVE_FUTURE_DATA
                  // 4 == HAVE_ENOUGH_DATA
                  if (el.readyState === 4 || el.readyState === 3) {
                    engine.unsubscribeElementEvents(el,
                        { 'progress': progressAndLoadingListener,
                          'loadedmetadata': loadingListener,
                          'canplay': canPlayListener });
                    notify_success(el);
                    notify_progress(1);
                    return;
                  }

                  if (me.canPlay && window.chrome) {
                    el.volume = 0;
                    el.currentTime = buffered.end(0);
                    el.play();
                    el.pause();
                  }
              } else if (me.canPlay && buffered.length != 1) {
                // will skip preloading since it seems like it will not work properly anyway:
                // it's a workaround for Android-based browsers which
                // will not allow prebuffering until user will explicitly allow it (by touching something)
                engine.unsubscribeElementEvents(el,
                    { 'progress': progressAndLoadingListener,
                      'loadedmetadata': loadingListener,
                      'canplay': canPlayListener });
                notify_success(el);
                notify_progress(1);
              }
            };

            var loadingListener = function(e) {
                var ranges = [];
                for (var i = 0; i < el.buffered.length; i++) {
                    ranges.push([ el.buffered.start(i),
                                  el.buffered.end(i) ]);
                }

                for (i = 0, progress = 0; i < el.buffered.length; i ++) {
                    progress += (1 / el.duration) * (ranges[i][1] - ranges[i][0]);
                }

                notify_progress(progress);
            };

            var progressAndLoadingListener = function(e) {
                progressListener(e); loadingListener(e);
            };

            var canPlayListener = function(e) {
              me.canPlay = true;
              progressListener(e);
            };

            engine.subscribeElementEvents(el,
                { 'progress': progressAndLoadingListener,
                  'loadedmetadata': loadingListener,
                  'canplay': canPlayListener,
                  'error': audioErrProxy(url, notify_error) });

            var addSource = function(audio, url, type) {
                var src = engine.createSource();
                src.addEventListener("error", notify_error, false);
                src.type = type;
                src.src = url;
                audio.appendChild(src);
            };

            try {
              addSource(el, url, audioType);
              engine.appendToBody(el);
            } catch(e) {
                notify_error(e);
            }
          }
      },
      function(audio) { // oncomplete
          me.audio = audio;
          me.ready = true;
          if (me.shouldPlayWhenReady) {
              me.play(me.shouldPlayParams.ltime, me.shouldPlayParams.duration);
              me.shouldPlayWhenReady = false;
          }
          if (player.muted) {
              me.mute();
          }

      },
      function(err) {
          log.error(err ? (err.message || err) : 'Unknown error');
          //throw errors.element(err ? err.message : 'Unknown', uid);
      });
};
/** @private @method play */
Audio.prototype.play = function(ltime, duration) {
    if (this.playing) {
      return false;
    }

    if (!this.ready) {
        this.shouldPlayWhenReady = true;
        this.shouldPlayParams = {
            ltime: ltime,
            duration: duration
        };
        return;
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
Audio.prototype.connect = function(element, anim) {
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
    anim.on(C.A_STOP, stop);
    anim.on(C.A_PAUSE, stop);
};
/**
 * @method clone
 *
 * @return {anm.Audio}
 */
Audio.prototype.clone = function() {
    var clone = new Audio('');
    clone.url = this.url;
    clone.offset = this.offset;
    return clone;
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

function audioErrProxy(src, pass_to) {
  return function(err) {
    // e_.MEDIA_ERR_ABORTED=1
    // e_.MEDIA_ERR_NETWORK=2
    // e_.MEDIA_ERR_DECODE=3
    // e_.MEDIA_ERR_SRC_NOT_SUPPORTED=4
    // e_.MEDIA_ERR_ENCRYPTED=5
    pass_to(new Error('Failed to load audio file from ' + src + ' with error code: ' +
          (err && err.currentTarget && err.currentTarget.error) ? err.currentTarget.error.code
                                                                : 'Unknown'));
  };
}

module.exports = Audio;
