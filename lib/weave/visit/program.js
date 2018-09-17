
const ArrayLite = require("array-lite");
const Visit = require("./index");
const Static = require("../../static.js");

exports.Program = (node) => {
  completion(node.body, true);
  const temporary = ARAN.hoisted;
  ARAN.hoisted = [];
  const statements1 = ArrayLite.flatenMap(node.body, Visit.Statement);
  const statements2 = ArrayLite.flaten(ARAN.hoisted);
  ARAN.hoisted = temporary;
  return ARAN.cut.PROGRAM(
    node.AranStrict,
    ArrayLite.concat(
      ARAN.build.Statement(
        ARAN.cut.$completion(
          ARAN.cut.primitive(void 0))),
      statements2,
      statements1));
};

const completion = ((() => {
  const visit = (node, last) => visitors[node.type](node, last);
  const chain = (nodes, last) => {
    let index = nodes.length;
    while (index--)
      last = visit(nodes[index], last);
    return last;
  }
  const loop = (node, last) => {
    if (visit(node.body, last) || last)
      node.AranCompletion = true;
    return false;
  };
  const visitors = {};
  visitors.EmptyStatement = (node, last) => last;
  visitors.BlockStatement = (node, last) => chain(node.body, last);
  visitors.ExpressionStatement = (node, last) => {
    if (last)
      node.AranCompletion = true;
    return false;
  };
  visitors.IfStatement = (node, last) => {
    const last1 = visit(node.consequent, last);
    const last2 = node.alternate && visit(node.alternate, last);
    if (last1 || last2)
      node.AranCompletion = true;
    return false;
  };
  visitors.LabeledStatement = (node, last) => chain(node.body, last);
  visitors.BreakStatement = (node, last) => true;
  visitors.ContinueStatement = (node, last) => true; 
  visitors.WithStatement = (node, last) => {
    if (visit(node.body, last))
      node.AranCompletion = true;
    return false;
  };
  visitors.SwitchStatement = (node, last) => {
    if (ArrayLite.some(node.cases, (clause) => chain(clause.consequent, last)))
      node.AranCompletion = true;
    return false;
  };
  visitors.ReturnStatement = (node, last) => { throw new Error("Invalid return statement") };
  visitors.ThrowStatement = (node, last) => true;
  visitors.TryStatement = (node, last) => {
    const last1 = chain(node.block.body, last);
    const last2 = chain(node.handler.body.body, last);
    if (last1 || last2)
      node.AranCompletion = true;
    return false;
  };
  visitors.WhileStatement = loop;
  visitors.DoWhileStatement = (node, last) => {
    if (visit(node.body, last))
      node.AranCompletion = true;
    return false;
  };
  visitors.ForStatement = loop;
  visitors.ForInStatement = loop;
  visitors.ForOfStatement = loop;
  visitors.DebuggerStatement = (node, last) => last;
  visitors.FunctionDeclaration = (ndoe, last) => last;
  visitors.VariableDeclaration = (node, last) => last;
  return chain;
}) ());






  cut.PROGRAM = (statements) => (
    statements = (
      ARAN.node.AranStrict ?
      ArrayLite.concat(
        ARAN.build.Statement(
          traps.apply(
            traps.closure(
              ARAN.build.closure(
                true,
                ArrayLite.concat(
                  ARAN.build.Statements(
                    traps.arrival(
                      true,
                      ARAN.build.object([]),
                      ARAN.build.array([]))),
                  statements,
                  ARAN.build.Statement(
                    ARAN.build.Return(
                      traps.return(
                        traps.primitive(void 0))))))),
            [])),
        ARAN.build.Statement(
          traps.drop())) :
      statements),
    statements = ARAN.build.Try(
      ArrayLite.concat(
        statements,
        ARAN.build.Statement(
          ARAN.build.write(
            "completion",
            traps.success(
              ARAN.build.read("completion"))))),
      ARAN.build.Throw(
        traps.failure(
          ARAN.build.read("error"))),
      ARAN.build.Statement(
        traps.end())),
    (
      ARAN.scope ?
      ArrayLite.concat(
        ARAN.build.Statement(
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive("__SCOPE__"),
          ARAN.build.object(
            ArrayLite.map(
              ARAN.scope,
              (identifier) => [
                identifier,
                ARAN.build.read(identifier)]))),
        ARAN.build.With(
          ARAN.build)
      ARAN.build.Declare()

              })
            [
              ""]))
        )
      ArrayLite.concat(
        ARAN.build.Statements(
          traps.begin(
            Util.strict(ARAN.node.body),
            ARAN.build.primitive(null),
            ARAN.build.get(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("__GLOBAL__")))
        statements))

    statements = ArrayLite.concat(
      ARAN.build.If(
        ARAN.build.binary(
          "in",
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive("__SAVE__")),
        [],
        ArrayLite.concat(
          ARAN.build.Statement(
            ARAN.build.set(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("__SAVE__"),
              ARAN.build.primitive(null))),
          ArrayLite.flatenMap(
            ["TypeError", "eval"],
            (string) => ARAN.build.Statement(
              ARAN.build.set(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("__SAVE_"+string+"__")),
                traps.save(
                  string,
                  traps.read(
                    string,
                    ARAN.build.read(
                      SanitizeIdentifier(string)))))),
          ArrayLite.flatenMap(
            [
              ["Reflect", "apply"],
              ["Object", "defineProperty"],
              ["Object", "getPrototypeOf"],
              ["Object", "keys"],
              ["Symbol", "iterator"]],
            (strings) => ARAN.build.Statement(
              ARAN.build.set(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("__SAVE_"+strings[0]+"_"+strings[1]+"__"),
                traps.save(
                  strings[0] + "." + strings[1],
                  traps.get(
                    traps.read(
                      strings[0],
                      ARAN.build.read(
                        SanitizeIdentifier(strings[0]))),
                    traps.primitive(
                      ARAN.build.primitive(strings[1]))))))))),
      statements),



    (
      ARAN.node.scope ?
      :
      Array



    statements = ArrayLite.concat(
      (
        ARAN.build.Declare(
          "let",
          "temporary",
          ARAN.scope ?)


        ARAN.scope ?
        ArrayLite.flatenMap(
          ARAN.scope,
          (string) => ()
          (string) => (
            (
              SanitizeIdentifier(string) !== string &&
              !ArrayLite.includes(ARAN.scope, SanitizeIdentifier(string))) ?
            ARAN.build.Declare(
              "let",
              SanitizeIdentifier(string),
              ARAN.build.get(
                ARAN.build.read("scope"),
                ARAN.build.primitive(string))) :
            ARAN.build.Statement(
              ARAN.build.write(
                string,
                ARAN.build.get(
                  ARAN.build.read("scope"),
                  ARAN.build.primitive(string)))))) :
        []),


    statements = (
      boolean && ARAN.sandbox ?
      ARAN.build.Statement(
        ARAN.build.apply(
          ARAN.build.function(
            true,
            [],
            statements),
          [])) :
      statements),
    statements = (
      ARAN.sandbox && ARAN.scope ?
      ArrayLite.concat(
        ARAN.build.Statement(
          ARAN.build.set(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("SCOPE"),
            ARAN.build.read("scope"))),
        ARAN.build.Statement(
          ARAN.build.write(
            "completion",
              Meta.apply(
                ARAN.build.function(
                  false,
                  [],
                  ARAN.build.With(
                    ARAN.build.construct(
                      ARAN.build.get(
                        ARAN.build.read(ARAN.namespace),
                        ARAN.build.primitive("PROXY")),
                      [
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive("SANDBOX")),
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive(ARAN.node.AranStrict ? "STRICT_SANDBOX_HANDLERS" : "SANDBOX_HANDLERS"))]),
                    ArrayLite.concat(
                      ARAN.build.Declare(
                        "const",
                        ARAN.namespace,
                        ARAN.build.read("this")),
                      ARAN.build.Declare(
                        "const",
                        "scope",
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive("SCOPE"))),
                      ARAN.build.Declare(
                        "const",
                        "eval",
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive("EVAL"))),
                      ARAN.build.Declare(
                        "let",
                        "completion",
                        ARAN.build.primitive(void 0)),
                      statements,
                      ARAN.build.Return(
                        ARAN.build.read("completion"))))),
                ARAN.build.read(ARAN.namespace),
                [])))) :
      statements),

    statements


    ARAN.build.PROGRAM(
      ARAN.scope ?
      :
      ARAN.build.Try(
        ArrayLite.concat(
          ARAN.build.Declare(
            "let",
            "completion",
            ARAN.namespace+"_COMPLETION",
            ARAN.build.primitive(void 0)),
          statements,
          ARAN.statement(
            traps.success(
              ARAN.build.read("ARAN_COMPLETION")))
          ARAN.build.Statement(
            ARAN.build.read("ARAN_COMPLETE"))))

    ARAN.scope ?
    :


    ARAN.build.PROGRAM(
      ArrayLite.concat(
        ARAN.build.Declare(
          "let",
          "ARAN_TEMPORARY_1",

          ARAN.build.primitive(void 0)),
        ARAN.build.Declare(
          "let",
          "ARAN_TEMPORARY_2",
          ARAN.build.primitive(void 0)))),


    ARAN.build.PROGRAM(
      boolean && !ARAN.sandbox,
      ArrayLite.concat(
        ARAN.build.Declare(
          "let",
          "scope",
          ARAN.build.primitive(void 0)),
)));
