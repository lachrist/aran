
const ArrayLite = require("array-lite");
const Traps = require("./traps");
const Escape = require("../escape.js");
const apply = Reflect.apply;
const substring = String.prototype.substring;
const toUpperCase = String.prototype.toUpperCase;
const Inform = require("./inform.js");
const SanitizeIdentifier = require("./sanitize-identifier.js");
const SanitizeLabel = require("./sanitize-label.js");
const ContainArguments = require("./contain-arguments.js");

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  /////////////////
  // Compilation //
  /////////////////

  cut.$builtin = (name) => traps.builtin(
    name,
    ARAN.build.read(
      Escape(name)));

  cut.$copy = traps.copy;

  cut.$drop = traps.drop;

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

  cut.Label = (label, statements) => ArrayLite.concat(
    Inform(traps.label(label, false)),
    ARAN.build.Label(
      label && SanitizeLabel.break(label),
      ArrayLite.concat(
        statements,
        Inform(traps.leave("label")))));

  cut.Break = (label) => ArrayLite.concat(
    Inform(traps.break(label, false)),
    ARAN.build.Break(
      label && SanitizeLabel.break(label)));

  cut.Continue = (label) => ArrayLite.concat(
    Inform(traps.break(label, true)),
    (
      label ?
      ARAN.build.Break(
        SanitizeLabel.break(label)) :
      ARAN.build.Continue()));

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
      ARAN.build.Declare(
        "const",
        Escape("error"),
        traps.catch(
          ARAN.build.read("error"))),
      statements2,
      Inform(traps.leave("catch"))),
    ArrayLite.concat(
      Inform(traps.finally()),
      statements3,
      Inform(traps.leave("finally"))));

  cut.closure = (strict, statements) => ARAN.build.apply(
    ARAN.build.closure(
      strict,
      ArrayLite.concat(
        ARAN.build.Declare(
          "const",
          Escape("callee"),
          traps.closure(
            ARAN.build.closure(
              strict,
              ArrayLite.concat(
                (
                  ARAN.parent.type === "ArrowFunctionExpression" ?
                  ARAN.build.If(
                    ARAN.build.read("new.target"),
                    ARAN.build.Throw(
                      ARAN.build.construct(
                        ARAN.build.read(
                          Escape("TypeError")),
                        [
                          ARAN.build.primitive("arrow is not a constructor")])),
                    []) :
                  []),
                Inform(
                  traps.callee(
                    ARAN.build.read(
                      Escape("callee")))),
                (
                  ARAN.parent.type === "ArrowFunctionExpression" ?
                  (
                    traps.drop(
                      traps.this(
                        ARAN.build.read("this")))) :
                  ARAN.build.Declare(
                    "const",
                    SanitizeIdentifier("this"),
                    traps.declare(
                      "const",
                      "this",
                      traps.this(
                        ARAN.build.read("this"))))),
                (
                  ARAN.parent.type === "ArrowFunctionExpression" ?
                  (
                    traps.drop(
                      traps.newtarget(
                        ARAN.build.read("new.target")))) :
                  ARAN.build.Declare(
                    "const",
                    SanitizeIdentifier("new.target"),
                    traps.declare(
                      "const",
                      "new.target",
                      traps.newtarget(
                        ARAN.build.read("new.target"))))),
                ARAN.build.Declare(
                  "const",
                  Escape("arguments"),
                  traps.arguments(
                    ARAN.build.read("arguments"))),
                (
                  (
                    ARAN.parent.type === "ArrowFunctionExpression" ||
                    ContainArguments(
                      ArrayLite.slice(ARAN.parent.params))) ?
                  [] :
                  ARAN.build.Declare(
                    "let",
                    SanitizeIdentifier("arguments"),
                    traps.declare(
                      "let",
                      "arguments",
                      traps.copy(
                        0,
                        ARAN.build.read(
                          Escape("arguments")))))),
                statements)))),
        ARAN.build.Return(
          ARAN.build.read(
            Escape("callee"))))),
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

  // eval in strict mode is block-scoped 
  // eval in normal mode is closure-scoped
  cut.PROGRAM = (strict, statements) => ARAN.build.PROGRAM(
    strict,
    ARAN.build.Try(
      ArrayLite.concat(
        Inform(traps.program()),
        ARAN.build.Declare(
          "let",
          Escape("terminate"),
          traps.primitive(
            ARAN.build.primitive(void 0))),
        statements,
        ARAN.build.Statement(
          traps.terminate(
            true,
            ARAN.build.read(
              Escape("terminate"))))),
      ARAN.build.Throw(
        traps.terminate(
          false,
          ARAN.build.read("error"))),
      []));

  cut.write = (identifier, expression) => ARAN.build.write(
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

  cut.While = (expression, label, statements) => ArrayLite.concat(
    Inform(
      traps.label(null, false)),
    ARAN.build.While(
      traps.test(expression),
      (
        label &&
        SanitizeLabel.continue(label)),
      ArrayLite.concat(
        Inform(
          traps.label(null, true)),
        (
          label ?
          Inform(
            traps.label(label, true)) :
          []),
        statements,
        (
          label ?
          Inform(
            traps.leave("label")) :
          []),
        Inform(
          traps.leave("label")))),
    Inform(traps.leave("label")));

  cut.For = (statements1, expression1, expression2, label, statements2) => ArrayLite.concat(
    Inform(traps.label(null, false)),
    ARAN.build.For(
      statements1,
      traps.test(expression1),
      expression2,
      (
        label &&
        SanitizeLabel.continue(label)),
      ArrayLite.concat(
        Inform(
          traps.label(null, true)),
        (
          label ?
          Inform(
            traps.label(label, true)) :
          []),
        statements2,
        (
          label ?
          Inform(
            traps.leave("label")) :
          []),
        Inform(traps.leave("label")))),
    Inform(traps.leave("label")));

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

  cut.Switch = (clauses) => ArrayLite.concat(
    Inform(traps.label(null)),
    ARAN.build.Switch(
      clauses.map((clause) => [
        traps.test(clause[0]),
        clause[1]])),
    Inform(traps.leave("label")));

  ////////////
  // Return //
  ////////////

  return cut;

};
