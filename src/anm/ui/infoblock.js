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

    me.initEndScreen();

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

InfoBlock.prototype.initEndScreen = function() {
    var me = this, player = me.player;
    var endScreen = engine.createEndScreenOverlay(player.wrapper);
    me.endScreen = endScreen;
    me.el.appendChild(endScreen.container);

    player.on(C.S_COMPLETE, function() {
        if (!player.repeat) {
            me.showEndScreen();
        }
    });

    engine.subscribeElementEvents(endScreen.replayButton, {
        'click' : function() {
            player.play(0);
            me.hideEndScreen();

        }
    });
};

InfoBlock.prototype.showEndScreen = function() {
    this.endScreen.container.style.display = 'block';
    this.atEndScreen = true;
};

InfoBlock.prototype.hideEndScreen = function() {
    this.endScreen.container.style.display = 'none';
    this.atEndScreen = false;
};

InfoBlock.prototype.attachEvents = function(mouseEnter, mouseMove, mouseLeave, mouseDown) {
    var me=this;
    engine.subscribeElementEvents(me.el, {
        mouseenter: mouseEnter,
        mousemove: mouseMove,
        mouseleave: mouseLeave,
        mousedown: function(e) {
            if (!me.atEndScreen) {
                return mouseDown(e);
            }
        },
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

    this.endScreen.embedInput.value =
        '<iframe src="//animatron.com/embed/' + projectId + '"></iframe>';
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
