// This analysis traps everything and forward all operations //
const Aran = require("../../main.js");
const Esprima = require("esprima");
const ForwardTraps = require("../forward-traps.js");
const aran = Aran("__traps__");
global.__traps__ = {};
const pad = (s, n) => s+Array(n-s.length+1).join(" ");
const locate = (k, i) => [
  pad(k, 10),
  pad(aran.node(i).type, 20),
  aran.program(i).source,
  pad(String(aran.node(i).loc.start.line), 2),
  pad(String(aran.node(i).loc.start.column), 2) 
];
const print = (x) => {
  if (!x || x === true || typeof x === "number")
    return String(x);
  if (typeof x === "string")
    return JSON.stringify(x);
  return Object.prototype.toString.apply(x);
};
Object.keys(ForwardTraps).forEach((k) => {
  __traps__[k] = (...xs) => {
    __log__(locate(k, xs.pop()).concat(xs.map(print)).join(" ")+"\n")
    return ForwardTraps[k](...xs);
  };
});
module.exports = (source, script, log) => {
  global.__log__ = log;
  const root = Esprima.parse(script, {loc:true});
  root.source = source;
  const instrumented = aran.instrument(root, Object.keys(__traps__));
  log(JSON.stringify(global.eval(instrumented))+"\n");
};