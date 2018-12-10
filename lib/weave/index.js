
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
  visit.BLOCK = (block) => Block(visit, trap, block[0], block[1], block.__node__);
  visit.Statement = make(Statement(visit, trap));
  visit.expression = make(Expression(visit, trap));
  if (block.__node__.AranParent || !pointcut("failure", block.__node__))
    return visit.BLOCK(block)("program", null);
  const block1 = visit.BLOCK(block)("program", null);
  const block2 = Build.BLOCK(
    [],
    Build.Throw(
      Build.trap(
        "failure",
        [
          Build.read("error")],
        block.__node__.AranSerial)));
  const block3 = Build.BLOCK([], [])
  return Build.BLOCK([], Build.Try(null, block1, block2, block2));

};
