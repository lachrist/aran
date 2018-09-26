
/////////////
// Program //
/////////////

exports.PROGRAM = [["statement"]];

////////////////
// Expression //
////////////////

// Initial //
exports.read = ["identifier"];
exports.write = ["identifier", "expression"];
exports.closure = [["statement"]];
exports.primitive = ["primitive"];
exports.conditional = ["expression", "expression", "expression"];
exports.construct = ["expression", ["expression"]];
exports.apply = ["expression", ["expression"]];
exports.sequence = [["expression"]];
// Initial-Dropped //
exports.binary = ["binary", "expression", "expression"];
exports.unary = ["unary", "expression"];
exports.regexp = ["string", "string"];
exports.get = ["expression", "expression"];
exports.set = ["expression", "expression", "expression"];
exports.array = [["expression"]];
exports.object = [[["string", "expression"]]];

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

/////////////
// Derived //
/////////////

// 2-Hoisting //
exports.Hoist = [["statements"], ["statements"]];
exports.hoist = [["statements"], "expression"];
exports.declare = ["kind", "identifier", "expression"];
// 3-Static //
exports.save = ["string", "expression"];
exports.load = ["strign"];
// 4-builtin //
exports.builtin = ["string"];
// 5-mixbag //
exports.discard = ["identifier"];
exports.eval = ["expression"];
exports.invoke = ["expression", "expression", ["expression"]];


exports.object_closure = [{strict:"boolean", arrow:"boolean", name:"string", length:"number"}, ["statements"]];

// 6-completion //
exports.completion = ["expression"];
// 7-identifier //
exports.Sandbox = ["expression", ["statements"]];
exports.sanitize_read = ["identifier"];
exports.sanitize_write = ["identifier", "expression"];
exports.sanitize_discard = ["identifier"];
exports.SanitizeDeclare = ["kind", "identifier", "expression"];
