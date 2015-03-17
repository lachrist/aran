
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

module.exports = function (visit, mark, sandboxed) {

  var local
  var bodies = []
  var variabless = []
  var definitionss = []
  var onstatements = {}
  var onexpressions = {}

  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  function popdefinitions () {
    var definitions = definitionss.pop()
    if (definitions.length === 0) { return Esvisit.BS.Empty() }
    if (definitions.length === 1) { return Esvisit.BS.Expression(definitions[0]) }
    return Esvisit.BS.Expression(Esvisit.BE.Sequence(definitions))
  }

  function popvariables () {
    var variables = variabless.pop()
    if (!variables.length) { return Esvisit.BS.Empty() }
    return Esvisit.BS.Declaration(variables.map(function (v) { return Esvisit.BuildDeclarator(v) }))
  }

  function pop () {
    var body = bodies.pop()
    body.unshift(popdefinitions())
    body.unshift(popvariables())
  }

  function enterbody (body) {
    bodies.push(body)
    variabless.push([])
    definitionss.push([])
    mark(pop)
  }

  function hoistdeclarator (declarator) {
    Util.last(variabless).push(declarator.id.name)
    if (declarator.init) { return Esvisit.BE.IdentifierAssignment("=", declarator.id.name, declarator.init) }
    return null
  }

  function hoistdeclaration (declaration) {
    var assignments = declaration.declarations.map(hoistdeclarator).filter(Util.identity)
    if (assignments.length === 0) { return null }
    if (assignments.length === 1) { return assignments[0] }
    return Esvisit.BE.Sequence(assignments)
  }

  onstatements.Definition = function (stmt) {
    Util.last(variabless).push(stmt.id.name)
    Util.last(definitionss).push(Esvisit.BE.IdentifierAssignment(
      "=",
      stmt.id.name,
      Esvisit.BE.Function(stmt.params.map(function (id) { return id.name }), stmt.body.body)))
    enterbody(stmt.body.body)
    return Esvisit.BS.Empty()
  }

  onstatements.Declaration = function (stmt) {
    var expression = hoistdeclaration(stmt)
    if (expression) { return Esvisit.BS.Expression(expression) }
    return Esvisit.BS.Empty()
  }

  onstatements.DeclarationFor = function (stmt) {
    return Esvisit.BS.For(
      hoistdeclaration(stmt.init),
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

  onexpressions.Function = function (expr) { enterbody(expr.body.body) }

  onexpressions.EvalCall = function (expr) {
    var shallowcopy = expr.arguments.slice()
    shallowcopy.unshift(Esvisit.BE.Literal(Boolean(local||bodies.length)))
    return Esvisit.BE.Conditional(
      Esvisit.Halt(Esvisit.BE.Binary("===", Esvisit.BE.Identifier("eval"), Shadow("preserved", "eval"))),
      Esvisit.Halt(Esvisit.BE.EvalCall([Shadow("compile", shallowcopy)])),
      Esvisit.BE.EvalCall(expr.arguments))
  }

  return function (loc, ast) {
    local = loc
    variabless.push([])
    definitionss.push([])
    visit(ast, onstatement, onexpression)
    ast.body.unshift(popdefinitions())
    ast.body.unshift((sandboxed&&!local)?Esvisit.BS.Expression(Shadow("declare", [Nodify(variabless.pop())])):popvariables())
  }

}
