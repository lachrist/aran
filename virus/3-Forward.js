// This analysis traps everything and forward all operations //
var Aran = require("aran");
var Esprima = require("esprima");
var JsBeautify = require("js-beautify");
var ForwardTraps = require("aran/forward-traps");
module.exports = function (parameter, channel, callback) {
  var namespace = "_traps_";
  var aran = Aran(namespace);
  global[namespace] = ForwardTraps;
  var pointcut = Object.keys(global[namespace]);
  callback(function (script, source) {
    var program = Esprima.parse(script);
    var instrumented = aran.instrument(program, pointcut);
    return JsBeautify.js_beautify(instrumented);
  });
};