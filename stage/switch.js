
/*
 * Express SwitchStatement in terms of IfStatement.
 * Empty BreakStatements jumps at the end of the conditionals.
 */

 var Util = require("../util.js")

var Ptah = require("../syntax/ptah.js")
var Nasus = require("../syntax/nasus.js")

function escape (id) { if (/^\$*switch/.test(id.name)) { id.name="$"+id.name } }
var maskers = ["While", "DoWhile", "DeclarationFor", "For", "DeclarationForIn", "IdentifierForIn", "MemberForIn"]

module.exports = function (mark, next) {

  var mask, push, get
  (function () {
    var counter = 0
    var labels = [0]
    function pop () { labels.pop() }
    mask = function () { (labels.push(0), mark(pop)) }
    incr = function () { (labels.push(++counter), mark(pop)) } 
    get = function () { return labels[labels.length-1] }
  } ())
  
  function stmt (type, stmt) {
    if (type === "Switch") {
      incr()
      var stmts = [Ptah.exprstmt(Nasus.push(stmt.discriminant))]
      stmt.cases.forEach(function (c) {
        if (!c.test) { for (var i=0; i<c.consequent.length; i++) { stmts.push(c.consequent[i]) } }
        else { stmts.push(next.stmt("If", Ptah.if(next.expr("Binary", Ptah.binary("===", Nasus.get(), c.test)), Ptah.block(c.consequent)))) }
      })
      Util.inject(Ptah.label("switch"+get(), Ptah.try(stmts, null, null, [Ptah.exprstmt(Nasus.pop())])), stmt)
      return stmt
    }
    if (stmt.label) { escape(stmt.label) }
    else if (type === "Break" && get()) { stmt.label = Ptah.identifier("switch"+get()) }
    else if (maskers.indexOf(type) !== -1) { mask() }
    return next.stmt(type, stmt)
  }

  return {prgm:next.prgm, stmt:stmt, expr:next.expr}

}