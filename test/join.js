const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
module.exports = (options, Advice) => {
  options = Object.assign({
    namespace: "META",
    output: "EstreeValid",
    nocache: false,
    nosetup: false
  }, options);
  const aran = Aran(options);
  const generate = options.output === "String" ? (script) => script : Astring.generate;
  if (options.nosetup)
    global.eval(generate(aran.setup()));
  const join = (script, parent) => generate(aran.join(Acorn.parse(script), pointcut, parent));
  global[options.namespace+"_eval"] = eval;
  global[options.namespace] = Advice(aran, join).traps;
  const pointcut = Object.keys(global[options.namespace]);
  return (script) => join(script, null);
};