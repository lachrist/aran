// node otiluke/run.js --demo --transform aran/analyses --out aran/analyses/demo.html
// node otiluke/run.js --test --transform aran/analyses/2-Trace.js --port 8080
// > cat analysis.js instrumented.js | node

// var Aran = require("aran");
// var aran = ({
//   namespace: "meta",
//   traps: ["eval"],
//   loc: true,
// });
// global.meta = {};
// meta.eval = function (xs, i) {
//   console.log("eval at "+aran.node(i).loc);
//   return aran.instrument(xs[0]);
// };
// eval(aran.instrument(Fs.readFileSync("target.js", "utf8)));

var Instrument = require("./instrument.js");
var Esprima = require("esprima");

var global = (function () { return this } ());

function search (ast, idx) {
  var tmp;
  if (typeof ast !== "object" || ast === null)
    return;
  if ("__min__" in ast && idx === ast.__min__)
    return ast;
  if (idx < ast.__min__ || idx > ast.__max__)
    return;
  for (var k in ast)
    if (tmp = search(ast[k], idx))
      return tmp;
}

module.exports = function (options) {
  if (typeof options !== "object" || options === null)
    options = {};
  var suboptions = {loc:options.loc, range:options.range};
  var instrument = Instrument(options.namespace || "_meta_", options.traps || []);
  var asts = [];
  var sources = [];
  return {
    instrument: function (code, source) {
      var ast = typeof code === "string" ? Esprima.parse(code, suboptions) : code;
      asts.push(ast);
      sources.push(source);
      return instrument(ast);
    },
    node: function (index) {
      for (var i=0; i<asts.length; i++) {
        var node = search(asts[i], index);
        if (node)
          return node;
      }
    },
    source: function (index) {
      for (var i=0; i<asts.length; i++)
        if (index >= asts[i].__min__ && index <= asts[i].__max__)
          return sources[i];
    }
  };
};
