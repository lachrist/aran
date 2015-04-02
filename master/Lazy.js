
function delay (fct) {
  fct.__thunk__ = true
  return fct
}

function force (val) {
  if (val && val.__thunk__) { return val.__cached__ || (val.__cached__=val()) }
  return val
}

window.delay = delay
window.force = force
window.ispromise = function (val) { return Boolean(val && val.__thunk__) }

exports.traps = {
  function: function (x) {
    x.__instrumented__ = true
    return x
  },
  booleanize: function (x) { return force(x) },
  stringify: function (x) { return force(x) },
  unary: function (op, x) { return eval(op+" force(x)") },
  binary: function (op, x1, x2) { return eval("force(x1) "+op+" force(x2)") },
  apply: function (f, o, xs) {
    f = force(f)
    if (f.__instrumented__) { return f.apply(o, xs) }
    return f.apply(force(o), xs.map(force))
  },
  new: function (f, xs) {
    f = force(f)
    if (f.__instrumented__) { return new f(...xs) }
    return new f(...xs.map(force))
  },
  has: function (o, k) { return k in force(o) },
  get: function (o, k, n) { return force(o)[force(k)] },
  set: function (o, k, v, n) { return force(o)[force(k)]=v },
  delete: function (o, k, n) { return delete force(o)[force(k)] },
  enumerate: function (o, n) {
    var ks = []
    for (k in force(o)) { ks.push(k) }
    return ks
  }
}

// (function () {
//   var counter = 0
//   // Work with binary && resolved once
//   var p1 = delay(function () {
//     counter++
//     return 3
//   })
//   if (p1+p1 !== 6) { throw "addition" }
//   if (counter !== 1) { throw "counter" }
//   // Works with built-in functions 
//   var p2 = delay(function () { return {a:1} })
//   if (JSON.stringify(p2) !== '{"a":1}')
//     throw "stringify"
// } ())
