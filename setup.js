(function (aran) {

  if (aran.__setup__)
    return;
  aran.__setup__ = true;

  var defineProperties = Object.defineProperties;

  aran.__apply__ = function (f, t, xs) { return f.apply(t, xs) };
  aran.__apply__ = (typeof Reflect !== "undefined" && Reflect.apply) || aran.apply;

  aran.__enumerate__ = function (o) {
    var ks = [];
    for (var k in o)
      ks[ks.length] = k;
    return ks;
  };
  aran.__enumerate__ = (typeof Reflect !== "undefined" && Reflect.enumerate) || aran.enumerate;

  aran.__eval__ = eval;

  aran.__object__ = function (xs) {
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

  aran.search = function (ast, idx) {
    if (ast && typeof ast === "object") {
      if (ast.index === idx)
        return ast;
      if (ast.index < idx && ast.maxIndex > idx) {
        for (var k in ast) {
          var tmp = aran.search(ast[k], idx);
          if (tmp)
            return tmp;
        }
      }
    }
  };

} (ARAN));