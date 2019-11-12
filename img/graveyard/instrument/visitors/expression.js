
const ArrayLite = require("array-lite");
const Build = require("../../build.js");
const Visit = require("../visit.js");

exports.throw = ({1:expression, 2:serial}, options) => Build.throw(
  options.trap.throw(
    Visit.expression(expression, options),
    serial));

exports.closure = ({1:block, 2:serial}, options) => options.trap.closure(
  Build.closure(
    Visit.BLOCK(
      block,
      {
        __proto__: null,
        trap: options.trap,
        tag: "closure"})),
  serial);

exports.error = ({1:serial}, options) => options.trap.error(
  Build.read("error"),
  serial);

exports.sequence = ({1:expression1, 2:expression2, 3:serial}, options) => Build.sequence(
  options.trap.drop(
    Visit.expression(expression1, options),
    serial),
  Visit.expression(expression2, options));

exports.apply = ({1:expression1, 2:expression2, 3:expressions, 4:serial}, options) => options.trap.apply(
  Visit.expression(expression1, options),
  Visit.expression(expression2, options),
  ArrayLite.map(
    expressions,
    (expression) => Visit.expression(expression, options)),
  serial);

exports.construct = ({1:expression, 2:expressions, 3:serial}, options) => options.trap.construct(
  Visit.expression(expression, options),
  ArrayLite.map(
    expressions,
    (expression) => Visit.expression(expression, options)),
  serial);

exports.builtin = ({1:string, 2:serial}, options) => options.trap.builtin(
  Build.builtin(string),
  Build.primitive(string),
  serial);

exports.primitive = ({1:value, 2:serial}, options) => options.trap.primitive(
  Build.primitive(value),
  serial);

exports.read = ({1:identifier, 2:serial}, options) => options.trap.read(
  Build.read(identifier),
  Build.primitive(identifier),
  serial);

exports.write = ({1:identifier, 2:expression1, 3:expression2, 4:serial}, options) => Build.write(
  identifier,
  options.trap.write(
    Visit.expression(expression1, options),
    Build.primitive(identifier),
    serial),
  Visit.expression(expression2, options));

exports.eval = ({1:expression, 2:serial}, options) => Build.eval(
  options.trap.eval(
    Visit.expression(expression, options),
    serial));

exports.conditional = ({1:expression1, 2:expression2, 3:expression3, 4:serial}, options) => Build.conditional(
  options.trap.test(
    Visit.expression(expression1, options),
    serial),
  Visit.expression(expression2, options),
  Visit.expression(expression3, options));

exports.unary = ({1:operator, 2:expression, 3:serial}, options) => options.trap.unary(
  operator,
  Visit.expression(expression, options),
  serial);

exports.binary = ({1:operator, 2:expression1, 3:expression2, 4:serial}, options) => options.trap.binary(
  operator,
  Visit.expression(expression1, options),
  Visit.expression(expression2, options),
  serial);

exports.object = ({1:expression, 2:expressionss, 3:serial}, options) => options.trap.object(
  Visit.expression(expression, options),
  ArrayLite.map(
    expressionss,
    ([expression1, expression2]) => [
      Visit.expression(expression1, options),
      Visit.expression(expression2, options)]));
