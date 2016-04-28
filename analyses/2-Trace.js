
// This analysis traps everything, logs everything and transparently forwards all operations //

var Aran = require("aran");
var Transparents = require("./lib/transparents.js");

function log (name, array) {
  var string = name+" "+locate(array[array.length-1]) + " >>";
  for (var i=0; i<array.length-1; i++)
    string += (" " + array[i]).substring(0, 10);
  console.log(string);
}

function locate (index) {
  var node = aran.node(index);
  var source = aran.source(index);
  var loc = node.loc.start;
  return node.type + "@" + source + "#" + loc.line + ":" + loc.column;
}

var traps = {};
Object.keys(Transparents).forEach(function (name) {
  traps[name] = function () {
    log(name, arguments);
    return Transparents[name].apply(null, arguments);
  };
});
var aran = Aran({namespace:"__hidden__", traps: Object.keys(traps), loc:true});
global.__hidden__ = traps;
module.exports = aran.instrument;
