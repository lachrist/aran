
const ArrayLite = require("array-lite");
const Traps = require("./traps");
const Escape = require("../escape.js");
const apply = Reflect.apply;
const substring = String.prototype.substring;
const toUpperCase = String.prototype.toUpperCase;
const Inform = require("./inform.js");
const SanitizeIdentifier = require("./sanitize-identifier.js")

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

  ArrayLite.each(
    [0,1,2,3],
    (position) => traps["copy"+position] = () => traps.copy(position));

  traps.drop0 = traps.drop;

  ArrayLite.each(
    ["drop0", "copy0", "copy1", "copy2", "copy3"],
    (key) => {
      cut["$"+apply(toUpperCase, key[0], [])+apply(substring, key, [1])] = () => Inform.Statement(traps[key]());
      cut["$"+key+"before"] = (expression2) => {
        const expression1 = traps[key]();
        return expression1 ?
          ARAN.build.sequence(
            [expression1, expression2]) :
          expression2
      };
      cut["$"+key+"after"] = (expression1) => {
        const expression2 = traps[key]();
        return expression2 ?
          ARAN.build.get(
            ARAN.build.array([expression1, expression2]),
            ARAN.build.primitive(0)) :
          expression1;
      };
    });

  ///////////////
  // Combiners //
  ///////////////

  ArrayLite.each(
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
    Inform.Statement(traps.label(label)),
    ARAN.build.Label(label, ArrayLite.concat(
      statements,
      Inform.Statement(traps.leave("label")))));

  cut.Break = (label) => ArrayLite.concat(
    Inform.Statement(traps.break(label)),
    ARAN.build.Break(label));

  cut.Block = (statements) => ARAN.build.Block(
    ArrayLite.concat(
      Inform.Statement(traps.block()),
      statements,
      Inform.Statement(traps.leave("block"))));

  ///////////////
  // Producers //
  ///////////////

  cut.Try = (statements1, statements2, statements3) => ARAN.build.Try(
    ArrayLite.concat(
      Inform.Statement(traps.try()),
      statements1,
      Inform.Statement(traps.leave("try"))),
    ArrayLite.concat(
      ARAN.build.Declare(
        "const",
        Escape("error"),
        traps.catch(
          ARAN.build.read("error"))),
      statements2,
      Inform.Statement(traps.leave("catch"))),
    ArrayLite.concat(
      Inform.Statement(traps.finally()),
      statements3,
      Inform.Statement(traps.leave("finally"))));

  cut.closure = (identifier, strict, statements) => traps.closure(
    ARAN.build.closure(
      identifier,
      strict,
      ArrayLite.concat(
        Inform.Statement(
          traps.callee(
            ARAN.build.read(identifier))),
        ARAN.build.Declare(
          Escape("this"),
          traps.this(
            ARAN.build.read("this"))),
        ARAN.build.Declare(
          Escape("arguments"),
          traps.this(
            ARAN.build.read("arguments"))),
        statements)));

    // Interim.hoist(
    //   "closure",
    //   ARAN.build.closure(
    //     strict,
    //     ArrayLite.concat(
    //       (
    //         ARAN.parent.type === "ArrowFunctionExpression" ?
    //         [] :
    //         ARAN.build.Declare(
    //           Escape("this"),
    //           ARAN.build.read("this"))),
    //       Interim.Declare(
    //         "context",
    //         traps.arrival(
    //           ARAN.build.read("callee"),
    //           ARAN.build.read("this"),
    //           ARAN.build.read("arguments"))),
    //       inform(traps.copy2()),
    //       inform(traps.drop0()),
    //       (
    //         ARAN.parent.type === "ArrowFunctionExpression" ?
    //         ARAN.cut.Drop0(),
    //         ARAN.build..Declare)

    //           ARAN.parent.type === "ArrowFunctionExpression" ?
    //           ARAN.build.closure(
    //             false,
    //             ARAN.build.Statement(
    //               ARAN.build.write(
    //                 Escape("this"),
    //                 ARAN.build.get(
    //                   ARAN.build.read("arguments"),
    //                   ARAN.build.primitive(0)))))))
    //       traps.arguments()
    //       inform(
    //         traps.arrival(
    //           Interim.read("closure"))),
    //       ARAN.build.Declare(
    //         "const",
    //         Escape("this"),
    //         traps.this(
    //           ARAN.build.read("this"))),
    //       ARAN.build.Declare(
    //         "const",
    //         Escape("arguments"),
    //         traps.arguments(
    //           ARAN.build.read("arguments"))),
    //       statements));

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

  cut.PROGRAM = (strict, statements, expression) => ARAN.build.PROGRAM(
    strict,
    ArrayLite.concat(
      inform(traps.program()),
      statements),
    traps.terminate(expression));

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
      inform(traps.leave("with"))));

  cut.Throw = (expression) => ARAN.build.Throw(
    traps.throw(expression));

  cut.While = (label1, expression, label2, statements) => ArrayLite.concat(
    inform(traps.label(label1)),
    ARAN.build.While(
      label1,
      traps.test(expression),
      label2,
      ArrayLite.concat(
        inform(traps.label(label2)),
        statements,
        inform(traps.leave("label")))),
    inform(traps.leave("label")));

  cut.For = (label1, expression1, expression2, label2, statements, temporary) => ArrayLite.concat(
    inform(traps.label(label1)),
    ARAN.build.For(
      label1,
      traps.test(expression),
      (
        temporary = traps.drop0(),
        (
          temporary ?
          Build.sequence(expression2, temporary) :
          expression2)),
      label2,
      ArrayLite.concat(
        inform(traps.label(label2)),
        statements,
        inform(traps.leave("label"))),
    inform(traps.leave("label")));

  cut.If = (expression, statements1, statements2) => ARAN.build.If(
    traps.test(expression),
    ArrayLite.concat(
      inform(traps.block()),
      statements1,
      inform(traps.leave("block"))),
    ArrayLite.concat(
      inform(traps.block()),
      statements2,
      inform(traps.leave("block"))));

  cut.conditional = (expression1, expression2, expression3) => ARAN.build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  cut.Switch = (clauses) => ArrayLite.concat(
    inform(traps.block()),
    ARAN.build.Switch(
      clauses.map((clause) => [
        traps.test(clause[0]),
        clause[1]])),
    inform(traps.leave("block")));

  ////////////
  // Return //
  ////////////

  return cut;

};
