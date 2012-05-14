PLAYER API
==========

* [Intro](#intro)
* [Sandbox](#sandbox)
* [Embedding](#embedding)
  * [Embedding Player](#embedding-player)
  * [Player Options](#player-options)
  * [Playing API](#playing-api)
  * [Loading Scenes](#loading-scenes)  
* [Builder](#builder)
  * [Aliases](#aliases)
  * [Instantiation](#instantiation)
  * [Structures](#structures) 
  * [Shapes](#shapes)
  * [Fill &amp; Stroke](#fill--stroke)
  * [Static Modification](#static-modification)
  * [Bands](#bands)
  * [Constants](#constants)
  * [Tweens](#tweens)
  * [Easings](#easings)
  * [Repeat Modes](#repeat-modes)
  * [Modifiers &amp; Painters](#modifiers--painters)
  * [Time-Switch](#time-switch)
  * [Events](#events)
  * [Elements Interactions](#elements-interactions)
  * [Helpers](#helpers)
* [Scene](#scene)
  * [Manual Building](#manual-building)  
  * [Element Structure](#element-structure)
  * [The Flow](#the-flow)
  * [`Element` reference](#element-reference)
  * [`Path` reference](#path-reference)
  * [`Text` reference](#text-reference)
* [Importers](#importers)
  * [Animatron](#animatron)
  
Intro
-----

Here's the documentation on using Animatron Player to load external scenes and play them at your site. _And_ it's also about building your scenes manually, but in a very easy way (we're sure you haven't seen the easier one). _And_ here is also the reference on all of the player internals. The three in one. Let's start.

Sandbox
-------

To get the feel on how player works, you may want to play with it at [Sandbox](animatron.com/player/sandbox/sandbox.html) section. There are several examples you may observe in action there. If you want to create some animation on your own, please follow the [Builder](#builder) section, it is the general and the single class that gives you the real power over the moving scenes. 

You'll find a lot of checkboxes and radio buttons there, feel free to check and uncheck them. In fact, _Debug_ checkbox turns player in the mode where it shows additional info on current animation for developer (such as FPS, elements' names and their registration points), _Interactive/Non-Interactive_ button (it is not a checkbox, because an additional option may appear in future) enables/disables capturing mouse/keyboard events by canvas.

Emdedding
---------

### Embedding Player ###

You have an unbelievable option to include a player in your own page and to load there any animation you want. You may even [build your own scene](#builder) and show it at your site. This chapter is all you need to make this happen.

#### 1. Using IFRAME ####

The first option is just to embed the player with some external scene to your site. You may publish one from Animatron tool (when it will be launched) and get the embed code, it will look like this:

        <iframe src="http://.../embed?4f97dd3de4b0fd8159a8df75"></iframe>

(Customizing player style with embed code is planned)

#### 2. From Source ####

If you'd like to _customize_ things a bit more, or to have more control over the flow, or if you want to _import_ some custom scene in custom format (i.e. JSON), or if you plan to _build_ a scene on your own, you may want the second option: to include a player from the sourse.

##### 2a. #####

To do so, either clone [the repository](https://github.com/Animatron/player) or just download the  [`player.js`](https://raw.github.com/Animatron/player/master/player.js) and [`matrix.js`](https://raw.github.com/Animatron/player/master/vendor/matrix.js) <sub>(the last one is a super-tiny [proxy for transformation matrix](http://simonsarris.com/blog/471-a-transformation-class-for-canvas-to-keep-track-of-the-transformation-matrix), thanks to [Simon Sarris](http://simonsarris.com/))</sub> files in raw format. Now, include them in your HTML file:

    <!DOCTYPE html>
    <html>
            
      <head>
        <title>My Great Page</title>
     ➭  <script src="./matrix.js" type="text/javascript"></script>
     ➭  <script src="./player.js" type="text/javascript"></script>
     ➭  <!-- importer or scene files go here, if one required -->
     ➭  <script type="text/javascript">
     ➭     function startPlaying() {
     ➭       . . . // here goes loading/playing code
     ➭     } 
     ➭  </script>
       </head>
      
     ➭ <body onload="startPlaying();">
         <canvas id="my-canvas"></canvas>   
       </body>
      
    </html>
  
If you are importing scene in some custom format, do not forget to include the importer (see [below](#loading-scenes) on importing scenes).
  
Then, you have a `Player` object.

##### 2b. #####

Now you may easily create a player with either of two ways below, just provide us with correct id of the canvas to attach to, and ensure that it is accessible through DOM (use `body.onload`, for example, like in previous code sample): 

    var player = createPlayer('my-canvas')
    // or: var player = new anm.Player('my-canvas');

##### 2c. #####

And you may easily rule the flow by loading your own scene or importing one:

    var my_scene = ...
    player.load(my_scene).play();

(See [below](#loading-scenes) for more information on loading scenes, and see [Builder](#builder) and/or [Scene](#scene) sections for more information on scene internals)

You may create as many players as you want, just be sure to have enough of canvases for them.

### Player Options

You may pass options object to player, if you want to configure it accurately. 

#### mode ####

In fact, only `mode` option is required, if you ever decide to use options:

    //var C = anm.C;
    createPlayer('my_canvas', { 'mode': C.M_VIDEO });
    
Mode can be:

 * `C.M_VIDEO` — (default) fits for animations that do not interact with user, like movies; controls are shown, info block is shown, mouse/keybord events on shapes are not handled;
 * `C.M_PREVIEW` — fits for animations/movies with showing no controls/info; both controls and info block are disabled and _no_ mouse/keyboard events handled at all;
 * `C.M_DYNAMIC` — fits for games and interactive animations; both controls and info block are disabled and all mouse/keyboard events are handled on the objects expecting them;
 
There are a bit more variants for `mode` and you may mix them with single pipe (`|`), like here:

    createPlayer('my_canvas', { 'mode': C.M_CONTROLS_ENABLED | C.M_INFO_DISABLED | C.M_HANDLE_EVENTS });   
 
But they are intended for rare use and we hope you'll be fine with three predefined ones.

**NB**: `C.M_VIDEO`, `C.M_PREVIEW` and `C.M_DYNAMIC` are the precalculated mixes of these "precise" options.

#### debug ####

If you want to see the FPS rate, shapes origin points, names of the shapes, the traces of their translate operations, set `debug` to `true`. 

#### zoom ####

To zoom an animation besides the canvas size (normally all animations fit the canvas), you may use `zoom` option.

#### meta ####

`meta` block provides the information about the animation author, title and copyright. However, if you load the Scene with [Importer](#importers), it will be overriden from there (it also is useful if you associate one separate scene with one separate player).

#### cnvs ####

`cnvs` (shorten from 'canvas') is the tuning of the canvas size, player background color and the default duration of the scene (it also is useful if you associate one separate scene with one separate player).

#### Example ####

The complete options object, filled with default values, looks like this (again, all options except `mode` are optional):

    { "debug": false, // in debug mode, FPS, shapes names and moving paths are shown
      "mode": C.M_VIDEO, // player mode, may be C.M_PREVIEW or C.M_DYNAMIC
      "zoom": 1.0, // zoom ratio for animation
      "meta": { "title": "Default", // meta data is injected in info block
                "author": "Anonymous",
                "copyright": "© NaN",
                "version": -1.0,
                "description": 
                        "Default project description",
                [ "modified": 12272727271871 ] }, // in milliseconds, not used currently
      "cnvs": { ["fps": 30,] // time coefficient, not used currently
                "width": 400, // animation width, player will be resized if required
                "height": 250, // animation height, player will be resized if required   
                "bgcolor": "#fff", // canvas background color
                "duration": 10 } } // duration may be auto-calculated, but if provided,
                                  // this value will be taken

### Playing API

> ♦ `createPlayer(canvasId: String[, options: Object])`

> ♦ `load(scene: Any[, importer: Importer])`

> ♦ `play([time: Float][, speed: Float])`

> ♦ `pause()`

> ♦ `stop()`

> ♦ `onerror(callback: Function(evt: Event))`

### Loading Scenes ###

Player works with Scenes and plays any Scene easily, if this Scene is of those:

* Any scene in any JS-compatible format (String, JavaScript Array or Object, a Big Number), if you have an [`Importer`](#importers) for it; 
* An URL to JSON, the one we may load with AJAX; the returned JSON may be in any format, just ensure that you have a corresponding [`Importer`](#importers) for it;
* [`Builder`](#builder) instance, see its reference below;
* [`Scene`](#scene) instance, see its reference below;
* An array of `Clip`s or `Elements`, they are also described in [Scene section](#scene);

Loading and playing a scene requires a scene object (you may load it from external file or create in place) and an instance of [Importer](#importers), if this scene is in unknown format. 

#### a. from any object (with Importer) ####

Just include the [Importer](#importers) in the head section of your HTML file. If you store your scene in a file, then also include the scene file:

`my_scene.js`:

    var my_scene = { 
        . . . 
    };

`foo.html`:

    . . .
    <!-- player files -->
    <script src="./my_importer.js" type="text/javascript"></script>
    <script src="./my_scene.js" type="text/javascript"></script>
    . . .

Loading code:

    createPlayer('my_canvas').load(my_scene, new MyImporter())
                             .play();

**Note**: You may re-use one importer to load several scenes.

#### b. by URL ####

You don't need to include the scene, since it will be loaded with AJAX, just ensure that URL returns true JSON format, that this location is accessible for your client and do not forget to include importer:

    <!-- player files -->
    <script src="./my_importer.js" type="text/javascript"></script>

Loading code:

    createPlayer('my_canvas')
            .load('http://acme.com/my_scene.json', new MyImporter())
            .play();

#### c. building with Builder ####

[`Builder`](#builder) is an easy way to build animations (scenes) in JQuery-like style. So you may pass the created scene to the player and have fun. Do not forget to include `Builder`, since it is not the required player file. You may get it in raw format the same way as player files: [`builder.js`](https://raw.github.com/Animatron/player/master/builder.js).

    <!-- player files -->
    <script src="./builder.js" type="text/javascript"></script>

Loading code:

    var scene = new Builder('blue rect').rect([100, 100], [40, 40])
                                        .fill('#00f')
                                        .stroke('#f00', 2)
                                        .rotate([0, 5], [0, Math.PI / 2]);
    createPlayer('my_canvas').load(scene).play();

**Note**: You may want to create an alias for builder, so it will look even more in JQuery-style:

    var b = Builder._$; // instead of "b", you may even name it "_" or "$",
                        // if it will not clash with JQuery or some other library
                        // on the page
    var scene = b().add(
                       b().rect(. . .)
                  ).add(
                       b().circle(. . .)
                  ).add(
                       b('custom clip').. . .
                  );

More information is in [Builder](#builder) section.

#### d. creating Scene instance ####

You may build a [`Scene`](#scene) instance manually, with no usage of `Builder`, if you want (but `Builder` is really-really tiny, why? :) ). So you don't need to include anything additional to player files (except the case when you build your scene in external file, so you'll need to include this very file):

    var C = anm.C;
    var scene = new anm.Scene();
    var elem = new anm.Element();
    elem.xdata.path = new anm.Path('M36 35 L35 70 L90 70 L50 20 Z',
                      { width: 2, color: '#300' },
                      { color: '#f00' });
    elem.addTween({
        type: C.T_ROTATE,
        band: [0, 3],
        data: [Math.PI / 6, 0]
    });
    elem.addTween({
        type: C.T_TRANSLATE,
        band: [0, 3],
        data: anm.Path.parse('M-100 -100 L100 100 Z')
    });
    elem.addTween({
        type: C.T_ALPHA,
        band: [1.5, 3],
        data: [1, 0]
    });
    scene.add(elem);

    createPlayer('my_canvas').load(scene).play();

#### e. from array of Clips ####

`Clip` is the nickname for `Element` in our player, so there is no difference between them, just construct some elements and add them as array (if fact, it is not the preferred method, it is just provided for the real conformists):

    var first = new anm.Element();
    first.addPainter(function(ctx) {
      ctx.save();
      ctx.strokeStyle = '#f00';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(50, 50);
      ctx.stroke(); 
      ctx.closePath();
      ctx.restore();
    });
    var second = new anm.Clip();
    second.addPainter(function(ctx) {
      ctx.save();
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(50, 30);
      ctx.lineTo(100, 100);
      ctx.stroke(); 
      ctx.closePath();
      ctx.restore();
    });

    createPlayer('my_canvas').load([first, second]).play();

Builder
-------

`Builder` is the best method for accelerated scene building. It is based on JQuery-like concept (the _State Monad_, if it says something to you), so the instance of `Builder` is the one single object you'll need to do anything you want. If you are not JQuery lover, name it "just useful chaining".

Below is the reference for all of the `Builder` possibilities.

Let's give an example: this is how the typical compicated scene looks when constructed with `Builder`:

    var b = Builder._$; // quick alias                              
    b('scene').band([0, 20])
              .add(b('red-rect').fill('#f00')
                                .rect([30, 30], [20, 40])
                                .rotate([0, 10], [0, Math.PI / 2]))
              .add(b('bendie').image('./bender.png')
                              .band([10, 15])
                              .alpha([0, 1], [0, 1])                             
                              .trans([1, 5], [[0, 0], [20, 20]])
                              .bounce());                              
                            
You may load any animation created with `Builder` directly to player, so this code, for example, will nicely work:

    createPlayer('my-canvas').load(b().rect([0, 20], [40, 40])).play(); 
    
By the way, order of operations over the `Builder` instance has <sub>almost</sub> absolutely no matter for the result, it is only the matter of easy-reading your own code. To be honest, there are several minor exceptions, and if they will be important, we'll mention them individually in the corresponding section. Until that, feel free to mess things while it fits you and your friends. 

#### Sandbox
    
[Sandbox](http://animatron.com/player/sandbox/sandbox.html) also works with the examples constructed with `Builder` (among with manually created [Scene](#scene) instances), it just uses the value returned from user code as the scene to load into player. So if you want to see any example from this document in action, just copy-paste it to Sandbox page and add the last line returning any `b` instance to the player, like `return scene;` or `return child;` or `return b('wrapper').add(child).add(child);`.

### Aliases

It is too long to type `new Builder(. . .)` all the time when you need a new instance of `Builder`, so it is recommended to make an alias for it. Any you want, even "`_`" (underscore), just ensure that it not clashes with some existing variable. So, if you are using JQuery on your page, please don't use "`$`" alias, or wrap your code with anonymous function. We think the best one is "`b`".

    var b = Builder._$; // $_ points to the function that calls 
                        // "new Builder(arguments)" 

Among with `b` (or your variant), you may need some alias to access player constants (in fact, they are only used for easings, so it is really optional, if you don't use any of these). The single object that contains player contants is `anm.C`, so you may append some `C` variable to your code, if you want to access it faster:

    var C = anm.C;
    
The last optional variant is to make alias for a `Builder` class itself (not a constructor), because you may find useful to use its static methods (they allow to quickly create paths from points and gradients and make other complicated things easier). Here's the way:

    var B = Builder;
    
Now you may write something like this:

    b().rect([20, 20], [10, 10])
       .fill(B.grad(['#f00', '#00f']))
       .alpha([0, 7], [1, 0], C.E_CINOUT); // Cubic In-Out Easing

### Instantiation

> ♦ `Builder % ([String | Element | Builder])`

`Builder` constructor takes either of:

* Nothing — creates an empty element and keeps it inside to work with it during next calls;
* `String` — creates an element with given name and keeps it inside to work with it during next calls;
* `Element` — keeps the given element inside to work with it during next calls;
* `Builder` — creates a clone of the given `Builder`, so next changes for the last
              one does not apply to created one and vise versa;

Every `Builder` instance have three public properties: `v`, `n` and `x`. Factually, you will need only the `v` one: it points to the `Element` instance `Builder` works with. `n` is the name of element, and `x` is element's `xdata` (see `xdata` explanation in [Element](#element) reference section, but you'll for sure don't need it if you use `Builder` to build scenes):

    var b = Builder._$; // we will omit it in next snippets

    // Nothing
    var b_noname = b();
    console.log(b_noname.v instanceof anm.Element); // true
    console.log(b_noname.n === ''); // true

    // String
    var b_named = b('shape');
    console.log(b_named.v instanceof anm.Element); // true
    console.log(b_named.n === 'shape'); // true

    // Element
    var elem = new anm.Element();
    elem.name = 'foo';
    var b_elem = b(elem);
    elem.name = 'bar';
    console.log(b_elem.v instanceof anm.Element); // true
    console.log(b_elem.n === 'foo'); // true

    // Builder
    var b_src = b('src');
    var b_dst = b(b_src);
    console.log(b_src.n === b_dst.n); // true
    console.log(b_src.v === b_dst.v); // false (they're different instances)
    
When you have an instance of `Builder`, it is just the prepared state of some [shape](#shapes): path, image, or text. It becomes dynamic when you add [tweens](#tweens) and/or [modifiers](#modifiers) to it. But it is still just prepared — to make it possible to work, you need to pass (load) it into player. This is when the system adds required functionality to it. The same is true for [Element](#element-reference). Of course, you don't need to add every Builder/Element, it happens automatically for the complete scene tree when you load it into player. See [Scene](#scene) section for more information on this, if you want. 

### Structures

Thanks to `Builder` mechanics, you may build scenes with nesting level of any depth. Just put one element inside another, once again with other one, and keep adding and adding, and wow — you accidentally have the tree of elements right in your hands:

> ♦ `Builder.add % (what: Element | Builder) => Builder`

Any `Element` or `Builder` instances are allowed to add; by the way, you may treat the top (root) element as the scene:

    var scene = b('scene').band([0, 3]);
    var cols_count = 26;
    var rows_count = 16;
    var column;
    for (var i = 0; i < cols_count; i++) {
        scene.add(column = b('column-' + i));
        // you may keep adding sub-child elements even when
        // you've already appended a child to your scene, 
        // it is only important to do it before 
        // calling player.load for this scene 
        for (var j = 0; j < rows_count; j++) {
            column.add(b('elm-' + j)
                       .rect([i*15, j*15], [10, 10])
                       .rotate([0, 3], [0, Math.PI * 2]));
        }
        var offset = (cols_count / (i+1))*6;
        column.band([0, 1.5])
              .trans([0, 1.5], [[0, 0], 
                                [offset, offset]])
              .bounce();
    }
    scene.move([10, 10]);
    
So, to resume: any element may be a parent one, it may have any number of children (it only may affect performance, but we keep working to enhance these limits), you may (but not required to) draw something with a parent element, and then with its children, and they will be drawn one over another.

Just add something like `.circle([0, 0], 50)` to the `column` element in example above, and you'll see how it works. (It will shift the location of columns to be in center of circle, so you may want to change `scene.move([10, 10])` to `scene.move([60, 60])`, like the radius of circle + padding of 10, and the animation will be back in bounds).

### Shapes

If you will dive into internals of player API ([Scene](#scene) section), you will notice that any element may represent:

* Nothing — so nothing will be drawn with it (however, you may affect children elements whithout even drawing something);
* Path — any path, including rectangles, circles, polygons or any of your custom-shaped-curves;
* Image — just give us just an accessible URL, soon we will even support splitting the image and showing it's parts in different acts of the scene;
* Text — any text, this one is separate from "Path" concept, because it has a lot of own manners;

In fact, you may use several of those in one element, they will be drawn correctly, but why you'd need it? So please, treat every single element as only one of these. 

So, how'd you create them? Let's start from two basic shapes, rectangle and circle. If you test the examples, they will be drawn with default fill and stroke, so you'll see them for sure.

#### rect ####

> ♦ `Builder.rect % (pt: Array[2,Integer], rect: Array[2,Integer]) => Builder`

You may easily create a rectangle by specifying its location and its width/height this way:

    b().rect([ 50, 50 ], // its center will pe placed at (50,50)
             [ 100, 50 ]); // it will have 100-unit width and 50-unit height
             
#### circle ####
             
> ♦ `Builder.circle % (pt: Array[2,Integer], radius: Float) => Builder`

To create circle, specify its location and radius, and that's all:

    b().circle([ 40, 35 ], // its center will pe placed at (40,35)
               8); // it will have 8-unit radius
               
**NB:** Circle is not a Path, if you want the truth — it is created with [Painter](#painters) and draws a corresponding arc, but from a user point of view, we think, it best fits this chapter

#### path ####

> ♦ `Builder.path % (path: String | Path, [pt: Array[2,Integer]]) => Builder`

Now, if you want some custom shape, you may have it with the similary easy way
(may be just a bit complex, though :) ). There's two ways to do it: 

1. If you know & like SVG, you'll like to pass the string here.

        b().path('M0 0 L50 50 C105 260 260 260 380 40 Z');
        
     The string format currently differs from 'standard' SVG path description, 
     it only supports `M`|`L`|`C` commands, only in upper-case, and we don't
     think it will be required to extend it, may be only adding `Q`-quad segment.

2. If not, we have an even simpler way for you: you just create the array of points, using `B.path` helper (remember static methods from [Aliases](#aliases) chapter?)

        b().path(B.path([ [ 0, 0 ], [ 50, 50 ],
                          [ 80, 80 ], [ 120, 100 ] ]))
                          
    This path will 'turn' at each of four points and end at (120, 100). If you add a last point of (0, 0) (equal to start point), it will be the closed path.
    
    This way even accepts curve segments. If you specify six coodinates instead of two, it will treat that element as bezier-curve points (see [`bezierCurveTo`](http://www.html5canvastutorials.com/tutorials/html5-canvas-bezier-curves/) to know what means each of points). It works like this:
    
         b().path([ [ 0, 0 ], [ 50, 50 ],
                    [ 105, 260, 260, 260, 380, 40 ],
                    [ 0, 0 ] ]);
                    
    The second one works even faster, because it don't parses a string.
                    
You may want to draw a shape by yourself, if it is someway more complex than a path or it is hard to describe it with a path (ellipse, for example). Then you may use [Painters](#painters) and use a canvas-context commands direclty.

#### image ####

> ♦ `> Builder.image % (pt: Array[2,Integer], src: String) => Builder`

To load an image into player, just provide its URL and the point where you want it to be located at first. Please ensure that this image is accessible for the player client, this restriction is the same restriction as for `drawImage` of HTML5 canvas. And supported formats are the same. And, also, please ensure you have the copyrights for the image, it will be your problem if you violate them. 

    b().image([ 30, 18 ], // its center will pe placed at (30,18)
              'http://'); // it will have 8-unit radius

**NB.** We also have plans to support sprites soon, stay tuned.

#### text ####

> ♦ `> Builder.text % (pt: Array[2,Integer], text: String, [font: String]) => Builder`

**NOT IMPLEMENTED**

To place a text somewhere, specify its location and the characters line. Optionally, you may pass the font, either in CSS-way or with the help of `B.font()` helper.

    b().text([ 60, 40 ], 'My text');
    b().text([ 100, 100 ], My text', B.font('sans-serif', 10));
    b().text([ 120, 10 ], 'My another text', 'Arial 10px');

### Fill &amp; Stroke

Any path or text are represented with default fill (gray) and stroke (black, 1-unit width), until you haven't specified another. For sure, you would like to override these depressive colors and, of course, there is a way to do it.

> ♦ `> Builder.fill % (color: String | Gradient) => Builder`
> ♦ `> Builder.stroke % (color: String | Gradient, [width: Float, cap: C.PC_*, join: C.PC_*]) => Builder`

The color format is either CSS-like (`#ff0060`, `#a69` `blue`) or `RGB/HSL[A]`-string (`rgb(20, 20, 90)`, `rgba(20, 20, 90, .5)`, `hsla(70, 30, 120, .7)`), similar to canvas specifications for colors. If you calculate the color in place, you may find useful `B.rgb()` and `B.hsv()` methods, they take numeric values and concatenate them into properly-formatted color-string.

    b().fill('#f00');
    b().fill('black');
    b().fill('rgba(20, 40, 19, 0.3)');
    b().fill(B.rgb(20, 20, 70));
    b().fill(B.rgb(25, 40, 70, .5));
    b().stroke('#c60000');
    b().stroke(B.hsv(70, 30, 120), 7);

And, you may use gradients here! It is not so easy to create canvas-compatible gradient manually, so there is also a helper for it:

Besides the width (which is 1 by default), `stroke` also takes two optional parameters named `cap` and `join`. They describe the way successive strokes are connected in the paths: possible values for these will be described in [Constants](#constants) section. 

### Static Modification

### Bands

### Constants

### Tweens

### Easings

### Repeat Modes

### Modifiers &amp; Painters

#### Modifiers

#### Painters

### Time-Switch

### Events

### Elements Interactions

### Helpers

Scene
-----

### Manual Building  

### Element Structure 

### The Flow

### Element reference

### Path reference

### Text reference

Importers
---------
 
### Animatron