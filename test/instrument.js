const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
const geval = global.eval;
const Proxy = global.Proxy;
module.exports = (options, Advice) => {
  options = Object.assign({
    namespace: "META",
    output: "EstreeValid",
    nocache: false,
    sandbox: false
  }, options);
  const aran = Aran(options);
  const generate = options.output === "String" ? (script) => script : Astring.generate;
  const instrument = (script, parent) => generate(aran.weave(Acorn.parse(script), pointcut, parent));
  global[options.namespace] = Advice(instrument).traps;
  global[options.namespace].EVAL = geval;
  global[options.namespace].PROXY = Proxy;
  global[options.namespace].GLOBAL = global;
  const pointcut = Object.keys(global[options.namespace]);
  const setup = generate(aran.setup(pointcut));
  console.log(setup);
  geval(setup);
  return instrument;
};