
var Esvisit = require("esvisit")
var Shadow = require("./shadow.js")

function nodify (x) {
  if (x === null || x === true || x === false || typeof x === "number" || typeof x === "string" || x instanceof Regexp) { return Esvisit.BE.Literal(x) }
  if (x === undefined) { return Shadow("undefined") }
  if (Array.isArray(x)) { return Esvisit.BE.Array(x.map(nodify)) }
  return Esvisit.BE.Object(Object.keys(x).map(function (k) { return Esvisit.BE.InitProperty(k, nodify(x[k])) }))
}
