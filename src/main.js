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
    C: constants, // for backwards compatibility
    loc: require('./anm/loc.js'),
    errors: require('./anm/errors.js'),

    utils: require('./anm/utils.js'),
    conf: require('./anm/conf.js'),
    log: require('./anm/log.js'),

    modules: require('./anm/modules.js'),
    importers: require('./anm/importers.js'),
    engine: engine,

    events: require('./anm/events.js'),

    resource_manager: require('./anm/resource_manager.js'),
    player_manager: require('./anm/player_manager.js'),

    Player: Player,
    Animation: require('./anm/animation/animation.js'),
    Element: Element,
    Clip: Element,

    Modifier: require('./anm/animation/modifier.js'),
    Tween: require('./anm/animation/tween.js'),
    Painter: require('./anm/animation/painter.js'),

    Brush: require('./anm/graphics/brush.js'),
    Color: require('./anm/graphics/color.js'),

    Path: require('./anm/graphics/path.js'),
    MSeg: segments.MSeg,
    LSeg: segments.LSeg,
    CSeg: segments.CSeg,
    Text: require('./anm/graphics/text.js'),
    Sheet: Sheet,
    Image: Sheet,
    shapes: require('./anm/graphics/shapes.js'),

    Audio: require('./anm/media/audio.js'),
    Video: require('./anm/media/video.js'),

    interop: {
        playerjs: require('./anm/interop/playerjs-io.js')
    },

    createPlayer: function(elm, opts) {
        if (!engine.canvasSupported) {
          document.getElementById(elm).innerHTML = anm.loc.Errors.S.SAD_SMILEY_HTML;
          return null;
        }
        var p = new Player();
        p.init(elm, opts);
        return p;
    },

    createImporter: function(importer) {
      if(window.console) console.warn('anm.createImporter is deprecated and will be removed soon.' +
        ' Please use anm.importers.create instead');
      return anm.importers.create(importer);
    }
};

// Export
// -----------------------------------------------------------------------------
global[PUBLIC_NAMESPACE] = anm;
module.exports = anm;
