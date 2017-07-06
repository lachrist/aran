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

function search (node, index) {
  if (typeof node !== "object" || node === null)
    return;
  if ("__min__" in node && index === node.__min__)
    return node;
  if (index < node.__min__ || index > node.__max__)
    return;
  for (var key in node) {
    var child = search(node[key], index);
    if (child) {
      return child;
    }
  }
}

module.exports = function (namespace) {
  namespace = namespace || "_traps_";
  var instrument = Instrument(namespace);
  var programs = [];
  return {
    namespace: namespace,
    instrument: function (program, pointcut) {
      programs.push(program);
      return instrument(program, pointcut);
    },
    node: function (index) {
      for (var i=0; i<programs.length; i++) {
        var node = search(programs[i], index);
        if (node) {
          return node;
        }
      }
    },
    program: function (index) {
      for (var i=0; i<programs.length; i++) {
        if (index >= programs[i].__min__ && index <= programs[i].__max__) {
          return programs[i];
        }
      }
    }
  };
};
