
/*
 * Make sure no identifier from the target code shadows aran.
 */

var Esvisit = require("esvisit")
var Util = require("../util.js")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")

function escape (id) { if (/^\$*aran$/.test(id.name)) { id.name = "$"+id.name } }
function descape (decl) { escape(decl.id) }

module.exports = function (visit, mark, sandboxed) {

  if (!sandboxed) { return Util.nil }

  var local

  function statement (type, stmt) { if (statements[type]) { return statements[type](stmt) } }

  function expression (type, expr) {
    if (type === "This") {
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
    if (type === "IdentifierTypeof") {
      escape(expr.argument)
      return Esvisit.BE.Unary(
        "typeof",
        Esvisit.BE.Call(
          Esvisit.BE.Function(
            [],
            [Esvisit.BS.Try(
              [Esvisit.BS.Return(Esvisit.BE.Identifier(expr.argument.name))],
              "_",
              [],
              null)]),
          []))
    }
    // IdentifierDelete is also a special case :((
    if (type === "EvalCall") {
      return Esvisit.BE.Sequence([
        Shadow("local", [Esvisit.BE.Literal(local)]),
        Esvisit.BE.EvalCall(expr.arguments)
      ])
    }
    if (expressions[type]) { return expressions[type](expr) }
  }

  var statements = {
    IdentifierForIn: function (stmt) { escape(stmt.left) },
    Declaration: function (stmt) { stmt.declarations.forEach(descape) },
    Definition: function (stmt) { (escape(stmt.id), stmt.params.forEach(escape)) },
    With: function (stmt) { stmt.object = Shadow("with", [stmt.object]) },
    Try: function (stmt) { if (stmt.handlers[0]) { escape(stmt.handlers[0].param) } }
  }

  var expressions = {
    Function: function (expr) { expr.params.forEach(escape) },
    IdentifierDelete: function (expr) { escape(expr.argument) },
    IdentifierAssignment: function (expr) { escape(expr.left) },
    IdentifierUpdate: function (expr) { escape(expr.argument) },
    Identifier: function (expr) { escape(expr) },
  }

  return function (loc, ast) {
    local = loc
    visit(ast, statement, expression)
    if (!local) { ast.body = [Esvisit.Ignore(Esvisit.BS.With(Shadow("proxy"), Esvisit.BS.Block(ast.body)))] }
  }

}
