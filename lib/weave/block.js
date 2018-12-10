
const ArrayLite = require("array-lite");
const Escape = require("./escape.js");
const Build = require("./build.js");

module.exports = (visit, trap, identifiers, statements, node) => (tag, label) => Build.BLOCK(
  ArrayLite.concat(
    tag === "program" ? [0] : [],
    ArrayLite.map(identifiers, Escape)),
  ArrayLite.concat(
    (
      tag === "closure" ?
      trap.Arrival(
        Build.read("callee"),
        Build.read("new.target"),
        Build.read("this"),
        Build.read("arguments"),
        node) :
      []),
    trap.Enter(
      Build.primitive(tag),
      Build.primitive(label),
      Build.apply(
        Build.builtin("Array.of"),
        Build.primitive(void 0),
        ArrayLite.map(
          ArrayLite.concat(
            tag === "program" ? [0] : [],
            block[0]),
          (identifier) => Build.primitive(identifier))),
      node),
    ArrayLite.flatMap(statements, visit.Statement),
    (
      tag === "program" ?
      Build.Write(
        0,
        trap.read(
          Build.read(0),
          Build.primitive(0),
          node)) :
      []),
    trap.Leave(),
    (
      tag === "program" ?
      (
        node.AranParent ?
        Build.Expression(
          Build.read(0)) :
        Build.Expression(
          trap.success(
            Build.read(0),
            node))) :
      [])));
