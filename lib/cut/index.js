
const ArrayLite = require("array-lite");
const Static = require("../static.js");
const Traps = require("./traps.js");
const ParseLabel = require("./parse-label.js");
const SanitizeIdentifier = require("./sanitize-identifier.js");

const first = (array) => array[0];

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  cut.$begin = (boolean) => traps.begin(
    ARAN.build.primitive(boolean),
    (
      ARAN.scope ?    
      ARAN.build.object(
        ArrayLite.map(
          ARAN.scope,
          (identifier) => [
            identifier,
            ARAN.build.read(identifier)])) :
      ARAN.build.primitive(null)),
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive("__GLOBAL__")));

  cut.$Failure = (expression) => ARAN.build.Throw(
    traps.failure(expression));

  cut.$Success = (expression) => ARAN.build.Statement(
    ARAN.build.write(
      "completion",
      traps.success(
        ARAN.build.read("completion"))));

  cut.$end = traps.end;

  cut.$completion = (expression) => ARAN.build.write(
    "completion",
    traps.completion(expression));

  cut.$builtin = (string) => traps.builtin(
    ARAN.build.primitive(string),
    Static.load(string));

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

  cut.$closure = (number, identifier, identifiers, statements) => traps.closure(
    ARAN.build.apply(
      Static.load("Object.defineProperty"),
      [
        ARAN.build.apply(
          Static.load("Object.defineProperty"),
          [
            ARAN.build.closure(
              ArrayLite.concat(
                ARAN.build.Block(
                  ARAN.build.Declare(
                    "const",
                    "scope",
                    ARAN.build.object(
                      ArrayLite.concat(
                        ArrayLite.map(
                          identifiers,
                          (identifier) => [
                            identifier,
                            ARAN.build.read(identifier)]),
                        [
                          [
                            identifier,
                            ARAN.build.read("callee")]]))),
                  ARAN.build.Statement(
                    traps.arrival(
                      ARAN.build.read("scope"),
                      ARAN.build.read("callee"),
                      ARAN.build.read("arguments"))),
                  ArrayLite.flatenMap(
                    ArrayLite.concat(identifiers, [identifier]),
                    (identifier) => ARAN.build.Declare(
                      "var",
                      SanitizeIdentifier(identifier),
                      ARAN.build.get(
                        ARAN.build.read("scope"),
                        ARAN.build.primitive(identifier))))),
                statements)),
            ARAN.build.primitive("length"),
            ARAN.build.object([
              [
                "value",
                ARAN.build.primitive(number)],
              [
                "configurable",
                ARAN.build.primitive(true)]])]),
        ARAN.build.primitive("name"),
        ARAN.build.object([
          [
            "value",
            ARAN.build.primitive(string)],
          [
            "configurable",
            ARAN.build.primitive(true)]])]));

  cut.get = traps.get;

  cut.invoke = traps.invoke;

  cut.apply = traps.apply;

  cut.unary = traps.unary;

  cut.binary = traps.binary;

  cut.set = (expression1, expression2, expression3) => (
    node.AranStrict ?
    ARAN.build.apply(
      ARAN.build.closure(
        ARAN.build.If(
          traps.test(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0))),
          [],
          ARAN.build.Throw(
            traps.throw(
              traps.construct(
                traps.load(
                  ARAN.build.primitive("TypeError"),
                  Static.load("TypeError")),
                [
                  traps.primitive(
                    ARAN.build.primitive("Cannot assign object property"))]))))),
      [
        traps.strict_set(expression1, expression2, expression3)]) :
    ARAN.build.sequence(
      trap.set(
        traps.apply(
          traps.load(
            ARAN.build.primitive("Object"),
            Static.load("Object")),
          [
            expression1],
        expression2,
        expression3)),
      traps.drop()));

  cut.delete = (expression1, expression2) => (
    node.AranStrict ?
    ARAN.build.apply(
      ARAN.build.closure(
        ArrayLite.concat(
          ARAN.build.copy(
            ARAN.build.primitive(1)),
          ARAN.build.If(
            traps.test(
              ARAN.build.get(
                ARAN.build.read("arguments"),
                ARAN.build.primitive(0))),
            [],
            ARAN.build.Throw(
              traps.throw(
                traps.construct(
                  traps.load(
                    ARAN.build.primitive("TypeError"),
                    Static.load("TypeError")),
                  [
                    traps.primitive(
                      ARAN.build.primitive("Cannot assign object property"))])))),
          ARAN.build.return(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0))))),
      [
        traps.delete(expression1, expression2)]) :
    traps.delete(expression1, expression2));

  cut.object = (properties) => traps.object(
    ARAN.build.array(
      ArrayLite.map(properties, first)),
    ARAN.build.object(properties));

  cut.array = (elements) => traps.array(
    ARAN.build.array(elements));

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

  cut.Try = (statements1, statements2, statements3) => ARAN.build.Try(
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
    ARAN.build.read(
      SanitizeIdentifier(identifier)));

  cut.discard = (identifier) => traps.discard(
    ARAN.build.primitive(identifier),
    ARAN.build.discard(
      SanitizeIdentifier(identifier)));

  cut.primitive = (primitive) => traps.primitive(
    ARAN.build.primitive(primitive));

  cut.regexp = (pattern, flags) => traps.regexp(
    ARAN.build.regexp(pattern, flags));

  cut.write = (identifier, expression) => ARAN.build.write(
    SanitizeIdentifier(identifier),
    traps.write(
      ARAN.build.primitive(identifier),
      expression));

  cut.Declare = (kind, identifier, expression) => ARAN.build.Declare(
    kind,
    SanitizeIdentifier(identifier),
    traps.declare(
      ARAN.build.primitive(kind),
      ARAN.build.primitive(identifier),
      expression));

  cut.Return = (expression) => ARAN.build.Return(
    traps.return(expression));

  cut.eval = (expression) => ARAN.build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => ARAN.build.With(
    ARAN.build.apply(
      Static.load("Proxy"),
      [
        traps.with(expression),
        Static.load("WithHandlers")]),
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
