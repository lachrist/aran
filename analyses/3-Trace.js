
// This analysis traps everything, logs everything and transparently forwards all operations //

var aran = {};
(function () { return this } ()).aran = aran;

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
//aran.construct = function (c, xs, i) { return new c(...xs) };
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
  function search (ast, idx) {
    var tmp;
    if (typeof ast !== "object" || ast === null)
      return;
    if (ast.index === idx)
      return ast;
    if (ast.index > idx || ast.maxIndex < idx)
      return;
    for (var k in ast)
      if (tmp = search(ast[k], idx))
        return tmp;
  }
  Object.keys(aran).forEach(function (name) {
    var trap = aran[name];
    aran[name] = function () {
      log(name, arguments);
      return trap.apply(null, arguments);
    };
  });
  var sources = [];
  aran.Ast = function (ast, url) { sources.push({url:url, ast:ast}) };
  function locate (index) {
    var node;
    for (var i=0; i<sources.length; i++)
      if (node = search(sources[i].ast, index))
        return node.type
          + "@" + sources[i].url
          + "#" + node.loc.start.line + "-" + node.loc.start.column;
    return index; 
  }
  function log (name, args) {
    var mess = name+" "+locate(args[args.length-1]);
    for (var i=0; i<args.length-1; i++)
      mess += (typeof args[i] === "function") ? " [function " + args[i].name + "]" : " " + args[i];
    console.log(mess);
  }
} ());

