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
  '                  .stroke(\'#f00\', 3))',
  '  .add(',
  '    b(\'red-rect\').rect([115, 90], [60, 60]))',
  '  .rotate([0, 10], [0, Math.PI]);'
].join('\n');

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