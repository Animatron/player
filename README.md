### JS Player for Animatron project (not yet released, v0.9)

[![Build Status](https://secure.travis-ci.org/Animatron/player.png?branch=master)](https://travis-ci.org/Animatron/player)

Licensed under MIT License, see `LICENSE` file.

See [API.md](https://github.com/Animatron/player/blob/master/doc/API.md#files) for description on current API state (be aware, it may appear not updated to the _real_ current state).

**NB:** Development is in process. See [JS Player Pivotal Tracker page](https://www.pivotaltracker.com/projects/561405) to see what happens in project when you read this.

#### See in action

Navigate to [corresponding Animatron site section](http://animatron.com/player), there are some useful links:

* [Sandbox](http://animatron.com/player/sandbox/sandbox.html) to try it for yourself.
* [Demos](http://animatron.com/player/examples/demo.html) to see it in action with some demos (they're not so good-looking for the moment).
* [Tests](http://animatron.com/player/tests/index.html) to see what features are working for now.

Run one of the `tests/index.html` and run any of the tests to see if something is broken in your version of player.

#### Accessible from Cloud

The player files are accessible from the Amazon S3 Cloud in different bundles, each is just one file, so you may choose what you want to take:

* Standard Bundle (player only; a lightweight bundle) is located at `http://player.animatron.com/latest/bundle/standard.js`
* Animatron Bundle (player + animatron improrter; a bundle for the Animatron tool and embedding Animatron preview) is located at `http://player.animatron.com/latest/bundle/animatron.js`
* Develop Bundle (player + builder; a bundle for game or script-based animation developers) is located at `http://player.animatron.com/latest/bundle/develop.js`
* Hardcore Develop Bundle (player + builder + player additional modules, like collisions; a bundle for those game developers who uses complex things like collisions) is located at `http://player.animatron.com/latest/bundle/hardcore.js`

Include one of them as a script to your page, and you're done!

Also, all files are accessible separately, if you want:

* For most of the cases you need just [`vendor/matrix.js`](http://player.animatron.com/latest/vendor/matrix.js) and [`player.js`](http://player.animatron.com/latest/player.js)
* If you plan to program animation in an easy way, include [`builder.js`](http://player.animatron.com/latest/builder.js) next to them.
* If you want to import animations from Animatron tool, include [`import/animatron-importer.js`](http://player.animatron.com/latest/import/animatron-importer.js) then. The same for other importers.
* If you want to use some hardcore module, i.e. collisions module, include [`module/collisions.js`](http://player.animatron.com/latest/module/collisions.js) __before__ the builder file (builder will add some features to itself depending on enabled modules), if it is used, or just in any place after player file, if it is not. The same for other modules.

URLs scheme for all of them is:

    http://player.animatron.com(/<version>|/latest)[/full][(/bundle|/vendor|/import|/module)]/<file>.js

* `(/<version>|/latest)` — required; a version of the player you want to get files from (e.g. `v0.9`), or the latest version
* `[/full]` — optional; specify if you want to gen not-minimized version
* `[(/bundle|/vendor|/import|/module)]` — optional; bundles are located in `/bundle` folder, `/vendor` folder is for external files required for player, `/import` is for importers, `/module` is for modules; `/bundle` files are supposed to be added before any other files, if you need them separately and they are not included in the bundle themselves. `/vendor` files should appear before player files (`player.js`, `builder.js`, ...); `/import` and `/module` files should appear after player files (`player.js`, `builder.js`, ...).

#### Locally

Clone `git@github.com:Animatron/player.git` to get your own copy.

To use JS player in current state, download or copy from the cloned repository:

 * `src/vendor/matrix.js`
 * `src/player.js`
 * [Optional] `src/builder.js` (allows to build animations in a functional way)
 * [Optional] `src/module/collisions.js` (if you plan to test collisions / point-contains / intersections with your shapes)
 * [Optional] `src/import/animatron_importer.js` (allows to load animations from Animatron tool)
 * [Optional] `json2.js` (JSON parser, if target broswer not supports it (currently required only for Animatron Import))

And add them in the same order to your page header. Don't forget the [`LICENSE`](https://github.com/Animatron/player/blob/master/LICENSE#files) :).

Run `sandbox/sandbox.html` to try it for yourself.

Run `examples/demo.html` to see it in action with some demos (they're not so good-looking for the moment).

Run one of the `tests/index.html` and run any of the tests to see if something is broken in your version of player.

If you'd want to run them from terminal instead of browser, you'll need to have PhantomJS installation and then start `run-tests.sh[ spec]`

##### Bundles

When you build player with jake, it also creates several bundles, they are:

1. __Standard__: just player merged with required vendor files — for quick uses of the player (when developer wants very lightweight version)
1. __Animatron__: vendor files + player + importer from Animatron — exactly this one will be used in embedded player and in the Animatron tool
1. __Develop__: vendor files + player + Builder that simplifies working with scenes in a way like JQuery simplifies working with DOM — it will work ok for developing some general (in terms of code complexity) games.
1. __Hardcore__: vendor files + player + Builder + additional modules (like collisions support) — intended to be used to write more complex games

#### Development

To build locally, you'll need to have both [`jake`](https://github.com/mde/jake) and [`uglify-js` >= 2](https://github.com/mishoo/UglifyJS2) installed.

Warning: Building system currently uses `cat` and `mv` commands from UNIX shell, so it will need some UNIX-friendly environment to build correctly. However, node.js for MS Windows currently provides an integrated console that supports stuff like that, so probably it will work ok even without installing MinGW or Cygwin.

Then, you'll just need to run:

    jake
    # or, the same
    jake dist

And you have all the variants of the files in `dist` folder.

If you want to generate [docco](http://jashkenas.github.com/docco/) (install it first) docs, run:

    jake docs

If you want check if tests are failing in CLI, use (you'll need [`phantomjs`](http://phantomjs.org/) installed for that):

    jake test

Or, to check just a specific part of tests (see `./tests/spec/spec-list.js` for a list of all specs), use:

    jake test[01.player/*]
    jake test[02.animations/01.guids]

Here's the contents of the `jake -T` call, which describes each existing task:

    jake default           # Get full distribution in the /dist directory.
                           # Exactly the same as calling {jake dist}.
                           # Requires: `uglify-js`.
                           # Produces: /dist directory.

    jake clean             # Clean previous build artifacts.

    jake build             # Build process, with no cleaning.
                           # Called by <dist>.
                           # Depends on: <_prepare>, <_bundles>, <_organize>, <_vers
                           #        ionize>, <_minify>.
                           # Requires: `uglify-js`.
                           # Produces: /dist directory.

    jake dist              # Clean previous build and create distribution files, so
                           #        `dist` directory will contain the full distribut
                           #        ion for this version, including all required fil
                           #        es — sources and bundles.
                           # Coherently calls <clean> and <build>.
                           # Requires: `uglify-js`.
                           # Produces: /dist directory.

    jake test              # Run tests for the sources (not the distribution).
                           # Usage: Among with {jake test} may be called with provid
                           #        ing separate spec or spec group, in a way like:
                           #        {jake test[01.player/*]} or, for concrete spec:
                           #        {jake test[01.player/06.errors]}.
                           # Requires: `jasmine-node`, `phantomjs`.

    jake docs              # Generate Docco docs and compile API documentation into
                           #        HTML files inside of the /doc directory.
                           # Requires: `docco`, Python installed, `markdown` module
                           #        for Python(and Python is used only because of th
                           #        is module).
                           # Produces: /doc/player.html, /doc/builder.html, /doc/API
                           #        .html, /doc/README.html, /doc/docco.css.

    jake anm-scene-valid   # Validate Animatron scene JSON file.
                           # Uses /src/import/animatron-project-VERSION.orderly as v
                           #        alidation scheme.
                           # Usage: should be called with providing scene JSON file,
                           #        in a way like: {jake anm-scene-valid[src/some-s
                           #        cene.json]}.
                           # Requires: `orderly` and `jsonschema` node.js modules

    jake version           # Get current version or apply a new version to the curre
                           #        nt state of files. If applies a new version, mod
                           #        ifies VERSION and VERSIONS files, then also adds
                           #        a git tag, while pushes nothing. Uses VERSION_L
                           #        OG file to provide annotation for a new tag.
                           # Usage: {jake version} to get current version and {jake
                           #        version[v0.8]} to set current version to a new o
                           #        ne (do not forget to push tags). If this version
                           #        exists, you will get detailed information about
                           #        it. To remove a previous version, use <rm-versi
                           #        on> task.
                           # Affects: (if creates a new version) VERSION, VERSIONS f
                           #        iles and a git tag.

    jake rm-version        # Remove given version information from versions data fil
                           #        es among with the git tag. Pushes nothing.
                           # Usage: {jake version[v0.9:v0.8]} to remove version 0.9
                           #        and then set current (and latest) version to 0.8
                           #        , {jake rm-version[v0.9:]} to remove given versi
                           #        on, but to stay at the current one. (Do not forg
                           #        et to push tags.) To add a new version, use <ver
                           #        sion> task.
                           # Affects: (if removes a version) VERSION, VERSIONS files
                           #        and removes a git tag.

    jake push-version      # Builds and pushes current state, among with VERSIONS fi
                           #        le to S3 at the path of `<VERSION>/` or `latest/
                           #        `. No git switching to tag or anything smarter t
                           #        han just build and push to directory. To assign
                           #        a version to a `HEAD` use {jake version[<version
                           #        >]}, then you are safe to push.
                           # Usage: {jake push-version} to push current version from
                           #        VERSION file. To push to `latest/`, use {jake p
                           #        ush-version[latest]}.
                           # Affects: Only changes S3, no touch to VERSION or VERSIO
                           #        NS or git stuff.
                           # Requires: `aws2js` and `walk` node.js modules.

    jake _prepare          # Internal. Create dist & dist/full folders
    jake _bundles          # Internal. Create bundles from existing sources and put
                           #        them into dist/full folder
    jake _bundle           # Internal. Create a single bundle file and put it into d
                           #        ist/full folder, bundle is provided as a paramet
                           #        er, e.g.: {jake _bundle[animatron]}
    jake _organize         # Internal. Copy source files to dist/full folder
    jake _versionize       # Internal. Inject version in all dist/full files
    jake _minify           # Internal. Create a minified copy of all the sources and
                           #        bundles from dist/full folder and put them into
                           #        dist/ folder root

###### Versions

None of the libraries or software is required to run and use the player, except HTML5-Compatible browser.
The versions listed below are for the development participation only.

Versions of software used for development (only `node`, `jake` and `uglifyjs` are required for building):

* `node`: 0.8.9
* `npm` (node.js): 1.2.8
* `jake` (node.js): 0.5.14 _(global installation recommended)_
* `uglify-js` (node.js): 2.2.5 _(global installation recommended)_
* `phantomjs`: 1.7.0 _(global installation recommended)_
* `jasmine-node`: 1.7.1
* `docco` (node.js): 0.6.2
* `markdown` (Python module): ?
* `orderly` (node.js): 1.1.0
* `jsonschema` (node.js): 0.3.2
* `aws2js` (node.js): 0.8.3 (requires `make`)
* `walk` (node.js): 2.2.1

Requirements for different actions are:

* Building a distribution: `node`, `jake`, `uglify-js`
* Testing sources: `node`, `jake`, `jasmine-node`, `phantomjs`
* Build HTML documentation: `node`, `jake`, `docco`, `python`, Python `markdown` module
* Validate Animatron scenes: `node`, `jake`, `orderly`, `jsonschema`
* Putting Files to S3: `node`, `jake`, `aws2js`, `walk`

(c) 2011-2013 by Animatron.