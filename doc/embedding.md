There are two ways to embed any animation, made in Animatron, into your Webpage, and both are very easy, and configurable far more than Publish (a.k.a. Share) dialog restricts you:

* using `IFRAME`, which includes another tiny webpage with a Player, into yours;
* using `div` (or any container) tag, which requires you at least (and just) to include an additional script in a page, but it's easier to control Player style with CSS this way and, if you really want, to use JavaScript code for overriding/tuning-up any part of a rendering process. For the easiest version, you just need two HTML tags and an URL of JSON snapshot to make it work, no even a line of JavaScript;

<!-- Using both ways you may configure your Player with a wide number of options. Dozen of them is accessible for `IFRAME` as well as for `div` tag or an URL inside `IFRAME`, or for JavaScript object passed to this Player, they just differ in the naming. -->

# Contents

* [IFRAME][iframe]
* [Container Tag][container]
    * [Auto-Initialization][auto-init]
    * [Initialization from Code][from-code]
        * [Custom, with `createPlayer`][create-player]
        * [Snapshot, with `forSnapshot`][for-snapshot]
        * [CSS Styling][css-styling]
* [Complete List of Preferences][params-list]

# IFRAME

`IFRAME` code is suggested to you in a Publish (a.k.a. Share) Dialog in Animatron Editor.

Commonly it looks like this:

```html
<iframe src="http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96?w=550&h=450" width="550" height="450" frameborder="0"></iframe>
```

Where `http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96` is the URL of your clip, and `?w=550&h=450` part is `w` (_width_) and `h` (_height_) parameters specified.

Player may be configured both with passing additional parameters with this URL (their names are commonly short-named) or with adding corresponding HTML attributes to the `IFRAME` tag (their names start with `anm-` prefix). Below is the example on how to enable auto-play when Player was completely initialized and to disable _Play_ button, both ways:

With URL parameters:

```html
<iframe src="http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96?w=550&h=450&auto=1&controls=0" width="550" height="450" frameborder="0"></iframe>
```

With `IFRAME` attributes:

```html
<iframe src="http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96" anm-width="550" anm-height="450" anm-auto-play="true" anm-controls="false" anm-auto-frameborder="0"></iframe>
```

See a complete list with an every possible option to configure a Player just [in the end of this document][params-list].

# Container Tag (i.e. `div`)

The second way to play an animation at your page is to use a container element. It gives you even more freedom in configuration<!--, but so requires some programming experience-->.

First, you need to add the latest Player source to your page, in the `<head>` section, and to add a target `div` tag where Player will be projected anywhere in the `<body>` section of your page:

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

If you need another version of a Player, just specify it by replacing the `latest` with, say, `v1.3`.

## The Magic of Auto-Initialization

To load some known Animatron snapshot in a Player, you need to know its URL and both width and height of an Animation. These are quite easy to find, though.

URL of a JSON. When you publish (share) your scene from Animatron, you get a URL like `http://clips.animatron.com/...`, a page which you can share with friends. If you add `.json` in the end of this URL, you have a JSON snapshot, like: ...

If you have your own JSON hosted somewhere, you are free to pass its URL instead!

Width and height of your Animation are specified by you in a project in Animatron Editor, or you may find them in `IFRAME` URL, as described above.

Now you are ready to do magic:

```html
<div id="player-target" anm-src="http://example.com/animation.json" anm-width="100" anm-height="200" anm-importer="animatron" /></div>
```

That's it! Your animation should load from a start and be able to be played. If you need to precisely configure its appearance or logic, [see below][params-list] for a complete list of HTML arguments a Player may understand ("`div`" column), there's truly a lot ways to change things. For example, auto-playing your animation and disabling a _Play_ button will work like this:

```html
<div id="player-target" anm-src="http://example.com/animation.json" anm-width="100" anm-height="200" anm-importer="animatron" anm-auto-play="true" anm-controls="false" /></div>
```

## Initialization from Code

If you have no snapshot URL, or you want to access a Player with JavaScript code, there are also few options:

First, ensure to include Player source in the `<head>` of your page:

```html
<script src="http://player.animatron.com/latest/bundle/animatron.min.js"></script>
```

Second, add a target tag to a `<body>` of your page.

```html
<div id="player-target" anm-width="320" anm-height="450"></div>
```

### Custom scene with `createPlayer`

Third, in case you _have no_ snapshot URL, you may still load any animation in any format, if you have a special "importer". Or, you may even create an animation just in place using Player API, but it's a different story.

```js
var player = anm.createPlayer('player-target');
var anim = /* some code or JSON */;
var importer = /* if it's a JSON, create an importer which can parse this JSON */;
player.load(anim/*, importer*/);
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

You may add a callback to call when snapshot will be received and also configure a Player, either with URL parameters or JavaScript object:

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

If you plan to operate with player after the scene was received, please do not forget to do it in a callback, not just after this line of code, since in this case loading process is asynchronous and finishes much later than the moment `forSnaphot` will be executed.

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

So you may override any CSS for the player you wish, using these classes. Also, for the wrapper gets an additional class when Player state changes:

* `anm-state-nothing`, when Player has nothing to play, just initialized;
* `anm-state-stopped`, when Player is stopped;
* `anm-state-playing`, when Player is playing some animation;
* `anm-state-paused`, when Player is paused;
* `anm-state-loading`, when Player is loading an animation;
* `anm-state-error`, when some error happened, so it's not muted and shown by Player

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
`t`/`from` | - | - | `0` | a time to start playing from (multiplier is 100ms, so `31` means _3s 10ms_)
`p`/`at` | - | - | - | a time of animation where to pause at, when Player was initialized (multiplier is 100ms, so `31` means _3s 10ms_)
- | _`div`-only:_ `anm-src` | - | - | JSON for the animation  to load from
`m`/`mode` | `anm-mode` | `mode` | - | (_deprecated_) a mode of a Player, one of: ...
`lm`/`lmode` | `anm-loading-mode` | `loadingMode` | `onplay` | `onplay` means to start loading an animation when user clicks _Play_ button (and show _thumbnail_ before), `onrequest` means to start loading animation only when the script asked for it and expect it to be completely loaded when user clicks _Play_ button
- | `anm-events` | `handleEvents` | `false` | allows animation to catch and process user mouse/keyboard events by itself (has a meaning for games or infographics)
- | `anm-debug` | `debug` | `false` | show debug information like FPS and paths/bounds of objects
`bg`/`bgcolor` | `anm-bg-color` | `bgColor` | `transparent` | set background color of an animation (if it is set, it can't be overriden), format is `#00ff00`
`rc`/`ribcolor`/`ribbons` | `anm-rib-color` | `ribbonsColor` | `#000000` | color of a stripes which appear when aspect ratio of an animation doesn't fit a Player size
`th`/`thumb` | `anm-thumbnail` | `thumbnail` | - | URL of an animation thumbnail (still image) to be shown while animation loads
- | `anm-draw-still` | `drawStill` | `true` | show an animation freezed frame or a thumbnail (if its source is set) while animation wasn't started or in process of loading
- | `anm-images` | `imagesEnabled` | `true` | enable all remote images used in animation (if they are disabled, special mark will be shown)
`s`/`audio` | `anm-audio` | `audioEnabled` | `true` | enable all sounds used in animation (if disabled, they even will not load)
- | `anm-shadows` | `shadowsEnabled` | `true` | enable shadows in animation (they often consume CPU)
- | `anm-scene-size` | `forceSceneSize` | `false` | always override user-specified Player size with a size of a scene, so when scene loaded, Player will resize itself, if sizes don't match
`me`/`errors` | `anm-mute-errors` | `muteErrors` | `false` | do not stop playing if some errors were fired during the playing process, just log them

[iframe]: #IFRAME
[container]: #Container-tag-i-e-div
[auto-init]: #
[from-code]: #
[params-list]: #Complete-Configuration-List
[css-styling]: #CSS-Styling
[create-player]: #
[for-snapshot]: #
