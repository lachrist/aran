
// Track the origin of NaN values //
var global = (function () { return this } ());
var Aran = require("aran");
var metas = new WeakSet();
function toMeta (val, args) {
  if (!isNaN(val))
    return val;
  metas.add(args);
  return args;
}
function toBase (val) { return metas.has(val) ? NaN : val }
var instrumented = new WeakSet();
global.aran = Aran({
  ast: true,
  loc: true,
  traps: {
    primitive: function (prm, ast) {
      return toMeta(prm, arguments);
    },
    test: function (prd, ast) {
      return toBase(prd)
    },
    function: function (fct, ast) {
      instrumented.add(fct);
      return fct;
    },
    unary: function (op, arg, ast) {
      return toMeta(eval(op+" toBase(arg)"), arguments);
    },
    binary: function (op, left, right, ast) {
      return toMeta(eval("toBase(left) "+op+" toBase(right)"), arguments);
    },
    apply: function (fct, ths, args, ast) {
      if (instrumented.has(fct))
        return fct.apply(ths, args);
      return toMeta(fct.apply(toBase(ths), args.map(toBase)), arguments);
    },
    construct: function (fct, args, ast) {
      if (instrumented.has(fct))
        return new fct(... args);
      return fct(... args.map(toBase));
    },
    get: function (obj, key, ast) {
      return toBase(obj)[toBase(key)];
    },
    set: function (obj, key, val, ast) {
      return toBase(obj)[toBase(key)] = val;
    },
    delete: function (obj, key, ast) {
      return delete toBase(obj)[toBase(key)];
    },
    enumerate: function (obj, ast) {
      var ks = [];
      for (k in toBase(obj))
        ks.push(k);
      return ks;
    }
  }
});
module.exports = global.aran.compile;
