
/////////////
// Program //
/////////////

exports.PROGRAM = [["statement"]];

////////////////
// Expression //
////////////////

exports.read = ["identifier"];
exports.write = ["identifier", "expression"];
exports.array = [["expression"]];
exports.object = [[["string", "expression"]]];
exports.closure = [["statement"]];
exports.primitive = ["primitive"];
exports.regexp = ["string", "string"];
exports.get = ["expression", "expression"];
exports.set = ["expression", "expression", "expression"];
exports.conditional = ["expression", "expression", "expression"];
exports.binary = ["binary", "expression", "expression"];
exports.unary = ["unary", "expression"];
exports.construct = ["expression", ["expression"]];
exports.apply = ["expression", ["expression"]];
exports.sequence = [["expression"]];

///////////////
// Statement //
///////////////

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
