const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
const eval = global.eval;
const Proxy = global.Proxy;
module.exports = (options, Advice) => {
  options = Object.assign({
    namespace: "META",
    output: "EstreeValid",
    nocache: false,
    nosandbox: false
  }, options);
  const aran = Aran(options);
  const generate = options.output === "String" ? (script) => script : Astring.generate;
  const weave = (script, parent) => generate(aran.weave(Acorn.parse(script), pointcut, parent));
  global[options.namespace] = Advice(aran, weave).traps;
  {
    let sandbox = global;
    console.log(generate(aran.setup()));
    eval(generate(aran.setup()));
  }
  const pointcut = Object.keys(global[options.namespace]);
  return (script) => weave(script, null);
};