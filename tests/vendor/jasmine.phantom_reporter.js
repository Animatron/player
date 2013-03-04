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

(function() {

if (! jasmine) {
    throw new Exception("jasmine library does not exist in global namespace!");
}

var PhantomReporter = function(conf) {
    this.numPassed = 0;
    this.numFailed = 0;
    this.numSkipped = 0;
    this.conf = conf;
};

PhantomReporter.prototype = {

    reportRunnerStarting: function() {
        this.startTime = (new Date()).getTime();
    },

    reportSpecResults: function(spec) {
        var results = spec.results();
        if (results.skipped) {
            this.numSkipped++;
        } else if (results.passed()) {
            this.numPassed++;
        } else {
            this.numFailed++;
        }
    },

    reportRunnerResults: function() {
        var totalTime = (new Date()).getTime() - this.startTime;
        var totalTests = (this.numPassed + this.numSkipped + this.numFailed);
        console.log("Tests passed:  " + this.numPassed);
        console.log("Tests skipped: " + this.numSkipped);
        console.log("Tests failed:  " + this.numFailed);
        console.log("Total tests:   " + totalTests);
        console.log("Runtime (ms):  " + totalTime);
        if (this.conf.onFinish) {
            this.conf.onFinish({
                numPassed: this.numPassed,
                numSkipped: this.numSkipped,
                numFailed: this.numFailed,
                totalTests: totalTests,
                totalTime: totalTime
            });
        }
    }


};

// export public
jasmine.PhantomReporter = PhantomReporter;

//PlainReporter.prototype = window.jasmine.Reporter.prototype;

})();