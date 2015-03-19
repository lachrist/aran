
// Setup sandboxing
// Define:
//  - aran.proxy
//  - aran.declare
//  - aran.with
//  - aran.defineproperties

function unescape (str) { if (/^\$*aran$/.test(str)) { return str.substring(1) } return str }

module.exports = function (aran) {

  var has = function (o, k) { return unescape(k) in o }
  if (aran.traps&&aran.traps.exist) { has = function (o, k) { return aran.traps.exist(o, unescape(k)) } }

  var get = function (o, k) { return o[unescape(k)] }
  if (aran.traps&&aran.traps.get) { get = function (o, k) { return aran.traps.get(o, unescape(k)) } }

  var set = function (o, k, v) { return o[unescape(k)]=v }
  if (aran.traps&&aran.traps.set) { set = function (o, k, v) { return aran.traps.set(o, unescape(k), v) } }

  var del = function (o, k) { return delete o[unescape(k)] }
  if (aran.traps&&aran.traps.delete) {
    del = function (o, k) {
      deleted = true
      deleteresult = aran.traps.delete(o, unescape(k))
    }
  }

  aran.with = function (o) {
    if (!aran.sandbox && !aran.traps.exist && !aran.traps.get && !aran.traps.set && !aran.traps.delete) { return o }
    if (!aran.global.Proxy) { throw new Error("Harmony Proxies are needed to support with statement and traps") }
    return aran.global.Proxy(o, {
      has: function (o, k) { return (k === "aran") ? false : has(o,k) },
      get: get,
      set: set,
      deleteProperty: del
    })
  }

  var deleted = false
  var deleteresult = null
  aran.deleted = function () {
    var save = deleted
    deleted = false
    return save
  }
  aran.deleteresult = function () {
    var save = deleteresult
    deleteresult = null
    return save
  }

  //////////////////
  // Sandbox only //
  //////////////////

  if (!aran.sandbox) { return }

  if (!aran.global.Proxy) { throw new Error("Harmony Proxies are needed to support sandboxing") }

  delete aran.defineproperties
  if (has(aran.sandbox, "Object")) {
    var object = get(aran.sandbox, "Object")
    if (has(object, "defineProperties")) {
      aran.defineproperties = get(object, "defineProperties")
    }
  }

  var intypeof = false
  aran.pretypeof = function () { inypeof = true }
  aran.posttypeof = function () { intypeof = false }

  var indelete = false
  aran.predelete = function () { indelete=true }
  aran.postdelete = function () { indelete=false }

  aran.declare = function (vs) {
    for (var i=0; i<vs.length; i++) {
      if (!has(aran.sandbox, vs[i])) {
        set(aran.sandbox, vs[i], (aran.traps&&aran.traps.undefined)?aran.traps.undefined("global:"+vs[i]):undefined)
      }
    }
  }

  aran.proxy = aran.global.Proxy(aran.sandbox, {
    has: function (s, k) {
      return k !== "aran"
      if (has(s, k) || indelete || intypeof) { return true }
      throw new ReferenceError("Sandbox reference Error: "+unescape(k)+" is not defined")
    },
    get: get,
    set: set,
    deleteProperty: del
  })

}
