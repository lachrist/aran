// A rudimentory analysis which log the callstack:
// - Does not account for exceptions
// - Does not log the `this` argument
// - Use JSON.stringify to log values
const Aran = require("../../main.js");
const Esprima = require("esprima");
const aran = Aran("__traps__");
global.__traps__ = {};
let stack = "";
__traps__.apply = (fct, ths, args, idx) => {
  const loc = aran.node(idx).loc.start;
  __log__(stack+fct.name+"@"+loc.line+" "+JSON.stringify(args)+"\n");
  stack += ".";
  const res = Reflect.apply(fct, ths, args);
  stack = stack.substring(1);
  __log__(stack+JSON.stringify(res)+"\n");
  return res;
};
module.exports = (source, script, log) => {
  global.__log__ = log;
  const root = Esprima.parse(script, {loc:true});
  const instrumented = aran.instrument(root, ["apply"]);
  log(JSON.stringify(global.eval(instrumented))+"\n");
};