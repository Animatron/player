/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

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
  '    b(\'red-rect\').rect([115, 90], [60, 60]))',
  '  .rotate([0, 10], [0, Math.PI]);'
].join('\n');

var examples = [];
examples[0] = [ 0 /*version*/, [
  'var circles = [ [ 10, 15, 30 ],',
  '              [ 70, 30, 50 ],',
  '              [ 60, 40, 14 ] ]',
  '',
  'var o = b();',
  '',
  'for (var i = 0, clen = circles.length; i < clen; i++) {',
  '  var cx = circles[i][0],',
  '      cy = circles[i][1],',
  '      cr = circles[i][2];',
  '  o.add(b().circle([cx, cy], cr)',
  '           .stroke(\'#333\', 2).fill(\'#366\')',
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
].join('\n') ];
examples[1] = [ 0 /*version*/, [
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
].join('\n') ];

var uexamples = [];

function sandbox(codeElmId, canvasElmId, errorsElmId) {

	this.codeElm = document.getElementById(codeElmId),
	this.canvasElm = document.getElementById(canvasElmId);
	this.errorsElm = document.getElementById(errorsElmId);

	window.b = Builder._$;

	this.player = createPlayer(canvasElmId, {
		width: 400,
		height: 300,
		bgcolor: '#fff'
	});
	this.player.mode = Player.M_PREVIEW;
	this.player._checkMode();

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

	setTimeout(function() {
		setInterval(function() {
			s.errorsElm.style.display = 'none';
			s.player.stop();
			try {
				var code = ['(function(){', 
					        '  '+s.cm.getValue(),
                            '})();'].join('\n');
				var scene = eval(code);
				player.load(scene);
				player.play();
			} catch(e) {
				s.player.stop();
				s.player.drawSplash();
				s.errorsElm.style.display = 'block';
				s.errorsElm.innerHTML = '<strong>Error:&nbsp;</strong>'+e.message;
			};
		}, 3000); // TODO: ability to change timeout value
	}, 1);

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

/* function store_examples() {
	if (!localStorage) throw new Error('Local storage support required');
	var ckey = '_examples_count',
	    count = localStorage.getItem(ckey) || 0; 
	for (var i = examples.length; i--) {
		var ekey = '_example'+i,
		    vkey = ekey+'__v',
		    ver = localStorage.getItem(vkey);
	    if ((typeof ver !== 'undefined') ||
	    	(ver < examples[i][0])) {
	    	localStorage.setItem(vkey, examples[i][0]);
	    	localStorage.setItem(ekey, examples[i][1]);
	    	localStorage.setItem(ckey, ++count);
	    }
	}
}

function load_examples() {
	if (!localStorage) throw new Error('Local storage support required');
	
}

function save_example(code) {

} */