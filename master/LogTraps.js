
// Log all the language-level operations intercepted by aran.
// For more information about the trap listed below, see https://github.com/lachrist/aran.
// The below implementation is transparent in the sense that it simply forward runtime value.
// However you are can provide aribtrary code and heavily modify JS semantic.

function log (trap, x) {
  var msg = trap+": "
  for (var i=1; i<arguments.length; i++) {
    if (typeof arguments[i] === "function") {
      msg += " "+"[function "+arguments[i].name+"]"
    } else {
      msg += " "+String(arguments[i])
    }
  }
  console.log(msg)
  return x
}

exports.traps = {
  primitive: function (x) { return log("primitive", x) },
  undefined: function (c) { return (log("undefined", c), undefined) },
  object: function (x) { return log("object", x) },
  array: function (x) { return log("array", x) },
  arguments: function (x) { return log("arguments", x) },
  function: function (x) { return log("function", x) },
  regexp: function (x) { return log("regexp", x) },
  booleanize: function (x, c) { return log("booleanize", x, c) },
  stringify: function (x) { return log("stringify", x) },
  throw: function (x) { return log("throw", x) },
  catch: function (x) { return log("catch", x) },
  unary: function (op, x) { return (log("unary", op, x), eval(op+" x")) },
  binary: function (op, x1, x2) { return (log("binary", op, x1, x2), eval("x1 "+op+" x2")) },
  apply: function (f, o, xs) { return (log("apply", f, o, xs), f.apply(o, xs)) },
  new: function (f, xs) {
    log("new", f, xs)
    function F() { return f.apply(this, xs) }
    F.prototype = f.prototype
    return new F()
  },
  get: function (o, p) { return (log("get", o, p), o[p]) },
  set: function (o, p, v) { return (log("set", o, p, v), o[p]=v) },
  delete: function (o, p) { return (log("delete", o, p), delete o[p]) },
  enumerate: function (o) {
    log("enumerate", o)
    var ps = []
    for (p in o) { ps.push(p) }
    return ps
  },
  erase: function (p, r) { return (log("erase", p, r), r)  },
  exist: function (o, p) { return (log("has", o, p), p in o) },
};
