function __errorAs(name) {
  return function (message) {
      if (Error.captureStackTrace) Error.captureStackTrace(this, this);
      var err = new Error(message || '');
      err.name = name;
      return err;
  };
}

module.exports = {
  SystemError:__errorAs('SystemError'),
  PlayerError: __errorAs('PlayerError'),
  AnimationError: __errorAs('AnimationError')
}
