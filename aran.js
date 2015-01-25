
var Escodegen = require("escodegen")
var Esprima = require("esprima")

var Stack = require("./stack.js")
var Compile = require("./compile.js")
var Proxy = require("./proxy.js")

module.exports = function (sandbox, hooks, traps) {

  var aran = {sandbox:sandbox, hooks:hooks, traps:traps, undefined:undefined}
  if (typeof window !== "undefined") { aran.global = window }
  else if (typeof global !== "undefined") { aran.global = global }
  else { throw new Error("Could not find the global object") }

  Stack(aran)
  Compile(aran)
  Proxy(aran)

  return function (code) {
    aran.compiled = aran.compile(code)
    if (aran.global.compiled !== undefined) { aran.global.compiled = aran.compiled }
    aran.mark()
    try { var result = eval("with (aran.proxy) { "+aran.compiled+" }") } finally { aran.unmark() }
    return result
  }

}
