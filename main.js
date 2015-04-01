
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
  }

  Stack(aran)
  Scope(aran)
  var save = Store(aran)
  var globalcompile = Compile(aran, save)

  return function (x) {
    aran.flush()
    var code = x.code || x
    var parent = x.parent || null
    aran.global.aran = aran
    var compiled = globalcompile(parent, code)
    x.compiled = compiled
    return aran.global.eval(compiled)
  }

}
