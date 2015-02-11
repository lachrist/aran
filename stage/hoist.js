
/*
 * Hoist function declarations and express them in term of variable declarations.
 */

var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")

module.exports = function (mark, next) {

  var push, hoist
  (function () {
    var bodies = []
    var buffers = []
    function pop () { Array.prototype.unshift.apply(bodies.pop(), buffers.pop()) }
    push = function (body) {
      mark(pop)
      bodies.push(body)
      buffers.push([])
    }
    hoist = function (stmt) { buffers[buffers.length-1].push(stmt) }
  } ())

  function prgm (prgm) {
    push(prgm.body)
    next.prgm(prgm)
  }

  function stmt (type, stmt) {
    if (type !== "Definition") { return next.stmt(type, stmt) }
    var copy = Util.extract(stmt)
    copy.type = "FunctionExpression"
    stmt.type = "EmptyStatement"
    hoist(next.stmt("Declaration", Ptah.declaration(copy.id.name, copy)))
    push(copy.body.body)
    return (next.expr("Function", copy), next.stmt("Empty", stmt))
  }

  function expr (type, expr) {
    if (type === "Function") { push(expr.body.body) }
    return next.expr(type, expr)
  }

  return {prgm:prgm, stmt:stmt, expr:expr}

}
