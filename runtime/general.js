
module.exports = function (aran) {

  // Global //
  if (typeof window !== "undefined") { aran.global = window }
  else if (typeof global !== "undefined") { aran.global = global }
  else { throw new Error("Could not find the global object") }

  // Apply //
  aran.apply = function (fct, th, args) { return aran.global.Function.prototype.apply.bind(fct)(th, args) }
  
  // Undefined //
  aran.undefined = undefined

}
