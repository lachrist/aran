const Acorn = require("acorn");
const Aran = require("aran");
const aran = Aran({format:"script"});
const pointcut = (name, node) => name === "eval";
global[aran.namespace] = {
  eval: (value, serial) => {
    const estree = Acorn.parse(value);
    return aran.weave(estree, pointcut, serial);
  }
};
global.eval(aran.setup());
module.exports = (script) => {
  const estree = Acorn.parse(script);
  return aran.weave(estree, pointcut, null);
};