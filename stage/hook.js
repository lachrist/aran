
/*
 * Insert hooks before statements and expressions.
 */

var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/shadow.js")
var Esvisit = require("esvisit")

module.exports = function (hooks, mark, next) {

  if (!hooks) { return {prgm:next.prgm, stmt:next.stmt, expr:next.expr} }

  function prgm (prgm) {
    var hook = Ptah.exprstmt(Shadow("hooks", "Program", [Ptah.literal(prgm.body.length)]))
    if (hooks.Program) { mark(function () { prgm.body.unshift(hook) }) }
    return next.prgm(prgm)
  }

  function stmt (type, stmt) {
    if (!hooks[type]) { return next.stmt(type, stmt) }
    var copy = next.stmt(type, Util.extract(stmt))
    stmt.type = "BlockStatement"
    stmt.body = [Ptah.exprstmt(Shadow("hooks", type, Esvisit.ExtractStatementInformation(type, copy).map(Ptah.nodify))), copy]
    return stmt
  }

  function expr (type, expr) {
    if (!hooks[type]) { return next.expr(type, expr) }
    var copy = next.expr(type, Util.extract(expr))
    expr.type = "SequenceExpression"
    expr.expressions = [Shadow("hooks", type, Esvisit.ExtractExpressionInformation(type, copy).map(Ptah.nodify)), copy]
    return expr
  }

  return {prgm:prgm, stmt:stmt, expr:expr}

}
