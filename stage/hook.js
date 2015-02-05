
/*
 * Insert hooks before statements and expressions.
 */

var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/ptah.js")

module.exports = function (hooks, next) {

  function stmt (stmt) {
    if (!hooks[stmt.type]) { return next.stmt(stmt) }
    var copy = Util.extract(stmt)
    stmt.type = "BlockStatement"
    stmt.body = [Ptah.exprstmt(Shadow("hooks", copy.type, Ptah.nodify(copy.infos)), copy]
    next.stmt(copy)
  }

  function expr (expr) {
    if (!hooks[expr.type]) { return next.expr(expr) }
    var copy = Util.extract(expr)
    expr.type = "SequenceExpression"
    expr.expressions = [Shadow("hooks", copy.type, Ptah.nodify(copy.infos)), copy]
    next.expr(copy)
  }

  return {stmt:stmt, expr:expr}

}
