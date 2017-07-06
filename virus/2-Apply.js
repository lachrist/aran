// This analysis does absolutely nothing! *yay* //
var Aran = require("aran");
var Esprima = require("esprima");
var JsBeautify = require("js-beautify");
module.exports = function (parameter, channel, callback) {
  var socket = channel.connect();
  socket.on("open", function () {
    var traps = {};
    traps.apply = function (fct, ths, args, idx) {
      var src = aran.program(idx).source;
      var loc = aran.node(idx).loc.start;
      socket.send("Apply "+fct.name+"@"+src+"#"+loc.line);
      return Reflect.apply(fct, ths, args);
    };
    var pointcut = Object.keys(traps);
    var namespace = "_traps_";
    var aran = Aran(namespace);
    global[namespace] = traps;
    callback(function (script, source) {
      var program = Esprima.parse(script, {loc:true});
      program.source = source;
      var instrumented = aran.instrument(program, pointcut);
      return JsBeautify.js_beautify(instrumented);
    });
  });
};
