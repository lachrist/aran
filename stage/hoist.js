
/*
 * Hoist function declarations and express them in term of variable declarations.
 */

var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")

module.exports = function (mark, next) {

  var push, hoist, pop
  (function () {
    var bodies = []
    var buffers = []
    push = function (body) {
      mark(pop)
      bodies.push(body)
      buffers.push([])
    }
    hoist = function (stmt) { buffers[buffers.length-1].push(stmt) }
    pop = function () {
      Array.prototype.unshift.apply(bodies.pop(), buffers.pop())
    }
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
    var decl = Ptah.declaration(copy.id.name, copy)
    hoist(decl)
    push(copy.body.body)
    next.stmt("Empty", stmt)
    next.stmt("Declaration", decl)
    next.expr("Function", copy)
  }

  function expr (type, expr) {
    if (type === "Function") { push(expr.body.body) }
    next.expr(type, expr)
  }

  return {prgm:prgm, stmt:stmt, expr:expr}

}
