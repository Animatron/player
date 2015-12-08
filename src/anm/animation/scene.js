var utils = require('../utils.js'),
    is = utils.is,
    iter = utils.iter;

var Search = require('./search.js');

var Element = require('./element.js');

var Timeline = require('./timeline.js');

function Scene(anim, name, duration) {
    this.id = utils.guid();

    this.anim = anim;
    this.name = name;
    this.time = new Timeline(this);
    this.time.setDuration(is.num(duration) ? duration : Infinity);

    this.affectsChildren = true;

    this.children = [];
    this.hash = {};
}

Scene.prototype.tick = function(dt) {
    if (this.time.fits()) {
        this.each(function(child) {
            child.tick(dt);
        });
    }
};

Scene.prototype.render = function(ctx) {
    if (this.time.fits()) {
        this.each(function(child) {
            child.render(ctx);
        });
    }
};

Scene.prototype.duration = function(value) {
    if (!is.defined(value)) return this.getDuration();
    this.setDuration(value);
    return this;
};

Scene.prototype.setDuration = function(duration) {
    this.time.setDuration(duration);
};

Scene.prototype.getDuration = function() {
    return this.time.getDuration();
};

Scene.prototype.traverse = function(visitor, data) {
    utils.keys(this.hash, function(key, elm) { return visitor(elm, data); });
};

Scene.prototype.each = function(visitor, data) {
    for (var i = 0, clen = this.children.length; i < clen; i++) {
        if (visitor(this.children[i], data) === false) break;
    }
};

Scene.prototype.reverseEach = function(visitor, data) {
    var i = this.children.length;
    while (i--) {
        if (visitor(this.children[i], data) === false) break;
    }
};

Scene.prototype.iter = function(func, rfunc) {
    iter(this.children).each(func, rfunc);
};

Scene.prototype.add = function(arg1, arg2, arg3) {
    var element = Element._fromArguments(arg1, arg2, arg3);
    if (!element.children) throw errors.animation(ErrLoc.A.OBJECT_IS_NOT_ELEMENT, this);
    this._register(element);
    element.parent = null;
    this.children.push(element);
};

Scene.prototype.remove = function(elm) {
    // error will be thrown in _unregister method if element is not registered
    if (elm.parent) {
        // it will unregister element inside
        elm.parent.remove(elm);
    } else {
        this._unregister(elm);
    }
};

Scene.prototype.isEmpty = function() {
    return this.children.length === 0;
};

Scene.prototype.find = function(selector, where) {
    return Search.one(selector).over(where ? where.children : this.children);
};

Scene.prototype.findAll = function(selector, where) {
    return Search.all(selector).over(where ? where.children : this.children);
};

Scene.prototype.findById = function(id) {
    return this.hash[id];
};

Scene.prototype._register = function(elm) {
    if (this.hash[elm.id]) throw errors.animation(ErrLoc.A.ELEMENT_IS_REGISTERED, this);
    elm.registered = true;
    elm.anim = this.anim; elm.scene = this;
    this.hash[elm.id] = elm;

    var me = this;

    elm.each(function(child) {
        me._register(child);
    });
};

Scene.prototype._unregister_no_rm = function(elm) {
    this._unregister(elm, true);
};

Scene.prototype._unregister = function(elm, save_in_tree) { // save_in_tree is optional and false by default
    if (!elm.registered) throw errors.animation(ErrLoc.A.ELEMENT_IS_NOT_REGISTERED, this);
    var me = this;
    elm.each(function(child) {
        me._unregister(child);
    });
    var pos = -1;
    if (!save_in_tree) {
      while ((pos = this.children.indexOf(elm)) >= 0) {
        this.children.splice(pos, 1); // FIXME: why it does not goes deeply in the tree?
      }
    }
    delete this.hash[elm.id];
    elm.registered = false;
    elm.anim = null;
    elm.scene = null;
    //elm.parent = null;
};

Scene.prototype.getPath = function() {
    return '/' + this.name + '/';
};

Scene.prototype.at = function(t, f) {
    return this.time.addAction(t, f);
};

Scene.prototype.continue = function() {
    this.time.continue();
    return this;
};
Scene.prototype.play = Scene.prototype.continue; // FIXME

Scene.prototype.pause = function() {
    this.time.pause();
    return this;
};
Scene.prototype.stop = Scene.prototype.pause; // FIXME

Scene.prototype.jump = function(t) {
    this.time.jump(t);
    return this;
};

Scene.prototype.jumpTo = function(elm) {
    this.time.jumpTo(elm);
    return this;
};

Scene.prototype.jumpToStart = function() {
    this.time.jumpToStart(0);
    return this;
};

Scene.prototype.jumpToEnd = function() {
    this.time.jumpToEnd();
    return this;
};

Scene.prototype.jumpAt = function(at, t) {
    this.time.jumpAt(at, t);
    return this;
};

Scene.prototype.getTime = function() {
    return this.time.getLastPosition();
};

Scene.prototype.reset = function() {
    this.time.reset();
    this.each(function(child) {
        child.reset();
    });
};

Scene._fromElement = function(elm) {
    var scene = new Scene(elm.anim, elm.name/*, elm.time.getDuration()*/);
    scene.time = elm.time.clone();
    elm.each(function(child) {
        scene.add(child);
    });
    return scene;
};

module.exports = Scene;
