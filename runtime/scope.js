
// Intercept scoping lookup on objects (with && global), defines:
//  - aran.membrane
//  - aran.globaldeclare
//  - aran.with
//  - aran.isobjectdelete
//  - aran.deleteresult


module.exports = function (aran) {

  var unescape = function (str) { return str }
  if (aran.sandbox) { unescape = function (str) { if (/^\$*aran$/.test(str)) { return str.substring(1) } return str } }

  var has = function (o, k) { return (k==="aran") || (unescape(k) in o) }
  if (aran.traps&&aran.traps.has) { has = function (o, k) { return (k==="aran") || aran.traps.has(o, unescape(k)) } }

  var get = function (o, k) { return (k==="aran") ? aran : o[unescape(k)] }
  if (aran.traps&&aran.traps.get) { get = function (o, k) { return (k==="aran") ? aran : aran.traps.get(o, unescape(k)) } }

  var set = function (o, k, v) { return o[unescape(k)]=v }
  if (aran.traps&&aran.traps.set) { set = function (o, k, v) { return aran.traps.set(o, unescape(k), v) } }

  var del = function (o, k) { return delete o[unescape(k)] }
  if (aran.traps&&aran.traps.delete) {
    del = function (o, k) {
      isobjectdelete = true
      deleteresult = aran.traps.delete(o, unescape(k))
    }
  }

  aran.with = function (o) {
    if (!aran.sandbox && !aran.traps.exist && !aran.traps.get && !aran.traps.set && !aran.traps.delete) { return o }
    if (!aran.global.Proxy) { throw new Error("Harmony Proxies are needed to support trapped with statements and") }
    return new aran.global.Proxy(o, {
      has: has,
      get: get,
      set: set,
      deleteProperty: del
    })
  }

  var isobjectdelete = false
  var deleteresult = null
  aran.isobjectdelete = function () {
    var save = isobjectdelete
    isobjectdelete = false
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

  aran.sandboxdeclare = function (vs, node) {
    for (var i=0; i<vs.length; i++) {
      if (!has(aran.sandbox, vs[i])) {
        set(aran.sandbox, vs[i], aran.undefined)
      }
    }
  }

  aran.membrane = new aran.global.Proxy(aran.sandbox, {
    has: function () { return true },
    get: function (o, k) {
      if (has(o, k)) { return get(o, k) }
      throw new ReferenceError("Sandbox reference Error: "+unescape(k)+" is not defined")
    },
    set: set,
    deleteProperty: del
  })

}
