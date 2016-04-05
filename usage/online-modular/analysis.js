
var Aran = require("aran");

function location (node) {
  for (var root = node; root.parent; root = root.parent);
  return root.url + "#" + node.loc.start.line + ":" + node.loc.start.column;
}

global.__hidden__ = {};
__hidden__.eval = function (x, i) { return aran.instrument(x, "eval") };
__hidden__.apply = function (f, t, xs, i) {
  var node = aran.search(i);
  console.log("Apply " + fct.name + " @ " + location(node));
  return f.apply(t, xs);
};

var aran = Aran({namespace:"__hidden__", traps:Object.keys(__hidden__), loc:true});

module.exports = aran.instrument;
