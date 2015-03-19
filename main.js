
var Escape = require("./runtime/escape.js")
var Stack = require("./runtime/stack.js")
var Sandbox = require("./runtime/sandbox.js")
var Compile = require("./runtime/compile.js")

module.exports = function (sandbox, hooks, traps) {

  var aran = {sandbox:sandbox, hooks:hooks, traps:traps}

  Escape(aran)
  Stack(aran)
  Sandbox(aran)
  var globalcompile = Compile(aran)

  return function (x) {
    aran.flush()
    var code = (typeof x.code === "string") ? x.code : x
    aran.global.aran = aran
    x.compiled = globalcompile(code)
    return aran.eval(x.compiled)
  }

}
