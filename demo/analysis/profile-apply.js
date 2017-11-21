// Does nothing beside logging the instrumented code without any trap insertion.
const Aran = require("../../main.js");
const Esprima = require("esprima");
const aran = Aran("__traps__");
global.__traps__ = {};
const counters = new WeakMap();
traps.apply = (fct, ths, args) => {
  counters.set(fct, (counters.get(fct)||0)+1);
  __log__(fct.name+"#"+counters.get(fct));
  return fct.apply(ths, args);
};
module.exports = (source, script, log) => {
  global.__log__ = log;
  const root = Esprima.parse(script);
  const instrumented = aran.instrument(root, ["apply"]);
  log(JSON.stringify(global.eval(instrumented))+"\n");
};