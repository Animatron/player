var snapshotsUrl = 'http://clips.animatron-test.com/',
    defaultSnapshotId = '057f9821e527adaf005b6a2d64487cf0',
    snapshotId = defaultSnapshotId,
    targetDivId = 'player-target';

var currentMode; // embed, config, publish, html

var shortVersion = true;

function getElm(id) { return document.getElementById(id); }

function collectOptions() {
    var options = {};
    if (!getElm('opts-width').disabled) options.width = getElm('opts-width').value;
    if (!getElm('opts-height').disabled) options.height = getElm('opts-height').value;
    if (!getElm('opts-controls').disabled) options.controlsEnabled = getElm('opts-controls').checked;
    return options;
}

function getCode(mode, options) {
    if (mode === 'embed') {
        var params = optionsMapper('embed', options);
        return '<iframe src="' + snapshotsUrl + snapshotId +
               (params ? ('?' + params) : '') +
               '" width="640" height="360" frameborder="0"></iframe>';
    } else if (mode === 'publish') {
        var params = optionsMapper('embed', options);
        return snapshotsUrl + snapshotId +
               (params ? ('?' + params) : '');
    } else if (mode === 'config') {
        var list = optionsMapper('config', options);
        var config = list ? '{\n    ' + list + '\n}' : '{ }';
        return 'var options = ' + config + ';\n' +
               'var snapshotUrl = \'' + snapshotsUrl + '\';\n' +
               'var snapshotId = \'' + snapshotId + '.json\';\n' +
               'anm.Player.forSnapshot(\'' + targetDivId + '\',\n' +
               '                       snapshotUrl + snapshotId,\n' +
               '                       anm.importers.create(\'animatron\'),\n' +
               '                       null, /* callback */\n' +
               '                       options);';
    } else if (mode === 'html') {
        var attributes = optionsMapper('html', options);
        return '<div id="anm-player" anm-player-target ' +
               'anm-src="' + snapshotsUrl + snapshotId + '.json"' +
              (attributes ? ' ' + attributes : '') + '></div>';
    }
}

function updateWithCode(mode, code) {
    if (anm.player_manager.instances.length) {
        anm.player_manager.instances[0].detach();
    }

    var previewElm = getElm('preview');
    while (previewElm.firstChild) previewElm.removeChild(previewElm.firstChild);

    getElm('code').classList.add('updated');
    getElm('preview').classList.add('updated');
    setTimeout(function() {
        getElm('code').classList.remove('updated');
        getElm('preview').classList.remove('updated');
    }, 500);

    if (mode === 'embed') { previewElm.innerHTML = code; }
    else if (mode === 'publish') {
        previewElm.innerHTML = '<a href="' + code + '" target="_blank">Click Me</a>';
    } else if (mode === 'config') {
        previewElm.innerHTML = '<div id="player-target"></div>';
        eval(code);
    } else if (mode === 'html') {
        previewElm.innerHTML = code;
        findAndInitPotentialPlayers();
    }
}

function onChange() {
    snapshotId = getElm('snapshot-id').value;
    var code = getCode(currentMode, collectOptions());

    getElm('code').value = code;
    updateWithCode(currentMode, code);
}

function switchMode(target) {
    if (currentMode) getElm('mode-' + currentMode).className = '';
    currentMode = target;
    getElm('mode-' + target).className = 'current';
    getElm('short-version').style.visibility = ((currentMode === 'embed') || (currentMode === 'publish')) ? 'visible' : 'hidden';
    getElm('short-version-label').style.visibility = ((currentMode === 'embed') || (currentMode === 'publish')) ? 'visible' : 'hidden';
}

function init() {
    getElm('snapshot-id').value = defaultSnapshotId;
    switchMode('embed');

    getElm('opts-width-default').addEventListener('click', function() { getElm('opts-width').disabled = this.checked; });
    getElm('opts-height-default').addEventListener('click', function() { getElm('opts-height').disabled = this.checked; });
    getElm('opts-controls-default').addEventListener('click', function() { getElm('opts-controls').disabled = this.checked; });

    var subjects = [ 'opts-width', 'opts-width-default', 'opts-height', 'opts-height-default',
                     'opts-controls', 'opts-controls-default' ];

    for (var i = 0, il = subjects.length; i < il; i++) {
        getElm(subjects[i]).addEventListener('change', onChange);
    }

    getElm('mode-embed').addEventListener('click', onChange);
    getElm('mode-config').addEventListener('click', onChange);
    getElm('mode-publish').addEventListener('click', onChange);
    getElm('mode-html').addEventListener('click', onChange);

    getElm('code').addEventListener('change', function() {
        updateWithCode('embed', getElm('code').value);
    });

    getElm('short-version').addEventListener('change', function() {
        shortVersion = getElm('short-version').checked;
        onChange();
    });

    onChange();
}

var optionsMapper = function(mode, options) {

    var map = {
        'embed': (function() {

            function numberOption(prop, shortLabel, fullLabel) { return function(o) {
                if (typeof o[prop] !== 'undefined') return (shortVersion ? shortLabel : fullLabel) + '=' + o[prop];
            } };

            function booleanOption(prop, shortLabel, fullLabel) { return function(o) {
                if (typeof o[prop] !== 'undefined') return (shortVersion ? shortLabel : fullLabel) + '=' + (o[prop] ? '1' : '0');
            } };

            return {
                width: numberOption('width', 'w', 'width'),
                height: numberOption('height', 'h', 'height'),
                controlsEnabled: booleanOption('controlsEnabled', 'c', 'controls')
            };

        })(),

        'config': (function() {

            function numberOption(prop) { return function(o) {
                if (typeof o[prop] !== 'undefined') return prop + ': ' + o[prop];
            } };

            function booleanOption(prop) { return function(o) {
                if (typeof o[prop] !== 'undefined') return prop + ': ' + (o[prop] ? 'true' : 'false');
            } };

            return {
                width: numberOption('width'),
                height: numberOption('height'),
                controlsEnabled: booleanOption('controlsEnabled')
            };

        })(),

        'html': (function() {

            function numberOption(prop, attr) { return function(o) {
                if (typeof o[prop] !== 'undefined') return attr + '="' + o[prop] + '"';
            } };

            function booleanOption(prop, attr) { return function(o) {
                if (typeof o[prop] !== 'undefined') return attr + '="' + (o[prop] ? 'true' : 'false') + '"';
            } };

            return {
                width: numberOption('width', 'anm-width'),
                height: numberOption('height', 'anm-height'),
                controlsEnabled: booleanOption('controlsEnabled', 'anm-controls')
            };

        })()
    };

    map['publish'] = map['embed']; // they are the same

    var map_f = {
        'embed': function(results) { return results.join('&'); },
        'publish': function(results) { return results.join('&'); },
        'html': function(results) { return results.join(' '); },
        'config': function(results) { return results.join(',\n    '); }
    };

    var mapKeys = Object.keys(map[mode]);
    var results = [];
    var result;
    for (var i = 0, il = mapKeys.length; i < il; i++) {
        result = map[mode][mapKeys[i]](options);
        if (result) results.push(result);
    }

    return map_f[mode](results);

};

function findAndInitPotentialPlayers() {
    var matches = anm.engine.findPotentialPlayers();
    for (var i = 0, il = matches.length; i < il; i++) {
        anm.createPlayer(matches[i]);
    }
}
