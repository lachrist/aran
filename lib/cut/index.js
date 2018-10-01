
const ArrayLite = require("array-lite");
const Traps = require("./traps.js");
const ParseLabel = require("./parse-label.js");

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  cut.$copy = (number, expression) => ARAN.build.get(
    ARAN.build.array(
      [
        expression,
        traps.copy(
          ARAN.build.primitive(number))]),
    ARAN.build.primitive(0));

  cut.$drop = (expression) => ARAN.build.get(
    ARAN.build.array(
      [
        expression,
        traps.drop()]),
    ARAN.build.primitive(0));

  cut.$swap = (number1, number2, expression) => ARAN.build.get(
    ARAN.build.array(
      [
        expression,
        traps.swap(
          ARAN.build.primitive(number1),
          ARAN.build.primitive(number2))]),
    ARAN.build.primitive(0));

  cut.PROGRAM = (statements) => ARAN.build.PROGRAM(
    ARAN.build.$Try(
      ArrayLite.concat(
        statements,
        ARAN.build.Statement(
          ARAN.build.completion(
            traps.success(
              ARAN.build.read("completion"))))),
      ARAN.build.Throw(
        traps.failure(
          ARAN.build.read("error"))),
      ARAN.build.Statement(
        traps.end())));

  cut.Sandbox = (statements) => ArrayLite.concat(
    ARAN.build.Declare(
      "const",
      "scope",
      ARAN.build.object(
        ArrayLite.flatenMap(
          ARAN.context.identifiers,
          (identifier) => [
            identifier,
            ARAN.build.read(identifier)]))),
    ARAN.build.Sandbox(
      traps.sandbox(
        ARAN.build.read("scope"),
        ARAN.build.builtin("global")),
      ArrayLite.flatenMap(
        ARAN.context.identifiers,
        (identifier) => ARAN.build.$Declare(
          "var",
          identifier,
          ARAN.build.get(
            ARAN.build.read("scope"),
            ARAN.build.primitive(identifier))))));

  cut.closure = (statements) => traps.closure(
    ARAN.build.closure(
      ARAN.build.Hoist(
        ARAN.build.Declare(
          "const",
          "arrival",
          traps.arrival(
            object.arrow
        ArrayLite.concat(

  cut.apply = 

Reflect.apply(
  f,
  void 0,
  [
    EXPR1, EXPR2]);

Reflect.apply(
  Reflect.get(x = OBJECT, KEY),
  x,
  [
    EXPR1,
    EXPR2]);

(x = OBJECT)[key](EXPR1, EXPR2);

  cut.closure = (object, statements) => traps.closure(
    ARAN.build.closure(
      ARAN.build.Hoist(
        ArrayLite.concat(
          ARAN.build.Declare(
            "const",
            "arrival",
            ARAN.build.construct(
              ARAN.build.builtin("Object"),
              []),
          ArrayLite.flatenMap(
            ["new.target", "callee", "this", "arguments"],
            (identifier) => ARAN.build.Statement(
              ARAN.build.apply(
                ARAN.build.builtin("Reflect.set"),
                [
                  ARAN.build.read("arrival"),
                  ARAN.build.primitive(identifier),
                  ARAN.build.read(identifier)]))),
          ARAN.build.Statement(
            ARAN.build.write(
              "arrival",
              traps.arrival(
                ARAN.build.read("arrival"))))),
        statements)));

  cut.apply = traps.apply;

  cut.invoke = traps.invoke;

  cut.construct = traps.construct;

  cut.unary = traps.unary;

  cut.binary = traps.binary;

  cut.get = traps.get;

  cut.set = traps.set;

  cut.delete = traps.delete;

  cut.builtin = (string) => traps.builtin(
    ARAN.build.primitive(string),
    ARAN.build.builtin(string));

  cut.completion = (expression) => ARAN.build.completion(
    traps.completion(expression));

  cut.Label = (label, statements) => ARAN.build.Label(
    label,
    ArrayLite.concat(
      ARAN.build.Statement(traps.label(
        ARAN.build.primitive(
          ParseLabel.split(label)),
        ARAN.build.primitive(
          ParseLabel.core(label)))),
      statements,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("label")))));

  cut.Break = (label) => ArrayLite.concat(
    ARAN.build.Statement(
      traps.break(
        ARAN.build.primitive(ParseLabel.split(label)),
        ARAN.build.primitive(ParseLabel.core(label)))),
    ARAN.build.Break(label));

  cut.Block = (statements) => ARAN.build.Block(
    ArrayLite.concat(
      ARAN.build.Statement(
        traps.block()),
      statements,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("block")))));

  cut.Try = (statements1, statements2, statements3) => ARAN.build.$Try(
    ArrayLite.concat(
      ARAN.build.Statement(
        traps.try()),
      statements1,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("try")))),
    ArrayLite.concat(
      ARAN.build.Statement(
        ARAN.build.write(
          "error",
          traps.catch(
            ARAN.build.read("error")))),
      statements2,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("catch")))),
    ArrayLite.concat(
      ARAN.build.Statement(
        traps.finally()),
      statements3,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("finally")))));

  cut.read = (identifier) => traps.read(
    ARAN.build.primitive(identifier),
    ARAN.build.$read(identifier));

  cut.discard = (identifier) => traps.discard(
    ARAN.build.primitive(identifier),
    ARAN.build.$discard(identifier));

  cut.primitive = (primitive) => traps.primitive(
    ARAN.build.primitive(primitive));

  cut.write = (identifier, expression) => ARAN.build.$write(
    identifier,
    traps.write(
      ARAN.build.primitive(identifier),
      expression));

  cut.Declare = (kind, identifier, expression) => ARAN.build.$Declare(
    kind,
    identifier,
    traps.declare(
      ARAN.build.primitive(kind),
      ARAN.build.primitive(identifier),
      expression));

  cut.Return = (expression) => ARAN.build.Return(
    traps.return(expression));

  cut.eval = (expression) => ARAN.build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => ARAN.build.With(
    traps.with(expression),
    ArrayLite.concat(
      statements,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("with")))));

  cut.Throw = (expression) => ARAN.build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => ArrayLite.concat(
    ARAN.build.While(
      traps.test(expression),
      statements));

  cut.If = (expression, statements1, statements2) => ARAN.build.If(
    traps.test(expression),
    ArrayLite.concat(
      ARAN.build.Statement(
        traps.block()),
      statements1,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("block")))),
    ArrayLite.concat(
      ARAN.build.Statement(
        traps.block()),
      statements2,
      ARAN.build.Statement(
        traps.leave(
          ARAN.build.primitive("block")))));

  cut.conditional = (expression1, expression2, expression3) => ARAN.build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  cut.Switch = (clauses) => ARAN.build.Switch(
    ArrayLite.map(
      clauses,
      (clause) => [
        traps.test(clause[0]),
        clause[1]]));

  return cut;

};
