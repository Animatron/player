PLAYER API
==========

* Intro
* Sandbox
* [Embedding](#Embedding)
  * Loading Scenes
  * Player Options
  * Playing API
* [Builder](#Builder)
  * Aliases
  * Instantiation
  * Structures 
  * Shapes
  * Bands
  * Constants
  * Tweens
  * Easings
  * Repeat Modes
  * Modifiers &amp; Painters
  * Time-Switch
  * Events
  * Interactions
  * Helpers
* [Scene](#Scene)
  * Manual Building  
  * Element Structure 
  * The Flow
  * `Element` reference
  * `Path` reference
  * `Text` reference
* [Importers](#Importers)
  * Animatron
  
Intro
-----

Here's the documentation on using Animatron Player to load external scenes and play them at your site. _And_ it's also about building your scenes manually, but in a very easy way (we're sure you haven't seen the easier one). The two in one. Let's start.

Sandbox
-------

To get the feel on how player works, you may want to play with it at [Sandbox](animatron.com/player/sandbox/sandbox.html) section. There are several examples you may observe in action there. If you want to create some animation on your own, please follow the [Builder](#Builder) section, it is the general and the single class that gives you the real power over the moving scenes. 

You'll find a lot of checkboxes and radio buttons there, feel free to check and uncheck them. In fact, 'Debug' checkbox turns player in the mode where it shows additional info on current animation for developer (such as FPS, elements' names and their registration points), 'Interactive/Non-Interactive' button (it is not a checkbox, because an additional option may appear in future) enables/disables capturing mouse/keyboard events by canvas.

Emdedding
---------
<a name="Embedding"></a>

##### 1. Using IFRAME #####

The first option is just to embed the player with some external scene to your site. You may publish one from Animatron tool (when it will be launched) and get the embed code, it will look like this:

        <iframe src="http://.../embed?4f97dd3de4b0fd8159a8df75"></iframe>

(Customizing player style with embed code is planned)

##### 2. From Source #####

If you'd like to _customize_ things a bit more, or to have more control over the flow, or if you want to _import_ some custom scene in custom format (i.e. JSON), or if you plan to _build_ a scene on your own, you may want the second option: to include a player from the sourse.

###### 2a. ######

To do so, either clone [the repository](https://github.com/Animatron/player) or just download the  [`player.js`](https://raw.github.com/Animatron/player/master/player.js) and [`matrix.js`](https://raw.github.com/Animatron/player/master/vendor/matrix.js) <sub>(the last one is a super-tiny [proxy for transformation matrix](http://simonsarris.com/blog/471-a-transformation-class-for-canvas-to-keep-track-of-the-transformation-matrix)</sub>, thanks to [Simon Sarris](http://simonsarris.com/)) files in raw format. Now, include them in your HTML file:

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
  
If you are importing scene in some custom format, do not forget to include the importer (see below on importing scenes).
  
Then, you have a `Player` object.

###### 2b. ######

Now you may easily create a player with either of two ways below, just provide us with correct id of the canvas to attach to, and ensure that it is accessible through DOM (use `body.onload`, for example, like in previous code sample): 

    var player = createPlayer('my-canvas')
    // or: var player = new anm.Player('my-canvas');

###### 2c. ######

And you may easily rule the flow by loading your own scene or importing one:

    var my_scene = ...
    player.load(my_scene).play();

(See below for more information on loading scenes, and see [Builder](#Builder) or [Scene](#Scene) sections for more information on scene creation)

You may create as many players as you want, just be sure to have enough of canvases for them.

### Loading Scenes

Player works with Scenes and plays any Scene easily, if this Scene is of those:

* Any scene in any JS-compatible format (String, JavaScript Array or Object, a Big Number), if you have an [`Importer`](#Importers) for it; 
* An URL to JSON, the one we may load with AJAX; the returned JSON may be in any format, just ensure that you have a corresponding [`Importer`](#Importers) for it;
* [`Builder`](#Builder) instance, see its reference below;
* [`Scene`](#Scene) instance, see its reference below;
* An array of `Clip`s or `Elements`, they are also described in [Scene section](#Scene);

Loading and playing a scene requires a scene object (you may load it from external file or create in place) and an instance of [Importer](#Importers), if this scene is in unknown format. 

#### a. from any object (with Importer) ####

Just include the [Importer](#Importers) in the head section of your HTML file. If you store your scene in a file, then also include the scene file:

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

[`Builder`](#Builder) is an easy way to build animations (scenes) in JQuery-like style. So you may pass the created scene to the player and have fun. Do not forget to include `Builder`, since it is not the required player file. You may get it in raw format the same way as player files: [`builder.js`](https://raw.github.com/Animatron/player/master/builder.js).

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

More information is in [Builder](#Builder) section.

#### d. creating Scene instance ####

You may build a [`Scene`](#Scene) instance manually, with no usage of `Builder`, if you want (but `Builder` is really-really tiny, why? :) ). So you don't need to include anything additional to player files (except the case when you build your scene in external file, so you'll need to include this very file):

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

### Player Options

You may pass options object to player, if you want to configure it accurately. 

#### mode ####

In fact, only `mode` option is required, if you ever decide to use it:

    //var C = anm.C;
    createPlayer('my_canvas', { 'mode': C.M_VIDEO });
    
Mode can be:

 * `C.M_VIDEO` — (default) fits for animations that do not interact with user, like movies; controls are shown, info block is shown, mouse/keybord events on shapes are not handled;
 * `C.M_PREVIEW` — fits for animations/movies with showing no controls/info; both controls and info block are disabled and _no_ mouse/keyboard events handled at all;
 * `C.M_DYNAMIC` — fits for games and interactive animations; both controls and info block are disabled and all mouse/keyboard events are handled on the objects expecting them;
 
There are a bit more variants for `mode` and you may mix them with single pipe (`|`), like here:

    createPlayer('my_canvas', { 'mode': C.M_CONTROLS_ENABLED | C.M_INFO_DISABLED | C.M_HANDLE_EVENTS });   
 
But they are intended for rare use and we hope you'll be fine with three predefined ones.

**Note**: `C.M_VIDEO`, `C.M_PREVIEW` and `C.M_DYNAMIC` are the precalculated mixes of these "precise" options.

#### other ####

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
      "anim": { ["fps": 30,] // time coefficient, not used currently
                "width": 400, // animation width, player will be resized if required  
                "height": 250, // animation height, player will be resized if required   
                "bgcolor": "#fff", // canvas background color
                "duration": 0 } } // duration may be auto-calculated, but if provided,
                                  // this value will be taken

### Playing API

> ♦ `createPlayer(canvasId: String[, options: Object])`

> ♦ `load(scene: Any[, importer: Importer])`

> ♦ `play([time: Float][, speed: Float])`

> ♦ `pause()`

> ♦ `stop()`

> ♦ `onerror(callback: Function(evt: Event))`

Builder
-------
<a name="Builder"></a>

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
    
[Sandbox](http://animatron.com/player/sandbox/sandbox.html) also works with the examples constructed with `Builder` (among with manually created [Scene](#Scene) instances), it just uses the value returned from user code as the scene to load into player.

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

Every `Builder` instance have three public properties: `v`, `n` and `x`. Factually, you will need only the `v` one: it points to the `Element` instance `Builder` works with. `n` is the name of element, and `x` is element's `xdata` (see `xdata` explanation in [Element](#Element) reference section, but you'll for sure don't need it if you use `Builder` to build scenes):

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

### Structures

Thanks to `Builder` mechanics, you may build scenes with nesting levels of any depth. Just put one inside another, once again with other one, and keep adding and adding, and wow — you accidentally have the tree of elements at your hands:

> ♦ `Builder.add % (what: Element | Builder) => Builder`

Any `Element` or `Builder` instances are allowed to add; by the way, you may treat the top (root) element as the scene:

    var scene = b('scene');
    var cols_count = 26;
    var rows_count = 16;
    var column;
    for (var i = 0; i < cols_count; i++) {
        scene.add(column = b('column-' + i));
        // you may keep adding sub-child elements after appending 
        // a child to scene, it is only important to do it
        // before calling player.load for this scene 
        for (var j = 0; j < rows_count; j++) {
            column.add(b('elm-' + j)
                        .rect([i*15, j*15], [10, 10])
                        .rotate([0, 3], [0, Math.PI * 2]));
        }
        column.trans([0, 1.5], [[0, 0], [10, 10]]);
        column.trans([1.5, 0], [[10, 10], [0, 0]]);
        /*var offset = cols_count / i;
        column.band([0, 3])
              .trans([0, 1.5], [[0, 0], 
                                [offset, offset]]).bounce();*/
    }
    scene.move([10, 10]);

### Shapes

### Bands

### Constants

### Tweens

### Easings

### Repeat Modes

### Modifiers &amp; Painters

### Time-Switch

### Events

### Interactions

### Helpers

Scene
-----
<a name="Scene"></a>

### Manual Building  

### Element Structure 

### The Flow

### Element reference

### Path reference

### Text reference

Importers
---------
<a name="Importers"></a>
 
### Animatron