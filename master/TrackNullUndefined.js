
// Fetch the global object //
if (typeof global !== "undefined") { var glob = global }
else if (typeof window !== "undefined") { var glob = window }
else { throw new Error("Cannot find the global object...") }

// Check if WeakMaps are supported //
if (!glob.WeakMap) { throw new Error("Harmony WeakMaps are needed to perform this analysis") } 

// Will contain the function defined within the instrumented code //
var fcts = new WeakMap()

// Will contain the wrapper around null/undefined create within the instrumented code //
var voids = new WeakMap()

// Will contain the current program location //
var loc = "prelude"

var savedundefined = undefined
glob.undefined = wrap(savedundefined)

function wrap (val) {
  if (val !== savedundefined && val !== null) { return val }
  var w = {val:val, loc:loc}
  voids.set(w, true)
  return w
}
function unwrap (w) { if (voids.has(w)) { return w.val } }
function print (w) { return w.val+"@"+w.loc }

// Simulate: 'new cons(args)'
function construct (cons, args) {
  function Cons() { return f.apply(this, xs) }
  Cons.prototype = cons.prototype;
  return new Cons()
}

exports.traps = {
  primitive: wrap,
  undefined: wrap,
  booleanize: unwrap,
  stringify: unwrap,
  get: function (obj, prop) {
    prop = unwrap(prop)
    if (voids.has(obj)) { throw new TypeError("Cannot read property "+prop+" of "+print(obj)) }
    return obj[prop]
  },
  set: function (obj, prop, val) {
    prop = unwrap(prop)
    if (voids.has(obj)) { throw new TypeError("Cannot set property "+prop+" of "+print(obj)) }
    return obj[prop] = val
  },
  delete: function (obj, prop) {
    prop = unwrap(prop)
    if (voids.has(obj)) { throw new TypeError("Connor delete property "+prop+" of "+print(obj)) }
    return delete obj[prop]
  },
  function: function (fct) { return (fcts.set(fct, true), fct) },
  call: function (fct, th, args) {
    if (voids.has(fct)) { throw new TypeError(print(fct)+" is not a function") }
    if (fcts.has(fct)) { return fct.apply(th, args) }
    return wrap(fct.apply(unwrap(th), arg.map(unwrap)))
  },
  new: function (fct, args) {
    if (voids.has(fct)) { throw new TypeError(print(fct)+" is not a constructor") }
    if (fcts.has(fct)) { return construct(fct, args) }
    return wrap(construct(fct, arg.map(unwrap)))
  },
  unary: function (op, val) { return eval(op+"unwrap(val)") },
  binary: function (op, val1, val2) { return eval("unwrap(val1)"+op+"unwrap(val2)") }
}

var hooks = {StartLoc:true}

function track (startloc) { loc = startloc }

types().forEach(function (type) { hooks[type] = track })

exports.hooks = hooks



function types () {
  return [
    // Statement Types //
    "Empty",
    "Strict",
    "Block",
    "Expression",
    "If",
    "Label",
    "Break",
    "Continue",
    "With",
    "Switch",
    "Return",
    "Throw",
    "Try",
    "While",
    "DoWhile",
    "DeclarationFor",
    "For",
    "IdentifierForIn",
    "MemberForIn",
    "DeclarationForIn",
    "Definition",
    "Declaration",
    // Expression Types //
    "This",
    "Array",
    "Object",
    "Function",
    "Sequence",
    "IdentifierTypeof",
    "IdentifierDelete",
    "MemberDelete",
    "Unary",
    "Binary",
    "IdentifierAssignment",
    "MemberAssignment",
    "IdentiferUpdate",
    "MemberUpdate",
    "Logical",
    "Conditional",
    "New",
    "MemberCall",
    "EvalCall",
    "Call",
    "Member",
    "Identifier",
    "Literal"
  ]
}
