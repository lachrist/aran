
/*
 * Call Aran Linvail, the shadow master.
 */

var Ptah = require("./ptah.js")

module.exports = function (x, y, z) {
  if (z) { return Ptah.call(Ptah.member(Ptah.member(Ptah.identifier("aran"), x), y), z) }
  if (y) { return Ptah.call(Ptah.member(Ptah.identifier("aran"), x), y) }
  if (x) { return Ptah.member(Ptah.identifier("aran"), x) }
  return Ptah.identifier("aran")
}
