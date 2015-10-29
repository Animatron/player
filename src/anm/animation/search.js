function Search(spec) {
    this.selector = spec.selector;
    this.multiple = spec.multiple;
    this.anywhere = (spec.selector[0] !== '/'); // search on all levels with one token
    this.tokens = (spec.selector[0] === '/') ? spec.selector.split('/').slice(1) : [ spec.selector ];
};
Search.prototype.over = function(named) {
    if (!this.multiple &&  this.anywhere) return search_one_anywhere(named, this.tokens[0]);
    if ( this.multiple &&  this.anywhere) return search_all_anywhere([], named, this.tokens[0]);
    if (!this.multiple && !this.anywhere) return search_one_by_path(named, this.tokens);
    if ( this.multiple && !this.anywhere) return search_all_by_path([], named, this.tokens);
};

function matches(named, token, idx) {
    return (((token[0] === ':') && (idx === parseInt(token.slice(1)))) ||
            (token === named.name));
}

function search_one_anywhere(named, token) {
    for (var i = 0; i < named.length; i++) {
        if (matches(named[i], token, i)) return named[i];
        var result = search_one_anywhere(named[i].children, token);
        if (result) return result;
    }
    return null;
}

function search_all_anywhere(results, named, token) {
    for (var i = 0; i < named.length; i++) {
        if (matches(named[i], token, i)) results.push(named[i]);
        search_all_anywhere(results, named[i].children, token);
    }
    return results;
}

function search_one_by_path(named, tokens, level) {
    level = level || 0;
    if ((tokens.length === 0) || (level >= tokens.length)) return null;
    var token = tokens[level];
    var lastLevel = (level === (tokens.length - 1));
    for (var i = 0; i < named.length; i++) {
        if (matches(named[i], token, i)) {
            if (lastLevel) return named[i];
            else {
                var result = search_one_by_path(named[i].children, tokens, level + 1);
                if (result) return result;
            }
        }
    }
    return null;
}

function search_all_by_path(results, named, tokens, level) {
    level = level || 0;
    if ((tokens.length === 0) || (level >= tokens.length)) return results;
    var token = tokens[level];
    var lastLevel = (level === (tokens.length - 1));
    for (var i = 0; i < named.length; i++) {
        if (matches(named[i], token, i)) {
            if (lastLevel) results.push(named[i]);
            else search_all_by_path(results, named[i].children, tokens, level + 1);
        }
    }
    return results;
}

Search.one = function(selector) {
    return new Search({
        selector: selector,
        multiple: false
    });
}

Search.all = function(selector) {
    return new Search({
        selector: selector,
        multiple: true
    });
}

module.exports = Search;
