PLAYER API
==========

* Intro
* [Embedding](#Embedding)
  * Loading Scenes
  * Player Options
  * Playing API
* [Builder](#Builder)
  * Aliases
  * Structure 
  * Shapes
  * Bands
  * Constants
  * Tweens + Easings
  * Repeat Modes
  * Modifiers/Painters
  * Time-Switch
  * [Events]
  * Minor stuff
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

Emdedding
---------
<a name="Embedding"></a>

##### 1. Using IFRAME #####

The first option is just to embed the player with some external scene to your site. You may publish one from Animatron tool (when it will be launched) and get the embed code, it will look like this:

        <iframe src="http://.../embed?4f97dd3de4b0fd8159a8df75"></iframe>

(Customizing player style with embed code is planned)

##### 2. From Source #####

If you need more customization or to control the flow, or if you want to _import_ some custom scene in custom format (i.e. JSON), or if you plan to _build_ a scene on your own, you may want the second option: to include player from the sourse.

###### 2a. ######

To do so, either clone [the repository](https://github.com/Animatron/player) or just download the  [`player.js`](https://raw.github.com/Animatron/player/master/player.js) and [`matrix.js`](https://raw.github.com/Animatron/player/master/vendor/matrix.js) (the last one is a super-tiny [proxy for transformation matrix](http://simonsarris.com/blog/471-a-transformation-class-for-canvas-to-keep-track-of-the-transformation-matrix), thanks to [Simon Sarris](http://simonsarris.com/)) files in raw format. Now, include them in your HTML file:

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

Now you may easily create a player with either of these two ways, just provide us the correct id of the canvas to attach to and ensure that it is accessible through DOM (use `body.onload`, for example, like in previous code sample): 

    var player = createPlayer('my-canvas')
    // or: var player = new anm.Player('my-canvas');

###### 2c. ######

And you may rule the flow with loading your own scene or importing one:

    var my_scene = ...
    player.load(my_scene).play();

(See below for more information on loading scenes, and see [Builder](#Builder) or [Scene](#Scene) sections for more information on scene creation)

You may create as many players as you want, just be sure to have enough of canvases for them.

### Loading Scenes

Player works with Scenes and plays any Scene easily, if this Scene is one of those:

* Any scene in any JS-compatible format (String, JavaScript Array or Object, a Big Number), if you have an [`Importer`](#Importers) for it; 
* An URL to JSON, the one we may load with AJAX; the returned JSON may be in any format, just ensure that you have a corresponding [`Importer`](#Importers) for it;
* [`Builder`](#Builder) instance, see its reference below;
* [`Scene`](#Scene) instance, see its reference below;
* An array of `Clip`s or `Elements`, they are also described in [Scene section](#Scene);

Loading and playing a scene requires a scene object (you may load it from external file or create in place) and an instance of [Importer](#Importers), if this scene is in unknown format. 

#### a. from any object ####

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

#### createPlayer(canvasId: String[, options: Object])

#### load(scene: Any[, importer: Importer])

#### play([time: Float][, speed: Float])

#### pause()

#### stop()

#### onerror(callback: Function(evt: Event))

Builder
-------
<a name="Builder"></a>

`Builder` is the best method for accelerated scene building. It is based on JQuery-like concept (the State Monad, if it says something to you), so the instance of `Builder` is the one single object you'll need to do anything you want. If you are not JQuery lover, name it "just useful chaining".

Let's give an example: this is how the typical compicated scene looks when constructed with `Builder`:

    var b = Builder._$; // quick alias
    b('scene').band([0, 20])
              .add(b('red-rect').fill('#f00')
                                .rect([20, 20], [10, 10])
                                .rotate([0, 10], [0, Math.PI / 2]))
              .add(b('bend').image('./bender.png')
                            .band([10, 15])
                            .trans([2, 10], [[0, 0], [20, 20]])
                            .rotateP()
                            .bounce())
                            
<!-- image: 'http://digital-photography'+
            '-school.com/wp-content/uplo'+
            'ads/2008/11/my-favorite-lens.jpg' -->

### Aliases

It is too long to type `new Builder(. . .)` all the time when you need a new instance of `Builder`, so it is recommended to make an alias for it. Any you want, even "`_`" (underscore), just ensure that it is not clashes with some existing variable. So, if you are using JQuery on your page, don't use "`$`" alias, or wrap your code with anonymous function. We think the best one is "`b`".

    var b = Builder._$; // $_ points to the function that calls 
                        // "new Builder(arguments)" 

Among with `b` (or your variant), you may need some alias to access player constants (in fact, they are only used for easings, so it is really optional, if you don't use any of these). The single object that contains player contants is `anm.C`, so you may append some `C` variable to your code, if you want to access it faster:

    var C = anm.C;
    
The last optional variant is to make alias for a `Builder` class itself (not a constructor), because you may find useful to use its static methods [currently there is none of those, but we plan to provide some shortcuts to creating gradient-fills, for example]. Here's the way:

    var B = Builder;
    
Now you may write something like this:

    b().rect([20, 20], [10, 10])
       .fill(B.grad(['#f00', '#00f']))
       .alpha([0, 7], [1, 0], C.E_CINOUT); // Cubic In-Out Easing

### Structure 

### Shapes

### Bands

### Constants

### Tweens + Easings

### Repeat Modes

### Modifiers/Painters

### Time-Switch

### [Events]

### Minor stuff

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