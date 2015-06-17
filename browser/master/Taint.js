
function id (x) { return x }

function isprimitive (x) {
  return (x===null)
    || (x===undefined)
    || (typeof x==="boolean")
    || (typeof x==="number")
    || (typeof x==="string")
}

function box (x) {
  if (typeof x === "boolean") { return new Boolean(x) }
  if (typeof x === "number") { return new Number(x) }
  if (typeof x === "string") { return new String(x) }
  return x
}

//////////////////
// Taint values //
//////////////////

var tainted = new WeakSet()

function taint (x) {
  if (x===null||x===undefined) { return x } // cannot taint null && undefined
  if (isprimitive(x)) { x = box(x) }
  else {
    var copy = {}
    for (var k in x) { copy[k] = taint(x[k]) }
    x = copy
  }
  tainted.add(x)
  return x
}

function istainted (x) {
  if (tainted.has(x)) { return true }
  if (!isprimitive(x)) { for (var k in x) { if (istainted(x[k])) { return true } } }
  return false
}

//////////////////////////////////////////////////
// Sandbox:                                     //
//  1. Prevent tainted values to access IOs     //
//  2. Propage taint on built-in function calls //
//////////////////////////////////////////////////

// Create taint values
function source (fct) {
  return function () {
    return taint(fct.apply(this, arguments))
  }
}

// Forward tainted values
function river (fct) {
  return function () {
    var post = id
    for (var i=0; i<arguments.length; i++) {
      if (istainted(arguments[i])) { post = taint }
    }
    return post(fct.apply(this, arguments))
  }
}

// Check no taint values sink in
function sink (fct) {
  return function () {
    for (var i=0; i<arguments.length; i++) {
      if (istainted(arguments[i])) { throw new Error("Tainted value into sink (argument "+i+")") }
    }
    return fct.apply(this, arguments)
  }
}

exports.sandbox = {
  prompt: source(window.prompt.bind(window)),
  alert: sink(window.alert.bind(window)),
  eval: sink(window.eval),
  JSON: {
    parse: river(window.JSON.parse),
    stringify: river(window.JSON.stringify)
  }
}

///////////////////////////////////////////////////////////
// Traps:                                                //
//   1. Prevent tainted value to affect the control flow //
//   2. Propagate taint on unary-binary operations       //
///////////////////////////////////////////////////////////

exports.traps = {
  booleanize: function (x) {
    if (istainted(x)) { throw new Error("Taint value flows in program conditional") }
    return x
  },
  stringify: function (x) {
    if (istainted(x)) { throw new Error("Taint value flows in direct eval call") }
    return x
  },
  unary: function (op, x) {
    if (istainted(x)) { return taint(eval(op+" x")) }
    return eval(op+" x")
  },
  binary: function (op,  x1, x2) {
    var post = id
    if (istainted(x1)) { post=taint }
    if (istainted(x2)) { post=taint }
    return post(eval("x1 "+op+" x2"))
  }
}

/////////////
// Example //
/////////////

// var x = prompt("Enter something evil!");
// var o = {a:"Safe"}
// o.b = "foo "+x+" bar"
// function f (arg) {
//   alert(arg.a)
//   alert(arg.b)
// }
// f(o)

