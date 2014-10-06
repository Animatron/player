/*
 * Copyright (c) 2011-2014 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var DEFAULT_REFRESH_RATE = 3000;

var _player = null;

function sandbox() {

    this.codeElm = document.getElementById('animation-source');
    this.errorsElm = document.getElementById('errors');
    this.selectElm = document.getElementById('examples-list');
    this.tangleElm = document.getElementById('refresh-calc');
    this.debugElm = document.getElementById('enable-debug');
    this.logErrorsElm = document.getElementById('log-errors');

    window.elm = anm.Element._$;
    window.E = anm.Element;
    window.C = anm.constants;

    this.player = anm.createPlayer('player', {
        mode: anm.constants.M_SANDBOX,
        muteErrors: true,
        width: 400,
        height: 250,
        bgColor: '#fff'
    });

    //this.player.mode = anm.C.M_SANDBOX;
    //this.player._updateMode();

    _player = this.player;

    var lastCode = '';
    if (localStorage) lastCode = load_last_code();

    var logErrors = false;

    this.cm = CodeMirror.fromTextArea(this.codeElm,
              { mode: 'javascript',
                indentUnit: 4,
                lineNumbers: true,
                //gutters: ['cm-margin-gutter'],
                matchBrackets: true,
                wrapLines: true/*,
                autofocus: true*/ });
    this.cm.setValue((lastCode.length > 0) ? lastCode : defaultCode);
    //this.cm.setValue('return <your code here>;');
    this.cm.setSize(null, '66%');
    this.cm.on('focus', function() {
        document.body.className = 'blur';
    });
    this.cm.on('blur', function() {
        document.body.className = '';
    });
    this.cm.on('change', function() {
        wereErrors = false;
        refreshFromCurrentMoment();
    });

    var s = this;

    var curTimeouts = [],
        refreshRate = localStorage ? load_refresh_rate() : DEFAULT_REFRESH_RATE;

    var lastPlay = -1,
        lastSequence = -1,
        wereErrors = false;

    function makeSafe(code) {
        return ['(function(){',
                '  '+code,
                '})();'].join('\n');
    }

    function playFrom(from, rate) {
        s.errorsElm.style.display = 'none';
        try {
            _player.stop();
            var userCode = s.cm.getValue();
            if (localStorage) save_current_code(userCode);
            var safeCode = makeSafe(userCode);
            var anim = eval(safeCode);
            if (!anim || (!(anim instanceof anm.Animation) && !(anim instanceof anm.Element))) {
                throw new Error('No animation was returned from code');
            }
            _player.load(anim, rate / 1000);
            _player.play(from / 1000);
            lastPlay = Date.now() - from;
        } catch(e) {
            onerror(e);
        }
    };

    function onerror(e) {
        ensureToCancelTimeouts();
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

    function ensureToCancelTimeouts() {
        var count = curTimeouts.length;
        //console.log('removing all of the timeouts (' + count + ')');
        while (count) {
            var timeout = curTimeouts[--count];
            //console.log('cancelling timeout #' + timeout[0] + ' (' + timeout[1] + ')');
            clearTimeout(timeout[0]);
        }
        curTimeouts = [];
    }

    function refreshFromStart() {
        //console.log('refresh from start');
        runSequence(refreshRate, 0);
    }

    function refreshFromCurrentMoment() {
        //console.log('refresh from current moment');
        runSequence(refreshRate, (Date.now() - lastPlay) % refreshRate);
    }

    function runSequence(rate, startAt) {
        var sequenceId = ++lastSequence,
            timeoutId = 0;
        //console.log('runSequence #' + sequenceId);
        ensureToCancelTimeouts();
        refreshRate = rate;
        save_refresh_rate(rate);
        var _refresher = function(from, seqId, tId) {
            return function(once) {
                if (wereErrors) return;
                //console.log('starting to play from ', from, ', refresher id is ',
                //             seqId + '-' + tId, new Date());
                playFrom(from, rate);
                if (once) return;
                var nextTimeout = seqId + '-' + (tId + 1);
                curTimeouts.push([ setTimeout(_refresher(0, seqId, tId + 1), rate - from), nextTimeout ]);
                //console.log('sheduled next refresh to ', rate - from, 'ms (#', nextTimeout, ')');
            }
        };
        _refresher(startAt || 0, sequenceId, timeoutId)(
            (_player.mode != C.M_PREVIEW) && (_player.mode != C.M_SANDBOX));
    }

    if (localStorage) {
        setTimeout(function() {
            store_examples(); // store current examples, it will skip if their versions match
            load_examples(); // load new examples, it will skip the ones with matching versions
            list_examples(s.selectElm); // list the examples in select element
        }, 1);
    }

    this.selectElm.onchange = function() {
        s.cm.setValue(examples[this.selectedIndex][1]);
        wereErrors = false;
        refreshFromStart();
    }

    this.debugElm.onchange = function() {
        s.player.debug = !s.player.debug;
        refreshFromCurrentMoment();
    }

    this.logErrorsElm.onchange = function() {
        logErrors = !logErrors;
    }

    var tangleModel = {
        initialize: function () {
            this.secPeriod = refreshRate / 1000;
        },
        update: function () {
            this.perMinute = Math.floor((60 / this.secPeriod) * 100) / 100;
            runSequence(this.secPeriod * 1000, 0);
        }
    };

    runSequence(refreshRate, 0);

    new Tangle(this.tangleElm, tangleModel);

    function change_mode(radio) {
      if (_player) {
        _player.mode = C[radio.value];
        _player._updateMode();
        refreshFromStart();
      }
    }

    window.change_mode = change_mode;

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

function save_current_code(code) {
    if (!localStorage) throw new Error('Local storage support required');
    localStorage.setItem('_current_code', code);
}

function load_last_code() {
    if (!localStorage) throw new Error('Local storage support required');
    return localStorage.getItem('_current_code') || '';
}

function save_refresh_rate(rate) {
    if (!localStorage) throw new Error('Local storage support required');
    localStorage.setItem('_current_rate', rate);
}

function load_refresh_rate() {
    if (!localStorage) throw new Error('Local storage support required');
    return localStorage.getItem('_current_rate') || DEFAULT_REFRESH_RATE;
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
