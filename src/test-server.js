var anm = require('./player.js');
var Builder = require('./builder.js');
var NODE = require('./engines/node-engine.js');

var b = Builder._$;

/*var engine = */anm.switchEngineTo(NODE.Engine);

var player = anm.createPlayer('fake');

var elm1 = b();
elm1.modify(function(t) {
    console.log(t);
    this.x += 1;
});

/* b()
  .add(
    b().path('M0 0 L40 40 C10 150 50 70 6 40 Z')
       .stroke('#336', 3)
       .fill('#674')
       .modify(function() {
         this.x = 150;
         this.y = 150;
        })
       .rotate([0, 3], [0, Math.PI * 4]))
  .add(
    b().paint(function(ctx) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f35';
      ctx.font = '30pt serif';
      ctx.strokeText('Boo!', 50, 50);
    })) */

/* b().image([-30, -30], './res/bender.jpg')
           .rotate([0, 3], [0, Math.PI / 5])
           .xscale([0, 3], [.3, .1]); */

player.load(elm1, 1.5).drawAt(0);