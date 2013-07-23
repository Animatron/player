// Part of OpenPhantomScripts
// http://github.com/mark-rushakoff/OpenPhantomScripts

// Copyright (c) 2012 Mark Rushakoff

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// (slightly modified by shaman.sir for project needs)

var fs = require("fs");
var args, url, lengthOkay, appName, system;
var specs_to_run;
try {
    system = require("system");
    // if we got here, we are on PhantomJS 1.5+
    args = system.args;
    lengthOkay = (args.length >= 2);
    appName = args[0];
    url = args[1];
    specs_to_run = (args.length > 2) ? args[2] : '*';
} catch (e) {
    // otherwise, assume PhantomJS 1.4
    args = phantom.args;
    lengthOkay = (args.length >= 1);
    appName = 'phantom-jasmine.js'
    url = args[0];
    specs_to_run = (args.length > 1) ? args[1] : '*';
}

if (!lengthOkay) {
    printError("Usage: " + appName + " URL");
    phantom.exit(1);
}

function printError(message) {
    fs.write("/dev/stderr", message + "\n", "w");
}

var page = require("webpage").create();
console.log('Specs to run: ' + specs_to_run);

page.onConsoleMessage = function(message) {
    if (message == "__error__") {
        phantom.exit(1);
    } else if (message == "__done__") {
        // a trick to get phantom context back (see "console.log('__done__')" below)
        var results = page.evaluate(function() { return window.__jasmineResults; });
        console.log('Exit code: ' + results.numFailed);
        phantom.exit(results.numFailed);
    } else {
        console.log(message);
    }
}

page.open(url, function(success) {
    if (success === "success") {
        console.log('Opened ' + url);

        page.evaluate(function(s_t_r) {
            if (!run_tests) {
                printError("Page should define run_tests function in a way: function run_tests(on_finish, phantom)");
                console.log("__error__");
            }

            window.__anm_force_window_scope = true;

            run_tests(function(results) {
                window.__jasmineResults = results;
                console.log("__done__");
                //_phantom.exit(0);
            }, s_t_r);
        }, specs_to_run);

        /*setInterval(function() {
            if (page.evaluate(function() {return window.phantomComplete;})) {
                var failures = page.evaluate(function() {return window.phantomResults.numFailed;});
                phantom.exit(failures);
            }
        }, 250);*/
    } else {
        printError("Failure opening " + url);
        phantom.exit(1);
    }
});