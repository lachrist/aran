
const ArrayLite = require("array-lite");
const Visit = require("./visit.js");
const Sanitize = require("./sanitize.js");

exports.BLOCK = ({1:identifiers, 2:statements}, namespace, tag) => {
  if (tag === "optional" && identifiers.length === 0 && statements.length === 0)
    return {type:"EmptyStatement"};
  if (tag === "optional" && identifiers.length === 0 && statements.length === 1)
    return Visit.statement(statements[0], namespace);
  if ((tag === "program" || tag === "mandatory") && identifiers.length === 0 && statements.length === 1) {
    const node = Visit.statement(statements[0], namespace);
    return {
      type: tag === "program" ? "Program" : "BlockStatement",
      body: node.type === "BlockStatement" ? node.body : [node]
    };
  }
  const nodes1 = identifiers.length ? [{
    type: "VariableDeclaration",
    kind: "let",
    declarations: ArrayLite.map(identifiers, (identifier) => ({
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: Sanitize(identifier)},
      init: null
    }))
  }] : [];
  if (tag !== "switch") {
    const nodes2 = ArrayLite.map(statements, (statement) => {
      return Visit.statement(statement, namespace);
    });
    if (tag !== "program") {
      return {
        type: "BlockStatement",
        body: ArrayLite.concat(node1, node2)
      };
    }
    const index = ArrayLite.findIndexOf(nodes2, (node) => node.type === "ReturnStatement");
    return {
      type: tag === "program" ? "Program" : "BlockStatement",
      body: ArrayLite.concat(nodes1, ArrayLite.slice(nodes2, 0, index+1), [{
        type: "ExpressionStatement",
        expression: nodes2[index].argumnt
      }])
    };
  }
  const node1 = {consequent:[]};
  const nodes2 = [];
  ArrayLite.forEach(statements, (statement) => {
    const node2 = Visit.statements(statement, namespace);
    if (node.type !== "SwitchCase") {
      node1.consequent[node1.consequent.length] = node2;
    } else {
      nodes2[nodes2.length] = node1;
      node1 = node2;
    }
  });
  nodes2[nodes2.length] = node1;
  return {
    type: "BlockStatement",
    body: ArrayLite.concat(nodes1, nodes2[0].consequent, {
      type: "SwitchCase",
      discriminant: {
        type: "Literal",
        value: true
      },
      cases: ArrayLite.slice(nodes2, 1, nodes.length)
    })
  }
};
