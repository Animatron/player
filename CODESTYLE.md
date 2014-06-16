<style type="text/css">
    .positive { color: #006600; }
    .negative { color: #ff0000; }
    .neutral  { color: #cccc00; }
    pre { border: 1px solid #ddd;
          padding: 5px;
          overflow-y: scroll; }
</style>

All of the following are just recommendations for your Pull Request code to keep everything in the same style. Of course, it's more important that your code should work, and of course you may apply these recommendations later, after Pull Request was merged. But anyway code should look consistent and to be easy to read for all participants:

### General

Only vanilla JS here.

<span class="negative">No:</span>

    square = (x) -> Math.sqrt x

<span class="positive">Yes:</span>

    var square = function(x) { return x * x; };

We do promise that at some point `player.js` will finally be split into several files for easier navigation and managing (fingers crossed :) ).

If you haven't read something like [JavaScript Garden](http://bonsaiden.github.io/JavaScript-Garden/) (and since ES6 is still not there), please read or remind yourself of listed things.

[Dart style guide](https://www.dartlang.org/articles/style-guide/) is quite good, even though it's about Dart and we have no such hipster things in vanilla JS.

### Indentation & Characters

Use only _spaces_ to indent.

<span class="negative">No:</span>

    var square_root = function(x) {
    ↦---if (x < 0) {
    ↦---↦---throw new Error('Enough of negativity, I kindly ask you!');
    ↦---}
    ↦---return Math.sqrt(x);
    }

<span class="positive">Yes:</span>

    var square_root = function(x) {
    ····if (x < 0) {
    ········throw new Error('Enough of negativity, I kindly ask you!');
    ····}
    ····return Math.sqrt(x);
    }

No strict character limit was used in general, just try to stay somewhere in around 120 characters, but feel free to use more if you need (not more than 669).

<span class="negative">No:</span>

    throw new Error('Warning: If you are reading this then this warning is for you. Every word you read of this useless fine print is another second off your life. Don't you have other things to do? Is your life so empty that you honestly can't think of a better way to spend these moments? Or are you so impressed with authority that you give respect and credence to all that claim it? Do you read everything you're supposed to read? Do you think every thing you're supposed to think? Buy what you're told to want? Get out of your apartment. Meet a member of the opposite sex. Stop the excessive shopping and masturbation. Quit your job. Start a fight. Prove you're alive. If you don't claim your humanity you will become a statistic. You have been warned.');

<span class="positive">Yes:</span>

    throw new Error('You buy furniture. You tell yourself, this is the last sofa ' +
                    'I will ever need in my life. Buy the sofa, then for a couple years ' +
                    'you\'re satisfied that no matter what goes wrong, at least you\'ve got ' +
                    'your sofa issue handled. Then the right set of dishes. ' +
                    'Then the perfect bed. The drapes. The rug. Then you're trapped in ' +
                    'your lovely nest, and the things you used to own, now they own you.');

If current code block is deep-nested, say, more than 4 levels, or it has some long lines — prefer 2-space indent, if not — 4-space. Though in the code you may find different indentation in different cases, preferred one is 4-space. Do not indent the same code block differently

<span class="negative">No:</span>

    var square_root = function(x) {
        try {
          if (x < 0) {
              throw new Error('Enough of negativity, I kindly ask you!');
          }
          return Math.sqrt(x);
        } catch(e) {
            throw e;
        }
    }

<span class="negative">No:</span>

    var square_root = function(x) {
        try {
            try {
                if (x < 0) {
                    try {
                        throw new Error('Enough of negativity, I kindly ask you!');
                    } catch(e) {
                        throw e;
                    }
                }
                return Math.sqrt(x);
            } catch(e) {
                throw e;
            }
        } catch(e) {
            throw e;
        }
    }

<span class="neutral">OK:</span>

    var square_root = function(x) {
      try {
        if (x < 0) {
          throw new Error('Enough of negativity, I kindly ask you!');
        }
        return Math.sqrt(x);
      } catch(e) {
        throw new e;
      }
    }

<span class="neutral">OK, but spaghetti-like:</span>

    var square_root = function(x) {
      try {
        try {
          if (x < 0) {
            try {
              throw new Error('Enough of negativity, I kindly ask you!');
            } catch(e) {
              throw e;
            }
            return Math.sqrt(x);
          }
        } catch(e) {
          throw e;
        }
      } catch(e) {
        throw e;
      }
    }

<span class="positive">Yes:</span>

    var square_root = function(x) {
        try {
            if (x < 0) {
                throw new Error('Enough of negativity, I kindly ask you!');
            }
            return Math.sqrt(x);
        } catch(e) {
            throw new e;
        }
    }

Use spaces smartly a lot, to line things up and all other stuff and especially for mathematical/conditinal expressions, including a ternary operator. Like `if (a > (b + (c + d))) { ... }` or `a ? 0 : 1`, `for (var i = 0; i < 100; i++) { ...`, `while (...)`, `catch (...)`

<span class="negative">No:</span>

    if(foo+(42-16)) {return bar? 1: -1;}

<span class="positive">Yes:</span>

    if (foo + (42 - 16)) { return bar ? 1 : -1; }

### Syntax

Please put curly-braces on the same line with expression:

<span class="negative">No:</span>

    function square_root(x)
    {
        if (x < 0)
        {
            throw new Error('Enough of negativity, I kindly ask you!');
        }
        return Math.sqrt(x);
    }

<span class="positive">Yes:</span>

    function square_root(x) {
        if (x < 0) {
            throw new Error('Enough of negativity, I kindly ask you!');
        }
        return Math.sqrt(x);
    }

If you know your object is plain (`{}`) or has no parents, it's completely ok not to check `hasOwnProperty` in loops. Monkey-patching is still happening these times, but we're here trying not to make criminals feel very safe :).

<span class="neutral">OK:</span>

    var my_plain_obj = { 'foo': 42 };
    for (var key in my_plain_obj) {
        if (my_plain_obj.hasOwnProperty(key)) { console.log(key, my_plain_obj[i]); }
    }

<span class="positive">Yes:</span>

    var my_plain_obj = { 'foo': 42 };
    for (var key in my_plain_obj) {
        console.log(key, my_plain_obj[i]);
    }

`for-in` is intended to loop only over plain objects, not arrays! `map`, `flatMap` or `reduce` currently were not monkey-patched to arrays also, so we use plain old hardcore loops, why not? Maybe we'll add some of them later, since they are quite handy, you may even feel free to add them as utility functions, but be sure to replace the other parts of a code to use them, if you do so.

<span class="negative">No:</span>

    var my_arr = [5, 7, 8];
    for (var i in my_arr) {
        console.log(i, my_arr[i]);
    }

<span class="positive">Yes:</span>

    var my_arr = [5, 7, 8];
    for (var i = 0, len = my_arr.length; i < len; i++) {
        console.log(i, my_arr[i]);
    }

<span class="positive">Yes:</span>

    var my_plain_obj = { 'foo': 42 };
    for (var key in my_plain_obj) {
        console.log(key, my_plain_obj[key]);
    }

<span class="positive">Yes, in some future:</span>

    var my_arr = [5, 7, 8];
    map(my_arr, function(item, idx) { console.log(idx, item); });

Keep an eye on semi-colons, use them a lot where they are required, especially for `return` expressions. It's not required to end functions with semi-colon, though

Use curly-braces everywhere even if you suppose they are optional

<span class="negative">No:</span>

    function square_root(x) {
        if (x < 0) return NaN;
        return Math.sqrt(x);
    }

<span class="positive">Yes:</span>

    function square_root(x) {
        if (x < 0) { return NaN; }
        return Math.sqrt(x);
    }

One-liner conditions or even functions are ok (when they have all of their curly-braces), if they don't exceed 60-or-so characters. If they take more than 3 lines being beautifully splitted in lines, something is probably wrong;

### Naming

Unfortunately, no strict naming rules were used for this moment, but in general the rule is: `lowerCamelCase` for methods, `UpperCamelCase` for classes, `lower_case_with_underscores` for utility functions, variables and file names, `ALL_CAPS_WITH_UNDERSCORES` for constants. Shorter names (but the ones giving idea) are more welcome than long ones, especially Java-like ones. Exceptions may appear.

<span class="negative">No:</span>

    var the_pi = 3.14;
    function TO_DEGREES(Radians) {
        var tmp =
        return tmp;
    }
    function degrees_calculator() {
        this.val = null;
    }
    degrees_calculator.prototype.calculate = function(VALUE) {
        // all this stupid, yeah, but it's just an example of good syntax, not good code
        this.val = VALUE;
        return VALUE * (180 / the_pi);
    }

<span class="positive">Yes:</span>

    var THE_PI = 3.14;
    function to_degrees(radians) {
        var tmp =
        return tmp;
    }
    function DegreesCalculator() {
        this.val = null;
    }
    DegreesCalculator.prototype.calculate = function(value) {
        // all this looks stupid, yeah, but it's just an example of good syntax, not good code
        this.val = value;
        return value * (180 / THE_PI);
    }

* Grouping variables by theme is ok, but no left-comma technique is used because it looks weird :), just be attentive;

### Classes

* More public fields, less private fields;
* Currently, no inheritance is used at all. There are just several basic classes: `Player`, `Scene` (which will be renamed to `Animation` at some point), `Path`, `Brush`, `Sheet`.... It's better to keep it this way, actually in case of animation player there's not so many things to inherit — if you see some potential inheritance, use composition instead;
* If your function/method code exceeds 30 lines of code, consider to either split it into smaller functions or to split it in smaller blocks along with providing some comments for each block.
* Avoid classes for two or three functions to work with you data, use plain functions (may be with some prefix) and plain objects (`{}`) instead. Of course, exceptions may occur.
* Avoid classes intended only to have static methods, use plain objects for that. Of course, exceptions may occur.
* If you need to pass some small bunch of static data with not a huge number of functions to work with, prefer not to use class, use plain object instead `{}`;
* Use static methods if you feel that your function belongs to all objects of the corresponding type;

### Functions & Closures

* Immediate return at the start of a function (since JS is not so very immutable language), is [welcomed](http://stackoverflow.com/questions/36707/should-a-function-have-only-one-return-statement), if it works as a simple null- or type-check. Returning something deeply in the code is not so welcomed, but also ok.
* Closures are very cool, immediately-executed closures are also cool, but keep in mind that closures may hoist variables from outside — so if code looks complex or it may take memory for some large object, use static methods or predefined functions; you'll find some places in the code


