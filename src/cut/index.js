
const ArrayLite = require("array-lite");
const Build = require("../build");
const Traps = require("./traps");
const Escape = require("../escape.js");
const apply = Reflect.apply;
const substring = String.prototype.substring;
const toUpperCase = String.prototype.toUpperCase;

const inform = (expression) => expression ?
  Build.Statement(expression) :
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

  cut.PROGRAM = (strict, statements) => Build.PROGRAM(
    strict,
    ArrayLite.concat(
      inform(traps.program(strict)),
      statements));

  cut.Label = (label, statements) => ArrayLite.concat(
    inform(traps.label(label)),
    Build.Label(label, ArrayLite.concat(
      inform(traps.enter("label")),
      statements,
      inform(traps.leave("label")))));

  cut.Break = (label) => ArrayLite.concat(
    inform(traps.break(label)),
    Build.Break(label));

  cut.Continue = (label) => ArrayLite.concat(
    inform(traps.continue(label)),
    Build.Continue(label));

  cut.Block = (statements) => ArrayLite.concat(
    inform(traps.enter("block")),
    statements,
    inform(traps.leave("block")));

  cut.$Arrival = (strict, arrow) => inform(
    traps.arrival(strict, arrow, null));

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
      cut["$"+key+"before"] = (expression1) => {
        const expression2 = traps[key]();
        return expression2 ?
          Build.sequence(expression1, expression2) :
          expression1
      };
      cut["$"+key+"after"] = (expression1) => {
        const expression2 = traps[key]();
        return expression2 ?
          Build.get(
            Build.array([expression1, expression2]),
            Build.primitive(0)) :
          expression1;
      };
    });

  ///////////////
  // Producers //
  ///////////////

  cut.$this = () => traps.this(null);

  cut.$arguments = () => traps.arguments(null);

  cut.$error = () => traps.error(null);

  cut.$builtin = (name) => traps.builtin(
    name,
    Escape(name));

  cut.Try = (statements1, statements2, statements3) => Build.Try(
    ArrayLite.concat(
      inform(traps.enter("try")),
      statements1,
      inform(traps.leave("try"))),
    ArrayLite.concat(
      inform(traps.enter("catch")),
      statements2,
      inform(traps.leave("catch"))),
    ArrayLite.concat(
      inform(traps.enter("finally")),
      statements3,
      inform(traps.leave("finally"))));

  cut.closure = (strict, statements) => traps.closure([strict, statements]);

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

  cut.write = (identifier, expression) => Build.write(
    sanitize(identifier),
    traps.write(identifier, expression));

  cut.Declare = (kind, identifier, expression) => Build.Declare(
    kind,
    sanitize(identifier),
    traps.declare(kind, identifier, expression));

  cut.Return = (expression) => Build.Return(
    traps.return(expression));

  cut.eval = (expression) => Build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => Build.With(
    traps.with(expression),
    ArrayLite.concat(
      inform(traps.enter("with")),
      statements,
      inform(traps.leave("with"))));

  cut.Throw = (expression) => Build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => Build.While(
    traps.test(expression),
    ArrayLite.concat(
      inform(traps.enter("while")),
      statements,
      inform(traps.leave("while"))));

  cut.If = (expression, statements1, statements2) => Build.If(
    traps.test(expression),
    ArrayLite.concat(
      inform(traps.enter("then")),
      statements1,
      inform(traps.leave("then"))),
    ArrayLite.concat(
      inform(traps.enter("else")),
      statements2,
      inform(traps.leave("else"))));

  cut.conditional = (expression1, expression2, expression3) => Build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  cut.Switch = (clauses) => ArrayLite.concat(
    inform(traps.enter("switch")),
    Build.Switch(
      clauses.map((clause) => [
        traps.test(clause[0]),
        clause[1]])),
    inform(traps.leave("switch")));

  ////////////
  // Return //
  ////////////

  return cut;

};
