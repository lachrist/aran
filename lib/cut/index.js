
const ArrayLite = require("array-lite");
const Traps = require("./traps.js");

const fst = (pair) => pair[0];
const snd = (pair) => pair[1];

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  ////////////////
  // Expression //
  ////////////////

  cut.sequence = (expressions) => [
    ArrayLite.flatenMap(expressions, fst),
    (
      expressions.length ?
      ArrayLite.concat(
        ArrayLite.flatenMap(
          ArrayLite.slice(expressions, 0, expressions.length-1),
          (expression) => [
            expression[1],
            traps.drop()]),
        [
          expressions[expressions.length-1][1]]) : 
      traps.primitive(
        ARAN.build.primitive(void 0)))];

  cut.declare = (kind, identifier, expression1, expression2) => [
    ArrayLite.concat(
      [
        [kind, token]],
      expression1[0],
      expression2[0]),
    ARAN.build.sequence(
      [
        ARAN.build.write(
          sanitize(identifier),
          traps.write(
            expression1[1],
            ARAN.build.primitive(token))),
        expression2[1]])];

  cut.apply = (expression1, expression2, expressions, booleans) => [
    ArrayLite.concat(
      expression1[0],
      expression2[0],
      ArrayLite.flatenMap(expressions, fst)),
    traps.apply(
      expression1[1],
      expression2[1],
      collect(
        ArrayLite.map(expressions, snd),
        booleans))];

  cut.construct = (expression, expressions, booleans) => [
    ArrayLite.concat(
      expression[1],
      ArrayLite.flatenMap(expressions, fst)),
    traps.construct(
      expression[1],
      collect(
        ArrayLite.map(expressions, snd),
        booleans))];

  cut.builtin = (string) => [
    [],
    traps.builtin(
      ARAN.build.builtin(string)
      ARAN.build.primitive(string))];

  cut.primitive = (primitive) => [
    [],
    traps.primitive(
      ARAN.build.primitive(primitive))];

  cut.read = (identifier) => [
    [],
    traps.read(
      ARAN.build.read(
        sanitize(identifier)),
      ARAN.build.primitive(identifier))];

  cut.write = (identifier, expression1, expression2) => [
    ArrayLite.concat(
      expression1[0],
      expression2[0]),
    ARAN.build.sequence(
      [
        ARAN.build.write(
          sanitize(identifier),
          traps.write(
            expression1[1],
            ARAN.build.primitive(identifier))),
        expression2[1]])];

  cut.eval = (expression) => [
    expression[0],
    ARAN.build.eval(
      [
        traps.eval(expression[1])])];

  cut.conditional = (expression1, expression2, expression3) => [
    ArrayLite.concat(
      expression1[0],
      expression2[0],
      expression3[0]),  
    ARAN.build.conditional(
      traps.test(expression1[1]),
      expression2[1],
      expression3[1])];

  cut.function = (name, statements) => [
    [],
    ARAN.traps.closure(
      ArrayLite.concat(
        ArrayLite.map(
          ArrayLite.filter(
            ArrayLite.map(statements, fst),
            (identifier) => typeof identifier === "number"),
          (token) => ARAN.build.Declare(
            "let",
            "aran"+token,
            ARAN.build.primitive(void 0))),
        [
          ARAN.build.Declare(
            "const",
            "arrival",
            traps.arrival(
              ARAN.build.read("callee"),
              ARAN.build.read("new.target"),
              ARAN.build.read("this"),
              ARAN.build.read("arguments"),
              ARAN.build.array(
                ArrayLite.map(
                  ArrayLite.concat(
                    name ? [name] : [],
                    ["new.target", "this", "arguments"],
                    ArrayLite.map(statements1, fst)),
                  ARAN.build.primitive)))),
          (
            name ?
            ARAN.build.Declare(
              "var",
              sanitize(name),
              traps.write(
                ARAN.build.get(
                  ARAN.build.read("arrival"),
                  ARAN.build.primitive(0)),
                ARAN.build.primitive(name))) :
            ARAN.build.Statement(
              traps.drop())),
          ARAN.build.Declare(
            "const",
            sanitize("new.target"),
            traps.write(
              ARAN.build.get(
                ARAN.build.read("arrival"),
                ARAN.build.primitive(1)),
              "new.target")),
          ARAN.build.Declare(
            "const",
            sanitize("this"),
            traps.write(
              ARAN.build.get(
                ARAN.build.read("arrival"),
                ARAN.build.primitive(2)),
              "this")),
          ARAN.build.Declare(
            "var",
            sanitize("arguments"),
            traps.write(
              ARAN.build.get(
                ARAN.build.read("arrival"),
                ARAN.build.primitive(3)),
              "arguments"))],
        ArrayLite.map(statements, snd)))];

  cut.arrow = (token, statements) => [
    [],
    ARAN.traps.closure(
      ArrayLite.concat(
        ArrayLite.map(
          ArrayLite.filter(
            ArrayLite.map(statements, fst),
            (identifier) => typeof identifier === "number"),
          (token) => ARAN.build.Declare(
            "let",
            "aran"+token,
            ARAN.build.primitive(void 0))),
        [
          ARAN.build.Declare(
            "const",
            "arrival",
            traps.arrival(
              ARAN.build.read("callee"),
              ARAN.build.read("new.target"),
              ARAN.build.read("this"),
              ARAN.build.read("arguments"),
              ARAN.build.array(
                ArrayLite.map(
                  ArrayLite.map(statements1, fst),
                  ARAN.build.primitive)))),
          ARAN.build.Statement(
            traps.drop()),
          ARAN.build.If(
              traps.test(
                ARAN.build.get(
                  ARAN.build.read("arrival"),
                  ARAN.build.primitive(1))),
              ARAN.build.Throw(
                traps.throw(
                  traps.construct(
                    traps.builtin(
                      ARAN.build.builtin("TypeError"),
                      ARAN.build.primitive("TypeError")),
                    ARAN.build.array(
                      [
                        traps.primitive(
                          ARAN.build.primitive("Not a constructor"))])))),
              null),
          ARAN.build.Statement(
            traps.drop()),
          ARAN.build.Statement(
            ARAN.build.write(
              sanitize(token),
              traps.write(
                ARAN.build.get(
                  ARAN.build.read("arrival"),
                  ARAN.build.primitive(3)),
                ARAN.build.primitive(token))))],
        ArrayLite.map(statements, snd)))];

  ///////////////
  // Statement //
  ///////////////

  const bundle = (statements, closure) => ARAN.build.Block(
    ArrayLite.concat(
      ArrayLite.flatenMap(
        statements,
        (statement) => ArrayLite.map(
          ArrayLite.filter(statement[0], isnumber),
          (token) => ARAN.build.Declare(
            "let",
            "aran"+token,
            ARAN.build.primitive(void 0)))),
      [
        ARAN.build.Statement(
          closure(
            ARAN.build.array(
              ArrayLite.flatenMap(
                statements,
                (statement) => ArrayLite.map(
                  statement[0],
                  ARAN.build.primitive)))))],
      ArrayLite.map(statements, snd),
      [
        ARAN.build.Statement(
          traps.leave())]));

  const labelize = (label, $statement) => (
    label ?
    ARAN.build.label(label, $statement) :
    $statement);

  cut.Statement = (expression) => [
    [
      expression[0],
      ARAN.build.Statement(expression)],
    [
      [],
      ARAN.build.Statement(
        traps.drop())]];

  cut.Declare = (kind, identifier, expression) => (
    kind === "function" ?
    [
      ArrayLite.concat(
        expression[0],
        [
          ["function", identifier, expression]]),
      ARAN.build.Empty()] :
    [
      ArrayLite.concat(
        expression[0],
        [
          [kind, identifier]]),
      ARAN.build.Declare(
        kind,
        identifier,
        traps.write(
          expression[1]
          sanitize(identifier)))]);

  cut.Break = (label) => [
    [
      [],
      ARAN.build.Statement(
        traps.break(
          ARAN.build.primitive(label)))],
    [
      [],
      ARAN.build.Break(label)]];

  cut.Continue = (label) => [
    [
      [],
      ARAN.build.Statement(
        traps.continue(
          ARAN.build.primitive(label)))],
    [
      [],
      ARAN.build.Continue(label)]];

  cut.Debugger = () => [
    [
      [],
      ARAN.build.Debugger()]];

  cut.Return = (expression) => [
    [
      expression[0],
      ARAN.build.Return(
        traps.return(expression[1]))]];

  cut.Throw = (expression) => [
    [
      expression[0],
      ARAN.build.Throw(
        traps.throw(expression))]];

  cut.While = (label, expression, statements) => [
    [
      expression[0],
      labelize(
        label, 
        ARAN.build.While(
          traps.test(expression[1]),
          bundle(
            statements,
            (identifiers) => traps.loop(
              ARAN.build.primitive(label),
              ARAN.build.array(
                ArrayLite.map(identifiers, ARAN.build.primitive))))))]];

  cut.Block = (label, statements) => [
    [
      [],
      labelize(
        label,
        bundle(
          statements,
          ($expression) => traps.block(
            ARAN.build.primitive(label),
            $expression)))]];

  cut.Label = (label, statements) => [
    [
      [],
      ARAN.build.Label(
        label,
        bundle(
          statement,
          ($expression) => traps.block(
            ARAN.build.primitive(label),
            $expression)))]];

  cut.If = (expression, statements1, statements2) => [
    [
      expression[0],
      ARAN.build.If(
        traps.test(expression[1]),
        bundle(statements1, traps.block),
        bundle(statements2, traps.block))]];

  cut.Switch = (identifiers, expressions, statementss) => ArrayLite.concat(
    ARAN.build.Statement(
      ARAN.test.enter(
        ARAN.build.primitive("switch")),
      ARAN.build.array(
        ArrayLite.map(identifiers, ARAN.build.primitive))),
    ARAN.build.Switch(
      ArrayLite.map(expressions, traps.test),
      statementss),
    ARAN.build.Statement(
      ARAN.test.leave()));

  cut.Try = (statements1, token, statements2, statements3) => [
    [],
    [
      ARAN.build.Try(
        bundle(statements1, traps.try),
        bundle(
          statements2,
          ($expression) => ARAN.build.write(
            "aran"+token,
            traps.catch(
              ARAN.build.read("error"),
              $expression))),
        bundle(statements3, traps.finally))]];

  // TODO
  // cut.PROGRAM = (statements) => ARAN.build.PROGRAM(
  //   ARAN.build.$Try(
  //     ArrayLite.concat(
  //       statements,
  //       ARAN.build.Statement(
  //         ARAN.build.completion(
  //           traps.success(
  //             ARAN.build.read("completion"))))),
  //     ARAN.build.Throw(
  //       traps.failure(
  //         ARAN.build.read("error"))),
  //     ARAN.build.Statement(
  //       traps.end())));

  // TODO
  // cut.Sandbox = (statements) => ArrayLite.concat(
  //   ARAN.build.Declare(
  //     "const",
  //     "scope",
  //     ARAN.build.object(
  //       ArrayLite.map(
  //         ARAN.context.identifiers,
  //         (identifier) => [
  //           identifier,
  //           ARAN.build.read(identifier)]))),
  //   ARAN.build.Sandbox(
  //     traps.sandbox(
  //       ARAN.build.read("scope"),
  //       ARAN.build.builtin("global")),
  //     ArrayLite.flatenMap(
  //       ARAN.context.identifiers,
  //       (identifier) => ARAN.build.$Declare(
  //         "var",
  //         identifier,
  //         ARAN.build.get(
  //           ARAN.build.read("scope"),
  //           ARAN.build.primitive(identifier))))));

  return cut;

};
