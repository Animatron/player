### JS Player for Animatron project (v1.2, though anyway very unstable)

[Currently all tests are disabled and not time-bombed in refactoring purposes (some will be turned back on after refactoring iterations, some not), so the badge below just provides nice ecologically green color for us to feel safe]

[API, embedding and this documentation in general are a subject to change drastically. Be aware!]

[![Build Status](https://secure.travis-ci.org/Animatron/player.png?branch=master)](https://travis-ci.org/Animatron/player)
<!-- [![Code Climate](https://codeclimate.com/github/Animatron/player.png)](https://codeclimate.com/github/Animatron/player) -->

Licensed under MIT License, see `LICENSE` file.

**NB:** **Development is in progress. Some links below may not work at all, some documentation is outdated, API is radically changing just in this very minute, so we will update docs when it comes to a more stable state, sorry!**

See [API.md](https://github.com/Animatron/player/blob/master/doc/API.md#files) for description on current API state (be aware, it may appear not updated to the _real_ current state).

#### See in action

Navigate to [corresponding Animatron site section](http://animatron.com/player), there are some useful links:

* [Sandbox](http://animatron.com/player/sandbox/sandbox.html) to try it for yourself.
* [Demos](http://animatron.com/player/examples/demo.html) to see it in action with some demos (they're not so good-looking for the moment).
* [Tests](http://animatron.com/player/tests/index.html) to see what features are working for now.

Run one of the `tests/index.html` and run any of the tests to see if something is broken in your version of player.

##### Embedding

See [Embedding section in API docs](http://animatron.com/player/doc/API.html#Embedding) (or [at github](https://github.com/Animatron/player/blob/master/doc/API.md#Embedding)) on detailed information about embedding process.

Also, a detailed article about it is [located here](TODO).

#### Accessible from Cloud

The player files are accessible from the Amazon S3 Cloud in different bundles, each is just one file, so you may choose what you want to take:

* Standard Bundle (vendor files + DOM-engine + player only; a lightweight bundle) is located at `http://player.animatron.com/latest/bundle/standard.min.js`
* Animatron Bundle (vendor files + DOM-engine + player + builder + animatron importer + required modules; a bundle for the Animatron tool and embedding Animatron preview) is located at `http://player.animatron.com/latest/bundle/animatron.min.js`
* Develop Bundle (vendor files + DOM-engine + player + builder + animatron importer + no modules; a bundle for game or script-based animation developers) is located at `http://player.animatron.com/latest/bundle/develop.min.js`
* Hardcore Develop Bundle (vendor files + DOM-engine + player + builder + animatron importer + all player additional modules, like collisions; a bundle for those game developers who uses complex things like collisions) is located at `http://player.animatron.com/latest/bundle/hardcore.min.js`

Include one of them as a script to your page, and you're done!

Also, all files are accessible separately, if you want:

* For most of the cases you need just [`vendor/matrix.min.js`](http://player.animatron.com/latest/vendor/matrix.min.js), [`anm.min.js`](http://player.animatron.com/latest/anm.min.js), [`engine/dom-engine.min.js`](http://player.animatron.com/latest/engine/dom-engine.min.js) and [`player.min.js`](http://player.animatron.com/latest/player.min.js)
* If you plan to program animation in an easy way, include [`builder.min.js`](http://player.animatron.com/latest/builder.min.js) next to them.
* If you want to import animations from Animatron tool, include [`import/animatron-importer.min.js`](http://player.animatron.com/latest/import/animatron-importer.min.js) then. The same for other importers.
* If you want to use some hardcore module, i.e. collisions module, include [`module/collisions.min.js`](http://player.animatron.com/latest/module/collisions.min.js) __before__ the builder file (builder will add some features to itself depending on enabled modules, it is wrong, but will be fixed in later versions), if it is used, or just in any place after player file, if it is not. The same for other modules.

URLs scheme for all of them is:

    http://player.animatron.com(/<version>|/latest)[(/bundle|/vendor|/engine|/import|/module)]/<file>[.min].js

* `(/<version>|/latest)` — required; a version of the player you want to get files from (e.g. `v0.9`), or the latest version
* `[(/engine|/bundle|/vendor|/import|/module)]` — optional; bundles are located in `/bundle` folder, `/vendor` folder is for external files required for player, `/engine` for engines (like DOM-engine), is `/import` is for importers, `/module` is for modules; `/bundle` files are supposed to be added before any other files, if you need them separately and they are not included in the bundle themselves. `/vendor` files should appear before player files (`player.js`, `builder.js`, ...); `/import` and `/module` files should appear after player files (`player.js`, `builder.js`, ...).
* `[.min]` — optional; specify if you want to get minimized (and gzipped) version of a file.

JFYI

* `http://player.animatron.com/VERSIONS` file contains the list of all versions.
* `http://player.animatron.com(/<version>|/latest)/BUILD` file contains the build number and date when this version was built (only for recent versions).

#### Locally

You may clone `git@github.com:Animatron/player.git` to get your own copy of all of the files.

To use JS player in current state, you may download separately or duplicate from the cloned repository and then add these files in specified order:

 * [Optional] `src/vendor/json2.js` (JSON parser, if target broswer not supports it (currently required only for Animatron Import))
 * `src/vendor/matrix.js`
 * `src/engine/dom-engine.js`
 * `src/anm.js`
 * `src/player.js`
 * [Optional] `src/builder.js` (allows to build animations in a functional way)
 * [Optional] `src/import/animatron_importer.js` (allows to load animations from Animatron tool)
 * [Optional] `src/module/collisions.js` (if you plan to test collisions / point-contains / intersections with your shapes)
 * [Optional] `src/module/*.js` (currently other modules are extending player only for usage with Animatron-importer)

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

To build locally, you'll only need to have [`jake`](https://github.com/mde/jake) intalled. Optionally, if you want to get minified sources, please install [`uglify-js` >= 2](https://github.com/mishoo/UglifyJS2) in addition.

Warning: Build system currently uses `cat`, `mv` and some other commands from UNIX shell, so it will need some UNIX-friendly environment to build correctly. However, node.js for MS Windows currently provides an integrated console that supports stuff like that, so probably it will work ok even without installing MinGW or Cygwin.

Then, you'll just need to run:

    jake
    # or, the same
    jake dist

And you have all the required files in proper structure inside the `./dist` sub-directory. (Actually, it just prepares bundles and copies only the sources used in distribution).

You also may want to run `dist-and-min` to tell `jake` to additionally generate and put minified files (what is UglifyJS for) in the very same `dist` directory, among with prepared source maps:

    jake dist-min

The latter task generates all the files which required for distribution. Actually, it should read "dist __and__ min", but `dist-n-min` looks harder to type.

If you want to generate [docco](http://jashkenas.github.com/docco/) (install it first) docs, run:

    jake docs

If you want check if tests are failing in CLI, use (you'll need [`phantomjs`](http://phantomjs.org/) installed for that):

    jake test

Or, to check just a specific part of tests (see `./tests/spec/spec-list.js` for a list of all specs), use:

    jake test[01.player/*]
    jake test[02.animations/01.guids]

Here's the contents of the `jake -T` call, which describes each existing task:

    jake default               # Get full distribution in the /dist directory.
                               # Exactly the same as calling {jake dist}.
                               # Requires: `uglifyjs`.
                               # Produces: /dist directory.

    jake clean                 # Clean previous build artifacts.

    jake build                 # Build process (with no prior cleaning).
                               # Called by <dist>.
                               # Depends on: <_prepare>, <_organize>, <_build-file>.
                               # Requires: `uglifyjs`.
                               # Produces: /dist directory.

    jake build-min             # Build process (with no prior cleaning).
                               # Called by <dist-min>.
                               # Depends on: <_prepare>, <_bundles>, <_organize>, <_
                               #     versionize>, <_minify>, <_build-file>.
                               # Requires: `uglifyjs`.
                               # Produces: /dist directory.

    jake dist                  # Clean previous build and create distribution files,
                               #     so `dist` directory will contain the full dist
                               #     ribution for this version, including all requir
                               #     ed files — sources and bundles.
                               # Coherently calls <clean> and <build>.
                               # Requires: `uglifyjs`.
                               # Produces: /dist directory.

    jake dist-min              # Clean previous build and create distribution files,
                               #     so `dist` directory will contain the full dist
                               #     ribution for this version, including all requir
                               #     ed files — sources and bundles.
                               # Coherently calls <clean> and <build>.
                               # Requires: `uglifyjs`.
                               # Produces: /dist directory.

    jake test                  # Run tests for the sources (not the distribution).
                               # Usage: Among with {jake test} may be called with pr
                               #     oviding separate spec or spec group, in a way l
                               #     ike: {jake test[01.player/*]} or, for concrete
                               #     spec: {jake test[01.player/06.errors]}.
                               # Requires: `jasmine-node`, `phantomjs`.

    jake docs                  # Generate Docco docs and compile API documentation i
                               #     nto HTML files inside of the /doc directory.
                               # Requires: `docco`, Python installed, `markdown` mod
                               #     ule for Python(and Python is used only because
                               #     of this module).
                               # Produces: /doc/player.html, /doc/builder.html, /doc
                               #     /API.html, /doc/README.html, /doc/scripting.htm
                               #     l, /doc/docco.css.

    jake anm-scene-valid       # Validate Animatron scene JSON file.
                               # Uses /src/import/animatron-project-VERSION.orderly
                               #     as validation scheme.
                               # Usage: should be called with providing scene JSON f
                               #     ile, in a way like: {jake anm-scene-valid[src/s
                               #     ome-scene.json]}.
                               # Requires: `orderly` and `jsonschema` node.js module
                               #     s

    jake version               # Get current version or apply a new version to the c
                               #     urrent state of files. If applies a new version
                               #     , modifies VERSION and VERSIONS files, then als
                               #     o adds a git tag, while pushes nothing. Uses VE
                               #     RSION_LOG file to provide annotation for a new
                               #     tag.
                               # Usage: {jake version} to get current version and {j
                               #     ake version[v0.8]} to set current version to a
                               #     new one (do not forget to push tags). If this v
                               #     ersion exists, you will get detailed informatio
                               #     n about it. To remove a previous version, use <
                               #     rm-version> task. Use {jake version[+v0.8]} to
                               #     force creating a version even if it exists.
                               # Affects: (if creates a new version) VERSION, VERSIO
                               #     NS files and a git tag.

    jake rm-version            # Remove given version information from versions data
                               #     files among with the git tag. Pushes nothing.
                               # Usage: {jake version[v0.9:v0.8]} to remove version
                               #     0.9 and then set current (and latest) version t
                               #     o 0.8, {jake rm-version[v0.9:]} to remove given
                               #     version, but to stay at the current one. (Do n
                               #     ot forget to push tags.) To add a new version,
                               #     use <version> task.
                               # Affects: (if removes a version) VERSION, VERSIONS f
                               #     iles and removes a git tag.

    jake push-version          # Builds and pushes current state, among with VERSION
                               #     S file to S3 at the path of `<VERSION>/` or `la
                               #     test/`. No git switching to tag or anything sma
                               #     rter than just build and push to directory. To
                               #     assign a version to a `HEAD` use {jake version[
                               #     <version>]}, then you are safe to push.
                               # Usage: {jake push-version} to push current version
                               #     from VERSION file. To push to `latest/`, use {j
                               #     ake push-version[latest]}. It is also possible
                               #     to select a bucket: so {jake push-version[lates
                               #     t,rls]} will push latest version to the release
                               #     bucket (`dev` is default) and {jake push-versi
                               #     on[,rls]} will push there a current version fro
                               #     m VERSION file.
                               # Affects: Only changes S3, no touch to VERSION or VE
                               #     RSIONS or git stuff.
                               # Requires: `.s3` file with crendetials in form {user
                               #     access-id secret}. `aws2js` and `walk` node.js
                               #     modules.

    jake push-go               # Pushes `go` page and `publish.js` script to the S3.
                               # Usage: {jake push-go} to push to `dev` bucket. To p
                               #     ush to another bucket, pass it as a param: {jak
                               #     e push-go[rls]}
                               # Affects: Only changes S3.
                               # Requires: `.s3` file with crendetials in form {user
                               #     access-id secret}. `aws2js` node.js module.

    jake _prepare              # Internal. Create dist folder
    jake _bundles              # Internal. Create bundles from existing sources and
                               #     put them into dist/bundle folder
    jake _bundle               # Internal. Create a single bundle file and put it in
                               #     to dist/bundle folder, bundle is provided as a
                               #     parameter, e.g.: {jake _bundle[animatron]}
    jake _organize             # Internal. Copy source files to dist folder
    jake _versionize           # Internal. Inject version in all dist files
    jake _minify               # Internal. Create a minified copy of all the sources
                               #     and bundles from dist folder and append a .min
                               #     suffix to them
    jake _build-file           # Internal. Create a BUILD file informing about the t
                               #     ime and commit of a build.

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
