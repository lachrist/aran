
const ArrayLite = require("array-lite");
const Meta = require("../meta.js");
const Traps = require("./traps");
const Name = require("./name.js")
const ParseLabel = require("./parse-label.js");
const SanitizeIdentifier = require("./sanitize-identifier.js");
const ContainArguments = require("./contain-arguments.js");
const Boolean = global.Boolean;
const Array_isArray = Array.isArray;

const first = (array) => array[0];

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  cut.PROGRAM = (boolean, statements) => (
    statements = ArrayLite.concat(
      (
        Array_isArray(ARAN.node.AranScope) ?
        ArrayLite.flatenMap(
          ARAN.node.AranScope,
          (string, expression) => (
            expression = traps.declare(
              "let",
              string,
              ARAN.build.get(
                ARAN.build.read("scope"),
                ARAN.build.primitive(string))),
            (
              (
                SanitizeIdentifier(string) !== string &&
                !ArrayLite.includes(SanitizeIdentifier(string))) ?
              ARAN.build.Declare(
                "let",
                SanitizeIdentifier(string),
                expression) :
              ARAN.build.Statement(
                ARAN.build.write(string, expression))))) :
        []),
      ARAN.build.If(
        ARAN.build.unary(
          "!",
          ARAN.build.get(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("SAVE"))),
        ArrayLite.concat(
          ARAN.build.Statement(
            ARAN.build.set(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("SAVE"),
              ARAN.build.primitive(true))),
          ArrayLite.flatenMap(
            ["TypeError", "eval"],
            (string) => ARAN.build.Statement(
              Meta.save(
                string,
                traps.save(
                  string,
                  traps.read(
                    string,
                    ARAN.build.read(
                      SanitizeIdentifier(string))))))),
          ArrayLite.flatenMap(
            [
              ["Reflect", "apply"],
              ["Object", "defineProperty"],
              ["Object", "getPrototypeOf"],
              ["Object", "keys"],
              ["Symbol", "iterator"]],
            (strings) => ARAN.build.Statement(
              Meta.save(
                strings[0] + "." + strings[1],
                traps.save(
                  strings[0] + "." + strings[1],
                  traps.get(
                    traps.read(
                      strings[0],
                      ARAN.build.read(
                        SanitizeIdentifier(strings[0]))),
                    traps.primitive(
                      ARAN.build.primitive(strings[1])))))))),
        []),
      statements),
    statements = (
      boolean && ARAN.sandbox ?
      ARAN.build.Statement(
        ARAN.build.apply(
          ARAN.build.function(
            true,
            [],
            statements),
          [])) :
      statements),
    statements = (
      ARAN.sandbox && Array_isArray(ARAN.node.AranScope) ?
      ArrayLite.concat(
        ARAN.build.Statement(
          ARAN.build.set(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("SCOPE"),
            ARAN.build.read("scope"))),
        ARAN.build.Statement(
          ARAN.build.write(
            "completion",
              Meta.apply(
                ARAN.build.function(
                  false,
                  [],
                  ARAN.build.With(
                    ARAN.build.construct(
                      ARAN.build.get(
                        ARAN.build.read(ARAN.namespace),
                        ARAN.build.primitive("PROXY")),
                      [
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive("SANDBOX")),
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive(ARAN.node.AranStrict ? "STRICT_SANDBOX_HANDLERS" : "SANDBOX_HANDLERS"))]),
                    ArrayLite.concat(
                      ARAN.build.Declare(
                        "const",
                        ARAN.namespace,
                        ARAN.build.read("this")),
                      ARAN.build.Declare(
                        "const",
                        "scope",
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive("SCOPE"))),
                      ARAN.build.Declare(
                        "const",
                        "eval",
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive("EVAL"))),
                      ARAN.build.Declare(
                        "let",
                        "completion",
                        ARAN.build.primitive(void 0)),
                      statements,
                      ARAN.build.Return(
                        ARAN.build.read("completion"))))),
                ARAN.build.read(ARAN.namespace),
                [])))) :
      statements),
    ARAN.build.PROGRAM(
      boolean && !ARAN.sandbox,
      ArrayLite.concat(
        ARAN.build.Declare(
          "let",
          "scope",
          ARAN.build.primitive(void 0)),
        ARAN.build.Try(
          ArrayLite.concat(
            ARAN.build.Statement(
              ARAN.build.write(
                "scope",
                traps.begin(
                  Boolean(ARAN.node.AranStrict),
                  (
                    Array_isArray(ARAN.node.AranScope) ?
                    ARAN.build.object(
                      ArrayLite.map(
                        ARAN.node.AranScope,
                        (string) => [
                          string,
                          ARAN.build.read(string)])) :
                    ARAN.build.primitive(null))))),
            statements,
            ARAN.build.Statement(
              ARAN.build.write(
                "completion",
                traps.success(
                  ARAN.build.read("scope"),
                  ARAN.build.read("completion"))))),
          ARAN.build.Throw(
            traps.failure(
              ARAN.build.read("scope"),
              ARAN.build.read("error"))),
          ARAN.build.Statement(
            traps.end(
              ARAN.build.read("scope")))))));

  cut.$completion = (expression) => ARAN.build.write(
    "completion",
    traps.completion(expression));

  cut.$load = (string) => traps.load(
    string,
    Meta.load(string));

  cut.$copy = (number, expression) => ARAN.build.get(
    ARAN.build.array(
      [
        expression,
        traps.copy(number) ]),
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
        traps.swap(number1, number2)]),
    ARAN.build.primitive(0));

  ArrayLite.forEach(
    [
      "object",
      "get",
      "set",
      "delete",
      "enumerate",
      "invoke",
      "apply",
      "construct",
      "unary",
      "binary"],
    (key) => cut[key] = traps[key]);

  cut.object = (properties) => traps.object(
    ArrayLite.map(properties, first),
    ARAN.build.object(properties));

  cut.array = (elements) => traps.array(
    ARAN.build.array(elements));

  cut.Label = (label, statements) => ARAN.build.Label(
    label,
    ArrayLite.concat(
      ARAN.build.Statement(traps.label(ParseLabel.split(label) , ParseLabel.core(label))),
      statements,
      ARAN.build.Statement(traps.leave("label"))));

  cut.Break = (label) => ArrayLite.concat(
    ARAN.build.Statement(traps.break(ParseLabel.split(label) , ParseLabel.core(label))),
    ARAN.build.Break(label));

  cut.Block = (statements) => ARAN.build.Block(
    ArrayLite.concat(
      ARAN.build.Statement(traps.block()),
      statements,
      ARAN.build.Statement(traps.leave("block"))));

  cut.Try = (statements1, statements2, statements3) => ARAN.build.Try(
    ArrayLite.concat(
      ARAN.build.Statement(traps.try()),
      statements1,
      ARAN.build.Statement(traps.leave("try"))),
    ArrayLite.concat(
      ARAN.build.Statement(
        ARAN.build.write(
          "error",
          traps.catch(
            ARAN.build.read("error")))),
      statements2,
      ARAN.build.Statement(traps.leave("catch"))),
    ArrayLite.concat(
      ARAN.build.Statement(traps.finally()),
      statements3,
      ARAN.build.Statement(traps.leave("finally"))));

  cut.closure = (boolean, statements) => traps.closure(
    Meta.define(
      Meta.define(
        ARAN.build.closure(
          boolean,
          ArrayLite.concat(
            ARAN.build.Declare(
              "const",
              "scope",
              traps.arrival(
                Boolean(ARAN.node.AranStrict),
                ARAN.build.object(
                  [
                    [
                      "callee",
                      ARAN.build.read("callee")],
                    [
                      "new",
                      ARAN.build.binary(
                        "!==",
                        ARAN.build.read("new.target"),
                        ARAN.build.primitive(void 0))],
                    [
                      "this",
                      ARAN.build.read("this")],
                    [
                      "arguments",
                      ARAN.build.read("arguments")]]))),
            statements)),
        "length",
        ARAN.build.primitive(
          (
            (
              ARAN.node.params.length &&
              ARAN.node.params[ARAN.node.params.length-1].type === "RestElement") ?
            ARAN.node.params.length - 1 :
            ARAN.node.params.length)),
        false, 
        false,
        true),
      "name",
      ARAN.build.primitive(Name(ARAN.node)),
      false,
      false,
      true));

  cut.read = (identifier) => traps.read(
    identifier,
    ARAN.build.read(
      SanitizeIdentifier(identifier)));

  cut.discard = (identifier) => traps.discard(
    identifier,
    ARAN.build.discard(
      SanitizeIdentifier(identifier)));

  cut.primitive = (primitive) => traps.primitive(
    ARAN.build.primitive(primitive));

  cut.regexp = (pattern, flags) => traps.regexp(
    ARAN.build.regexp(pattern, flags));

  cut.write = (identifier, expression) => ARAN.build.write(
    SanitizeIdentifier(identifier),
    traps.write(identifier, expression));

  cut.Declare = (kind, identifier, expression) => ARAN.build.Declare(
    kind,
    SanitizeIdentifier(identifier),
    traps.declare(kind, identifier, expression));

  cut.Return = (expression) => ARAN.build.Return(
    traps.return("scope", expression));

  cut.eval = (expression) => ARAN.build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => ARAN.build.With(
    Meta.wproxy(
      traps.with(expression)),
    ArrayLite.concat(
      statements,
      ARAN.build.Statement(traps.leave("with"))));

  cut.Throw = (expression) => ARAN.build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => ArrayLite.concat(
    ARAN.build.While(
      traps.test(expression),
      statements));

  cut.If = (expression, statements1, statements2) => ARAN.build.If(
    traps.test(expression),
    ArrayLite.concat(
      ARAN.build.Statement(traps.block()),
      statements1,
      ARAN.build.Statement(traps.leave("block"))),
    ArrayLite.concat(
      ARAN.build.Statement(traps.block()),
      statements2,
      ARAN.build.Statement(traps.leave("block"))));

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
