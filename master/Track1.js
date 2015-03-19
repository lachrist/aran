
/////////////
// General //
/////////////

if (!window.WeakSet) { throw new Error("Harmony WeakMaps are needed to perform this analysis") } 

function construct (cons, args) {
  function Cons() { return cons.apply(this, args) }
  Cons.prototype = cons.prototype;
  return new Cons()
}

var unaries = {
  "-": function (x) { return - x },
  "+": function (x) { return + x },
  "!": function (x) { return ! x },
  "~": function (x) { return ~ x },
  "typeof": function (x) { return typeof x },
  "void": function (x) { return void x }
}

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

/////////////
// Globals //
/////////////

var fcts = new WeakSet()  // will contain the function defined within the instrumented code
var voids = new WeakSet() // voids will contain the wrapper around null/undefined create within the instrumented code
var loc = "prelude"       // loc will contain the current program location
var undefined = undefined // save actual undefined value

function isvoid (x) { return voids.has(x) }

function wrap (x, context, parents) {
  if (x === null || x === undefined) {
    var w = {
      value: x,
      location: loc,
      context: context,
      parents: parents.filter(isvoid)
    }
    voids.add(w)
    return w
  }
  return x
}

function unwrap (x) {
  if (voids.has(x)) { return x.value }
  return x
}

function print (w) {
  console.log(JSON.stringify(w))
  return w.value+"@"+w.location
}

///////////
// Traps //
///////////

exports.traps = {
  primitive: function (val) { return wrap(val, "primitive", []) },
  undefined: function (cause) { return wrap(undefined, cause, []) },
  booleanize: unwrap,
  stringify: unwrap,
  get: function (obj, prop) {
    if (!isvoid(obj)) { return wrap(obj[unwrap(prop)], "get", []) }
    throw new TypeError("Cannot read property "+prop+" of "+print(obj))
  },
  set: function (obj, prop, val) {
    if (!isvoid(obj)) { return obj[unwrap(prop)] = val }
    throw new TypeError("Cannot set property "+prop+" of "+print(obj))
  },
  delete: function (obj, prop) {
    if (!isvoid(obj)) { return delete obj[unwrap(prop)] }
    throw new TypeError("Connot delete property "+prop+" of "+print(obj))
  },
  function: function (fct) {
    fcts.add(fct)
    return fct
  },
  apply: function (fct, th, args) {
    if (isvoid(fct)) { throw new TypeError(print(fct)+" is not a function") }
    if (fcts.has(fct)) { return fct.apply(th, args) }
    return wrap(fct.apply(unwrap(th), args.map(unwrap)), "built-in-function", args)
  },
  new: function (fct, args) {
    if (isvoid(fct)) { throw new TypeError(print(fct)+" is not a constructor") }
    if (fcts.has(fct)) { return construct(fct, args) }
    return wrap(construct(fct, args.map(unwrap)), "built-in-constructor", args)
  }
  unary: function (op, val) { return wrap(unaries[op](val), "unary-"+op, [val]) },
  binary: function (op, val1, val2) { return wrap(binaries[op](val1, val2), "binary-"+op, [val1, val2]) }
}

///////////////////////////////////////////////
// Hooks: Track the current program location //
///////////////////////////////////////////////

var stmttypes = ["Empty", "Strict", "Block", "Expression", "If", "Label",
  "Break", "Continue", "With", "Switch", "Return", "Throw", "Try", "While",
  "DoWhile", "DeclarationFor", "For", "IdentifierForIn", "MemberForIn",
  "DeclarationForIn", "Definition", "Declaration"]
var exprtypes = ["This", "Array", "Object", "Function", "Sequence",
  "IdentifierTypeof", "IdentifierDelete", "MemberDelete", "Unary", "Binary",
  "IdentifierAssignment", "MemberAssignment", "IdentiferUpdate",
  "MemberUpdate", "Logical", "Conditional", "New", "MemberCall", "EvalCall",
  "Call", "Member", "Identifier", "Literal"]
function track (startloc) { loc = startloc }
exports.hooks = {StartLoc:true}
stmttypes.concat(exprtypes).forEach(function (type) { exports.hooks[type] = track })
