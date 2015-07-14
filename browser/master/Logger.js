
var Aran = require("aran");

var traps = {
  primitive: function (x, n) { return log("primitive", n, x) },
  undefined: function (s, n) { return (log("undefined", n, s), undefined) },
  object: function (x, n) { return log("object", n, x) },
  array: function (x, n) { return log("array", n, x) },
  arguments: function (x, n) { return log("arguments", n, x) },
  function: function (x, n) { return log("function", n, x) },
  regexp: function (p, f, n) { return (log("regexp", n, p , f), RegExp(p, f)) },
  test: function (x, n) { return log("test", n, x) },
  eval: function (x, n) { return log("eval", n, x) },
  try: function (n) { return log("try", n) },
  catch: function (x, n) { return log("catch", n, x) },
  unary: function (op, x, n) { return (log("unary", n, op, x), eval(op+" x")) },
  binary: function (op, x1, x2, n) { return (log("binary", n, op, x1, x2), eval("x1 "+op+" x2")) },
  apply: function (f, o, xs, n) { return (log("apply", n, f, o, xs), f.apply(o, xs)) },
  construct: function (f, xs, n) { return (log("construct", n, f, xs), new f(...xs)) },
  get: function (o, k, n) { return (log("get", n, o, k), o[k]) },
  set: function (o, k, v, n) { return (log("set", n, o, k, v), o[k]=v) },
  delete: function (o, k, n) { return (log("delete", n, o, k), delete o[k]) },
  enumerate: function (o, n) {
    log("enumerate", n, o)
    var ks = []
    for (k in o) { ks.push(k) }
    return ks
  }
}

function log (trap, n, x) {
  var msg = trap
  if (n)
    msg += "@"+n.loc.start.line+"-"+n.loc.start.column+":"+n.type;
  for (var i=2; i<arguments.length; i++)
    if (typeof arguments[i] === "function")
      msg += " [function "+arguments[i].name+"]";
    else
      msg += " "+String(arguments[i]);
  console.log(msg);
  return x
}

window.aran = Aran(null, traps, {ast:true, loc:true});
