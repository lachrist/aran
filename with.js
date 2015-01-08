
module.exports = function (aran) {

  var handlers = {}
  if (aran.traps.binary) {
    handlers.has = function (o, k) { return aran.traps.binary("in", String(k).substring(1), o) }
  } else {
    handlers.has = function (o,k) { return String(k).substring(1) in o }
  }
  if (aran.traps.get) {
    handlers.get = function (o, k) { return aran.traps.get(o, String(k).substring(1)) }
  } else {
    handlers.get = function (o, k) { return o[String(k).substring(1)] }
  }
  if (aran.traps.set) {
    handlers.set = function (o, k, v) { return aran.traps.set(o, String(k).substring(1), v) }
  } else {
    handlers.set = function (o, k, v) { return o[String(k).substring(1)] = v }
  }

  aran.with = function (o) { return new Proxy(o, handlers) }

}


  // aran.enumerate = function (o) {
  //   if (aran.traps.unwrap(aran.traps.binary("===", o, aran.traps.wrap(null)))) { return aran.traps.array() }
  //   if (aran.traps.unwrap(aran.traps.binary("===", aran.traps.unary("typeof", o), aran.traps.wrap("object")))) { return aran.traps.array() }
  //   return aran.traps.binary(
  //     "+",
  //     aran.traps.apply(aran.traps.get(aran.traps.get(aran.global, aran.traps.wrap("Object")), aran.traps.wrap("keys")), o),
  //     aran.enumerate(aran.traps.get(o, aran.traps.wrap("__proto__")))
  //   )
  // }

  // aran.for_left = function (o) {
  //   if (!window.Proxy) { window.alert("JavaScript proxies are needed to suport for-in statement with member expression as left parts") }
  //   return new Proxy(o, { set: function (o, k, v) { return aran.traps.set(o, k, v) } })
  // }
