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

## CSS Styling

# Full options List

URL | `IFRAME`/`div` | JS Object | Default | Description
----|----------------|-----------|---------|------------
`w` | `anm-width`    | `width`   | animation width | width of a rectangle to fit animation into
`h` | `anm-height`   | `height`  | animation height | height of a rectangle to fit animation into
`t` | ... | `playFrom` |
