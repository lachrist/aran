
const ArrayLite = require("array-lite");

const closures = {__proto__: null};

exports.node = (expression, callbacks) => {
  
};

exports.expression = (expression, callbacks) => {
  
};

exports.statement = (statement, callbacks) => {
  
};

exports.block = (block, callback) => callback()

exports.expression = (expression, destructuring, mappers) => {
  
};

exports.block = (block, destructuring, mappers, check, context) => {
  if (check) {
    if (!global_isArray(block)) {
      throw new global_Error("Blocks should be arrays");
    }
    if (block.length !== 2) {
      throw new global_Error("Blocks should be arrays of length 2");
    }
  }
  
};

const dispatch = (type, node, )

exports.expression = (expression, destructuring, mappers, check) => {
  if (check) {
    if (!global_isArray(expression)) {
      throw new global_Error("Expressions should be arrays");
    }
    if (expression.length < 1) {
      throw new global_Error("Expressions should at last have a type tag");
    }
    if (typeof expression[0] !== "string") {
      throw new global_Error("The type tag of expressions should be a string");
    }
    if (!(expression[0] in Syntax.expression)) {
      throw new global_Error("Invalid expression type tag");
    }
    if (expression.length !== Syntax.expression[expression[0]].length + 1) {
      throw new global_Error("Wrong number of fields for expression");
    }
  }
  const constructor = expression[0];
  const types = Syntax.expression[constructor];
  if (types.length === 0) {
    return destructuring[constructor](expression);
  }
  if (types.length === 1) {
    return destructuring[constructor](expression,
      dispatch(types[0], expression[1], mappers, check));
  }
  if (types.length === 2) {
    return destructuring[constructor](expression,
      dispatch(types[0], expression[1], mappers, check),
      dispatch(types[1], expression[2], mappers, check));
  }
  if (types.length === 3) {
    return destructuring[constructor](expression,
      dispatch(types[0], expression[1], mappers, check),
      dispatch(types[1], expression[2], mappers, check),
      dispatch(types[2], expression[3], mappers, check));
  }
  throw new global_Error("Unexpected type length");
};


const dispatch = (type, node, mappers, check) => {
  if (typeof type === "string") {
    if (check) {
      ...
    }
    return mappers[type](node);
    // return closures[type](node, visitors, check, context);
  }
  if (check) {
    if (!global_Array_isArray(node)) {
      throw new Error("Expected array node");
    }
    if (type.length !== 1 && type.length !== node.length) {
      throw new Error("Array node length mismatch");
    }
  }
  if (type.length === 1) {
    return ArrayLite.map(node, (child) => dispatch(type[0], child, mappers, check));
  }
  return ArrayLite.map(node, (child, index) => dispatch(type[index], child, mappers, check));
};


ArrayLite.forEach(["identifier", "label", "primitive"], (type) => {
  closures[type] = (node, depth, visitors, check, context) => {
    if (check) {
      if (!Syntax[type](node)) {
        throw new Error("Invalid " + type + " instance, got: " + print(node, 1));
      }
    }
    return node;
  };
});

ArrayLite.forEach(["unary-operator", "binary-operator", "builtin-name"], (type) => {
  closures[type] = (node, depth, visitors, check, context) => {
    if (check) {
      if (!ArrayLite.includes(Syntax[type], node)) {
        throw new Error("Unrecognized " + type + " instance, got: " + print(node, 1));
      }
    }
    return node;
  }
});

ArrayLite.forEach(["statement", "expression"], (type) => {
  closures[type] = (node, depth, visitors, check, context) => {
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
    const types = Syntax[type][contructor];
    if ("_" + constructor + "_" in visitors) {
      if (length === 0) {
        return visitors["_" + constructor + "_"](context, node);
      }
      if (length === 1) {
        return visitors["_" + constructor + "_"](context, node, fields[0]);
      }
      if (length === 2) {
        return visitors["_" + constructor + "_"](context, node, fields[0], fields[1]);
      }
      if (length === 3) {
        return visitors["_" + constructor + "_"](context, node, fields[0], fields[1], fields[2]);
      }
      throw new Error("Unexpected type fields length");
    }
    const array = dispatch(Syntax[type][constructor], fields, depth, check, visitors);
    if (constructor in visitors) {
      if (length === 0) {
        return visitors[constructor](context, node);
      }
      if (length === 1) {
        return visitors[constructor](context, node, array[0]);
      }
      if (length === 2) {
        return visitors[constructor](context, node, array[0], array[1]);
      }
      if (length === 3) {
        return visitors[constructor](context, node, array[0], array[1], array[2]);
      }
      throw new Error("Unexpected type fields length");
    }
    return void 0;
  };
});

ArrayLite.forEach(global_Reflect_ownKeys(Syntax.parameters), (origin) => {
  closures[origin + "-block"] = (node, depth, visitors, check, context) => {
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
      return visitors._BLOCK_(context, node, origin, fields[0], fields[1]);
    }
    const array = dispatch(Syntax.block, fields1, depth, options);
    if ("BLOCK" in visitors) {
      return visitors.BLOCK(context, node, origin, array[0], array[1]);
    }
    return array;
  };
});

const dispatch = (type, node, depth, visitors, check, context) => {
  if (typeof type === "string") {
    if (depth === 0) {
      return node;
    }
    return closures[type](node, depth - 1, visitors, check, context);
  }
  if (check) {
    if (!global_Array_isArray(node)) {
      throw new Error("Fields must be an array, got: " + print(node, 1));
    }
    if (type.length !== 1 && type.length !== node.length) {
      throw new Error("Fields length mismatch, expected " + type.length + ", got: " + node.length + " from: " + print(node, 1));
    }
  }
  if (type.length === 1) {
    return ArrayLite.map(node, (child) => dispatch(type[0], child, depth, visitors, check, context));
  }
  return ArrayLite.map(node, (child, index) => dispatch(type[index], child, depth, visitors, check, context));
};

module.exports = dispatch;
