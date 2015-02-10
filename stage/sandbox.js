
/*
 * Make sure no identifier from the target code shadows aran.
 */

var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/shadow.js")

function escape (id) { if (/^\$*aran$/.test(id.name)) { id.name = "$"+id.name } }

function escape_decl (decl) { escape(decl.id) }

module.exports = function (sandbox, next) {

  if (!sandbox) { return {prgm:nexr.prgm, stmt:next.stmt, expr:next.expr} }

  function stmt (type, stmt) {
    switch (type) {
      case "DeclarationFor":   stmt.init.declarations.forEach(escape_decl)
      case "DeclarationForIn": escape_decl(stmt.left.declarations[0])
      case "IdentifierForIn":  escape(stmt.left)
      case "Declaration":      stmt.declarations.forEach(escape_decl)
      case "Definition":       escape(stmt.idl); stmt.params.forEach(escape)
      case "With":             stmt.object = Shadow("proxy", [stmt.object])
      case "Try":              if (stmt.CatchClause) { escape(stmt.CatchClause.param) }
    }
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
    switch (type) {
      case "Function": expr.params.forEach(escape)
      case "IdentifierTypeof": escape(expr.argument)
      case "IdentifierDelete": escape(expr.argument)
      case "IdentifierAssignment": escape(expr.left)
      case "IdentifierUpdate": escape(expr.left)
      case "Identifier": escape(expr)
    }
    next.expr(type, expr)
  }

  return {prgm:next.prgm, stmt:stmt, expr:expr}

}
