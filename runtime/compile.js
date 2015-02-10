
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

  function statement (type, node) { compile.stmt(type, node) }
  function expression (type, node) { compile.expr(type, node) }

  var push = Esvisit.Prepare(statement, expression)
  var compile = Hook(aran.hooks, push, Hoist(push, Switch(push, Stack(Sandbox(aran.sandbox, Reduce(Trap(aran.traps)))))))

  aran.compile = function (code) {
    var ast = Esprima.parse(code)
    compile.prgm(ast)
    push(ast)
    console.log(JSON.stringify(ast))
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { Error.internal("Compilation error", errors.map(function (e) { return e.message }), errors) }
    code =  Escodegen.generate(ast)
    console.log(code)
    return code
  }

}
