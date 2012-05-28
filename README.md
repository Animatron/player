### JS Player for Animatron project (not yet released)

Licensed under MIT License, see `LICENSE` file.

See [API.md](https://github.com/Animatron/player/blob/master/API.md) for description on current API state (be aware, it may appear not updated to the _real_ current state).

**NB:** Development is in process. See [JS Player Pivotal Tracker page](https://www.pivotaltracker.com/projects/561405) to see what happens in project when you read this.

Run `examples/demo.html` to see it in action.

Run `sandbox/sandbox.html` to try it yourself.

To use JS player in current state, download or copy from the cloned repository:

 * `vendor/matrix.js`
 * `player.js`
 * [Optional] `builder.js` (allows to build animations in a functional way)
 * [Optional] `animatron_import.js` (allows to load animations from Animatron tool)
 * [Optional] `json2.js` (JSON parser, if target broswer not supports it (currently required only for Animatron Import)) 
   
And add them in the same order to your page header. Don't forget the `LICENSE` :).

(c) 2011-2012 by Animatron.