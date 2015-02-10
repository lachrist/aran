
/*
 * Make sure aran's stacks are cleaned up after try/catch statements.
 * Because exception is the only way to break expression evaluation,
 * expressions using aran's stacks can be safely cleanup after the expression.
 * However this does not hold for statements (break, continue, return).
 * Consequently statements using aran's stacks should be encapsulated
 * with a try/finally.
 */

var Nasus = require("../syntax/nasus.js")

module.exports = function (next) {

  function stmt (type, stmt) {
    if (type === "Try") {
      stmt.block.body.unshift(Pstack.mark())
      if (!stmt.finalizer) { stmt.finalizer = Ptah.block([]) }
      stmt.finalizer.body.unshift(Pstack.unmark())
    }
    next.stmt(type, stmt)
  }

  return {prgm:next.prgm, stmt:stmt, expr:next.expr}

}

