
const ArrayLite = require("array-lite");
const Escape = require("./escape");
const Build = require("../build");
const Visit = require("./visit.js");

const Error = global.Error;

exports.trap = ({1:name, 2:expressions, 3:serial}, trap) => {
  throw new Error("trap expression should not appear here");
};

exports.closure = ({1:block, 2:serial}, trap) => trap.closure(
  Build.closure(
    Visit.BLOCK(block, trap, "closure", [])),
  serial);

exports.error = ({1:serial}, trap) => trap.error(
  Build.read("error"),
  serial);

exports.argument = ({1:string, 2:serial}, trap) => (
  string === "next" ?
  trap.argument(
    Build.apply(
      Build.builtin("Reflect.get"),
      Build.primitive(void 0),
      [
        Build.read("arguments"),
        Build.write(
          "argindex",
          Build.binary(
            "+",
            Build.read("argindex"),
            Build.primitive(1)),
          Build.read("argindex"))]),
    Build.read("argindex"),
    serial) :
  trap.argument(
    (
      string === "length" ?
      Build.apply(
        Build.builtin("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.read("arguments"),
            Build.primitive("length")]) :
        Build.read(string)),
    Build.primitive(string),
    serial));

exports.sequence = ({1:expression1, 2:expression2, 3:serial}, trap) => Build.sequence(
  trap.drop(
    Visit.expression(expression1, trap),
    serial),
  Visit.expression(expression2, trap));

exports.apply = ({1:expression1, 2:expression2, 3:expressions, 4:serial}, trap) => trap.apply(
  Visit.expression(expression1, trap),
  Visit.expression(expression2, trap),
  ArrayLite.map(
    expressions,
    (expression) => Visit.expression(expression, trap)),
  serial);

exports.construct = ({1:expression, 2:expressions, 3:serial}, trap) => trap.construct(
  Visit.expression(expression, trap),
  ArrayLite.map(
    expressions,
    (expression) => Visit.expression(expression, trap)),
  serial);

exports.builtin = ({1:string, 2:serial}, trap) => trap.builtin(
  Build.builtin(string),
  Build.primitive(string),
  serial);

exports.primitive = ({1:value, 2:serial}, trap) => trap.primitive(
  Build.primitive(value),
  serial);

exports.read = ({1:identifier, 2:serial}, trap) => trap.read(
  Build.read(
    Escape(identifier)),
  Build.primitive(identifier),
  serial);

exports.write = ({1:identifier, 2:expression1, 3:expression2, 4:serial}, trap) => Build.write(
  Escape(identifier),
  trap.write(
    Visit.expression(expression1, trap),
    Build.primitive(identifier),
    serial),
  Visit.expression(expression2, trap));

exports.eval = ({1:expression, 2:serial}, trap) => Build.eval(
  trap.eval(
    Visit.expression(expression, trap),
    serial));

exports.conditional = ({1:expression1, 2:expression2, 3:expression3, 4:serial}, trap) => Build.conditional(
  trap.test(
    Visit.expression(expression1, trap),
    serial),
  Visit.expression(expression2, trap),
  Visit.expression(expression3, trap));

exports.unary = ({1:operator, 2:expression, 3:serial}, trap) => trap.unary(
  operator,
  Visit.expression(expression, trap),
  serial);

exports.binary = ({1:operator, 2:expression1, 3:expression2, 4:serial}, trap) => trap.binary(
  operator,
  Visit.expression(expression1, trap),
  Visit.expression(expression2, trap),
  serial);
