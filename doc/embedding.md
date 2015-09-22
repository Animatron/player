[ [A version of this page with a highlighted source code][permanent] ]

There are two ways to embed an animation made in Animatron into a webpage. Both are very easy and enable you to configure more options than the Publish (a.k.a. Share) dialog currently allows:

* using `IFRAME`, which embeds another a tiny webpage that contains the Animatron Player into your page.
* using the `div` (or any container) tag, which requires you to include an additional script in the page. It's easier to control the Player's style with CSS this way and, if you really want, to use JavaScript code for overriding/tuning-up any part of the rendering process. For the easiest version, you just need two HTML tags and a URL of a JSON snapshot to make it work, and not even a line of Javascript.

<!-- Using both ways together, you may configure your Player with a wide number of options. Dozens of them are accessible for `IFRAME` as well as for the `div` tag or a URL inside `IFRAME,` as well as for a JavaScript object passed to this Player - they just differ in names. -->

# Contents

* [IFRAME][iframe]
* [Container Tag][container]
    * [Auto-Initialization from HTML][auto-init]
    * [Initialization from JS Code][from-code]
        * [Custom, with `createPlayer`][create-player]
        * [Snapshot, with `forSnapshot`][for-snapshot]
    * [CSS Styling][css-styling]
    * [Adding events][adding-events]
* [Complete List of Preferences][params-list]

# IFRAME

`IFRAME` code is obtained from the Publish (a.k.a. Share) Dialog in the Animatron Editor.

Commonly it looks like this:

```html
<iframe src="http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96?w=550&h=450" width="550" height="450" frameborder="0"></iframe>
```

`http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96` is the URL of your clip, and the `?w=550&h=450` part is the `w` (_width_) and `h` (_height_) parameters specified.

The Player may be configured both by passing additional parameters with this URL (they are commonly nicknamed) or by adding corresponding HTML attributes to the `IFRAME` tag (their names start with `anm-` prefix). Below is an example of how to enable auto-play when the Player is completely initialized and how to disable the _Play_ button both ways:

With URL parameters:

```html
<iframe src="http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96?w=550&h=450&auto=1&controls=0" width="550" height="450" frameborder="0"></iframe>
```

With `IFRAME` attributes:

```html
<iframe src="http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96" anm-width="550" anm-height="450" anm-auto-play="true" anm-controls="false" anm-auto-frameborder="0"></iframe>
```

See a complete list of every possible option to configure the Player [at the end of this document][params-list].

# Container Tag (i.e. `div`)

The second way to play an animation on your page is to use a container element. It gives you even more freedom in configuration<!--, but requires some programming experience-->.

First, you need to add the latest Player source to your page in the `<head>` section. You'll also have to add a target `div` tag where the Player will be displayed anywhere in the `<body>` section of your page:

```html
<!DOCTYPE>
<html>
    <head>
        . . .
        <!-- PLAYER SOURCE: --> <script src="http://player.animatron.com/latest/bundle/animatron.min.js"></script>
        . . .
    </head>
    <body>
        . . .
        <!-- PLAYER TARGET: -->  <div id="player-target"></div>
        . . .
    </body>
</html>
```

If you need a specific version of the Player, just specify it by replacing the `latest` with, say, `v1.3`.

## The Magic of Auto-Initialization

To load a known Animatron snapshot in the Player, you need to know its URL as well as the width and height of the Animation. No worries - these are quite easy to find.

URL of a JSON: When you publish (share) your scene from Animatron, you get a URL like `http://clips.animatron.com/...`, a page which you can share with others by sending its URL. If you add `.json` at the end of this URL, you have a JSON snapshot, like: `http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96.json`.

If you have your own JSON hosted somewhere, you are free to pass its URL instead!

The width and height of your animation are originally specified by you in the project in the Animatron Editor, or you may find them in `IFRAME` URL, as described above.

First, ensure to include Player source in the `<head>` of your page:

```html
<script src="http://player.animatron.com/latest/bundle/animatron.min.js"></script>
```

Now you are ready to do magic:

```html
<div id="player-target" anm-player-target anm-src="http://example.com/animation.json" anm-width="100" anm-height="200" anm-importer="animatron" /></div>
```

Please pay proper attention to include `anm-player-target` attribute, since it works as a marker for the Player code to search for in a page, and without it, auto-initialization will not work at all.

That's it! Your animation should load from the start and be able to be played. If you need to precisely configure its appearance or logic, [see below][params-list] for a complete list of HTML arguments the Player will understand ("`div`" column), there's truly a lot ways to change things. For example, auto-playing your animation and disabling the _Play_ button will work like this:

```html
<div id="player-target" anm-player-target anm-src="http://example.com/animation.json" anm-width="100" anm-height="200" anm-importer="animatron" anm-auto-play="true" anm-controls="false" /></div>
```

## Initialization from Code

If you have no snapshot URL, or you want to access the Player with JavaScript code, there are also few options:

First, same as in option above, ensure to include Player source in the `<head>` of your page:

```html
<script src="http://player.animatron.com/latest/bundle/animatron.min.js"></script>
```

Second, add a target tag to the `<body>` of your page.

```html
<div id="player-target" anm-width="320" anm-height="450"></div>
```

### Custom scene with `createPlayer`

Thirdly, if you _don't have_ a snapshot URL, you may still load any animation in any format if you have a special _importer_. Or, you may even create an animation just in place using Player API, but it's a different story.

```js
var player = anm.createPlayer('player-target');
var animation = /* some code or JSON */;
var importer = /* if it's a JSON, create an importer which can parse this JSON, e.g. use `anm.importers.create('animatron')` */;
player.load(animation/*, importer*/);
player.play();
```

You may pass options to `createPlayer` function, like this:

```js
var player = anm.createPlayer('player-target', {
        autoPlay: true,
        controlsEnabled: false
    });
. . .
```

See a [complete list][params-list] of them below.

### Snapshot with `forSnapshot`

In case you _have_ a snapshot URL, you may load it this way:

```js
var player = anm.Player.forSnapshot(
        'player-target', /* target tag ID */
        'http://clips.animatron.com/....json', /* snapshot URL */
        anm.importers.create('animatron') /* importer which can parse
           the given scene, in our case it is included in the bundle and
           named 'animatron'; its instance may be re-used */
);
```

You may add a callback to call when the snapshot will be received and also configure the Player, either with URL parameters or JavaScript object:

```js
var player = anm.Player.forSnapshot(
        'player-target', /* target tag ID */
        'http://clips.animatron.com/....json', /* snapshot URL */
        anm.importers.create('animatron'), /* importer which can parse
           the given scene, in our case it is included in the bundle and
           named 'animatron'; its instance may be re-used */
        function(scene) { }, /* callback */
        /* options, you may specify them here, in a tag as HTML attributes,
           or as snapshot URL parameters, see below */
        { autoPlay: true,
          controlsEnabled: false });
```

There are just the basic options you may find here, see a [complete list][params-list] of them below.

If you plan to operate with the player after the scene was received, please do not forget to do it in a callback, not just after this line of code, since in this case loading process is asynchronous and finishes much later than the moment `forSnaphot` will be executed.

## CSS Styling

If your target `div` looks like this:

```html
<div id="my-target"></div>
```

It will be replaced with a structure like this:

```html
<div id="my-target" class="anm-wrapper anm-wrapper-my-target">
    <canvas class="anm-player anm-player-my-target"></canvas>
    <!-- If controls are enabled -->
    <canvas class="anm-controls anm-controls-my-target"></canvas>
</div>
```

You may override any CSS for the player you wish using these classes. Also, the wrapper gets an additional class when the Player state changes:

* `anm-state-nothing`, when Player has nothing to play, just initialized;
* `anm-state-stopped`, when Player is stopped;
* `anm-state-playing`, when Player is playing some animation;
* `anm-state-paused`, when Player is paused;
* `anm-state-loading`, when Player is loading an animation;
* `anm-state-error`, when some error happened, so it's not muted and shown by Player

## Adding Events

Same as above, when your target container looks like this:

```html
<div id="my-target"></div>
```

Then you have all the power to control it with JS, same way as with any other DOM element. For example you may run playing process on click:

```js
var player = anm.createPlayer('my-target', { autoPlay: false,
                                             controlsEnabled: false });
var animation = /* some Animatron-compatible JSON */;
var importer = anm.importers.create('animatron');
player.load(animation, importer);

var my_target = document.getElementById('my-target');
my_target.addEventListenet('click', function() {
    player.play();
});
```

Of course, this solution also works if you use `forSnaphot` approach, just copy player options and the last block of code from the above example.

In the nearest future, the new Player API and its documentation both will be published to the world, so you will be able to do a very complex and powerful things, if you'd ever want to. Please, stay tuned.

# Complete Configuration List

_Note:_ all boolean values both in tag attributes and as URL parameters are allowed to be _nothing_ / `false` / `0` / `off` / `no` to mean _false_, and `true` / `1` / `on` / `yes` to mean _true_.

URL | `IFRAME`/`div` | JS Object | Default | Description
----|----------------|-----------|---------|------------
`w`/`width` | `anm-width`    | `width`   | animation width | width of a rectangle to fit animation into
`h`/`height` | `anm-height`   | `height`  | animation height | height of a rectangle to fit animation into
`c`/`controls` | `anm-controls` | `controlsEnabled` | `true` | show Play button and playing progress or not, Player HUD
`info` | `anm-info` | `infoEnabled` | `true` | (_deprecated_) show animation author and animation name
`a`/`auto` | `anm-auto-play` | `autoPlay` | `false` | start playing animation just when Player was initialized
`r`/`repeat` | `anm-repeat` | `repeat` | `false` | `true` to play animation infinitely (loop)
`i`/`inf` | `anm-infinite` | `infiniteDuration` | `false` | keep playing animation even when it finished (do not repeat, but stay at last frame, if there are no inner loops)
`v`/`speed` | `anm-speed` | `speed` | `1` | playing speed
`z`/`zoom` | `anm-zoom` | `zoom` | `1` | animation zoom
`t`/`from` | `anm-start-from` | - | `0` | a time to start playing from (multiplier is 10ms, so `310` means _3s 100ms_)
`p`/`at` | `anm-stop-at` | - | - | a time of animation where to stop at, when Player was initialized (multiplier is 10ms, so `310` means _3s 100ms_)
- | _`div`-only:_ `anm-src` | - | - | JSON for the animation to load from
- | _`div`-only:_ `anm-importer` | - | `animatron` | Importer to use with this JSON
`m`/`mode` | `anm-mode` | `mode` | - | (_deprecated_) a mode of a Player, one of: ...
`lm`/`lmode` | `anm-loading-mode` | `loadingMode` | `rightaway` | see [section below][lmodes-pmodes]
`pm`/`pmode` | `anm-playing-mode` | `playingMode` | `onrequest` | see [section below][lmodes-pmodes]
- | `anm-events` | `handleEvents` | `false` | allows animation to catch and process user mouse/keyboard events by itself (has a meaning for games or infographics)
- | `anm-debug` | `debug` | `false` | show debug information like FPS and paths/bounds of objects
`bg`/`bgcolor` | `anm-bg-color` | `bgColor` | `transparent` | set background color of an animation (if it is set, it can't be overriden), format is `#00ff00`
`rc`/`ribcolor`/`ribbons` | `anm-rib-color` | `ribbonsColor` | `#000000` | color of a stripes which appear when aspect ratio of an animation doesn't fit a Player size
`th`/`thumb` | `anm-thumbnail` | `thumbnail` | - | URL of an animation thumbnail (still image) to be shown while animation loads
- | `anm-draw-still` | `drawStill` | `true` | show an animation's single frame or a thumbnail (if its source is set) while animation wasn't started or in process of loading
- | `anm-images` | `imagesEnabled` | `true` | enable all remote images used in animation (if they are disabled, special mark will be shown)
`s`/`audio` | `anm-audio` | `audioEnabled` | `true` | enable all sounds used in animation (if disabled, they even will not load)
- | `anm-video` | `videoEnabled` | `true` | enable all remote video files used in animation (if they are disabled, special mark will be shown)
- | `anm-shadows` | `shadowsEnabled` | `true` | enable shadows in animation (they often consume CPU)
- | `anm-scene-size` | `forceSceneSize` | `false` | always override user-specified Player size with a size of a scene, so when scene loaded, Player will resize itself, if sizes don't match
`me`/`errors` | `anm-mute-errors` | `muteErrors` | `false` | do not stop playing if some errors happened during the playing process, just log them

## Loading Modes and Playing Modes

Loading Mode | Playing Mode | `autoPlay` | HTML attr. | `forSnaphot`/manual load | Result
-------------|--------------|------------|------------|-----------|---
`rightaway` | `onrequest` | `false` | none | yes |
`rightaway` | `onrequest` | `true` | none | yes |
`rightaway` | `onrequest` | `false` | has | - |
`rightaway` | `onrequest` | `true` | has | - |
`onrequest` | `onrequest` | `false` | none | yes |
`onrequest` | `onrequest` | `true` | none | yes |
`onrequest` | `onrequest` | `false` | has | - |
`onrequest` | `onrequest` | `true` | has | - |
`onplay` | `onrequest` | `false` | none | yes |
`onplay` | `onrequest` | `true` | none | yes |
`onplay` | `onrequest` | `false` | has | - |
`onplay` | `onrequest` | `true` | has | - |
`rightaway` | `onhover` | any | has | - |
`rightaway` | `onhover` | any | none | yes |
`rightaway` | `wheninview` | any | has | - |
`rightaway` | `wheninview` | any | none | yes |
`onrequest` | `onhover` | any | has | - |
`onrequest` | `onhover` | any | none | yes |
`onrequest` | `wheninview` | any | has | - |
`onrequest` | `wheninview` | any | none | yes |
`onplay` | `onhover` | any | has | - |
`onplay` | `onhover` | any | none | yes |
`onplay` | `wheninview` | any | has | - |
`onplay` | `wheninview` | any | none | yes |

[permanent]: https://github.com/Animatron/player/blob/docs/doc/embedding.md

[iframe]: #iframe
[container]: #container-tag-ie-div
[auto-init]: #the-magic-of-auto-initialization
[from-code]: #initialization-from-code
[params-list]: #complete-configuration-list
[css-styling]: #css-styling
[adding-events]: #adding-events
[create-player]: #custom-scene-with-createplayer
[for-snapshot]: #snapshot-with-forsnapshot
[lmodes-pmodes]: #loading-modes-and-playing-modes
