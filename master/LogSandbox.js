
// Prevent the instrumented code to access ANY property of the global object.
// This includes: 'Object', 'Function' and even 'undefined'.
// This analyze uses Harmony proxy to record operation made to the empty sandbox.

function log (op, p) { console.log(op+" "+p) }

exports.sandbox = new Proxy({}, {
  get: function (s, p) { return (log("Get", p), s[p]) },
  has: function (s, p) { return (log("Set", p), s[p]=v) },
  set: function (s, p, v) { return (log("Has", p), p in s) },
  deleteProperty: function (s, p) { return (log("Delete", p), delete s[p]) }
})
