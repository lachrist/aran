
const ArrayLite = require("array-lite");
const Escape = require("./escape.js");
const Build = require("../build");
const Visit = require("./visit.js");

const abruptize = (tag, serial, trap, block) => (
  tag === "program" || tag === "closure" ?
  Build.BLOCK(
    [],
    Build.Try(
      null,
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
          Build.apply(
            Build.builtin("Object.fromEntries"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                ArrayLite.map(
                  ["callee", "new.target", "this", "arguments"],
                  (string) => Build.apply(
                    Build.builtin("Array.of"),
                    Build.primitive(void 0),
                    [
                      Build.primitive(string),
                      Build.read(string)])))]),
          serial) :
        []),
      (
        tag === "program" ?
        trap.Arrival(
          Build.apply(
            Build.builtin("Object.fromEntries"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.builtin("Array.of"),
                Build.primitive(void 0),
                [
                  Build.apply(
                    Build.builtin("Array.of"),
                    Build.primitive(void 0),
                    [
                      Build.primitive("this"),
                      Build.builtin("global")])])]),
          serial) :
        []),
      trap.Enter(
        Build.primitive(tag),
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
            labels,
            (label) => Build.primitive(label))),
        Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
            identifiers,
            (identifier) => Build.primitive(identifier))),
        serial),
      ArrayLite.flatMap(
        statements,
        (statement) => Visit.Statement(statement, trap)),
      traps.Leave())));
