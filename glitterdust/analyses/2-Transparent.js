
// This analysis traps everything and transparently forwards all operations //

aran.traps = {};

aran.traps.Ast = function (x, i) { };
aran.traps.Strict = function (i) { };
aran.traps.literal = function (x, i) { return x };

// Environment //
aran.traps.Declare = function (vs, i) { };
aran.traps.Undeclare = function (vs, i) { };
aran.traps.read = function (v, x, i) { return x };
aran.traps.write = function (v, x1, x2, i) { return x2 };

// Object
aran.traps.arguments = function (xs, i) { return xs };
aran.traps.apply = function (f, t, xs, i) { return f.apply(t, xs) }
aran.traps.construct = function (c, xs, i) {
  var o = Object.create(c.prototype);
  var r = c.apply(o, xs);
  return (typeof r === "object" && r !== null) ? r : o;
};
aran.traps.eval = function (x, i) { return x };
aran.traps.unary = function (o, x, i) { return eval(o+" x") };
aran.traps.binary = function (o, x1, x2, i) { return eval("x1 "+o+" x2") };
aran.traps.return = function (x, i) { return x };
aran.traps.try = function (i) { };
aran.traps.catch = function (x, i) { return x };
aran.traps.finally = function (i) { };
aran.traps.throw = function (x, i) { return x };
aran.traps.get = function (o, k, i) { return o[k] };
aran.traps.set = function (o, k, x, i) { return o[k] = x };
aran.traps.delete = function (o, k, i) { return delete o[k] };
aran.traps.enumerate = function (o, i) {
  var ks = [];
  for (var k in o)
    ks.push(k);
  return ks;
};
aran.traps.test = function (x, i) { return x };
