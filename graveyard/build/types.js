
/////////////
// Initial //
/////////////
// PROGRAM //
exports.PROGRAM = [["statement"]];
// Statement //
exports.Block = [["statement"]];
exports.Statement = ["expression"];
exports.Return = ["expression"];
exports.Throw = ["expression"];
exports.Try = [["statement"], ["statement"], ["statement"]];
exports.Declare = ["kind", "identifier", "expression"];
exports.If = ["expression", ["statement"], ["statement"]];
exports.Label = ["identifier", ["statement"]];
exports.Break = ["identifier"];
exports.While = ["expression", ["statement"]];
exports.Debugger = [];
exports.Switch = [[["expression", ["statement"]]]];
exports.With = ["expression", ["statement"]];
// expression //
exports.this = [];
exports.meta = ["identifier", "identifier"];
exports.identifier = ["identifier"];
exports.assign = ["expression", "expression"];
exports.write = ["identifier", "expression"];
exports.function = [["statement"]];
exports.literal = ["json-primitive"];
exports.conditional = ["expression", "expression", "expression"];
exports.construct = ["expression", ["expression"]];
exports.call = ["expression", ["expression"]];
exports.sequence = [["expression"]];
exports.binary = ["binary", "expression", "expression"];
exports.unary = ["unary", "expression"];
exports.regexp = ["string", "string"];
exports.get = ["expression", "expression"];
exports.set = ["expression", "expression", "expression"];
exports.array = [["expression"]];
exports.object = [[["string", "expression"]]];

///////////////
// Shorthand //
///////////////
exports.primitive = ["non-symbolic-primitive"];
exports.discard = ["identifier"];
exports.eval = ["expression"];
exports.completion = ["expression"];

////////////
// Static //
////////////
exports.save = ["string", "string", "expression"];
exports.load = ["string", "string"];

/////////////
// Builtin //
/////////////
exports.builtin = ["string"];
exports.apply = ["expression", "expression", ["expression"]];

////////////////
// Mangling //
////////////////
exports.Sandbox = ["expression", ["statements"]];
exports.$read = ["identifier"];
exports.$write = ["identifier", "expression"];
exports.$discard = ["identifier"];
exports.$Declare = ["kind", "identifier", "expression"];

//////////////
// Hoisting //
//////////////
exports.Hoist = [["statements"], ["statements"]];
exports.hoist = [["statements"], "expression"];
