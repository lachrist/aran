
/*
 * Hoist variable declaration and function definition.
 * This can be considered as part of JS sanitization,
 * but this code has bad interaction with code on 
 * sanitization file. So I prefered to simply perform
 * another compilation pass. 
 */

var Esvisit = require("esvisit")
var Nasus = require("../syntax/nasus.js")
var Util = require("../util.js")

module.exports = function (visit, mark) {

  var bodies = []
  var declaratorss = []
  var assignmentss = []

  function pop () {
    var body = bodies.pop()
    body.unshift(Esvisit.BS.Expression(Esvisit.BE.Sequence(assignmentss.pop())))
    body.unshift(Esvisit.BS.Declaration(declaratorss.pop()))
  }
  
  function enterbody (body) {
    bodies.push(body)
    declaratorss.push([])
    assignmentss.push([])
    mark(pop)
  }
  
  function hoistdeclarator (declarator) {
    Util.last(declaratorss).push(Esvisit.BuildDeclarator(declarator.id.name))
    if (declarator.init) { return Esvisit.BE.IdentifierAssignment("=", declarator.id.name, declarator.init) }
    return null
  }

  function hoistdeclaration (declaration) { return Esvisit.BE.Sequence(declaration.declarations.map(hoistdeclarator).filter(Util.identity)) }

  statements.Definition = function (stmt) {
    enterbody(stmt.body.body)
    Util.last(declaratorss).push(Esvisit.BuildDeclarator(stmt.id.name))
    Util.last(assignmentss).push(Esvisit.IdentifierAssignment(
      "=",
      stmt.id.name,
      Esvisit.BE.Function(stmt.params, stmt.body.body)))
    return Esvisit.BS.Empty()
  }

  statements.Declaration = function (stmt) { return Esvisit.BS.Expression(hoistdeclaration(stmt)) }

  statements.DeclarationFor = function (stmt) {
    return Esvisit.BS.For(
      hoistdeclaration(stmt),
      stmt.test,
      stmt.update,
      stmt.body
    )
  }

  statements.DeclarationForIn = function (stmt) {
    var assignment = hoistdeclarator(stmt.left.declarations[0])
    return Esvisit.BS.IdentifierForIn(
      stmt.left.declarations[0].id.name,
      assignment ? Esvisit.BE.Sequence([assignment, stmt.right]) : stmt.right,
      stmt.body
    )
  }

  function statement (type, stmt) { if (statements[type]) { return statements[type](stmt) } }
  function expression (type, expr) { if ([Esvisit.Type(expr)] === "Function") { enterbody(stmt.body.body) } }

  return function (ast) {
    enterbody(ast.body)
    Esvisit.Visit(ast, statement, expression)
  }

}
