
/*
 * Express SwitchStatement in terms of IfStatement.
 * Empty BreakStatements jumps at the end of the conditionals.
 */

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")

function escape (id) { if (/^\$*switch/.test(id.name)) { id.name="$"+id.name } }
function mask (type) { return ["While", "DoWhile", "DeclarationFor", "For", "DeclarationForIn", "IdentifierForIn", "MemberForIn"].indexOf(type) !== -1 }

module.exports = function (mark, next) {

  var push, get, pop
  (function () {
    var labels = [0]
    push = function (x) { labels.push(x) }
    pop = function () { labels.pop() }
    get = function () { return labels[labels.length-1] }
  } ())
  
  function stmt (type, stmt) {
     if (type === "Switch") {
      var stmts = [Ptah.exprstmt(Nasus.push(stmt.discriminant))]
      stmt.type = "LabeledStatement"
      stmt.body = Ptah.try(Ptah.block(stmts), null, null, Ptah.block([Ptah.exprstmt(Nasus.pop())]))
      stmt.cases.forEach(function (c) {
        if (!c.test) { for (var i=0; i<c.consequent.length; i++) { stmts.push(c.consequent[i]) } }
        else {
          var cond = Ptah.if(Ptah.binary("===", Nasus.get(), c.test), Ptah.block(c.consequent))
          stmts.push(cond)
          next.stmt("If", cond)
          next.stmt("Binary", cond.test)
        }
      })
      return
    }
    if (stmt.label) { escape(stmt.label) }
    else if (type === "Break" && get()) { stmt.label = Ptah.identifier("switch"+get()) }
    else if (mask(type)) { (mark(pop), push(0)) }
    next.stmt(type, stmt)
  }

  return {prgm:next.prgm, stmt:stmt, expr:next.expr}

}