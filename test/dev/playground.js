
// var Aran = require("../..")

// Error.stackTraceLimit = Infinity;

(function () {

  var o = {a:1, x:2, y:3}
  var proxy = new Proxy(o, {
    get: function (o, k) { console.log("get "+k); return o[k] },
    set: function (o, k, v) { console.log("set "+k); return o[k]=v },
    has: function (o, k) { console.log("has "+k); return k in o },
    getPropertyDescriptor: function (o, k) { console.log("get-descr "+k); return Object.getOwnPropertyDescriptor(o, k) },
    deleteProperty: function (o, k) { console.log("del "+k); return delete o[k] }
  })

  with (proxy) {
    x;
  }
  
  return o

} ())

