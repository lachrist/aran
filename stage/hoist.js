
/*
 * Hoist function declarations and express them in term of variable declarations.
 */

var Ptah = require("../syntax/ptah.js")

module.exports = function (mark, next) {

  var bodies = []

  function pop () {
    var body = bodies.pop()
    for (var i=0; i<body.length; i++) {
      if (body[i] === null) {
        body.splice(i,1)
        i--
      }
    }
  }

  function stmt (stmt) {
    if (stmt.type === "FunctionDeclaration") {
      mark(pop)
      // Function Expression //
      var expr = Util.extract(stmt)
      expr.type = "FunctionExpression"
      expr.body.body.unshift(null)
      bodies.push(expr.body.body)
      next.expr(expr)
      // Declaration //
      var decl = Ptah.declaration(expr.name, expr)
      var body = bodies[bodies.length-2]
      for (var i=0; i<body.length; i++) {
        if (body[i] === null) { return body.splice(i, 0, decl) }
      }
      insert(decl, bodies[bodies.length-2])
      next.stmt(decl)
      // Empty Statement //
      stmt.type="EmptyStatement"
    }
    next.stmt(stmt)
  }

  function expr (expr) {
    if (expr.type === "FunctionExpression") {
      mark(pop)
      bodies.push(expr.body.body)
    }
    next.expr(expr)
  }

  return {stmt:stmt, expr:expr}

}
