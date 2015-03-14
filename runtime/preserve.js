
module.exports = function (aran) {

  if (!("eval" in aran)) {
    aran.eval = aran.sandbox
      ? ((aran.traps && aran.traps.get)
        ? aran.traps.get(aran.sandbox, "eval")
        : aran.sandbox.eval)
      : aran.global.eval
  }

  if (!("defineproperty" in aran)) {
    aran.defineproperties = aran.sandbox
      ? ((aran.traps && aran.traps.get)
        ? aran.traps.get(aran.traps.get(aran.sandbox, "Object"), "defineProperties")
        : aran.sandbox.Object.defineProperties)
      : aran.global.Object.defineProperties
  }

}
