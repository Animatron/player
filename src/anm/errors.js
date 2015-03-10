function __errorAs(name) {
  return function (message) {
      if (Error.captureStackTrace) Error.captureStackTrace(this, this);
      var err = new Error(message || '');
      err.name = name;
      return err;
  };
}

var SystemError = __errorAs('SystemError'),
    PlayerError = __errorAs('PlayerError'),
    AnimationError = __errorAs('AnimationError');

var lastError = null;

// TODO: group errors by Player instance ID

function fire(err) {
    lastError = err;
    //console.error(err);
    throw err;
}

function last() { return lastError; }

function forget() { lastError = null; }

module.exports = {

  fire: fire,
  last: last,
  forget: forget,

  system: function(text) { fire(new SystemError(text)); },
  player: function(text) { fire(new PlayerError(text)); },
  animation: function(text) { fire(new AnimationError(text)); },

  SystemError: SystemError,
  PlayerError: PlayerError,
  AnimationError: AnimationError

};
