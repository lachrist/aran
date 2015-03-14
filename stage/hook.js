
var Esvisit = require("esvisit")
var Nodify = require("../syntax/nodify.js")

module.exports = function (visit, mark, hooks) {

  function hook (type, range, infos) {
    if (hooks.MaxRange) { infos.unshift(range[1]) }
    if (hooks.MinRange) { infos.unshift(range[0]) }
    return Esvisit.Halt(Shadow("hooks", type, infos.map(Nodify)))
  }

  function statement (type, stmt) {
    if (hooks[type]) {
      return Esvisit.BS.Block([
        Esvisit.BS.Expression(hook(type, stmt.range, Esvisit.ExtractStatement(stmt))),
        Util.copy(stmt)])
    }
  }

  function expression (type, expr) {
    if (hooks[type]) {
      return Esvisit.BE.Sequence([
        hook(type, expr.range, Esvisit.ExtractExpression(expr)),
        Util.copy(expr)])
    }
  }

  return function (ast) {
    if (hooks.Program) { node.body.unshift(Esvisit.BS.Expression(hook("Program", ast.range, [node.body.length]))) }
    visit(ast, statement, expression)
  }

}
