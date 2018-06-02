const AranLive = require("aran/live");
Function.prototype.toString = function () { return this.name || "anonymous" };
let depth = "";
const aranlive = AranLive({
  apply: (callee, values, serial) => {
    const node = aranlive.node(serial);
    const prefix = depth+callee+"@"+node.loc.start.line;
    console.log(prefix+"("+values.join(", ")+")");
    depth += ".";
    const result = callee(...values);
    depth = depth.substring(1);
    console.log(depth+result);
    return result;
  }
});
module.exports = (script, source) => aranlive.instrument(script, null, {locations:true});