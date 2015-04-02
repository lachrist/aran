
// This master traps everything and forward it //

exports.sandbox = window

exports.options = {
  ast:true,
  loc:true,
  range:true
}

exports.traps = {
  primitive: function (x, n) { return x },
  undefined: function (s, n) { return undefined },
  object: function (x, n) { return x },
  array: function (x, n) { return x },
  arguments: function (x, n) { return x },
  function: function (x, n) { return x },
  regexp: function (p, f, n) { return RegExp(p, f) },
  booleanize: function (x, n) { return x },
  stringify: function (x, n) { return x },
  catch: function (x, n) { return x },
  unary: function (op, x, n) { return eval(op+" x") },
  binary: function (op,  x1, x2, n) { return eval("x1 "+op+" x2") },
  apply: function (f, o, xs, n) { return f.apply(o, xs) },
  new: function (f, xs, n) { return new f(...xs) },
  has: function (o, k) { return k in o },
  get: function (o, k, n) { return o[k] },
  set: function (o, k, v, n) { return o[k]=v },
  delete: function (o, k, n) { return delete o[k] },
  enumerate: function (o, n) {
    var ks = []
    for (k in o) { ks.push(k) }
    return ks
  }
}
