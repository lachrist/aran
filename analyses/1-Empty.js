// This analysis does absolutely nothing! *yay* //
var Aran = require("aran");
var JsBeautify = require("js-beautify");
module.exports = function (options) {
  var traps = {};
  global.__hidden__ = traps;
  var aran = Aran({namespace:"__hidden__", traps:Object.keys(traps)});
  return function (script, source) {
    return JsBeautify.js_beautify(aran.instrument(script, source));
  };
};