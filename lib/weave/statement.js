
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
    visit.BLOCK(block)("block", label));

  visitors.If = (label, expression, block1, block2, node) => Build.If(
    label,
    trap.test(
      visit.expression(expression),
      node),
    visit.BLOCK(block1)("then", label),
    visit.BLOCK(block2)("else", label));

  visitors.Try = (label, block1, block2, block3, node) => Build.Try(
    label,
    visit.BLOCK(block1)("try", label),
    visit.BLOCK(block2)("catch", label),
    visit.BLOCK(block3)("finally", label));

  visitors.While = (label, expression, block, node) => Build.While(
    label,
    trap.test(
      visit.expression(expression),
      node),
    visit.BLOCK(block, node)("loop", label));

  visitors.Default = (node) => Build.Default();

  visitors.Case = (expression, node) => Build.Case(
    trap.test(
      visit.expression(expression),
      node));

  visitors.Switch = (label, block, node) => Build.Switch(
    label,
    visit.BLOCK(block)("switch", label));

  return visitors;

};
