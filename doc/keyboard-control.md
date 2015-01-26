# Let User Control the Scene with Keyboard

Scripting & Interactivity are in the progress in Animatron for the moment of
writing this article, but some scenarios are possible to code with Animatron Player
even now.

If you need to let user switch some layer to be visible by keypress,
it is possible and easy to do.

First, you need to prepare your Project in the Animatron Editor itself.

You need to create a project with at least two shapes — they both will switch their
visibility on keypress, but one will be visible at start and second will one will
appear later. Say, the first one is a rectangle and the second one is circle.
So, rectangle is visible at first.

In the Editor, turn off the visibility of the layer with a circle shape, then click
it the layer with the right mouse button and you'll see _Export_ item in the context menu.
It's a checkbox — so feel free to check it. This way the circle layer will be exported to Player
but won't be visible at start (by default, all of the invisible layers are not exported).

Ensure lifetime of both layers starts at 0 seconds of a project and ends at the same
time when the project ends.

Also, name the layers as _Rectange_ and _Circle_ correspondingly, so it will be
easy for you to access them from Player.

Check the `LOOP` checkbox in the Project Inspector, so animation will wait for user
input indefinitely.

Now, publish your project to create a snapshot, a saved state. You'll get a URL
like:

`http://clips.animatron.com/ffe8465956b7a0eb21084e99107a32a1`

Add `.json` to it, and what you'll see is a carefully encoded state of your project.

We may forget about the Editor now and switch to Player and JavaScript.

Add this to the head of your HTML5-page:

```html
<script type="text/javascript" src="http://player.animatron.com/latest/bundle/animatron.min.js"></script>
```

Since then, you may use the Animatron Player inside this page.

Add a target to render a Player there:

```html
<div id="target"></div>
```

The code to load this snapshot is rather easy, but since it is the remote project,
loading is asynchronous, so we need to add a callback and perform our action only after the
snapshot will be completely received. Let's write it first:

```javascript
function whenSnapshotReceived() {
    var animation = player.anim;
    // `find` method returns an array of found elements,
    // so in both cases we take the first one, it's our single shape
    var rectangle = animation.find('Rectangle')[0];
    var circle = animation.find('Circle')[0];
    // what to do when any key is pressed:
    // (constants for events are stored in anm.C object, in new Player API
    // this way of handling will be simplified, but for now it acts like this)
    player.anim.on(anm.C.X_KPRESS, function(evt) {
        // change the state of the elements to the inverse
        // (you may check `evt.key` for a code of a pressed key)
        rectangle.disabled = !rectangle.disabled;
        circle.disabled = !circle.disabled;
    });
    // now we subscribed to events, it's ok to play
    player.play();  
}
```

It's time load the snapshot inside:

```javascript
var player = anm.Player.forSnapshot(
    'target', // `id` of an element to render into
    'http://clips.animatron.com/ffe8465956b7a0eb21084e99107a32a1.json', // snapshot URL
    anm.importers.create('animatron'), // importer which converts snapshot to player format
    whenSnapshotReceived, { // call our function when snapshot will be received
        width: 550, // width of a project
        height: 450, // height of a project
        controlsEnabled: false, // controls should be disabled to let player handle
                                // events correctly  
        handleEvents: true // enable listening for user events, which is off by default
        // repeat: true // if you haven't set the LOOP flag in Animatron, you may enable
                        // repeating here
    }
);
```

**Important notice**: HTML does not allows handling just any events without having
a focus on a listening element (and it's rather secure indeed), so to see the effect you
should _move mouse over the Player_, to give it a focus, and if your browser is friendly,
you'll see a border indicating that the Player has focus there, and now you may press any
keys! If you don't like the way this border looks and want to remove it, add
`#target:focus { outline: 0; }` to your CSS.

[Here's the example in action](http://codepen.io/shamansir/pen/qEjwpr?editors=101), move
your mouse over the Player and press some key to see the effect.
