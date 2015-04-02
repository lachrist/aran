
/*
 * Make sure no identifier from the target code shadows aran.
 */

var Ptah = require("../syntax/ptah.js")
var Util = require("../util.js")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")

function escape (id) { if (/^\$*aran$/.test(id.name)) { id.name = "$"+id.name } }
function descape (decl) { escape(decl.id) }

module.exports = function (visit, mark, sandbox) {
  
  var onstatements = {}
  var onexpressions = {}
  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  ////////////////
  // Statements //
  ////////////////

  // IdentifierForIn := IdentifierForIn
  onstatements.IdentifierForIn = function (stmt) { escape(stmt.left) }

  // With ::= With
  onstatements.With = function (stmt) { stmt.object = Shadow("with", [stmt.object]) }

  // Try ::= Try
  onstatements.Try = function (stmt) { if (stmt.handlers[0]) { escape(stmt.handlers[0].param) } }

  /////////////////
  // Expressions //
  /////////////////

  // Function ::= HoistedFunction
  onexpressions.HoistedFunction = function (expr) {
    expr.params.forEach(escape)
    if (expr.body.body[0].declarations) { expr.body.body[0].declarations.forEach(descape) }
  }

  // This ::= This
  // this >>> (aran.push(this) === aran.global) ? (nasus.pop(), aran.sandbox) : nasus.pop()
  onexpressions.This = function (expr) {
    return Ptah.Conditional(
      Ptah.Binary("===", Nasus.push(Ptah.This(expr)), Shadow("global")),
      Ptah.Sequence([Nasus.pop(), Shadow("sandbox")]),
      Nasus.pop())
  }

  // IdentifierAssignment ::= IdentifierAssignment
  onexpressions.IdentifierAssignment = function (expr) { escape(expr.left) }

  // Identifier ::= Identifier
  onexpressions.Identifier = escape

  ////////////
  // Return //
  ////////////

  return function (ast) { visit(ast, onstatement, onexpression) }

}
