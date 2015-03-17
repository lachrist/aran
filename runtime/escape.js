
// Escape some features from the global object that are needed at the language level
// Define:
//   - aran.global
//   - aran.apply
//   - aran.undefined
//   - aran.eval
//   - aran.defineproperties

module.exports = function (aran) {

  if (typeof window !== "undefined") { aran.global = window }
  else if (typeof global !== "undefined") { aran.global = global }
  else { throw new Error("Could not find the global object") }

  aran.apply = function (fct, th, args) { return aran.global.Function.prototype.apply.bind(fct)(th, args) }
  aran.undefined = aran.global.undefined
  aran.eval = aran.global.eval
  aran.defineproperties = aran.Object.defineProperties

}
