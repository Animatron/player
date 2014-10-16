/*
* Copyright (c) 2011-@COPYRIGHT_YEAR by Animatron.
* All rights are reserved.
*
* Animatron Player is licensed under the MIT License, see LICENSE.
*
* @VERSION
*/

// HERE GOES THE INITIALISATION OF ANM NAMESPACE, GLOBALS AND GLOBAL HELPERS

var PUBLIC_NAMESPACE = 'anm';

var constants = require('./anm/constants.js'),
    engine = require('engine'),
    Player = require('./anm/player.js');

function findAndInitPotentialPlayers() {
    var matches = engine.findPotentialPlayers();
    for (var i = 0, il = matches.length; i < il; i++) {
        anm.createPlayer(matches[i]);
    }
}

engine.onDocReady(findAndInitPotentialPlayers);

var Element = require('./anm/animation/element.js'),
    Sheet = require('./anm/graphics/sheet.js'),
    segments = require('./anm/graphics/segments.js');

// Public Namespace
// -----------------------------------------------------------------------------
var anm = {
    global: global,
    constants: constants,
    modules: require('./anm/modules.js'),
    importers: require('./anm/importers.js'),
    conf: require('./anm/conf.js'),
    log: require('./anm/log.js'),
    engine: engine,
    events: require('./anm/events.js'),
    resource_manager: require('./anm/resource_manager.js'),
    player_manager: require('./anm/player_manager.js'),
    loc: require('./anm/loc.js'),
    errors: require('./anm/errors.js'),
    utils: require('./anm/utils.js'),

    Player: Player,
    Animation: require('./anm/animation/animation.js'),
    Element: Element,
    Clip: Element,
    Path: require('./anm/graphics/path.js'),
    Text: require('./anm/graphics/text.js'),
    Sheet: Sheet,
    Image: Sheet,
    Modifier: require('./anm/animation/modifier.js'),
    Painter: require('./anm/animation/painter.js'),
    Brush: require('./anm/graphics/brush.js'),
    Color: require('./anm/graphics/color.js'),
    Tween: require('./anm/animation/tween.js'),
    MSeg: segments.MSeg,
    LSeg: segments.LSeg,
    CSeg: segments.CSeg,

    createPlayer: function(elm, opts) {
        var p = new Player();
        p.init(elm, opts);
        return p;
    }
};

// Export
// -----------------------------------------------------------------------------
global[PUBLIC_NAMESPACE] = anm;
module.exports = anm;
