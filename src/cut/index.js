
const ArrayLite = require("array-lite");
const Traps = require("./traps");
const Builtin = require("../builtin.js");
const Reflect_apply = Reflect.apply;
const String_prototype_replace = String.prototype.replace;
const Inform = require("./inform.js");
const ParseLabel = require("./parse-label.js");
const SanitizeIdentifier = require("./sanitize-identifier.js");
const ContainArguments = require("./contain-arguments.js");
const Setup = require("../setup.js");

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  // eval in strict mode is block-scoped 
  // eval in normal mode is closure-scoped
  cut.PROGRAM = (strict, statements) => ARAN.build.PROGRAM(
    strict,
    ArrayLite.concat(
      ARAN.nosetup ? [] : Setup(),
      ARAN.build.Try(
        ArrayLite.concat(
          Inform(
            traps.begin()),
          ARAN.build.Statement(
            ARAN.build.write(
              "completion",
              traps.completion(
                traps.primitive(
                  ARAN.build.primitive(void 0))))),
          statements,
          ARAN.build.Statement(
            ARAN.build.write(
              "completion",
              traps.success(
                ARAN.build.read("completion"))))),
        ARAN.build.Throw(
          traps.failure(
            ARAN.build.read("error"))),
        Inform(
          traps.end()))));

  /////////////////
  // Compilation //
  /////////////////

  cut.$builtin = (strings) => traps.builtin(
    ArrayLite.join(strings, "."),
    Builtin.load(strings));

  cut.$completion = (expression) => ARAN.build.write(
    "completion",
    traps.completion(expression));

  cut.$copy = traps.copy;

  cut.$drop = traps.drop;

  cut.$swap = traps.swap;

  ///////////////
  // Combiners //
  ///////////////

  ArrayLite.forEach(
    [
      "object",
      "array",
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

  ///////////////
  // Informers //
  ///////////////

  cut.Label = (label, statements) => ARAN.build.Label(
    label,
    ArrayLite.concat(
      Inform(traps.label(ParseLabel.split(label) , ParseLabel.core(label))),
      statements,
      Inform(traps.leave("label"))));

  cut.Break = (label) => ArrayLite.concat(
    Inform(traps.break(ParseLabel.split(label) , ParseLabel.core(label))),
    ARAN.build.Break(label));

  cut.Block = (statements) => ARAN.build.Block(
    ArrayLite.concat(
      Inform(traps.block()),
      statements,
      Inform(traps.leave("block"))));

  ///////////////
  // Producers //
  ///////////////

  cut.Try = (statements1, statements2, statements3) => ARAN.build.Try(
    ArrayLite.concat(
      Inform(traps.try()),
      statements1,
      Inform(traps.leave("try"))),
    ArrayLite.concat(
      ARAN.build.Statement(
        ARAN.build.write(
          "error",
          traps.catch(
            ARAN.build.read("error")))),
      statements2,
      Inform(traps.leave("catch"))),
    ArrayLite.concat(
      Inform(traps.finally()),
      statements3,
      Inform(traps.leave("finally"))));

  cut.closure = (strict, statements) => ARAN.build.apply(
    null,
    ARAN.build.closure(
      strict,
      ArrayLite.concat(
        ARAN.build.Declare(
          "const",
          "callee",
          traps.closure(
            ARAN.build.closure(
              strict,
              (
                ARAN.parent.type === "ArrowFunctionExpression" ?
                ArrayLite.concat(
                  ARAN.build.If(
                    ARAN.build.read("new.target"),
                    ARAN.build.Throw(
                      ARAN.build.construct(
                        Builtin.load(["TypeError"]),
                        [
                          ARAN.build.primitive("arrow is not a constructor")])),
                    []),
                  ARAN.build.Statement(
                    traps.drop(
                      traps.callee(
                        ARAN.build.read("callee")))),
                  ARAN.build.Statement(
                    traps.drop(
                      traps.this(
                        ARAN.build.read("this")))),
                  ARAN.build.Statement(
                    ARAN.build.write(
                      "arguments",
                      traps.arguments(
                        ARAN.build.read("arguments")))),
                  statements) :
                ArrayLite.concat(
                  ARAN.build.Declare(
                    "const",
                    SanitizeIdentifier("new.target"),
                    traps.declare(
                      "const",
                      "new.target",
                      ARAN.build.conditional(
                        ARAN.build.read("new.target"),
                        traps.callee(
                          ARAN.build.read("callee")),
                        ARAN.build.sequence(
                          [
                            traps.drop(
                              traps.callee(
                                ARAN.build.read("callee"))),
                            traps.primitive(
                              ARAN.build.primitive(void 0))])))),
                  ARAN.build.Declare(
                    "const",
                    SanitizeIdentifier("this"),
                    traps.declare(
                      "const",
                      "this",
                      traps.this(
                        ARAN.build.read("this")))),
                  ARAN.build.Statement(
                    ARAN.build.write(
                      "arguments",
                      traps.arguments(
                        ARAN.build.read("arguments")))),
                  (
                    ContainArguments(
                        ArrayLite.slice(ARAN.parent.params)) ?
                    [] :
                    ARAN.build.Declare(
                      "let",
                      SanitizeIdentifier("arguments"),
                      traps.declare(
                        "let",
                        "arguments",
                        traps.copy(
                          1,
                          ARAN.build.read("arguments"))))),
                  statements))))),
        ARAN.build.Return(
          ARAN.build.read("callee")))),
    []);

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

  ///////////////
  // Consumers //
  ///////////////

  cut.write = (
    aran.sandbox ?
    (identifier, expression) => ARAN.build.write(
      SanitizeIdentifier(identifier),
      traps.write(identifier, expression)) :
    (identifier, expression) => (
      node.AranStrict ?
      ARAN.build.sequence(
        [
          Builtin.save(["declare"], false),
          ARAN.build.write(
            SanitizeIdentifier(identifier),
            traps.write(identifier, expression)),
          Builtin.save(["declare"], true),
          ARAN.build.read(SanitizeIdentifier(identifier))])) :
      ARAN.build.write(
        SanitizeIdentifier(identifier),
        traps.write(identifier, expression));

  cut.Declare = (kind, identifier, expression) => ARAN.build.Declare(
    kind,
    SanitizeIdentifier(identifier),
    traps.declare(kind, identifier, expression));

  cut.Return = (expression) => ARAN.build.Return(
    traps.return(expression));

  cut.eval = (expression) => ARAN.build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => ARAN.build.With(
    traps.with(expression),
    ArrayLite.concat(
      statements,
      Inform(traps.leave("with"))));

  cut.Throw = (expression) => ARAN.build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => ArrayLite.concat(
    ARAN.build.While(
      traps.test(expression),
      statements));

  cut.If = (expression, statements1, statements2) => ARAN.build.If(
    traps.test(expression),
    ArrayLite.concat(
      Inform(traps.block()),
      statements1,
      Inform(traps.leave("block"))),
    ArrayLite.concat(
      Inform(traps.block()),
      statements2,
      Inform(traps.leave("block"))));

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

  ////////////
  // Return //
  ////////////

  return cut;

};
