// Iterator
// -----------------------------------------------------------------------------

function StopIteration() {}
function iter(a) {
    if (a.__iter) {
        a.__iter.reset();
        return a.__iter;
    }
    var pos = 0,
        len = a.length;
    return (a.__iter = {
        next: function() {
                  if (pos < len) return a[pos++];
                  pos = 0;
                  throw new StopIteration();
              },
        hasNext: function() { return (pos < len); },
        remove: function() { len--; return a.splice(--pos, 1); },
        reset: function() { pos = 0; len = a.length; },
        get: function() { return a[pos]; },
        each: function(f, rf) {
                  this.reset();
                  while (this.hasNext()) {
                    if (f(this.next()) === false) {
                        if (rf) rf(this.remove()); else this.remove();
                    }
                  }
              }
    });
}


module.exports = iter;
