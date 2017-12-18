
const Traps = require("./traps");
const TrapKeys = require("../../trap-keys.js");
const Build = require("../build");
const Flaten = require("../flaten.js");

module.exports = (pointcut) => {

  const traps = Traps(pointcut);
  const cut = {};

  ///////////////
  // Combiners //
  ///////////////

  TrapKeys.combiners.forEach((key) => {
    cut[key] = traps[key];
  });

  ////////////////////////////////////////////////////
  // Informers + catch + arguments + this + closure //
  ////////////////////////////////////////////////////

  cut.arrow = (strict, statements) => Closure(true, strict, statements);

  cut.["function"] = (strict, statements) => Closure(false, strict, statements);

  cut.Try = (statements1, statements2, statements3) => Build.Try(
    Flaten(
      Inform(traps.Enter("try")),
      statements1,
      Inform(traps.Leave("try"))),
    Flaten(
      Inform(traps.Enter("catch")),
      Build.Statement(
        Build.write(
          "error",
          traps.catch(
            Build.read("error")))),
      statements2,
      Inform(traps.Leave("catch"))),
    Flaten(
      Inform(traps.Enter("finally")),
      statements3,
      Inform(traps.Leave("finally"))));

  cut.PROGRAM = (strict, statements) => Build.PROGRAM(
    strict,
    Flaten(
      Inform(traps.Program(strict)),
      statements));

  cut.Label = (label, statements) => Flaten(
    Inform(traps.Label(label)),
    Build.Label(label, Flaten(
      Inform(traps.Enter("label")),
      statements,
      Inform(traps.Leave("label")))));

  cut.Break = (label) => Flaten(
    Inform(traps.Break(label)),
    Build.Break(label));

  cut.Continue = (label) => Flaten(
    Inform(traps.Continue(label)),
    Build.Continue(label));

  cut.Block = (statements) => Flaten(
    Inform(traps.Enter("block")),
    statements,
    Inform(traps.Leave("block")));

  ((() => {
    const make = (key) => {
      cut[key.toLowerCase()] = {
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
            expression1;
        }
      };
    };
    make("Drop");
    [0, 1, 2, 3].forEach((position) => {
      traps["Copy"+position] = () => traps.copy(position);
      make("Copy"+position);
    });
  }) ());

  ///////////////
  // Producers //
  ///////////////

  cut.read = (identifier) => traps.read(
    identifier,
    Build.read(
      sanitize(identifier)));
  
  cut.discard = (identifier) => traps.discard(
    identifier,
    Build.discard(
      sanitize(identifier)));

  cut.primitive = (primitive) => traps.primitive(
    Build.primitive(primitive));

  cut.regexp = (pattern, flags) => traps.regexp(
    Build.regexp(pattern, flags));

  cut.protect = (name) => traps.protect(
    name,
    Build.read(Protect(name)));

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
    Flaten(
      Inform(traps.Enter("with")),
      statements,
      Inform(traps.Leave("with"))));

  cut.Throw = (expression) => Build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => Build.While(
    traps.test(expression),
    Flaten(
      Inform(traps.Enter("while")),
      statements,
      Inform(traps.Leave("while"))));

  cut.If = (expression, statements1, statements2) => Build.If(
    traps.test(expression),
    Flaten(
      Inform(traps.Enter("then")),
      statements1,
      Inform(traps.Leave("then"))),
    Flaten(
      Inform(traps.Enter("else")),
      statements1,
      Inform(traps.Leave("else"))));

  cut.conditional = (expression1, expression2, expression3) => Build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  // // TODO
  // cut.Switch = (expression, cases) => concat.call(
  //   Inform(traps.Enter("switch")),
  //   [
  //     Build.Switch(
  //       expression,
  //       cases.map((array) => [
  //         traps.$test(array[0]),
  //         array[1]]))],
  //   Inform(traps.Leave("switch")));

  ////////////
  // Return //
  ////////////

  return cut;

};
