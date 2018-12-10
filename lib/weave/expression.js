
const ArrayLite = require("array-lite");
const Escape = require("./escape");
const Build = require("./build.js");

module.exports = (visit, trap) => {

  const visitors = {};

  visitors.closure = (block, node) => trap.closure(
    Build.closure(
      visit.BLOCK(block)("closure", null)),
    node);

  visitors.arrival = (index, node) => Build.arrival(index);

  visitors.error = (node) => Build.error();

  visitors.sequence = (expression1, expression2, node) => Build.sequence(
    trap.drop(
      visit.expression(expression1),
      node),
    visit.expression(expression2));

  visitors.apply = (expression1, expression2, expressions, node) => trap.apply(
    visit.expression(expression1),
    visit.expression(expression2),
    ArrayLite.map(expressions, visit.expression),
    node);

  visitors.construct = (expression, expressions, node) => trap.construct(
    visit.expression(expression),
    ArrayLite.map(expressions, visit.expression),
    node);

  visitors.builtin = (name, node) => trap.builtin(
    Build.builtin(name),
    Build.primitive(name),
    node);

  visitors.primitive = (value, node) => trap.primitive(
    Build.primitive(value),
    node);

  visitors.read = (identifier, node) => trap.read(
    Build.read(
      Escape(identifier)),
    Build.primitive(identifier),
    node);

  visitors.write = (identifier, expression1, expression2, node) => Build.write(
    Escape(identifier),
    trap.write(
      visit.expression(expression1),
      Build.primitive(identifier),
      node),
    visit.expression(expression2));

  visitors.eval = (expression, node) => Build.eval(
    trap.eval(
      visit.expression(expression),
      node));

  visitors.conditional = (expression1, expression2, expression3, node) => Build.conditional(
    trap.test(
      visit.expression(expression1),
      node),
    visit.expression(expression2),
    visit.expression(expression3));

  return visitors;

};
