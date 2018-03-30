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
  const instrument = (script, parent) => generate(aran.weave(Acorn.parse(script), pointcut, parent));
  global[options.namespace] = Advice(instrument).traps;
  const pointcut = Object.keys(global[options.namespace]);
  {
    let sandbox = global;
    const setup = generate(aran.setup(pointcut));
    console.log(setup);
    eval(setup);
  }
  return instrument;
};