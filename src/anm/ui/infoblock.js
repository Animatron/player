var engine = require('engine'),
    C = require('../constants.js');

// Info Block
// -----------------------------------------------------------------------------

/**
 * @class anm.InfoBlock
 */
function InfoBlock(player) {
    var me=this;
    me.player = player;
    me.el = engine.addInfoblockDivOverlay(player.id + '-info', player.wrapper);

    me.projectSpan = me.el.getElementsByClassName('anm-infoblock-project')[0];
    me.authorSpan = me.el.getElementsByClassName('anm-infoblock-author')[0];

    if(player.anim) {
        me.setMeta(player.anim.meta);
    } else {
        player.on(C.S_LOAD, function() {
            me.setMeta(player.anim.meta);
        });
    }

}

InfoBlock.prototype.attachEvents = function(mouseEnter, mouseMove, mouseLeave, mouseDown) {
    engine.subscribeElementEvents(this.el, {
        mouseenter: mouseEnter,
        mousemove: mouseMove,
        mouseleave: mouseLeave,
        mousedown: mouseDown,
        click: engine.preventDefault,
        dblclick: engine.preventDefault
    });
};

InfoBlock.prototype.setMeta = function(meta) {
    var projectName = meta.title,
        projectId = meta.id,
        author = meta.author;

    this.projectSpan.innerText = projectName;
    this.authorSpan.innerText = author;
};

InfoBlock.prototype.show = function() {
    this.el.style.display = 'block';
};

InfoBlock.prototype.hide = function() {
    this.el.style.display = 'none';
};

InfoBlock.prototype.update = function() {
};

InfoBlock.prototype.detach = function() {
    engine.detachElement(null, this.el);
    this.el = null;
};

InfoBlock.prototype.reset = function() {

};

InfoBlock.prototype.render = function(){};


module.exports = InfoBlock;
