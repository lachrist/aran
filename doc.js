
var Esprima = require("esprima");
var Fs = require("fs");

var code = Fs.readFileSync(__dirname+"/instrument.js", {encoding:"utf8"});
var tree = Esprima.parse(code);

function visit (node) {
  if (!node || typeof node !== "object")
    return [];
  if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name in helpers)
    return Array.prototype.concat.apply(helpers[node.callee.name], node.arguments.map(visit));
  if (node.type === "CallExpression"
      && node.callee.type === "MemberExpression"
      && !node.callee.computed
      && node.callee.object.type === "MemberExpression"
      && !node.callee.object.computed
      && node.callee.object.object.type === "Identifier"
      && node.callee.object.object.name === "ctx"
      && node.callee.object.property.name === "traps")
    return Array.prototype.concat.apply([node.callee.property.name], node.arguments.map(visit));
  return Array.prototype.concat.apply([], Object.keys(node).map(function (k) { return visit(node[k]) }));
}

var helpers = {};
tree.body.map(function (node) { return 
  if (node.type === "FunctionDeclaration")
    helpers[node.id.name] = visit(node);
});

var traps = [
  "Ast",
  "Strict",
  "literal",
  "Declare",
  "Undeclare",
  "read",
  "write",
  "get",
  "set",
  "delete",
  "enumerate",
  "arguments",
  "return",
  "apply",
  "construct",
  "eval",
  "unary",
  "binary",
  "test",
  "throw",
  "Try",
  "catch",
  "Finally",
  "Label",
  "Break"
];
process.stdout.write(repeat(" ", 25)+"|");
process.stdout.write(traps.join("|"));
process.stdout.write("\n");
process.stdout.write(repeat("-", 25)+"|");
process.stdout.write(traps.map(function(t) { return repeat("-", t.length) }).join("|"));
process.stdout.write("\n");
tree.body.forEach(function (node) {
  if (node.type === "ExpressionStatement"
      && node.expression.type === "AssignmentExpression"
      && node.expression.operator === "="
      && node.expression.left.type === "MemberExpression"
      && node.expression.left.object.type === "Identifier"
      && node.expression.left.object.name === "visitors"
      && !node.expression.left.computed) {
    var ts = visit(node.expression.right);
    process.stdout.write(pad(node.expression.left.property.name, 25)+"|");
    process.stdout.write(traps.map(function (t) {
      return pad(ts.indexOf(t) === -1 ? "" : " X", t.length);
    }).join("|"));
    process.stdout.write("\n");
  }
});

function repeat (s, n) { return Array(n+1).join(s) }

function pad (s, n) { return s+repeat(" ", n-s.length) }
