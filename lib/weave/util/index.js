
exports.rest = require("./rest.js").rest;

exports.closure = require("./closure.js").closure;

exports.assign = require("./pattern/assign.js").assign;

exports.Declare = require("./pattern/declare.js").Declare;

exports.Loop = (begin, test, before, body, after) => {
  const temporay1 = ARAN.break;
  const temporay2 = ARAN.continue;
  ARAN.break = "B" + ARAN.node.AranSerial;
  ARAN.continue = "C" + ARAN.node.AranSerial;
  const result = ARAN.cut.Label(
    ARAN.break,
    ArrayLite.concat(
      begin,
      ARAN.cut.While(
        (
          test ||
          ARAN.cut.primitive(true)),
        ArrayLite.concat(
          before,
          ARAN.cut.Label(
            ARAN.continue,
            (
              ARAN.node.AranParent.type === "LabeledStatement" ?
              ARAN.cut.Label(
                "c" + ARAN.node.AranParent.label.name,
                exports.Body(body)) :
              exports.Body(body))),
          after))));
  ARAN.break = temporay1;
  ARAN.continue = temporay2;
  return result;
};

exports.array = (expressions) => ARAN.cut.apply(
  ARAN.cut.builtin("Array.of"),
  ARAN.cut.primitive(void 0),
  expressions);

exports.Completion = (statements) => (
  ARAN.node.AranCompletion ?
  ArrayLite.concat(
    ARAN.build.Statement(
      ARAN.cut.$completion(
        ARAN.cut.primitive(void 0))),
    statements) :
  statements);

exports.unary = (operator, expression) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.unary"),
  ARAN.cut.primitive(void 0),
  [
    ARAN.cut.primitive(operator),
    expression]);

exports.binary = (operator, expression1, expression2) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.binary"),
  ARAN.cut.primitive(void 0),
  [
    ARAN.cut.primitive(operator),
    expression1,
    expression2]);

exports.get = (expression1, expression2) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.get"),
  ARAN.cut.primitive(void 0),
  [
    expression1,
    expression2]);

exports.set = (strict, expression1, expression2, expression3) => (
  strict ?
  ARAN.build.apply(
    ARAN.build.closure(
      ARAN.cut.If(
        ARAN.build.get(
          ARAN.build.read("arguments"),
          ARAN.build.primitive(0)),
        [],
        ARAN.cut.Throw(
          ARAN.cut.construct(
            ARAN.cut.builtin("TypeError"),
            [
              ARAN.cut.primitive("cannot assign object property")])))),
    [
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.set"),
        ARAN.cut.primitive(void 0),
        [expression1, expression2, expression3])]) :
  ARAN.build.sequence(
    [
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.set"),
        ARAN.cut.primitive(void 0),
        [expression1, expression2, expression3])],
    ARAN.cut.drop(
      ARAN.cut.primitive(null))));
