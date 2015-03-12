var C = require('./constants.js');

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

module.exports = {

    system: function(text, player) {
        var err = new SystemError(text);
        if (player) player.fire(C.S_ERROR, err);
        return err;
    },
    player: function(text, player) {
        var err = new PlayerError(text);
        if (player) player.fire(C.S_ERROR, err);
        return err;
    },
    animation: function(text, anim) {
        var err = new AnimationError(text);
        if (anim) anim.fire(C.X_ERROR, err);
        return err;
    },
    element: function(text, elm) {
        var err = new AnimationError(text);
        if (elm && elm.anim) {
            elm.anim.fire(C.X_ERROR, err);
        }
        return err;
    },

    SystemError: SystemError,
    PlayerError: PlayerError,
    AnimationError: AnimationError

};
