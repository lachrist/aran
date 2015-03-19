
/*
 * Hoist variable declaration and function definition.
 * This can be considered as part of JS sanitization,
 * but this code has bad interaction with code on 
 * sanitization file. So I prefered to simply perform
 * another compilation pass. 
 */

var Esvisit = require("esvisit")
var Util = require("../util.js")
var Nasus = require("../syntax/nasus.js")
var Shadow = require("../syntax/shadow.js")
var Nodify = require("../syntax/nodify.js")

module.exports = function (visit, mark) {

  var local
  var variabless = []
  var definitionss = []
  var onstatements = {}
  var onexpressions = {}

  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  function hoistdeclarator (declarator) {
    Util.last(variabless).push(declarator.id.name)
    if (declarator.init) { return Esvisit.BE.IdentifierAssignment("=", declarator.id.name, declarator.init) }
    return null
  }

  function popdefinitions (stmts) {
    var definitions = definitionss.pop()
    var assignments = Object.keys(definitions).map(function (name) { return Esvisit.BE.IdentifierAssignment("=", name, definitions[name]) })
    if (assignments.length === 1) { stmts.unshift(Esvisit.BS.Expression(assignments[0])) }
    else if (assignments.length) { stmts.unshift(Esvisit.BS.Expression(Esvisit.BE.Sequence(assignments))) }
  }

  function enterfunction (fct) {
    variabless.push([])
    definitionss.push({})
    mark(function () {
      popdefinitions(fct.body.body)
      Util.inject(Esvisit.BE.HoistedFunction(
        fct.id ? fct.id.name : null,
        fct.params.map(function (id) { return id.name }),
        variabless.pop(),
        fct.body.body
      ), fct)
    })
  }

  onstatements.Definition = function (stmt) {
    stmt = Util.copy(stmt)
    Util.last(definitionss)[stmt.id.name] = stmt
    Util.last(variabless).push(stmt.id.name)
    enterfunction(stmt)
    return Esvisit.BS.Empty()
  }

  onstatements.Declaration = function (stmt) {
    var assignments = stmt.declarations.map(hoistdeclarator).filter(Util.identity)
    if (assignments.length === 0) { return Esvisit.BS.Empty() }
    if (assignments.length === 1) { return Esvisit.BS.Expression(assignments[0]) }
    return Esvisit.BS.Expression(Esvisit.BE.Sequence(assignments))
  }

  onstatements.DeclarationFor = function (stmt) {
    var assignments = stmt.init.declarations.map(hoistdeclarator).filter(Util.identity)
    return Esvisit.BS.For(
      assignments.length ? ((assignments.length===1) ? assignments[0] : Esvisit.BE.Sequence(assignments)) : null,
      stmt.test,
      stmt.update,
      stmt.body
    )
  }

  onstatements.DeclarationForIn = function (stmt) {
    var assignment = hoistdeclarator(stmt.left.declarations[0])
    return Esvisit.BS.IdentifierForIn(
      stmt.left.declarations[0].id.name,
      assignment ? Esvisit.BE.Sequence([assignment, stmt.right]) : stmt.right,
      stmt.body
    )
  }

  onexpressions.Function = enterfunction

  // eval(ARGS) >>> (eval===aran.eval) ? eval(aran.compiled(LOCAL, ARGS)) : eval(ARGS)
  // sandbox contains the original eval function <=> possibly local eval
  // the alternative eval call is known to be standard eval call
  onexpressions.EvalCall = function (expr) {
    var shallowcopy = expr.arguments.slice()
    shallowcopy.unshift(Esvisit.BE.Literal(Boolean(local||(variabless.length>1))))
    return Esvisit.BE.Conditional(
      Esvisit.Halt(Esvisit.BE.Binary("===", Esvisit.BE.Identifier("eval"), Shadow("eval"))),
      Esvisit.Halt(Esvisit.BE.EvalCall([Shadow("compile", shallowcopy)])),
      Esvisit.BE.EvalCall(expr.arguments))
  }

  return function (loc, ast, topvars) {
    local = loc
    variabless.push(topvars)
    definitionss.push({})
    visit(ast, onstatement, onexpression)
    popdefinitions(ast.body)
    variabless.pop()
  }

}
