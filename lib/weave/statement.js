
const ArrayLite = require("array-lite");
const Escape = require("./escape");
const Build = require("./build.js");

module.exports = (visit, trap) => {

  const visitors = {};

  visitors.Write = (identifier, expression, node) => Build.Write(
    Escape(identifier),
    trap.write(
      visit.expression(expression),
      Build.primitive(identifier),
      node));

  visitors.Expression = (expression, node) => Build.Expression(
    trap.drop(
      visit.expression(expression),
      node));

  visitors.Break = (label, node) => ArrayLite.concat(
    trap.Break(
      Build.primitive(label),
      node),
    Build.Break(label));

  visitors.Continue = (label, node) => ArrayLite.concat(
    trap.Continue(
      Build.primitive(label),
      node),
    Build.Continue(label));

  visitors.Debugger = (node) => ArrayLite.concat(
    trap.Debugger(node),
    Build.Debugger());

  visitors.Return = (expression, node) => Build.Return(
    trap.return(
      visit.expression(expression),
      node));

  visitors.Throw = (expression, node) => Build.Throw(
    trap.throw(
      visit.expression(expression),
      node));

  visitors.Block = (label, block, node) => Build.Block(
    label,
    visit.BLOCK(block, node)("block", label));

  visitors.If = (label, expression, block1, block2, node) => Build.If(
    label,
    trap.test(
      visit.expression(expression),
      node),
    visit.BLOCK(block1, node)("then", label),
    visit.BLOCK(block2, node)("else", label));

  visitors.Try = (label, block1, block2, block3, node) => Build.Try(
    label,
    visit.BLOCK(block1, node)("try", label),
    visit.BLOCK(block2, node)("catch", label),
    visit.BLOCK(block3, node)("finally", label));

  visitors.While = (label, expression, block, node) => Build.While(
    label,
    trap.test(
      visit.expression(expression),
      node),
    visit.BLOCK(block, node)("loop", label));

  visitors.Switch = (label, identifiers, clauses, node) => ArrayLite.concat(
    trap.Enter(
      Build.primitive("switch"),
      Build.primitive(null),
      Build.array(
        ArrayLite.map(identifiers, Build.primitive)),
      node),
    Build.Switch(
      label,
      ArrayLite.map(identifiers, Escape),
      ArrayLite.map(
        clauses,
        (clause) => [
          trap.test(
            visit.expression(clause[0])),
          ArrayLite.flatMap(clause[1], visit.Statement)])),
    trap.Leave(node));

  return visitors;

};
