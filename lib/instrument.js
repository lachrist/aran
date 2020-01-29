
const ArrayLite = require("array-lite");
const Visit = require("./visit.js");
const Syntax = require("./syntax.js");
const Build = require("./build");

const Reflect_apply = Reflect.apply;
const String_prototype_toUpperCase = String.prototype.toUpperCase;
const String_prototype_substring = String.prototype.substring;

module.exports = (block, options) => Visit(
  options.eval ? "block-eval" : "block-program",
  block,
  1 / 0,
  {
    __proto__: null,
    check: false,
    map: options.serials
    visitors: {
      __proto__: visitors,
      _trap: maketraps(options.namespace, options.pointcut, options.nodes)}});

const maketraps = (namespace, pointcut, nodes) => {
  const intercept = (name, expressions, serial) => Build.apply(
    Build.apply(
      Build.builtin("Reflect.get"),
      Build.primitive(void 0),
      [
        Build.apply(
          Build.builtin("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.builtin("global"),
            Build.primitive(namespace)]),
        Build.primitive(name)]),
    Build.apply(
      Build.builtin("Reflect.get"),
      Build.primitive(void 0),
      [
        Build.builtin("global"),
        Build.primitive(namespace)]),
    ArrayLite.concat(expression, [Build.primitive(serial)]));
  const traps = {__proto__:null};
  ArrayLite.forEach([
    "enter",
    // Producers //
    "closure",
    "builtin",
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
          Build.builtin("Array.of"),
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
          Build.builtin("Array.of"),
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
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          ArrayLite.map(
            expressionss,
            (expressions) => Build.apply(
              Build.builtin("Array.of"),
              Build.primitive(void 0),
              expressions)))],
      serial) :
    Build.object(expression, expressionss));
  return traps;
};

const visitors = {
  __proto__: null,
  // BLOCK //
  BLOCK: function (tag, identifiers, labels, statementss, serial) {
    let identifier1 = "$";
    while (ArrayLite.includes(identifiers, identifier1)) {
      identifier1 += "$";
    }
    return Build.BLOCK(
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
                      this._traps.enter(
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
                        Build.builtin("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Build.read(identifier1),
                          Build.primitive(identifier2)])))))))
            ArrayLite.flat(statementss),
            Build.Expression(
              this._traps.completion(serial)))),
        Build.BLOCK([], [], []),
        Build.BLOCK(
          [],
          [],
          Build.Expression(
            this._traps.leave(serial))));
  },
  // Statement //
  _Expression_: function (expression, serial, options) {
    if (expression[0] === "write") {
      return Build.Expression(
        Build.write(
          expression[1],
          this._traps.write(
            Visit("expression", expression[2], 1/0, options),
            Build.primitive(expression[1]),
            options.map.get(expression))));
    }
    return Build.Expression(
      this._traps.drop(
        Visit("expression", expression, 1/0, serial),
        serial));
  },
  Break: function (label, serial) {
    return ArrayLite.concat(Build.Expression(this._traps.break(Build.primitive(label), serial)), Build.Break(label));
  },
  Continue: function (label, serial) {
    return ArrayLite.concat(Build.Expression(this._traps.continue(Build.primitive(label), serial)), Build.Continue(label));
  },
  Debugger: function (serial) {
    return ArrayLite.concat(Build.Expression(this._traps.debugger(serial)), Build.Debugger());
  },
  Return: function (expression, serial) {
    return Build.Return(this._traps.return(expression, serial));
  },
  Block: function (block, serial) {
    return Build.Block(block);
  },
  If: function (expression, block1, block2, serial) {
    return Build.If(this._traps.test(expression, serial), block1, block2);
  },
  Try: function (block1, block2, block3, serial) {
    return Build.Try(block1, block2, block3);
  },
  While: function (expression, block, serial) {
    return Build.While(this._traps.test(expression, serial), block);
  },
  // Expression Producer //
  closure: function (block, serial) {
    return this._traps.closure(Build.closure(block, serial));
  },
  builtin: function (name, serial) {
    return this._traps.builtin(Build.builtin(name), Build.primitive(name), serial);
  },
  primitive: function (primitive, serial) {
    return this._traps.primitive(Build.primitive(primitive), serial);
  },
  read: function (identifier, serial) {
    return traps.read(Build.read(identifier), Build.primitive(identifier), serial);
  },
  // Expression Consumer //
  _sequence_: function (expression1, expression2, serial, options) {
    if (expression1[0] === "write") {
      return Build.sequence(
        Build.write(
          expression1[1],
          this._traps.write(
            Visit("expression", expression1[2], 1/0, options),
            Build.primitive(expression1[1]),
            options.map.get(expression1))),
        Visit("expression", expression2, 1/0, options));
    }
    return Build.sequence(
      this._traps.drop(
        Visit("expression", expression1, 1/0, options),
        serial),
      Visit("expression", expression2, 1/0, options));
  },
  throw: function (expression, serial) {
    return Build.throw(this._traps.throw(expression, serial));
  },
  write: function (identifier, expression, serial) {
    return Build.sequence(Build.write(identifier, this._traps.write(expression, Build.primitive(identifier), serial)), this._traps.primitive(Build.primitive(void 0)));
  },
  eval: function (expression, serial) {
    return Build.eval(this._traps.eval(expression, serial));
  },
  conditional: function (expression1, expression2, expression3, serial) {
    return Build.conditional(this._traps.test(expression1, serial), expression2, expression3);
  },
  // Expression Combiner //
  apply: function (expression1, expression2, expressions, serial) {
    return this._traps.apply(expression1, expression2, expressions, serial);
  },
  construct: function (expression, expressions, serial) {
    return this._traps.construct(expression, expressions, serial);
  },
  unary: function (operator, expression, serial) {
    return this._traps.unary(operator, expression, serial);
  },
  binary: function (operator, expression1, expression2, serial) {
    return this._traps.binary(operator, expression1, expression2, serial);
  },
  object: function (expression, expressionss, serial) {
    return this._traps.object(expression, expressionss, serial);
  } 
};
