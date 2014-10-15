var utils = require('./utils.js'),
    SystemError = require('./errors.js').SystemError,
    PlayerError = require('./errors.js').PlayerError,
    engine = require('engine'),
    global_opts = require('./global_opts.js');

var Loader = {};

Loader.loadFromUrl = function(player, url, importer, callback) {
    if (!JSON) throw new SystemError(Errors.S.NO_JSON_PARSER);

    var importer = importer || anm.importers.create('animatron');

    var url_with_params = url.split('?'),
        url = url_with_params[0],
        url_params = url_with_params[1], // TODO: validate them?
        params = (url_params && url_params.length > 0) ? utils.paramsToObj(url_params) : {},
        options = Player._optsFromUrlParams(params);

    if (options) {
        player._addOpts(options);
        player._checkOpts();
    }

    var failure = player.__defAsyncSafe(function(err) {
        throw new SystemError(utils.strf(Errors.P.SNAPSHOT_LOADING_FAILED,
                               [ (err ? (err.message || err) : '¿Por qué?') ]));
    });

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
}
Loader.loadFromObj = function(player, object, importer, callback) {
    if (!importer) throw new PlayerError(Errors.P.NO_IMPORTER_TO_LOAD_WITH);
    var anim = importer.load(object);
    player.fire(C.S_IMPORT, importer, anim, object);
    Loader.loadAnimation(player, anim, callback);
}
Loader.loadAnimation = function(player, anim, callback) {
    if (player.anim) player.anim.dispose();
    // add debug rendering
    if (player.debug
        && !global_opts.liveDebug)
        anim.visitElems(function(e) {e.addDebugRender();}); /* FIXME: ensure not to add twice */
    if (!anim.width || !anim.height) {
        anim.width = player.width;
        anim.height = player.height;
    } else if (player.forceAnimationSize) {
        player._resize(anim.width, anim.height);
    }
    // assign
    player.anim = anim;
    if (callback) callback.call(player, anim);
}
Loader.loadElements = function(player, elms, callback) {
    var anim = new Animation();
    anim.add(elms);
    Loader.loadAnimation(player, anim, callback);
}

module.exports = Loader;
