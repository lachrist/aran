
const ArrayLite = require("array-lite");
const Escape = require("./escape.js");
const Build = require("../build");
const Visit = require("./visit.js");

const abruptize = (tag, serial, trap, block) => (
  tag === "program" || tag === "closure" ?
  Build.BLOCK(
    [],
    Build.Try(
      [],
      block,
      Build.BLOCK(
        [],
        Build.Throw(
          trap.abrupt(
            Build.read("error"),
            serial))),
      Build.BLOCK([], []))) :
  block);

exports.BLOCK = ({1:identifiers, 2:statements, 3:serial}, trap, tag, labels) => abruptize(
  tag,
  serial,
  trap,
  Build.BLOCK(
    ArrayLite.map(
      ArrayLite.concat(
        tag === "closure" ? ["argindex"] : [],
        identifiers),
      Escape),
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
        tag === "program" ?
        trap.Arrival(
          Build.primitive(void 0),
          Build.primitive(void 0),
          Build.builtin("global"),
          Build.primitive(void 0),
          serial) :
        []),
      trap.Enter(
        Build.primitive(tag),
        Build.array(
          ArrayLite.map(
            labels,
            (label) => Build.primitive(label))),
        Build.array(
          ArrayLite.map(
            identifiers,
            (identifier) => Build.primitive(identifier))),
        serial),
      (
        tag === "program" ?
        (
          (
            statements.length === 0 ||
            statements[statements.length-1][0] !== "Expression") ?
          ((() => { throw new Error("Invalid program") }) ()) :
          ArrayLite.concat(
            ArrayLite.flatMap(
              ArrayLite.slice(statements, 0, statements.length-1),
              (statement) => Visit.Statement(statement, trap)),
            Build.Expression(
              trap.return(
                Visit.expression(statements[statements.length-1][1], trap),
                serial)))) :
        ArrayLite.concat(
          ArrayLite.flatMap(
            statements,
            (statement) => Visit.Statement(statement, trap)),
          trap.Leave(serial))))));
