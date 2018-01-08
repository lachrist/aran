
const ArrayLite = require("array-lite");
const Build = require("../build");
const Traps = require("./traps");
const Escape = require("../escape.js");

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
      inform(traps.Program(strict)),
      statements));

  cut.Label = (label, statements) => ArrayLite.concat(
    inform(traps.Label(label)),
    Build.Label(label, ArrayLite.concat(
      inform(traps.Enter("label")),
      statements,
      inform(traps.Leave("label")))));

  cut.Break = (label) => ArrayLite.concat(
    inform(traps.Break(label)),
    Build.Break(label));

  cut.Continue = (label) => ArrayLite.concat(
    inform(traps.Continue(label)),
    Build.Continue(label));

  cut.Block = (statements) => ArrayLite.concat(
    inform(traps.Enter("block")),
    statements,
    inform(traps.Leave("block")));

  cut.$Closure = (strict, arrow) => inform(
    traps.Closure(strict, arrow, null));

  ArrayLite.each(
    [0,1,2,3],
    (position) => {
      traps["Copy"+position] = () => traps.Copy(position);
    });

  traps.Drop0 = traps.Drop;

  ArrayLite.each(
    ["Drop0", "Copy0", "Copy1", "Copy2", "Copy3"],
    (key) => {
      cut["$"+key] = () => inform(traps[key]());
      cut["$"+key.toLowerCase()+"before"] = (expression1) => {
        const expression2 = traps[key]();
        return expression2 ?
          Build.sequence(expression1, expression2) :
          expression1
      };
      cut["$"+key.toLowerCase()+"after"] = (expression1) => {
        const expression2 = traps[key]();
        return expression2 ?
          Build.get(
            Build.array([expression1, expression2]),
            0) :
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
      inform(traps.Enter("try")),
      statements1,
      inform(traps.Leave("try"))),
    ArrayLite.concat(
      inform(traps.Enter("catch")),
      statements2,
      inform(traps.Leave("catch"))),
    ArrayLite.concat(
      inform(traps.Enter("finally")),
      statements3,
      inform(traps.Leave("finally"))));

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
    traps.write(expression, identifier));

  cut.Declare = (kind, identifier, expression) => Build.Declare(
    kind,
    sanitize(identifier),
    traps.declare(expression, kind, identifier));

  cut.Return = (expression) => Build.Return(
    traps.return(expression));

  cut.eval = (expression) => Build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => Build.With(
    traps.with(expression),
    ArrayLite.concat(
      inform(traps.Enter("with")),
      statements,
      inform(traps.Leave("with"))));

  cut.Throw = (expression) => Build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => Build.While(
    traps.test(expression),
    ArrayLite.concat(
      inform(traps.Enter("while")),
      statements,
      inform(traps.Leave("while"))));

  cut.If = (expression, statements1, statements2) => Build.If(
    traps.test(expression),
    ArrayLite.concat(
      inform(traps.Enter("then")),
      statements1,
      inform(traps.Leave("then"))),
    ArrayLite.concat(
      inform(traps.Enter("else")),
      statements1,
      inform(traps.Leave("else"))));

  cut.conditional = (expression1, expression2, expression3) => Build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  cut.Switch = (clauses) => ArrayLite.concat(
    inform(traps.Enter("switch")),
    Build.Switch(
      clauses.map((clause) => [
        traps.test(clause[0]),
        clause[1]])),
    inform(traps.Leave("switch")));

  ////////////
  // Return //
  ////////////

  return cut;

};
