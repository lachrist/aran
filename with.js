
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
