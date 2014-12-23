
(function () {

  window.forEa
  window.$window = window

  window.$eval = function (code) { return window.eval(aran.compile(code)) }


  var objects = []   // [(Object, TrappedObject)]
  var functions = [] // [(Function, TrappedFunction)]

  var store, lookup
  (function () {
    var xs = []
    lookup = function (k) { for (var i=0; i<xs.length; i++) { if (k===xs[i][0]) { return xs[i][1] } } }
    store = function (k, v) { return xs.push([k,v]) }
  } ());

  function copy (path, x) {
    if (x === undefined) { return x }
    if (x === null) { return aran.traps.global(path, x) }
    if (typeof x === "boolean") { return aran.traps.global(path, x) }
    if (typeof x === "number") { return aran.traps.global(path, x) }
    if (typeof x === "string") { return aran.traps.global(path, x) }
    if (typeof x === "function") {
      var x = aran.traps.global(x)
      Object.getOwnPropertyNames(x).forEach(function () {
        
        aran.traps.set(x, )
      })

      if (aran.traps.primitive) {  }
      if (aran.traps.set) {}
      if (aran.traps.primitives[path]) 
      aran.traps.set()
    }
    if (typeof x === "object") {
      var trapped = lookup(x)
      if (trapped) { return trapped }
      trapped = aran.traps.global()
      Object.getOwnPropertyNames(x).forEach(function (k) {
        var d = Object.getOwnPropertyDescriptor(x, k)
        if (d.get) { d.get = copy(d.get) }
        if (d.set) { d.set = copy(d.set) }
        if (d.value) { d.value = copy(d.value) }
        aran.traps.setglobal(trapped, k, d)
      })

      var x = aran.traps.global({})
      Object.getOwnPropertyNames(x)
      aran.traps.set(x)

    }
    if (typeof x === "function") {
      aran.traps.set()
    }
    // object
  }


} ())





