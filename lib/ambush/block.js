
const ArrayLite = require("array-lite");
const Escape = require("./escape.js");
const Build = require("../build");
const Visit = require("./visit.js");

const abruptize = (name, serial, trap, block) => (
  name ?
  Build.BLOCK(
    [],
    Build.Try(
      [],
      block,
      Build.BLOCK(
        [],
        Build.Throw(
          trap[name](
            Build.read("error"),
            serial))),
      Build.BLOCK([], []))) :
  block);

exports.BLOCK = ({1:identifiers, 2:statements, 3:serial}, trap, tag, labels) => abruptize(
  (
    tag === "program" ?
    "failure" :
    tag === "closure" ? "abrupt" : null),
  serial,
  trap,
  Build.BLOCK(
    ArrayLite.concat(
      tag === "closure" ? ["argindex"] : [],
      ArrayLite.map(identifiers, Escape)),
    ArrayLite.concat(
      (
        tag === "closure" ?
        trap.Arrival(
          Build.read("callee"),
          Build.read("new.target"),
          Build.read("this"),
          Build.read("arguments"),
          serial) :
        []),
      (
        tag === "closure" ?
        Build.Write(
          "argindex",
          Build.primitive(-1)) :
        []),
      (
        tag === "program" ?
        trap.Program(
          Build.primordial("global"),
          serial) :
        []),
      trap.Enter(
        Build.primitive(tag),
        Build.apply(
          Build.primordial("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
              labels,
              (label) => Build.primitive(label))),
        Build.apply(
          Build.primordial("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
            identifiers,
            (identifier) => Build.primitive(identifier))),
        serial),
      (
        tag === "program" || tag === "eval" ?
        (
          (
            statements.length === 0 ||
            statements[statements.length-1][0] !== "Expression") ?
          ((() => { throw new Error("Invalid program/eval") }) ()) :
          ArrayLite.concat(
            ArrayLite.flatMap(
              ArrayLite.slice(statements, 0, statements.length-1),
              (statement) => Visit.Statement(statement, trap)),
            (
              tag === "program" ?
              Build.Expression(
                trap.success(
                  Visit.expression(statements[statements.length-1][1], trap),
                  serial)) :
              Build.Expression(
                Visit.expression(statements[statements.length-1][1], trap))))) :
        ArrayLite.concat(
          ArrayLite.flatMap(
            statements,
            (statement) => Visit.Statement(statement, trap)),
          (
            (
              tag === "switch" &&
              ArrayLite.every(statements, (statement) => (
                statement[0] !== "Case" ||
                statement[1]))) ?
            Build.Case(null) :
            []),
          trap.Leave(serial))))));
