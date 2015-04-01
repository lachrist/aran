
// This master tracks the origin of null and undefined values //

function wrap (x, origin, varname) {
  if (x === null || x === undefined) {
    return {
      __void__: true,
      value: x,
      origin: origin,
      varname: varname
    }
  }
  return x
}

function unwrap (x) { return x.__void__?x.value:x }

function print (x) {
  var start = x.origin.loc.start
  var msg = x.value+"@"+start.line+"-"+start.column
  if (x.varname) { msg = msg+" ("+x.varname+")" }
  return msg
}

exports.options = {ast:true, loc:true}

exports.traps = {
  primitive: function (val, node) { return wrap(val, node) },
  undefined: function (varname, node) { return wrap(undefined, node, varname) },
  booleanize: function (val, node) { return unwrap(val) },
  stringify: function (val, node) { return unwrap(val) },
  unary: function (op, x, node) { return wrap(eval(op+" unwrap(x)"), node) },
  binary: function (op, x, y, node) { return wrap(eval("unwrap(x) "+op+" unwrap(y)"), node) },
  get: function (obj, prop, node) {
    prop = unwrap(prop)
    if (obj.__void__) { throw new TypeError("Cannot read property "+prop+" of "+print(obj)) }
    return wrap(obj[prop], node)
  },
  set: function (obj, prop, val, node) {
    prop = unwrap(prop)
    if (obj.__void__) { throw new TypeError("Cannot set property "+prop+" of "+print(obj)) }
    return obj[prop] = val
  },
  delete: function (obj, prop, node) {
    prop = unwrap(prop)
    if (obj.__void__) { throw new TypeError("Connot delete property "+prop+" of "+print(obj)) }
    return delete obj[prop]
  },
  enumerate: function (obj, node) {
    var keys = []
    for (var key in unwerap(obj)) { keys.push(key) }
    return keys
  },
  catch: function (err, node) { return wrap(err, node) },
  function: function (fct, node) {
    fct.__instrumented__ = true
    return fct
  },
  apply: function (fct, th, args, node) {
    if (fct.__void__) { throw new TypeError(print(fct)+" is not a function") }
    if (fct.__instrumented__) { return fct.apply(th, args) }
    return wrap(fct.apply(th, args.map(unwrap)), node)
  },
  new: function (fct, args, node) {
    if (fct.__void__) { throw new TypeError(print(fct)+" is not a constructor") }
    if (fct.__instrumented__) {
      var o = Object.create(fct.prototype)
      var res = fct.apply(o, args)
      if (res.__void__) { return o }
      if (typeof res !== "object") { return o }
      return res
    }
    return wrap(new fct(...args.map(unwrap)), node)
  }
}
