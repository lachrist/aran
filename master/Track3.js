
///////////
// Setup //
///////////

var location = "prelude"  // loc will contain the current program location
var undefined = undefined // save actual undefined value

function wrap (x, context) {
  if (x === null || x === undefined) {
    return {
      __void__: true,
      value: x,
      location: location,
      context: context
    }
  }
  return x
}

function print (x) {
  if (!x.__void__) { return x }
  return x.value+"@"+x.location+" ("+x.context+")"
}

function unwrap (x) { return x.__void__?x.value:x }

//////////////////////////////////////////////////////////////////
// Traps: Wrap, unwrap and check for null - undefined exception //
//////////////////////////////////////////////////////////////////

exports.traps = {
  primitive: function (val) { return wrap(val, "primitive") },
  undefined: function (cause) { return wrap(undefined, cause) },
  booleanize: function (x) { return x.__void__ ? x.value : x },
  stringify: function (x) { return x.__void__ ? x.value : x },
  get: function (obj, prop) {
    if (prop.__void__) prop = prop.value
    if (!obj.__void__) { return wrap(obj[prop], "get", []) }
    throw new TypeError("Cannot read property "+print(prop)+" of "+print(obj))
  },
  set: function (obj, prop, val) {
    if (prop.__void__) prop = prop.value
    if (!obj.__void__) { return obj[prop] = val }
    throw new TypeError("Cannot set property "+print(prop)+" of "+print(obj))
  },
  delete: function (obj, prop) {
    if (prop.__void__) prop = prop.value
    if (!obj.__void__) { return delete obj[prop] }
    throw new TypeError("Connot delete property "+print(prop)+" of "+print(obj))
  },
  function: function (fct) {
    fct.__location__ = location
    return fct
  },
  apply: function (fct, th, args) {
    if (fct.__void__) { throw new TypeError(print(fct)+" is not a function") }
    if (fct.__location__) {
      location = fct.__location__
      return fct.apply(th, args)
    }
    return wrap(fct.apply(th, args.map(unwrap)), "built-in-function")
  },
  new: function (fct, args) {
    if (fct.__void__) { throw new TypeError(print(fct)+" is not a constructor") }
    if (!fct.__location__) {
      // Can also use:
      // return new fct(...args.map(unwrap))
      args = args.map(unwrap)
      args.unshift(null)
      return new (fct.bind.apply(fct, args))()
    }
    location = fct.__location__
    var o = Object.create(fct.prototype)
    var res = fct.apply(o, args)
    if (res.__void__) { return o }
    if (typeof res !== "object") { return o }
    return res

  },
  unary: function (op, x) {
    if (x.__void__) x = x.value
    switch (op) {
      case "-": return - x
      case "+": return + x
      case "!": return ! x
      case "~": return ~ x
      case "typeof": return typeof x
      case "void": return void x
    }
    throw new Error("Unknown unary operator: "+op)
  },
  binary: function (op, x, y) {
    if (x.__void__) x = x.value
    if (y.__void__) y = y.value
    switch (op) {
      case "==": return x == y
      case "!=": return x != y
      case "===": return x === y
      case "!==": return x !== y
      case "<": return x < y
      case "<=": return x <= y
      case ">": return x > y
      case ">=": return x >= y
      case "<<": return x << y
      case ">>": return x >> y
      case ">>>": return x >>> y
      case "+": return x + y
      case "-": return x - y
      case "*": return x * y
      case "/": return x / y
      case "%": return x % y
      case "|": return x | y
      case "^": return x ^ y
      case "&": return x & y
      case "in": return x in y
      case "instanceof": return x instanceof y
    }
    throw new Error("Unknown binary operator: "+op)
  }
}

////////////////////////////////////////////////////
// Hooks: Track the location of interesting nodes //
////////////////////////////////////////////////////

var types =["Return", "MemberForIn", "Definition", "Function", "MemberDelete", "Unary",
  "Binary", "MemberAssignment", "IdentiferUpdate", "MemberUpdate", "IdentifierTypeof",
  "New", "MemberCall", "Call", "Member", "Identifier", "Literal"]
function track (startloc) { location = startloc }
exports.hooks = {StartLoc:true}
types.forEach(function (type) { exports.hooks[type] = track })
