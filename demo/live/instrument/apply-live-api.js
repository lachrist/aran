const Aran = require("aran");
const AranLive = require("aran-live");
Function.prototype.toString = function () { return this.name || "anonymous" };
let depth = "";
const aran = Aran();
const instrument = AranLive(aran, {
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
});
module.exports = (script, source) => instrument(script, null, {locations:true});