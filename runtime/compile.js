
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

  var options = {
    range: Boolean(aran.hooks&&(aran.hooks.StartRange||aran.hooks.EndRange)),
    loc: Boolean(aran.hooks&&(aran.hooks.StartLoc||aran.hooks.EndLoc))
  }
  var esv = Esvisit.Prepare()
  var stages = []
  if (aran.hooks) { stages.push(Hook(esv.visit, esv.mark, aran.hooks)) }
  if (aran.sandbox) { stages.push(Sandbox(esv.visit, esv.mark, aran.sandbox)) }
  if (aran.traps) {
    stages.push(Sanitize(esv.visit, esv.mark))
    stages.push(Hoist(esv.visit, esv.mark))
    stages.push(Trap(esv.visit, esv.mark, aran.traps))
  }

  aran.compile = function (code) {
    var ast = Esprima.parse(code, options)
    for (var i=0; i<stages.length; i++) { stages[i](ast) }
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { Util.log("Compilation warning", errors.map(summarize), errors) }
    return Escodegen.generate(ast)
  }

}
