
const Trap = require("./trap.js");
const Visit = require("./visit.js");

module.exports = (block, pointcut) => Visit.BLOCK(block, Trap(pointcut), "program", []);
