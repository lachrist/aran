
var General = require("./runtime/general.js")
var Stack = require("./runtime/stack.js")
var Compile = require("./runtime/compile.js")
var Proxy = require("./runtime/proxy.js")
var Preserve = require("./runtime/preserve.js")

module.exports = function (sandbox, hooks, traps) {

  var aran = {sandbox:sandbox, hooks:hooks, traps:traps}

  General(aran)
  Stack(aran)
  Proxy(aran)
  Compile(aran)

  return function (x) {
    Preserve(aran)
    aran.flush()
    var code = x.code || x
    var compiled = (x.compiled = aran.compile(code))
    return (new Function("aran", sandbox ? ("with (aran.proxy) { "+compiled+" }") : compiled))(aran)
  }

}
