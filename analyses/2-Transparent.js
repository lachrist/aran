
// This analysis traps everything and transparently forwards all operations //

var aran = {};
(function () { return this } ()).aran = aran;

// General //
aran.Ast = function (x, i) { };
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
// aran.construct = function (c, xs, i) { return new c(...xs) };
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
