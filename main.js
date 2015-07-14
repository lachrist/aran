
var Stack = require("./runtime/stack.js")
var Scope = require("./runtime/scope.js")
var Compile = require("./runtime/compile.js")
var Store = require("./runtime/store.js")

module.exports = function (sandbox, traps, options) {

  var aran = {
    sandbox: sandbox,
    traps: traps,
    options: options,
    global: (function () { return this } ())
  };

  Stack(aran)
  Scope(aran)
  var save = Store(aran)
  var globalcompile = Compile(aran, save)

  return aran;

}

// eval: function (code) {
//   aran.flush();
//   var compiled = globalcompile(code);
//   aran.compiled = compiled;
//   return aran.global.eval(compiled);
// }
