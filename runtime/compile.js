
var Esprima = require("esprima")
var Esvisit = require("esvisit")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Util = require("../util.js")
var Error = require("../error.js")

var Hoist = require("../stage/hoist.js")
var Hook = require("../stage/hook.js")
var Reduce = require("../stage/reduce.js")
var Sandbox = require("../stage/sandbox.js")
var Stack = require("../stage/stack.js")
var Switch = require("../stage/switch.js")
var Trap = require("../stage/trap.js")

function summarize (error) {
  var sum = error.message+" for node:";
  for (var key in error.node) { sum += " "+key+":"+error.node[key] }
  return sum
}

module.exports = function (aran) {

  function statement (type, node) { compile.stmt(type, node) }
  function expression (type, node) { compile.expr(type, node) }

  var push = Esvisit.Prepare(statement, expression)
  var compile = Hook(aran.hooks, push, Hoist(push, Switch(push, Stack(Sandbox(aran.sandbox, Reduce(Trap(aran.traps)))))))

  aran.compile = function (code) {
    var ast = Esprima.parse(code)
    compile.prgm(ast)
    push(ast)
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { Util.log("Compilation warning", errors.map(summarize), errors) }
    return Escodegen.generate(ast)
  }

}
