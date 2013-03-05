var fs = require('fs')/*,
    path = require('path')*/;

// aliases
jake.cat = function(file) { return fs.readFileSync(file, 'utf8'); };
jake.echo = function(what, where) { fs.appendFileSync(where, what, 'utf8'); };

// CONSTANTS

var DIST_DIR = './dist';
var PLAIN_FILES_TARGET_DIR = DIST_DIR + '/as-is';
var MINIFIED_FILES_TARGET_DIR = DIST_DIR;
//var DEV_DIR = './dev';

var VERSION_FILE = 'VERSION',
    VERSION = (function(file) {
       return jake.cat(file).trim();
    })(VERSION_FILE);

var PLAYER_FILE = './anm.player.js';
var BUILDER_FILE = './anm.builder.js';
var ANM_IMPORT_FILE = './animatron_import.js';

var VENDOR_FILES = [ './vendor/matrix.js' ];
var IMPORTERS_FILES = [ ANM_IMPORT_FILE ];
var MODULES_FILES = [ './anm.collisions.js' ];

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

var BUNDLE_DEST_DIR = 'bundle';
var VENDOR_DEST_DIR = 'vendor';
var MODULES_DEST_DIR = 'mods';
var IMPORTERS_DEST_DIR = 'import';

var TESTS_DIR = './tests';
var TESTS_RUN_SCRIPT = TESTS_DIR + '/run-with-phantomjs.sh',
    TESTS_PAGE_FOR_CLI = TESTS_DIR + '/run-for-terminal.html';

var DOCS_DIR = './doc',
    INCLUDE_IN_DOCS_PATTERN = 'anm.*.js';

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
    jake.rmRf(DIST_DIR);
});

desc('Create dist & dist/as-is folders');
task('_prepare', function() {
    jake.mkdirP(DIST_DIR);
    jake.mkdirP(MINIFIED_FILES_TARGET_DIR);
    jake.mkdirP(PLAIN_FILES_TARGET_DIR);
});

desc('Create bundles from existing sources and put them into dist/as-is folder');
task('_bundles', function() {
    var BUNDLES_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + BUNDLE_DEST_DIR;
    jake.mkdirP(BUNDLES_TRG_DIR);
    Bundles.forEach(function(bundle) {
        console.log('Packaging bundle \'' + bundle.name + '\'');
        var TRG_FILE = BUNDLES_TRG_DIR + '/' + bundle.file + '.js';
        bundle.includes.forEach(function(bundle_file) {
            jake.echo(bundle_file, TRG_FILE);
            console.log('.. ' + bundle_file + ' > ' + TRG_FILE);
        });
    });
});

desc('Copy source files to as-is folder');
task('_organize', function() {

   jake.cpR(PLAYER_FILE,  PLAIN_FILES_TARGET_DIR);
   jake.cpR(BUILDER_FILE, PLAIN_FILES_TARGET_DIR);

   var VENDOR_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + VENDOR_DEST_DIR;
   jake.mkdirP(VENDOR_TRG_DIR);
   VENDOR_FILES.forEach(function(vendor_file) {
      jake.cpR(vendor_file, VENDOR_TRG_DIR);
   });

   var MODULES_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + MODULES_DEST_DIR;
   jake.mkdirP(MODULES_TRG_DIR);
   MODULES_FILES.forEach(function(module_file) {
      jake.cpR(module_file, MODULES_TRG_DIR);
   });

   var IMPORTERS_TRG_DIR = PLAIN_FILES_TARGET_DIR + '/' + IMPORTERS_DEST_DIR;
   jake.mkdirP(IMPORTERS_TRG_DIR);
   IMPORTERS_FILES.forEach(function(importer_file) {
      jake.cpR(importer_file, IMPORTERS_TRG_DIR);
   });

});

desc('Inject version in all dist/as-is files');
task('_versionize', function() {

});

desc('Create a minified copy of all the sources from dist/as-is folder and put them into dist folder root');
task('_minify', function() {

});

desc('Create bundles');
task('build', ['_prepare', '_bundles', '_organize', '_versionize', '_minify'], function() {});

desc('Prepare distribution files');
task('dist', ['build'], function() {});