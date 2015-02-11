
/*
 * Hoist function declarations and express them in term of variable declarations.
 * TODO: Hoist variables declarations as well.
 */

var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/shadow.js")

// We have to initialize all declarations, otherwise it triggers a 'has' trap in top level proxy.
function initialize (d) { if (!d.init) { d.init = Shadow("undefined") } }

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
    if (stmts[type]) { type = stmts[type](stmt) }
    return next.stmt(type, stmt)
  }

  function expr (type, expr) {
    if (type === "Function") { push(expr.body.body) }
    return next.expr(type, expr)
  }

  var stmts = {}

  stmts.Definition = function (stmt) {
    var copy = Util.extract(stmt)
    copy.type = "FunctionExpression"
    stmt.type = "EmptyStatement"
    hoist(next.stmt("Declaration", Ptah.declaration(copy.id.name, copy)))
    push(copy.body.body)
    next.expr("Function", copy)
    return "Empty"
  }

  stmts.Declaration = function (stmt) { return (stmt.declarations.forEach(initialize), "Declaration") }

  stmts.DeclarationForIn = function (stmt) { return (initialize(stmt.left.declarations[0]), "DeclarationForIn") }

  stmts.DeclarationFor = function (stmt) { return (stmt.init.declarations.forEach(initialize), "DeclarationFor") }

  return {prgm:prgm, stmt:stmt, expr:expr}

}
