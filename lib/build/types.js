
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
exports.Label = ["label", ["statement"]];
exports.Break = ["label"];
exports.While = ["expression", ["statement"]];
exports.Debugger = [];
exports.Switch = [[["expression", ["statement"]]]];
exports.With = ["expression", ["statement"]];
// expression //
exports.read = ["identifier"];
exports.write = ["identifier", "expression"];
exports.closure = [["statement"]];
exports.jsonliteral = ["json-primitive"];
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
exports.literal = ["non-symbolic-primitive"];
exports.discard = ["identifier"];
exports.eval = ["expression"];
exports.completion = ["expression"];

////////////
// Static //
////////////
exports.save = ["string", "expression"];
exports.load = ["strign"];

/////////////
// Builtin //
/////////////
exports.builtin = ["string"];
exports.apply = ["expression", "expression", ["expression"]];

////////////////
// Identifier //
////////////////
exports.Sandbox = ["expression", ["statements"]];
exports.sanitize_read = ["identifier"];
exports.sanitize_write = ["identifier", "expression"];
exports.sanitize_discard = ["identifier"];
exports.SanitizeDeclare = ["kind", "identifier", "expression"];

//////////////
// Hoisting //
//////////////
exports.Hoist = [["statements"], ["statements"]];
exports.hoist = [["statements"], "expression"];
