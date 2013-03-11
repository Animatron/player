/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var DEFAULT_REFRESH_RATE = 3000;

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
        'muteErrors': true,
        'anim': {
            width: 400,
            height: 250,
            bgcolor: '#fff' }
    });
    this.player.mode = anm.C.M_PREVIEW;
    this.player._checkMode();
    _player = this.player;

    this.cm = CodeMirror.fromTextArea(this.codeElm,
              { mode: 'javascript',
                indentUnit: 4,
                lineNumbers: true,
                //gutters: ['cm-margin-gutter'],
                matchBrackets: true,
                wrapLines: true });
    this.cm.setValue(defaultCode);
    //this.cm.setValue('return <your code here>;');
    this.cm.setSize(null, '66%');

    var s = this;
    var curInterval = null;
    var refreshRate = DEFAULT_REFRESH_RATE;
    function refresh() {
        s.errorsElm.style.display = 'none';
        try {
            s.player.stop();
            var code = ['(function(){',
                        '  '+s.cm.getValue(),
                        '})();'].join('\n');
            var scene = eval(code);
            player.load(scene);
            player.play();
        } catch(e) {
            onerror(e);
        }
    }

    function onerror(e) {
        var e2;
        try {
          s.player.anim = null;
          s.player.stop();
          s.player.drawSplash();
        } catch(e) { e2 = e; };
        s.errorsElm.style.display = 'block';
        s.errorsElm.innerHTML = '<strong>Error:&nbsp;</strong>'+e.message;
        if (console && console.error) {
          console.error(e.stack);
          if (e2) console.error(e2.stack);
        }
        //throw e;
    }

    this.player.onerror(onerror);

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