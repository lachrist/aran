
aran.traps = {}
aran.traps.wrap = function (x) { return x }
aran.traps.unwrap = function (v) { return v }
aran.traps.unary = function (op, v) { return window.eval(op + JSON.stringify(v)) }
aran.traps.binary = function (op, v1, v2) { return window.eval(JSON.stringify(v1)+op+JSON.stringify(v2)) }
aran.traps.call = function (f, vs) { f.call(vs) }
aran.traps.new = function (c, vs) { return new c.call(vs) }
aran.traps.get = function (o, k) { return o[k] }
aran.traps.set = function (o, k, v) { return o[k] = v }
aran.traps.delete = function (o, k) { return delete o[k] }

aran.hooks = {}

window.$console = window.console;
window.$prompt = window.prompt;
