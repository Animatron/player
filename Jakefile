var fs = require('fs')/*,
    path = require('path')*/;

// aliases
jake.cat = function(file) { return fs.readFileSync(file, 'utf8'); };
jake.echo = function(what, where) { fs.appendFileSync(where, what, 'utf8'); };

// CONSTANTS

var Binaries = {
    JSHINT: 'jshint',
    UGLIFYJS: 'uglifyjs',
    JASMINE_NODE: 'jasmine-node',
    DOCCO: 'docco',
    PHANTOMJS: 'phantomjs'
};

var DIST_DIR = 'dist',
    PLAIN_FILES_TARGET_DIR = DIST_DIR + '/as-is';
    MINIFIED_FILES_TARGET_DIR = DIST_DIR;

var VERSION_FILE = 'VERSION',
    VERSION = (function(file) {
       return jake.cat(file).trim();
    })(VERSION_FILE);

var PLAYER_FILE = 'anm.player.js',
    BUILDER_FILE = 'anm.builder.js',
    ANM_IMPORT_FILE = 'animatron_import.js';

var VENDOR_FILES = [ 'vendor/matrix.js' ],
    IMPORTERS_FILES = [ ANM_IMPORT_FILE ],
    MODULES_FILES = [ 'anm.collisions.js' ];

var Bundles = [
    { name: 'Standard',
      file: 'standard',
      includes: VENDOR_FILES.concat([ PLAYER_FILE ]) },
    { name: 'Animatron',
      file: 'animatron',
      includes: VENDOR_FILES.concat([ ANM_IMPORT_FILE, PLAYER_FILE ]) },
    { name: 'Develop',
      file: 'develop',
      includes: VENDOR_FILES.concat([ PLAYER_FILE, BUILDER_FILE ]) },
    { name: 'Hardcore',
      file: 'hardcore',
      includes: VENDOR_FILES.concat([ PLAYER_FILE, BUILDER_FILE ]).concat(MODULES_FILES) }
];

var BUNDLES_DEST_DIR = 'bundle',
    VENDOR_DEST_DIR = 'vendor',
    MODULES_DEST_DIR = 'mods',
    IMPORTERS_DEST_DIR = 'import';

var BUNDLES_TRG_DIR   = PLAIN_FILES_TARGET_DIR + '/' + BUNDLES_DEST_DIR,
    MODULES_TRG_DIR   = PLAIN_FILES_TARGET_DIR + '/' + MODULES_DEST_DIR,
    IMPORTERS_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + IMPORTERS_DEST_DIR,
    VENDOR_TRG_DIR    = PLAIN_FILES_TARGET_DIR + '/' + VENDOR_DEST_DIR;

var TESTS_DIR = 'tests';
var TESTS_RUN_SCRIPT = TESTS_DIR + '/run-with-phantomjs.sh',
    TESTS_PAGE_FOR_CLI = TESTS_DIR + '/run-for-terminal.html';

var DOCS_DIR = 'doc',
    INCLUDE_IN_DOCS_PATTERN = 'anm.*.js';

var DONE_MARKER = '.\n';

// proposed structure:
// /- version/
//  |- ...
//  |- bundle/
//  |- mods/
//  |- import/
//  |- as-is
//   \- vendor/
//   \- bundle/
//   \- mods/
//   \- import/
//   \- ...

desc('Coherently call `clean` and `dist` tasks by default');
task('default', ['clean', 'dist'], function() {});

desc('Clean previous build artifacts');
task('clean', function() {
    console.log('Clean previous build artifacts..');
    jake.rmRf(_loc(DIST_DIR));
    console.log(DONE_MARKER);
});

desc('Create '+MINIFIED_FILES_TARGET_DIR+' & '+PLAIN_FILES_TARGET_DIR+' folders');
task('_prepare', function() {
    console.log('Create required destination folders..');
    jake.mkdirP(_loc(DIST_DIR));
    jake.mkdirP(_loc(MINIFIED_FILES_TARGET_DIR));
    jake.mkdirP(_loc(PLAIN_FILES_TARGET_DIR));
    console.log(DONE_MARKER);
});

desc('Create bundles from existing sources and put them into '+PLAIN_FILES_TARGET_DIR+' folder');
task('_bundles', function() {
    console.log('Create Bundles..')

    jake.mkdirP(_loc(BUNDLES_TRG_DIR));
    Bundles.forEach(function(bundle) {
        console.log('Package bundle \'' + bundle.name + '\'');
        var TRG_FILE = BUNDLES_TRG_DIR + '/' + bundle.file + '.js';
        bundle.includes.forEach(function(bundle_file) {
            jake.echo(_loc(bundle_file), _loc(TRG_FILE));
            console.log('.. ' + bundle_file + ' > ' + TRG_FILE);
        });
    });

    console.log(DONE_MARKER);
});

desc('Copy source files to '+PLAIN_FILES_TARGET_DIR+' folder');
task('_organize', function() {

    console.log('Copy files to ' + PLAIN_FILES_TARGET_DIR + '..');

    jake.cpR(_loc(PLAYER_FILE),  _loc(PLAIN_FILES_TARGET_DIR));
    jake.cpR(_loc(BUILDER_FILE), _loc(PLAIN_FILES_TARGET_DIR));

    jake.mkdirP(_loc(VENDOR_TRG_DIR));
    VENDOR_FILES.forEach(function(vendor_file) {
        jake.cpR(_loc(vendor_file), _loc(VENDOR_TRG_DIR));
    });

    jake.mkdirP(_loc(MODULES_TRG_DIR));
    MODULES_FILES.forEach(function(module_file) {
        jake.cpR(_loc(module_file), _loc(MODULES_TRG_DIR));
    });

    jake.mkdirP(_loc(IMPORTERS_TRG_DIR));
    IMPORTERS_FILES.forEach(function(importer_file) {
        jake.cpR(_loc(importer_file), _loc(IMPORTERS_TRG_DIR));
    });

    console.log(DONE_MARKER);
});

desc('Inject version in all '+PLAIN_FILES_TARGET_DIR+' files');
task('_versionize', function() {
    var BUNDLES_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + BUNDLES_DEST_DIR;
    var MODULES_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + MODULES_DEST_DIR;
    var IMPORTERS_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + IMPORTERS_DEST_DIR;

    console.log('Set proper VERSION to all player-originated files (including bundles) in ' + PLAIN_FILES_TARGET_DIR + '..');

    function versionize(file) {
        jake.echo(jake.cat(file).trim()
                                .split('\n')
                                .join('\n')
                                .replace(/@VERSION/g, VERSION),
                  file);
        console.log('v -> ' + file);
    }

    console.log('.. Main files');

    versionize(_loc(PLAIN_FILES_TARGET_DIR + '/' + PLAYER_FILE));
    versionize(_loc(PLAIN_FILES_TARGET_DIR + '/' + BUILDER_FILE));

    console.log('.. Modules');

    MODULES_FILES.forEach(function(module_file) {
        versionize(_loc(MODULES_TRG_DIR + '/' + module_file));
    });

    console.log('.. Importers');

    IMPORTERS_FILES.forEach(function(importer_file) {
        versionize(_loc(IMPORTERS_TRG_DIR + '/' + importer_file));
    });

    console.log('.. Bundles');

    Bundles.forEach(function(bundle) {
        versionize(_loc(BUNDLES_TRG_DIR + '/' + bundle.file + '.js'));
    });

    console.log(DONE_MARKER);
});

desc('Create a minified copy of all the sources from '+PLAIN_FILES_TARGET_DIR+' folder and put them into '+MINIFIED_FILES_TARGET_DIR+' folder root');
task('_minify', function() {
    console.log('Minify all the files and put them in ' + MINIFIED_FILES_TARGET_DIR + ' folder');

    function minify(src, dst) {
        jake.exec([
            [ Binaries.UGLIFYJS,
              '--ascii',
              '-o',
              dst, src
            ].join(' ')
        ]);
        console.log('min -> ' + src + ' -> ' + dst);
    }

    /* console.log('.. Vendor Files');

    VENDOR_FILES.forEach(function(vendor_file) {
        minify(_loc(VENDOR_TRG_DIR + '/' + vendor_file),
               _loc(MINIFIED_FILES_TARGET_DIR + '/' + VENDOR_DEST_DIR + '/' + vendor_file));
    }); */

    console.log('.. Main files');

    minify(_loc(PLAIN_FILES_TARGET_DIR + '/' + PLAYER_FILE),
           _loc(MINIFIED_FILES_TARGET_DIR + '/' + PLAYER_FILE));
    minify(_loc(PLAIN_FILES_TARGET_DIR + '/' + BUILDER_FILE),
           _loc(MINIFIED_FILES_TARGET_DIR + '/' + BUILDER_FILE));

    console.log('.. Bundles');

    Bundles.forEach(function(bundle) {
        minify(_loc(BUNDLES_TRG_DIR + '/' + bundle.file + '.js'),
               _loc(MINIFIED_FILES_TARGET_DIR + '/' + BUNDLES_DEST_DIR + '/' + bundle.file + '.js'));
    });

    console.log('.. Modules');

    MODULES_FILES.forEach(function(module_file) {
        minify(_loc(MODULES_TRG_DIR + '/' + module_file),
               _loc(MINIFIED_FILES_TARGET_DIR + '/' + MODULES_DEST_DIR + '/' + module_file));
    });

    console.log('.. Importers');

    IMPORTERS_FILES.forEach(function(importer_file) {
        minify(_loc(IMPORTERS_TRG_DIR + '/' + importer_file),
               _loc(MINIFIED_FILES_TARGET_DIR + '/' + IMPORTERS_DEST_DIR + '/' + importer_file));
    });

    console.log(DONE_MARKER);
});

desc('Create bundles');
task('build', ['_prepare', '_bundles', '_organize', '_versionize', '_minify'], function() {});

desc('Prepare distribution files');
task('dist', ['build'], function() {});

desc('Run tests'); // TODO: test minified version instead of plain
task('test', function() {});

desc('Generate Docco docs');
task('docs', function() {});

desc('Run JSHint');
task('hint', function() {});

function _loc(path) { return './' + path; }