
const ArrayLite = require("array-lite");
const Trap = require("./trap.js");
const Build = require("./build.js");
const Block = require("./block.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");

const Reflect_apply = Reflect.apply;

module.exports = (block, node, pointcut) => {
  const trap = Trap(pointcut);
  const make = (visitors) => (array) => Reflect_apply(
    visitors[array[0]],
    null,
    ArrayLite.concat(
      ArrayLite.slice(array, 1, array.length),
      [array.__node__]));
  const visit = {};
  visit.BLOCK = Block(visit, trap);
  visit.Statement = make(Statement(visit, trap));
  visit.expression = make(Expression(visit, trap));
  block = visit.BLOCK(block, node)("program", null);
  block[1] = ArrayLite.concat(
    block[1],
    Build.Expression(
      trap.success(
        Build.read(0),
        node)));
  const expression = trap.failure(
    Build.read("error"),
    node);
  return (
    expression[0] === "trap" ?
    [
      [],
      Build.Try(
        null,
        block,
        [
          [],
          Build.Throw(expression)],
        [[], []])] :
    block);
};
