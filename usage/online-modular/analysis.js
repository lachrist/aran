var Aran = require("../../main.js");
module.exports = function (options) {
  function location (index) {
    var node = aran.node(index);
    return aran.source(index)+"#"+node.loc.start.line+":"+node.loc.start.column;
  }
  var evalID = 0;
  global._meta_ = {};
  _meta_.eval = function (x, i) { return aran.instrument(x, "eval"+(++evalID)) };
  _meta_.apply = function (f, t, xs, i) {
    options.log("Apply "+f.name+" @ "+location(i)+"\n");
    return f.apply(t, xs);
  };
  var aran = Aran({namespace:"_meta_", traps:Object.keys(_meta_), loc:true});
  return aran.instrument;
};