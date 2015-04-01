
// Assemble compilations stages, defines: aran.compile.

var Esprima = require("esprima")
var Esvisit = require("esvisit")
var Esvalid = require("esvalid")
var Escodegen = require("escodegen")

var Util = require("../util.js")

var Shadow = require("../syntax/shadow.js")
var Ptah = require("../syntax/ptah.js")

var Hoist = require("../stage/hoist.js")
var Sanitize = require("../stage/sanitize.js")
var Sandbox = require("../stage/sandbox.js")
var Intercept = require("../stage/intercept.js")

function summarize (error) {
  var sum = error.message+" for node:";
  for (var key in error.node) { sum += " "+key+":"+error.node[key] }
  return sum
}

function locate (program, parent) {
  var workers = []
  program.$locus = {parent:parent}
  workers.push(program)
  function setparent (k) { if (k[0] !== "$") { parent.$locus[k] = copy(parent[k]) } }
  function copy (x) {
    if (Array.isArray(x)) { return x.map(copy) }
    if (x === null) { return null }
    if (typeof x === "object") {
      if (x.type) {
        workers.push(x)
        x.$locus = {parent:parent}
        return x.$locus
      }
      var o = {}
      var ks = Object.keys(x)
      for (var i=0; i<ks.length; i++) { o[ks[i]] = copy(x[ks[i]]) }
      return o
    }
    return x
  }
  while (parent = workers.pop()) { Object.keys(parent).forEach(setparent) }
}

module.exports = function (aran, save) {

  var options = aran.options || {}
  var esv = Esvisit.Prepare()
  var hoist     =                Hoist(esv.visit, esv.mark)
  var sanitize  =                Sanitize(esv.visit, esv.mark)
  var sandbox   = aran.sandbox ? Sandbox(esv.visit, esv.mark, aran.sandbox)       : Util.nil
  var intercept = aran.traps   ? Intercept(esv.visit, esv.mark, aran.traps, options.ast?save:null) : Util.nil

  aran.compile = function (isglobal, parent, code) {
    var program = Esprima.parse(code, {loc:options.loc, range:options.range})
    if (options.ast) { locate(program, parent) }
    sanitize(program)
    var topvars = hoist(program)
    sandbox(program)
    intercept(isglobal, program, topvars)
    if (aran.sandbox && isglobal) {
      program.body = [
        Ptah.Expression(Shadow("sandboxdeclare", [Ptah.Array(topvars.map(Ptah.Literal))])),
        Ptah.With(Shadow("membrane"), Ptah.Block(program.body))
      ]
    } else if (topvars.length) {
      program.body.unshift(Ptah.Declaration(topvars.map(function (v) { return Ptah.Declarator(v, null) })))
    }
    // console.log(Esvisit.View(program))
    var errors = Esvalid.errors(program)
    if (errors.length > 0) { Util.log("Compilation warning", errors.map(summarize), errors) }
    return Escodegen.generate(program)
  }

  return function (parent, code) { return aran.compile(true, parent, code) }

}
