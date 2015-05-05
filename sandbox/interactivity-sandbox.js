/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var DEFAULT_REFRESH_RATE = 5000;

var _player = null;

function sandbox() {

    this.codeElm = document.getElementById('animation-source');
    this.errorsElm = document.getElementById('errors');
    this.debugElm = document.getElementById('enable-debug');
    this.logErrorsElm = document.getElementById('log-errors');
    this.jsonCodeElm = document.getElementById('json-code');

    var widthVal = document.getElementById('val-width');
    var heightVal = document.getElementById('val-height');

    var width = 420, height = 250;

    var ctx = {
        width: width,
        height: height,
        element: anm.Element._$,
        Tween: anm.Tween,
        Path: anm.Path,
        Color: anm.Color,
        Brush: anm.Brush
    }

    function applyCtx(userCode, ctx) {
        return 'var width=' + ctx.width + ',height=' + ctx.height + ';' +
               'var element=ctx.element,Tween=ctx.Tween,Path=ctx.Path,Color=ctx.Color,Brush=ctx.Brush;'
               + userCode;
    }

    widthVal.innerText = width;
    heightVal.innerText = height;

    this.player = anm.createPlayer('player', {
        muteErrors: true,
        controlsEnabled: false,
        infiniteDuration: true,
        width: width,
        height: height
    });

    _player = this.player;

    var lastCode = load_last_code();

    var logErrors = false;

    this.cm = CodeMirror.fromTextArea(this.codeElm,
              { mode: 'javascript',
                indentUnit: 4,
                lineNumbers: true,
                //gutters: ['cm-margin-gutter'],
                matchBrackets: true,
                wrapLines: true/*,
                autofocus: true*/ });
    this.cm.setValue(lastCode);
    this.cm.setSize(null, '66%');
    this.cm.on('focus', function() {
        document.body.className = 'blur';
    });
    this.cm.on('blur', function() {
        document.body.className = '';
    });
    this.cm.on('change', function() {
        wereErrors = false;
        loadAndPlay();
    });

    var s = this;

    var wereErrors = false;

    function makeSafe(code, arg_name) {
        return ['(function('+arg_name+'){',
                '  '+code,
                '})'].join('\n');
    }

    function loadAndPlay() {
        if (!s.jsonCodeElm.value) throw new Error('JSON is not specified');
        s.errorsElm.style.display = 'none';
        try {
            _player.stop();
            var userCode = s.cm.getValue();
            save_current_json(s.jsonCodeElm.value);
            save_current_code(userCode);
            var safeCode = makeSafe(applyCtx(userCode, ctx), 'ctx');
            var callback = (function(animation) {
                                eval(safeCode)(ctx);
                                _player.play();
                            });
            _player.load(JSON.parse(s.jsonCodeElm.value), anm.importers.create('animatron'), callback);
        } catch(e) {
            onerror(e);
        }
    };

    function onerror(e) {
        cleanCanvas();
        wereErrors = true;
        var e2;
        try {
          _player.anim = null;
          _player.stop();
          _player._drawErrorSplash(e);
        } catch(e) { e2 = e; };
        s.errorsElm.style.display = 'block';
        s.errorsElm.innerHTML = '<strong>Error:&nbsp;</strong>'+e.message;
        if (logErrors && console && console.error) {
          console.error(e.stack);
          if (e2) console.error(e2.stack);
        }
        //throw e;
    }

    this.player.onerror(onerror);

    function cleanCanvas() {
        var cvs = document.getElementById('player-cvs');
        if (cvs) cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height );
    }

    this.debugElm.onchange = function() {
        s.player.debug = !s.player.debug;
        refreshFromCurrentMoment();
    }

    this.logErrorsElm.onchange = function() {
        logErrors = !logErrors;
    }

    this.jsonCodeElm.onchange = function() {
        loadAndPlay();
    }

    this.jsonCodeElm.value = load_last_json();
    loadAndPlay();

    function change_mode(radio) {
      if (_player) {
        _player.handleEvents = (radio.value === 'with-events');
        _player.infiniteDuration = (radio.value === 'with-events');
        _player._checkOpts();
        loadAndPlay();
      }
    }

    window.change_mode = change_mode;

}

function save_current_code(code) { localStorage.setItem('_i_current_code', code); }

function load_last_code() { return localStorage.getItem('_i_current_code') || ''; }

function save_current_json(json) { localStorage.setItem('_i_current_json', json); }

function load_last_json() { return localStorage.getItem('_i_current_json') || ''; }
