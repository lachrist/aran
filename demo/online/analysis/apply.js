const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
Function.prototype.toString = function () {
  return this.name || "anonymous";
};
let depth = "";
global.META = {
  apply: (strict, closure, values, serial) => {
    const node = aran.node(serial);
    const prefix = depth+closure+"@"+node.loc.start.line;
    postMessage(prefix+"("+values.join(", ")+")\n");
    depth += ".";
    const context = strict ? undefined : global; 
    const result = Reflect.apply(closure, context, values);
    depth = depth.substring(1);
    postMessage(depth+result+"\n");
    return result;
  }
};
const aran = Aran({namespace:"META"});
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  const estree1 = Acorn.parse(script, {locations:true});
  const estree2 = aran.weave(estree1, ["apply"], null);
  global.eval(Astring.generate(estree2));
};