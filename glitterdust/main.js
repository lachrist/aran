
var Instrument = require("../instrument.js");
var Esprima = require("esprima");

var options = {range:true, loc:true};

module.exports = function (analysis, target) {
  debugger;
  window.eval(analysis);
  var aran = (function () { return this.aran } ());
  var ast = Esprima.parse(target, options);
  var instrumented = Instrument("aran", Object.keys(aran))(ast);
  aran.Ast && aran.Ast(ast, "master");
  return instrumented;
};
