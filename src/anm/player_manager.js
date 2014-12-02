// Player manager
// -----------------------------------------------------------------------------
var events = require('./events.js'), C = require('./constants.js');

/**
 * class anm.PlayerManager
 */
function PlayerManager() {
    this.hash = {};
    this.instances = [];
    this._initHandlers();
}
events.provideEvents(PlayerManager, [ C.S_NEW_PLAYER, C.S_PLAYER_DETACH ]);
PlayerManager.prototype.handle__x = function(evt, player) {
    if (evt == C.S_NEW_PLAYER) {
        this.hash[player.id] = player;
        this.instances.push(player);
    } else if (evt == C.S_PLAYER_DETACH) {
        // do nothing
    }
    return true;
}
PlayerManager.prototype.getPlayer = function(cvs_id) {
    return this.hash[cvs_id];
}

module.exports = new PlayerManager();
