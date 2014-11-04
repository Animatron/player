There are two ways to embed any animation, made in Animatron, into your Webpage, and both are very easy, and configurable far more than Publish (a.k.a. Share) dialog restricts you:

* using `IFRAME`, which includes another tiny webpage with player into yours;
* using `div` (or any container) tag, which requires you at least to include an additional script in a page, but it's easier to control Player style with CSS this way and, if you really want, to use JavaScript for overriding/tuning-up any part of a rendering process.

<!-- Using both ways you may configure your Player with a wide number of options. Dozen of them is accessible for `IFRAME` as well as for `div` tag or an URL inside `IFRAME`, or for JavaScript object passed to this Player, they just differ in the naming. -->

# IFRAME

`IFRAME` code is suggested to you in a Publish (a.k.a. Share) Dialog in Animatron Editor.

Commonly it looks like this:

```
<iframe src="http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96?w=550&h=450" width="550" height="450" frameborder="0"></iframe>
```

Where `http://clips.animatron.com/e4082aaa25f43de52bdb952d38ec0b96?w=550&h=450` is the URL of your clip with both `w` (_width_) and `h` (_height_) parameters specified.

Player may be configured both with adding additional parameters to this URL (their names are short ones) or with adding corresponding HTML attributes to the `IFRAME` tag (their names start with `anm-` prefix):

* `w` or `anm-width`, `h` or `anm-height` — width and height of a rectangle to fit animation into (by default, it equals to an actual dimensions of an animation) — if aspect ratio doesn't match, margins are added to keep animation proportions.

<!-- TODO -->

...There are just the basic options you may find here, see a [complete list](#Parameter-List) of them below.

# `div`

The second way to play some scene on a page is to use a container element. It gives even more freedom in configuration<!--, but so requires some programming experience-->.

## The Magic of Auto-Initialization

<!-- TODO -->

## Configuration

<!-- TODO -->

...There are just the basic options you may find here, see a [complete list](#Parameter-List) of them below.

## CSS Styling

# Handling Events

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
