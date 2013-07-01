var anm = require('./player.js');
var Builder = require('./builder.js');

var b = Builder._$;

var player = anm.createPlayer(function() {
    return null;
});

var elm1 = b();
elm1.modify(function(t) {
    this.x += 1;
});

player.load(elm1).drawAt(0);