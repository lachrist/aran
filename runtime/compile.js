
var Esprima = require("esprima")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Error = require("../error.js")

var Shadow = require("../syntax/shadow.js")

var Hoist = require("../stage/hoist.js")
var Hook = require("../stage/hook.js")
var Reduce = require("../stage/reduce.js")
var Sandbox = require("../stage/sandbox.js")
var Stack = require("../stage/stack.js")
var Switch = require("../stage/switch.js")
var Trap = require("../stage/trap.js")

module.exports = function (aran) {

  var stmts
  var exprs = []
  var mark = function (cb) { stmts.push(cb) }
  var compile = Hook(aran.hooks, Hoist(mark, Switch(mark, Stack(Sandbox(aran.sandbox, Reduce(Trap(aran.traps)))))))
  var tstmt
  var texpr
  var tstmts = []
  var texprs = []
  var stmt
  var expr

  aran.compile = function (code) {
    var ast = Esprima.parse(code)
    stmts = ast.body.slice().reverse()
    if (aran.hooks.program) { ast.body.unshift(Ptah.exprstmt(Shadow("hooks", "Program", [Ptah.literal(stmts.length)]))) }
    while (stmt = stmts.pop()) {
      if (typeof stmt === "function") { stmt() }
      else {
        stmt.infos = Miley(stmt, tstmts, texprs)
        compile.stmt(stmt)
        while (expr = exprs.pop()) {
          expr.infos = Miley(expr, tstmts, texprs)
          compile.expr(expr)
        }
        while(tstmt = tstmts.pop()) { stmts.push(tstmt) }
        while(texpr = texprs.pop()) { exprs.push(texpr) }
      }
    }
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { Error.internal("Compilation error", errors.map(function (e) { return e.message }), errors) }
    return Escodegen.generate(ast)
  }

}
