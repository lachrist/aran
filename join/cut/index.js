
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Traps = require("./traps");

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
      Inform(traps.Program(strict)),
      statements));

  cut.Label = (label, statements) => ArrayLite.concat(
    Inform(traps.Label(label)),
    Build.Label(label, ArrayLite.concat(
      Inform(traps.Enter("label")),
      statements,
      Inform(traps.Leave("label")))));

  cut.Break = (label) => ArrayLite.concat(
    Inform(traps.Break(label)),
    Build.Break(label));

  cut.Continue = (label) => ArrayLite.concat(
    Inform(traps.Continue(label)),
    Build.Continue(label));

  cut.Block = (statements) => ArrayLite.concat(
    Inform(traps.Enter("block")),
    statements,
    Inform(traps.Leave("block")));

  cut.$Closure = (strict, arrow) => Inform(
    traps.Closure(strict, arrow, null));

  ArrayLite.each(
    [0,1,2,3],
    (position) => {
      traps["Copy"+position] = () => traps.copy(position);
    });

  ArrayLite.each(
    ["Drop", "Copy0", "Copy1", "Copy2", "Copy3"],
    (key) =>
      {
        cut["$"+key.toLowerCase()] = {
          after: (expression1) => {
            const expression2 = traps[key]();
            return expression2 ?
              Build.get(
                Build.array([expression1, expression2]),
                0) :
              expression1;
          },
          before: (expression1) => {
            const expression2 = traps[key]();
            return expression2 ?
              Build.sequence(expression1, expression2) :
              expression1
          }}
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
      Inform(traps.Enter("try")),
      statements1,
      Inform(traps.Leave("try"))),
    ArrayLite.concat(
      Inform(traps.Enter("catch")),
      statements2,
      Inform(traps.Leave("catch"))),
    ArrayLite.concat(
      Inform(traps.Enter("finally")),
      statements3,
      Inform(traps.Leave("finally"))));

  cut.closure = (strict, statements) => traps.closure([strict, statements]);

  cut.read = (identifier) => traps.read(
    identifier,
    Sanitize(identifier));

  cut.discard = (identifier) => traps.discard(
    identifier,
    Sanitize(identifier));

  cut.primitive = (primitive) => traps.primitive(primitive);

  cut.regexp = (pattern, flags) => traps.regexp([pattern, flags]);

  ///////////////
  // Consumers //
  ///////////////

  cut.write = (identifier, expression) => Build.write(
    Sanitize(identifier),
    traps.write(identifier, expression));

  cut.Declare = (kind, identifier, expression) => Build.Declare(
    kind,
    Sanitize(identifier),
    traps.declare(kind, identifier, expression));

  cut.Return = (expression) => Build.Return(
    traps.return(expression));

  cut.eval = (expression) => Build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => Build.With(
    traps.with(expression),
    ArrayLite.concat(
      Inform(traps.Enter("with")),
      statements,
      Inform(traps.Leave("with"))));

  cut.Throw = (expression) => Build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => Build.While(
    traps.test(expression),
    ArrayLite.concat(
      Inform(traps.Enter("while")),
      statements,
      Inform(traps.Leave("while"))));

  cut.If = (expression, statements1, statements2) => Build.If(
    traps.test(expression),
    ArrayLite.concat(
      Inform(traps.Enter("then")),
      statements1,
      Inform(traps.Leave("then"))),
    ArrayLite.concat(
      Inform(traps.Enter("else")),
      statements1,
      Inform(traps.Leave("else"))));

  cut.conditional = (expression1, expression2, expression3) => Build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  cut.Switch = (clauses) => ArrayLite.concat(
    Inform(traps.Enter("switch")),
    Build.Switch(
      clauses.map((clause) => [
        traps.test(clause[0]),
        clause[1]])),
    Inform(traps.Leave("switch")));

  ////////////
  // Return //
  ////////////

  return cut;

};
