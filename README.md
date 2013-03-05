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

The player files are accessible from the Amazon S3 Cloud in different bundles, each is just one file, so you may choose what to take:

* Standard Bundle (player only) is located at
* Animatron Bundle (player + animatron improrter) is located at
* Develop Bundle (player + builder) is located at
* Hardcore Develop Bundle (player + builder + player additional modules, like collisions) is located at

Include one of them as a script to your page, and you're done!

Also, all files are accessible separately, if you want:

*
*
*
*

#### Locally

Clone `git@github.com:Animatron/player.git` to get your own copy.

To use JS player in current state, download or copy from the cloned repository:

 * `vendor/matrix.js`
 * `anm.player.js`
 * [Optional] `anm.collisions.js` (if you plan to test collisions / point-contains / intersections with your shapes)
 * [Optional] `anm.builder.js` (allows to build animations in a functional way)
 * [Optional] `animatron_import.js` (allows to load animations from Animatron tool)
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

    jake test 01.player/*
    jake test 02.animations/01.guids

If you want to
(c) 2011-2013 by Animatron.