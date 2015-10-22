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
//    docco: 0.6.2
//    python markdown: ?
//    orderly: 1.1.0
//    jsonschema: 0.3.2

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
  ' * Copyright © 2011-' + COPYRIGHT_YEAR + ' by Animatron.',
  ' * All rights are reserved.',
  ' * ',
  ' * Animatron Player is licensed under the MIT License.',
  ' * ',
  ' * ' + VERSION + ', built at @BUILD_TIME',
  ' */'].join('\n') + '\n';
var MINIFY_KEEP_COPYRIGHTS = '/WARRANTY|Free to use/';

var NODE_GLOBAL = false,
    LOCAL_NODE_DIR = './node_modules';
    JAVA_PATH = process.env.JAVA_BINARY || 'java';

var Binaries = {
    JSHINT: NODE_GLOBAL ? 'jshint' : (LOCAL_NODE_DIR + '/jshint/bin/jshint'),
    JASMINE_NODE: NODE_GLOBAL ? 'jasmine-node' : (LOCAL_NODE_DIR + '/jasmine-node/bin/jasmine-node'),
    JSDUCK: 'jsduck',
    JASMINE: 'jasmine',
    KARMA: NODE_GLOBAL ? 'karma' : (LOCAL_NODE_DIR + '/karma/bin/karma'),
    CAT: 'cat',
    MV: 'mv',
    MARKDOWN: 'python -m markdown',
    GIT: 'git',
    BROWSERIFY: 'browserify',
    CLOSURECOMPILER: JAVA_PATH + ' -jar ' + LOCAL_NODE_DIR + '/google-closure-compiler/compiler.jar'
};

var Dirs = {
    SRC: 'src',
    DIST: 'dist',
    TESTS: 'spec',
    DOCS: 'doc'
};

var SubDirs = {
    VENDOR: 'vendor',
    ENGINES: 'engine',
    MODULES: 'module',
    IMPORTERS: 'import',
    BUNDLES: 'bundle',
    ANM: 'anm'
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
           MODULES: { _ALL_: [ /* 'audio-export.js' */ ]
                      /* AUDIO_EXPORT: 'audio-export.js' */ },
           ANALYTICS: 'analytics.js'},
    Doc: { README: 'README.md',
           EMBEDDING: 'embedding.md',
           SCRIPTING: 'scripting.md' }
};


var _default_bundle_includes = _in_dir(Dirs.DIST, [Files.Main.PLAYER])
    .concat(_in_dir(Dirs.SRC + '/' + SubDirs.IMPORTERS, [Files.Ext.IMPORTERS.ANM])) // animatron-importer.js
    .concat(_in_dir(Dirs.SRC + '/' + SubDirs.MODULES, []));

var Bundles = [
    { name: 'Animatron Local',
      file: 'animatron.local',
      includes: _default_bundle_includes
    },
    { name: 'Animatron',
      file: 'animatron',
      includes: _default_bundle_includes
          .concat(_in_dir(Dirs.SRC + '/' + SubDirs.ANM, [Files.Ext.ANALYTICS]))
    }
];

var Tests = {
    Config: Dirs.TESTS + '/karma.conf.js'
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
//there are some specifics when building from TC,
//namely absence of the git repo on hand
var isTeamCityBuild = !!process.env.TEAMCITY_BUILDCONF_NAME;


// TASKS =======================================================================

// default =====================================================================

desc(_dfit_nl(['Get full distribution in the /dist directory.',
               'Exactly the same as calling {jake dist}.',
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
               'Depends on: <_prepare>, <_build-file>.',
               'Produces: /dist directory.']));
task('build', ['_prepare', '_bundles', '_build-file'], function() {});

// build-min ===================================================================

desc(_dfit_nl(['Build process (with no prior cleaning).',
               'Called by <dist-min>.',
               'Depends on: <_prepare>, <_bundles>, <_minify>, <_build-file>.',
               'Produces: /dist directory.']));
task('build-min', ['_prepare', '_bundles', '_minify', '_build-file'], function() {});

// dist ========================================================================

desc(_dfit_nl(['Clean previous build and create distribution files, '+
                  'so `dist` directory will contain the full '+
                  'distribution for this version, including '+
                  'all required files — sources and bundles.',
               'Coherently calls <clean> and <build>.',
               'Produces: /dist directory.']));
task('dist', ['clean', 'build'], function() {});

// dist-min ====================================================================

desc(_dfit_nl(['Clean previous build and create distribution files, '+
                  'so `dist` directory will contain the full '+
                  'distribution for this version, including '+
                  'all required files — sources and bundles.',
               'Coherently calls <clean> and <build>.',
               'Produces: /dist directory.']));
task('dist-min', ['clean', 'build-min'], function() {});

// test ========================================================================

desc(_dfit_nl(['Run tests for the distribution.',
               'Usage: Just call {jake test}.',
               'Requires: `karma`, `karma-mocha-reporter`.']));
task('test', ['dist-min', 'test-dist']);

// test-dist ===================================================================

desc(_dfit_nl(['Test the distribution which already exists.',
               'Usage: Just call {jake test-dist}.',
               'Requires: `karma`, `karma-mocha-reporter`.']));
task('test-dist', { async: true }, function() {
    _print('Running tests');

    jake.exec([ Binaries.KARMA, 'start',
                _loc(Tests.Config),
                '--single-run'
              ].join(' '), EXEC_OPTS,
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

    if (!_vhash) { _print(FAILED_MARKER); throw new Error('There is no version data stored in ' + VERSIONS_FILE + ' file.'); }

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
            fail(msg, 1);
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

// invalidate ==================================================================
desc('Creates a CloudFront invalidation. Usage: jake invalidate[1.3]');
task('invalidate', [], { async: true }, function(version) {
    version = version || VERSION;
    console.log('Creating invalidation for version', version);
    var credentials = getCredentials();
    var AWS = require('aws-sdk');
    AWS.config.update({
        accessKeyId: credentials.key,
        secretAccessKey: credentials.secret
    });

    var distributionId = credentials.distributionId;
    if (!distributionId) {
        fail('CloudFront Distribution ID not provided', 1);
    }
    var paths = [
        '/%VERSION%/bundle/animatron.js',
        '/%VERSION%/bundle/animatron.min.js',
        '/%VERSION%/player.js',
        '/%VERSION%/player.min.js',
        '/%VERSION%/publish.js',
        '/%VERSION%/BUILD'
    ];


    var cloudFront = new AWS.CloudFront();
    var items = paths.map(function(path) { return path.replace('%VERSION%', version);});
    var params = {
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: new Date().getTime().toString(),
            Paths: {
                Quantity: items.length,
                Items: items
            }
        }
    };
    cloudFront.createInvalidation(params, function(err, res){
            if(err) fail(err, 1);
            _print('Invalidation '+res.Invalidation.Id + ' created successfully');
            complete();
    });

});

task('deploy-publishjs', { async: true }, function(version, bucket) {
    version = version || VERSION;
    var s3bucket = 'player-dev.animatron.com',
        isProd = bucket === 'prod';
    if (isProd) {
        s3bucket = 'player.animatron.com';
    }
    console.log('Starting deployment of publish.js version', version, 'to', s3bucket);
    var credentials = getCredentials();
    var AWS = require('aws-sdk');
    AWS.config.update({
        accessKeyId: credentials.key,
        secretAccessKey: credentials.secret
    });
    var s3 = new AWS.S3();
    var params = {
        'Bucket': s3bucket,
        'ACL': 'public-read',
        'ContentType': 'text/javascript',
        'Key': version + '/publish.js',
        'Body': jake.cat('./publish.js')
    };
    if (!isProd) {
        params.CacheControl = 'max-age=300';
    }
    s3.putObject(params, function(err) {
        if (err) {
            fail('Deployment failed: ' +  err.message, 1);
        } else {
            console.log('Deployment of publish.js complete.');
            complete();
        }
    });
});

task('deploy', ['dist-min'], function(version, bucket) {
    version = version || VERSION;
    var s3bucket = 'player-dev.animatron.com',
        isProd = bucket === 'prod';
    if (isProd) {
        s3bucket = 'player.animatron.com';
    }

    var doDeployment = function() {
        console.log('Starting deployment of version', version, 'to', s3bucket);
        var credentials = getCredentials();
        var localPrefix = './dist/',
            remotePrefix = version + '/',
            files = [
                'BUILD',
                'player.js',
                'player.min.js',
                'bundle/animatron.js',
                'bundle/animatron.min.js',
                'bundle/animatron.local.js',
                'bundle/animatron.local.min.js'
            ];

        var AWS = require('aws-sdk');
        AWS.config.update({
            accessKeyId: credentials.key,
            secretAccessKey: credentials.secret
        });

        var s3 = new AWS.S3();
        var async = require('async'),
            zlib = require('zlib'),
            fs = require('fs');
        async.each(files, function(file, done) {
            var key = remotePrefix + file;
            var isJs = file.substring(file.length-3) === '.js';
            var params = {
                'Bucket': s3bucket,
                'ACL': 'public-read',
                'ContentType': isJs ? 'text/javascript' : 'text/plain',
                'Key': key
            };
            if (!isProd) {
                params.CacheControl = 'max-age=300';
            }
            var body = jake.cat(localPrefix + file);
            if (isJs) {
                params.ContentEncoding = 'gzip';
                body = zlib.gzipSync(body);
            }
            params.Body = body;
            s3.putObject(params, function(err, data) {
                if (err) {
                    done(err);
                } else {
                    console.log(key, 'uploaded to S3 successfully');
                    done();
                }
            });
        }, function(err) {
            if (err) {
                fail('Deployment failed: ' +  err.message, 1);
            } else {
                console.log('Deployment complete.');
                if (isProd) {
                    //invalidate files after production deployment
                    var invalidate = jake.Task.invalidate;
                    invalidate.addListener('complete', function(){
                        complete();
                    });
                    invalidate.invoke(version);
                    return;
                } else {
                    complete();
                }
            }
        });
    };

    if (!isProd || isTeamCityBuild) {
        //we can't check which branch TC is on, so we'll have to trust it is
        //configured correctly
        doDeployment();
    } else {
        var git = jake.createExec('git symbolic-ref --short HEAD');
        git.on('stdout', function(branch) {
            if (branch.toString().trim() !== 'master') {
                fail('You have to be on the master branch to deploy to production', 1);
            } else {
                doDeployment();
            }
        });

        git.run();
    }
});


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
// _minify =====================================================================

desc(_dfit(['Internal. Create a minified copy of all the sources and bundles '+
               'from '+Dirs.DIST+' folder and append a .min suffix to them']));
task('_minify', { async: true }, function() {
    _print('Minify all the files and put them in ' + Dirs.DIST + ' folder');

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
          [ Binaries.CLOSURECOMPILER,
            '--compilation_level SIMPLE_OPTIMIZATIONS',
            '--js', src,
            '--js_output_file', dst,
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
});

// _build-file =================================================================

desc(_dfit(['Internal. Create a BUILD file informing about the time and commit of a build.']));
task('_build-file', { async: true }, function() {
    _print('Fill ' + BUILD_FILE + ' file with information about current build');
    _print();
    var BUILD_TIME = _extended_build_time();
    console.log('Build time:', BUILD_TIME);

    var updateBuildFile = function(commitInfo) {
        jake.rmRf(_loc(BUILD_FILE));
        _print('Updating ' + BUILD_FILE + ' file.\n');
        jake.echo(BUILD_TIME + '\n' +
                  VERSION + '\n' +
                  commitInfo, _loc(BUILD_FILE));

        _print(DONE_MARKER);

        complete();
    };

    if (isTeamCityBuild) {
        var commitInfo = process.env.BUILD_VCS_NUMBER_Animatron_AnimatronPlayerDevelopment +
            '\n' + 'Built by TeamCity. Build #' + process.env.BUILD_NUMBER;
        console.log(commitInfo);
        updateBuildFile(commitInfo);
    } else {
        var getCommit = jake.createExec([
          [ Binaries.GIT,
            'log',
            '-n', '1',
            '--format=format:"' + BUILD_FORMAT + '"'
          ].join(' ')
        ], EXEC_OPTS);
        getCommit.on('stdout', function(commitInfo) {
            commitInfo = commitInfo.toString();

            console.log(commitInfo);
            updateBuildFile(commitInfo);

        });
        getCommit.addListener('stderr', function(msg) {
            fail(msg, 1);
        });
        getCommit.addListener('error', function(msg) {
            fail(msg, 1);
        });
        getCommit.run();
    }
});

task('browserify', { 'async': true }, function() {
    console.log('Creating Browserify bundle.');
    //check if the browserify binary exists
    var browserifyPath = '/usr/local/bin/browserify';
    if (!fs.existsSync(browserifyPath)) {
        browserifyPath = './node_modules/browserify/bin/cmd.js';
    }
    jake.exec(browserifyPath + ' -t browserify-css src/main.js -o dist/player.js', function() {
        console.log('dist/player.js created successfully');
        complete();
    });
});

// UTILS =======================================================================
var _credentials = null;
function getCredentials() {
    if (_credentials) {
        return _credentials;
    }
    if (process.env.S3_KEY) {
        //get credentials from the environment
        return (_credentials = {
            key: process.env.S3_KEY,
            secret: process.env.S3_SECRET,
            distributionId: process.env.CF_DISTRIBUTION
        });
    } else {
        //get credentials from .s3
        if (!fs.existsSync('./.s3')) {
            fail('No credentials for deployment provided', 1);
        }
        var creds = fs.readFileSync('./.s3').toString().split(/\s+/);
        return (_credentials = {
            key: creds[1],
            secret: creds[2],
            distributionId: creds[3]
        });
    }
}

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
