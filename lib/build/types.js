
// Initial Program //
exports.PROGRAM = [["statement"]];

// Initial Expression //
exports.read = ["identifier"];
exports.write = ["identifier", "expression"];
exports.closure = [["statement"]];
exports.primitive = ["primitive"];
exports.conditional = ["expression", "expression", "expression"];
exports.construct = ["expression", ["expression"]];
exports.apply = ["expression", ["expression"]];
exports.sequence = [["expression"]];
exports.binary = ["binary", "expression", "expression"];  // DELETED
exports.unary = ["unary", "expression"];                  // DELETED
exports.regexp = ["string", "string"];                    // DELETED
exports.get = ["expression", "expression"];               // DELETED
exports.set = ["expression", "expression", "expression"]; // DELETED
exports.array = [["expression"]];                         // DELETED
exports.object = [[["string", "expression"]]];            // DELETED

// Initial Statement //
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

// 2-Hoisting //
exports.Hoist = [["statements"], ["statements"]];
exports.hoist = [["statements"], "expression"];

// 3-mixbag //
exports.discard = ["identifier"];
exports.eval = ["expression"];
exports.invoke = ["expression", "expression", ["expression"]];

// 4-Static //
exports.save = ["string", "expression"]; // DELETED
exports.load = ["strign"];               // DELETED

// 5-builtin //
exports.builtin = ["string"];

// 6-completion //
exports.completion = ["expression"];

// 7-identifier //
exports.Sandbox = ["expression", ["statements"]];
exports.sanitize_read = ["identifier"];
exports.sanitize_write = ["identifier", "expression"];
exports.sanitize_discard = ["identifier"];
exports.SanitizeDeclare = ["kind", "identifier", "expression"];
