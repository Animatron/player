// Player manager
// -----------------------------------------------------------------------------
var events = require('./events.js'), C = require('./constants.js');

/**
 * @singleton @class anm.PlayerManager
 *
 * Manages all the player instances on a page.
 *
 * To subscribe to a new player creation event, use:
 *
 * `anm.PlayerManager.on(C.S_NEW_PLAYER, function(player) { ... })`
 *
 * To subsribe to a player removal event, use:
 *
 * `anm.PlayerManager.on(C.S_PLAYER_DETACH, function(player) { ... })`
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
};
/**
 * @method getPlayer
 *
 * Find a player on a page using an ID of its wrapper.
 *
 * @param {String} id ID of a player to find
 * @return {anm.Player}
 */
PlayerManager.prototype.getPlayer = function(cvs_id) {
    return this.hash[cvs_id];
};

module.exports = new PlayerManager();
