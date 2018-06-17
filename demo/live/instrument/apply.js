const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
// Advice //
Function.prototype.toString = function () { return this.name || "anonymous" };
let depth = "";
global.ADVICE = {
  apply: (callee, values, serial) => {
    const node = aran.node(serial);
    const prefix = depth+callee+"@"+node.loc.start.line;
    console.log(prefix+"("+values.join(", ")+")");
    depth += ".";
    const result = callee(...values);
    depth = depth.substring(1);
    console.log(depth+result);
    return result;
  }
};
// Setup //
const aran = Aran({namespace:"ADVICE"});
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => Astring.generate(aran.weave(
  Acorn.parse(script, {locations:true}),
  ["apply"]));