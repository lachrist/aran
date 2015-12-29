
// This analysis logs and forwards everything //

var Aran = require("aran");

eval(Aran.client);

var depth = 0;

function log (trap, xs) {
  var n = aran.fetch(ast, xs[xs.length-1]);
  var s = Array(depth+1).join("    ")+trap+" "+n.type+"@"+n.loc.start.line+"-"+n.loc.start.column;
  for (var i=0; i<xs.length-1; i++)
    s += (typeof xs[i] === "function") ? " [function "+xs[i].name+"]" : " "+String(xs[i]);
  console.log(s);
}

var ast = null;

var forward = {};
forward.literal = function (x, i) { return x };
forward.test = function (x, i) { return x };
forward.declare = function (v, i) { return undefined };
forward.read = function (v, x, i) { return x };
forward.write = function (v, x1, x2, i) { return x2 };
forward.arguments = function (xs, i) { return xs };
forward.construct = function (c, xs, i) {
  var o = Object.create(c.prototype);
  var r = c.apply(o, xs);
  return (typeof r === "object" && r !== null) ? r : o;
};
forward.eval = function (x, i) { return x };
forward.unary = function (o, x, i) { return eval(o+" x") };
forward.binary = function (o, x1, x2, i) { return eval("x1 "+o+" x2") };
forward.return = function (x, i) { return x };
forward.try = function (i) { };
forward.catch = function (x, i) { return x };
forward.finally = function (i) { };
forward.throw = function (x, i) { return x };
forward.get = function (o, k, i) { return o[k] };
forward.set = function (o, k, x, i) { return o[k] = x };
forward.delete = function (o, k, i) { return delete o[k] };
forward.enumerate = function (o, i) {
  var ks = [];
  for (var k in o)
    ks.push(k);
  return ks;
};

aran.traps = {};
aran.traps.ast = function (x, i) { ast = x };
Object.keys(forward).forEach(function (k) {
  aran.traps[k] = function () {
    log(k, arguments);
    return forward[k].apply(null, arguments);
  };
});
aran.traps.apply = function (f, t, xs, i) {
  depth++;
  log("apply", arguments);
  var r = f.apply(t, xs);
  depth--;
  return r;
};

module.exports = Aran.compile.bind(null, {traps:Object.keys(aran.traps), loc:true, offset:0});
