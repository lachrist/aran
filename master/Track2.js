
///////////
// Setup //
///////////

var location = "prelude"  // loc will contain the current program location
var undefined = undefined // save actual undefined value

function wrapped (x) { return x.__void__ }

function wrap (x, context, parents) {
  if (x === null || x === undefined) {
    return {
      __void__: true,
      value: x,
      location: location,
      context: context,
      parents: parents.filter(wrapped)
    }
  }
  return x
}

function unwrap (x) {
  if (x.__void__) { return x.value }
  return x
}

function print (w) {
  console.log(JSON.stringify(w))
  return w.value+"@"+w.location
}

//////////////////////////////////////////////////////////////////
// Traps: Wrap, unwrap and check for null - undefined exception //
//////////////////////////////////////////////////////////////////

exports.traps = {
  primitive: function (val) { return wrap(val, "primitive", []) },
  undefined: function (cause) { return wrap(undefined, cause, []) },
  booleanize: unwrap,
  stringify: unwrap,
  get: function (obj, prop) {
    if (!wrapped(obj)) { return wrap(obj[unwrap(prop)], "get", []) }
    throw new TypeError("Cannot read property "+prop+" of "+print(obj))
  },
  set: function (obj, prop, val) {
    if (!wrapped(obj)) { return obj[unwrap(prop)] = val }
    throw new TypeError("Cannot set property "+prop+" of "+print(obj))
  },
  delete: function (obj, prop) {
    if (!wrapped(obj)) { return delete obj[unwrap(prop)] }
    throw new TypeError("Connot delete property "+prop+" of "+print(obj))
  },
  function: function (fct) {
    fct.__location__ = location
    return fct
  },
  apply: function (fct, th, args) {
    if (wrapped(fct)) { throw new TypeError(print(fct)+" is not a function") }
    if (fct.__location__) {
      location = fct.__location__
      return fct.apply(th, args)
    }
    return wrap(fct.apply(unwrap(th), args.map(unwrap)), "built-in-function", args)
  },
  new: function (fct, args) {
    if (wrapped(fct)) { throw new TypeError(print(fct)+" is not a constructor") }
    if (!fct.__location__) { return new fct(...args.map(unwrap)) }
    location = fct.__location__
    var o = Object.create(fct.prototype)
    var res = fct.apply(o, args)
    if (res.__void__) { return o }
    if (typeof res !== "object") { return o }
    return res
  },
  unary: function (op, val) { return unaries[op](unwrap(val)) },
  binary: function (op, val1, val2) { return binaries[op](unwrap(val1), unwrap(val2)) }
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

/////////////
// General //
/////////////

// Unary operations //
var unaries = {
  "-": function (x) { return - x },
  "+": function (x) { return + x },
  "!": function (x) { return ! x },
  "~": function (x) { return ~ x },
  "typeof": function (x) { return typeof x },
  "void": function (x) { return void x }
}

// Binary operations //
var binaries = {
  "==": function (x, y) { return x == y },
  "!=": function (x, y) { return x != y },
  "===": function (x, y) { return x === y },
  "!==": function (x, y) { return x !== y },
  "<": function (x, y) { return x < y },
  "<=": function (x, y) { return x <= y },
  ">": function (x, y) { return x > y },
  ">=": function (x, y) { return x >= y },
  "<<": function (x, y) { return x << y },
  ">>": function (x, y) { return x >> y },
  ">>>": function (x, y) { return x >>> y },
  "+": function (x, y) { return x + y },
  "-": function (x, y) { return x - y },
  "*": function (x, y) { return x * y },
  "/": function (x, y) { return x / y },
  "%": function (x, y) { return x % y },
  "|": function (x, y) { return x | y },
  "^": function (x, y) { return x ^ y},
  "&": function (x, y) { return x & y},
  "in": function (x, y) { return x in y },
  "instanceof": function (x, y) { return x instanceof y }
}
