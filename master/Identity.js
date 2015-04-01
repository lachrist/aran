
// This master traps everything and forward it //

exports.sandbox = window

exports.traps = {
  primitive: function (x) { return x },
  undefined: function (s) { return undefined },
  object: function (x) { return x },
  array: function (x) { return x },
  arguments: function (x) { return x },
  function: function (x) { return x },
  regexp: function (p, f) { return RegExp(p, f) },
  booleanize: function (x) { return x },
  stringify: function (x) { return x },
  catch: function (x) { return x },
  unary: function (op, x) { return eval(op+" x") },
  binary: function (op,  x1, x2) { return eval("x1 "+op+" x2") },
  apply: function (f, o, xs) { return f.apply(o, xs) },
  new: function (f, xs) { return new f(...xs) },
  has: function (o, k) { return k in o },
  get: function (o, k) { return o[k] },
  set: function (o, k, v) { return o[k]=v },
  delete: function (o, k) { return delete o[k] },
  enumerate: function (o) {
    var ks = []
    for (k in o) { ks.push(k) }
    return ks
  }
}
