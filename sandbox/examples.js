var defaultCode = [
  '// feel free to change,',
  '// just leave `return` on its place',
  '',
  'return b()',
  '  .add(',
  '    b(\'blue-rect\').rect([140, 25], [70, 70])',
  '                  .fill(\'#009\')',
  '                  .stroke(\'#f00\', 3)',
  '                  .rotate([0, 10], [0, Math.PI / 2]))',
  '  .add(',
  '    b(\'red-rect\').rect([115, 90], [60, 60])',
  '                 .fill(\'#f00\'))',
  '  .rotate([0, 10], [0, Math.PI]);'
].join('\n');

var examples = [];
examples.push([ 0 /*version*/, defaultCode ]);

examples.push([ 0 /*version*/, [
  'var circles = [ [ 10, 15, 30 ],',
  '                [ 70, 30, 50 ],',
  '                [ 60, 40, 14 ] ];',
  '',
  'var o = b();',
  '',
  'for (var i = 0, clen = circles.length; i < clen; i++) {',
  '  var cx = circles[i][0],',
  '      cy = circles[i][1],',
  '      cr = circles[i][2];',
  '  o.add(b().circle([cx, cy], cr)',
  '           .stroke(\'#333\', 2).fill(\'#366\')',
  '           .alpha([1.3, 3], [1, .4])',
  '           .modify(function(t, duration) {',
  '               this.x = 150;',
  '               this.y = 20;',
  '               this.sx = 1 / t;',
  '               this.sy = 1 / t;',
  '           }));',
  '}',
  '',
  'return o.rotate([0, 3], [0, Math.PI / 2]);'
].join('\n') ]);

examples.push([ 0, [
  'return b().rect([50, 50], [40, 40])',
  '          .trans([0, 3],',
  '                 [[0, 0], [0, 150]],',
  '                 C.E_COUT);'
].join('\n') ]);

examples.push([ 0 /*version*/, [
  'return b()',
  '  .add(',
  '    b().path([0, 0], \'M0 0 L40 40 C10 150 50 70 6 40 Z\')',
  '       .stroke(\'#336\', 3)',
  '       .fill(\'#674\')',
  '       .modify(function() {',
  '         this.x = 150;',
  '         this.y = 150;',
  '        })',
  '       .rotate([0, 3], [0, Math.PI * 4]))',
  '  .add(',
  '    b().paint(function(ctx) {',
  '      ctx.lineWidth = 2;',
  '      ctx.strokeStyle = \'#f35\';',
  '      ctx.font = \'30pt serif\';',
  '      ctx.strokeText(\'Boo!\', 50, 50);',
  '    }))',
  '/*.rotate([0, 3], [0, Math.PI])*/;',
].join('\n') ]);

examples.push([ 0 /*version*/, [
  '// See API Documentation (link is below)',
  'var scene = new anm.Scene();',
  'var elem = new anm.Element();',
  'elem.xdata.path = new anm.Path(\'M36 35 L35 70 L90 70 L50 20 L36 35 Z\',',
  '                      { color: \'#f00\' },',
  '                      { width: 2, color: \'#300\' });',
  'elem.addTween({',
  '    type: C.T_ROTATE,',
  '    band: [0, 3],',
  '    data: [Math.PI / 6, 0]',
  '});',
  'elem.addTween({',
  '    type: C.T_TRANSLATE,',
  '    band: [0, 3],',
  '    data: anm.Path.parse(\'M-100 -100 L100 100 Z\')',
  '});',
  'elem.addTween({',
  '    type: C.T_ALPHA,',
  '    band: [1.5, 3],',
  '    data: [1, 0]',
  '});',
  'scene.add(elem);',
  'return scene;'
].join('\n') ]);

examples.push([ 0 /*version*/, [
  'return b()',
  '  .add(b().path([0, 0], \'M050 0 L20 20 C60 110 90 140 160 120 Z\'))',
  '  .add(b().rect([115, 90], [60, 60]))',
  '  .rotate([0, 3], [-(Math.PI / 2), Math.PI / 2]);'
].join('\n') ]);

examples.push([ 0 /*version*/, [
  'return b()',
  '  .add(',
  '    b(\'blue-rect\').rect([100, 25], [70, 70])',
  '                  .fill(\'#009\')',
  '                  .stroke(\'#f00\', 3)',
  '                  .alpha([0, 3], [0, 1])',
  '                  .trans([0, 4], [[0, 0], [ 100, 100 ]])',
  '                  .trans([4, 8], [[100, 100], [-200, 300]])',
  '                  .scale([0, 10], [[1, 1], [.5, .5]]))',
  '  .add(',
  '    b(\'def-rect\').rect([115, 90], [60, 60]));'
].join('\n') ]);

examples.push([ 0 /*version*/, [
  'return b().image([90, 120], \'./res/bender.jpg\')',
  '          .rotate([0, 3], [0, Math.PI / 4])',
  '          .trans([0, 3], [[200, 50], [0, 50]])',
  '          .xscale([0, 3], [.3, .1]);'
].join('\n') ]);

examples.push([ 0 /*version*/, [
  'return b().sprite([1, 1], \'./res/sprite_sample.png\', [144, 59])',
  '          .pvt([0, 0])',
  '          .animate(0, [0, 30], 10)'
].join('\n') ]);

/*
return b('scene')
  //.add(b('rect').rect([0, 0], 90).fill('rgba(255,255,0,.4)'))
  //.add(b('rect').rect([0, 0], 90).fill('rgba(255,255,0,.4)').pvt([-.5, -.5]))
  //.add(b('circle').circle([0, 0], 45).fill('rgba(90,0,90,.4)').pvt([.5, .5]))
  //.add(b('circle').circle([0, 0], 145).fill('rgba(90,0,90,.4)').pvt([0, 0]))
  //.add(b('path1').path([110, 110], 'M0 0 L90 90 L0 90 L0 0 Z').fill('rgba(90,90,0,.4)')
  //                                                 .stroke('#000', 5).pvt([1, 1]))
  //.add(b('path2').npath([110, 110], 'M50 50 L90 90 L50 90 L50 50 Z').fill('rgba(90,90,0,.4)')
  //                                                 .stroke('#000', 5).pvt([1, 1]))
  //.add(b('path3').path([110, 110], 'M0 0 L90 90 L0 90 L0 0 Z').fill('rgba(90,90,0,.4)')
  //                                                 .stroke('#000', 5).pvt([0, .5]))
  //.add(b('image').image([0, 0], './res/sprite.png'))
  //.add(b('text').text([0, 0], './res/sprite.png'))
  //.add(b('sprite').sprite([1, 1], './res/sprite_sample.png', [144, 59]).pvt([0, 0])
  //        .animate(0, [0, 30], 10).opacity(.5))
;
*/

/*

//.add(b('circle').circle([90, 90], 45).fill('rgba(90,0,90,.4)').pvt([1, 1]))
  //.add(b('circle').circle([0, 0], 145).fill('rgba(90,0,90,.4)').pvt([.5, .5]))
  //.add(b('path2').npath([110, 110], 'M50 50 L90 90 L50 90 L50 50 Z').fill('rgba(90,90,0,.4)')
  //                                                 .stroke('#000', 5).pvt([.5, .5]))
  //.add(b('path1').path([110, 110], 'M0 0 L90 90 L0 90 L0 0 Z').fill('rgba(90,90,0,.4)')
  //                                                 .stroke('#000', 5).pvt([.5, .5]))

  //.add(b('path3').path([110, 110], 'M0 0 L90 90 L0 90 L0 0 Z').fill('rgba(90,90,0,.4)')
  //                                                 .stroke('#000', 5).pvt([0, .5]))
  //.add(b('image').image([0, 0], './res/sprite.png').pvt([0, 0]))
  //.add(b('text').text([0, 0], './res/sprite.png').pvt([0, 0]))
  .add(b('sprite').sprite([71, 71], './res/sprite_sample.png', [144, 59]).pvt([0, 0])
          .animate(0, [0, 30], 10).opacity(.5))

*/

/* // RELOAD at 18 sec

var test_scene =
       b().add(test_for({ duration: 18,
                          clip_band: [0, 15], clip_mode: C.R_ONCE,
                          layer_1_band: [ 3, Infinity ], layer_1_mode: C.R_ONCE,
                          layer_2_band: [ 2, Infinity ], layer_2_mode: C.R_ONCE,
                          layer_3_band: [ 0, Infinity ], layer_3_mode: C.R_ONCE,
                          layer_4_band: [ 0, 10 ],       layer_4_mode: C.R_ONCE,
                          layer_5_band: [ 0, 10 ],       layer_5_mode: C.R_ONCE }))

function test_for(conf) {
    return b('wrapper').add(
   b('scene').band([0, conf.duration ]).zoom(1.2)
             .add(b('flash').band([0,.5]).rect([100, 100], 1000)
                            .fill('#000').alpha([0,.5], [1, 0]))
             .add(b('time').band([0,conf.duration]).paint(function(ctx) {
                               ctx.save();
                               ctx.font="14px sans-serif";
                               ctx.fillText(Math.floor(player.state.time * 100) / 100, 230, 200);
                               ctx.restore();
                            }).fill('#000'))
             .add(b('clip').band(conf.clip_band).mode(conf.clip_mode).move([15, 90])
                           .add(b('layer1').rect([0, 0], 15).fill('#f6f600')
                                           .band(conf.layer_1_band)
                                           .mode(conf.layer_1_mode)
                                           .trans([0, 5],[[0, 0],[40,0]])
                                           .rotate([0, 5], [0, Math.PI / 4]))
                           .add(b('layer2').rect([0, 20], 15).fill('#f60000')
                                           .band(conf.layer_2_band)
                                           .mode(conf.layer_2_mode))
                           .add(b('layer3').rect([0, 40], 15).fill('#00f6f6')
                                           .band(conf.layer_3_band)
                                           .mode(conf.layer_3_mode)
                                           .trans([0, 5],[[0, 0],[40,0]])
                                           .rotate([0, 5], [0, Math.PI / 4]))
                           .add(b('layer4').rect([0, 60], 15).fill('#00f600')
                                           .band(conf.layer_4_band)
                                           .mode(conf.layer_4_mode)
                                           .trans([0, 5],[[0, 0],[40,0]])
                                           .rotate([0, 5], [0, Math.PI / 4]))
                           .add(b('layer5').rect([0, 80], 15).fill('#f600f6')
                                           .band(conf.layer_5_band)
                                           .mode(conf.layer_5_mode)
                                           .trans([0, 10],[[0, 0],[40,0]])
                                           .rotate([0, 10], [0, Math.PI / 4])))
             .add(b('ghst').band([0, conf.clip_band[1]]).move([15, 90]).opacity(.2)
                         //.alpha([conf.clip_band[1], conf.clip_band[1] + .5], [1, 0])
                           .add(b('ghost1').rect([0, 0], 15).stroke('#f6f600').nofill())
                           .add(b('ghost2').rect([0, 20], 15).stroke('#f60000').nofill())
                           .add(b('ghost3').rect([0, 40], 15).stroke('#00f6f6').nofill())
                           .add(b('ghost4').rect([0, 60], 15).stroke('#00f600').nofill())
                           .add(b('ghost5').rect([0, 80], 15).stroke('#f600f6').nofill()))
             .add(b('info').move([5, 3]).add(text([0, 0], 'duration: ' + conf.duration))
                           .add(text([0, 10], 'clip band & mode: ' + conf.clip_band
                                                  + ' — ' + mode_str(conf.clip_mode)))
                           .add(text([0, 20], 'layer1 band & mode: ' + conf.layer_1_band
                                                    + ' — ' + mode_str(conf.layer_1_mode))
                                              .fill('#969600'))
                           .add(text([0, 30], 'layer2 band & mode: ' + conf.layer_2_band
                                                    + ' — ' + mode_str(conf.layer_2_mode))
                                              .fill('#960000'))
                           .add(text([0, 40], 'layer3 band & mode: ' + conf.layer_3_band
                                                    + ' — ' + mode_str(conf.layer_3_mode))
                                              .fill('#009696'))
                           .add(text([0, 50], 'layer4 band & mode: ' + conf.layer_4_band
                                                    + ' — ' + mode_str(conf.layer_4_mode))
                                              .fill('#009600'))
                           .add(text([0, 60], 'layer5 band & mode: ' + conf.layer_5_band
                                                     + ' — ' + mode_str(conf.layer_5_mode))
                                              .fill('#960096'))));
}

function mode_str(from) {
    if (!from) return 'once';
    if (from === C.R_ONCE) return "once";
    if (from === C.R_STAY) return "stay";
    if (from === C.R_LOOP) return "loop";
    if (from === C.R_BOUNCE) return "bounce";
}

function text(pos, lines) {
    return b().text(pos, lines, 10).pvt([0, 0]);
}


return test_scene; */
