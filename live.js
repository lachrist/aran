
const Acorn = require("acorn");
const Aran = require("./src/index.js");
const Astring = require("astring");

const istrapname = (string) => /^[a-z]*$/.test(string);
const identity = (argument) => argument;

module.exports = (advice, options) => {
  const aran = Aran(options);
  const pointcut = Object.keys(advice).filter(istrapname);
  const generate = options && options.output === "String" ? identity : Astring.generate;
  global[aran.namespace] = advice;
  global.eval(generate(aran.setup(pointcut)));
  return {
    node: aran.node,
    root: aran.root,
    namespace: aran.namespace,
    instrument: (script, parent, options) =>
      generate(aran.weave(Acorn.parse(script, options), pointcut, parent))
  };
};
