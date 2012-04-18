<!--
 ~ Copyright (c) 2011-2012 by Animatron.
 ~ All rights are reserved.
 ~
 ~ Animatron player is licensed under the MIT License, see LICENSE.
 -->

JS Player API
=============

The player accepts different JavaScript object types to play animation, all these types are listed below. You can either construct this object easily with provided API or load it using some URL or load it from Animatron project in exported JSON. The player itself is a JavaScript object that can be easily controlled with its methods. One player instance can play one scene at a time (but one player can play different scenes sequentially).

<!-- FIXME: Add TOC -->

--------------------------------------------------------------

Controls
--------

    // player.load % (project: SomeExportedProject, importer: SomeImporter)
    // player.load % (url: String, importer: SomeImporter)    
    // player.load % (scene: Scene)
    // player.load % (clips: Array[Clip | Element])
    // player.load % (builder: Builder)
    // player.load % (null)
    player.load(project | scene | url | clips | builder, null[, importer]);

`load` methods just loads the animation in any form (see Animatron object specification below, as an example) into player and does almost nothing with it unless you call

    // player.play % (time: Float, speed: Float)
    player.play([time, speed]); 

Now, animation is started: you may bind it to "play" button in UI. `time` is the optional parameter to specify the seconds to start playing from (default is `0`), `speed` is any coefficient to multiply current time to, it is just a playing speed (default is `1`).

    // player.pause % () => Float
    player.pause();

This method pauses playing the animation at current point, returns the time just after where it was stopped.

    // player.stop % ()
    player.stop();

This method stops the animation (do not forgets it) and resets playing time to `0`.
   
    // player.onerror % (callback: Function(err: Error))
    player.onerror(callback);
    
Gives you a possibility to handle an error (parsing-time or playing-time, you get its type) if occurred. `callback` gets an error object as argument. (better use try/catch to handle those?)

--------------------------------------------------------------

### Usage, Examples

To play any animation with Animatron Player you are recommended to perform these actions in order:

 * create a player instance for existing canvas element with `createPlayer('<canvas-elm-id>')` or `new Player('<canvas-elm-id>')`
 * prepare your `Scene` in place (you can build it using `Scene` or `Builder` objects, see specs below) or get its URL or get in the exported JSON format (see _Allowed Scene Sources_ and _Scene Construction Guide_ below)
 * pass it to the `load` method
 * use `play`|`pause`|`stop` controls methods when required

#### Loading Examples

    var p1 = createPlayer('canvas1'); // same as `new Player('canvas1')`
    var scene = new Scene();
    scene.add(...);
    p1.load(scene);
    p1.debug = true;
    p1.play();

    var p2 = createPlayer('canvas2'); // same as `new Player('canvas2')`
    p2.load(demo_project, new MyImporter());
    p2.play(6, 0.25);

    var p3 = new Player('canvas3');
    p3.configureCanvas({ // optional
    	'width': 300,
    	'height': 250,
    	'bgcolor': '#fff'
    });
    var clips = [];
    var clip1 = new Clip(...);
    clip1.add(...);
    var elm1 = new Element(...);
    clips.push(clip1);
    p3.load(clips);
    p3.play();

    var p4 = createPlayer('canvas4'); // same as `new Player('canvas4')`
    p4.load(); // or pass some project, it will be loaded and new clips added to it
    var clip1 = new Clip();
    clip1.add(...);
    p4.scene.add(clip1);
    p3.play(12);

    var p5 = createPlayer('canvas5'); // same as `new Player('canvas4')`
    p5.load('http://acme.com/animation.json');
    p5.play();

#### Scenes Examples

**TODO**

--------------------------------------------------------------

### Allowed Scene Sources

#### Any External Project in JS-Friendly Format

You may export any animation from any software if you have a corresponding importer (several built-in importers will be provided) and load it into player in a way like this:

    player.load(exportedProject, new MyImporter());

See _Importing_ section.

#### URL

You may load any listed object type from remote source by URL. 

    player.load('http://acme.com/animation.json', new MyImporter()); 

#### Scene

You may create any _Scene_ and fill it will _Elements_ or _Clips_ using `Scene` class directly or by building _Elements_ and _Clips_ using `Builder` class.

    var scene = new Scene(),
        b = new Builder();
    // add elements using clips
    var clip = new Clip();
    clip.add(function(ctx) { ... }, function(time) { ... });
    scene.add(clip);
    // or using builder
    scene.add(b.path('...')
              .rotate([2, 15], [ Math.PI, Math.PI/2 ]));
    player.load(scene);

#### Clips

You may add _Clips_ or _Elements_ to player directly (in fact `Clip` class is just an alias for `Element`), with no requirement to wrap them with `Scene`.

    var b = new Builder();
    player.load([ b.square([5, 5], [50, 100]),
                  b.circle([0, 0], 20).fill('#f00') ]);

#### Builder

You may pass _Builder_ instance directly and player will load the element you have constructed with it: 

    var b = new Builder();
    b.alpha([1, 10], [0, 1])
     .add(b.square([5, 5], [50, 100]),
          b.circle([0, 0], 20).fill('#f00'));
    player.load(b);

--------------------------------------------------------------

Scene Construction Guide
------------------------

If you have no complex animation, you may use only `Scene`/`Clipe`/`Element` instances to build your clip. You may provide `draw` and `onframe` methods for every element/clip directly in constructors or add painters/modifiers through `addPainter`/`addModifier` methods.

    var scene = new Scene();
    scene.add(new Element(function(ctx) {
                              ctx.strokeStyle = '#600';
                              ctx.lineWidth = 5;
                              ctx.beginPath();
                              ctx.moveTo(0, 0);
                              ctx.lineTo(20, 20);
                              ctx.closePath();
                              ctx.stroke();
                          }, function(time) {
                              if (time < 3) return false;
                              this.x = 50;
                              this.y = 50;
                              this.alpha = (100 / (100 - time));
                              return true; 
                          }));
    new Player('my-canvas').load(scene).play();

The recommended way to construct your animation if you need to maintain something complex is to use `Builder` class – it will make your construction process simple and fast.

    var scene = new Scene(),
        b = new Builder();
    scene.add(b.line([50, 50], [70, 70]) // line from 50:50 to 70:70
               .after(3) // after third frame
               .alpha([1, 0])); // change opacity from 100% to 0%
    new Player('my-canvas').load(scene).play();

**TODO**

--------------------------------------------------------------

Provided Objects and Classes
----------------------------

Player API provides some useful objects to make animation building process easier (and a `Builder` object that is intended to make it even easier than just an 'easy' way: it allows you to create tweens, bands and paths in-place, just while constructing your animation)

--------------------------------------------------------------

### _Player_

**Provides events**: `'load'`, `'play'`, `'pause'`, `'stop'`

#### Constructor

##### _Player(id)_

**Spec:** `Player % (id: String) => Player`

Constructs a new `Player` instance, binds it to canvas element with the given `id`.

    // somewhere in document: 
    // <canvas id="my-canvas"></canvas>
    var player = new Player('my-canvas');

#### Properties

##### _anim_

**Spec:** `player.anim: Scene`

`anim` property contains the current `Scene` instance. This animation will be played when you'll call `play` method.

    var player = new Player('my-canvas');
    player.configureCanvas(Player.DEFAULT_CANVAS);
    player.anim = new Scene();
    player.anim.add(...);
    player.play();

is equal to:

    var player = new Player('my-canvas');
    var scene = new Scene();
    scene.add(...);
    player.load(scene);
    player.play(); 

##### _debug_

**Spec:** `player.debug: Boolean`

`debug` property is `false` by default. You can set it to `true` to display FPS, origin point(s), tween path if defined.

    var player = new Player('my-canvas');
    player.debug = true; // NB: set it before `load` call
    player.load(...);
    player.play();

##### _state_

**TODO**

##### _canvas_

**TODO**

##### _ctx_

**TODO**

#### Methods

##### _load(scene | obj | url)_

**Spec**:

* `player.load % (project: SomeExportedProject, importer: SomeImporter)`
* `player.load % (url: String, importer: SomeImporter)`
* `player.load % (scene: Scene)`
* `player.load % (clips: Array[Clip | Element])`
* `player.load % (builder: Builder)`
* `player.load % ()`

**TODO**

##### _play([time, speed])_

**Spec**: `player.play % (time: Float, speed: Float)`

**TODO**

##### _pause()_

**Spec**: `player.pause % () => Float`

**TODO**

##### _stop()_

**Spec**: `player.stop % ()`

**TODO**

##### _configure(props)_

**Spec**: `player.configureCanvas % (props: Object)`

**TODO**

##### _detach()_

**Spec**: `player.detach % ()`

**TODO**

--------------------------------------------------------------

### _Scene_

**Provides events**: `'mdown'`, `'render'`

#### Constructor

##### _Scene()_

**Spec:** `Scene % () => Scene`

**TODO**

#### Methods

##### _add(elem | clip | elems | (draw, onframe[, transform]))_

**Spec:**

* `scene.add % (elem: Element | Clip)`
* `scene.add % (elems: Array[Element]) => Clip`
* <pre><code>scene.add % (draw: Function(ctx: Context), 
               onframe: Function(time: Float), 
               [ transform: Function(ctx: Context, 
                                   prev: Function(Context)) ]) 
            => Element</code></pre>

Add element or clip to the animation, by passing the concrete object or specifying `draw`/`onframe` function. 

On `draw`, `onframe` and `transform` functions, see `Element(...)` constructor description and _Painters and Modifiers_ section. 

##### _addC(rect, draw, onframe[, transform])_

**Spec:** 

    scene.addS % (rect: Array[Integer, 2], 
                  draw: Function(ctx: Context), 
                  onframe: Function(time: Float), 
                  [ transform: Function(ctx: Context, 
                                        prev: Function(Context)) ])
                  => Element

Add sprite (cached) element to the animation. Sprite element is the one that will be drawn just once to the buffer-canvas and then projected to the clip using `drawImage`. It may help you to cache complex paths. Currently you need to pass `rect` in this case to specify the size of the buffer-canvas, in future it may be removed. 

On `draw`, `onframe` and `transform` functions, see `Element(...)` constructor description and _Painters and Modifiers_ section. 

##### _find(id)_

**TODO**

##### _visitElms(visitor[, data])_

**TODO**

##### _render(ctx, time)_

**Spec:** `scene.render % (ctx: Context, time: Float)`

Perform the whole animation lifecycle snapshot on the given context in the given time, it calls `element.render` for each element. See `element.render` for more information. 

--------------------------------------------------------------

### _Clip_

Honestly, `Clip` class is literally an alias for `Element`. This statement is true, here is the code from the player:

    var Clip = Element;

We've done this to let you distinct elements with children from standalone elements. So, when you need some element that has children, name it `clip` and use `Clip` constructor. When your element will have no children, name it `element` and use `Element` constructor. But keep in mind that your `clip` have all the possibilities of an `element` and vice versa (you can add children to element and and _painters_/_modifiers_ to clip, for example).

--------------------------------------------------------------

### _Element_

**Provides events**: `'mdown'`, `'render'`

#### Constructor

##### _Element([draw, onframe[, transform]])_

**Spec:** 

    Element % ([ draw: Function(ctx: Context), 
                 onframe: Function(time: Float), 
                 [ transform: Function(ctx: Context, 
                                       prev: Function(Context)) ]]) 
            => Element

`draw` function specifies how to draw your element on the given context. `this` variable in this function is equal to element (but in future it may become `xdata` property).

For example, `draw` function for the yellow circle:

    function(ctx) {
        context.strokeStyle = '#000';
        context.fillStyle = '#ff0';
        context.beginPath();
        context.arc(100,100,50,0,Math.PI*2,true);
        context.closePath();
        context.stroke();
        context.fill();
    }

`onframe` function specifies the changes to object state to apply in the given time. `this` in this function will be equal to `element.state`. If `onframe` function returns `false`, it will not even be drawn.

For example, element with this `transform` function will not be shown from `0` to `5` seconds and will be translated to `20 + <seconds>` by `x` and scaled to half else (see `element.state`):

     function(time) {
         if (time <= 5) return false;
         this.x = 20 + time;
         this.sx = 0.5;
     }

You can prepare the functions like these and then reuse them any times you need or you may use `Builder` object which in fact constructs a queues of functions like these (and also manipulates `xdata` of elements).

(See also _Painters and Modifiers_)

#### Properties

##### _id_

**Spec:** `element.id: String`

Contains the unique ID of the element 

##### _xdata_

**Spec:** `element.xdata: Object`

The element geometry information, the one used in `draw` method (the synonym of _painter_).

It keeps the source for drawing like this:

    { 'tweens': {},             
      'canvas': null, // prepared canvas, if element is sprite
      'imgSrc': null,
      'path': null, // defined, if element is a shape
      'rect': null,
      'lband': null, // local band of the element
      'gband': null, // global band of the element
      'reg': null, // origin point
      '_mpath': null } // moving path

If one of the properties is not `null`, the corresponding _painter_ or _modifier_ is added to element when loading the animation. It is all the internal stuff and you don't need to bother yourself about it. You may want to know that this property is actively used in `Builder` class.

See also _Painters and Modifiers_ section. 

##### _state_

**Spec:** `element.state: Object`

The element state, the one you change in `onframe` method (the synonym of _modifier_).

Initially Looks like this:

    { 'x': 0, 'y': 0, // element position
      'rx': 0, 'ry': 0, // origin position
      'angle': 0, // rotation angle, in radians
      'sx': 1, 'sy': 1, // scale
      'alpha': 1, // transparency, from 0 to 1
      '_matrix': new Transform() }

See also _Painters and Modifiers_ section. 

##### _children_

**Spec:** `element.children: Array[Element]`

Element children.

##### _sprite_

**Spec:** `element.sprite: Boolean`

Sprite element is the one that will be drawn just once to the buffer-canvas and then projected to the clip using `drawImage`. It may help you to cache complex paths. Currently you need to pass `rect` in this case to specify the size of the buffer-canvas, in future it may be removed.

You may set this property just after calling _empty_ `Element` constructor and then provide `data` for this element.

See also `element.addS(...)` method description. 

#### Methods

##### _add(elem | clip | elems | (draw, onframe[, transform]))_

**Spec:**

* `element.add % (elem: Element | Clip)`
* `element.add % (elems: Array[Element])`
* <pre><code>element.add % (draw: Function(ctx: Context), 
                 onframe: Function(time: Float), 
                 [ transform: Function(ctx: Context, 
                                       prev: Function(Context)) ]) 
                => Element</code></pre>

Add child element or clip to current element or clip, by passing the concrete object or specifying `draw`/`onframe` function. 

On `draw`, `onframe` and `transform` functions, see `Element(...)` constructor description and _Painters and Modifiers_ section. 

##### _addS(rect, draw, onframe[, transform])_

**Spec:** 

    element.addS % (rect: Array[Integer, 2], 
                    draw: Function(ctx: Context), 
                    onframe: Function(time: Float), 
                    [ transform: Function(ctx: Context, 
                                          prev: Function(Context)) ])
                 => Element

Add sprite element to the current element. Sprite element is the one that will be drawn just once to the buffer-canvas and then projected to the clip using `drawImage`. It may help you to cache complex paths. Currently you need to pass `rect` in this case to specify the size of the buffer-canvas, in future it may be removed. 

On `draw`, `onframe` and `transform` functions, see `Element(...)` constructor description and _Painters and Modifiers_ section. 

##### _inBounds(point)_

**TODO**

##### _isInside(time, point)_

**TODO**

##### _addPainter(painter[, data])_

**Spec:** 

    element.addPainter % (painter: Function(ctx: Context,  
                                            data: Any), 
                          data: Any) => Integer

Add the given painting function to the painters queue of this element. For more information see _Painters and Modifiers_ section.

##### _addModifier(modifier[, data])_

**Spec:** 

    element.addModifier % (modifier: Function(time: Float,  
                                              data: Any), 
                           data: Any) => Integer

Add the given modifying function to the painters queue of this element. For more information see _Painters and Modifiers_ section.

##### _find(id)_

**TODO**

##### _render(ctx, time)_

**Spec:** `element.render(ctx: Context, time: Float)`

Perform the element lifecycle on the given context in the given time. It means:

 * save context;
 * call `this.prepare()`;
 * call `this.onframe(time)`, it will call a queue of all element modifiers, passing `this.state` to them;
 * if `onframe(time)` passed (all modifiers returned `true`), call `this.transform(ctx)`, it will apply `this.state` to the current matrix.
 * if `onframe(time)` passed (all modifiers returned `true`), call `this.draw(ctx)` that will call a queue of all element painters and pass `this.xdata` to them
 * call `render(ctx, time)` for all of the element's children, if they exist
 * restore context
 * fire `'render'` event

See also _Painters and Modifiers_ section. 

##### _prepare()_

**TODO**

##### _onframe(time)_

**TODO**

##### _drawTo(ctx)_

**TODO**

##### _draw(ctx)_

**TODO**

##### _transform(ctx)_ 

**TODO**

--------------------------------------------------------------

### _Path_

#### Constants

`P_MOVETO`, `P_LINETO`, `P_CURVETO`

#### Properties

##### _str_

##### _stroke_

##### _fill_

##### _segs_

#### Methods

##### _setStroke(strokeSpec)_

##### _setFill(fillSpec)_

##### _parse(str)_

##### _start()_

##### _end()_

##### _length()_

##### _hitAt(t, func)_

##### _pointAt(t)_

##### _tangentAt(t)_

##### _add(seg)_

##### _apply(ctx)_

##### _visit(visitor[, data])_

--------------------------------------------------------------

### Segments

#### Constructors

##### _MSeg(pts), LSeg(pts), CSeg(pts)_

#### Methods

##### _length()_

##### _atDist(start, dist)_

##### _atT(start, t)_

##### _tangentAt(start, t)_

##### _last()_

--------------------------------------------------------------

### _Render_

#### Static Methods

##### _wrapBand(outer, inner)_

##### _p\_drawReg(ctx[, reg])_ (painter)

##### _p\_drawPath(ctx[, path])_ (painter)

##### _p\_drawMPath(ctx)_ (painter)

##### _m\_checkBand(time, band)_ (modifier)

##### _m\_saveReg(time, reg)_ (modifier)

##### _addXDataRender(elm)_

##### _addDebugRender(elm)_

##### _addTweensModifiers(elm, tweens)_

##### _addTweenModifier(elm, tween)_

##### _adaptToBand(modifier, sband)_

--------------------------------------------------------------

### _Builder_

`Builder` is a single self-contained object that lets you create animations using chaining and other useful stuff. It allows you to create tweens, bands and paths in-place, just while you construct your animation.

#### Methods

##### _path(pathSpec)_

##### _image(imgSpec)_

##### _sprite(spriteSpec)_

##### _fill(fillSpec)_

##### _stroke(strokeSpec)_

##### _rect(strokeSpec)_

##### _rotate(band, angle | path)_

##### _translate(band, p0, p1)_

##### _alpha(band, a0, a1)_

##### _scale(band, from, to)_

--------------------------------------------------------------

### Painters and Modifiers

Here is the sequence of actions performed when `element.render(ctx, time)` is called (and it is called from `scene.render(ctx, time)` on every redraw for every top-level element):

 * save context;
 * call `this.prepare()`;
 * call `this.onframe(time)`, it will call a queue of all element modifiers, passing `this.state` to them;
 * if `onframe(time)` passed (all modifiers returned `true`), call `this.transform(ctx)`, it will apply `this.state` to the current matrix.
 * if `onframe(time)` passed (all modifiers returned `true`), call `this.draw(ctx)` that will call a queue of all element painters and pass `this.xdata` to them
 * call `render(ctx, time)` for all of the element's children, if they exist
 * restore context
 * fire `'render'` event 

So, the _Painter_ is the function that gets context as `ctx` and any optional data and draws something on context. The _Modifier_ is the function that gets current `time` and any optional data and does something with the `state` of element, returning `false` if it is not required to draw it at this time and `true` in other cases. 

When you call `Element(draw, onframe)` constructor, in fact you pass initial (first) _painter_ and a _modifier_ for this element, in simple cases you never need more. But if your element is a complex one, you may need several _painters_ or _modifiers_.

You may add them to element using `element.addPainter(painter[, data])` and `element.addModifier(modifier[, data])`.

If you do remember that `Clip` is just an alias for `Element` and element modifiers also affects its children, you get the thing.

The main profit of managing _painters_ and _modifiers_ is the possibility to prepare different simple versions of those and just attach them to elements in required order. The `Builder` class does this in background in fact. 

Each element contains `xdata` property that keeps the source data to draw and tweens, if element has one.

See the way how `xdata` used in the code to render element and apply tweens to them (`CR.addXDataRender` is called for every element in the scene while in loading process, no playing is performed on this stage):

    CR.addXDataRender = function(elm) {
        var xdata = elm.xdata;

        // painters
        if (xdata.path) elm.addPainter(CR.p_drawPath, xdata.path);
        if (xdata.imgSrc) elm.addPainter(CR.p_drawImg, xdata.imgSrc);
    
        // modifiers
        elm.addModifier(CR.m_checkBand, xdata.gband);
        CR.addTweensModifiers(elm, elm.xdata.tweens);
        elm.addModifier(CR.m_saveReg, xdata.reg);
    }

    // painter: draw path of the element
    CR.p_drawPath = function(ctx, path) { 
        var path = path || this.xdata.path;
        path.apply(ctx);
    }

    // painter: draw origin point of the element
    CR.p_drawReg = function(ctx, reg) {
        var reg = reg || this.xdata.reg; 
        ctx.beginPath();
        ...
        ctx.stroke();
    }

    // modifier: check the given time to match band
    CR.m_checkBand = function(time, band) {
        if (band[0] > time) return false;
        if (band[1] < time) return false;

        return true;
    }

    // modifier: save origin coordinates to state
    CR.m_saveReg = function(time, reg) {
        this.rx = reg[0];
        this.ry = reg[1];
        return true;
    }

    // add tween to the element
    CR.addTweenModifier = function(elm, tween) {
        var _sband = CR.wrapBand(elm.xdata.gband, tween.band);
        elm.addModifier(CR.adaptToBand(Tweens[tween.type], _sband), 
                        tween.data);
    }

    // ... somewhere else in import:

    if (player.state.debug) {
        player.anim.visitElems(function(elm) {
            if (elm.xdata.reg) elm.addPainter(CR.p_drawReg, elm.xdata.reg);
            elm.on('render', CR._drawMPath);
        });
    }

(See also `Element(...)` constructor description)

All of these _painters_ and _modifiers_ are accessible trough `Render` object, see its spec.

--------------------------------------------------------------

Event system
------------

Some object/classes in the _Provided Objects_ section are marked with **Provided events** section. It means they belong to this section and they provide all the functionality described here for the enumerated events.

All of the objects that provide events have these useful methods:

### _on(event, handler)_

You may subscribe to the event using `on` method this way:

    // > x.on % (event: String, handler: Function(evtobj: Object)) => Integer
    elem.on('click', function(evt) {
        console.log(evt.clientX, evt.clientY);
        console.log(this.state);
    });

This method returns an integer index of a handler, so you may remove it later (see `detach` in this section).

### _detach(event, idx)_

To remove a handler, you need to save its id when adding it and use it for detaching in `detach` method:

    // > x.detach % (event: String, idx: Integer)
    var handler_idx = elem.on('render', function(ctx) {
        ctx.rotate(1.2);
    });
    elem.detach('render', handler_idx);

### _provides(event)_

You may ask any object if it provides the event using `provides` method:

    // > x.provides % (event: String) => Boolean
    console.log(clip.provides('click')); 

### _fire(event, evtobj)_

You may fire some event manually, this:

    // > x.fire % (event: String, evtobj: Object)
    elem.fire('render', ctx);
    elem.fire('click', { clientX: 5, clientY: 10 });

This code will call all the handlers subscribed to the specified event and pass `evtobj` to them.

### _e\_\<event\>(evtobj)_

If you accidentally need to replace all existing handlers for the event with one (but it is not recommended), you have a way to do it:
  
    // > x.e_<event> % (evtobj: Object)
    elem.e_click({ ... }); // same as fire('click', { ... })
    elem.e_click = function(evt) {
        console.log(evt.clientX, evt.clientY);
    };
    elem.e_click({ ... }); // will call previous function
    elem.fire('click', { ... }); // will call all handlers as before 

In fact, all objects call these type (`e_<smth>`-type) functions internally when then need to fire some event, just to allow user to redefine it _(it is a subject to change in future)_.

### _handle\_\<event\>(evtobj)_

This function is called for the object that provides this event itself when it is fired, if it defines it, and before calling all other handlers. It is the internal way not to mess with other handlers when object wants to do something before they are called. On the other hand, it is the way to insert something before calling handlers, but it may be dangerous if the object already defines it: object functionality will be erased

    // > x.handle_<event> % (evtobj: Object)
    elem.handle_click({ clientX: 20, clientY: 30 });

_(this section is a subject to change in future)_

--------------------------------------------------------------

Importing
---------

You can pass to a player any project in any format if you have a correcponding importer. The only thing required from importer is one method:

    // load % (obj: Object) => Scene
    importer.load(obj) {
        return new Scene();
    }

The optional method is `configure` where you can tune up player before conversion:

    // preparePlayer % (obj: Object) => Configuration
    importer.preparePlayer(player, prj) {
        var _a = prj.anim;
        return {
            "meta": {
                "title": "Default",
                "author": "Anonymous",
                "copyright": "© 2011",
                "version": 0.1,
                "description": "Default project description"
            },
            "fps": 40, 
            "width": 300,
            "height": 400,
            "bgcolor": "#f00"
        };
    }

The more detailed instructions on creating importers will be provided later. 

--------------------------------------------------------------

Appendix
--------

### Appendix A. Animatron Scene Example

This is the example of animation object that you will get when you'll export it from Animatron

    { "meta": {
	    "title": "Default",
	    "author": "Anonymous",
	    "copyright": "© 2011",
	    "version": 0.1,
	    "description": "Default project description"
	  },
	  "anim": {
	    "dimension": [ 500.0, 350.0 ],
	    "framerate": 24.0,
	    "background": { "color": "white" },
	    "scenes": [ {
	        "id": "F8A4281F595872DBB5A38112B9578675",
	        "type": "Clip",
	        "name": "Scene 1",
	        "scene": true,
	        "layers": [ {
	            "id": "A4ACD41DB46B419F670661C3D6A8C1E6",
	            "name": "Clip Layer",
	            "band": [0.0, 15.0],
	            "element": { "id": "C54D2DAD374D26979216D6A5FD2B7615",
	                         "type": "Clip",
	                         "name": "Clip",
	                         "layers": [ { "id": "325523AE22D7042E6C5F1E84AAADE620", 
                                           "name": "Symbols", 
                                           "band": [ 0.0, 15.0 ],
	                                       "element": { "id": "C6C22F0AF9BE0B0F1D97B775D32FDF4A",
	                                                    "type": "Rectangle",
                                                        "stroke": {
                                                            "width": 4.0,
                                                            "color": "blue",
                                                            "cap": "round",
                                                            "join": "round"
                                                        },
                                                        "fill": { "color": "red" },
                                                        "path": "M0.0 0.0 L100.0 0.0 L100.0 100.0 L0.0 100.0 L0.0 0.0 Z" 
                                                      },
	                                      "outline-color": "green",
	                                      "tweens": [ {
	                                              "type": "Rotate",
	                                              "band": [ 0.0, 15.0 ],
	                                              "data": [ 0.0, 6.283185307179586 ]
	                                          }, {
	                                              "type": "Translate",
	                                              "band": [ 0.0, 15.0 ],
	                                              "path": "M0.0 0.0 L100.0 100.0 Z"
                                              }, {
	                                              "type": "Alpha",
	                                              "band": [ 0.0, 15.0 ],
	                                              "data": [ 1.0, 0.0 ]
	                                          } ],
	                                     "reg": [ 50.0, 50.0 ]
	                                  } ] },
	            "outline-color": "red",
	            "tweens": [ {
	                    "type": "Translate",
	                    "band": [ 0.0, 15.0 ],
	                    "easing": { "name": "Unknown",
	                                "path": "C0.0 1.0 1.0 0.0 1.0 1.0 Z" },
	                    "path": "M0.0 0.0 L300.0 300.0 Z"
	                } ],
	            "reg": [ 0.0, 0.0 ]
	        }, {
	            "id": "C735334645026C702621DFE327135CF5",
	            "name": "Rectangle",
	            "band": [ 1.0, 11.0 ],
	            "element": {
	                "id": "A32597510B7F8D5AB01BFC26EA58EF8E",
	                "type": "Rectangle",
	                "stroke": { "width": 4.0, 
                                "color": "green",
	                            "cap": "round",
	                            "join": "round" },
	                "fill": { "color": "blue" },
	                "path": "M0.0 0.0 L50.0 0.0 L50.0 50.0 L0.0 50.0 L0.0 0.0 Z"
	            },
	            "outline-color": "blue",
	            "tweens": [ {
	                    "type": "Scale",
	                    "band": [ 0.0, 1.0 ],
	                    "data": [ 0.2, 0.2, 1.0, 1.0 ]
	                }, {
	                    "type": "Scale",
	                    "band": [ 1.0, 5.0 ],
	                    "data": [ 1.0, 1.0, 2.0, 2.0 ]
	                }, {
	                    "type": "Scale",
	                    "band": [ 5.0, 10.0 ],
	                    "data": [ 2.0, 2.0, 1.0, 1.0 ]
	                }, {
	                    "type": "Translate",
	                    "band": [ 0.0, 10.0 ],
	                    "easing": { "name": "Ease In Out" },
	                    "path": "M0.0 100.0 C150.0 0.0 150.0 30.0 200.0 30.0 C250.0 30.0 400.0 50.0 400.0 100.0 C400.0 150.0 250.0 300.0 200.0 300.0 C150.0 300.0 160.0 100.0 0.0 100.0 Z"
	                }, {
	                    "type": "Alpha",
	                    "band": [ 0.0, 2.0 ],
	                    "data": [ 0.0, 1.0 ]
	                }, {
	                    "type": "Alpha",
	                    "band": [ 2.0, 8.0 ],
	                    "data": [ 1.0, 1.0 ]
	                }, {
	                    "type": "Alpha",
	                    "band": [ 8.0, 10.0 ],
	                    "data": [ 1.0, 0.0 ]
	                }, {
	                    "type": "rotate-to-path",
	                    "band": [ 0.0, 10.0 ]
	                } ],
	            "reg": [ 25.0, 50.0 ]
	        } ] }
	    ] }
    };
