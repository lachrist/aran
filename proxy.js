
// var o = {}
// var p = new Proxy(o, {
//   has: function (o, k) { return (console.log("has "+k), true) },
//   set: function (o, k, v) { return (console.log("set "+k), o[k]=v) },
//   get: function (o, k) {
//     console.log("get "+k)
//     if (k in o) { return o[k] }
//     console.log("ReferenceError: "+k+" is not defined :D")
//   }
// })

// with (p) {
//   var x1 = "varx"
//   y1 = "y"
//   z1+1
//   var f = function () {
//     var x1 = "varx"
//     y1 = "y"
//     z1+1
//   }
//   f()
// }



// var o1 = {}
// var p1 = new Proxy(o2, {
//   has: function (o, k) { return (console.log("has1 "+k), k in o) },
//   get: function (o, k) { return (console.log("get1 "+k), o[k]) },
//   set: function (o, k, v) { return (console.log("set1 "+k), o[k]=v) }
// })

// var o2 = {}
// var p2 = new Proxy(o2, {
//   has: function (o, k) { return (console.log("has2 "+k), k in o) },
//   get: function (o, k) { return (console.log("get2 "+k), o[k]) },
//   set: function (o, k, v) { return (console.log("set2 "+k), o[k]=v) }
// })

// with (p1) { with (p2) { var x = 1 } }


var Util = require("./util.js")

function unescape (s) {
  if (/^\$+aran$/.test(s)) { return s.substring(1) }
  return s
}

module.exports = function (aran) {

  var wrap = aran.traps.wrap || Util.identity
  var booleanize = aran.traps.booleanize || Util.identity

  var has = function (o, k) { return unescape(k) in o }
  if (aran.traps.binary) { has = function (o, k) { return booleanize(aran.traps.binary("in", unescape(k), o)) } }

  var get = function (o, k) { return o[unescape(k)] }
  if (aran.traps.get) { get = function (o, k) { return aran.traps.get(o, wrap(unescape(k))) } }

  var set = function (o, k, v) { return o[unescape(k)]=v }
  if (aran.traps.set) { set = function (o, k, v) { return aran.traps.set(o, wrap(unescape(k)), v) } }

  aran.proxy = new Proxy(aran.global, {
    has: function (g, k) { return k !== "aran" },
    set: set,
    get: function (g, k) {
      if (has(g, k)) { return get(g, k) }
      throw new Error("Sandbox reference Error: "+unescape(k)+" is not defined")
    }
  })

  aran.with = function (o) {
    return new Proxy(o, {
      get: get,
      set: set,
      has: function (o, k) {
        if (k==="aran") { return false}
        return has(o, k)
      }
    })
  }

}
