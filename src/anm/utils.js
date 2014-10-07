var is = require('./is.js'),
    SystemError = require('./errors.js').SystemError;

function fmt_time(time) {
  if (!is.finite(time)) return '∞';
  var absTime = Math.abs(time),
      h = Math.floor(absTime / 3600),
      m = Math.floor((absTime - (h * 3600)) / 60),
      s = Math.floor(absTime - (h * 3600) - (m * 60));

  return ((time < 0) ? '-' : '') +
          ((h > 0)  ? (((h < 10) ? ('0' + h) : h) + ':') : '') +
          ((m < 10) ? ('0' + m) : m) + ':' +
          ((s < 10) ? ('0' + s) : s)
}

function ell_text(text, max_len) {
    if (!text) return '';
    var len = text.length;
    if (len <= max_len) return text;
    var semilen = Math.floor(_len / 2) - 2;
    return text.slice(0, semilen) + '...'
         + text.slice(len - semilen);
}

// ### Internal Helpers
/* -------------------- */

// map back to functions for faster access (is it really so required?)

// #### mathematics

function compareFloat(n1, n2, precision) {
    if (!(precision === 0)) {
        precision = precision || 2;
    }
    var multiplier = Math.pow(10, precision);
    return Math.round(n1 * multiplier) ==
           Math.round(n2 * multiplier);
}

function roundTo(n, precision) {
    if (!precision) return Math.round(n);
    //return n.toPrecision(precision);
    var multiplier = Math.pow(10, precision);
    return Math.round(n * multiplier) / multiplier;
}

function interpolateFloat(a, b, t) {
    return a*(1-t)+b*t;
}

// #### other

function paramsToObj(pstr) {
    var o = {}, ps = pstr.split('&'), i = ps.length, pair;
    while (i--) { pair = ps[i].split('='); o[pair[0]] = pair[1]; }
    return o;
}

// for one-level objects, so no hasOwnProperty check
function obj_clone(what) {
    var dest = {};
    for (var prop in what) {
        dest[prop] = what[prop];
    }
    return dest;
}

function mrg_obj(src, backup, trg) {
    if (!backup) return src;
    var res = trg || {};
    for (var prop in backup) {
        res[prop] = is.defined(src[prop]) ? src[prop] : backup[prop]; };
    return res;
}

function strf(str, subst) {
    var args = subst;
    return str.replace(/{(\d+)}/g, function(match, number) {
      return is.defined(args[number])
        ? args[number]
        : match
      ;
    });
}

// collects all characters from string
// before specified char, starting from start
function collect_to(str, start, ch) {
    var result = '';
    for (var i = start; str[i] !== ch; i++) {
        if (i === str.length) throw new SystemError('Reached end of string');
        result += str[i];
    }
    return result;
}


function guid() {
   return Math.random().toString(36).substring(2, 10) +
          Math.random().toString(36).substring(2, 10);
}

module.exports = {
    fmt_time: fmt_time,
    ell_text: ell_text,
    compareFloat: compareFloat,
    roundTo: roundTo,
    interpolateFloat: interpolateFloat,
    paramsToObj: paramsToObj,
    obj_clone: obj_clone,
    mrg_obj: mrg_obj,
    strf: strf,
    collect_to: collect_to,
    guid: guid
};
