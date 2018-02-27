
const Acorn = require("acorn");
const Astring = require("astring");
const Aran = require("../src/index.js");

const $eval = global.eval;
const Object_keys = global.Object.keys;

module.exports = (options, Advice, script1) => {
  options = Object.assign({
    namespace: "META",
    output: "EstreeValid",
    nocache: false,
    nosetup: false
  }, options);
  const aran = Aran(options);
  const generate = options.output === "String" ? ((script) => script) : ((estree) => Astring.generate(estree));
  const join = (script, parent) => generate(aran.join(
    Acorn.parse(script, {locations:true}),
    Object_keys(global[options.namespace]),
    parent));
  global[options.namespace+"eval"] = $eval;
  global[options.namespace] = Advice(aran, join).traps;
  const script2 = join(script1, null);
  try {
    return {
      script: script2,
      success: true,
      value: $eval(script2)
    };
  } catch (error) {
    return {
      script: script2,
      success: false,
      value: error
    };
  }
};
