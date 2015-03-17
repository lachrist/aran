
// Assemble compilations stages and define aran.compile

var Esprima = require("esprima")
var Esvisit = require("esvisit")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Util = require("../util.js")

var Hooks = require("../stage/hooks.js")
var Sanitize = require("../stage/sanitize.js")
var Hoist = require("../stage/hoist.js")
var Sandbox = require("../stage/sandbox.js")
var Traps = require("../stage/traps.js")

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
  var hooksstage    = aran.hooks   ? Hooks(esv.visit, esv.mark, aran.hooks)     : Util.nil
  var sanitizestage =                Sanitize(esv.visit, esv.mark)
  var hoiststage    =                Hoist(esv.visit, esv.mark)
  var sandboxstage  = aran.sandbox ? Sandbox(esv.visit, esv.mark, aran.sandbox) : Util.nil
  var trapsstage    = aran.traps   ? Traps(esv.visit, esv.mark, aran.traps)     : Util.nil

  function compile (local, code) {
    var ast = Esprima.parse(code, options)
    var topvars = []
    hooksstage(ast)
    sanitizestage(ast)
    hoiststage(local, ast, topvars)
    sandboxstage(local, ast, topvars)
    trapsstage(ast, topvars)
    var declarators = topvars.map(function (name) { return Esvisit.BuildDeclarator(name, null) })
    if (declarators.length) { ast.body.unshift(Esvisit.BS.Declaration(declarators)) }
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
