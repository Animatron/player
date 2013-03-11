/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var fs = require('fs')/*,
    path = require('path')*/;

// ALIASES

jake.cat = function(file) { return fs.readFileSync(file, 'utf8'); };
jake.echo = function(what, where) { fs.appendFileSync(where, what, 'utf8'); };

// CONSTANTS

var VERSION_FILE = 'VERSION',
    VERSION = (function(file) {
       return jake.cat(file).trim();
    })(VERSION_FILE);

var COPYRIGHT_COMMENT =
[ '/*',
  ' * Copyright (c) 2011-2013 by Animatron.',
  ' * All rights are reserved.',
  ' * ',
  ' * Animatron player is licensed under the MIT License.',
  ' * ',
  ' * ' + VERSION,
  ' */'].join('\n') + '\n';

var Binaries = {
    JSHINT: 'jshint',
    UGLIFYJS: 'uglifyjs',
    JASMINE_NODE: 'jasmine-node',
    DOCCO: 'docco',
    PHANTOMJS: 'phantomjs'
};

var Dirs = {
    SRC: 'src',
    AS_IS: 'dist/full',
    MINIFIED: 'dist',
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
           MODULES: [ 'collisions.js' ] }
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
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.IMPORTERS, [ Files.Main.ANM_IMPORT ])) },
    { name: 'Develop',
      file: 'develop',
      includes: _in_dir(Dirs.SRC + '/' + SubDirs.VENDOR, Files.Ext.VENDOR )
        .concat(_in_dir(Dirs.SRC,                      [ Files.Main.PLAYER,
                                                         Files.Main.BUILDER ])) },
    { name: 'Hardcore',
      file: 'hardcore',
      includes: _in_dir(Dirs.SRC + '/' + SubDirs.VENDOR,  Files.Ext.VENDOR )
        .concat(_in_dir(Dirs.SRC,                       [ Files.Main.PLAYER ],
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.MODULES, Files.Ext.MODULES ),
        .concat(_in_dir(Dirs.SRC,                       [ Files.Main.BUILDER ])) }
];

var Tests = {
    RUN_SCRIPT: Dirs.TESTS + '/' + 'run-jasmine.phantom.js',
    PAGE_FOR_CLI: Dirs.TESTS + '/' + 'run-for-terminal.html'
};

var Docs = {
    INCLUDE: [ 'src/*.js' ]
};

var DONE_MARKER = '.\n';

// TASKS

desc('Coherently call `clean` and `dist` tasks by default');
task('default', ['clean', 'dist'], function() {});

desc('Clean previous build artifacts');
task('clean', function() {
    console.log('Clean previous build artifacts..');
    jake.rmRf(_loc(Dirs.AS_IS));
    jake.rmRf(_loc(Dirs.MINIFIED));
    console.log(DONE_MARKER);
});

desc('Create bundles');
task('build', ['_prepare', '_bundles', '_organize', '_versionize', '_minify'], function() {});

desc('Prepare distribution files');
task('dist', ['build'], function() {});

desc('Run tests'); // TODO: test minified version instead of plain
task('test', function(params) {
    console.log('Running tests');
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
                        params || ''
                      ].join(' ');

    console.log(runTestsCmd);
    jake.exec(runTestsCmd,
              function() { console.log('Tests finished successfully');
                           console.log(DONE_MARKER); },
              {printStdout: true});
});

desc('Generate Docco docs');
task('docs', function() {
    console.log('Generating docs');
    jake.exec([ Binaries.DOCCO,
                '-o',
                _loc(Dirs.DOCS)
              ].concat(Docs.INCLUDE)
               .join(' '),
              function() { console.log('Generated successfully');
                           console.log(DONE_MARKER); });
});

/*desc('Run JSHint');
task('hint', function() {
    // TODO
});*/

// ======= SUBTASKS

desc('Create '+Dirs.MINIFIED+' & '+Dirs.AS_IS+' folders');
task('_prepare', function() {
    console.log('Create required destination folders..');
    console.log('mkdir -p ' + _loc(Dirs.MINIFIED));
    jake.mkdirP(_loc(Dirs.MINIFIED));
    console.log('mkdir -p ' + _loc(Dirs.AS_IS));
    jake.mkdirP(_loc(Dirs.AS_IS));
    console.log(DONE_MARKER);
});

desc('Create bundles from existing sources and put them into '+Dirs.AS_IS+' folder');
task('_bundles', function() {
    console.log('Create Bundles..')

    var targetDir = Dirs.AS_IS + '/' + SubDirs.BUNDLES;
    jake.mkdirP(_loc(targetDir));
    Bundles.forEach(function(bundle) {
        console.log('Package bundle \'' + bundle.name + '\'');
        var targetFile = targetDir + '/' + bundle.file + '.js';
        bundle.includes.forEach(function(bundleFile) {
            jake.echo(jake.cat(_loc(bundleFile)).trim() + '\n', _loc(targetFile));
            console.log('.. ' + bundleFile + ' > ' + targetFile);
        });
    });

    console.log(DONE_MARKER);
});

desc('Copy source files to '+Dirs.AS_IS+' folder');
task('_organize', function() {

    console.log('Copy files to ' + Dirs.AS_IS + '..');

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

    console.log(DONE_MARKER);
});

desc('Inject version in all '+Dirs.AS_IS+' files');
task('_versionize', function() {
    console.log('Set proper VERSION to all player-originated files (including bundles) in ' + Dirs.AS_IS + '..');

    function versionize(file) {
        var new_content = jake.cat(file).trim()
                                        .replace(/@VERSION/g, VERSION);
        jake.rmRf(file);
        jake.echo(new_content, file);
        console.log('v -> ' + file);
    }

    console.log('.. Main files');

    versionize(_loc(Dirs.AS_IS + '/' + Files.Main.PLAYER));
    versionize(_loc(Dirs.AS_IS + '/' + Files.Main.BUILDER));

    console.log('.. Modules');

    Files.Ext.MODULES.forEach(function(moduleFile) {
        versionize(_loc(Dirs.AS_IS + '/' + SubDirs.MODULES + '/' + moduleFile));
    });

    console.log('.. Importers');

    Files.Ext.IMPORTERS.forEach(function(importerFile) {
        versionize(_loc(Dirs.AS_IS + '/' + SubDirs.IMPORTERS + '/' + importerFile));
    });

    console.log('.. Bundles');

    Bundles.forEach(function(bundle) {
        versionize(_loc(Dirs.AS_IS + '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'));
    });

    console.log(DONE_MARKER);
});

desc('Create a minified copy of all the sources from '+Dirs.AS_IS+' folder and put them into '+Dirs.MINIFIED+' folder root');
task('_minify', function() {
    console.log('Minify all the files and put them in ' + Dirs.MINIFIED + ' folder');

    function minify(src, dst, cb) {
        jake.exec([
            [ Binaries.UGLIFYJS,
              '--ascii',
              '-o',
              dst, src
            ].join(' ')
        ], cb);
        console.log('min -> ' + src + ' -> ' + dst);
    }

    function copyrightize(file) {
        var new_content = COPYRIGHT_COMMENT.concat(jake.cat(file).trim());
        jake.rmRf(file);
        jake.echo(new_content, file);
        console.log('(c) -> ' + file);
    }

    function minifyWithCopyright(src, dst) {
        minify(src, dst, function() {
            copyrightize(dst);
            console.log(DONE_MARKER);
        })
    }

    console.log('.. Vendor Files');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.VENDOR);
    Files.Ext.VENDOR.forEach(function(vendorFile) {
        minify(_loc(Dirs.AS_IS    + '/' + SubDirs.VENDOR + '/' + vendorFile),
               _loc(Dirs.MINIFIED + '/' + SubDirs.VENDOR + '/' + vendorFile));
    });

    console.log('.. Main files');

    minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + Files.Main.PLAYER),
                        _loc(Dirs.MINIFIED + '/' + Files.Main.PLAYER));
    minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + Files.Main.BUILDER),
                        _loc(Dirs.MINIFIED + '/' + Files.Main.BUILDER));

    console.log('.. Bundles');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.BUNDLES);
    Bundles.forEach(function(bundle) {
        minifyWithCopyright(_loc(Dirs.AS_IS +    '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'),
                            _loc(Dirs.MINIFIED + '/' + SubDirs.BUNDLES + '/' + bundle.file + '.js'));
    });

    console.log('.. Modules');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.MODULES);
    Files.Ext.MODULES.forEach(function(moduleFile) {
        minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + SubDirs.MODULES + '/' + moduleFile),
                            _loc(Dirs.MINIFIED + '/' + SubDirs.MODULES + '/' + moduleFile));
    });

    console.log('.. Importers');

    jake.mkdirP(Dirs.MINIFIED + '/' + SubDirs.IMPORTERS);
    Files.Ext.IMPORTERS.forEach(function(importerFile) {
        minifyWithCopyright(_loc(Dirs.AS_IS    + '/' + SubDirs.IMPORTERS + '/' + importerFile),
                            _loc(Dirs.MINIFIED + '/' + SubDirs.IMPORTERS + '/' + importerFile));
    });

    console.log('\n(async)\n');
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