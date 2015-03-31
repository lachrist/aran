
/*
 * Hoist variable declaration and function definition.
 * This can be considered as part of JS sanitization,
 * but this code has bad interaction with code on 
 * sanitization file. So I prefered to simply perform
 * another compilation pass. 
 */

var Ptah = require("../syntax/ptah.js")
var Util = require("../util.js")

module.exports = function (visit, mark) {

  var local
  var variabless = []
  var definitionss = []
  var onstatements = {}
  var onexpressions = {}

  function onstatement (type, stmt) { if (onstatements[type]) { return onstatements[type](stmt) } }
  function onexpression (type, expr) { if (onexpressions[type]) { return onexpressions[type](expr) } }

  function hoistdeclarator (declarator, ancestor) {
    Util.last(variabless).push(declarator.id.name)
    if (declarator.init) { return Ptah.IdentifierAssignment(declarator.id.name, declarator.init, ancestor) }
    return null
  }

  function popdefinitions (stmts) {
    var definitions = definitionss.pop()
    var assignments = Object.keys(definitions).map(function (name) { return Ptah.IdentifierAssignment(name, definitions[name], definitions[name]) })
    if (assignments.length === 1) { stmts.unshift(Ptah.Expression(assignments[0])) }
    else if (assignments.length) { stmts.unshift(Ptah.Expression(Ptah.Sequence(assignments))) }
  }

  function enterfunction (fct) {
    variabless.push([])
    definitionss.push({})
    mark(function () {
      popdefinitions(fct.body.body)
      Util.inject(Ptah.HoistedFunction(
        fct.id ? fct.id.name : null,
        fct.params.map(function (id) { return id.name }),
        variabless.pop(),
        fct.body.body,
        fct
      ), fct)
    })
  }

  // Definition ::= Hoisted(IdentifierAssignment)
  onstatements.Definition = function (stmt) {
    stmt = Util.copy(stmt)
    Util.last(definitionss)[stmt.id.name] = stmt
    Util.last(variabless).push(stmt.id.name)
    enterfunction(stmt)
    return Ptah.Empty()
  }

  // Declaration ::= Many(IdentifierAssignment)
  onstatements.Declaration = function (stmt) {
    var assignments = stmt.declarations.map(hoistdeclarator, stmt).filter(Util.identity)
    if (assignments.length === 0) { return Ptah.Empty() }
    if (assignments.length === 1) { return Ptah.Expression(assignments[0]) }
    return Ptah.Expression(Ptah.Sequence(assignments))
  }

  // DeclarationFor ::= For + Many(Assignment)
  onstatements.DeclarationFor = function (stmt) {
    var assignments = stmt.init.declarations.map(hoistdeclarator, stmt).filter(Util.identity)
    return Ptah.For(
      assignments.length ? ((assignments.length===1) ? assignments[0] : Ptah.Sequence(assignments)) : null,
      stmt.test,
      stmt.update,
      stmt.body,
      stmt
    )
  }

  // DeclarationForIn ::= IdentifierForIn + Maybe(Assignment)
  onstatements.DeclarationForIn = function (stmt) {
    var assignment = hoistdeclarator(stmt.left.declarations[0], stmt)
    return Ptah.IdentifierForIn(
      stmt.left.declarations[0].id.name,
      assignment ? Ptah.Sequence([assignment, stmt.right]) : stmt.right,
      stmt.body,
      stmt
    )
  }

  onexpressions.Function = enterfunction

  return function (ast) {
    variabless.push([])
    definitionss.push({})
    visit(ast, onstatement, onexpression)
    popdefinitions(ast.body)
    return variabless.pop()
  }

}
