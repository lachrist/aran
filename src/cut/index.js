
const ArrayLite = require("array-lite");
const Traps = require("./traps");
const Escape = require("../escape.js");
const apply = Reflect.apply;
const substring = String.prototype.substring;
const toUpperCase = String.prototype.toUpperCase;

const inform = (expression) => expression ?
  ARAN.build.Statement(expression) :
  [];

const sanitize = (identifier) => (
  ArrayLite.contain(["this", "arguments", "error"], identifier) ?
  Escape(identifier) :
  ( 
    ArrayLite.prefix(ARAN.namespace, identifier) ?
    (ARAN.namespace[0] === "$" ? "_" : "$") + identifier :
    identifier));

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  /////////////////
  // Compilation //
  /////////////////

  cut.$builtin = (name) => traps.builtin(
    name,
    Escape(name));

  ArrayLite.each(
    [0,1,2,3],
    (position) => {
      traps["copy"+position] = () => traps.copy(position);
    });

  traps.drop0 = traps.drop;

  ArrayLite.each(
    ["drop0", "copy0", "copy1", "copy2", "copy3"],
    (key) => {
      cut["$"+apply(toUpperCase, key[0], [])+apply(substring, key, [1])] = () => inform(traps[key]());
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
    (key) => {
      cut[key] = traps[key];
    });

  ///////////////
  // Informers //
  ///////////////

  cut.PROGRAM = (strict, statements, expression) => ARAN.build.PROGRAM(
    strict,
    ArrayLite.concat(
      inform(traps.program(strict)),
      statements),
    traps.last(expression));

  cut.Label = (label, statements) => ArrayLite.concat(
    inform(traps.label(label)),
    ARAN.build.Label(label, ArrayLite.concat(
      statements,
      inform(traps.leave("label")))));

  cut.Break = (label) => ArrayLite.concat(
    inform(traps.break(label)),
    ARAN.build.Break(label));

  cut.Continue = (label) => ArrayLite.concat(
    inform(traps.continue(label)),
    ARAN.build.Continue(label));

  cut.Block = (statements) => ARAN.build.Block(
    ArrayLite.concat(
      inform(traps.block()),
      statements,
      inform(traps.leave("block"))));

  ///////////////
  // Producers //
  ///////////////

  cut.Try = (statements1, statements2, statements3) => ARAN.build.Try(
    ArrayLite.concat(
      inform(traps.try()),
      statements1,
      inform(traps.leave("try"))),
    ArrayLite.concat(
      ARAN.build.Statement(
        ARAN.build.write(
          "error",
          traps.catch(null))),
      inform(traps.enter("catch")),
      statements2,
      inform(traps.leave("catch"))),
    ArrayLite.concat(
      inform(traps.finally()),
      statements3,
      inform(traps.leave("finally"))));

  cut.closure = (strict, statements) => traps.closure(
    [
      strict,
      (
        ARAN.parent.type === "ArrowFunctionExpression" ?
        ArrayLite.concat(
          ARAN.build.Statement(
            traps.this(null)),
          inform(traps.drop0())) :
        ARAN.build.Declare(
          "const",
          "self",
          traps.declare(
            "const",
            "this",
            traps.this(null)))),
      ARAN.build.Statement(
        ARAN.build.write(
          "arguments",
          (
            ARAN.parent.type === "ArrowFunctionExpression" ?
            traps.arguments(null) :
            traps.declare(
              "let",
              "arguments",
              traps.arguments(null)))))
        ARAN.build.Statement(
          ARAN.build.write(
            "arguments",
            traps.declare(
              "let",
              "arguments",
              ))))
      ARAN.build.Statement(
        ARAN.build.write(
          "arguments",
          traps.arguments(null)))
      statements]);

  cut.read = (identifier) => traps.read(
    identifier,
    sanitize(identifier));

  cut.discard = (identifier) => traps.discard(
    identifier,
    sanitize(identifier));

  cut.primitive = (primitive) => traps.primitive(primitive);

  cut.regexp = (pattern, flags) => traps.regexp([pattern, flags]);

  ///////////////
  // Consumers //
  ///////////////

  cut.write = (identifier, expression) => ARAN.build.write(
    sanitize(identifier),
    traps.write(identifier, expression));

  cut.Declare = (kind, identifier, expression) => ARAN.build.Declare(
    kind,
    sanitize(identifier),
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

  cut.While = (expression, statements) => ARAN.build.While(
    traps.test(expression),
    ArrayLite.concat(
      inform(traps.enter("loop")),
      statements,
      inform(traps.leave("loop"))));

  cut.If = (expression, statements1, statements2) => ARAN.build.If(
    traps.test(expression),
    ArrayLite.concat(
      inform(traps.enter("then")),
      statements1,
      inform(traps.leave("then"))),
    ArrayLite.concat(
      inform(traps.enter("else")),
      statements2,
      inform(traps.leave("else"))));

  cut.conditional = (expression1, expression2, expression3) => ARAN.build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  cut.Switch = (clauses) => ArrayLite.concat(
    inform(traps.enter("switch")),
    ARAN.build.Switch(
      clauses.map((clause) => [
        traps.test(clause[0]),
        clause[1]])),
    inform(traps.leave("switch")));

  ////////////
  // Return //
  ////////////

  return cut;

};
