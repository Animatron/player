var sandbox = {

	init: function(codeElmId, canvasElmId) {
		var codeElm = document.getElementById(codeElmId),
		    canvasElm = document.getElementById(canvasElmId);
		this.cm = CodeMirror.fromTextArea(codeElm, 
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