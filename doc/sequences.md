## Presenting your animations one by one using Animatron with its Player

If you'd like to attract users with carouseling the sequences of different animations, Animatron Player is capable of that, and it's easy.

First, you need to create these animations in the [Animatron Editor](http://editor.animatron.com) and publish their final variants you want to use.

When you publish some animation, you create a _snapshot_ of it. _Snapshot_ is a saved state of animation, so when you edit your project, no new changes are  reflected in a snapshot, of course until you create create a new one.

When you publish some animation, you get an URL of a snapshot in response. When you open this URL in a browser, you see the last state of a project, exactly the way it looked before you pressed a Publish button. This URL looks like:

`http://clips.animatron.com/dc7d7b1e946fa43c53d012a22f3045e4`

I've created three simple animations with shapes moving from left to right to show you what should be done step-by-step:

(If you feel yourself self-confident, you may just take a look at the [final result](http://codepen.io/shamansir/pen/EammQd), though;)

* Square: [Animatron Project](https://editor.animatron.com/#p=d990bd5454f43c927175a111), [Playable Snapshot](http://clips.animatron.com/3a612e05fdb534e68c759af5e28cca99)
* Circle: [Animatron Project](https://editor.animatron.com/#p=e793bd547fa7a8bf98c2554b), [Playable Snapshot](http://clips.animatron.com/f33e5f0bcdb6a6a7a50e0759a7fb7e17)
* Chick: [Animatron Project](https://editor.animatron.com/#p=0c95bd5414ac319aa10677be), [Playable Snapshot](http://clips.animatron.com/dc7d7b1e946fa43c53d012a22f3045e4)

Every "Playable Snapshot" link from a list above looks like `http://clips.animatron.com/dc7d7b1e946fa43c53d012a22f3045e4`, the difference is only in the ID of a snapshot. If you add `.json` to this URL, i.e. `http://clips.animatron.com/dc7d7b1e946fa43c53d012a22f3045e4.json`, you'll get the snapshot in a "raw" format, which Player understands. For the projects above the corresponding URLs are:

* Square: `http://clips.animatron.com/3a612e05fdb534e68c759af5e28cca99.json`
* Circle: `http://clips.animatron.com/f33e5f0bcdb6a6a7a50e0759a7fb7e17.json`
* Chick: `http://clips.animatron.com/dc7d7b1e946fa43c53d012a22f3045e4.json`

It's time to add everything in a page now.

Add Player javascript in a `<head>` of your page:

```html
<script src="http://player.animatron.com/latest/bundle/animatron.min.js" type="text/javascript"></script>
```

Create a target to place a Player inside, in a `<body>`:

```html
<div id="player-target"></div>
```

Add the URLs of snapshots you plan to use in an array (so yes, it can be extended):

```javascript
var snapshots = [
'http://clips.animatron.com/3a612e05fdb534e68c759af5e28cca99.json',
'http://clips.animatron.com/f33e5f0bcdb6a6a7a50e0759a7fb7e17.json',
'http://clips.animatron.com/dc7d7b1e946fa43c53d012a22f3045e4.json'
];
```

And, next to that, add this code:

```javascript
// configures Player to show itself transparent when nothing loaded inside,
// see notice below for the reasoning
anm.Player.EMPTY_BG = 'transparent';
anm.Player.EMPTY_STROKE = 'transparent';
anm.Player.EMPTY_STROKE_WIDTH = 0;

// importer understands the format of animations which lie under given URLs
var animatronImporter = anm.importers.create('animatron');
var player = new anm.Player();

// this function helps to cycle the snapshots
var currentSnapshot = 0;
function loadNextSnapshot() {
    if (!projects[currentProject]) return;
    player.stop(); // ensure Player is stopped
    // load next snapshot
    player.load(projects[currentProject], animatronImporter);
    currentProject++;
};

// initialize the player with custom options
player.init('player-target', {
    width: 200, // any width you like
    height: 164, // any height you like
    autoPlay: true,
    drawStill: false, // NB: see notice below
    ribbonsColor: 'transparent', // NB: see notice below
    controlsEnabled: false });
// load first snapshot into Player and plays it
loadNextSnapshot();
// on every complete-playing event (different to 'stop' event),
// try to load next snapshot and play it
player.on('complete', loadNextSnapshot);
```

Here you go, you'll see your projects play one by one. Once more, here you may
find a [final result](http://codepen.io/shamansir/pen/EammQd).

### Important Notice

Depending on your connection and a page design, you may or may not notice a flashing screen, appearing
just between your scenes. And it actually exists there. It appears by the reason: when player finishes playing previous
snapshot, it starts loading the next one, and it takes a tangible amount of time to load it from remote resource.
So there is a pause between these snapshots. If you don't like the way it matches your design, you are free to configure
`EMPTY_BG` and `EMPTY_STROKE` values in the code the way you want, same as `ribbonsColor` Player option.

To resolve flash-issues completely, you may include snapshots in JSON format directly into your page,
it will change nothing but the `snapshots` array, it will look like this:

```javascript
var snapshots = [
{ /* JSON of a first snapshot */ },
{ /* JSON of a second snapshot */ },
{ /* JSON of a third snapshot */ }
];
```

Since now the loading will be synchronous, you can not call load immediately from `complete` handler,
you need to postpone it a bit, change `loadNextScene` to:

```javascript
var currentProject = 0;
function loadNextSnapshot() {
    if (!projects[currentProject]) return;
    player.stop();
    setTimeout(function() {
        player.load(projects[currentProject], animatronImporter);
        currentProject++;
    }, 1);
}
```

The [final version](http://codepen.io/shamansir/pen/wBddOd).

This will guarantee a non-noticeable switch between your scenes, but on the other hand will make your page
"heavier" to load at start.
