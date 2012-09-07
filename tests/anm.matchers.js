/*
 * Copyright (c) 2011-2012 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

var _matchers = (function() {

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

return matchers;

})();