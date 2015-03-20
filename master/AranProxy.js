
// Extension of the Harmony Proxy API. AranProxies can track unary and binary
// operations as well as other operations already tracked by Harmony Proxies.
// Try the snippet in target:
/*
var x = new AranProxy(1, {
  binary: function (op, x, y) {
    console.log("Binary: "+x+" "+op+" "+y)
    return 666
  },
  apply: function (fct, th, args) {
    console.log("Apply: "+fct)
    return args.join("-") 
  }
})
if (x+2 !== 666) { throw "fail1" }
if (3+x !== 666) { throw "fail2" }
*/


function unwrap (x) { return (x && x.__aranproxy__) ? x.target : x }
function gettrap (x, name) { if (x && x.__aranproxy__) { return x.traps[name] } }
window.AranProxy = function (target, traps) {
  return {
    __aranproxy__: true,
    target: target,
    traps: traps
  }
}

exports.traps = {
  booleanize: unwrap,
  stringify: unwrap,
  unary: function (op, x) {
    var trap = gettrap(x, "unary")
    x = unwrap(x)
    return trap ? trap(op, x) : eval(op+" x")
  },
  binary: function (op, x, y) {
    var trap = gettrap(x, "binary") || gettrap(y, "binary")
    x = unwrap(x)
    y = unwrap(y)
    return trap ? trap(op, x, y) : eval("x "+op+" y")
  },
  function: function (fct) {
    fct.__instrumented__ = true
    return fct
  },
  apply: function (fct, th, args) {
    var trap = gettrap(fct, "apply")
    fct = unwrap(fct)
    if (!fct.__instrumented__) {
      th = unwrap(th)
      args = args.map(unwrap)
    }
    return trap ? trap(fct, th, args) : fct.apply(th, args)
  },
  new: function (fct, args) {
    var trap = gettrap(fct)
    fct = unwrap(fct)
    if (!fct.__instrumented__) {
      args = args.map(unwrap)
    }
    return trap ? trap(fct, args) : new fct(...args)
  },
  get: function (obj, prop) {
    var trap = gettrap(obj, "get")
    obj = unwrap(obj)
    prop = unwrap(prop)
    return trap ? trap(obj, prop) : obj[prop]
  },
  set: function (obj, prop, val) {
    var trap = gettrap(obj, "set")
    obj = unwrap(obj)
    prop = unwrap(prop)
    return trap ? trap(obj, prop, val) : (obj[prop] = val)
  },
  delete: function (obj, prop) {
    var trap = gettrap(obj, "delete")
    obj = unwrap(obj)
    prop = unwrap(prop)
    return trap ? trap(obj, prop) : delete obj[prop]
  },
  enumerate: function (obj) {
    var trap = gettrap(obj, "enumerate")
    obj = unwrap(obj)
    if (trap) { return trap(obj) }
    var keys = [] 
    for (var key in obj) { keys.push(key) }
    return keys
  }
}
