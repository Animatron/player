var snapshotsUrl = 'https://clips.animatron-test.com/',
    defaultSnapshotId = '057f9821e527adaf005b6a2d64487cf0',
    snapshotId = defaultSnapshotId;

var embedPrefix = '<iframe src="',
    embedPostfix = '" width="640" height="360" frameborder="0"></iframe>';

var currentMode; // embed, config, publish, html

function getElm(id) { return document.getElementById(id); }

function collectOptions() {
    var options = {};
    if (!getElm('opts-width').disabled) options.width = getElm('opts-width').value;
    if (!getElm('opts-height').disabled) options.height = getElm('opts-height').value;
    return options;
}

function getCode(mode, options) {
    if (mode === 'embed') {
        return embedPrefix + snapshotsUrl + snapshotId + '?' +
               optionsMapper('embed', options) + embedPostfix;
    }
}

function updateWithCode(mode, code) {
    var previewElm = getElm('preview');
    while (previewElm.firstChild) previewElm.removeChild(previewElm.firstChild);

    getElm('code').classList.add('updated');
    getElm('preview').classList.add('updated');
    setTimeout(function() {
        getElm('code').classList.remove('updated');
        getElm('preview').classList.remove('updated');
    }, 500);

    if (mode === 'embed') previewElm.innerHTML = code;
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
}

function init() {
    getElm('snapshot-id').value = defaultSnapshotId;
    switchMode('embed');

    getElm('opts-width-default').addEventListener('click', function() { getElm('opts-width').disabled = this.checked; });
    getElm('opts-height-default').addEventListener('click', function() { getElm('opts-height').disabled = this.checked; });

    var subjects = [ 'opts-width', 'opts-width-default', 'opts-height', 'opts-height-default' ];

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

    onChange();
}

var optionsMapper = function(mode, options) {

    var map = {
        'embed': (function() {

            function numberOption(prop, label) { return function(o) {
                if (o[prop]) return label + '=' + o[prop];
            } };

            return {
                width: numberOption('width', 'w'),
                height: numberOption('height', 'h')
            };

        })()
    };

    var map_f = {
        'embed': function(results) { return results.join('&'); }
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
