
var General = require("./runtime/general.js")
var Stack = require("./runtime/stack.js")
var Compile = require("./runtime/compile.js")
var Sandbox = require("./runtime/sandbox.js")
var Preserve = require("./runtime/preserve.js")

module.exports = function (sandbox, hooks, traps) {

  var aran = {sandbox:sandbox, hooks:hooks, traps:traps}

  General(aran)
  Stack(aran)
  if (sandbox) { Sandbox(aran) }
  var globalcompile = Compile(aran)
  var globaleval = eval

  return function (x) {
    Preserve(aran)
    aran.flush()
    var code = (typeof x.code === "string") ? x.code : x
    aran.global.aran = aran
    return globaleval(x.compiled = globalcompile(code))
  }

}
