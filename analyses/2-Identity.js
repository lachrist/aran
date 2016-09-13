// This analysis traps everything and forward all operations //
var Aran = require("aran");
var JsBeautify = require("js-beautify");
module.exports = function (options) {
  var traps = {};
  // General //
  traps.Program = function (idx) { };
  traps.Strict = function (idx) { };
  // Creation //
  traps.primitive = function (prm, idx) { return prm };
  traps.closure = function (fct, idx) { return fct };
  traps.object = function (prps, idx) {
    var obj = {};
    for (var i=0; i<prps.length; i++)
      Object.defineProperty(obj, prps[i].key, prps[i]);
    return obj;
  };
  traps.array = function (vals, idx) { return vals };
  traps.regexp = function (ptn, flg, idx) { return new RegExp(ptn, flg) }
  // Environment //
  traps.Declare = function (kind, tags, idx) { };
  traps.read = function (tag, val, idx) { return val };
  traps.write = function (tag, val, wrt, idx) { return wrt(val) };
  traps.Enter = function (idx) { };
  traps.Leave = function (idx) { };
  traps.with = function (env, idx) { return env };
  // Apply //
  traps.apply = function (fct, ths, args, idx) { return fct.apply(ths, args) };
  traps.construct = function (cst, args, idx) { return new cst(...args) };
  traps.Arguments = function (args, i) { };
  traps.return = function (val, idx) { return val };
  traps.eval = function (args, idx) { return args[0] };
  traps.unary = function (opr, arg, idx) { return eval(opr+" arg") };
  traps.binary = function (opr, lft, rgt, idx) { return eval("lft "+opr+" rgt") };
  // Object //
  traps.get = function (obj, key, idx) { return obj[key] };
  traps.set = function (obj, key, val, idx) { return obj[key] = val };
  traps.delete = function (obj, key, idx) { return delete obj[key] };
  traps.enumerate = function (obj, idx) {
    var keys = [];
    for (var key in obj)
      keys.push(key);
    return keys;
  };
  // Control //
  traps.test = function (val, idx) { return val };
  traps.Label = function (lbl, idx) { };
  traps.Break = function (lbl, idx) { };
  traps.throw = function (err, idx) { return err };
  traps.Try = function (idx) { };
  traps.catch = function (err, idx) { return err };
  traps.Finally = function (idx) { };
  traps.sequence = function (vals, idx) { return vals[vals.length-1] };
  traps.expression = function (val, idx) { return val };
  // Exports //
  global._meta_ = traps;
  var aran = Aran({namespace:"_meta_", traps:Object.keys(traps)});
  return function (script, source) {
    return JsBeautify.js_beautify(aran.instrument(script, source));
  };
};