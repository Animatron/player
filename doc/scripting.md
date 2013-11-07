# Scripting

## Introduction

Scripting will add to your animation an ability to react on input events, such as a _mouse clicks_ or _key presses_. For example, you can make your cat animation to follow your mouse cursor or open a web page if user clicks at a certain object. Ok, now let's go to...

## The Basics

To add a handler for the specific input event, you should first decide what kind of event you need. Here is a list of currently supported mouse events:

* Click — User clicked (pressed & released left mouse button) at the object
* Press — User pressed left mouse button within object bounds
* Release — User released left mouse button within object bounds
* Enter — User moved mouse and it's entered an object shape
* Leave — User moved mouse and it's left an object shape
* Move — User moved mouse somewhere inside a canvas

And keyboard events:

* Type — User typed a character (pressed and released a key)
* Press — User pressed a key
* Release — User released a key

Ok now you know which one you need and we're ready to implement a...

## Handler

Handlers are just predefined functions which looks something like this:

	function onClick(ctx, evt, t) {
		// your code
	}

We're done all the dirty work, so all you need is write a body of the handler function. But before that you should know something about how things are organized in the Player world.

## Elements

Elements are core building blocks of the Player. If you see something it's an Element. Even something you can't see (like Audio tracks) is an element. Scenes (a group of animated elements) are elements too.

Elements are organized hierarchically (some elements may contain another elements and so on) into Scenes. And there is always a Root scene.

Elements has a shape, a border and a shadow. They also have a Pivot—a point they rotates around, an Alpha—determines their transparency and other properties which are described in detail in [Full Player API documentation](http://animatron.com/player/doc/API.html).

Now we know something about building blocks but how the world goes alive?

## Tweens

Tweens are changes. If you see something is changing this means that there is a Tween somewhere which describes that change.

For example, if an object moves from one side of the canvas to another there is a tween of type TRANSLATE (i.e. current object coordinates are translated to coordinates of an other side of the canvas). If an object changes its opacity there is a tween of type ALPHA. If it rotates there is a tween of type ROTATE and so on. Even Audio tracks use tweens: for volume management.

But what is a Tween? Tween it's a pair (or a sequence) of values which are determines the state of some of Element property at the beginning and at the end of the transition. For example, to make an object invisible we should create an Alpha tween with start value 1.0 (completely visible) and end value 0.0 (completely invisible): `[1.0, 0.0]` and choose when this transition should happen, i.e choose a start and end time for it:

	{
		type: C.T_ALPHA, // ALPHA tween
		band: [0, 5],    // start at 0 sec and end at 5 sec
		data: [1, 0]     // from Visible (1) to Invisible (0)
	}

Well, now we know something about Elements and Tweens and can write our first handler.

## Handler example

In this example we well add a handler which will rotate an object 360 degrees and then rotate it back. We will assign this handler on mouse CLICK event so every time user will click on the object it will rotate:

	function onClick(ctx, evt, t) {
		this.$.addTween({                           // 1
			type: C.T_ROTATE,
			band: [t, t + 1.0],                 // 2
			data: [0, 360]                      // 3
		});

		this.$.addTween({
			type: C.T_ROTATE,
			band: [t + 1.0, t + 2.0],           // 4
			data: [360, 0]
		});
	};

1. `this.$` is a current object (Element), `addTween` is a method of Element which defines a new tween
2. `t` is always a current time. So, `t + 1.0` will be "now plus 1 second"
3. `[0, 360]` is a tween start and end: 0 to 360 degrees
4. Will assume our object is rotating forth and then back so should wait until it will rotate forth first so start our second (back) tween at "current time plus 1 second" and end it at "current time plus 2 seconds"



