
const ArrayLite = require("array-lite");
const Traps = require("./traps.js");

const fst = (pair) => pair[0];
const snd = (pair) => pair[1];

const sanitize = (identifier) => "$" + identifier;

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  /////////////
  // Helpers //
  /////////////

  const collect = ($expressions, booleans, identifier1, identifier2) => (
    (
      booleans &&
      ArrayLite.some(booleans, identity)) ?
    ARAN.build.call(
      ARAN.build.closure(
        ArrayLite.concat(
          [
            ARAN.build.Declare(
              "const",
              "array",
              ARAN.build.array([]))],
          ArrayLite.flatenMap(
            $expressions,
            ($expression, index) => (
              typeof $expression 
              booleans[index] ?
              [
                ARAN.build.Expression(
                  ARAN.build.write(
                    sanitize(identifier1),
                    traps.write(
                      traps.apply(
                        traps.apply(
                          traps.builtin(
                            ARAN.build.primitive("Reflect.get"),
                            ARAN.build.builtin("Reflect.get")),
                          traps.primitive(
                            ARAN.build.primitive(void 0)),
                          ARAN.build.array(
                            [
                              $expression,
                              traps.builtin(
                                ARAN.build.primitive("Reflect"),
                                ARAN.build.primitive("Symbol.iterator"))])),
                        traps.primitive(
                          ARAN.build.primitive(void 0)),
                        ARAN.build.array([])),
                      ARAN.build.primitive(identifier1)))),
                ARAN.build.While(
                  traps.test(
                    ARAN.build.sequence(
                      ARAN.build.write(
                        sanitize(identifier2),
                        traps.write(
                          traps.apply(
                            traps.apply(
                              traps.builtin(
                                ARAN.build.primitive("Reflect.get"),
                                ARAN.build.builtin("Reflect.get")),
                              traps.primitive(
                                ARAN.build.primitive(void 0)),
                              ARAN.build.array(
                                [
                                  traps.read(
                                    ARAN.build.primitive(identifier1),
                                    ARAN.build.read(
                                      sanitize(identifier1))),
                                  traps.primitive(
                                    ARAN.build.primitive("next"))])),
                            traps.read(
                              ARAN.build.primitive(identifier1),
                              ARAN.build.read(
                                sanitize(identifier1))),
                            ARAN.build.array([])),
                          ARAN.build.primitive(identifier2))),
                      traps.apply(
                        traps.builtin(
                          ARAN.build.primitive("AranReflect.unary"),
                          ARAN.build.builtin("AranReflect.unary")),
                        traps.primitive(
                          ARAN.build.primitive(void 0)),
                        ARAN.build.array(
                          [
                            traps.primitive(
                              ARAN.build.primitive("!")),     
                            traps.apply(
                              traps.builtin(
                                ARAN.build.primitive("Reflect.get"),
                                ARAN.build.builtin("Reflect.get")),
                              traps.primitive(
                                ARAN.build.primitive(void 0)),
                              ARAN.build.array(
                                [
                                  traps.read(
                                    ARAN.build.primitive(identifier2),
                                    ARAN.build.read(
                                      sanitize(identifier2))),
                                  traps.primitive(
                                    ARAN.build.primitive("done"))]))])))),
                  ARAN.build.Expression(
                    ARAN.build.set(
                      ARAN.build.read("array"),
                      ARAN.build.get(
                        ARAN.build.read("array"),
                        ARAN.build.primitive("length")),
                      traps.apply(
                        traps.builtin(
                          ARAN.build.primitive("Reflect.get"),
                          ARAN.build.builtin("Reflect.get")),
                        traps.primitive(
                          ARAN.build.primitive(void 0)),
                        ARAN.build.array(
                          [
                            traps.read(
                              ARAN.build.primitive(identifier2),
                              ARAN.build.read(
                                sanitize(identifier2))),
                            traps.primitive(
                              ARAN.build.primitive("value"))])))))] :
              [
                ARAN.build.Expression(
                  ARAN.build.set(
                    ARAN.build.read("array"),
                    ARAN.build.get(
                      ARAN.build.read("array"),
                      ARAN.buikd.primitive("length")),
                    $expression))])),
          [
            ARAN.build.Return(
              ARAN.build.read("array"))]))) :
  ARAN.build.array($expressions));


  // cut.function = (identifier, statements) => [
  //   [],
  //   ARAN.traps.closure(
  //     ArrayLite.concat(
  //       [
  //         ARAN.build.Declare(
  //           "const",
  //           "arrival",
  //           traps.arrival(
  //             ARAN.build.read("callee"),
  //             ARAN.build.read("new.target"),
  //             ARAN.build.read("this"),
  //             ARAN.build.read("arguments"))),
  //         (
  //           identifier ?
  //           ARAN.build.Declare(
  //             "var",
  //             traps.declare(
  //               ARAN.build.get(
  //                 ARAN.build.read("arrival"),
  //                 ARAN.build.primitive(0)),
  //               ARAN.build.primitive("var"),
  //               ARAN.build.primitive(identifier))) :
  //           ARAN.build.Statement(
  //             traps.drop())),
  //         ARAN.build.Declare(
  //           "var",
  //           sanitize("new.target"),
  //           traps.declare(
  //             ARAN.build.get(
  //               ARAN.build.read("arrival"),
  //               ARAN.build.primitive(1)),
  //             ARAN.build.primitive("var"),
  //             ARAN.build.primitive("new.target"))),
  //         ARAN.build.Declare(
  //           "var",
  //           sanitize("this"),
  //           traps.declare(
  //             ARAN.build.get(
  //               ARAN.build.read("arrival"),
  //               ARAN.build.primitive(2)),
  //             ARAN.build.primitive("var"),
  //             ARAN.build.primitive("this"))),
  //         ARAN.build.Declare(
  //           "var",
  //           sanitize("arguments"),
  //           traps.declare(
  //             ARAN.build.get(
  //               ARAN.build.read("arrival"),
  //               ARAN.build.primitive(3)),
  //             ARAN.build.primitive("var"),
  //             ARAN.build.primmitive("arguments")))],
  //       statements))];

  // cut.arrow = (identifier, statements) => [
  //   [],
  //   ARAN.traps.closure(
  //     ArrayLite.concat(
  //       [
  //         ARAN.build.Declare(
  //           "const",
  //           "arrival",
  //           traps.arrival(
  //             ARAN.build.read("callee"),
  //             ARAN.build.read("new.target"),
  //             ARAN.build.read("this"),
  //             ARAN.build.read("arguments"))),
  //         ARAN.build.Statement(
  //           traps.drop()),
  //         ARAN.build.If(
  //           traps.test(
  //             ARAN.build.get(
  //               ARAN.build.read("arrival"),
  //               ARAN.build.primitive(1))),
  //           null,
  //           [
  //             ARAN.build.Throw(
  //               traps.throw(
  //                 traps.construct(
  //                   traps.builtin(
  //                     ARAN.build.builtin("TypeError"),
  //                     ARAN.build.primitive("TypeError")),
  //                   ARAN.build.array(
  //                     [
  //                       traps.primitive(
  //                         ARAN.build.primitive("Not a constructor"))]))))],
  //           null,
  //           []),
  //         ARAN.build.Statement(
  //           traps.drop()),
  //         ARAN.build.Declare(
  //           "var",
  //           sanitize(identifier),
  //           traps.declare(
  //             ARAN.build.get(
  //               ARAN.build.read("arrival"),
  //               ARAN.build.primitive(3)),
  //             ARAN.build.primitive("var"),
  //             ARAN.build.primitive(token)))]),
  //     statements)];

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


  /////////////
  // Special //
  /////////////

  cut.BLOCK = (identifiers, statements) => (tag, label) => ArrayLite.concat(
      ArrayLite.map(
        identifiers,
        (identifier) => ARAN.build.Declare(
          "let",
          sanitize(identifier),
          ARAN.build.primitive(void 0))),
      ARAN.build.Expression(
        traps.enter(
          ARAN.build.primitive(tag),
          ARAN.build.primitive(label),
          ARAN.build.array(
            ArrayLite.map(identifiers, ARAN.build.primitive)))),
      statements,
      ARAN.build.Expression(
        traps.leave()));

  ///////////////
  // Statement //
  ///////////////

  cut.Write = (identifier, expression) => ARAN.build.Expression(
    ARAN.build.write(
      sanitize(identifier),
      traps.write(
        expression,
        ARAN.build.primitive(identifier))));

  cut.Expression = (expression) => ArrayLite.concat(
    ARAN.build.Expression(expression),
    ARAN.build.Expression(
      traps.drop()));

  cut.Break = (label) => ArrayLite.concat(
    ARAN.build.Expression(
      traps.break(
        ARAN.build.primitive(label))),
    ARAN.build.Break(label));

  cut.Continue = (label) => ArrayLite.concat(
    ARAN.build.Expression(
      traps.continue(
        ARAN.build.primitive(label))),
    ARAN.build.Continue(label));

  cut.Debugger = () => ArrayLite.concat(
    ARAN.build.Expression(
      traps.debugger()),
    ARAN.build.Debugger());

  cut.Return = (expression) => ARAN.build.Return(
    traps.return(expression));

  // TODO
  cut.ARGUMENTS = (expressions) => ARAN.build.array(expressions);
  cut.SPREAD_ARGUMENTS = (expression, statements) => ARAN.build;

  cut.Throw = (expression) => ARAN.build.Throw(
    traps.throw(expression));

  cut.Block = (label, block) => ARAN.build.Block(
    label,
    block("block", label));

  cut.While = (label, expression, block) => ARAN.build.While(
    label,
    traps.test(expression),
    block("loop", label)),

  cut.If = (expression, block1, block2) => ARAN.build.If(
    traps.test(expression),
    block1("then", null),
    block2("else", null));

  cut.Try = (block1, block2, block3) => ARAN.build.Try(
    block1("try", null),
    block2("catch", null),
    block3("finally", null));

  cut.Switch = (label, identifiers, expression, clauses) => ArrayLite.concat(
    ARAN.build.Switch(
      label,
      expression,
      ArrayLite.concat(
        [
          [
            null,
            ArrayLite.concat(
              ArrayLite.flatMap(
                identifiers,
                (identifier) => ARAN.build.Declare(
                  "let",
                  sanitize(identifier),
                  ARAN.build.primitive(void 0))),
              ARAN.build.Expression(
                traps.enter(
                  ARAN.build.primitive(tag),
                  ARAN.build.primitive(label),
                  ARAN.build.array(
                    ArrayLite.map(identifiers, ARAN.build.primitive)))))]],
        ArrayLite.map(
          clauses,
          (clause) => [
            traps.test(clause[0]),
            clause[1]]))),
    ARAN.build.Expression(
      traps.leave()));

  ////////////////
  // Expression //
  ////////////////

  // error, callee, this, new.target, arguments //
  cut.input = (name) => traps.input(
    ARAN.cut.primitive(name),
    ARAN.build.read(name));

  cut.closure = (block) => traps.closure(
    ARAN.build.closure(
      ArrayLite.concat(
        ARAN.build.Expression(
          traps.arrival(
            ARAN.build.read("callee"),
            ARAN.build.read("new.target"),
            ARAN.build.read("this"),
            ARAN.build.read("arguments")))
        block("closure", null))));

  cut.sequence = (expression1, expression2) => ARAN.build.sequence(
    ARAN.build.sequence(
      expression1
      traps.drop()),
    expression2);

  cut.apply = (expression1, expression2, ARGUMENTS) => traps.apply(
    expression1,
    expression2,
    ARGUMENTS);

  cut.construct = (expression, expressions, ARGUMENTS) => traps.construct(
    expression,
    ARGUMENTS);

  cut.builtin = (string) => traps.builtin(
    ARAN.build.builtin(string)
    ARAN.build.primitive(string));

  cut.primitive = (primitive) => traps.primitive(
    ARAN.build.primitive(primitive));

  cut.read = (identifier) => traps.read(
    ARAN.build.read(
      sanitize(identifier)),
    ARAN.build.primitive(identifier));

  cut.write = (identifier, expression1, expression2) => ARAN.build.sequence(
    ARAN.build.write(
      sanitize(identifier),
      traps.write(
        expression1,
        ARAN.build.primitive(identifier))),
    expression2);

  cut.eval = (expression) => ARAN.build.eval(
    traps.eval(expression));

  cut.conditional = (expression1, expression2, expression3) => ARAN.build.conditional(
    traps.test(expression1),
    expression2,
    expression3);

  ////////////
  // Return //
  ////////////

  return cut;

};
