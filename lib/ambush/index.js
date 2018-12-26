
const Trap = require("./trap.js");
const Visit = require("./visit.js");

module.exports = (block, pointcut, nodes) => Visit.BLOCK(block, Trap(pointcut, nodes), "program", []);
