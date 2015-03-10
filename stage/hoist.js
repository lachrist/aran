
/*
 * Hoist function declarations and express them in term of variable declarations.
 * TODO: Hoist variables declarations as well.
 */

var Util = require("../util.js")
var Ptah = require("../syntax/ptah.js")
var Shadow = require("../syntax/shadow.js")

// We have to initialize all declarations, otherwise it triggers a 'has' trap in top level proxy.
function initialize (d) { if (!d.init) { d.init = Shadow(Shadow("undefined") } }

module.exports = function (mark, next) {

  // push: enter a body; get notified when jumping out of it //
  // hoist: hoist a declaration //
  // top: tell whether we are at the top level body //
  var push, hoistvar, hoistdef;
  (function () {
    var bodies = []       // head is the program body, tail is nested function bodies
    var declarations = [] // hoisted declaration for each body //
    var namess = []
    var valuess = []
    // jump out of a body: unshift body with hoisted statements //
    function pop () {
      var body = bodies.pop()
      var names = namess.pop()
      var values = valuess.pop()
      var expressions = []
      for (var i = 0; i<names.length; i++) {
        expressions[i] = values[i] ? Ptah.assignment(names[i], values[i]) : Ptah.conditional(
          Ptah.binary("===", Ptah.identifier(names[i]), Shadow("undefined"))
          Ptah.binary()
        )
        if (values[i]) { expressions[i] =  }
        else { expre}
      }
      values.map(function (v) {  })
      if (!bodies.length) { body.unshift(Shadow("aran", "enddeclaration", [])) }
      body.unshift(Ptah.declarations(names.map(Ptah.declarator)))
      if (!bodies.length) { body.unshift(Shadow("aran", "begindeclaration", [])) }


      bodies.unshift()
      bodies.unshift(Shadow("aran", "enddeclaration", []))
      bodies.pop().unshift(declarations.pop())
      
      

    }
    push = function (body) {
      top = false
      mark(pop)
      bodies.push(body)
      buffers.push([])
    }
    function hoist (name, value) { declarations[declarations.length-1].declarations.push(Ptah.declarator(name, value)) }
    hoistdef = hoist
    // TODO refine when it top level
    hoistvar = function (name) {
      namess[namess.length-1].push(name)
      
      hoist(name, top?null:next.expr("Literal", Shadow("undefined")))
    }
  } ())

  function prgm (prgm) {
    push(prgm.body)
    next.prgm(prgm)
  }

  function stmt (type, stmt) {
    if (stmts[type]) { type = stmts[type](stmt) }
    if (type) { next.stmt(type, stmt) }
    return stmt
  }

  function expr (type, expr) {
    if (type === "Function") { push(expr.body.body) }
    return next.expr(type, expr)
  }

  function declarator (d) {
    hoist(d.id.name)
    if (!d.init) { return null }
    return next.expr("Assignment", Ptah.assignment(d.id.name, d.init))
  }

  var stmts = {}

  stmts.Definition = function (stmt) {
    var copy = Util.extract(stmt)
    copy.type = "FunctionExpression"
    stmt.type = "EmptyStatement"
    hoist(copy.id.name, copy)
    push(copy.body.body)
    next.expr("Function", copy)
    return "Empty"
  }

  stmts.Declaration = function (stmt) {
    Util.inject(Ptah.exprstmt(Ptah.sequence(stmt.declarations.map(declarator).filter(Util.identity))), stmt)
  }

  stmts.DeclarationForIn = function (stmt) {
    var assignment = declarator(stmt.left)
    if (assignment) { stmt.right = Ptah.sequence([assignment, stmt.right]) }
    stmt.left = Ptah.identifier(name)
    return "IdentifierForIn"
  }

  stmts.DeclarationFor = function (stmt) {
    stmt.init = Ptah.sequence(stmt.init.declarations.map(declarator).filter(Util.identity))
    return "For"
  }

  return {prgm:prgm, stmt:stmt, expr:expr}

}
