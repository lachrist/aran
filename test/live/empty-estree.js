const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
const aran = Aran({format:"estree"});
const pointcut = (name, node) => name === "eval";
global[aran.namespace] = {
  eval: (value, serial) => {
    const estree1 = Acorn.parse(value);
    const estree2 = aran.weave(estree1, pointcut, serial);
    return Astring.generate(estree2);
  }
};
global.eval(Astring.generate(aran.setup()));
module.exports = (script1) => {
  const estree1 = Acorn.parse(script1);
  const estree2 = aran.weave(estree1, pointcut, null);
  const script2 = Astring.generate(estree2);
  // console.log(script2);
  return script2;
};