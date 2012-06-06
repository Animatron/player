/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var DEFAULT_REFRESH_RATE = 3000;

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
  '           .modify(function(t) {',
  '               this.x = 150;',
  '               this.y = 20;',
  '               this.sx = 1 / t;',
  '               this.sy = 1 / t;',
  '               return true;',
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
  '    b().path(\'M0 0 L40 40 C10 150 50 70 6 40 Z\')',
  '       .stroke(\'#336\', 3)',
  '       .fill(\'#674\')',
  '       .modify(function() {',
  '         this.x = 150;',
  '         this.y = 150;',
  '          return true;',
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
  'elem.xdata.path = new anm.Path(\'M36 35 L35 70 L90 70 L50 20 Z\',',
  '                      { width: 2, color: \'#300\' },',
  '                      { color: \'#f00\' });',
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
  '  .add(b().path(\'M050 0 L20 20 C60 110 90 140 160 120 Z\'))',
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

/* var sc = b().rect([40, 40], [20, 20])
            .fill('#f00')
            .on(C.X_MCLICK, function(evt, t) {
                console.log(evt, t);
                console.log(sc.v.contains(evt.pos))
                return true;
            });
return sc; */

/* 
var root = b().rect([0, 0], [40, 40])
              .fill('#06f')
              .stroke('#036', 2);
var t = root;

for (var i = 0; i < 3; i++) {
  var inner = b(t).trans([0, 3], [[-20,-20],
                                  [0,0]]);
  t.add(inner);
  t = inner;
}

var cvselm = document.getElementById('my-canvas');
return root.move([ cvselm.width / 2,
                   cvselm.height / 2 ]);
*/

var uexamples = [];

var _player = null; 

function sandbox() {

    this.codeElm = document.getElementById('scene-source');
    this.errorsElm = document.getElementById('errors');
    this.selectElm = document.getElementById('examples-list');
    this.tangleElm = document.getElementById('refresh-calc');
    this.debugElm = document.getElementById('enable-debug');

    window.b = Builder._$;
    window.B = Builder;
    window.C = anm.C;

    this.player = createPlayer('my-canvas', {
        width: 400,
        height: 250,
        bgcolor: '#fff'
    });
    this.player.mode = anm.C.M_PREVIEW;
    this.player._checkMode();
    _player = this.player;

    this.cm = CodeMirror.fromTextArea(this.codeElm, 
              { mode: 'javascript',
                indentUnit: 4,
                lineNumbers: false,
                gutter: true,
                matchBrackets: true,
                wrapLines: true });
    this.cm.setValue(defaultCode);
    //this.cm.setValue('return <your code here>;');

    var s = this;
    var curInterval = null;
    var refreshRate = DEFAULT_REFRESH_RATE;
    var reportErr = true;
    function refresh() {
        s.errorsElm.style.display = 'none';
        s.player.stop();
        try {
            var code = ['(function(){', 
                        '  '+s.cm.getValue(),
                        '})();'].join('\n');
            var scene = eval(code);
            player.load(scene);
            player.play();
            reportErr = true;
        } catch(e) {
            s.player.stop();
            s.player.drawSplash();
            s.errorsElm.style.display = 'block';
            s.errorsElm.innerHTML = '<strong>Error:&nbsp;</strong>'+e.message;
            if (reportErr) {
              if (console && console.error) {
                console.error(e.stack);
              }
              reportErr = false;
            }
            //throw e;
        }
    }

    function updateInterval(to) {
        if (curInterval) clearTimeout(curInterval);
        //setTimeout(function() {
            refreshRate = to;
            var refresher = function() {
              refresh();
              curInterval = setTimeout(refresher, to);
            }
            refresher();
        //}, 1);  
    }    

    setTimeout(function() {
        store_examples(); // store current examples, it will skip if their versions match 
        load_examples(); // load new examples, it will skip the ones with matching versions
        list_examples(s.selectElm); // list the examples in select element
    }, 1);

    this.selectElm.onchange = function() {
        s.cm.setValue(examples[this.selectedIndex][1]);
    }

    this.debugElm.onchange = function() {
        s.player.debug = !s.player.debug;
    }

    var tangleModel = {
        initialize: function () {
            this.secPeriod = refreshRate / 1000;
        },
        update: function () {
            this.perMinute = Math.floor((60 / this.secPeriod) * 100) / 100;
            updateInterval(this.secPeriod * 1000);
        }
    };

    updateInterval(refreshRate);

    new Tangle(this.tangleElm, tangleModel);

}

function show_csheet(csheetElmId, overlayElmId) {
    var csheetElm = document.getElementById(csheetElmId);
    var overlayElm = document.getElementById(overlayElmId);
    
    csheetElm.style.display = 'block';
    overlayElm.style.display = 'block';

    csheetElm.onclick = function() { 
        return hide_csheet(csheetElmId, overlayElmId);
    }

    return false;
}

function hide_csheet(csheetElmId, overlayElmId) {
    var csheetElm = document.getElementById(csheetElmId);
    var overlayElm = document.getElementById(overlayElmId);
    
    csheetElm.style.display = 'none';
    overlayElm.style.display = 'none';

}

function change_mode(radio) {
  if (_player) {
    _player.mode = C[radio.value];
    _player._checkMode();
  }
}

function store_examples() {
    if (!localStorage) throw new Error('Local storage support required');
    var elen = examples.length;
    for (var i = 0; i < elen; i++) {
        store_example(i);
    }
}

function store_example(i) {
    var ekey = '_example'+i,
        vkey = ekey+'__v',
        ver = localStorage.getItem(vkey);
    if ((typeof ver === 'undefined') ||
        (ver === null) ||
        (ver < examples[i][0])) {
        localStorage.setItem(vkey, examples[i][0]);
        localStorage.setItem(ekey, examples[i][1]);
    }
    localStorage.setItem('_examples_count', examples.length);
}

function load_examples() {
    if (!localStorage) throw new Error('Local storage support required');
    var ckey = '_examples_count',
        count = localStorage.getItem(ckey) || 0,
        elen = examples.length;
    for (var i = 0; i < count; i++) {
        var ekey = '_example'+i,
            vkey = ekey+'__v',
            ver = localStorage.getItem(vkey);
        if ((typeof ver !== 'undefined') &&
            (ver !== null) &&
            ((i >= elen) ||
             (ver > examples[i][0]))) {
            examples[i] = [
                ver,
                localStorage.getItem(ekey)
            ];
        }
    }
}

function save_example(code) {
    var pos = examples.length; 
    examples[pos] = [ 0, code ];
    store_example(pos);
}

function list_examples(selectElm) {
    selectElm.innerHTML = '';
    var elen = examples.length;
    //selectElm.setAttribute('size', elen);
    for (var i = 0; i < elen; i++) {
        var optElm = document.createElement('option');
        optElm.setAttribute('value', i);
        optElm.innerHTML = i + ': [v' + examples[i][0] + '] : ' +
                           examples[i][1].substring(0, 45).split('\n').join('↵');            
        selectElm.appendChild(optElm);
    }
}