
var Stack = require("./runtime/stack.js")
var Compile = require("./runtime/compile.js")
var Proxy = require("./runtime/proxy.js")

module.exports = function (sandbox, hooks, traps) {

  var aran = {sandbox:sandbox, hooks:hooks, traps:traps, undefined:undefined}
  if (typeof window !== "undefined") { aran.global = window }
  else if (typeof global !== "undefined") { aran.global = global }
  else { Error.external("Could not find the global object") }

  Stack(aran)
  Proxy(aran)
  Compile(aran)

  return function (code) {
    var compiled = aran.compile(code)
    if (!aran.eval) { aran.eval = sandbox ? ((aran.traps&&aran.traps.get) ? aran.traps.get(sandbox, "eval") : sandbox.eval) : aran.global.eval }
    if (aran.global.compiled !== undefined) { aran.global.compiled = compiled }
    if (sandbox) { compiled = "with (aran.proxy) { "+compiled+" }" }
    aran.mark()
    try { return eval(compiled) } finally { aran.unmark() }
  }

}
