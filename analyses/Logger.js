
exports.sandbox = {};

function log (msg) { console.log(msg) }

exports.hooks = new Proxy({}, {
  get: function (_, type) {
    return function () {
      var msg = 'hooks.'+type;
      for (var i=0; i<arguments.length; i++) { msg = msg+' '+arguments[i] }
      log(msg)
    }
  }
});

function logtrap (name) {
  var msg = 'traps.'+name
  for (var i=1; i<arguments.length; i++) { msg = msg+' '+arguments[i] }
  log(msg)
}

exports.traps = {
  primitive: function (x) { logtrap('primitive', x); return x; },
  undefined: function (u) { logtrap('undefined', u): return undefined },
  object: function (x) { logtrap('object', x); return x; },
  array: function (x) { logtrap('array', x); return x; },
  arguments: function (x) { logtrap('arguments', x); return x; },
  function: function (x) { logtrap('function', x); return x; },
  regexp: function (x) { logtrap('regexp', x); return x; },
  booleanize: function (x, u) { logtrap('booleanize', x, u); return x; },
  stringify: function (x) { logtrap('stringify', x); return x; },
  throw: function (x) { logtrap('throw', x); return x; },
  catch: function (x) { logtrap('catch', x); return x; },
  unary: function (op, x) { logtrap('unary', op, x); return eval(op+' x'); },
  binary: function (op, x1, x2) { logtrap('binary', op, x1, x2); return eval('x1 '+op+' x2'); },
  apply: function (f, o, xs) { logtrap('apply', f, o, xs); return f.apply(o, xs); },
  new: function (f, xs) {
    logtrap('new', f, xs);
    var o = Object.create(f.prototype);
    var x = f.apply(o, xs);
    if (typeof x === 'object' && x !== null) { return x }
    return o;
  },
  get: function (o, p) { logtrap('get', o, p); return o[p]; },
  set: function (o, p, v) { logtrap('set', o, p, v); return o[p]=v; },
  delete: function (o, p) { logtrap('delete', o, p); return delete o[p]; },
  enumerate: function (o) {
    logtrap('enumerate', o);
    var ps = [];
    for (p in o) { ps.push(p) }
    return ps;
  },
  erase: function (r, p) { logtrap('erase', r, p); return r; },
  exist: function (o, p) { logtrap('exist', o, p); return p in o; }
};
