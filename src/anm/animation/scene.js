var Timeline = require('./timeline.js');

function Scene(name) {
    this.name = name;
    this.time = new Timeline();
}
