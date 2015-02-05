
/*
 * Make sure no identifier from the target code shadows aran.
 */

var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/shadow.js")

function escape (id) { if (/^\$*aran$/.test(id.name)) { id.name = "$"+id.name } }

function escape_decl (decl) { escape(decl.id) }

module.exports = function (sandbox, next) {

  if (!sandbox) { return {stmt:next.stmt, expr:next:expr} }

  function stmt (stmt) {
    switch (stmt.type) {
      case "ForStatement": if (stmt.init && stmt.init.type === "VariableDeclaration") { stmt.init.declarations.forEach(escape_decl) } break
      case "ForInStatement": if (stmt.left.type === "VariableDeclaration") { escape_decl(stmt.left.declarations[0]) } else if (stmt.left.type === "Identifier") { escape(stmt.left) } break
      case "VariableDeclaration": stmt.declarations.forEach(escape_decl); break
      case "FunctionDeclaration": escape(stmt.id); stmt.params.forEach(escape); break
      case "WithStatement": stmt.object = Shadow("proxy", [stmt.object]); break
      case "TryStatement": if (stmt.CatchClause) { escape(stmt.CatchClause.param) } break
    }
    next.stmt(stmt)
  }

  function expr (expr) {
    if (expr.type === "ThisExpression") {
      var copy = Util.extract(expr)
      expr.type = "ConditionalExpression"
      expr.test = Ptah.binary("===", copy, Shadow("global"))
      expr.consequent = Shadow("sandbox")
      expr.alternate = Ptah.this()
      return
    }
    switch (expr.type) {
      case "FunctionExpression": expr.params.forEach(escape); break
      case "UnaryExpression": if (expr.argument.type === "Identifier" && (expr.operator === "delete" || expr.operator === "typeof")) { escape(expr.argument) } break
      case "AssignmentExpression": if (expr.left === "Identifier") { escape(expr.left) } break
      case "UpdateExpression": if (expr.left === "Identifier") { escape(expr.left) } break
      case "Identifier": escape(expr); break
    }
    next.expr(expr)
  }

  return {stmt:stmt, expr:expr}

}
