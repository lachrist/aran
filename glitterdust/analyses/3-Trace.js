
// This analysis traps everything, logs everything and transparently forwards all operations //

var Aran = require("aran");

var traps = {};

// General //
traps.Strict = function (i) { };
traps.literal = function (x, i) { return x };
traps.unary = function (o, x, i) { return eval(o+" x") };
traps.binary = function (o, x1, x2, i) { return eval("x1 "+o+" x2") };

// Environment //
traps.Declare = function (vs, i) { };
traps.read = function (v, x, i) { return x };
traps.write = function (v, x1, x2, i) { return x2 };
traps.Enter = function (i) { };
traps.Leave = function (i) { };

// Apply //
traps.apply = function (f, t, xs, i) { return f.apply(t, xs) };
//traps.construct = function (c, xs, i) { return new c(...xs) };
traps.Arguments = function (xs, i) { };
traps.return = function (x, i) { return x };
traps.eval = function (x, i) { return x };

// Object //
traps.get = function (o, k, i) { return o[k] };
traps.set = function (o, k, x, i) { return o[k] = x };
traps.delete = function (o, k, i) { return delete o[k] };
traps.enumerate = function (o, i) {
  var ks = [];
  for (var k in o)
    ks.push(k);
  return ks;
};

// Control //
traps.test = function (x, i) { return x };
traps.Label = function (l, i) { };
traps.Break = function (l, i) { };
traps.throw = function (x, i) { return x };
traps.Try = function (i) { };
traps.catch = function (v, x, i) { return x };
traps.Finally = function (i) { };

Object.keys(traps).forEach(function (name) {
  var trap = traps[name];
  traps[name] = function () {
    log(name, arguments);
    return trap.apply(null, arguments);
  };
});

function log (name, args) {
  var mess = name+" "+locate(args[args.length-1]);
  for (var i=0; i<args.length-1; i++)
    mess += (typeof args[i] === "function") ? " [function " + args[i].name + "]" : " " + args[i];
  console.log(mess);
}

function locate (index) {
  var node = aran.search(index);
  if (!node)
    return index;
  var loc = node.loc.start;
  for (var root = node; root.parent; root = root.parent);
  return node.type + "@" + root.url + "#" + loc.line + ":" + loc.column;
}

var aran = Aran({namespace:"__hidden__", traps: Object.keys(traps), loc:true});
global.__hidden__ = traps;
module.exports = aran.instrument;
