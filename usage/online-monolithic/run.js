var Aran = require("../../main.js");
var fs = require("fs");
global.__hidden__ = {};
__hidden__.eval = function (x, i) { return aran.instrument(x, "eval#"+(++evalID)) };
__hidden__.apply = function (f, t, xs, i) {
  var node = aran.search(i);
  console.log("Apply " + f.name + " at line " + node.loc.start.line);
  return f.apply(t, xs);
};
var aran = Aran({namespace:"__hidden__", traps:Object.keys(__hidden__), loc:true});
var target = fs.readFileSync(__dirname+"/../target/monolithic.js", "utf8");
global.eval(aran.instrument(target));