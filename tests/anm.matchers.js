/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

// Patch createSpy with improvements

/* var originalCreateSpy = jasmine.createSpy,
    improvedCreateSpy = function(name) {
        var actualSpy = originalCreateSpy(name);
        var improvedSpyObj = function() {
            var result = actualSpy.apply(this, arguments);
            actualSpy.mostRecentCall.performedAt = new Date();
            return result;
        };

        // FIXME: it creates a duplicate object
        var spy = new jasmine.Spy(name);

        for (var prop in spy) {
            improvedSpyObj[prop] = spy[prop];
        }

        improvedSpyObj.reset();

        return improvedSpyObj;
    };

jasmine.createSpy = improvedCreateSpy; */

var _matchers = (function() {

// Matchers

var matchers = {};

matchers.toHaveBeenCalledOnce = function() {

    if (!jasmine.isSpy(this.actual)) {
        throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
    }

    this.message = function() {
        return [
            "Expected spy " + this.actual.identity + " to have been called " +
               "single time, but it was called " + this.actual.calls.length + ".",
            "Expected spy " + this.actual.identity + " not to have been called " +
               "single time, but it was called " + this.actual.calls.length + "."
        ];
    };

    return (this.actual.calls.length === 1);
};

// FIXME: replace with expect(spy.callCount).toBe(num)
matchers.toHaveBeenCalledThisAmountOfTimes = function(num) {

    //if (!num) throw new Error('Use .not.toHaveBeenCalled');

    if (!jasmine.isSpy(this.actual)) {
        throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
    }

    this.message = function() {
        return [
            "Expected spy " + this.actual.identity + " to have been called " +
               num + " times, but it was called " + this.actual.calls.length + ".",
            "Expected spy " + this.actual.identity + " not to have been called " +
               num + " times, but it was called " + this.actual.calls.length + "."
        ];
    };

    return (this.actual.calls.length === num);
};

matchers.toBeLessThanOrEqual = function(expected) {
    var actual = this.actual;
    var notText = this.isNot ? " not" : "";

    this.message = function () {
        return "Expected " + actual + notText + " to be less than " + expected + ", or equal to it";
    };

    return actual <= expected;
}

matchers.toBeGreaterThanOrEqual = function(expected) {
    var actual = this.actual;
    var notText = this.isNot ? " not" : "";

    this.message = function () {
        return "Expected " + actual + notText + " to be greater than " + expected + ", or equal to it";
    };

    return actual >= expected;
}

matchers.toBeEpsilonyCloseTo = function(expected, epsilon) {
    var actual = this.actual;
    var notText = this.isNot ? " not" : "";

    this.message = function () {
        return "Expected " + actual + notText + " to be greater than or equal to " +
               (expected - epsilon) + " and less or equal to " + (expected + epsilon);
    };

    return (actual >= (expected - epsilon)) && (actual <= (expected + epsilon));

}

/* matchers.toBeCalledInOrder = function() {
    var actual = this.actual;
    var notText = this.isNot ? " not" : "";

    if (!Array.isArray(actual)) throw new Error('Pass an array of spies to this matcher');

    var len = actual.length;
    if (len <= 1) {
        this.message = function() {
            return "Expected " + ((actual.length === 0) ? "[]" : actual[0].identity) + notText + " to be called in order";
        };

        return true;
    };

    function createMessage(prev, cur) {
        return function() {
            return "Expected '" + prev.identity + "'" + notText + " to be called before '" + cur.identity;
        }
    }

    for (i = 1; i < len; i++) {
        if (actual[i-1].mostRecentCall.performedAt >
              actual[i].mostRecentCall.performedAt) {
            this.message = createMessage(actual[i-1], actual[i]);
            return false;
        }
    }

    this.message = createMessage(actual[len-2], actual[len-1]);

    return true; // should be true if we are here
} */

return matchers;

})();