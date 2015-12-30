
(function () {

  aran.forwards = {};
  aran.forwards.ast = function (x, i) { };
  aran.forwards.literal = function (x, i) { return x };
  aran.forwards.test = function (x, i) { return x };
  aran.forwards.declare = function (v, i) { return undefined };
  aran.forwards.read = function (v, x, i) { return x };
  aran.forwards.write = function (v, x1, x2, i) { return x2 };
  aran.forwards.arguments = function (xs, i) { return xs };
  aran.forwards.apply = function (f, t, xs, i) { return f.apply(t, xs) }
  aran.forwards.construct = function (c, xs, i) {
    var o = Object.create(c.prototype);
    var r = c.apply(o, xs);
    return (typeof r === "object" && r !== null) ? r : o;
  };
  aran.forwards.eval = function (x, i) { return x };
  aran.forwards.unary = function (o, x, i) { return eval(o+" x") };
  aran.forwards.binary = function (o, x1, x2, i) { return eval("x1 "+o+" x2") };
  aran.forwards.return = function (x, i) { return x };
  aran.forwards.try = function (i) { };
  aran.forwards.catch = function (x, i) { return x };
  aran.forwards.finally = function (i) { };
  aran.forwards.throw = function (x, i) { return x };
  aran.forwards.get = function (o, k, i) { return o[k] };
  aran.forwards.set = function (o, k, x, i) { return o[k] = x };
  aran.forwards.delete = function (o, k, i) { return delete o[k] };
  aran.forwards.enumerate = function (o, i) {
    var ks = [];
    for (var k in o)
      ks.push(k);
    return ks;
  };

} ());
