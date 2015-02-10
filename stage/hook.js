
/*
 * Insert hooks before statements and expressions.
 */

var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/shadow.js")
var Esvisit = require("esvisit")

module.exports = function (hooks, next) {

  if (!hooks) { return {prgm:next.prgm, stmt:next.stmt, expr:next.expr} }

  function prgm (stmts) {
    var length = stmts.length
    next.prgm(stmts)
    if (hooks.Program) { stmts.unshift(Ptah.exprstmt(Shadow("hooks", "Program", [Ptah.literal(length)]))) }
  }

  function stmt (type, stmt) {
    if (!hooks[type]) { return next.stmt(stmt) }
    var copy = Util.extract(stmt)
    stmt.type = "BlockStatement"
    stmt.body = [Ptah.exprstmt(Shadow("hooks", type, Esvisit.ExtractStatementInformation(copy).map(Ptah.nodify))), copy]
    next.stmt(type, copy)
  }

  function expr (type, expr) {
    if (!hooks[type]) { return next.expr(expr) }
    var copy = Util.extract(expr)
    expr.type = "SequenceExpression"
    expr.expressions = [Shadow("hooks", type, Esvisit.ExtractExpressionInformation(copy).map(Ptah.nodify)), copy]
    next.expr(type, copy)
  }

  return {prgm:prgm, stmt:stmt, expr:expr}

}
