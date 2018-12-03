
const Acorn = require("acorn");
const Aran = require("aran.js");
const Astring = require("astring");

const aran = Aran();

const pointcut = (name, node) => name === "eval";

global[aran.namespace] = {
  eval: (value, serial) => {
    const estree1 = Acorn.parse(value, {locations:true});
    const estree2 = aran.weave(estree1, pointcut, serial);
    return Astring.generate(estree2);
  }
};

global.eval(Astring.generate(aran.setup()));

module.exports = (script) => {
  const estree1 = Acorn.parse(script, {locations:true});
  const estree2 = aran.weave(estree1, pointcut, null);
  return Astring.generate(estree2);
};
