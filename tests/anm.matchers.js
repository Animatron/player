/*
 * Copyright (c) 2011-2013 by Animatron.
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

var _anm_window = anm.__dev._win;

var _matchers = {};

_matchers.calls = (function() {

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

_matchers.comparison = (function() {

    var matchers = {};

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

_matchers.size = (function() {

    var matchers = {};

    matchers.toHaveSizeDefined = function() {
        var actual = this.actual;
        var notText = this.isNot ? " not" : "";

        this.message = function () {
            return "Expected " + actual + notText + " to have size defined";
        }

        return (typeof actual.width !== 'undefined') &&
               (typeof actual.height !== 'undefined') &&
               (typeof actual.getAttribute('width') !== 'undefined') &&
               (typeof actual.getAttribute('height') !== 'undefined') &&
               (typeof actual.style.width !== 'undefined') &&
               (typeof actual.style.height !== 'undefined');
    }

    matchers.toHaveSize = function(expected) {
        var actual = this.actual;
        var notText = this.isNot ? " not" : "";

        var pxRatio = _anm_window().devicePixelRatio || 1;

        this.message = function () {
            return "Expected " + actual + notText + " to have size equal to " + expected + ", " +
                   "but it has " + actual.getAttribute('width') + "x" + actual.getAttribute('height') + " " +
                   "and " + actual.style.width + ":" + actual.style.height + " in CSS";
        }

        return (actual.getAttribute('width')  == (expected[0] * pxRatio)) &&
               (actual.getAttribute('height') == (expected[1] * pxRatio)) &&
               (actual.style.width  == (expected[0] + 'px')) &&
               (actual.style.height == (expected[1] + 'px'));
    }

    return matchers;

})();

_matchers.time = (function() {

    var matchers = {};

    matchers.toHappenIn = function(t_cmp, expected) {
        if (!t_cmp) throw new Error('Time comparison function is not defined')
        var actual = this.actual;
        var notText = this.isNot ? " not" : "";

        var result = t_cmp(actual, expected);
        var resultStr = "";
        if (result === 0) resultStr = "equal";
        else if (result < 0) resultStr = "less than";
        else if (result > 0) resultStr = "greater than";

        this.message = function () {
            return "Expected t == " + actual + notText + " to happen at " + expected + ", " +
                   "but it appeared to be " + resultStr + " instead";
        }

        return (result === 0);
    }

    matchers.toHappenBefore = function(t_cmp, expected) {
        if (!t_cmp) throw new Error('Time comparison function is not defined')
        var actual = this.actual;
        var notText = this.isNot ? " not" : "";

        var result = t_cmp(actual, expected);
        var resultStr = "";
        if (result === 0) resultStr = "equal";
        else if (result < 0) resultStr = "less than";
        else if (result > 0) resultStr = "greater than";

        this.message = function () {
            return "Expected t == " + actual + notText + " to happen before time " + expected + ", " +
                   "but it appeared to be " + resultStr + " instead";
        }

        return (result < 0);
    }

    matchers.toHappenAfter = function(t_cmp, expected) {
        if (!t_cmp) throw new Error('Time comparison function is not defined')
        var actual = this.actual;
        var notText = this.isNot ? " not" : "";

        var result = t_cmp(actual, expected);
        var resultStr = "";
        if (result === 0) resultStr = "equal";
        else if (result < 0) resultStr = "less than";
        else if (result > 0) resultStr = "greater than";

        this.message = function () {
            return "Expected t == " + actual + notText + " to happen after time " + expected + ", " +
                   "but it appeared to be " + resultStr + " instead";
        }

        return (result > 0);
    }

    return matchers;

})();