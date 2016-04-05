var Aran = require("aran");
global.__hidden__ = {};
__hidden__.apply = function (f, t, xs, i) {
  var node = aran.search(i);
  console.log("Apply " + f.name + " at line " + node.loc.start.line);
  return f.apply(t, xs);
};
var aran = Aran({namespace:"__hidden__", traps:Object.keys(__hidden__), loc:true});
module.exports = aran.instrument;