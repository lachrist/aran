
/////////////
// Program //
/////////////

exports.PROGRAM = ["boolean", ["statement"], "expression"];

////////////////
// Expression //
////////////////

exports.read = ["identifier"];
exports.write = ["identifier", "expression"];
exports.array = [["expression"]];
exports.object = [[{0:"expression",1:"expression"}]];
exports.closure = ["boolean", ["statement"]];
exports.primitive = ["primitive"];
exports.regexp = ["string", "string"];
exports.get = ["expression", "expression"];
exports.set = ["expression", "expression", "expression"];
exports.conditional = ["expression", "expression", "expression"];
exports.binary = ["binary", "expression", "expression"];
exports.unary = ["unary", "expression"];
exports.delete = ["expression", "expression"];
exports.discard = ["identifier"];
exports.construct = ["expression", ["expression"]];
exports.apply = ["expression", ["expression"]];
exports.invoke = ["expression", "expression", ["expression"]];
exports.sequence = [["expression"]];
exports.eval = ["expression"];

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
exports.Label = ["identifier", ["statement"]];
exports.Break = ["?identifier"];
exports.Continue = ["?identifier"];
exports.While = ["expression", ["statement"]];
exports.Debugger = [];
exports.Switch = [[{0:"expression", 1:["statement"]}]];
exports.With = ["expression", ["statement"]];
