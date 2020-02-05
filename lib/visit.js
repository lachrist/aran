
const ArrayLite = require("array-lite");

const closures = {__proto__: null};

ArrayLite.forEach(["identifier", "label", "primitive"], (type) => {
  closures[type] = (node, depth, check, visitors) => {
    if (check) {
      if (!Syntax[type](node)) {
        throw new Error("Invalide " + type + " instance, got: " + print(node, 1));
      }
    }
    return node;
  };
});

ArrayLite.forEach(["unary-operator", "binary-operator", "builtin-name"], (type) => {
  closures[type] = (node, depth, check, visitors) => {
    if (check) {
      if (!ArrayLite.includes(Syntax[type], node)) {
        throw new Error("Unrecognized " + type + " instance, got: " + print(node, 1));
      }
    }
    return node;
  }
});

ArrayLite.forEach(["statement", "expression"], (type) => {
  closures[type] = (node, depth, check, visitors) => {
    if (check) {
      if (!Array_isArray(node)) {
        throw new Error(type + " instances must be arrays, got: " + print(node, 1));
      }
      if (node.length === 0) {
        throw new Error(type + " instances cannot be empty arrays");
      }
      if (typeof node[0] !== "string") {
        throw new Error(type + " constructor must be a string, got: " + print(node[0], 1) + " from: " + print(node, 1));
      }
      if (!(node[0] in Syntax[type])) {
        throw new Error("Unrecognized " + type + " constructor, got: " + print(node[0], 1) + " from: " + print(node, 1));
      }
    }
    const constructor = node[0];
    const fields = ArrayLite.slice(node, 1, node.length);
    const length = Syntax[type][node[0]].length;
    if ("_" + constructor + "_" in visitors) {
      if (length === 0) {
        return visitors["_" + constructor + "_"](node);
      }
      if (length === 1) {
        return visitors["_" + constructor + "_"](fields[0], node);
      }
      if (length === 2) {
        return visitors["_" + constructor + "_"](fields[0], fields[1], node);
      }
      if (length === 3) {
        return visitors["_" + constructor + "_"](fields[0], fields[1], fields[2], node);
      }
      throw new Error("Unexpected type fields length (this should never happen)");
    }
    const array = dispatch(Syntax[type][constructor], fields, depth, check, visitors);
    if (constructor in visitors) {
      if (length === 0) {
        return visitors[constructor](node);
      }
      if (length === 1) {
        return visitors[constructor](array[0], node);
      }
      if (length === 2) {
        return visitors[constructor](array[0], array[1], node);
      }
      if (length === 3) {
        return visitors[constructor](array[0], array[1], array[2], node);
      }
      throw new Error("Unexpected type fields length (this should never happen)");
    }
    return array;
  };
});

ArrayLite.forEach([
  "program",
  "eval",
  "closure",
  "block",
  "then",
  "else",
  "while",
  "try",
  "catch",
  "finally"
], (tag) => {
  closures["block-" + tag] = (node, depth, check, visitors) => {
    if (check) {
      if (!Array_isArray(node)) {
        throw new Error("block instances must be arrays, got: " + print(node, 1));
      }
      if (node.length === 0) {
        throw new Error("block instances cannot be empty arrays");
      }
      if (node[0] !== "BLOCK") {
        throw new Error("block instances must have \"BLOCK\" as constructor, got: " + print(node, 1));
      }
    }
    const constructor = node[0];
    const fields = ArrayLite.slice(node, 1, node.length);
    if ("_BLOCK_" in visitors) {
      return visitors._BLOCK_(tag, fields[0], fields[1], fields[2], node);
    }
    const array = dispatch(Syntax.block.BLOCK, fields1, depth, options);
    if ("BLOCK" in visitors) {
      return visitors.BLOCK(tag, array[0], array[1], array[2], node)
    }
    return array;
  };
});

const dispatch = (type, node, depth, check, visitors) => {
  if (typeof type === "string") {
    if (depth === 0) {
      return node;
    }
    return closures[type](node, depth - 1, check, visitors);
  }
  if (check) {
    if (!Array_isArray(node)) {
      throw new Error("Fields must be an array, got: " + print(node, 1));
    }
    if (type.length !== 1 && type.length !== node.length) {
      throw new Error("Fields length mismatch, expected " + type.length + ", got: " + node.length + " from: " + print(node, 1));
    }
  }
  if (type.length === 1) {
    return ArrayLite.map(node, (node) => dispatch(type[0], node, depth, check, visitors));
  }
  return ArrayLite.map(node, (node, index) => dispatch(type[index], node, depth, check, visitors));
};

module.exports = dispatch;
