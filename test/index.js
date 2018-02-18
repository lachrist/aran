
const Acorn = require("acorn");
const Astring = require("astring");
const Aran = require("../src/index.js");

module.exports = (options, Advice, script1) => {
  options = Object.assign({
    namespace: "META",
    output: "EstreeValid",
    nocache: false
  }, options);
  const aran = Aran(options);
  const generate = options.output === "String" ? ((code) => code) : ((code) => Astring.generate(code));
  const join = (script, parent) => generate(aran.join(
    Acorn.parse(script, {locations:true}),
    Object.keys(global[options.namespace]),
    parent));
  global[options.namespace] = Advice(aran, join).traps;
  const script2 = join(script1, null);
  try {
    return {
      script: script2,
      success: true,
      value: global.eval(script2)
    };
  } catch (error) {
    return {
      script: script2,
      success: false,
      value: error
    };
  }
};
