
/*
 * Express SwitchStatement in terms of IfStatement.
 * Empty BreakStatements jumps at the end of the conditionals.
 */

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")

function escape (id) { if (/^\$*switch/.test(id.name)) { id.name="$"+id.name } }

module.exports = function (mark, next) {

  var labels = []

  function pop () { labels.pop() }

  function stmt (stmt) {
    switch (stmt.type) {
      case "SwitchStatement":
        var copy = Util.extract(stmt)
        var stmts = [Ptah.exprstmt(Nasus.push(copy.discriminant))]
        stmt.type = "TryStatement"
        stmt.block = Ptah.block(stmts)
        stmt.handler = null
        stmt.finalizer = Ptah.block([Ptah.exprstmt(Nasus.pop())])
        copy.cases.forEach(function (c) {
          if (!c.test) { for (var i=0; i<c.consequent.length; i++) { stmts.push(c.consequent[i]) } }
          else { stmts.push(Ptah.if(Ptah.binary("===", Nasus.get(), c.test), Ptah.block(c.consequent))) }
        })
        break
      case "BreakStatement":
        if (stmt.label) { escape(stmt.label) }
        else if (labels[labels.length-1]) { stmt.label = Ptah.identifier("switch"+labels[labels.length-1]) }
        break
      case "ContinueStatement": if (stmt.label) { escape(stmt.label) } break
      case "LabeledStatement": escape(stmt.label); break
      case "WhileStatement": mark(pop); labels.push(0); break
      case "DoWhileStatement": mark(pop); labels.push(0); break
      case "ForStatement": mark(pop); labels.push(0); break
      case "ForInStatement": mark(pop); labels.push(0); break
    }
    next.stmt(stmt)
  }

  return {stmt:stmt, expr:next.expr}

}