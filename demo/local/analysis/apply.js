const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
Function.prototype.toString = function () {
  return this.name || "anonymous";
};
let depth = "";
global.META = {
  apply: (strict, callee, values, serial) => {
    const node = aran.node(serial);
    const prefix = depth+callee+"@"+node.loc.start.line;
    console.log(prefix+"("+values.join(", ")+")");
    depth += ".";
    const value = strict ? undefined : global; 
    const result = Reflect.apply(callee, value, values);
    depth = depth.substring(1);
    console.log(depth+result);
    return result;
  }
};
const aran = Aran({namespace:"META"});
const parent = null;
const pointcut = ["apply"];
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  const estree1 = Acorn.parse(script, {locations:true});
  const estree2 = aran.weave(estree1, pointcut, parent);
  global.eval(Astring.generate(estree2));
};