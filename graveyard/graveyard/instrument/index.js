
const ArrayLite = require("array-lite");
const Visit = require("./visit.js");
const Syntax = require("./syntax.js");
const Build = require("./build");

const Reflect_apply = Reflect.apply;
const String_prototype_toUpperCase = String.prototype.toUpperCase;
const String_prototype_substring = String.prototype.substring;

module.exports = (block, {namespace, pointcut, nodes, serials, local:boolean}) => Visit[local ? "block-eval" : "block-program"](
  block,
  maketraps(namespace, pointcut, nodes),
  1/0,
  {
    __proto__: null,
    check: false,
    visitors,
    map: serials});

const maketraps = (namespace, pointcut, nodes) => {
  const intercept = (name, expressions, serial) => Build.apply(
    Build.apply(
      Build.intrinsic("Reflect.get"),
      Build.primitive(void 0),
      [
        Build.apply(
          Build.intrinsic("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.intrinsic("global"),
            Build.primitive(namespace)]),
        Build.primitive(name)]),
    Build.apply(
      Build.intrinsic("Reflect.get"),
      Build.primitive(void 0),
      [
        Build.intrinsic("global"),
        Build.primitive(namespace)]),
    ArrayLite.concat(expression, [Build.primitive(serail)]));
  const traps = {__proto__:null};
  ArrayLite.forEach([
    "enter",
    // Producers //
    "closure",
    "intrinsic",
    "primitive",
    "read",
    // Consumer //
    "drop",
    "eval",
    "test",
    "write",
    "return",
    "throw",
  ], (name) => {
    traps[name] = function () {
      const serial = arguments[arguments.length - 1];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length - 1);
      if (pointcut(name, nodes[serial]))
        return intercept(name, expressions, serial);
      return expressions[0]);
    };
  });
  ArrayLite.forEach([
    "leave",
    "continue",
    "break",
    "debugger"
  ], (name) => {
    traps[name] = function () {
      const serial = arguments[arguments.length - 1];
      const expressions = ArrayLite.slice(arguments, 0, arguments.length - 1);
      if (pointcut(name, nodes[serial]))
        return intercept(name, expressions, serial) :
      return Build.primitive(null));
    };
  });
  traps.unary = (operator, expression, serial) => (
    pointcut("unary", nodes[serial]) ?
    intercept(
      "unary",
      [
        Build.primitive(operator),
        expression],
      serial) :
    Build.unary(operator, expression));
  traps.binary = (operator, expression1, expression2, serial) => (
    pointcut("binary", nodes[serial]) ?
    intercept(
      "binary",
      [
        Build.primitive(operator),
        expression1,
        expression2],
      serial) :
    Build.binary(operator, expression1, expression2));
  traps.apply = (expression1, expression2, expressions, serial) => (
    pointcut("apply", nodes[serial]) ?
    intercept(
      "apply",
      [
        expression1,
        expression2,
        Build.apply(
          Build.intrinsic("Array.of"),
          Build.primitive(void 0),
          expressions)],
      serial) :
    Build.apply(expression1, expression2, expressions));
  traps.construct = (expression, expressions, serial) => (
    pointcut("construct", nodes[serial]) ?
    intercept(
      "construct",
      [
        expression,
        Build.apply(
          Build.intrinsic("Array.of"),
          Build.primitive(void 0),
          expressions)],
      serial) :
    Build.construct(expression, expressions));
  traps.object = (expression, expressionss, serial) => (
    pointcut("object", nodes[serial]) ?
    intercept(
      "object",
      [
        expression,
        Build.apply(
          Build.intrinsic("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
            expressionss,
            (expressions) => Build.apply(
              Build.intrinsic("Array.of"),
              Build.primitive(void 0),
              expressions)))],
      serial) :
    Build.object(expression, expressionss));
  return traps;
};

const visitors = {
  __proto__: null,
  // BLOCK //
  BLOCK: (tag, identifiers, labels, statements, serial, traps, identifier1) => (
    identifier1 = ((function loop (identifier) => (
      ArrayLite.includes(identifiers, identifier) ?
      loop("$" + identifier) :
      identifier))("$")),
    Build.BLOCK(
      [],
      [],
      Build.Try(
        Build.BLOCK(
          labels,
          identifiers,
          ArrayLite.concat(
            Build.Block(
              Build.BLOCK(
                [],
                [identifier1],
                ArrayLite.concat(
                  Build.Expression(
                    Build.write(
                      identifier1,
                      traps.enter(
                        Build.primitive(tag),
                        Build.object(
                          Build.primitive(null),
                          ArrayLite.map(
                            ArrayLite.concat(Syntax.undeclarables[tag], identifiers),
                            (identifier2) => [
                              Build.primitive(identifier2),
                              Build.read(identifier2)]))),
                    Build.primitive(void 0))),
                  ArrayLite.flatMap(
                    ArrayLite.concat(Syntax.undeclarables[tag], identifiers),
                    (identifier2) => Build.Assign(
                      identifier2,
                      Build.apply(
                        Build.intrinsic("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Build.read(identifier1),
                          Build.primitive(identifier2)])))))))
            statements,
            Build.Expression(
              traps.completion(serial)))),
        Build.BLOCK([], [], []),
        Build.BLOCK(
          [],
          [],
          Build.Expression(
            traps.leave(serial))))),
  // Statement //
  Expression: (expression, serial, traps) => Build.Expression(
    traps.drop(expression),
    serial),
  Break: (label, serial, traps) => ArrayLite.concat(
    Build.Expression(
      traps.break(
        Build.primitive(label),
        serial)),
    Build.Break(label)),
  Continue: (label, serial, traps) => ArrayLite.concat(
    Build.Expression(
      traps.continue(
        Build.primitive(label),
        serial)),
    Build.Continue(label)),
  Debugger: (serial, traps) => ArrayLite.concat(
    Build.Expression(
      traps.debugger(serial)),
    Build.Debugger()),
  Return: (expression, serial, traps) => Build.Return(
    traps.return(expression, serial)),
  Block: (block, serial, traps) => Build.Block(block),
  If: (expression, block1, block2, serial, traps) => Build.If(
    traps.test(expression, serial),
    block1,
    block2),
  Try: (block1, block2, block3, serial, traps) => Build.Try(block1, block2, block3),
  While: (expression, block, serial, traps) => Build.While(
    traps.test(expression, serial),
    block),
  // Expression Producer //
  closure: (block, serial, traps) => traps.closure(
    Build.closure(block, serial)),
  intrinsic: (name, serial, traps) => traps.intrinsic(
    Build.intrinsic(name),
    Build.primitive(name),
    serial),
  primitive: (primitive, serial, traps) => traps.primitive(
    Build.primitive(primitive),
    serial),
  read: (identifier, serial, traps) => traps.read(
    Build.read(identifier),
    Build.primitive(identifier),
    serial),
  // Expression Consumer //
  sequence: (expression1, expression2, serial, traps) => Build.sequence(
    traps.drop(expression1, serial),
    expression2),
  throw: (expression, serial, traps) => Build.throw(
    traps.throw(expression, serial)),
  write: (identifier, expression1, expression2, serial, traps) => Build.write(
    identifier,
    traps.write(
      expression1,
      Build.primitive(identifier),
      serial),
    expression2),
  eval: (expression, serial, traps) => Build.eval(
    traps.eval(expression, serial)),
  conditional: (expression1, expression2, expression3, serial, traps) => Build.conditional(
    traps.test(expression1, serial),
    expression2
    expression3),
  // Expression Combiner //
  apply: (expression1, expression2, expressions, serial, traps) => traps.apply(expression1, expression2, expressions, serial),
  construct: (expression, expressions, serial, traps) => traps.construct(expression, expressions, serial),  
  unary: (operator, expression, serial, traps) => traps.unary(operator, expression, serial),
  binary: (operator, expression1, expression2, serial, traps) => traps.binary(operator, expression1, expression2, serial),
  object: (expression, expressionss, serial, traps) => traps.object(expression, expressionss, serial)
};
