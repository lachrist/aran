
/*
 * Call Aran Linvail, the shadow master.
 */

var Esvisit = require("esvisit")
var be = Esvisit.BuildExpression
var bs = Esvisit.BuildStatement

module.exports = function (x, y, z) {
  if (z) { return Esvisit.Ignore(be.MemberCall(Esvisit.Halt(be.Member(be.Identifier("aran"), x)), y, z)) } // aran.x.y(z)
  if (y) { return Esvisit.Ignore(be.MemberCall(Esvisit.Halt(be.Identifier("aran")), x, y)) }               // aran.x(y)
  if (x) { return Esvisit.Halt(be.Member(be.Identifier("aran"), x)) }                                      // aran.x
  return Esvisit.Halt(bs.Identifier("aran"))                                                               // aran
}
