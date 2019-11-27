
const closures = {__proto__: null};

ArrayLite.forEach(["identifier", "label", "primitive"], (type) => {
  closures[type] = (node, depth, options) => {
    if (options.check)
      if (!Syntax[type](node)) {
        throw new Error("Invalide " + type + " instance, got: " + print(node, 1));
      }
    }
    return node;
  };
});

ArrayLite.forEach(["unary-operator", "binary-operator", "builtin-name"], (type) => {
  closures[type] = (node, depth, options) => {
    if (options.check) {
      if (!ArrayLite.includes(Syntax[type], node)) {
        throw new Error("Unrecognized " + type + " instance, got: " + print(node, 1));
      }
    }
    return node;
  }
});

ArrayLite.forEach(["statement", "expression"], (type) => {
  closures[type] = (node, depth, options) => {
    if (options.check) {
      if (!Array_isArray(node)) {
        throw new Error("block instances must be arrays, got: " + print(node, 1));
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
    const fields1 = ArrayLite.slice(node, 1, node.length);
    const mapped = options.map ? options.map.get(node) : void 0;
    const length = Syntax[type][constructor].length;
    if (options.visitors["_" + constructor + "_"]) {
      if (length === 0) {
        return options.visitors["_" + constructor + "_"](mapped, options);
      }
      if (length === 1) {
        return options.visitors["_" + constructor + "_"](fields[0], mapped, options);
      }
      if (length === 2) {
        return options.visitors["_" + constructor + "_"](fields[0], fields[1], mapped, options);
      }
      if (length === 3) {
        return options.visitors["_" + constructor + "_"](fields[0], fields[1], fields[2], mapped, options);
      }
      throw new Error("Unexpected type fields length (this should never happen)");
    }
    const fields2 = dispatch(Syntax[type][constructor], fields1, depth, options);
    if (!options.visitors[constructor]) {
      return fields2;
    }
    if (length === 0) {
      return options.visitors[constructor](mapped);
    }
    if (length === 1) {
      return options.visitors[constructor](fields[0], mapped);
    }
    if (length === 2) {
      return options.visitors[constructor](fields[0], fields[1], mapped);
    }
    if (length === 3) {
      return options.visitors[constructor](fields[0], fields[1], fields[2], mapped);
    }
    throw new Error("Unexpected type fields length (this should never happen)");
  };
});

const blocktags = {__proto__: null};
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
  blocktags["block-"+tag] = tag;
});

ArrayLite.forEach(Reflect_ownKeys(blocktags), (taggedtype) => {
  const tag = blocktags[taggedtype];
  closures[taggedtype] = (node, depth, options) => {
    if (options.check) {
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
    const fields1 = ArrayLite.slice(node, 1, node.length);
    const mapped = options.map ? options.map.get(node) : void 0;
    if (options.visitors._BLOCK_) {
      return options.visitors._BLOCK_(tag, fields1[0], fields1[1], fields2[2], mapped);
    }
    const fields2 = dispatch(Syntax.block.BLOCK, fields1, depth, options);
    return options.visitors.BLOCK ? options.visitors.BLOCK(tag, fields2[0], fields2[1], fields2[2], mapped) : array;
  };
});

const dispatch = (type, node, depth, options) => {
  if (typeof type === "string") {
    if (depth === 0) {
      return node;
    }
    return closures[type](node, depth - 1, options);
  }
  if (check) {
    if (!Array_isArray(node)) {
      throw new Error("Fields must be an array, got: " + print(node, 1));
    }
    if (type.length !== 1 && type.length !== node.length) {
      throw new Error("Fields length mismatch, expected " + type.length ", got: " + node.length + " from: " + print(node, 1));
    }
  }
  if (type.length === 1) {
    return ArrayLite.map(node, (node) => dispatch(type[0], node, depth, options));
  }
  return ArrayLite.map(node, (node, index) => dispatch(type[index], node, depth, options));
};

module.exports = dispatch;
