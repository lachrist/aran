
const ArrayLite = require("array-lite");
const Build = require("../build");
const Object_assign = Object.assign;

Object_assign(exports, Build);

delete exports.array;
delete exports.object;
delete exports.get;
delete exports.set;
delete exports.unary;
delete exports.binary;
