var defaultCode = [
  '// feel free to change,',
  '// just leave `return` on its place',
  '',
  'return element()',
  '    .add(',
  '        element(\'blue-rect\').rect(70)',
  '                            .move(140, 25)',
  '                            .fill(\'#009\')',
  '                            .stroke(\'#f00\', 3)',
  '                            .modify(Tween.rotate().band(0, 10).values(0, Math.PI / 2)))',
  '    .add(',
  '        element(\'red-rect\').rect(60)',
  '                           .move(115, 90)',
  '                           .fill(\'#f00\'))',
  '    .modify(Tween.rotate().band(0, 10).from(0).to(Math.PI));'
].join('\n');

var examples = [];
examples.push([ 0 /*version*/, 'Rectangles' /* name */, defaultCode ]);

examples.push([ 0 /*version*/, 'Circles' /* name */, [
  '//                  x,   y,   r',
  '',
  'var circles = [ [  20,  20,  50 ],',
  '                [  70,  30,  70 ],',
  '                [  60, 120,  14 ],',
  '                [ 140, 110,  20 ],',
  '                [ 160, 160, 200 ] ];',
  '',
  'var o = element();',
  '',
  'for (var i = 0, clen = circles.length; i < clen; i++) {',
  '    var cx = circles[i][0],',
  '        cy = circles[i][1],',
  '        cr = circles[i][2];',
  '    o.add(element().move(cx, cy)',
  '                   .oval(cr)',
  '                   .stroke(\'#333\', 2).fill(\'#366\')',
  '                   .modify(Tween.alpha().band(1.3, 3).values(1, .4))',
  '                   .modify(function(t, duration) {',
  '                       this.sx = 1 / t;',
  '                       this.sy = 1 / t;',
  '                    }));',
  '}',
  '',
  'return o.modify(Tween.rotate().band(0, 3).from(Math.PI / 4).to(-(0.15 * Math.PI)));'
].join('\n') ]);

examples.push([ 0 /*version*/, 'Easings' /* name */, [
  'return elm().rect([50, 50], [40, 40])',
  '            .trans([0, 3],',
  '                   [[0, 0], [0, 150]],',
  '                   C.E_COUT);'
].join('\n') ]);

examples.push([ 0 /*version*/, 'Paths' /* name */, [
  'return elm()',
  '    .add(',
  '        elm().path([0, 0], \'M0 0 L40 40 C10 150 50 70 6 40 Z\')',
  '             .stroke(\'#336\', 3)',
  '             .fill(\'#674\')',
  '             .modify(function() {',
  '                 this.x = 150;',
  '                 this.y = 150;',
  '             })',
  '             .rotate([0, 3], [0, Math.PI * 4]))',
  '    .add(',
  '        elm().paint(function(ctx) {',
  '            ctx.lineWidth = 2;',
  '            ctx.strokeStyle = \'#f35\';',
  '            ctx.font = \'30pt serif\';',
  '            ctx.strokeText(\'Boo!\', 50, 50);',
  '        }))',
  '/*.rotate([0, 3], [0, Math.PI])*/;',
].join('\n') ]);

examples.push([ 0 /*version*/, 'Merging Tweens' /* name */,  [
  '// See API Documentation (link is below)',
  'var anim = new anm.Animation();',
  'var elm = new anm.Element();',
  'elm.$path = new anm.Path(\'M36 35 L35 70 L90 70 L50 20 L36 35 Z\',',
  '                         { color: \'#f00\' },',
  '                         { width: 2, color: \'#300\' });',
  'elm.tween({',
  '    type: C.T_ROTATE,',
  '    band: [0, 3],',
  '    data: [Math.PI / 6, 0]',
  '});',
  'elm.tween({',
  '    type: C.T_TRANSLATE,',
  '    band: [0, 3],',
  '    data: anm.Path.parse(\'M-100 -100 L100 100 Z\')',
  '});',
  'elm.tween({',
  '    type: C.T_ALPHA,',
  '    band: [1.5, 3],',
  '    data: [1, 0]',
  '});',
  'anim.add(elm);',
  'return anim;'
].join('\n') ]);

examples.push([ 0 /*version*/, 'Another Paths Example' /* name */, [
  'return elm()',
  '    .add(elm().path([0, 0], \'M050 0 L20 20 C60 110 90 140 160 120 Z\'))',
  '    .add(elm().rect([115, 90], [60, 60]))',
  '    .rotate([0, 3], [-(Math.PI / 2), Math.PI / 2]);'
].join('\n') ]);

examples.push([ 0 /*version*/, 'Another Rects Example' /* name */, [
  'return elm()',
  '    .add(',
  '        elm(\'blue-rect\').rect([100, 25], [70, 70])',
  '                      .fill(\'#009\')',
  '                      .stroke(\'#f00\', 3)',
  '                      .alpha([0, 3], [0, 1])',
  '                      .trans([0, 4], [[0, 0], [ 100, 100 ]])',
  '                      .trans([4, 8], [[100, 100], [-200, 300]])',
  '                      .scale([0, 10], [[1, 1], [.5, .5]]))',
  '    .add(',
  '        elm(\'def-rect\').rect([115, 90], [60, 60]));'
].join('\n') ]);

examples.push([ 0 /*version*/, 'Image' /* name */, [
  'return elm().image([90, 120], \'./res/bender.jpg\')',
  '            .rotate([0, 3], [0, Math.PI / 4])',
  '            .trans([0, 3], [[200, 50], [0, 50]])',
  '            .xscale([0, 3], [.3, .1]);'
].join('\n') ]);

examples.push([ 0 /*version*/, 'Sprite Sheets' /* name */, [
  'return elm().sprite([1, 1], \'./res/sprite_sample.png\', [144, 59])',
  '            .pvt([0, 0])',
  '            .animate(0, [0, 30], 10)'
].join('\n') ]);
