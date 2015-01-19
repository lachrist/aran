
if (!Proxy) { throw new Error("Proxies (http://soft.vub.ac.be/~tvcutsem/proxies/) are required for aran to work...") }

var Escodegen = require("escodegen")
var Esprima = require("esprima")

var Stack = require("./stack.js")
var Compile = require("./compile.js")

module.exports = function (global, hooks, traps) {

  function unescape (s) {
    if (/^\$+aran$/.test(s)) { return s.substring(1) }
    return s
  }

  var unwrap = traps.unwrap || function (x) { return x }
  var has = function (o, k) { return unwrap(k) in unwrap(o) }
  if (traps.binary) { has = function (o, k) { return traps.binary("in", k, o) } }
  var get = traps.get || function (o, k) { return unwrap(o)[unwrap(k)] }
  var set = traps.set || function (o, k, v) { return unwrap(o)[unwrap(k)]=v }

  global = new Proxy(global, {
    get: function (g, k) { return get(g, unescape(k)) },
    set: function (g, k, v) { return set(g, unescape(k), v) },
    has: function (g, k) {
      if (k === "aran") { return false }
      if (has(g, unescape(k))) { return true }
      throw new Error("Reference Error: "+unescape(k)+" is not defined")
    }
  })

  var aran = {hooks:hooks, traps:traps}

  var handlers = {
    get: function (o, k) { return get(o, unescape(k)) },
    set: function (o, k, v) { return set(o, unescape(k), v) },
    has: function (o, k) {
      if (k === "aran") { return false }
      return has(o, unescape(k))
    }
  }
  aran.with = function (o) { return new Proxy(o, handlers) }

  Stack(aran)

  Compile(aran)

  return function (code) {
    var o = {compiled:aran.compile(code)}
    aran.mark()
    try { with(global) { o.result = eval(o.compiled) } }
    catch (e) { o.error = e }
    aran.unmark()
    return o
  }

}
