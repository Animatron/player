### JS Player for Animatron project (not yet released, @VERSION)

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
* If you want to use collisions module, include [`module/collisions.js`](http://player.animatron.com/latest/module/collisions.js) in the end. The same for other modules.

URLs scheme for all of them is:

    http://player.animatron.com(/<version>|/latest)[/full][(/bundle|/vendor|/import|/module)]/<file>.js

* `(/<version>|/latest)` — required; a version of the player you want to get files from (e.g. `v0.9`), or the latest version
* `[/full]` — optional; specify if you want to gen not-minimized version
* `[(/bundle|/vendor|/import|/module)]` — optional; bundles are located in `/bundle` folder, `/vendor` folder is for external files required for player, `/import` is for importers, `/module` is for modules; `/bundle` files are supposed to be added before any other files, if you need them separately and they are not included in the bundle themselves. `/vendor` files should appear before player files (`player.js`, `builder.js`, ...); `/import` and `/module` files should appear after player files (`player.js`, `builder.js`, ...).

#### Locally

Clone `git@github.com:Animatron/player.git` to get your own copy.

To use JS player in current state, download or copy from the cloned repository:

 * `src/vendor/matrix.js`
 * `src/anm.player.js`
 * [Optional] `src/anm.builder.js` (allows to build animations in a functional way)
 * [Optional] `src/module/anm.collisions.js` (if you plan to test collisions / point-contains / intersections with your shapes)
 * [Optional] `src/import/animatron_import.js` (allows to load animations from Animatron tool)
 * [Optional] `json2.js` (JSON parser, if target broswer not supports it (currently required only for Animatron Import))

And add them in the same order to your page header. Don't forget the [`LICENSE`](https://github.com/Animatron/player/blob/master/LICENSE#files) :).

Run `sandbox/sandbox.html` to try it for yourself.

Run `examples/demo.html` to see it in action with some demos (they're not so good-looking for the moment).

Run one of the `tests/index.html` and run any of the tests to see if something is broken in your version of player.

If you'd want to run them from terminal instead of browser, you'll need to have PhantomJS installation and then start `run-tests.sh[ spec]`

#### Local Building

To build locally, you'll need to have both [`jake`](https://github.com/mde/jake) and [`uglify-js` >= 2](https://github.com/mishoo/UglifyJS2) installed.

Then, you'll just need to run:

    jake
    # or, the same
    jake clean dist

And you have all the variants of the files in `dist` folder.

If you want to generate [doccoo](http://jashkenas.github.com/docco/) (install it first) docs, run:

    jake docs

If you want check if tests are failing in CLI, use (you'll need [`phantomjs`](http://phantomjs.org/) installed for that):

    jake test

Or, to check just a specific part of tests (see `./tests/spec/spec-list.js` for a list of all specs), use:

    jake test[01.player/*]
    jake test[02.animations/01.guids]

##### Bundles

When you build player with jake, it also creates several bundles, they are:

1. __Standard__: just player merged with required vendor files — for quick uses of the player (when developer wants very lightweight version)
1. __Animatron__: vendor files + player + importer from Animatron — exactly this one will be used in embedded player and in the Animatron tool
1. __Develop__: vendor files + player + Builder that simplifies working with scenes in a way like JQuery simplifies working with DOM — it will work ok for developing some general (in terms of code complexity) games.
1. __Hardcore__: vendor files + player + Builder + additional modules (like collisions support) — intended to be used to write more complex games

(c) 2011-2013 by Animatron.