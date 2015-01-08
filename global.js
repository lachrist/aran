
module.exports = function (aran) {

  // var global = eval(aran.global_name)

  // Removing ignore from the global object
  var saved = {}
  if (aran.ignore) {
    aran.ignore.forEach(function (k) {
      saved[k] = global[k]
      delete global[k]
    })
  }

  var store, lookup
  (function () {
    var xs = []
    lookup = function (k) { for (var i=0; i<xs.length; i++) { if (k===xs[i][0]) { return xs[i][1] } } }
    store = function (k, v) { return xs.push([k,v]) }
  } ());

  var extval, extget, extset
  (function () {
    function ext (path, kind, prop) {
      path = path.slice()
      path.push(kind)
      path.push(prop)
      return path
    }
    extval = function (path, prop) { return ext(path, "val", prop) }
    extget = function (path, prop) { return ext(path, "get", prop) }
    extset = function (path, prop) { return ext(path, "set", prop) }
  } ());

  aran.prototypes = {}
  aran.prototypes.object = loop(["val", "Object", "val", "prototype"], global.Object.prototype)
  aran.prototypes.function = loop(["val", "Function", "val", "prototype"], global.Function.prototype)
  aran.prototypes.array = loop(["val", "Array", "val", "prototype"], global.Array.prototype)
  store(global.Object.prototype, aran.prototypes.object)
  store(global.Function.prototype, aran.prototypes.function)
  store(global.Array.prototype, aran.prototypes.array)

  function loop (path, x) {
    if (x === undefined) { return x }
    if (x === null) { return aran.traps.global(path, x) }
    if (typeof x === "boolean") { return aran.traps.global(path, x) }
    if (typeof x === "number") { return aran.traps.global(path, x) }
    if (typeof x === "string") { return aran.traps.global(path, x) }
    var w = lookup(x)
    if (w) { return w } // shaky condition
    if (typeof w === "function") { w = aran.traps.global(path, x) }
    else if (Array.isArray(x)) { w = aran.traps.array() }
    else { w = aran.traps.object() }
    store(x, w)
    aran.traps.set(w, aran.traps.wrap("__proto__"), loop(extval(path, "__proto__"), x.__proto__))
    var ks = Object.getOwnPropertyNames(x)
    for (var i=0; i<ks.length; i++) {
      var d = Object.getOwnPropertyDescriptor(x, ks[i])
      if (d.value) { d.value = loop(extval(path, ks[i]), d.value) }
      if (d.get)   { d.get   = loop(extget(path, ks[i]), d.get)   }
      if (d.set)   { d.set   = loop(extset(path, ks[i]), d.set)   }
      aran.traps.define(w, ks[i], d)
    }
    return w
  }

  aran.global = loop([], global)

  aran.global_proxy = new Proxy(aran.global, {
    get: function (g, k) { return aran.traps.get(g, k.substring(1)) }
    set: function (g, k, v) { return aran.traps.set(g, k.substring(1), v) }
    has: function (g, k) {
      if (k.indexOf("$")!==0) { return false }
      if (k in g) { return true }
      throw new Error("Reference Error: "+k+" is not defined")
    }
  })

  aran.eval = aran.global.eval

  for (k in saved) { global[k] = saved[k] }

}


  // aran.initialize = function () {
  //   // window
  //   if (window.Proxy) {
  //     aran.saved_window = new Proxy ({}, {
  //       getOwnPropertyDescriptor: function (_, k) { return Object.getOwnPropertyDescriptor(window, "$"+k) },
  //       ownKeys: function (_) {
  //         var keys = []
  //         Object.keys(window).map(function (k) {
  //           k = String(k)
  //           if (k.substring[0] === "$") { keys.push(k.substring(1)) }
  //         })
  //         return keys
  //       },
  //       defineProperty: function (_, k, d) { return Object.defineProperty(window, "$"+k, d) },
  //       deleteProperty: function (_, k) { return delete window["$"+k] },
  //       preventExtensions: function () { return Object.preventExtensions(window) },
  //       has: function (_, k) { return ("$"+k) in window },
  //       get: function (_, k) { return window["$"+k] },
  //       set: function (_, k, v) { return window["$"+k] = v },
  //       enumerate: function (_) {
  //         var keys = []
  //         for (var key in window) {
  //           if (key.substring(0,1) === "$") { keys.push(key.substring(1)) }
  //         }
  //       }
  //     })
  //   } else { aran.saved_window = {} }
  //   if (aran.traps.wrap) { aran.saved_window = aran.traps.wrap(aran.saved_window) }
  //   window.$window = aran.saved_window
  //   // eval
  //   aran.saved_eval = function (code) { return window.eval(aran.compile(code)) }
  //   if (aran.traps.wrap) { aran.saved_eval = aran.traps.wrap(aran.saved_eval) }
  //   window.$eval = aran.saved_eval
  //   // Function
  //   window.$Function = function () {
  //     var args = []
  //     for (var i=0; i<arguments.length-1; i++) { args.push("$"+arguments[i]) }
  //     var body = arguments[arguments.length]
  //     return window.eval(aran.compile("function ("+args.join(",")+" {\n"+body+"\n}"))
  //   }
  //   if (aran.traps.wrap) { window.$Function = aran.traps.wrap(window.$Function) }
  // }


