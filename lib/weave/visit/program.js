
const ArrayLite = require("array-lite");
const Visit = require("./index");

exports.Program = (node) => {
  completion(node.body, true);
  const statements = 

  let statements = ArrayLite.flatenMap(node.body, Visit.Statement);
  statements = ArrayLite.concat(
    ArrayLite.flaten(ARAN.hoisted),
    statements);
  ARAN.hoisted = temporary;
  statement = ArrayLite.concat(
    (
      ARAN.context.closure ?
      ARAN.build.Statement(
        ARAN.cut.$drop(
          ARAN.cut.apply(
            ARAN.cut.$closure(null, 0, "", [], statements),
            []))) :
      statements));
  return ARAN.cut.PROGRAM(
    (
      ARAN.context.scope ?
      ArrayLite.concat(
        ARAN.build.Declare(
          "let",
          "__aran_scope__",
          ARAN.build.object(
            ArrayLite.map(
              ARAN.context.scope,
              (identifier) => [
                identifier,
                ARAN.build.read(identifier)]))),
        ARAN.build.Declare(
          "const",
          "__aran_temporary__",
          ARAN.build.read(ARAN.namespace)),
        ARAN.build.$GlobalWith(
          ARAN.cut.$program(
            ARAN.build.read("__aran_scope__")),
          ArrayLite.concat(
            ARAN.build.Declare(
              "const",
              ARAN.namespace,
              ARAN.build.read("__aran_temporary__")),
            ArrayLite.flatenMap(
              ARAN.context.scope,
              (identifier) => ARAN.build.$Declare(
                "let",
                identifier,
                ARAN.build.get(
                  ARAN.build.read("__aran_scope__"),
                  ARAN.build.primitive(identifier)))),
            statements))) :
      statements));
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
