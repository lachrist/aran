
var Esprima = require("esprima");
var Fs = require("fs");

var code = Fs.readFileSync(__dirname+"/../instrument.js", {encoding:"utf8"});
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
tree.body.map(function (node) {
  if (node.type === "FunctionDeclaration")
    helpers[node.id.name] = visit(node);
});

var traps = [];
Fs.readFileSync(__dirname+"/../traps.js", "utf8")
  .replace(/\ntraps.(\w+)/g, function (_, name) { traps.push(name) });
process.stdout.write("X"+repeat(" ", 24)+"| ");
process.stdout.write(traps.map(backquote).join(" | "));
process.stdout.write("\n");
process.stdout.write(repeat("-", 25)+"|");
process.stdout.write(traps.map(function(t) { return ":-"+repeat("-", t.length)+"-:" }).join("|"));
process.stdout.write("\n");
tree.body.forEach(function (node) {
  var trap = extract(node);
  if (trap) {
    var ts = visit(node.expression.right);
    process.stdout.write(pad(backquote(trap), 25)+"|");
    process.stdout.write(traps.map(function (t) {
      return pad(ts.indexOf(t) === -1 ? "" : " X", t.length+4);
    }).join("|"));
    process.stdout.write("\n");
  }
});

function extract (node) {
  if (node.type === "ExpressionStatement") {
    node = node.expression;
    if (node.type === "AssignmentExpression" && node.operator === "=") {
      node = node.left;
      if (node.type === "MemberExpression" && !node.computed && node.object.type === "Identifier" && node.object.name === "visitors")
        return node.property.name;
    }
  }
}

function backquote (s) { return "`"+s+"`" }

function repeat (s, n) { return Array(n+1).join(s) }

function pad (s, n) { return s+repeat(" ", n-s.length) }
