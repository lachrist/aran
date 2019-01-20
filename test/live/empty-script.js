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
module.exports = (script1) => {
  const estree = Acorn.parse(script1);
  const script2 = aran.weave(estree, pointcut, null);
  // console.log(script2);
  return script2;
};