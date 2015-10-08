
var Stack = require("./runtime/stack.js")
var Scope = require("./runtime/scope.js")
var Compile = require("./runtime/compile.js")
var Store = require("./runtime/store.js")

module.exports = function (options) {
  var aran = {}
  for (var key in options)
    aran[key] = options[key];
  aran.global = (function () { return this } ());
  Stack(aran)
  Scope(aran)
  Compile(aran, Store(aran))
  return aran;
}

// eval: function (code) {
//   aran.flush();
//   var compiled = globalcompile(code);
//   aran.compiled = compiled;
//   return aran.global.eval(compiled);
// }
