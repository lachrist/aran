
const ArrayLite = require("array-lite");
const Escape = require("./escape.js");
const Build = require("./build.js");

module.exports = (visit, trap) => (block, node) => (tag, label) => [
  ArrayLite.concat(
    tag === "closure" ? ["arrival"] : [],
    ArrayLite.map(block[0], Escape)),
  ArrayLite.concat(
    (
      tag === "catch" ?
      Build.Write(
        "error",
        trap.error(
          Build.read("error"),
          node)) :
      []),
    (
      tag === "closure" ?
      Build.Write(
        "arrival",
        trap.arrival(
          Build.read("callee"),
          Build.read("new.target"),
          Build.read("this"),
          Build.read("arguments"),
          node)) :
      []),
    trap.Enter(
      Build.primitive(tag),
      Build.primitive(label),
      Build.apply(
        Build.builtin("Array.of"),
        Build.primitive(void 0),
        ArrayLite.map(
          block[0],
          (identifier) => Build.primitive(identifier))),
      node),
    ArrayLite.flatMap(block[1], visit.Statement),
    (
      tag === "program" ?
      Build.Write(
        0,
        trap.read(
          Build.read(0),
          Build.primitive(0),
          node)) :
      []),
    trap.Leave(node),
    (
      tag === "program" ?
      Build.Expression(
        trap.success(
          Build.read(0),
          node)) :
      []))];

