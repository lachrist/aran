
const pure = (expression) => ()

module.exports = (node, builtin, trap)
  
  const builtin = (expression) => (
    (
      expression.type === "MemberExpression" &&
      expression.computed &&
      expression.object.type === "Identifier" &&
      expression.object.name === "builtins" &&
      expression.property.type === "Literal" &&
      typeof expression.property.value === "string") ?
    expression.property.value :
    null);
  
  const builtin = (node) => {
    if (node.type === "MemberExpression" && )
  };

  function expression (node) {
    switch (node) {
      case: "CallExpression":
        const bname = builtin(node);
        if (bname === "Reflect.apply") {
          if ()
        }
      case: "MemberExpression":
        if (node.object.)
        break;
    }
  };




const builtin = (expression) => (
  (
    expression.type === "MemberExpression" &&
    expression.computed &&
    expression.object.type === "Identifier" &&
    expression.object.name === "builtins" &&
    expression.property.type === "LiteralExpression" &&
    typeof expression.property.value === "string") ?
  expression.property.value :
  null);

const isundefined = (expression) => (
  expression.type === "UnaryExpression" &&
  expression.operator = "void" &&
  expression.argument.type === "LiteralExpression")

const elements = (expression) => (
  expression.type === "CallExpression" &&
  builtin(expression.callee) === "Reflect.apply" &&
  expression.arguments.length === 3 &&
  builtin(expression.arguments[0]) === "Array.of" &&
  pure(expression.arguments[1]) &&

exports.apply = (expression, expressions) => (
  (
    builtin(expression) === "Reflect.apply" &&
    expressions.length === 3 &&
    isundefined(expressions[1]) &&
    
  
    

      
      if (expression2[0] === "primitive" && expression2[1] === void 0) {
        if (expression1[0] === "builtin" && expression1[1] === "Array.of") {
          return {
            type: "ArrayExpression",
            elements: ArrayLite.map(expressions, (expression) => {
              return Visit.expression(expression, namespace);
            })
          };
        }
        if (expression1[0] === "builtin" && expression1[1] === "Object.fromEntries" && expressions.length === 1) {
          const node = Visit.expression(expressions[0], namespace);
          if (node.type === "ArrayExpression" && ArrayLite.every(node.elements, (node) => node.type === "ArrayExpression" && node.elements.length === 2)) {
            return {
              type: "ObjectExpression",
              properties: ArrayLite.map(node.elements, (node) => ({
                type: "Property",
                kind: "init",
                computed: true,
                key: node.elements[0],
                value: node.elements[1]
              }))
            };
          }
        }
        if (expression1[0] === "builtin" && expression1[1] === "Reflect.get" && expressions.length === 2) {
          return {
            type: "MemberExpression",
            computed: true,
            object: Visit.expression(expressions[0], namespace),
            property: Visit.expression(expressions[1], namespace)
          };
        }
        let node = Visit.expression(expression1, namespace);
        if (node.type === "MemberExpression") {
          node = {
            type: "SequenceExpression",
            expressions: [{
              type: "Literal",
              value: null
            }, node]
          };
        }
        return {
          type: "CallExpression",
          callee: node,
          arguments: ArrayLite.map(expressions, (expression) => {
            return Visit.expression(expression, namespace)
          })
        };
      }
      const node = Visit.expression(expression1, namespace);
      if (expression2[0] === "read" && typeof expression2[1] === "number") {
        if (node.type === "MemberExpression" && node.object.type === "read" && node.object.name === Sanitize(expression2[1])) {
          return {
            type: "CallExpression",
            callee: node,
            arguments: ArrayLite.map(expressions, (expression) => {
              return Visit.expression(expression, namespace);
            })
          };
        }
      }
      return {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          computed: true,
          object: {
            type: "MemberExpression",
            computed: false,
            object: {
              type: "Identifier",
              name: namespace },
            property: {
              type: "Identifier",
              name: "builtins"}},
          property: {
            type: "Literal",
            value: "Reflect.apply"}},
        arguments: [node, Visit.expression(expression2), {
          type: "ArrayExpression",
          elements: ArrayLite.map(expressions, (expression) => {
            return Visit.expression(expression, namespace);
          })
        }]
      };
    };

