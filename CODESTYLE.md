All of the following are just recommendations for your Pull Request code to keep everything in the same style. Of course, it's more important that your code should work, and of course you may apply these recommendations later, after Pull Request was merged. But anyway code should look consistent and to be easy to read for all participants:

### General

* Only vanilla JS here;
* We do promise that at some point `player.js` will finally be split into several files for easier navigation and managing (fingers crossed :) );
* If you haven't read something like [JavaScript Garden](http://bonsaiden.github.io/JavaScript-Garden/) (and since ES6 is still not there), please read or remind yourself of listed things.
* [Dart style guide](https://www.dartlang.org/articles/style-guide/) is quite good, even though it's about Dart and we have no such hipster things in vanilla JS.

### Indentation & Characters

* Use only spaces to indent;
* No strict character limit was used in general, just try to stay somewhere in around 120 characters, but feel free to use more if you need;
* If current code block is deep-nested, say, more than 4 levels, or it has some long lines — prefer 2-space indent, if not — 4-space. Though in the code you may find different indentation in different cases, preferred one is 4-space. Do not indent the same code block differently;
* Use spaces smartly a lot, to line things up and all other stuff and especially for mathematical/conditinal expressions, including a ternary operator. Like `if (a > (b + (c + d))) { ... }` or `a ? 0 : 1`, `for (var i = 0; i < 100; i++) { ...`, `while (...)`, `catch (...)`;

### Syntax

* `for-in` is intended to loop only over plain objects, not arrays! `map`, `flatMap` or `reduce` currently were not monkey-patched to arrays also, so we use plain old hardcore loops, why not? Maybe we'll add some of them later, since they are quite handy, you may even feel free to add them as utility functions, but be sure to replace the other parts of a code to use them, if you do so;
* Keep an eye on semi-colons, use them a lot where they are required, especially for `return` expressions. It's not required to end functions with semi-colon, though;
* If you know your object is plain (`{}`) or has no parents, it's completely ok not to check `hasOwnProperty` in loops. Monkey-patching is still happening these times, but we're trying not to make criminals feel very safe :).
* Use curly-braces everywhere even if you suppose they are optional;
* One-liner conditions or even functions are ok (when they have all of their curly-braces), if they don't exceed 60-or-so characters. If they take more than 3 lines being beautifully splitted in lines, something is probably wrong;

### Naming

* Unfortunately, no strict naming rules were used for this moment, but in general the rule is: `lowerCamelCase` for methods, `UpperCamelCase` for classes, `lower_case_with_underscores` for utility functions, variables and file names, `ALL_CAPS_WITH_UNDERSCORES` for constants. Shorter names (but the ones giving idea) are more welcome than long ones, especially Java-like ones. Exceptions may appear;
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


