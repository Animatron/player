var Timeline = require('./timeline.js');

function Scene(name, duration) {
    this.name = name;
    this.time = new Timeline();
    this.time.setDuration(is.num(duration) ? duration : Infinity);
    this.next = null;
}

Scene.prototype.setDuration = function(duration) {
    this.time.setDuration(duration);
}

Scene.prototype.setNext = function(scene) {
    this.next = scene;
}
