
// General //
exports.Program = function (i) { };
exports.Strict = function (i) { };
exports.literal = function (x, i) { return x };
exports.unary = function (o, x, i) { return eval(o+" x") };
exports.binary = function (o, x1, x2, i) { return eval("x1 "+o+" x2") };

// Environment //
exports.Declare = function (vs, i) { };
exports.read = function (v, x, i) { return x };
exports.write = function (v, x1, x2, i) { return x2 };
exports.Enter = function (i) { };
exports.Leave = function (i) { };

// Apply //
exports.apply = function (f, t, xs, i) { return f.apply(t, xs) };
exports.construct = function (c, xs, i) { return new c(...xs) };
exports.Arguments = function (xs, i) { };
exports.return = function (x, i) { return x };
exports.eval = function (x, i) { return x };

// Object //
exports.get = function (o, k, i) { return o[k] };
exports.set = function (o, k, x, i) { return o[k] = x };
exports.delete = function (o, k, i) { return delete o[k] };
exports.enumerate = function (o, i) {
  var ks = [];
  for (var k in o)
    ks.push(k);
  return ks;
};

// Control //
exports.test = function (x, i) { return x };
exports.Label = function (l, i) { };
exports.Break = function (l, i) { };
exports.throw = function (x, i) { return x };
exports.Try = function (i) { };
exports.catch = function (v, x, i) { return x };
exports.Finally = function (i) { };
