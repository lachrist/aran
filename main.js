
var Stack = require("./runtime/stack.js")
var Compile = require("./runtime/compile.js")
var Proxy = require("./runtime/proxy.js")
var Preserve = require("./runtime/preserve.js")

module.exports = function (sandbox, hooks, traps) {

  var aran = {sandbox:sandbox, hooks:hooks, traps:traps, undefined:undefined}
  if (typeof window !== "undefined") { aran.global = window }
  else if (typeof global !== "undefined") { aran.global = global }
  else { throw new Error("Could not find the global object") }

  Stack(aran)
  Proxy(aran)
  Compile(aran)

  return function (code) {
    Preserve(aran)
    var compiled = aran.compile(code)
    if (aran.global.compiled !== undefined) { aran.global.compiled = compiled }
    var run = new Function("aran", sandbox ? ("with (aran.proxy) { "+compiled+" }") : compiled)
    aran.mark()
    try { return run(aran) } finally { aran.unmark() }
  }

}
