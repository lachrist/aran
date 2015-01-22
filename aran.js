
var Escodegen = require("escodegen")
var Esprima = require("esprima")

var Stack = require("./stack.js")
var Compile = require("./compile.js")
var Proxy = require("./proxy.js")

module.exports = function (sandbox, hooks, traps) {

  var aran = {sandbox:sandbox, hooks:hooks, traps:traps, global:this, undefined:undefined}

  Stack(aran)
  Compile(aran)
  Proxy(aran)

  return function (code) {
    var o = {compiled:aran.compile(code)}
    aran.compiled = o.compiled
    aran.mark()
    try { o.result = eval("with (aran.proxy) { "+aran.compiled+" }") } catch (e) { o.error = e }
    aran.unmark()
    return o
  }

}
