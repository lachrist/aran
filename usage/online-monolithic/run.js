var Aran = require("../../main.js");
var evalID = 0;
var fs = require("fs");
global._meta_ = {};
_meta_.eval = function (x, i) { return aran.instrument(x, "eval"+(++evalID)) };
_meta_.apply = function (f, t, xs, i) {
  var node = aran.node(i);
  console.log("Apply "+f.name+" at "+aran.source(i)+"#"+node.loc.start.line);
  return f.apply(t, xs);
};
var aran = Aran("_meta_");
var target = fs.readFileSync(__dirname+"/../target/monolithic.js", "utf8");
var program = Esprima.parse(target, {loc:true});
global.eval(aran.instrument(program, Object.keys(_meta_));