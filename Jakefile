/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

// Versions used:
//    node: 0.8.9
//    npm: 1.2.8
//    jake: 0.5.14
//    phantomjs: 1.7.0
//    jasmine-node: 1.7.1
//    uglify-js: 2.2.5
//    docco: 0.6.2
//    python markdown: ?
//    orderly: 1.1.0
//    jsonschema: 0.3.2
//    aws2js: 0.8.3

var fs = require('fs')/*,
    path = require('path')*/;

// ALIASES

jake.cat = function(file) { return fs.readFileSync(file, 'utf8'); };
jake.echo = function(what, where) { fs.appendFileSync(where, what, 'utf8'); };

// CONSTANTS

var VERSION_FILE = 'VERSION',
    VERSIONS_FILE = 'VERSIONS',
    VERSION_LOG_FILE = 'VERSION_LOG',
    CHANGES_FILE = 'CHANGES',
    VERSION = (function(file) {
       return jake.cat(_loc(file)).trim();
    })(VERSION_FILE);

var COPYRIGHT_COMMENT =
[ '/*',
  ' * Copyright (c) 2011-2013 by Animatron.',
  ' * All rights are reserved.',
  ' * ',
  ' * Animatron player is licensed under the MIT License.',
  ' * ',
  ' * ' + VERSION + ', built at @BUILD_TIME',
  ' */'].join('\n') + '\n';

var NODE_GLOBAL = false,
    LOCAL_NODE_DIR = './node_modules';

var Binaries = {
    JSHINT: NODE_GLOBAL ? 'jshint' : (LOCAL_NODE_DIR + '/jshint/bin/jshint'),
    UGLIFYJS: NODE_GLOBAL ? 'uglifyjs' : (LOCAL_NODE_DIR + '/uglify-js/bin/uglifyjs'),
    JASMINE_NODE: NODE_GLOBAL ? 'jasmine-node' : (LOCAL_NODE_DIR + '/jasmine-node/bin/jasmine-node'),
    DOCCO: NODE_GLOBAL ? 'docco' : (LOCAL_NODE_DIR + '/docco/bin/docco'),
    PHANTOMJS: 'phantomjs',
    CAT: 'cat',
    MV: 'mv',
    MARKDOWN: 'python -m markdown',
    GIT: 'git'
};

var Dirs = {
    SRC: 'src',
    AS_IS: 'dist/full',
    MINIFIED: 'dist',
    DIST_ROOT: 'dist',
    TESTS: 'tests',
    DOCS: 'doc'
};

var SubDirs = {
    VENDOR: 'vendor',
    BUNDLES: 'bundle',
    MODULES: 'module',
    IMPORTERS: 'import'
};

var Files = {
    Main: { PLAYER: 'player.js',
            BUILDER: 'builder.js',
            ANM_IMPORT: 'animatron-importer.js' },
    Ext: { VENDOR: [ 'matrix.js'/*, 'json2.js'*/ ],
           IMPORTERS: [ 'animatron-importer.js' ],
           MODULES: [ 'collisions.js', 'audio.js' ] },
    Doc: { README: 'README.md',
           API: 'API.md' }
}

var Bundles = [
    { name: 'Standard',
      file: 'standard',
      includes: _in_dir(Dirs.SRC + '/' + SubDirs.VENDOR, Files.Ext.VENDOR )
        .concat(_in_dir(Dirs.SRC,                      [ Files.Main.PLAYER ])) },
    { name: 'Animatron',
      file: 'animatron',
      includes: _in_dir(Dirs.SRC + '/' + SubDirs.VENDOR,      Files.Ext.VENDOR )
        .concat(_in_dir(Dirs.SRC,                           [ Files.Main.PLAYER ]))
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.IMPORTERS, [ Files.Main.ANM_IMPORT ]))
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.MODULES,   [ Files.Ext.MODULES[1] ])) }, // include audio module
    { name: 'Develop',
      file: 'develop',
      includes: _in_dir(Dirs.SRC + '/' + SubDirs.VENDOR, Files.Ext.VENDOR )
        .concat(_in_dir(Dirs.SRC,                      [ Files.Main.PLAYER,
                                                         Files.Main.BUILDER ])) },
    { name: 'Hardcore',
      file: 'hardcore',
      includes: _in_dir(Dirs.SRC + '/' + SubDirs.VENDOR,  Files.Ext.VENDOR )
        .concat(_in_dir(Dirs.SRC,                       [ Files.Main.PLAYER ]))
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.MODULES, Files.Ext.MODULES ))
        .concat(_in_dir(Dirs.SRC,                       [ Files.Main.BUILDER ])) }
];

var Tests = {
    RUN_SCRIPT: Dirs.TESTS + '/' + 'run-jasmine.phantom.js',
    PAGE_FOR_CLI: Dirs.TESTS + '/' + 'run-for-terminal.html'
};

var Docs = {
    FromSRC: { INCLUDE: [ Dirs.SRC + '/*.js' ] },
    FromMD: {
       Files: {
         README_SRC: Files.Doc.README,
         README_DST: Dirs.DOCS + '/README.html',
         API_SRC: Dirs.DOCS + '/' + Files.Doc.API,
         API_DST: Dirs.DOCS + '/API.html',
       },
       Parts: {
         _head: Dirs.DOCS + '/_head.html',
         _foot: Dirs.DOCS + '/_foot.html'
       }
    }
};

var Bucket = {
    Release: { ALIAS: 'rls', NAME: 'player.animatron.com' },
    Development: { ALIAS: 'dev', NAME: 'player-dev.animatron.com' },
    Old: { ALIAS: 'old', NAME: 'animatron-player' }
};

var Validation = {
    Schema: { ANM_SCENE: Dirs.SRC + '/' + SubDirs.IMPORTERS + '/animatron-project-' + VERSION + '.orderly' }
}

var DONE_MARKER = '<Done>.\n',
    NONE_MARKER = '<None>.\n',
    FAILED_MARKER = '<Failed>.\n';

var DESC_WIDTH = 80,
    DESC_PAD = 23,
    DESC_TAB = 7,
    DESC_PFX = '# ',
    DESC_1ST_PFX = DESC_PAD + DESC_PFX.length;

var EXEC_OPTS = { printStdout: !jake.program.opts.quiet };

var _print = !jake.program.opts.quiet ? console.log : function() { };

// TASKS

desc(_dfit_nl(['Get full distribution in the /dist directory.',
               'Exactly the same as calling {jake dist}.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('default', ['dist'], function() {});

desc(_dfit_nl(['Clean previous build artifacts.']));
task('clean', function() {
    _print('Clean previous build artifacts..');
    jake.rmRf(_loc(Dirs.AS_IS));
    jake.rmRf(_loc(Dirs.MINIFIED));
    _print(DONE_MARKER);
});

desc(_dfit_nl(['Build process, with no cleaning.',
               'Called by <dist>.',
               'Depends on: <_prepare>, <_bundles>, <_organize>, <_versionize>, <_minify>.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('build', ['_prepare', '_bundles', '_organize', '_versionize', '_minify'], function() {});

desc(_dfit_nl(['Clean previous build and create distribution files, '+
                  'so `dist` directory will contain the full '+
                  'distribution for this version, including '+
                  'all required files — sources and bundles.',
               'Coherently calls <clean> and <build>.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('dist', ['clean', 'build'], function() {});

desc(_dfit_nl(['Run tests for the sources (not the distribution).',
               'Usage: Among with {jake test} may be called with '+
                  'providing separate spec or spec group, '+
                  'in a way like: {jake test[01.player/*]} or, for concrete spec: '+
                  '{jake test[01.player/06.errors]}.',
               'Requires: `jasmine-node`, `phantomjs`.'])); // TODO: also test minified version
task('test', { async: true }, function(param) {
    _print('Running tests');
    /* Usage:
     *    run all specs: > jake test
     *    run all specs: > jake test[*]
     *    run testutils specs: > jake test[00.testutils\]
     *    run all player's specs: > jake test[01.player/*]
     *    run specific spec group: > jake test[04.builder/13.enable-disable]
     */
    var runTestsCmd = [ Binaries.PHANTOMJS,
                        _loc(Tests.RUN_SCRIPT),
                        _loc(Tests.PAGE_FOR_CLI),
                        param || ''
                      ].join(' ');

    _print(runTestsCmd);
    jake.exec(runTestsCmd, EXEC_OPTS,
              function() { _print('Tests finished successfully');
                           _print(DONE_MARKER);
                           complete(); });
});

desc(_dfit_nl(['Generate Docco docs and compile API documentation into '+
                  'HTML files inside of the /doc directory.',
               'Requires: `docco`, Python installed, `markdown` module for Python'+
                  '(and Python is used only because of this module).',
               'Produces: /doc/player.html, /doc/builder.html, '+
                  '/doc/API.html, /doc/README.html, /doc/docco.css.']));
task('docs', { async: true }, function() {
    _print('Generating docs');

    _print('Using ' + (NODE_GLOBAL ? 'global'
                               : 'local (at '+LOCAL_NODE_DIR+')')
                + ' node.js binaries');

    function _src_docs(next) {
        _print('For sources');

        jake.exec([ Binaries.DOCCO,
                    '-o',
                    _loc(Dirs.DOCS)
                  ].concat(Docs.FromSRC.INCLUDE)
                   .join(' '), EXEC_OPTS,
                  function() { _print('Source docs were Generated successfully');
                               _print(DONE_MARKER);
                               if (next) next(); });
    }

    function _api_docs(next) {
        _print('For API');
        jake.exec([ [ Binaries.MARKDOWN,
                      _loc(Docs.FromMD.Files.API_SRC),
                      '>', _loc(Docs.FromMD.Files.API_DST),
                    ].join(' '),
                    [ Binaries.CAT,
                      _loc(Docs.FromMD.Parts._head),
                      _loc(Docs.FromMD.Files.API_DST),
                      _loc(Docs.FromMD.Parts._foot),
                      '>', _loc(Docs.FromMD.Files.API_DST + '.tmp'),
                    ].join(' '),
                    [ Binaries.MV,
                      _loc(Docs.FromMD.Files.API_DST + '.tmp'),
                      _loc(Docs.FromMD.Files.API_DST)
                    ].join(' ')
                  ], EXEC_OPTS,
                  function() { _print('API.html was Generated successfully');
                               _print(DONE_MARKER);
                               if (next) next(); });
    }

    function _readme_docs(next) {
        _print('For README');
        jake.exec([ [ Binaries.MARKDOWN,
                      _loc(Docs.FromMD.Files.README_SRC),
                      '>', _loc(Docs.FromMD.Files.README_DST),
                    ].join(' '),
                    [ Binaries.CAT,
                      _loc(Docs.FromMD.Parts._head),
                      _loc(Docs.FromMD.Files.README_DST),
                      _loc(Docs.FromMD.Parts._foot),
                      '>', _loc(Docs.FromMD.Files.README_DST + '.tmp'),
                    ].join(' '),
                    [ Binaries.MV,
                      _loc(Docs.FromMD.Files.README_DST + '.tmp'),
                      _loc(Docs.FromMD.Files.README_DST)
                    ].join(' ')
                  ], EXEC_OPTS,
                  function() { _print('README.html was Generated successfully');
                               _print(DONE_MARKER);
                               if (next) next(); });
    }

    _src_docs(function() {
      _api_docs(function() {
        _readme_docs(function() {
          complete();
        });
      });
    });

//sudo pip install markdown
//python -m markdown doc/API.md > doc/API.html
//cat doc/_head.html doc/API.html doc/_foot.html > doc/API.tmp.html
//mv doc/API.tmp.html doc/API.html
//python -m markdown doc/README.md > doc/README.html
//cat doc/_head.html doc/README.html doc/_foot.html > doc/README.tmp.html
//mv doc/README.tmp.html doc/README.html
});

desc(_dfit_nl(['Validate Animatron scene JSON file.',
               'Uses /src/import/animatron-project-VERSION.orderly '+
                  'as validation scheme.',
               'Usage: should be called with providing scene JSON file, '+
                  'in a way like: {jake anm-scene-valid[src/some-scene.json]}.',
               'Requires: `orderly` and `jsonschema` node.js modules']));
task('anm-scene-valid', function(param) {
  _print('Checking scene at: ' + _loc(param) + ' with ' + _loc(Validation.Schema.ANM_SCENE));

  var orderly = require("orderly"),
      jsonschema = require("jsonschema");

  var _scheme = orderly.parse(jake.cat(_loc(Validation.Schema.ANM_SCENE)));
  var _v = new jsonschema.Validator();

  _print(_v.validate(JSON.parse(jake.cat(_loc(param))), _scheme));

  _print(DONE_MARKER);
});

desc(_dfit_nl(['Get current version or apply a new version to the '+
                  'current state of files. If applies a new version, '+
                  'modifies VERSION and VERSIONS files, then also adds '+
                  'a git tag, while pushes nothing. Uses VERSION_LOG file '+
                  'to provide annotation for a new tag.',
               'Usage: {jake version} to get current version and '+
                  '{jake version[v0.8]} to set current version '+
                  'to a new one (do not forget to push tags). '+
                  'If this version exists, you will get detailed information about it. '+
                  'To remove a previous version, use <rm-version> task.',
               'Affects: (if creates a new version) '+
                  'VERSION, VERSIONS files and a git tag.']));
task('version', { async: true }, function(param) {
    if (!param) { _print(VERSION); return; }

    // Read versions

    var _v = _version(param);
    _print('Current version: ' + VERSION);
    _print('Selected version: ' + _v + '\n');

    // TODO: if (_v.match(/\d+\.\d+/))

    var _vhash = _versions.read();

    if (!_vhash) { _print(FAILED_MARKER); throw new Error('There is no any version data stored in ' + VERSIONS_FILE + ' file.'); }

    _print();

    // Show or write a version data

    if (_vhash[_v]) { // TODO: add force-version

        _print('Selected version exists, here\'s the detailed information about it:\n');
        if (!jake.program.opts.quiet) {
            jake.exec([
                [ Binaries.GIT,
                  'show',
                  '-s',
                  //'--format=full',
                  _v  ].join(' ')
                ], EXEC_OPTS,
                function() { _print('\n' + DONE_MARKER); complete(); });
        }

    } else {

        _print('Selected version does not exists, applying the new one (' + _v + ') to a current state.\n');

        _print('Getting head revision sha and date.');

        // TODO: ensure VERSION_LOG_FILE exists

        var _getCommitData = jake.createExec([
          [ Binaries.GIT,
            'show',
            '-s',
            '--format="%H %ct"',
            'HEAD' ].join(' ')
          ], EXEC_OPTS);
        _getCommitData.on('stdout', function(commit_data) {

            commit_data = commit_data.toString().split(/\s+/);
            var _hash = commit_data[0],
                _timestamp = commit_data[1],
                _timestr = new Date(_timestamp * 1000).toString();
            _print('HEAD sha is: ' + _hash);
            _print('HEAD timestamp is: ' + _timestamp);
            _print('HEAD human-written time is: ' + _timestr);

            _vhash[_v] = [ _hash, _timestamp, _timestr ];

            _vhash['latest'] = _v;

            _print('Applying a git tag ' + _v + ' to HEAD');

            jake.exec([
              [ Binaries.GIT,
                'tag',
                '-a', // annotated
                //'-s', // signed
                '-f', // force creation
                '--file', _loc(VERSION_LOG_FILE),
                _v ].join(' ')
            ], EXEC_OPTS, function() {

                VERSION = _v;

                jake.rmRf(_loc(VERSION_FILE));
                _print('Writing ' + _v + ' to ' + VERSION_FILE + ' file.\n');
                jake.echo(_v, _loc(VERSION_FILE));

                _print('Writing ' + _v + ' information to ' + VERSIONS_FILE + ' file.\n');
                _versions.write(_vhash);

                _print();
                _print('Version ' + _v + ' was applied.');
                _print(DONE_MARKER);
                complete();

            });

        });
        _getCommitData.on('error', function(msg) {
            _print(FAILED_MARKER, msg);
            throw new Error(msg);
        });
        _getCommitData.run();

    }

});

desc(_dfit_nl(['Remove given version information from versions '+
                  'data files among with the git tag. Pushes nothing.',
               'Usage: {jake version[v0.9:v0.8]} to remove version 0.9 '+
                  'and then set current (and latest) version to 0.8, '+
                  '{jake rm-version[v0.9:]} to remove given version, '+
                  'but to stay at the current one. (Do not forget to push tags.) '+
                  'To add a new version, use <version> task.',
               'Affects: (if removes a version) '+
                  'VERSION, VERSIONS files and removes a git tag.']));
task('rm-version', { async: true }, function(param) {
    if (!param) { throw new Error('Both target version and fallback version should be specified, e.g.: {jake rm-version[v0.5:v0.4]}.'); }

    var _s = param.split(':'),
        src_v = _version(_s[0]),
        dst_v = _version(_s[1]) || VERSION;

    if (!src_v) { _print(FAILED_MARKER); throw new Error('Target version should be specified, e.g.: {jake rm-version[v0.5:v0.4]}.'); }
    if (!dst_v) { _print(FAILED_MARKER); throw new Error('Fallback version should be specified, e.g.: {jake rm-version[v0.5:v0.4]}.'); }
    if (dst_v == VERSION) { _print(FAILED_MARKER); throw new Error('Destination version is already a current version (' + VERSION + ').'); }

    var _vhash = _versions.read();

    if (!_vhash) { _print(FAILED_MARKER); throw new Error('There is no any version data stored in ' + VERSIONS_FILE + ' file.'); }

    if (!_vhash[src_v]) { _print(FAILED_MARKER); throw new Error('No version ' + src_v + ' registered in ' + VERSIONS_FILE + ' file.'); }
    if (!_vhash[dst_v]) { _print(FAILED_MARKER); throw new Error('No version ' + dst_v + ' registered in ' + VERSIONS_FILE + ' file.'); }

    _print();
    _print(src_v + ' -> ' + dst_v);
    _print();

    _print('Removing a git tag ' + src_v);

    jake.exec([
        [ Binaries.GIT,
          'tag',
          '-d',
          src_v ].join(' ')
    ], EXEC_OPTS, function() {

        VERSION = dst_v;

        jake.rmRf(_loc(VERSION_FILE));
        _print(dst_v + ' -> ' + VERSION_FILE);
        jake.echo(dst_v, _loc(VERSION_FILE));

        _vhash[src_v] = null;
        delete _vhash[src_v];
        _vhash['latest'] = _dst_v;

        _print('Removing ' + src_v + ' information from ' + VERSIONS_FILE + ' file.\n');

        _versions.write(_vhash);

        _print();
        _print('Version ' + src_v + ' was removed and replaced back to ' + dst_v);
        _print(DONE_MARKER);
        complete();

    });


});

desc(_dfit_nl(['Builds and pushes current state, among with VERSIONS file '+
                   'to S3 at the path of `<VERSION>/` or `latest/`. '+
                   'No git switching to tag or anything smarter than just build and push to directory. '+
                   'To assign a version to a `HEAD` '+
                   'use {jake version[<version>]}, then you are safe to push.',
               'Usage: {jake push-version} to push current version from VERSION file. '+
                   'To push to `latest/`, use {jake push-version[latest]}. It is also '+
                   'possible to select a bucket: so {jake push-version[latest,rls]} will '+
                   'push to the release bucket (`dev` is default)',
               'Affects: Only changes S3, no touch to VERSION or VERSIONS or git stuff.',
               'Requires: `.s3` file with crendetials in form {user access-id secret}. '+
                    '`aws2js` and `walk` node.js modules.']));
task('push-version', [/*'test',*/'dist'], { async: true }, function(_version, _bucket) {

    var trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Development.ALIAS) trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Release.ALIAS) trg_bucket = Bucket.Release.NAME;
    if (_bucket == Bucket.Old.ALIAS) trg_bucket = Bucket.Old.NAME;

    _print('Selected bucket: ' + trg_bucket);

    var trg_dir = (_version|| VERSION);

    _print('Collecting file paths to upload');

    var walk = require('walk');

    var files   = [];

    var walker  = walk.walk(_loc(Dirs.DIST_ROOT), { followLinks: false });

    walker.on('file', function(root, stat, next) {
        files.push([ root + '/' + stat.name, // source
                     trg_dir +  // destination
                     root.substring(root.indexOf(Dirs.DIST_ROOT) +
                                    Dirs.DIST_ROOT.length) + '/'
                     + stat.name ]);
        next();
    });

    walker.on('end', function() {
        _print('Got list of files to put to S3');

        var creds = [];
        try {
            creds = jake.cat(_loc('.s3'));
        } catch(e) {
            _print('No .s3 file which should contain credentials to upload with was found');
            _print(FAILED_MARKER);
            throw e;
        }

        creds = creds.split(/\s+/);

        _print('Got credentials. Making a request.');

        var s3 = require('aws2js').load('s3', creds[1], creds[2]);

        s3.setBucket(trg_bucket);

        s3.putFile('/VERSIONS', _loc(VERSIONS_FILE), 'public-read', { 'content-type': 'text/json' }, function(err, res) {
            if (err) { _print(FAILED_MARKER); throw err; }
            _print(_loc(VERSIONS_FILE) + ' -> s3 as /VERSIONS');

            var files_count = files.length;

            files.forEach(function(file) {
                s3.putFile(file[1], _loc(file[0]), 'public-read', { 'content-type': 'text/javascript' /*application/x-javascript*/ }, (function(file) {
                  return function(err,res) {
                    if (err) { _print(FAILED_MARKER); throw err; }
                    _print(file[0] + ' -> S3 as ' + file[1]);
                    if (!files_count) { _print(DONE_MARKER); complete(); }
                  }
                })(file));
            });
        });
    });

});

desc(_dfit_nl(['Pushes `go` page to the S3.',
               'Usage: {jake push-go} to push to `dev` bucket. '+
                   'To push to another bucket, pass it as a param: '+
                   '{jake push-go[rls]}',
               'Affects: Only changes S3.',
               'Requires: `.s3` file with crendetials in form {user access-id secret}. '+
                    '`aws2js` node.js module.']));
task('push-go', [], { async: true }, function(_bucket) {

    var trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Development.ALIAS) trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Release.ALIAS) trg_bucket = Bucket.Release.NAME;
    if (_bucket == Bucket.Old.ALIAS) trg_bucket = Bucket.Old.NAME;

    _print('Selected bucket: ' + trg_bucket);

    _print('Ready to get credentials.');

    var creds = [];
    try {
        creds = jake.cat(_loc('.s3'));
    } catch(e) {
        _print('No .s3 file which should contain credentials to upload with was found');
        _print(FAILED_MARKER);
        throw e;
    }

    creds = creds.split(/\s+/);

    _print('Got credentials. Making a request.');

    var s3 = require('aws2js').load('s3', creds[1], creds[2]);

    s3.setBucket(trg_bucket);

    var GO_FILE_NAME = 'go';

    s3.putFile('/go', _loc(GO_FILE_NAME), 'public-read', { 'content-type': 'text/html' }, function(err, res) {

        if (err) { _print(FAILED_MARKER); throw err; }
        _print(_loc(GO_FILE_NAME) + ' -> s3 as /go');

        complete();

    });

});

/*desc('Run JSHint');
task('hint', function() {
    // TODO
});*/

// ======= SUBTASKS

desc(_dfit(['Internal. Create '+Dirs.MINIFIED+' & '+Dirs.AS_IS+' folders']));
task('_prepare', function() {
    _print('Create required destination folders..');
    _print('mkdir -p ' + _loc(Dirs.MINIFIED));
    jake.mkdirP(_loc(Dirs.MINIFIED));
    _print('mkdir -p ' + _loc(Dirs.AS_IS));
    jake.mkdirP(_loc(Dirs.AS_IS));
    _print(DONE_MARKER);
});

desc(_dfit(['Internal. Create bundles from existing sources and put them into '+Dirs.AS_IS+' folder']));
task('_bundles', function() {
    _print('Create Bundles..')

    var targetDir = Dirs.AS_IS + '/' + SubDirs.BUNDLES;
    jake.mkdirP(_loc(targetDir));
    Bundles.forEach(function(bundle) {
        _print('Package bundle \'' + bundle.name + '\'');
        var targetFile = targetDir + '/' + bundle.file + '.js';
        bundle.includes.forEach(function(bundleFile) {
            jake.echo(jake.cat(_loc(bundleFile)).trim() + '\n', _loc(targetFile));
            _print('.. ' + bundleFile + ' > ' + targetFile);
        });
    });

    _print(DONE_MARKER);
});

desc(_dfit(['Internal. Create a single bundle file and put it into '+Dirs.AS_IS+' folder, '+
               'bundle is provided as a parameter, e.g.: {jake _bundle[animatron]}']));
task('_bundle', function(param) {
    if (!param) throw new Error('This task requires a concrete bundle name to be specified');
    var bundle;
    Bundles.forEach(function(b) {
        if (b.name == param) { bundle = b; }
    });
    if (!bundle) throw new Error('Bundle with name ' + param + ' was not found');
    var targetDir = Dirs.AS_IS + '/' + SubDirs.BUNDLES;
    jake.mkdirP(_loc(targetDir));
    _print('Package bundle \'' + bundle.name + '\'');
    var targetFile = targetDir + '/' + bundle.file + '.js';
    bundle.includes.forEach(function(bundleFile) {
            jake.echo(jake.cat(_loc(bundleFile)).trim() + '\n', _loc(targetFile));
            _print('.. ' + bundleFile + ' > ' + targetFile);
        });
});

desc(_dfit(['Internal. Copy source files to '+Dirs.AS_IS+' folder']));
task('_organize', function() {

    _print('Copy files to ' + Dirs.AS_IS + '..');

    jake.cpR(_loc(Dirs.SRC   + '/' + Files.Main.PLAYER),
             _loc(Dirs.AS_IS + '/' + Files.Main.PLAYER));
    jake.cpR(_loc(Dirs.SRC   + '/' + Files.Main.BUILDER),
             _loc(Dirs.AS_IS + '/' + Files.Main.BUILDER));

    jake.mkdirP(_loc(Dirs.AS_IS + '/' + SubDirs.VENDOR));
    Files.Ext.VENDOR.forEach(function(vendorFile) {
        jake.cpR(_loc(Dirs.SRC   + '/' + SubDirs.VENDOR + '/' + vendorFile),
                 _loc(Dirs.AS_IS + '/' + SubDirs.VENDOR));
    });

    jake.mkdirP(_loc(Dirs.AS_IS + '/' + SubDirs.MODULES));
    Files.Ext.MODULES.forEach(function(moduleFile) {
        jake.cpR(_loc(Dirs.SRC   + '/' + SubDirs.MODULES + '/' + moduleFile),
                 _loc(Dirs.AS_IS + '/' + SubDirs.MODULES));
    });

    jake.mkdirP(_loc(Dirs.AS_IS + '/' + SubDirs.IMPORTERS));
    Files.Ext.IMPORTERS.forEach(function(importerFile) {
        jake.cpR(_loc(Dirs.SRC   + '/' + SubDirs.IMPORTERS + '/' + importerFile),
                 _loc(Dirs.AS_IS + '/' + SubDirs.IMPORTERS));
    });

    _print(DONE_MARKER);
});

desc(_dfit(['Internal. Inject version in all '+Dirs.AS_IS+' files']));
task('_versionize', function() {
    _print('Set proper VERSION to all player-originated files (including bundles) in ' + Dirs.AS_IS + '..');

    function versionize(file) {
        var new_content = jake.cat(file).trim()
                                        .replace(/@VERSION/g, VERSION);
        jake.rmRf(file);
        jake.echo(new_content, file);
        _print('v -> ' + file);
    }

    _print('.. Main files');

    versionize(_loc(Dirs.AS_IS + '/' + Files.Main.PLAYER));
    versionize(_loc(Dirs.AS_IS + '/' + Files.Main.BUILDER));

    _print('.. Modules');

    Files.Ext.MODULES.forEach(function(moduleFile) {
        versionize(_loc(Dirs.AS_IS + '/' + SubDirs.MODULES + '/' + moduleFile));
    });

    _print('.. Importers');

    Files.Ext.IMPORTERS.forEach(function(importerFile) {
        versionize(_loc(Dirs.AS_IS + '/' + SubDirs.IMPORTERS + '/' + importerFile));
    });

    _print('.. Bundles');

    Bundles.forEach(function(bundle) {
        versionize(_loc(Dirs.AS_IS + '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'));
    });

    _print('..Docs');

    versionize(_loc(Files.Doc.README));
    versionize(_loc(Dirs.DOCS + '/' + Files.Doc.API));

    _print(DONE_MARKER);
});

desc(_dfit(['Internal. Create a minified copy of all the sources and bundles '+
               'from '+Dirs.AS_IS+' folder and put them into '+Dirs.MINIFIED+'/ folder root']));
task('_minify', { async: true }, function() {
    _print('Minify all the files and put them in ' + Dirs.MINIFIED + ' folder');

    _print('Using ' + (NODE_GLOBAL ? 'global'
                               : 'local (at '+LOCAL_NODE_DIR+')')
                + ' node.js binaries');

    function minify(src, dst, cb) {
        jake.exec([
            [ Binaries.UGLIFYJS,
              '--ascii',
              '-o',
              dst, src
            ].join(' ')
        ], EXEC_OPTS, cb);
        _print('min -> ' + src + ' -> ' + dst);
    }

    function copyrightize(file) {
        var now = new Date();
        var new_content = COPYRIGHT_COMMENT.replace(/@BUILD_TIME/g,
                                                    (now.toString() + ' (' + now.toISOString() + ' / ' + now.getTime() + ')'))
                                           .concat(jake.cat(file).trim());
        jake.rmRf(file);
        jake.echo(new_content, file);
        _print('(c) -> ' + file);
    }

    var tasks = 0;
    function minifyWithCopyright(src, dst) {
        tasks++;
        minify(src, dst, function() {
            copyrightize(dst);
            _print(DONE_MARKER);
            tasks--;
            if (!tasks) complete();
        })
    }

    _print('.. Vendor Files');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.VENDOR);
    Files.Ext.VENDOR.forEach(function(vendorFile) {
        minify(_loc(Dirs.AS_IS    + '/' + SubDirs.VENDOR + '/' + vendorFile),
               _loc(Dirs.MINIFIED + '/' + SubDirs.VENDOR + '/' + vendorFile));
    });

    _print('.. Main files');

    minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + Files.Main.PLAYER),
                        _loc(Dirs.MINIFIED + '/' + Files.Main.PLAYER));
    minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + Files.Main.BUILDER),
                        _loc(Dirs.MINIFIED + '/' + Files.Main.BUILDER));

    _print('.. Bundles');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.BUNDLES);
    Bundles.forEach(function(bundle) {
        minifyWithCopyright(_loc(Dirs.AS_IS +    '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'),
                            _loc(Dirs.MINIFIED + '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'));
    });

    _print('.. Modules');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.MODULES);
    Files.Ext.MODULES.forEach(function(moduleFile) {
        minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + SubDirs.MODULES + '/' + moduleFile),
                            _loc(Dirs.MINIFIED + '/' + SubDirs.MODULES + '/' + moduleFile));
    });

    _print('.. Importers');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.IMPORTERS);
    Files.Ext.IMPORTERS.forEach(function(importerFile) {
        minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + SubDirs.IMPORTERS + '/' + importerFile),
                            _loc(Dirs.MINIFIED + '/' + SubDirs.IMPORTERS + '/' + importerFile));
    });

});

// UTILS

function _in_dir(dir, files) {
    var res = [];
    files.forEach(function(file) {
        res.push(dir + '/' + file);
    });
    return res;
}

function _loc(path) { return './' + path; }

function _dfit(lines) {
    return _fit(lines, DESC_PFX, DESC_PAD, DESC_TAB, DESC_WIDTH, DESC_1ST_PFX);
}

function _dfit_nl(lines) {
    return _fit(lines, DESC_PFX, DESC_PAD, DESC_TAB, DESC_WIDTH, DESC_1ST_PFX) + '\n';
}

function _fit_nl(lines, prefix, spaces, tabs, width, def_prefix) {
    return _fit(lines, prefix, spaces, width, def_prefix) + '\n';
}

function _fit(lines, prefix, spaces, tabs, width, def_prefix) {
    if (!lines.length) return '';

    function tabulate(line, indent_first) {
        var pad = '',
            tab = '';
        for (var j = 0; j < spaces; j++) { pad += ' '; }
        for (var j = 0; j < tabs;   j++) { tab += ' '; }
        if (spaces + prefix.length + line.length <= width) {
            new_lines.push(pad + prefix + (indent_first ? tab : '') + line.trim());
        } else {
            var left = line.length,
                pos = 0,
                chunk = 0;
            while (left > 0) {
                var do_indent = indent_first || (chunk > 0);
                var cut_size = width - spaces - prefix.length - ((do_indent ? tabs : 0));
                new_lines.push(pad + prefix + (do_indent ? tab : '') +
                               line.substring(pos, pos + cut_size).trim());
                pos += cut_size;
                left -= cut_size;
                chunk++;
            }
        }
    }

    var new_lines = [];
    if (!def_prefix) {
        tabulate(lines[0]);
    } else {
        if ((def_prefix + lines[0].length) <= width) {
            new_lines.push(lines[0].trim());
        } else {
            var cut_size = width - def_prefix;
            new_lines.push(lines[0].substring(0, cut_size).trim());
            tabulate(lines[0].substring(cut_size), true);
        }
    }
    for (var i = 1, il = lines.length; i < il; i++) {
        tabulate(lines[i]);
    }
    return new_lines.join('\n');
}

function _version(val) {
    if (!val) return null;
    return (val.indexOf('v') == '0') ? val : ('v' + val)
}

var _versions = (function() {

    function _read() {
        var _vfile,
            _vhash;
        try {
            _vfile = jake.cat(_loc(VERSIONS_FILE));
            if (!_vfile.length) throw new Error('File is empty');
            _print('Known versions:');
            _vhash = JSON.parse(_vfile);
            var _collected = 0;
            for (v in _vhash) {
                _print(v);
                _collected++;
            };
            if (!_collected) _print(NONE_MARKER);
        } catch(e) {
            _print(e.message || e);
            _print(VERSIONS_FILE + ' failed to parse or no ' + VERSIONS_FILE + ' file was found.');
            _print();
            _print(FAILED_MARKER);
            return;
        }
        return _vhash;
    }

    function _write(_vhash) {
        _print('Updating versions in ' + VERSIONS_FILE + ' file.\n');
        var _vhash_json = JSON.stringify(_vhash, null, 4);
        jake.rmRf(_loc(VERSIONS_FILE));
        jake.echo(_vhash_json, _loc(VERSIONS_FILE));
        for (v in _vhash) {
            var _d = _vhash[v];
            _print(VERSIONS_FILE + ' <- ' + v + ' ' + _d[0] + ' ' + _d[1] + ' <' + _d[2] + '>');
        };
    }

    return { read: _read,
             write: _write };
})();