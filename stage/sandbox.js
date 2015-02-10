
/*
 * Make sure no identifier from the target code shadows aran.
 */

var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/shadow.js")

function escape (id) { if (/^\$*aran$/.test(id.name)) { id.name = "$"+id.name } }
function descape (decl) { escape(decl.id) }

module.exports = function (sandbox, next) {

  if (!sandbox) { return {prgm:nexr.prgm, stmt:next.stmt, expr:next.expr} }

  function stmt (type, stmt) {
    if (stmts[type]) { stmts[type](stmt) }
    next.stmt(type, stmt)
  }

  function expr (type, expr) {
    if (type === "This") {
      expr.type = "ConditionalExpression"
      expr.test = Ptah.binary("===", Ptah.this(), Shadow("global"))
      expr.consequent = Shadow("sandbox")
      expr.alternate = Ptah.this()
      return
    }
    if (exprs[type]) { exprs[type](expr) }
    next.expr(type, expr)
  }

  var stmts = {
    DeclarationFor: function (stmt) { stmt.init.declarations.forEach(descape) },
    DeclarationForIn: function (stmt) { descape(stmt.left.declarations[0]) },
    IdentifierForIn: function (stmt) { escape(stmt.left) },
    Declaration: function (stmt) { stmt.declarations.forEach(descape) },
    Definition: function (stmt) { escape(stmt.id); stmt.params.forEach(escape) },
    With: function (stmt) { stmt.object = Shadow("with", [stmt.object]) },
    Try: function (stmt) { if (stmt.CatchClause) { escape(stmt.CatchClause.param) } }
  }

  var exprs = {
    Function: function (expr) { expr.params.forEach(escape) },
    IdentifierTypeof: function (expr) { escape(expr.argument) },
    IdentifierDelete: function (expr) { escape(expr.argument) },
    IdentifierAssignment: function (expr) { escape(expr.left) },
    IdentifierUpdate: function (expr) { escape(expr.argument) },
    Identifier: function (expr) { escape(expr) }
  }

  return {prgm:next.prgm, stmt:stmt, expr:expr}

}
