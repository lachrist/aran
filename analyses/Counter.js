
exports.sandbox = {}

function wrap (x) { return {meta:0, actual:x} }
function unwrap (x) { return x.actual }

exports.traps = {
  primitive: wrap,
  object: wrap,
  array: wrap,
  arguments: wrap,
  function: wrap,
  regexp: wrap,
  booleanize: unwrap,
  stringify: unwrap,
  unary: function (op, x)       {  return {meta:x.meta+1, actual: eval(op+'x.actual')} },
  binary: function (op, x1, x2) { return {meta:x1.meta+x2.meta+1, actual:eval('x1.actual '+op+' x2.actual')} },
  apply: function (f, o, xs)    { f.meta++; return f.actual.apply(o, xs); },
};
