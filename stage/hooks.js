
var Esvisit = require("esvisit")
var Util = require("../util.js")
var Nodify = require("../syntax/nodify.js")
var Shadow = require("../syntax/shadow.js")

module.exports = function (visit, mark, hooks) {

  function hook (type, range, loc, infos) {
    if (hooks.EndLoc) { infos.unshift(loc.end.line+"-"+loc.end.column) }
    if (hooks.StartLoc) { infos.unshift(loc.start.line+"-"+loc.start.column) }
    if (hooks.EndRange) { infos.unshift(range[0]) }
    if (hooks.StartRange) { infos.unshift(range[1]) }
    return Esvisit.Halt(Shadow("hooks", type, infos.map(Nodify)))
  }

  function onstatement (type, stmt) {
    if (hooks[type]) {
      return Esvisit.BS.Block([
        Esvisit.BS.Expression(hook(type, stmt.range, stmt.loc, Esvisit.ExtractStatement(stmt))),
        Util.copy(stmt)])
    }
  }

  function onexpression (type, expr) {
    if (hooks[type]) {
      return Esvisit.BE.Sequence([
        hook(type, expr.range, expr.loc, Esvisit.ExtractExpression(expr)),
        Util.copy(expr)])
    }
  }

  return function (ast) {
    if (hooks.Program) { node.body.unshift(Esvisit.BS.Expression(hook("Program", ast.loc, ast.range, [node.body.length]))) }
    visit(ast, onstatement, onexpression)
  }

}
