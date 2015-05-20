var utils = require('./utils.js'),
    is = utils.is;

var loc = require('./loc.js'),
    ErrLoc = loc.Errors,
    errors = require('./errors.js');

var C = require('./constants.js'),
    global_opts = require('./global_opts.js');

var engine = require('engine');

var Animation = require('./animation/animation.js');

var Loader = {};

Loader.loadAnimation = function(player, anim, callback) {
    if (player.anim) player.anim.dispose(player);
    anim.playedIn(player);
    // add debug rendering
    if (player.debug && !global_opts.liveDebug) {
        anim.traverse(function(e) {e.addDebugRender();});
    }
    if (!anim.width || !anim.height) {
        anim.width = player.width;
        anim.height = player.height;
    } else if (player.forceAnimationSize) {
        player._resize(anim.width, anim.height);
    }
    // assign
    player.anim = anim;
    if (callback) callback.call(player, anim);
};

Loader.loadFromUrl = function(player, url, importer, callback) {
    if (!JSON) throw errors.system(ErrLoc.S.NO_JSON_PARSER, player);

    importer = importer || anm.importers.create('animatron');

    var url_with_params = url.split('?');
        url = url_with_params[0];
    var url_params = url_with_params[1], // TODO: validate them?
        params = (url_params && url_params.length > 0) ? utils.paramsToObj(url_params) : {},
        options = optsFromUrlParams(params);

    if (options) {
        player._addOpts(options);
        player._checkOpts();
    }

    var failure = function(err) {
        throw errors.system(utils.strf(ErrLoc.P.SNAPSHOT_LOADING_FAILED,
                            [ (err ? (err.message || err) : '¿Por qué?') ]));
    };

    var success = function(req) {
        try {
            Loader.loadFromObj(player, JSON.parse(req.responseText), importer, function(anim) {
                player._applyUrlParamsToAnimation(params);
                if (callback) callback.call(player, anim);
            });
        } catch(e) { failure(e); }
    };

    var anm_cookie = engine.getCookie('_animatronauth');

    engine.ajax(url, success, failure, 'GET',
        anm_cookie ? { 'Animatron-Security-Token': anm_cookie } : null);
};

Loader.loadFromObj = function(player, object, importer, callback) {
    if (!importer) throw errors.player(ErrLoc.P.NO_IMPORTER_TO_LOAD_WITH, player);
    var anim = importer.load(object);
    player.fire(C.S_IMPORT, importer, anim, object);
    Loader.loadAnimation(player, anim, callback);
};

Loader.loadElements = function(player, elms, callback) {
    var anim = new Animation();
    anim.add(elms);
    Loader.loadAnimation(player, anim, callback);
};

var optsFromUrlParams = function(params/* as object */) {
    function __boolParam(val) {
        if (!val) return false;
        if (val === 0 || val == '0') return false;
        if (val == 1) return true;
        if (val == 'false') return false;
        if (val == 'true') return true;
        if (val == 'off') return false;
        if (val == 'on') return true;
        if (val == 'no') return false;
        if (val == 'yes') return true;
    }
    function __extractBool() {
        var variants = arguments;
        for (var i = 0; i < variants.length; i++) {
            if (is.defined(params[variants[i]])) return __boolParam(params[variants[i]]);
        }
        return undefined;
    }
    var opts = {};
    opts.debug = is.defined(params.debug) ? __boolParam(params.debug) : undefined;
    opts.muteErrors = __extractBool('me', 'muterrors');
    opts.repeat = __extractBool('r', 'repeat');
    opts.autoPlay = __extractBool('a', 'auto', 'autoplay');
    opts.mode = params.m || params.mode || undefined;
    opts.zoom = params.z || params.zoom;
    opts.speed = params.v || params.speed;
    opts.width = params.w || params.width;
    opts.height = params.h || params.height;
    opts.infiniteDuration = __extractBool('i', 'inf', 'infinite');
    opts.audioEnabled = __extractBool('s', 'snd', 'sound', 'audio');
    opts.controlsEnabled = __extractBool('c', 'controls');
    opts.infoEnabled = __extractBool('info');
    opts.loadingMode = params.lm || params.lmode || params.loadingmode || undefined;
    opts.thumbnail = params.th || params.thumb || undefined;
    opts.bgColor = params.bg || params.bgcolor;
    opts.ribbonsColor = params.ribbons || params.ribcolor;
    return opts;
};

module.exports = Loader;
