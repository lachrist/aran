class RuleError extends Error {}

/**
 * @type {(node: estree.MemberExpression) => string}
 */
const extracStatictKey = (node) => {
  if (node.computed) {
    if (node.property.type !== "Literal") {
      throw new RuleError("non-literal computed property");
    }
    if (typeof node.property.value !== "number") {
      throw new RuleError("non-numeric computed property");
    }
    return String(node.property.value);
  } else {
    if (node.property.type !== "Identifier") {
      throw new Error(`invalid non-computed property`);
    }
    return node.property.name;
  }
};

/**
 * @type {(node: estree.Node) => string}
 */
const extractRootName = (node) => {
  if (node.type === "Identifier") {
    return node.name;
  } else {
    throw new RuleError("non-identifier root");
  }
};

/**
 * @type {(node: estree.Node) => { root: estree.Node, tail: string }}
 */
const parseNode = (node) => {
  /** @type {string} */
  let tail = "";
  while (node.type === "MemberExpression") {
    if (node.optional) {
      throw new RuleError("optional chaining");
    }
    tail = `.${extracStatictKey(node)}${tail}`;
    node = node.object;
  }
  return {
    root: node,
    tail,
  };
};

/**
 * @type {(node: estree.Node) => { root: estree.Node, tail: string }}
 */
const parsePath = (node) => {
  if (node.type === "TemplateLiteral") {
    if (node.type !== "TemplateLiteral") {
      throw new RuleError("non-template literal path");
    }
    if (node.expressions.length !== 1) {
      throw new RuleError("expected a single expression");
    }
    if (node.quasis.length !== 2) {
      throw new Error("expressions and quasis length mismatch");
    }
    if (node.quasis[0].value.raw !== "") {
      throw new Error("first quasi is not empty");
    }
    return {
      root: node.expressions[0],
      tail: node.quasis[1].value.raw,
    };
  } else {
    return {
      root: node,
      tail: "",
    };
  }
};

/**
 * @type {import("eslint").Rule.RuleModule}
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "make sure node path is correct",
      recommended: false,
    },
  },
  schema: {
    type: "array",
    items: { type: "string" },
  },
  create: (context) => ({
    ObjectExpression: (node) => {
      if (
        node.properties.length === 2 &&
        node.properties[0].type === "Property" &&
        node.properties[0].key.type === "Identifier" &&
        (node.properties[0].key.name === "node" ||
          node.properties[0].key.name === "nodes") &&
        node.properties[1].type === "Property" &&
        node.properties[1].key.type === "Identifier" &&
        node.properties[1].key.name === "path" &&
        true
      ) {
        try {
          const path1 = parseNode(node.properties[0].value);
          const path2 = parsePath(node.properties[1].value);
          const root1 = extractRootName(path1.root);
          const root2 = extractRootName(path2.root);
          if (root1 !== "node") {
            throw new RuleError(`invalid node root: ${root1}`);
          }
          if (root2 !== "path") {
            throw new RuleError(`invalid path root: ${root2}`);
          }
          if (path1.tail !== path2.tail) {
            throw new RuleError(
              `tail mismatch ${path1.tail} !== ${path2.tail}`,
            );
          }
        } catch (error) {
          if (error instanceof RuleError) {
            context.report({
              node,
              message: error.message,
            });
          } else {
            throw error;
          }
        }
      }
    },
  }),
};
