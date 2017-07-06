// This analysis does absolutely nothing! *yay* //
var Aran = require("aran");
var Esprima = require("esprima");
var JsBeautify = require("js-beautify");
module.exports = function (parameter, channel, callback) {
  var traps = {};
  var pointcut = Object.keys(traps);
  var namespace = "_traps_";
  var aran = Aran(namespace);
  global[namespace] = traps;
  callback(function (script, source) {
    var program = Esprima.parse(script);
    var instrumented = aran.instrument(program, pointcut);
    return JsBeautify.js_beautify(instrumented);
  });
};