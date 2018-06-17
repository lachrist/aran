
/////////////
// Program //
/////////////

exports.PROGRAM = ["boolean", ["list", "statement"]];

////////////////
// Expression //
////////////////

exports.read = ["identifier"];
exports.write = ["identifier", "expression"];
exports.array = [["list", "expression"]];
exports.object = [["list", {0:"string",1:"expression"}]];
exports.closure = ["boolean", ["list", "statement"]];
exports.function = ["boolean", ["list", "identifier"], ["list", "statement"]];
exports.primitive = ["primitive"];
exports.regexp = ["string", "string"];
exports.get = ["expression", "expression"];
exports.set = ["expression", "expression", "expression"];
exports.conditional = ["expression", "expression", "expression"];
exports.binary = ["binary", "expression", "expression"];
exports.unary = ["unary", "expression"];
exports.delete = ["expression", "expression"];
exports.discard = ["identifier"];
exports.construct = ["expression", ["list", "expression"]];
exports.apply = ["expression", ["list", "expression"]];
exports.invoke = ["expression", "expression", ["list", "expression"]];
exports.sequence = [["list", "expression"]];
exports.eval = ["expression"];

///////////////
// Statement //
///////////////

exports.Block = [["list", "statement"]];
exports.Statement = ["expression"];
exports.Return = ["expression"];
exports.Throw = ["expression"];
exports.Try = [["list", "statement"], ["list", "statement"], ["list", "statement"]];
exports.Declare = ["kind", "identifier", "expression"];
exports.If = ["expression", ["list", "statement"], ["list", "statement"]];
exports.Label = ["label", ["list", "statement"]];
exports.Break = ["label"];
exports.While = ["expression", ["list", "statement"]];
exports.Debugger = [];
exports.Switch = [["list", {0:"expression", 1:["statement"]}]];
exports.With = ["expression", ["list", "statement"]];
