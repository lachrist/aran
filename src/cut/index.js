
const ArrayLite = require("array-lite");
const Meta = require("../meta.js");
const Traps = require("./traps");
const Inform = require("./inform.js");
const Name = require("./name.js")
const ParseLabel = require("./parse-label.js");
const SanitizeIdentifier = require("./sanitize-identifier.js");
const ContainArguments = require("./contain-arguments.js");

const Reflect_apply = Reflect.apply;
const String_prototype_replace = String.prototype.replace;

module.exports = (pointcut) => {

  const traps = Traps(pointcut);

  const cut = {};

  /////////////////
  // Compilation //
  /////////////////

  cut.PROGRAM = (boolean, statements) => (
    statements = ArrayLite.concat(
      (
        ARAN.node.AranParent ?
        ARAN.build.Statement(
          traps.drop(
            traps.begin(
              ARAN.node.AranStrict,
              ARAN.node.AranParent,
              Meta.global()))) :
        ARAN.build.Declare(
          "const",
          "$$this",
          traps.declare(
            "const",
            "this",
            traps.begin(
              ARAN.node.AranStrict,
              ARAN.node.AranParent,
              Meta.global())))),
      ARAN.build.If(
        ARAN.build.unary(
          "!",
          ARAN.build.get(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("SAVE"))),
        ArrayLite.concat(
          ARAN.build.Statement(
            ARAN.build.set(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("SAVE"),
              ARAN.build.primitive(true))),
          ArrayLite.flatenMap(
            ["TypeError", "eval"],
            (string) => ARAN.build.Statement(
              Meta.save(
                string,
                traps.save(
                  string,
                  traps.read(
                    string,
                    ARAN.build.read(
                      SanitizeIdentifier(string))))))),
          ArrayLite.flatenMap(
            [
              ["Reflect", "apply"],
              ["Object", "defineProperty"],
              ["Object", "getPrototypeOf"],
              ["Object", "keys"],
              ["Symbol", "iterator"]],
            (strings) => ARAN.build.Statement(
              Meta.save(
                strings[0] + "." + strings[1],
                traps.save(
                  strings[0] + "." + strings[1],
                  traps.get(
                    traps.read(
                      strings[0],
                      ARAN.build.read(
                        SanitizeIdentifier(strings[0]))),
                    traps.primitive(
                      ARAN.build.primitive(strings[1])))))))),
        []),
      statements),
    ARAN.build.PROGRAM(
      boolean && (!ARAN.sandbox || ARAN.node.AranParent),
      ARAN.build.Try(
        ArrayLite.concat(
          (
            !ARAN.sandbox || ARAN.node.AranParent ?
            statements :
            Meta.Sandbox(
              boolean ?
              ARAN.build.Statement(
                ARAN.build.apply(
                  ARAN.build.function(
                    true,
                    [],
                    statements),
                  [])) :
              statements)),
          ARAN.build.Statement(
            ARAN.build.write(
              "completion",
              traps.success(
                Boolean(ARAN.node.AranStrict),
                Boolean(ARAN.node.AranParent),
                ARAN.build.read("completion"))))),
        ARAN.build.Throw(
          traps.failure(
            Boolean(ARAN.node.AranStrict),
            Boolean(ARAN.node.AranParent),
            ARAN.build.read("error"))),
        Inform(
          traps.end(
            Boolean(ARAN.node.AranStrict),
            Boolean(ARAN.node.AranParent))))));

  // // boolean1 := sandbox, boolean2 := strict
  // cut.$PROGRAM = (boolean1, boolean2, statements) => ARAN.build.PROGRAM(
  //   !boolean1 && boolean2,
  //   ARAN.build.Try(
  //     ArrayLite.concat(
  //       Inform(
  //         traps.begin(
  //           Boolean(ARAN.node.AranStrict),
  //           Boolean(ARAN.node.AranParent))),
  //       (
  //         boolean1 ?
  //         ARAN.build.Statement(
  //           ARAN.build.write(
  //             "completion",
  //             Meta.apply(
  //               ARAN.build.function(
  //                 false,
  //                 [],
  //                 ARAN.build.With(
  //                   Meta.proxy(
  //                     boolean2 ? "GLOBAL_STRICT_HANDLERS" : "GLOBAL_HANDLERS",
  //                     traps.with(
  //                       traps.load(
  //                         "global",
  //                         Meta.load("global")))),
  //                   ArrayLite.concat(
  //                     ARAN.build.Declare(
  //                       "let",
  //                       ARAN.namespace,
  //                       ARAN.build.read("this")),
  //                     ARAN.build.Declare(
  //                       "const",
  //                       "eval",
  //                       Meta.eval()),
  //                     ARAN.build.Declare(
  //                       "let",
  //                       "completion",
  //                       ARAN.build.primitive(void 0)),
  //                     Inform(
  //                       traps.block()),
  //                     (
  //                       boolean2 ?
  //                       ARAN.build.Statement(
  //                         ARAN.build.apply(
  //                           ARAN.build.function(true, [], statements),
  //                           [])) :
  //                       statements),
  //                     Inform(
  //                       traps.leave("block")),
  //                     Inform(
  //                       traps.leave("with")),
  //                     ARAN.build.Return(
  //                       ARAN.build.read("completion"))))),
  //               ARAN.build.read(ARAN.namespace),
  //               []))) :
  //         statements),
  //       ARAN.build.Statement(
  //         ARAN.build.write(
  //           "completion",
  //           traps.success(
  //             Boolean(ARAN.node.AranStrict),
  //             Boolean(ARAN.node.AranParent),
  //             ARAN.build.read("completion"))))),
  //     ARAN.build.Throw(
  //       traps.failure(
  //         Boolean(ARAN.node.AranStrict),
  //         Boolean(ARAN.node.AranParent),
  //         ARAN.build.read("error"))),
  //     Inform(
  //       traps.end(
  //         Boolean(ARAN.node.AranStrict),
  //         Boolean(ARAN.node.AranParent)))));

  cut.$completion = (expression) => ARAN.build.write(
    "completion",
    traps.completion(expression));

  cut.$load = (string) => traps.load(
    string,
    Meta.load(string));

  cut.$copy = traps.copy;

  cut.$drop = traps.drop;

  cut.$swap = traps.swap;

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

  cut.Label = (label, statements) => ARAN.build.Label(
    label,
    ArrayLite.concat(
      Inform(traps.label(ParseLabel.split(label) , ParseLabel.core(label))),
      statements,
      Inform(traps.leave("label"))));

  cut.Break = (label) => ArrayLite.concat(
    Inform(traps.break(ParseLabel.split(label) , ParseLabel.core(label))),
    ARAN.build.Break(label));

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
      ARAN.build.Statement(
        ARAN.build.write(
          "error",
          traps.catch(
            ARAN.build.read("error")))),
      statements2,
      Inform(traps.leave("catch"))),
    ArrayLite.concat(
      Inform(traps.finally()),
      statements3,
      Inform(traps.leave("finally"))));

  cut.closure = (boolean, statements) => traps.closure(
    Meta.define(
      Meta.define(
        ARAN.build.closure(
          boolean,
          ArrayLite.concat(
            ARAN.build.Statement(
              ARAN.build.write(
                "arrival",
                traps.arrival(
                  Boolean(ARAN.node.AranStrict),
                  ARAN.build.read("callee"),
                  ARAN.build.binary(
                    "!==",
                    ARAN.build.read("new.target"),
                    ARAN.build.primitive(void 0)),
                  ARAN.build.read("this"),
                  ARAN.build.read("arguments")))),
            statements)),
        "length",
        ARAN.build.primitive(
          (
            (
              ARAN.node.params.length &&
              ARAN.node.params[ARAN.node.params.length-1].type === "RestElement") ?
            ARAN.node.params.length - 1 :
            ARAN.node.params.length)),
        false, 
        false,
        true),
      "name",
      ARAN.build.primitive(Name(ARAN.node)),
      false,
      false,
      true));

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

  cut.write = (
    ARAN.sandbox ?
    (identifier, expression) => (
      ARAN.node.AranStrict ?
      ARAN.build.sequence(
        [
          Meta.declaration(false),
          ARAN.build.write(
            SanitizeIdentifier(identifier),
            traps.write(identifier, expression)),
          Meta.declaration(true),
          ARAN.build.read(SanitizeIdentifier(identifier))]) :
      ARAN.build.write(
        SanitizeIdentifier(identifier),
        traps.write(identifier, expression))) :
    (identifier, expression) => ARAN.build.write(
      SanitizeIdentifier(identifier),
      traps.write(identifier, expression)));

  cut.Declare = (kind, identifier, expression) => ARAN.build.Declare(
    kind,
    SanitizeIdentifier(identifier),
    traps.declare(kind, identifier, expression));

  cut.Return = (expression) => ARAN.build.Return(
    traps.return(expression));

  cut.eval = (expression) => ARAN.build.eval(
    traps.eval(expression));

  cut.With = (expression, statements) => ARAN.build.With(
    Meta.wproxy(
      traps.with(expression)),
    ArrayLite.concat(
      statements,
      Inform(traps.leave("with"))));

  cut.Throw = (expression) => ARAN.build.Throw(
    traps.throw(expression));

  cut.While = (expression, statements) => ArrayLite.concat(
    ARAN.build.While(
      traps.test(expression),
      statements));

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

  cut.Switch = (clauses) => ARAN.build.Switch(
    ArrayLite.map(
      clauses,
      (clause) => [
        traps.test(clause[0]),
        clause[1]]));

  ////////////
  // Return //
  ////////////

  return cut;

};
