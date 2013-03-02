function execJasmineWithSpecs(jasmineEnv, specs) {
  require(__getSpecsFiles('./spec', specs), function() {
    jasmineEnv.execute();
  });
}


function loadJasmine(window, reporters, specs) {

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  for (var i = 0; i < reporters.length; i++) {
      var reporter = reporters[i];

      jasmineEnv.addReporter(reporter);

      if (reporter.specFilter) {
        jasmineEnv.specFilter = (function(_reporter) {
          return function(spec) {
            return _reporter.specFilter(spec);
          };
        })(reporter);
     }
  }

  /*var currentWindowOnload = window.onload;

  window.onload = function() {
    if (currentWindowOnload) {
      currentWindowOnload();
    }*/
    execJasmineWithSpecs(jasmineEnv, specs);
  //};

}


function __getSpecsFiles(prefix, conf) {
  if (!_specs) throw new Error('Specs are not accessible in this context'+
                               '(please define _specs variable before running)');
  var files = [];

  if (!conf || !conf.length || conf[0] == '*') {

    for (var spec_group in _specs) {

      if (!spec_group) { files.push(prefix + '/' + spec_group + '.spec.js'); }
      else {
        var _flist = _specs[spec_group];
        for (var j = 0; j < _flist.length; j++) {
          files.push(prefix + '/' + spec_group + '/' + _flist[j] + '.spec.js');
        }
      }

    }

    return files;
  }

  for (var i = 0; i < conf.length; i++) {
    var expr = conf[i].split('/');
    if (!expr.length) { throw new Error('expression is empty: ' + conf[i]); }
    if (expr.length > 2) { throw new Error(expr + ' should contain one or zero \'/\' symbols'); }

    var spec_group = expr[0],
        spec_name = (expr.length != 1) ? expr[1] : '*';

    if (typeof _specs[spec_group] === undefined) { throw new Error(spec_group + ' specs group is not registered'); }
    if (!spec_group) { throw new Error('spec group name is empty ' + spec_group); }

    var _flist = _specs[spec_group];
    if (spec_name == '*') {
      if (!_flist) { files.push(prefix + '/' + spec_group + '.spec.js'); }
      else {
        for (var j = 0; j < _flist.length; j++) {
          files.push(prefix + '/' + spec_group + '/' + _flist[j] + '.spec.js');
        }
      }
    } else {
      var found = false;
      for (var j = 0; j < _flist.length; j++) {
        if (_flist[j] == spec_name) found = true;
      }
      if (!found) { throw new Error(spec_group + '/' + spec_name + ' spec is not registered'); }
      files.push(prefix + '/' + spec_group + '/' + spec_name + '.spec.js');
    }
  }

  return files;
}


function queue(f) {
  return function(values, then) {
    function __next() {
      if (!values.length) { then(); return; }
      f([ values.shift() ], __next);
    }
    __next();
  }
}