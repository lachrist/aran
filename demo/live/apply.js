const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
const aran = Aran({format:"estree"});
const pointcut = (name, node) => (
  name === "apply" &&
  node.type === "CallExpression" &&
  node.callee.type === "Identifier");
let depth = "";
global[aran.namespace] = {
  apply: (f, t, xs, serial) => {
    console.log(depth + f.name + "(" + xs.join(", ") + ")");
    depth += ".";
    const x = Reflect.apply(f, t, xs);
    depth = depth.substring(1);
    console.log(depth + x);
    return x;
  }
};
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  const estree1 = Acorn.parse(script);
  const estree2 = aran.weave(estree1, pointcut, null);
  return Astring.generate(estree2);
};
