const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
Function.prototype.toString = function () {
  return this.name || "anonymous";
};
let depth = "";
self.META = {
  apply: (closure, values, serial) => {
    const line = aran.node(serial).loc.start.line;
    postMessage(depth+closure+"@"+line+"("+values.join(", ")+")\n");
    depth += ".";
    const result = closure(...values);
    depth = depth.substring(1);
    postMessage(depth+result+"\n");
    return result;
  }
};
const aran = Aran({namespace:"META"});
module.exports = (script) => {
  const ast1 = Acorn.parse(script, {locations:true});
  const ast2 = aran.join(ast1, ["apply"]);
  eval(Astring.generate(ast2));
};