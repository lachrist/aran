
const ArrayLite = require("array-lite");
const Trap = require("./trap.js");
const Build = require("./build.js");
const Block = require("./block.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");

const Reflect_apply = Reflect.apply;

module.exports = (block, pointcut) => {
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
  const expression = trap.failure(Build.read("error"), block.__node__);
  return (
    expression[0] === "trap" ?
    [
      [],
      Build.Try(
        null,
        visit.BLOCK(block, block.__node__)("program", null),
        [
          [],
          Build.Throw(expression)],
        [
          [],
          []])] :
    visit.BLOCK(block, block.__node__)("program", null));
};
