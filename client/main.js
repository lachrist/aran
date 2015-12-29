
(function () {

  var g = (function () { return this } ());
  if (!g) {
    if (typeof global !== "undefined")
      g = global;
    else if (typeof window !== "undefined")
      g = window;
    else
      throw new Error("Aran could not find the global object...");
  }

  var aran = g.aran = {};

  aran.apply = function (f, t, xs) { return f.apply(t, xs) };
  aran.apply = (g.Reflect && g.Reflect.apply) || aran.apply;

  aran.enumerate = function (o) {
    var ks = [];
    for (var k in o)
      ks[ks.length] = k;
    return ks;
  };
  aran.enumerate = (g.Reflect && g.Reflect.enumerate) || aran.enumerate;

  aran.eval = eval;

  var defineProperties = Object.defineProperties;

  aran.object = function (xs) {
    var ps = {};
    for (var i=0; i<xs.length; i+=3) {
      if (!ps[xs[i]])
        ps[xs[i]] = {enumerable:true, configurable:true};
      if (xs[i+1] === "init") {
        delete ps[xs[i]].get;
        delete ps[xs[i]].set;
        ps[xs[i]].writable = true;
        ps[xs[i]].value = xs[i+2]
      } else {
        delete ps[xs[i]].writable
        delete ps[xs[i]].value
        ps[xs[i]][xs[i+1]] = xs[i+2]
      }
    }
    return defineProperties({}, ps);
  };

} ());
