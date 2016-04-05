
var Instrument = require("./instrument.js");
var Esprima = require("esprima");

var global = (function () { return this } ());

function search (ast, idx) {
  var tmp;
  if (typeof ast !== "object" || ast === null)
    return;
  if (ast.bounds && idx === ast.bounds[0])
    return ast;
  if (ast.bounds && (idx < ast.bounds[0] || idx > ast.bounds[1]))
    return;
  for (var k in ast)
    if (tmp = search(ast[k], idx))
      return tmp;
}

module.exports = function (options) {
  if (typeof options !== "object" || options === null)
    options = {};
  var suboptions = {loc:options.loc, range:options.range};
  var namespace = options.namespace || "aran";
  var instrument = Instrument(namespace, options.traps || Object.keys(global[namespace]));
  var asts = [];
  return {
    instrument: function (code, source) {
      var ast = Esprima.parse(code, suboptions);
      ast.source = source;
      asts.push(ast);
      return instrument(ast);
    },
    search: function (index) {
      for (var i=0; i<asts.length && !node; i++)
        var node = search(asts[i], index);
      return node;
    }
  };
};
