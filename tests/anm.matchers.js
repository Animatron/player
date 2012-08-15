var _matchers = (function() {

var matchers = {};

matchers.toHaveBeenCalledOnce = function() {
    this.toHaveBeenCalled();

    this.message = function() {
        return [
            "Expected spy " + this.actual.identity + " to have been called " +
               "only single time, but was called " + this.actual.calls.length + ".",
            "Expected spy " + this.actual.identity + " not to have been called " +
               "only single time, but was called " + this.actual.calls.length + "."
        ];
    };

    return (this.actual.calls.length === 1);
};

return matchers;

})();