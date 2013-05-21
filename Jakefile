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
//    uglifyjs: 2.2.5
//    doccoo: 0.6.2
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
  ' * ' + VERSION + ', built at @BUILD_TIME',
  ' */'].join('\n') + '\n';

var Binaries = {
    JSHINT: 'jshint',
    UGLIFYJS: 'uglifyjs',
    JASMINE_NODE: 'jasmine-node',
    DOCCO: 'docco',
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
           MODULES: [ 'collisions.js' ] },
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
        .concat(_in_dir(Dirs.SRC + '/' + SubDirs.IMPORTERS, [ Files.Main.ANM_IMPORT ])) },
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

var Validation = {
    Schema: { ANM_SCENE: Dirs.SRC + '/' + SubDirs.IMPORTERS + '/animatron-project-' + VERSION + '.orderly' }
}

var DONE_MARKER = '.\n';

var DESC_WIDTH = 80,
    DESC_PAD = 23,
    DESC_TAB = 7,
    DESC_PFX = '# ',
    DESC_1ST_PFX = DESC_PAD + DESC_PFX.length;

// TASKS

desc(_dfit_nl(['Get full distribution in the /dist directory.',
               'Exactly the same as calling {jake dist}.',
               'Requires: `uglifyjs`.',
               'Produces: /dist directory.']));
task('default', ['dist'], function() {});

desc(_dfit_nl(['Clean previous build artifacts.']));
task('clean', function() {
    console.log('Clean previous build artifacts..');
    jake.rmRf(_loc(Dirs.AS_IS));
    jake.rmRf(_loc(Dirs.MINIFIED));
    console.log(DONE_MARKER);
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
task('test', function(param) {
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
                        param || ''
                      ].join(' ');

    console.log(runTestsCmd);
    jake.exec(runTestsCmd,
              function() { console.log('Tests finished successfully');
                           console.log(DONE_MARKER); },
              {printStdout: true});
});

desc(_dfit_nl(['Generate Docco docs and compile API documentation into '+
                  'HTML files inside of the /doc directory.',
               'Requires: `docco`, Python installed, `markdown` module for Python'+
                  '(and Python is used only because of this module).',
               'Produces: /doc/player.html, /doc/builder.html, '+
                  '/doc/API.html, /doc/README.html, /doc/doccoo.css.']));
task('docs', function() {
    console.log('Generating docs');
    console.log('For sources');
    jake.exec([ Binaries.DOCCO,
                '-o',
                _loc(Dirs.DOCS)
              ].concat(Docs.FromSRC.INCLUDE)
               .join(' '),
              function() { console.log('Source docs were Generated successfully');
                           console.log(DONE_MARKER); });
    console.log('For README/API');
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
              ],
              function() { console.log('API.html was Generated successfully');
                           console.log(DONE_MARKER); });
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
              ],
              function() { console.log('README.html was Generated successfully');
                           console.log(DONE_MARKER); });

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
  console.log('Checking scene at: ' + _loc(param) + ' with ' + _loc(Validation.Schema.ANM_SCENE));

  var orderly = require("orderly"),
      jsonschema = require("jsonschema");

  var _scheme = orderly.parse(jake.cat(_loc(Validation.Schema.ANM_SCENE)));
  var _v = new jsonschema.Validator();

  console.log(_v.validate(JSON.parse(jake.cat(_loc(param))), _scheme));

});

desc(_dfit_nl(['Get current version or apply/update a version to the '+
                  'current state of files.',
               'Usage: {jake version} to get current version and '+
                  '{jake version[v0.8]} to set current version '+
                  'to a new one (do not forget to push tags)',
               'Produces: (if invoked with parameter)'+
                  'VERSION, VERSIONS files and git tag']));
task('version', function(param) {

});

//task('rm-version', function(param) {
//
//});

//task('push', function(param) {
//
//});

/*desc('Run JSHint');
task('hint', function() {
    // TODO
});*/

// ======= SUBTASKS

desc(_dfit(['Create '+Dirs.MINIFIED+' & '+Dirs.AS_IS+' folders']));
task('_prepare', function() {
    console.log('Create required destination folders..');
    console.log('mkdir -p ' + _loc(Dirs.MINIFIED));
    jake.mkdirP(_loc(Dirs.MINIFIED));
    console.log('mkdir -p ' + _loc(Dirs.AS_IS));
    jake.mkdirP(_loc(Dirs.AS_IS));
    console.log(DONE_MARKER);
});

desc(_dfit(['Create bundles from existing sources and put them into '+Dirs.AS_IS+' folder']));
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

desc(_dfit(['Create a single bundle file and put it into '+Dirs.AS_IS+' folder, '+
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
    console.log('Package bundle \'' + bundle.name + '\'');
    var targetFile = targetDir + '/' + bundle.file + '.js';
    bundle.includes.forEach(function(bundleFile) {
            jake.echo(jake.cat(_loc(bundleFile)).trim() + '\n', _loc(targetFile));
            console.log('.. ' + bundleFile + ' > ' + targetFile);
        });
});

desc(_dfit(['Copy source files to '+Dirs.AS_IS+' folder']));
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

desc(_dfit(['Inject version in all '+Dirs.AS_IS+' files']));
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

    console.log('..Docs');

    versionize(_loc(Files.Doc.README));
    versionize(_loc(Dirs.DOCS + '/' + Files.Doc.API));

    console.log(DONE_MARKER);
});

desc(_dfit(['Create a minified copy of all the sources and bundles '+
               'from '+Dirs.AS_IS+' folder and put them into '+Dirs.MINIFIED+'/ folder root']));
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
        var now = new Date();
        var new_content = COPYRIGHT_COMMENT.replace(/@BUILD_TIME/g,
                                                    (now.toString() + ' (' + now.toISOString() + ' / ' + now.getTime() + ')'))
                                           .concat(jake.cat(file).trim());
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
      new_lines.push(pad + prefix + line.trim());
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
    if (def_prefix + lines[0].length <= width) {
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

