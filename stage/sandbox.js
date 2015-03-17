
/*
 * Make sure no identifier from the target code shadows aran.
 */

var Esvisit = require("esvisit")
var Util = require("../util.js")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")
var Nodify = require("../syntax/nodify.js")

function escape (id) { if (/^\$*aran$/.test(id.name)) { id.name = "$"+id.name } }

module.exports = function (visit, mark, sandbox) {

  var onstatements = {}
  var onexpressions = {}
  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  ////////////////
  // Statements //
  ////////////////

  onstatements.IdentifierForIn = function (stmt) { escape(stmt.left) }
  onstatements.With = function (stmt) { stmt.object = Shadow("with", [stmt.object]) }
  onstatements.Try = function (stmt) { if (stmt.handlers[0]) { escape(stmt.handlers[0].param) } }

  /////////////////
  // Expressions //
  /////////////////

  onexpressions.HoistedFunction = function (expr) {
    expr.params.forEach(escape)
    if (expr.body.body[0].declarations) { expr.body.body[0].declarations.forEach(function (dec) { escape(dec.id) }) }
  }

  onexpressions.This = function (expr) {
    return Esvisit.BE.Conditional(
      Esvisit.BE.Binary(
        "===",
        Esvisit.BE.This(),
        Shadow("global")),
      Esvisit.BE.Sequence([
        Nasus.pop(),
        Shadow("sandbox")]),
      Esvisit.BE.This())
  }

  // delete ID >>> (function () { try { return delete ID } catch (_) { return true }} ())

  onexpression.IdentifierDelete = function (expr) {
    return Esvisit.BE.Call(
      Esvisit.Function ())
  }

  onexpressions.identifier = escape

  onexpressions.IdentifierDelete = function (expr) { escape(expr.argument) }

  onexpressions.IdentifierAssignment = function (expr) { escape(expr.left) }

  ////////////
  // Return //
  ////////////

  return function (local, ast, topvars) {
    visit(ast, onstatement, onexpression)
    if (!local) {
      ast.body = [
        Esvisit.BS.Expression(Shadow("declare", [Nodify(topvars)])),
        Esvisit.Ignore(Esvisit.BS.With(Shadow("proxy"), Esvisit.BS.Block(ast.body)))
      ]
      topvars.length = 0
    }
  }

}
