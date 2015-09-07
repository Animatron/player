var snapshotsUrl = 'https://clips.animatron-test.com/',
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
    if (!getElm('opts-auto-play').disabled) options.autoPlay = getElm('opts-auto-play').checked;
    if (!getElm('opts-repeat').disabled) options.repeat = getElm('opts-repeat').checked;
    if (!getElm('opts-infinite').disabled) options.infiniteDuration = getElm('opts-infinite').checked;
    if (!getElm('opts-start').disabled) options.startFrom = getElm('opts-start').value;
    if (!getElm('opts-stop').disabled) options.stopAt = getElm('opts-stop').value;
    if (!getElm('opts-speed').disabled) options.speed = getElm('opts-speed').value;
    if (!getElm('opts-zoom').disabled) options.zoom = getElm('opts-zoom').value;
    if (!getElm('opts-bg-color').disabled) options.bgColor = getElm('opts-bg-color').value;
    return options;
}

function getCode(mode, options) {
    if (mode === 'embed') {
        var params = optionsMapper('embed', options);
        return '<iframe src="' + snapshotsUrl + snapshotId +
               (params ? ('?' + params) : '') +
               '" width="480" height="270" frameborder="0"></iframe>';
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
               '                       ' + ((options.startFrom || options.stopAt)
                                            ? 'function() { ' +
                                                (options.startFrom ? 'this.play(' + (parseTime(options.startFrom) / 100) + ');\n' : '') +
                                                (options.stopAt ? 'this.pause(' + (parseTime(options.stopAt) / 100) + ');\n' : '')
                                              + '},\n'
                                            : 'null, /* callback */\n') +
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

    buildOptionsHTML({
        'width': { label: 'Width', type: 'number', modify: function(elm) { elm.value = 480; } },
        'height': { label: 'Height', type: 'number', modify: function(elm) { elm.value = 270; } },
        'controls': { label: 'Controls', type: 'checkbox', modify: function(elm) { elm.checked = true; } },
        'auto-play': { label: 'Auto-play', type: 'checkbox', modify: function(elm, form) { elm.checked = false; } },
        'repeat': { label: 'Repeat', type: 'checkbox', modify: function(elm, form) { elm.checked = false; } },
        'infinite': { label: 'Infinite duration', type: 'checkbox', modify: function(elm, form) { elm.checked = false; } },
        'speed': { label: 'Speed', type: 'number', modify: function(elm, form) { elm.value = 1; } },
        'zoom': { label: 'Zoom', type: 'number', modify: function(elm, form) { elm.value = 1; } },
        'start': { label: 'Start from', type: 'text', modify: function(elm, form) { elm.value = '0.00s'; } },
        'stop': { label: 'Pause at', type: 'text', modify: function(elm, form) { elm.value = '0.00s'; } },
        'bg-color': { label: 'Background', type: 'text', modify: function(elm, form) { elm.value = 'transparent'; } }
    });

    /* getElm('opts-width-default').addEventListener('click', function() { getElm('opts-width').disabled = this.checked; });
    getElm('opts-height-default').addEventListener('click', function() { getElm('opts-height').disabled = this.checked; });
    getElm('opts-controls-default').addEventListener('click', function() { getElm('opts-controls').disabled = this.checked; });

    var subjects = [ 'opts-width', 'opts-width-default', 'opts-height', 'opts-height-default',
                     'opts-controls', 'opts-controls-default' ];

    for (var i = 0, il = subjects.length; i < il; i++) {
        getElm(subjects[i]).addEventListener('change', onChange);
    } */

    getElm('snapshot-id').addEventListener('change', onChange);

    getElm('mode-embed').addEventListener('click', onChange);
    getElm('mode-config').addEventListener('click', onChange);
    getElm('mode-publish').addEventListener('click', onChange);
    getElm('mode-html').addEventListener('click', onChange);

    getElm('code').addEventListener('change', function() {
        updateWithCode(currentMode, getElm('code').value);
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

            function extractOption(prop, shortLabel, fullLabel, format) {
                return function(o) {
                    if (typeof o[prop] !== 'undefined') return (shortVersion ? shortLabel : fullLabel) + '=' + format(o[prop])
                };
            }

            function numberOption(v) { return v; };
            function colorOption(v) { return v; };
            function booleanOption(v) { return v ? '1' : '0'; };

            return {
                width: extractOption('width', 'w', 'width', numberOption),
                height: extractOption('height', 'h', 'height', numberOption),
                controlsEnabled: extractOption('controlsEnabled', 'c', 'controls', booleanOption),
                autoPlay: extractOption('autoPlay', 'a', 'auto', booleanOption),
                repeat: extractOption('repeat', 'r', 'repeat', booleanOption),
                infiniteDuration: extractOption('infiniteDuration', 'i', 'inf', booleanOption),
                speed: extractOption('speed', 'v', 'speed', numberOption),
                zoom: extractOption('zoom', 'z', 'zoom', numberOption),
                startFrom: extractOption('startFrom', 't', 'from', parseTime),
                stopAt: extractOption('stopAt', 'p', 'at', parseTime),
                bgColor: extractOption('bgColor', 'bg', 'bgcolor', colorOption)
            };

        })(),

        'config': (function() {

            function extractOption(prop, format) {
                return function(o) { if (typeof o[prop] !== 'undefined') return prop + ': ' + format(o[prop]); };
            }

            function numberOption(v) { return v; };
            function colorOption(v) { return '\'' + v + '\''; };
            function booleanOption(v) { return v ? 'true' : 'false'; };

            return {
                width: extractOption('width', numberOption),
                height: extractOption('height', numberOption),
                controlsEnabled: extractOption('controlsEnabled', booleanOption),
                autoPlay: extractOption('autoPlay', booleanOption),
                repeat: extractOption('repeat', booleanOption),
                infiniteDuration: extractOption('infiniteDuration', booleanOption),
                speed: extractOption('speed', numberOption),
                zoom: extractOption('zoom', numberOption),
                bgColor: extractOption('bgColor', colorOption)
            };

        })(),

        'html': (function() {

            function extractOption(prop, attr, format) {
                return function(o) { if (typeof o[prop] !== 'undefined') return attr + '="' + format(o[prop]) + '"' };
            }

            function colorOption(v) { return v; };
            function numberOption(v) { return v; };
            function booleanOption(v) { return v ? 'true' : 'false'; };

            return {
                width: extractOption('width', 'anm-width', numberOption),
                height: extractOption('height', 'anm-height', numberOption),
                controlsEnabled: extractOption('controlsEnabled', 'anm-controls', booleanOption),
                autoPlay: extractOption('autoPlay', 'anm-auto-play', booleanOption),
                repeat: extractOption('repeat', 'anm-repeat', booleanOption),
                infiniteDuration: extractOption('infiniteDuration', 'anm-infinite', booleanOption),
                speed: extractOption('speed', 'anm-speed', numberOption),
                zoom: extractOption('zoom', 'anm-zoom', numberOption),
                startFrom: extractOption('startFrom', 'anm-start-from', parseTime),
                stopAt: extractOption('stopAt', 'anm-stop-at', parseTime),
                bgColor: extractOption('bgColor', 'anm-bg-color', colorOption)
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

function buildOptionsHTML(spec) {
    var optionsForm = getElm('options');
    var defaultCheckboxes = [];

    var optionsTable = document.createElement('table');
    var header = document.createElement('thead');
    var headerRow = document.createElement('tr');

    var defaultValuesHeader = document.createElement('td');
    var labelSpan = document.createElement('span');
    labelSpan.innerText = labelSpan.textContent = 'Default?';
    /*var allDefaultCheckboxElm = document.createElement('input');
    allDefaultCheckboxElm.setAttribute('type', 'checkbox');
    allDefaultCheckboxElm.setAttribute('checked', true);
    allDefaultCheckboxElm.addEventListener('click', function() {
        for (var i = 0, il = defaultCheckboxes.length; i < il; i++) {
            defaultCheckboxes[i].checked = this.checked;
        }
    });
    allDefaultCheckboxElm.addEventListener('change', onChange);
    defaultValuesHeader.appendChild(allDefaultCheckboxElm);*/
    defaultValuesHeader.appendChild(labelSpan);

    var namesHeader = document.createElement('td');
    namesHeader.innerText = namesHeader.textContent = 'Name';
    var valuesHeader = document.createElement('td');
    valuesHeader.innerText = valuesHeader.textContent = 'Value';
    headerRow.appendChild(defaultValuesHeader);
    headerRow.appendChild(namesHeader);
    headerRow.appendChild(valuesHeader);
    header.appendChild(headerRow);
    optionsTable.appendChild(header);

    var body = document.createElement('tbody');

    var names = Object.keys(spec);
    for (var i = 0, il = names.length; i < il; i++) {
        var name = names[i], optSpec = spec[names[i]];
        var optionRow = document.createElement('tr');

        var defaultCell = document.createElement('td');
        var defaultCheckboxElm = document.createElement('input');
        defaultCheckboxElm.setAttribute('type', 'checkbox');
        defaultCheckboxElm.setAttribute('id', 'opts-' + name + '-default');
        defaultCheckboxElm.setAttribute('checked', true);
        defaultCell.appendChild(defaultCheckboxElm);
        optionRow.appendChild(defaultCell);

        var labelCell = document.createElement('td');
        var labelElm = document.createElement('label');
        labelElm.setAttribute('for', 'opts-' + name);
        labelElm.textContent = labelElm.innerText = optSpec.label + ':';
        labelCell.appendChild(labelElm);
        optionRow.appendChild(labelCell);

        var valueCell = document.createElement('td');
        var inputElm = document.createElement('input');
        inputElm.setAttribute('id', 'opts-' + name);
        inputElm.setAttribute('type', optSpec.type);
        inputElm.setAttribute('disabled', true);
        inputElm.addEventListener('change', onChange);
        if (optSpec.modify) optSpec.modify(inputElm, optionsForm);
        defaultCheckboxElm.addEventListener('click',
            (function(inputElm) {
                return function() { inputElm.disabled = this.checked; }
            })(inputElm));
        defaultCheckboxElm.addEventListener('change', onChange);
        defaultCheckboxes.push(defaultCheckboxElm);
        valueCell.appendChild(inputElm);
        optionRow.appendChild(valueCell);

        optionsTable.appendChild(optionRow);
    }

    optionsForm.appendChild(optionsTable);
}

function parseTime(v) {
    return Math.floor(Number.parseFloat((v.indexOf('s') >= 0) ? v.slice(0, v.length - 1) : v) * 100);
}
