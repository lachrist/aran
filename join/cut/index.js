
const Traps = require("./traps");
const TrapKeys = require("../../trap-keys.js");
const Build = require("../build");
const Flaten = require("../flaten.js");


module.exports = (pointcut) => {

  const traps = Traps(pointcut);
  const cut = {};

  // cut.$This = () => Build.Declare(
  //   "var",
  //   Protect("this"),
  //   traps.this(
  //     Build.this()));
  // cut.$Arguments = () => Build.Declare(
  //   "var",
  //   Protect("arguments"),
  //   traps.arguments(
  //     Build.arguments()));

  // cut.closure = (identifier, identifiers, statements) => traps.closure(
  //   Build.closure(identifier, identifiers, statements));

  // TrapKeys.informers.forEach((key) => {
  //   cut[key] = (...rest) => {
  //     const expression = traps[key](...rest);
  //     return expression ?
  //       Build.Statement(expression) :
  //       Build.Empty();
  // }});

  ///////////////
  // Combiners //
  ///////////////

  TrapKeys.combiners.forEach((key) => {
    cut[key] = traps[key];
  });

  //////////////////////////////////////////
  // Informers + catch + arguments + this //
  //////////////////////////////////////////

  ["Label", "Break", "Continue"].forEach((key) => {
    cut[key] = (label, statement) => Flaten(
      Inform(traps[key](label)),
      Build[key](label, statements));
  });

  cut.Block = (statements) => Flaten(
    Inform(traps.Enter("block")),
    statements,
    Inform(traps.Leave("block")));

  cut.Try = (statements1, statements2, statement3) => Build.Try(
    Flaten(
      Inform(traps.Enter("try")),
      statements,
      Inform(traps.Leave("try"))),
    Flaten(
      Inform(traps.Enter("catch")),
      Build.Statement(
        Build.write(
          "error",
          traps.catch(
            Build.read("error")))),
      statements,
      Inform(traps.Leave("catch"))),
    Flaten(
      Inform(traps.Enter("finally")),
      statements,
      Inform(traps.Leave("finally"))));

  cut.closure = (strict, TODO arrow, statements) => traps.closure(
    Build.closure(
      strict,
      identifier,
      Flaten(
        // META.closure(STRICT);
        Inform(traps.Closure(strict));
        // arguments = META.arguments(arguments);
        [
          Build.Statement(
            Build.write(
              "arguments",
              traps.arguments(
                Build.read("arguments"))))],
        // META.copy(2);
        Inform(arrow ?
          null :
          traps.Copy(2)),
        // let METAarguments = META.declare(arguments, "let", "arguments");
        arrow ?
          [] :
          [
            Build.Declare(
              "var",
              Sanitize("arguments"),
              traps.declare(
                "let",
                "arguments",
                Build.read("arguments")))],
        // META.drop();
        Inform(arrow ?
          traps.Drop(0) :
          null),
        // const METAthis = META.declare(META.this(this), "const", "this");
        arrow ?
          [] :
          [
            Build.Declare(
              "const",
              Sanitize("this"),
              traps.declare(
                "const",
                "this",
                Build.read("this")))],
        // BODY
        statements,
        // return traps.return(traps.primitive(void 0));
        [
          Build.Return(
            traps.return(
              traps.primitive(void 0)))])));

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
    Build.read(
      sanitize(identifier)),
    identifier);
  
  cut.discard = (identifier) => traps.discard(
    Build.discard(
      sanitize(identifier)),
    identifier);

  cut.primitive = (primitive) => traps.primitive(
    Build.primitive(primitive));

  cut.regexp = (pattern, flags) => traps.regexp(
    Build.regexp(pattern, flags));

  ///////////////
  // Consumers //
  ///////////////

  cut.write = (identifier, expression) => Build.write(
    sanitize(identifier),
    traps.write(expression, identifier));

  cut.Declare = (kind, identifier, expression) => Build.Declare(
    kind,
    sanitize(identifier),
    traps.declare(expression, identifier, kind));

  cut.Return = (expression) => Build.Return(
    traps.return(expression));

  cut.eval = (expression) => Build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => Build.With(
    traps.with(expression),
    statements);

  cut.Throw = (expression) => Build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => Build.While(
    traps.test(expression),
    statements);

  cut.If = (expression, statements1, statements2) => Build.If(
    traps.test(expression),
    statements1,
    statements2);

  cut.conditional = (expression1, expression2, expression3) => Build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  cut.Switch = (expression, cases) => concat.call(
    Inform(traps.Enter("switch")),
    [
      Build.Switch(
        expression,
        cases.map((array) => [
          traps.$test(array[0]),
          array[1]]))],
    Inform(traps.Leave("switch")));

  // TODO
  cut.Program = (strict, statements) => concat.call(

    strict);

  ////////////
  // Return //
  ////////////

  return cut;

};
