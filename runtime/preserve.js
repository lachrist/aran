
module.exports = function (aran) {

  var get = (aran.traps&&aran.traps.get) ? aran.traps.get : function (o, p) { return o[p] }
  var has = (aran.traps&&aran.traps.has) ? aran.traps.has : function (o, p) { return p in o }

  if (aran.preserved) { return }
  aran.preserved = {}
  if (aran.sandbox) {
    if (has(aran.sandbox, "eval")) { aran.preserved.eval = get(aran.sandbox, "eval") }
    if (has(aran.sandbox, "Object")) {
      var object = get(aran.sandbox, "Object")
      if (has(object, "defineProperties")) {
        aran.preserved.defineproperties = get(object, "defineProperties")
      }
    }
  } else {
    aran.preserved.eval = aran.global.eval
    aran.preserved.defineproperties = aran.global.Object.defineProperties
  }

}
