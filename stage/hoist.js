
/*
 * Hoist function declarations and express them in term of variable declarations.
 */

var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")

module.exports = function (next) {

  var push, get
  (function () {
    var bodies = []
    function pop () {
      var body = bodies.pop()
      for (var i=0; i<body.length; i++) {
        if (body[i] === null) {
          body.splice(i,1)
          return
        }
      }
    }
    push = function (body, ondone) {
      ondone(pop)
      bodies.push(body)
      body.unshift(null)
      return body
    }
    get = function (body) { return bodies[bodies.length-1] }
  } ())

  function prgm (stmts) {
    push(stmts)
    next.prgm(stmts)
  }

  function stmt (type, stmt, ondone) {
    if (type !== "Function") { return next.stmt(type, stmt, ondone) }
    var parent = get()
    push(stmt.body.body, ondone)
    // Function Expression //
    var copy = Util.extract(stmt)
    copy.type = "FunctionExpression"
    // Declaration //
    var decl = Ptah.declaration(copy.id.name, copy)
    for (var i=0; parent[i] !== null; i++) ;
    parent.splice(i, 0, decl)
    // Empty Statement //
    stmt.type="EmptyStatement"
    // Next
    next.stmt("Empty", stmt)
    next.stmt("Declaration", decl)
    next.expr("Function", copy)
  }

  function expr (type, expr, ondone) {
    if (type === "Function") { push(expr.body.body, ondone) }
    next.expr(type, expr, ondone)
  }

  return {prgm:prgm, stmt:stmt, expr:expr}

}
