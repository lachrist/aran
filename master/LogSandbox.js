
// Prevent the instrumented code to access ANY property of the global object.
// This includes: 'Object', 'Function' and even 'undefined'.
// This master uses Harmony proxy to record operation made to the empty sandbox.

function log (op, p) { console.log(op+" "+p) }

exports.sandbox = new Proxy({}, {
  has: function (s, p) { return (log("Set", p), p in s) },
  get: function (s, p) { return (log("Get", p), s[p]) },
  set: function (s, p, v) { return (log("Has", p), s[p]=v) },
  deleteProperty: function (s, p) { return (log("Delete", p), delete s[p]) }
})
