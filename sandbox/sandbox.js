var sandbox = {

	init: function(codeElmId, canvasElmId, errorsElmId) {
		this.codeElm = document.getElementById(codeElmId),
		this.canvasElm = document.getElementById(canvasElmId);
		this.errorsElm = document.getElementById(errorsElmId);

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
		            matchBrackets: true });
		this.cm.setValue('return <your code here>;');
	},

    updated: function() {

    }

};