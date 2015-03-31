
/*
 * Call Aran Linvail, the shadow master.
 */

var Esvisit = require("esvisit")

// aran
// aran(x)
// aran.x
// aran.x(y)
// aran.x.y
// etc...
module.exports = function () {
  var base = Esvisit.Halt(Esvisit.BuildExpression.Identifier("aran"))
  for (var i=0; i<arguments.length; i++) {
    if (Array.isArray(arguments[i])) { return Esvisit.Ignore(Esvisit.BuildExpression.Call(base, arguments[i])) }
    if (typeof arguments[i] !== "string") { return base }
    base = Esvisit.Halt(Esvisit.BuildExpression.Member(base, arguments[i]))
  }
  return base
}
