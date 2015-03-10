/*
 * Copyright (c) 2011-2015 by Animatron.
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
    PACKAGE_FILE = 'package.json',
    VERSION = (function(file) {
       return jake.cat(_loc(file)).trim();
    })(VERSION_FILE),
    PACKAGE = (function(file) {
       return JSON.parse(jake.cat(_loc(file)).trim());
    })(PACKAGE_FILE);

var COPYRIGHT_YEAR = 2015;
var COPYRIGHT_COMMENT =
[ '/*',
  ' * Copyright (c) 2011-' + COPYRIGHT_YEAR + ' by Animatron.',
  ' * All rights are reserved.',
  ' * ',
  ' * Animatron Player is licensed under the MIT License.',
  ' * ',
  ' * ' + VERSION + ', built at @BUILD_TIME',
  ' */'].join('\n') + '\n';
var MINIFY_KEEP_COPYRIGHTS = '/WARRANTY|Free to use/';

var NODE_GLOBAL = false,
    LOCAL_NODE_DIR = './node_modules';

var Binaries = {
    JSHINT: NODE_GLOBAL ? 'jshint' : (LOCAL_NODE_DIR + '/jshint/bin/jshint'),
    UGLIFYJS: NODE_GLOBAL ? 'uglifyjs' : (LOCAL_NODE_DIR + '/uglify-js/bin/uglifyjs'),
    JASMINE_NODE: NODE_GLOBAL ? 'jasmine-node' : (LOCAL_NODE_DIR + '/jasmine-node/bin/jasmine-node'),
    JSDUCK: 'jsduck',
    PHANTOMJS: 'phantomjs',
    CAT: 'cat',
    MV: 'mv',
    MARKDOWN: 'python -m markdown',
    GIT: 'git',
    GZIP: 'gzip',
    BROWSERIFY: 'browserify'
};

var Dirs = {
    SRC: 'src',
    DIST: 'dist',
    TESTS: 'tests',
    DOCS: 'doc'
};

var SubDirs = {
    VENDOR: 'vendor',
    ENGINES: 'engine',
    MODULES: 'module',
    IMPORTERS: 'import',
    BUNDLES: 'bundle'
};

var Files = {
    Main: { INIT: 'anm.js',
            PLAYER: 'player.js' },
    Ext: { VENDOR: [ 'matrix.js'/*, 'json2.js'*/, 'font-detector.js' ],
           ENGINES: { _ALL_: [ 'dom-engine.js',
                               'node-engine.js' ],
                      DOM: 'dom-engine.js',
                      NODE: 'node-engine.js'/*,
                      JASMINE: 'jasmine-engine.js'*/ },
           IMPORTERS: { _ALL_: [ 'animatron-importer.js',
                                 'animatron-intact-importer.js' ],
                        ANM: 'animatron-importer.js',
                        ANM_INTACT: 'animatron-intact-importer.js' },
           MODULES: { _ALL_: [ //'audio-export.js',
                               //'scripting.js',
                               'video.js',
                               'shapes.js' ],
                      // AUDIO_EXPORT: 'audio-export.js',
                      SCRIPTING: 'scripting.js',
                      SHAPES: 'shapes.js' }, },
    Doc: { README: 'README.md',
           EMBEDDING: 'embedding.md',
           SCRIPTING: 'scripting.md' }
}

var Bundles = [
    { name: 'Animatron',
      file: 'animatron',
      includes: _in_dir(Dirs.DIST,      [Files.Main.PLAYER])
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.IMPORTERS, [ Files.Ext.IMPORTERS.ANM ])) // animatron-importer.js
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.MODULES,   [ Files.Ext.MODULES.SCRIPTING,
                                                              Files.Ext.MODULES.SHAPES ])) }
];

var Tests = {
    RUN_SCRIPT: Dirs.TESTS + '/' + 'run-jasmine.phantom.js',
    PAGE_FOR_CLI: Dirs.TESTS + '/' + 'run-for-terminal.html'
};

var Docs = {
    Config: Dirs.DOCS + '/jduck.json',
    FromSRC: { INCLUDE: [ Dirs.SRC + '/*.js' ] },
    FromMD: {
       Files: {
         README_SRC: Files.Doc.README,
         README_DST: Dirs.DOCS + '/README.html',
         SCRIPTING_SRC: Dirs.DOCS + '/' + Files.Doc.SCRIPTING,
         SCRIPTING_DST: Dirs.DOCS + '/scripting.html',
         EMBEDDING_SRC: Dirs.DOCS + '/' + Files.Doc.EMBEDDING,
         EMBEDDING_DST: Dirs.DOCS + '/embedding.html'
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
};

var BUILD_FILE_NAME = 'BUILD',
    BUILD_FILE = Dirs.DIST + '/' + BUILD_FILE_NAME,
    BUILD_FORMAT = '%H%n%ci%n%cn <%ce>';

var DONE_MARKER = '<Done>.\n',
    NONE_MARKER = '<None>.\n',
    FAILED_MARKER = '<Failed>.\n';

var DESC_WIDTH = 80,
    DESC_PAD = 27,
    DESC_TAB = 4,
    DESC_PFX = '# ',
    DESC_1ST_PFX = DESC_PAD + DESC_PFX.length;

var JSON_INDENT = 2;

var EXEC_OPTS = { printStdout: !jake.program.opts.quiet,
                  printStderr: !jake.program.opts.quiet },
    SILENT_EXEC_OPTS = { printStdout: false,
                         printStderr: !jake.program.opts.quiet };

var PRODUCTION_TAG = 'production',
    DEVELOPMENT_TAG = 'development';

var MOCK_MINIFICATION = false; // it's for debugging purposes, when we need full version in minified files

var _print = !jake.program.opts.quiet ? console.log : function() { };

function _build_time() { var now = new Date();
                         return now.toString() + ' / ' + now.toISOString(); }
function _extended_build_time() { var now = new Date();
                                  return now.toISOString() + ' ' +
                                         now.getTime() + '\n' +
                                         now.toString(); }

// TASKS =======================================================================

// default =====================================================================

desc(_dfit_nl(['Get full distribution in the /dist directory.',
               'Exactly the same as calling {jake dist}.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('default', ['dist'], function() {});

// clean =======================================================================

desc(_dfit_nl(['Clean previous build artifacts.']));
task('clean', function() {
    _print('Clean previous build artifacts..');
    jake.rmRf(_loc(Dirs.DIST));
    _print(DONE_MARKER);
});

// build =======================================================================

desc(_dfit_nl(['Build process (with no prior cleaning).',
               'Called by <dist>.',
               'Depends on: <_prepare>, <_organize>, <_build-file>.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('build', ['_prepare', '_organize', '_bundles', '_build-file'], function() {});

// build-min ===================================================================

desc(_dfit_nl(['Build process (with no prior cleaning).',
               'Called by <dist-min>.',
               'Depends on: <_prepare>, <_bundles>, <_organize>, <_versionize>, <_minify>, <_build-file>.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('build-min', ['_prepare', '_organize', '_bundles', '_versionize', '_minify', '_build-file'], function() {});

// dist ========================================================================

desc(_dfit_nl(['Clean previous build and create distribution files, '+
                  'so `dist` directory will contain the full '+
                  'distribution for this version, including '+
                  'all required files — sources and bundles.',
               'Coherently calls <clean> and <build>.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('dist', ['clean', 'build'], function() {});

// dist-min ====================================================================

desc(_dfit_nl(['Clean previous build and create distribution files, '+
                  'so `dist` directory will contain the full '+
                  'distribution for this version, including '+
                  'all required files — sources and bundles.',
               'Coherently calls <clean> and <build>.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('dist-min', ['clean', 'build-min'], function() {});

// test ========================================================================

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

// docs ========================================================================

desc(_dfit_nl(['Generate Docco docs and compile API documentation into '+
                  'HTML files inside of the /doc directory.',
               'Requires: `jsduck`, Python installed, `markdown` module for Python'+
                  '(and Python is used only because of this module).',
               'Produces: /doc/api/*, /doc/player.html, /doc/embedding.html, '+
                  '/doc/README.html, /doc/scripting.html.']));
task('docs', { async: true }, function() {
    _print('Generating docs');

    function _src_docs(next) {
        _print('For sources');

        _versionize(_loc(Docs.Config));

        jake.exec([ Binaries.JSDUCK,
                    '--config=' + _loc(Docs.Config)
                  ].join(' '), EXEC_OPTS,
                  function() { _print('Source docs were Generated successfully at ' + _loc(Dirs.DOCS + '/api'));
                               _print(DONE_MARKER);
                               if (next) next(); });
    }

    function _md_docs(_src, _dst, next) {
        _print('For ' + _src);
        jake.exec([ [ Binaries.MARKDOWN,
                      _loc(_src),
                      '>', _loc(_dst),
                    ].join(' '),
                    [ Binaries.CAT,
                      _loc(Docs.FromMD.Parts._head),
                      _loc(_dst),
                      _loc(Docs.FromMD.Parts._foot),
                      '>', _loc(_dst + '.tmp'),
                    ].join(' '),
                    [ Binaries.MV,
                      _loc(_dst + '.tmp'),
                      _loc(_dst)
                    ].join(' ')
                  ], EXEC_OPTS,
                  function() { _print(_dst + ' was Generated successfully');
                               _print(DONE_MARKER);
                               if (next) next(); });
    }

    _src_docs(function() {
      _md_docs(Docs.FromMD.Files.README_SRC, Docs.FromMD.Files.README_DST, function() {
        _md_docs(Docs.FromMD.Files.EMBEDDING_SRC, Docs.FromMD.Files.EMBEDDING_DST, function() {
          _md_docs(Docs.FromMD.Files.SCRIPTING_SRC, Docs.FromMD.Files.SCRIPTING_DST, function() {
            complete();
          });
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
//python -m markdown doc/scripting.md > doc/scripting.html
//cat doc/_head.html doc/scripting.html doc/_foot.html > doc/scripting.tmp.html
//mv doc/README.tmp.html doc/scripting.html
});

// anm-scene-valid =============================================================

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

// version =====================================================================

desc(_dfit_nl(['Get current version or apply a new version to the '+
                  'current state of files. If applies a new version, '+
                  'modifies VERSION and VERSIONS files, then also adds '+
                  'a git tag, while pushes nothing. Uses VERSION_LOG file '+
                  'to provide annotation for a new tag.',
               'Usage: {jake version} to get current version and '+
                  '{jake version[v0.8]} to set current version '+
                  'to a new one (do not forget to push tags). '+
                  'If this version exists, you will get detailed information about it. '+
                  'To remove a previous version, use <rm-version> task. '+
                  'Use {jake version[+v0.8]} to force creating a version even if it exists.',
               'Affects: (if creates a new version) '+
                  'VERSION, VERSIONS files and a git tag.']));
task('version', { async: true }, function(param) {
    if (!param) { _print(VERSION); return; }

    // Read versions

    var _forced = (param.indexOf('+') == 0);

    var _v = _version(_forced ? param.substring(1) : param);
    _print('Current version: ' + VERSION);
    _print('Selected version: ' + _v + '\n');

    // TODO: if (_v.match(/\d+\.\d+/))

    var _vhash = _versions.read();

    if (!_vhash) { _print(FAILED_MARKER); throw new Error('There is no any version data stored in ' + VERSIONS_FILE + ' file.'); }

    _print();

    // Show or write a version data

    if (_vhash[_v] && !_forced) { // TODO: add force-version

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

                PACKAGE.version = _v.substr(1); // trim 'v'
                jake.rmRf(_loc(PACKAGE_FILE));
                _print('Writing ' + _v + ' to ' + PACKAGE_FILE + ' file.\n');
                jake.echo(JSON.stringify(PACKAGE, null, JSON_INDENT), _loc(PACKAGE_FILE));

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

// rm-version ==================================================================

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
    if (dst_v == VERSION) { _print(FAILED_MARKER); throw new Error('Destination version is a current version (' + VERSION + '), should be some of the previous ones.'); }

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

        jake.rmRf(_loc(PACKAGE_FILE));
        _print(dst_v + ' -> ' + PACKAGE_FILE);
        PACKAGE.version = dst_v.substr(1);
        jake.echo(JSON.stringify(PACKAGE, null, JSON_INDENT), _loc(PACKAGE_FILE));

        _vhash[src_v] = null;
        delete _vhash[src_v];
        _vhash['latest'] = dst_v;

        _print('Removing ' + src_v + ' information from ' + VERSIONS_FILE + ' file.\n');

        _versions.write(_vhash);

        _print();
        _print('Version ' + src_v + ' was removed and replaced back to ' + dst_v);
        _print(DONE_MARKER);
        complete();

    });


});

// push-version ================================================================

desc(_dfit_nl(['Builds and pushes current state, among with VERSIONS file '+
                   'to S3 at the path of `<VERSION>/` or `latest/`. '+
                   'No git switching to tag or anything smarter than just build and push to directory. '+
                   'To assign a version to a `HEAD` '+
                   'use {jake version[<version>]}, then you are safe to push.',
               'Usage: {jake push-version} to push current version from VERSION file. '+
                   'To push to `latest/`, use {jake push-version[latest]}. It is also '+
                   'possible to select a bucket: so {jake push-version[latest,rls]} will '+
                   'push latest version to the release bucket (`dev` is default) and '+
                   '{jake push-version[,rls]} will push there a current version from VERSION file.',
               'Affects: Only changes S3, no touch to VERSION or VERSIONS or git stuff.',
               'Requires: `.s3` file with crendetials in form {user access-id secret}. '+
                    '`aws2js` and `walk` node.js modules.']));
task('push-version', [/*'test',*/'dist-min','push-go'], { async: true }, function(_version, _bucket) {

    var trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Development.ALIAS) trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Release.ALIAS) trg_bucket = Bucket.Release.NAME;
    if (_bucket == Bucket.Old.ALIAS) trg_bucket = Bucket.Old.NAME;

    _print('Selected bucket: ' + trg_bucket);

    var trg_dir = (_version || VERSION);

    _print('Collecting file paths to upload');

    var jsonHeaders = { 'content-type': 'text/json' }, // for VERSIONS file, used below
        jsHeaders = { 'content-type': 'text/javascript' }, // application/x-javascript
        gzippedJsHeaders = { 'content-type': 'text/javascript',
                             'content-encoding': 'gzip' },
        plainTextHeaders = { 'content-type': 'text/plain' };

    var walk    = require('walk');

    var files   = [];

    var walker  = walk.walk(_loc(Dirs.DIST), { followLinks: false });

    walker.on('file', function(root, stat, next) {
        var gzip_it = (stat.name.indexOf('.js') > 0) &&
                      (stat.name !== BUILD_FILE_NAME);
        files.push([ root + '/' + stat.name, // source
                     trg_dir +
                     root.substring(root.indexOf(Dirs.DIST) +
                                    Dirs.DIST.length) + '/'
                     + stat.name, // destination
                     gzip_it, // is this file should be gzipped or not
                     // destination headers, all files except BUILD are javascript files
                     gzip_it ? gzippedJsHeaders
                             : ((stat.name !== BUILD_FILE_NAME) ? jsHeaders
                                                                : plainTextHeaders)
                   ]);
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

        s3.putFile('/VERSIONS', _loc(VERSIONS_FILE), 'public-read', jsonHeaders, function(err, res) {
            if (err) { _print(FAILED_MARKER); throw err; }
            _print(_loc(VERSIONS_FILE) + ' -> s3 as /VERSIONS');

            var files_count = files.length;

            var on_complete = function(src, dst, gzipped) {
              return function(err,res) {
                if (gzipped) jake.rmRf(gzipped);
                if (err) { _print(FAILED_MARKER); throw err; }
                _print(src + ' -> S3 as ' + dst);
                files_count--;
                if (!files_count) { _print(DONE_MARKER); complete(); }
              }
            }

            // TODO: use Jake new Rules technique for that (http://jakejs.com/#rules)
            function compress(src, cb) {
                var dst = src + '.gz';
                jake.exec([
                  [ Binaries.GZIP,
                    '-9',
                    '-c',
                    src, '>', dst
                  ].join(' ') ], EXEC_OPTS, function() {
                     cb(dst);
                  });
                _print('gzip <- ' + src);
            }

            files.forEach(function(file) {
                var src = file[0],
                    dst = file[1],
                    gzip_it = file[2],
                    headers = file[3];
                if (gzip_it) {
                    compress(src, function(gzipped) {
                      s3.putFile(dst, gzipped, 'public-read',
                        headers, on_complete(src, dst, gzipped));
                    });
                } else {
                    s3.putFile(dst, src, 'public-read',
                      headers, on_complete(src, dst));
                }
            });
        });
    });

});

// push-go =====================================================================

desc(_dfit_nl(['Pushes publish.js` script to the S3.',
               'Usage: {jake push-go} to push to `dev` bucket under current version. '+
                   'To push to another bucket or version, pass it as a param: '+
                   '{jake push-go[,rls]}, {jake push-go[latest,rls]}',
               'Affects: Only changes S3.',
               'Requires: `.s3` file with crendetials in form {user access-id secret}. '+
                    '`aws2js` node.js module.']));
task('push-go', [], { async: true }, function(_version, _bucket) {

    var trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Development.ALIAS) trg_bucket = Bucket.Development.NAME;
    if (_bucket == Bucket.Release.ALIAS) trg_bucket = Bucket.Release.NAME;
    if (_bucket == Bucket.Old.ALIAS) trg_bucket = Bucket.Old.NAME;

    _print('Selected bucket: ' + trg_bucket);

    var trg_version = (_version || VERSION);

    _print('Version: ' + trg_version);

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

    var PUBLISHJS_LOCAL_PATH = _loc('publish.js'),
        PUBLISHJS_REMOTE_PATH = '/' + trg_version + '/publish.js';
    var FAVICON_LOCAL_PATH = _loc('res/favicon.ico'),
        FAVICON_REMOTE_PATH = '/favicon.ico';


    s3.putFile(PUBLISHJS_REMOTE_PATH, PUBLISHJS_LOCAL_PATH, 'public-read', { 'content-type': 'text/javascript' }, function(err, res) {

        if (err) { _print(FAILED_MARKER); throw err; }
        _print(PUBLISHJS_LOCAL_PATH + ' -> s3 as ' + PUBLISHJS_REMOTE_PATH);

        s3.putFile(FAVICON_REMOTE_PATH, FAVICON_LOCAL_PATH, 'public-read', { 'content-type': 'image/x-icon' }, function(err, res) {

            if (err) { _print(FAILED_MARKER); throw err; }
            _print(FAVICON_LOCAL_PATH + ' -> s3 as ' + FAVICON_REMOTE_PATH);

            complete();

        });

    });

});

// trig-prod ===================================================================

/*desc(_dfit_nl(['Triggers deployment to Production server',
                 'using `production` annotated tag. (Reversed for future use)']));*/
task('trig-prod', [], { async: true }, function() {
    // just applies a tag `production`, so TeamCity will build it and run sequentially:
    // jake test
    // jake _push-version[,rls]
    // jake _push-version[latest,rls]
    // jake _push-go[,rls]
    // jake _push-go[latest,rls]

    jake.exec([
          [ Binaries.GIT,
            'tag',
            '-a', '-f',
            PRODUCTION_TAG,
            '-m',
            '"PRODUCTION"' ].join(' ')
      ], EXEC_OPTS, function() {

      jake.exec([
          [ Binaries.GIT,
            'push', '-f',
            'origin',
            PRODUCTION_TAG ].join(' ')
      ], EXEC_OPTS, function() {

        _print(DONE_MARKER);

        complete();

      });

    });

});

// trig-dev ====================================================================

/*desc(_dfit_nl(['Triggers deployment to Development server',
                 'using `development` annotated tag. (Reversed for future use)']));*/
task('trig-dev', [], { async: true }, function() {
    // just applies a tag `development`, so TeamCity will build it and run sequentially:
    // jake test
    // jake _push-version
    // jake _push-version[latest]
    // jake _push-go
    // jake _push-go[latest]

    jake.exec([
          [ Binaries.GIT,
            'tag',
            '-a', '-f',
            DEVELOPMENT_TAG,
            '-m',
            '"DEVELOPMENT"' ].join(' ')
      ], EXEC_OPTS, function() {

      jake.exec([
          [ Binaries.GIT,
            'push', '-f',
            'origin',
            DEVELOPMENT_TAG ].join(' ')
      ], EXEC_OPTS, function() {

        _print(DONE_MARKER);

        complete();

      });

    });
});

//desc('See `trig-prod`.');
task('trigger-production', ['trig-prod'], {}, function() {});

//desc('See `trig-dev`.');
task('trigger-development', ['trig-dev'], {}, function() {});

/*desc('Run JSHint');
task('hint', function() {
    // TODO
});*/

// SUBTASKS ====================================================================

// _prepare ====================================================================

desc(_dfit(['Internal. Create '+Dirs.DIST+' folder']));
task('_prepare', function() {
    _print('Create required destination folders..');
    _print('mkdir -p ' + _loc(Dirs.DIST));
    jake.mkdirP(_loc(Dirs.DIST));
    _print(DONE_MARKER);
});

// _bundles ====================================================================

desc(_dfit(['Internal. Create bundles from existing sources and put them into '+Dirs.DIST+'/'+SubDirs.BUNDLES+' folder']));
task('_bundles', ['browserify'], function() {
    _print('Create Bundles..');
    var BUILD_TIME = _build_time();
    var targetDir = Dirs.DIST + '/' + SubDirs.BUNDLES;
    jake.mkdirP(_loc(targetDir));
    Bundles.forEach(function(bundle) {
        _print('Package bundle \'' + bundle.name + '\'');
        var targetFile = targetDir + '/' + bundle.file + '.js';
        jake.rmRf(_loc(targetFile));
        _print('.. (c) > ' + targetFile);
        jake.echo(COPYRIGHT_COMMENT.replace(/@BUILD_TIME/g, BUILD_TIME)
                                   .concat('\n\n\n'),
                  _loc(targetFile));
        bundle.includes.forEach(function(bundleFile) {
            jake.echo(jake.cat(_loc(bundleFile)).trim() + '\n', _loc(targetFile));
            _print('.. ' + bundleFile + ' > ' + targetFile);
        });
    });

    _print(DONE_MARKER);
});

// _bundle =====================================================================

desc(_dfit(['Internal. Create a single bundle file and put it into '+Dirs.DIST+'/'+SubDirs.BUNDLES+' folder, '+
               'bundle is provided as a parameter, e.g.: {jake _bundle[animatron]}']));
task('_bundle', function(param) {
    if (!param) throw new Error('This task requires a concrete bundle name to be specified');
    var BUILD_TIME = _build_time();
    var bundle;
    Bundles.forEach(function(b) {
        if (b.name == param) { bundle = b; }
    });
    if (!bundle) throw new Error('Bundle with name ' + param + ' was not found');
    var targetDir = Dirs.DIST + '/' + SubDirs.BUNDLES;
    jake.mkdirP(_loc(targetDir));
    _print('Package bundle \'' + bundle.name + '\'');
    var targetFile = targetDir + '/' + bundle.file + '.js';
    _print('.. (c) > ' + targetFile);
    jake.echo(COPYRIGHT_COMMENT.replace(/@BUILD_TIME/g, BUILD_TIME)
                               .concat('\n\n\n'),
              _loc(targetFile));
    bundle.includes.forEach(function(bundleFile) {
            jake.echo(jake.cat(_loc(bundleFile)).trim() + '\n\n',
                      _loc(targetFile));
            _print('.. ' + bundleFile + ' > ' + targetFile);
        });
});

// _organize ===================================================================

desc(_dfit(['Internal. Copy source files to '+Dirs.DIST+' folder']));
task('_organize', function() {
    return;
    _print('Copy files to ' + Dirs.DIST + '..');

    jake.cpR(_loc(Dirs.SRC  + '/' + Files.Main.INIT),
             _loc(Dirs.DIST + '/' + Files.Main.INIT));
    jake.cpR(_loc(Dirs.SRC  + '/' + Files.Main.PLAYER),
             _loc(Dirs.DIST + '/' + Files.Main.PLAYER));

    jake.mkdirP(_loc(Dirs.DIST + '/' + SubDirs.VENDOR));
    Files.Ext.VENDOR.forEach(function(vendorFile) {
        jake.cpR(_loc(Dirs.SRC  + '/' + SubDirs.VENDOR + '/' + vendorFile),
                 _loc(Dirs.DIST + '/' + SubDirs.VENDOR));
    });

    jake.mkdirP(_loc(Dirs.DIST + '/' + SubDirs.ENGINES));
    Files.Ext.ENGINES._ALL_.forEach(function(engineFile) {
        jake.cpR(_loc(Dirs.SRC  + '/' + SubDirs.ENGINES + '/' + engineFile),
                 _loc(Dirs.DIST + '/' + SubDirs.ENGINES));
    });

    jake.mkdirP(_loc(Dirs.DIST + '/' + SubDirs.MODULES));
    Files.Ext.MODULES._ALL_.forEach(function(moduleFile) {
        jake.cpR(_loc(Dirs.SRC  + '/' + SubDirs.MODULES + '/' + moduleFile),
                 _loc(Dirs.DIST + '/' + SubDirs.MODULES));
    });

    jake.mkdirP(_loc(Dirs.DIST + '/' + SubDirs.IMPORTERS));
    Files.Ext.IMPORTERS._ALL_.forEach(function(importerFile) {
        jake.cpR(_loc(Dirs.SRC  + '/' + SubDirs.IMPORTERS + '/' + importerFile),
                 _loc(Dirs.DIST + '/' + SubDirs.IMPORTERS));
    });

    _print(DONE_MARKER);
});

// _versionize =================================================================

desc(_dfit(['Internal. Inject version in all '+Dirs.DIST+' files']));
task('_versionize', function() {
    return;
    _print('Set proper VERSION to all player-originated files (including bundles) in ' + Dirs.DIST + '..');

    _print('.. Main files');

    _versionize(_loc(Dirs.DIST + '/' + Files.Main.INIT));
    _versionize(_loc(Dirs.DIST + '/' + Files.Main.PLAYER));

    _print('.. Engines');

    Files.Ext.ENGINES._ALL_.forEach(function(engineFile) {
        _versionize(_loc(Dirs.DIST + '/' + SubDirs.ENGINES + '/' + engineFile));
    });

    _print('.. Modules');

    Files.Ext.MODULES._ALL_.forEach(function(moduleFile) {
        _versionize(_loc(Dirs.DIST + '/' + SubDirs.MODULES + '/' + moduleFile));
    });

    _print('.. Importers');

    Files.Ext.IMPORTERS._ALL_.forEach(function(importerFile) {
        _versionize(_loc(Dirs.DIST + '/' + SubDirs.IMPORTERS + '/' + importerFile));
    });

    _print('.. Bundles');

    Bundles.forEach(function(bundle) {
        _versionize(_loc(Dirs.DIST + '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'));
    });

    _print('..Docs');

    _versionize(_loc(Files.Doc.README));
    _versionize(_loc(Dirs.DOCS + '/' + Files.Doc.EMBEDDING));
    _versionize(_loc(Dirs.DOCS + '/' + Files.Doc.SCRIPTING));

    _print(DONE_MARKER);
});

// _minify =====================================================================

desc(_dfit(['Internal. Create a minified copy of all the sources and bundles '+
               'from '+Dirs.DIST+' folder and append a .min suffix to them']));
task('_minify', { async: true }, function() {
    _print('Minify all the files and put them in ' + Dirs.DIST + ' folder');

    _print('Using ' + (NODE_GLOBAL ? 'global'
                               : 'local (at '+LOCAL_NODE_DIR+')')
                + ' node.js binaries');

    var BUILD_TIME = _build_time();

    // TODO: use Jake new Rules technique for that (http://jakejs.com/#rules)
    function minify(src, cb) {
        var dst = _minified(src);
        if (MOCK_MINIFICATION) {
          jake.cpR(src, dst);
          cb(dst);
          return;
        }
        jake.exec([
          [ Binaries.UGLIFYJS,
            '--ascii',
            '--compress warnings=false',
            '--screw-ie8', // since April 2014
            '--comments', '\'' + MINIFY_KEEP_COPYRIGHTS + '\'',
            '--output', dst,
            src
          ].join(' ')
        ], EXEC_OPTS, function() { cb(dst); });
        _print('min -> ' + src + ' -> ' + dst);
    }

    function copyrightize(src) {
        var new_content = COPYRIGHT_COMMENT.replace(/@BUILD_TIME/g, BUILD_TIME)
                                           .concat(jake.cat(src).trim()  + '\n');
        jake.rmRf(src);
        jake.echo(new_content, src);
        _print('(c) -> ' + src);
    }

    // since there is only one thread, it will [hopefully] work ok
    var queue = {};

    function minifyInQueue(src) {
        var task_id = _guid();
        queue[task_id] = {};
        minify(src, function(dst) {
            _print(DONE_MARKER);
            delete queue[task_id];
            if (!Object.keys(queue).length) complete();
        });
    }

    function minifyInQueueWithCopyright(src) {
        var task_id = _guid();
        queue[task_id] = {};
        minify(src, function(dst) {
            copyrightize(dst);
            _print(DONE_MARKER);
            delete queue[task_id];
            if (!Object.keys(queue).length) complete();
        });
    }
    /*
    _print('.. Vendor Files');

    Files.Ext.VENDOR.forEach(function(vendorFile) {
        minifyInQueue(_loc(Dirs.DIST + '/' + SubDirs.VENDOR + '/' + vendorFile));
    });
    */
    _print('.. Main files');

    //minifyInQueueWithCopyright(_loc(Dirs.DIST + '/' + Files.Main.INIT));
    minifyInQueueWithCopyright(_loc(Dirs.DIST + '/' + Files.Main.PLAYER));

    _print('.. Bundles');

    Bundles.forEach(function(bundle) {
        minifyInQueueWithCopyright(_loc(Dirs.DIST + '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'));
    });
    /*
    _print('.. Engines');

    Files.Ext.ENGINES._ALL_.forEach(function(engineFile) {
        minifyInQueueWithCopyright(_loc(Dirs.DIST + '/' + SubDirs.ENGINES + '/' + engineFile));
    });

    _print('.. Modules');

    Files.Ext.MODULES._ALL_.forEach(function(moduleFile) {
        minifyInQueueWithCopyright(_loc(Dirs.DIST + '/' + SubDirs.MODULES + '/' + moduleFile));
    });

    _print('.. Importers');

    Files.Ext.IMPORTERS._ALL_.forEach(function(importerFile) {
        minifyInQueueWithCopyright(_loc(Dirs.DIST + '/' + SubDirs.IMPORTERS + '/' + importerFile));
    });
    */
});

// _build-file =================================================================

desc(_dfit(['Internal. Create a BUILD file informing about the time and commit of a build.']));
task('_build-file', { async: true }, function() {
    _print('Fill ' + BUILD_FILE + ' file with information about current build');
    _print();

    var _getCommintHash = jake.createExec([
      [ Binaries.GIT,
        'log',
        '-n', '1',
        '--format=format:"' + BUILD_FORMAT + '"'
      ].join(' ')
    ], EXEC_OPTS);
    _getCommintHash.on('stdout', function(COMMIT_INFO) {
        var BUILD_TIME = _extended_build_time(),
            COMMIT_INFO = COMMIT_INFO.toString();

        _print('Build time:');
        _print(BUILD_TIME);
        _print();
        _print('Build commit:');
        _print(COMMIT_INFO);
        _print();

        jake.rmRf(_loc(BUILD_FILE));
        _print('Updating ' + BUILD_FILE + ' file.\n');
        jake.echo(BUILD_TIME + '\n'
                  + VERSION + '\n'
                  + COMMIT_INFO, _loc(BUILD_FILE));

        _print(DONE_MARKER);

        complete();
    });
    _getCommintHash.addListener('stderr', function(msg) {
        _print(FAILED_MARKER, msg);
        throw new Error(msg);
    });
    _getCommintHash.addListener('error', function(msg) {
        _print(FAILED_MARKER, msg);
        throw new Error(msg);
    });
    _getCommintHash.run();
});

task('browserify', {'async': true}, function(){
  _print('browserifying...');
  jake.exec('browserify src/main.js -o dist/player.js', function() {
    _print('created dist/player.js');
    complete();
  });
});

// UTILS =======================================================================

function _in_dir(dir, files) {
    var res = [];
    files.forEach(function(file) {
        res.push(dir + '/' + file);
    });
    return res;
}

function _loc(path) { return './' + path; }

function _minified(path) {
    var len = path.length;
    if (path.substr(len - 3) !== '.js') throw new Error('The path ' + path + ' points to file with no .js suffix; ' +
                                                      'Can\'t determine minified path.');
    return path.substr(0, len - 3) + '.min.js';
}

function _src_map(path) { return path + '.map'; }

function _src_map_url(path) {
    var path = path.replace(Dirs.DIST + '/', '');
    return '.' + path.substr(path.lastIndexOf('/')) + '.map';
}

function _src_map_root(path) { return './'; }

function _src_map_prefix(path) {
    return path.split('/').length - 1;
}

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

function _guid() {
    return Math.random().toString(36).substring(2, 10) +
           Math.random().toString(36).substring(2, 10);
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
        var _vhash_json = JSON.stringify(_vhash, null, JSON_INDENT);
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

function _versionize(src) {
    var new_content = jake.cat(src).trim()
                                   .replace(/@VERSION/g, VERSION)
                                   .replace(/@COPYRIGHT_YEAR/g, COPYRIGHT_YEAR);
    jake.rmRf(src);
    jake.echo(new_content + '\n', src);
    _print('v -> ' + src);
}

// TODO
/* function _check_npm_packages(list) {

} */
