var Timeline = require('./timeline.js');

var utils = require('../utils.js'),
    iter = utils.iter;

function Scene(name, duration) {
    this.name = name;
    this.time = new Timeline();
    this.time.setDuration(is.num(duration) ? duration : Infinity);
    this.next = null;

    this.tree = [];
    this.hash = {};
}

Scene.prototype.setDuration = function(duration) {
    this.time.setDuration(duration);
}

Scene.prototype.getDuration = function() {
    return this.time.getDuration();
}

Scene.prototype.setNext = function(scene) {
    this.next = scene;
}

Scene.prototype.getNext = function(scene) {
    return this.next;
}

Scene.prototype.traverse = function(visitor, data) {
    utils.keys(this.hash, function(key, elm) { return visitor(elm, data); });
};

Scene.prototype.each = function(visitor, data) {
    for (var i = 0, tlen = this.tree.length; i < tlen; i++) {
        if (visitor(this.tree[i], data) === false) break;
    }
};

Scene.prototype.reverseEach = function(visitor, data) {
    var i = this.tree.length;
    while (i--) {
        if (visitor(this.tree[i], data) === false) break;
    }
};

Scene.prototype.iter = function(func, rfunc) {
    iter(this.tree).each(func, rfunc);
};

module.exports = Scene;
