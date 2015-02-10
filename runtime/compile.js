
var Esprima = require("esprima")
var Esvisit = require("esvisit")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Error = require("../error.js")

var Hoist = require("../stage/hoist.js")
var Hook = require("../stage/hook.js")
var Reduce = require("../stage/reduce.js")
var Sandbox = require("../stage/sandbox.js")
var Stack = require("../stage/stack.js")
var Switch = require("../stage/switch.js")
var Trap = require("../stage/trap.js")

module.exports = function (aran) {
fer = []

  function expression (type, node) { compile.expr(type, node) }
  function statement (type, node) { compile.stmt(type, node) }
  var push = Esvisit(statement, expression)

  var compile = Hook(aran.hooks, Hoist(mark, Switch(mark, Stack(Sandbox(aran.sandbox, Reduce(Trap(aran.traps)))))))





  aran.compile = function (code) {
    var ast = Esprima.parse(code)
    stmts.push(ast)
    while (stmt = stmts.pop()) {
      if (typeof stmt === "function") { stmt() }
      else {
        stmt.infos = Miley(stmt, buffer, exprs)
        compile.stmt(stmt)
        while(stmt = buffer.pop()) { stmts.push(stmt) }
      }
      while (expr = exprs.pop()) {
        expr.infos = Miley(expr, buffer, exprs)
        compile.expr(expr)
        while(stmt = buffer.pop()) { stmts.push(stmt) }
      }
    }
    console.log(JSON.stringify(ast))
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { Error.internal("Compilation error", errors.map(function (e) { return e.message }), errors) }
    return Escodegen.generate(ast)
  }

}
