
// This analysis traps everything, logs everything and transparently forwards all operations //

var aran = {};

// General //
aran.Strict = function (i) { };
aran.literal = function (x, i) { return x };
aran.unary = function (o, x, i) { return eval(o+" x") };
aran.binary = function (o, x1, x2, i) { return eval("x1 "+o+" x2") };

// Environment //
aran.Declare = function (vs, i) { };
aran.read = function (v, x, i) { return x };
aran.write = function (v, x1, x2, i) { return x2 };
aran.Enter = function (i) { };
aran.Leave = function (i) { };

// Apply //
aran.apply = function (f, t, xs, i) { return f.apply(t, xs) };
aran.construct = function (c, xs, i) { return new c(...xs) };
aran.Arguments = function (xs, i) { };
aran.return = function (x, i) { return x };
aran.eval = function (x, i) { return x };

// Object //
aran.get = function (o, k, i) { return o[k] };
aran.set = function (o, k, x, i) { return o[k] = x };
aran.delete = function (o, k, i) { return delete o[k] };
aran.enumerate = function (o, i) {
  var ks = [];
  for (var k in o)
    ks.push(k);
  return ks;
};

// Control //
aran.test = function (x, i) { return x };
aran.Label = function (l, i) { };
aran.Break = function (l, i) { };
aran.throw = function (x, i) { return x };
aran.Try = function (i) { };
aran.catch = function (v, x, i) { return x };
aran.Finally = function (i) { };

(function () {
  var tree;
  function log (trap, xs) {
    var n = aran.__search__(tree, xs[xs.length-1]);
    var s = trap+" "+n.type+"@"+n.loc.start.line+"-"+n.loc.start.column;
    for (var i=0; i<xs.length-1; i++)
      s += (typeof xs[i] === "function") ? " [function "+xs[i].name+"]" : " "+String(xs[i]);
    console.log(s);
  }
  Object.keys(aran).forEach(function (k) {
    var trap = aran[k];
    aran[k] = function () {
      log(k, arguments);
      return trap.apply(null, arguments);
    };
  });
  aran.Ast = function (x, i) { tree = x };
} ());

