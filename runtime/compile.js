
var Esprima = require("esprima")
var Esvisit = require("esvisit")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Util = require("../util.js")

var Hook = require("../stage/hook.js")
var Sandbox = require("../stage/sandbox.js")
var Sanitize = require("../stage/sanitize.js")
var Hoist = require("../stage/hoist.js")
var Trap = require("../stage/trap.js")

function summarize (error) {
  var sum = error.message+" for node:";
  for (var key in error.node) { sum += " "+key+":"+error.node[key] }
  return sum
}

module.exports = function (aran) {

  var stages = []

  if (aran.hooks) {
    stages.push
  }

  var hook = Hook(aran.hooks)
  var sandbox = Sandbox(aran.sandbox)
  var sanitize = Sanitize(function (marker) { sanitizepush(marker) })
  var hoist = Sanitize(function (marker) { hoistpush(marker) })
  var trap = Trap(aran.traps)

  var hookpush = Esvisit.Prepare(hook.statement, hook.expression)
  var sandboxpush = Esvisit.Prepare(sandbox.statement, sandbox.expression)
  var sanitizepush = Esvisit.Prepare(sanitize.statement, sanitize.expression)
  var trappush = Esvisit.Prepare(trap.statement, trap.expression)

  aran.compile = function (code) {
    var ast = Esprima.parse(code, {range:Boolean(aran.hooks&&(aran.hooks.MinRange||aran.hooks.MaxRange))})
    // Hook //
    if (aran.hooks) {
      hook.program(ast)
      hookpush(ast)
    }
    // Sandbox //
    if (aran.sandbox) {
      sandbox.program(ast)
      sandboxpush(ast)      
    }
    // Traps //
    if (aran.traps) {
      // Sanitize //
      sanitize.program(ast)
      sanitizepush(ast)
      // Hoist //
      hoist.program(ast)
      hoistpush(ast)
      // Trap //
      trap.program(ast)
      trappush(ast)
    }
    // Check for syntactic errors //
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { Util.log("Compilation warning", errors.map(summarize), errors) }
    // Output code //
    return Escodegen.generate(ast)
  }

}
