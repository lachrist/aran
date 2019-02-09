
const Trap = require("./trap.js");
const Visit = require("./visit.js");

const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;

module.exports = (block, pointcut, nodes) => Visit.BLOCK(
  block,
  Trap(pointcut, nodes),
  (
    (
      console.log(block),
      Reflect_getOwnPropertyDescriptor(nodes[block[3]], "AranCounter")) ?
    "program" :
    "eval"),
  []);
