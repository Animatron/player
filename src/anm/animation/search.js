function Search(spec) {
    this.selector = spec.selector;
    this.multiple = spec.multiple;
    this.anywhere = (spec.selector[0] !== '/'); // search on all levels with one token
    this.tokens = (spec.selector[0] === '/') ? spec.selector.split('/').slice(1) : [ spec.selector ];
};
Search.prototype.over = function(elements) {
    if (!this.multiple &&  this.anywhere) return search_one_anywhere(elements, this.tokens[0]);
    if ( this.multiple &&  this.anywhere) return search_all_anywhere([], elements, this.tokens[0]);
    if (!this.multiple && !this.anywhere) return search_one_by_path(elements, this.tokens);
    if ( this.multiple && !this.anywhere) return search_all_by_path([], elements, this.tokens);
};

function matches(element, token, idx) {
    return (((token[0] === ':') && (idx === parseInt(token.slice(1)))) ||
            (token === element.name));
}

function search_one_anywhere(elements, token) {
    for (var i = 0; i < elements.length; i++) {
        if (matches(elements[i], token, i)) return elements[i];
        var result = search_one_anywhere(elements[i].children, token);
        if (result) return result;
    }
    return null;
}

function search_all_anywhere(results, elements, token) {
    for (var i = 0; i < elements.length; i++) {
        if (matches(elements[i], token, i)) results.push(elements[i]);
        search_all_anywhere(results, elements[i].children, token);
    }
    return results;
}

function search_one_by_path(elements, tokens, level) {
    level = level || 0;
    if ((tokens.length === 0) || (level >= tokens.length)) return null;
    var token = tokens[level];
    var lastLevel = (level === (tokens.length - 1));
    for (var i = 0; i < elements.length; i++) {
        if (matches(elements[i], token, i)) {
            if (lastLevel) return elements[i];
            else {
                var result = search_one_by_path(elements[i].children, tokens, level + 1);
                if (result) return result;
            }
        }
    }
    return null;
}

function search_all_by_path(results, elements, tokens, level) {
    level = level || 0;
    if ((tokens.length === 0) || (level >= tokens.length)) return results;
    var token = tokens[level];
    var lastLevel = (level === (tokens.length - 1));
    for (var i = 0; i < elements.length; i++) {
        if (matches(elements[i], token, i)) {
            if (lastLevel) results.push(elements[i]);
            else search_all_by_path(results, elements[i].children, tokens, level + 1);
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
