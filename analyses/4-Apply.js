var Aran = require("aran");
module.exports = function (options) {
  global._meta_ = {};
  global._meta_.apply = function (fct, ths, args, idx) {
    var loc = aran.node(idx).loc.start;
    options.log("Apply "+fct.name+"@"+loc.line+"\n");
    return fct.apply(ths, args);
  };
  var aran = Aran({
    namespace:"_meta_", traps:["apply"], loc:true });
  return aran.instrument;
};