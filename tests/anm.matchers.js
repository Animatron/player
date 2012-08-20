var _matchers = (function() {

var matchers = {};

matchers.toHaveBeenCalledOnce = function() {

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

matchers.toHaveBeenCalledHereWrittenAmountOfTimes = function(num) {

    this.message = function() {
        return [
            "Expected spy " + this.actual.identity + " to have been called " +
               num + " times, but it was called " + this.actual.calls.length + ".",
            "Expected spy " + this.actual.identity + " not to have been called " +
               num + " times, but it was called " + this.actual.calls.length + "."
        ];
    };

    return (this.actual.calls.length === 1);
};

return matchers;

})();