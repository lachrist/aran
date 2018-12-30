
const ArrayLite = require("array-lite");
const Sanitize = require("../sanitize.js");
const Visit = require("./index.js");

exports.BLOCK = ({1:identifiers, 2:statements}, namespace, tag) => {
  const array1 = identifiers.length ? [{
    type: "VariableDeclaration",
    kind: "let",
    declarations: ArrayLite.map(identifiers, (identifier) => ({
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: Sanitize(identifier)
      },
      init: null
    }))
  }] : [];
  if (tag === "block") {
    return {
      type: "BlockStatement",
      body: ArrayLite.concat(array1, ArrayLite.map(statements, (statement) => {
        return Visit.statement(statement, namespace);
      }))
    };
  }
  if (tag === "program") {
    return {
      type: "Program",
      body: ArrayLite.concat([{
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: "use strict"
        }
      }], array1, ArrayLite.map(statements, (statement) => {
        return Visit.statement(statement, namespace);
      }))
    };
  }
  const array2 = [];
  const array3 = [];
  let index = 0;
  while (statements[index][0] !== "Case") {
    array2[array2.length] = Visit.statement(statements[index], namespace);
    index++;
  }
  while (index < statements.length) {
    if (statements[index][0] === "Case") {
      array3[array3.length] = Visit.statement(statements[index], namespace);
    } else {
      const array4 = array3[array3.length-1].consequent;
      array4[array4.length] = Visit.statement(statements[index], namespace);
    }
    index++;
  }
  return {
    type: "BlockStatement",
    body: ArrayLite.concat(array1, array2, [{
      type: "SwitchStatement",
      discriminant: {
        type: "Literal",
        value: true
      },
      cases: array3
    }])
  };
};
