
// Setup sandboxing
// Define:
//  - aran.proxy
//  - aran.declare
//  - aran.with
//  - aran.defineproperties

function unescape (str) { if (/^\$*aran$/.test(str)) { return str.substring(1) } return str }

module.exports = function (aran) {

  if (!aran.global.Proxy) { throw new Error("Harmony Proxies are needed to support sandboxing") }

  var has = function (o, k) { return unescape(k) in o }
  if (aran.traps&&aran.traps.exist) { has = function (o, k) { return aran.traps.exist(o, unescape(k)) } }

  var get = function (o, k) { return o[unescape(k)] }
  if (aran.traps&&aran.traps.get) { get = function (o, k) { return aran.traps.get(o, unescape(k)) } }

  var set = function (o, k, v) { return o[unescape(k)]=v }
  if (aran.traps&&aran.traps.set) { set = function (o, k, v) { return aran.traps.set(o, unescape(k), v) } }

  var del = function (o, k) { return delete o[unescape(k)] }
  if (aran.traps&&aran.traps.delete) { del = function (o, k) { return aran.traps.delete(o, unescape(k)) } }

  delete aran.defineproperties
  if (has(aran.sandbox, "Object")) {
    var object = get(aran.sandbox, "Object")
    if (has(object, "defineProperties")) {
      aran.defineproperties = get(object, "defineProperties")
    }
  }

  aran.declare = function (vs) {
    for (var i=0; i<vs.length; i++) {
      if (!has(aran.sandbox, vs[i])) {
        set(aran.sandbox, vs[i], (aran.traps&&aran.traps.undefined)?aran.traps.undefined("global:"+vs[i]):undefined)
      }
    }
  }

  aran.proxy = aran.global.Proxy(aran.sandbox, {
    has: function (s, k) { return k !== "aran" }, // delete ID trigger has
    get: function (s, k) {
      if (has(s, k)) { return get(s, k) }
      throw new ReferenceError("Sandbox reference Error: "+unescape(k)+" is not defined")
    },
    set: set,
    deleteProperty: del
  })

  aran.with = function (o) {
    return aran.global.Proxy(o, {
      has: function (o, k) { return (k === "aran") ? false : has(o,k) },
      get: get,
      set: set,
      deleteProperty: del
    })
  }

}
