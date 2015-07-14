
var Aran = require("../../main.js");

var shadow = new WeakMap();
var instrumented = new WeakSet();
function wrap(inner, meta) {
  var wrapper = {inner:inner};
  window.shadow.set(wrapper, meta);
  return wrapper;
}
function unwrap (x) { return window.shadow.has(x) ? x.inner : x }
var traps = {};
traps.literal = function (val, ast) {
  if (isNaN(val))
    return wrap(NaN, {ast:ast});
  if (typeof val === "function")
    instrumented.add(val);
  return val;
};
traps.apply = function (fct, ths, args, ast) {
  if (instrumented.has(fct))
    return fct.apply(ths, args);
  if (fct === window.eval)
    return window.eval(aran.compile(args[0]));
  var res = fct.apply(unwrap(ths), args.map(unwrap));
  if (isNaN(res))
    res = wrap(NaN, {fct:fct, ths:ths, args:args, ast:ast});
  return res;
}

window.aran = Aran(null, traps, {ast:true, loc:true});
window.aran.script = function (js, src) {
  window.eval(aran.compile(js));
};
