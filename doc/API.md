PLAYER API
==========

* Intro
* [Embedding](#Embedding)
  * Loading Scenes
  * Playing API
* [Builder](#Builder)
  * Aliases
  * Structure 
  * Shapes
  * Tweens + Easings
  * Modes
  * Modifiers/Painters
  * Time-Switch
  * [Events]
  * Minor stuff
* [Scene](#Scene)
  * Manual Building  
  * Element Internals 
  * The Flow
  * `Element` reference
* [Importing](#Importing)
  * From Animatron
  
Intro
-----

Here's the documentation on using Animatron Player to load external scenes and play them at your site. _And_ it's also about building your scenes manually, but in a very easy way (we're sure you haven't seen the easier one). The two in one. Let's start.

Emdedding
---------
<a name="Embedding"></a>

##### 1. #####

The first option is just to embed the player with some external scene to your site. You may publish one from Animatron tool (when it will be launched) and get the embed code, it will look like this:

        <iframe src="http://.../embed?4f97dd3de4b0fd8159a8df75"></iframe>

    (Customizing player style with embed code is planned)

##### 2. #####

If you need more customization or to control the flow, or if you want to _import_ some custom scene in custom format (i.e. JSON), or if you plan to _build_ a scene on your own, you may want the second option: to include player from the sourse.

###### 2a. ######

To do so, either clone [the repository](https://github.com/Animatron/player) or just download the  [`player.js`](https://raw.github.com/Animatron/player/master/player.js) and [`matrix.js`](https://raw.github.com/Animatron/player/master/vendor/matrix.js) (the last one is a super-tiny [proxy for transformation matrix](http://simonsarris.com/blog/471-a-transformation-class-for-canvas-to-keep-track-of-the-transformation-matrix), thanks to [Simon Sarris](http://simonsarris.com/)) files in RAW format. Now, include them in your HTML file:

    <!DOCTYPE html>
    <html>
            
      <head>
        <title>My Great Page</title>
     ⇨ <script src="./matrix.js" type="text/javascript"></script>
     ⇨ <script src="./player.js" type="text/javascript"></script>
       </head>
      
       <body>
         <canvas id="my-canvas"></canvas>   
       </body>
      
    </html>
  
If you are importing scene in some custom format, do not forget to include the importer (see below on importing scenes).
  
Then, you have a `Player` object.

###### 2b. ######

Now you may easily create a player with either of these two ways, just provide us the correct id of the canvas to attach to: 

    var player = new Player('my-canvas');
    // or: var player = createPlayer('my-canvas');

###### 2c. ######

And you may rule the flow with loading your own scene or imporing one:

    var my_scene = ...
    player.load(my_scene).play();

(See below for more information on loading scenes, and see [Builder](#Builder) or [Scene](#Scene) sections for more information on scene creation)

You may create as many players as you want, just be sure to have enough canvases for them.

### Loading Scenes

### Playing API

Builder
-------
<a name="Builder"></a>

### Aliases

### Structure 

### Shapes

### Tweens + Easings

### Modes

### Modifiers/Painters

### Time-Switch

### [Events]

### Minor stuff

Scene
-----
<a name="Scene"></a>

### Manual Building  

### Element Internals 

### The Flow

### Element reference

Importing
---------
 
### From Animatron