
var Aran = require("../../main.js");

function location (index) {
  var node = aran.search(index);
  for (var root = node; root.parent; root = root.parent);
  return root.source + "#" + node.loc.start.line + ":" + node.loc.start.column;
}

var evalID = 0;

global.__hidden__ = {};
__hidden__.eval = function (x, i) { return aran.instrument(x, "eval"+(++evalID)) };
__hidden__.apply = function (f, t, xs, i) {
  console.log("Apply " + f.name + " @ " + location(i));
  return f.apply(t, xs);
};

var aran = Aran({namespace:"__hidden__", traps:Object.keys(__hidden__), loc:true});

module.exports = aran.instrument;
