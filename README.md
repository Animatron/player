### JS Player for Animatron project (not yet released)

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

(c) 2011-2013 by Animatron.