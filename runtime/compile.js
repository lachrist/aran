
var Esprima = require("esprima")
var Esvisit = require("esvisit")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Util = require("../util.js")

var Hook = require("../stage/hook.js")
var Sanitize = require("../stage/sanitize.js")
var Hoist = require("../stage/hoist.js")
var Sandbox = require("../stage/sandbox.js")
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
  var hookstage = Hook(esv.visit, esv.mark, aran.hooks)
  var sanitizestage = Sanitize(esv.visit, esv.mark)
  var hoiststage = Hoist(esv.visit, esv.mark, Boolean(aran.sandbox))
  var sandboxstage = Sandbox(esv.visit, esv.mark, Boolean(aran.sandbox))
  var trapstage = Trap(esv.visit, esv.mark, aran.traps)

  function compile (local, code) {
    var ast = Esprima.parse(code, options)
    hookstage(ast)
    sanitizestage(ast)
    hoiststage(local, ast)
    sandboxstage(local, ast)
    trapstage(ast)
    var errors = Esvalid.errors(ast)
    if (errors.length > 0) { Util.log("Compilation warning", errors.map(summarize), errors) }
    return Escodegen.generate(ast)
  }

  aran.compile = function (local, code) {
    if (aran.traps&&aran.traps.stringify) { code = aran.traps.stringify(code) }
    return compile(local, code)
  }

  return function (code) { return compile(false, code) }

}
