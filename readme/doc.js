
const Esprima = require("esprima");
const Fs = require("fs");
const Points = require("../points.js");

const flaten = (xs, xss) => Array.prototype.concat.apply(xs, xss);
const backquote = (s) => "`"+s+"`";
const repeat = (s, n) => Array(n+1).join(s);
const pad = (s, n) => s+repeat(" ", n-s.length);
const extract = (node) => {
  if (node.type === "ExpressionStatement") {
    node = node.expression;
    if (node.type === "AssignmentExpression" && node.operator === "=") {
      node = node.left;
      if (node.type === "MemberExpression" && !node.computed && node.object.type === "Identifier" && node.object.name === "visitors") {
        return node.property.name;
      }
    }
  }
}

const visit = (node) => {
  if (!node || typeof node !== "object")
    return [];
  if (node.type === "CallExpression"
      && node.callee.type === "MemberExpression"
      && node.callee.object.type === "Identifier"
      && node.callee.object.name === "Helpers")
    return flaten(helpers[node.callee.property.name], node.arguments.map(visit));
  if (node.type === "CallExpression"
      && node.callee.type === "MemberExpression"
      && node.callee.computed === false
      && node.callee.object.type === "MemberExpression"
      && node.callee.object.computed === false
      && node.callee.object.object.type === "Identifier"
      && node.callee.object.object.name === "ctx"
      && node.callee.object.property.name === "traps")
    return flaten([node.callee.property.name], node.arguments.map(visit));
  return flaten([], Object.keys(node).map((k) => visit(node[k])));
}

Esprima.parse(Fs.readFileSync(__dirname+"/../helpers.js", {encoding:"utf8"})).body.forEach((node) => {
  if (node.type === "ExpressionStatement"
      && node.expression === "AssignmentExpression"
      && node.expression.left === "MemberExpression"
      && node.expression.left.object.type === "Identifier"
      && node.expression.left.object.name === "exports") {
    helpers[node.expression.left.property.name] = visit(node.expression.right);
  }
});

process.stdout.write("X"+repeat(" ", 24)+"| ");
process.stdout.write(points.map(backquote).join(" | "));
process.stdout.write("\n");
process.stdout.write(repeat("-", 25)+"|");
process.stdout.write(points.map((t) => ":-"+repeat("-", t.length)+"-:").join("|"));
process.stdout.write("\n");
Esprima.parse(Fs.readFileSync(__dirname+"/../instrument.js", {encoding:"utf8"})).body.forEach((node) => {
  const trap = extract(node);
  if (trap) {
    const ts = visit(node.expression.right);
    process.stdout.write(pad(backquote(trap), 25)+"|");
    process.stdout.write(points.map((t) => pad(ts.indexOf(t) === -1 ? "" : " X", t.length+4)).join("|"));
    process.stdout.write("\n");
  }
});
