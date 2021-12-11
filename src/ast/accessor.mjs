import {concat, slice} from "array-lite";
import {assert} from "../util.mjs";

const {
  Error,
  // Array: {isArray},
  Reflect: {apply},
  undefined,
} = globalThis;

export const makeNode = (...args) => args;

export const getNodeType = (node) => node[0];

export const getNodeAnnotation = (node) => node[1];

export const getNodeFieldArray = (node) => slice(node, 2, node.length);

export const dispatchNode = (context, node, callbacks, default_callback) => {
  const {0: type, length} = node;
  if (type in callbacks) {
    const callback = callbacks[type];
    assert(callback.length === length, "wrong callback arity");
    if (length === 2) {
      return callback(context, node[1]);
    }
    if (length === 3) {
      return callback(context, node[1], node[2]);
    }
    if (length === 4) {
      return callback(context, node[1], node[2], node[3]);
    }
    if (length === 5) {
      return callback(context, node[1], node[2], node[3], node[4]);
    }
    if (length === 6) {
      return callback(context, node[1], node[2], node[3], node[4], node[5]);
    }
    /* c8 ignore start */
    throw new Error("unexpected node length");
  }
  /* c8 ignore stop */
  return default_callback(context, node);
};

export const extractNode = (context, node, type, callback) => {
  const {length} = node;
  assert(node[0] === type, "type mismatch for extract");
  assert(callback.length === length, "wrong callback arity");
  if (length === 2) {
    return callback(context, node[1]);
  }
  if (length === 3) {
    return callback(context, node[1], node[2]);
  }
  if (length === 4) {
    return callback(context, node[1], node[2], node[3]);
  }
  if (length === 5) {
    return callback(context, node[1], node[2], node[3], node[4]);
  }
  if (length === 6) {
    return callback(context, node[1], node[2], node[3], node[4], node[5]);
  }
  /* c8 ignore start */
  throw new Error("invalid node length");
  /* c8 ignore stop */
};

// export const matchNode = (context, value, pattern) => {
//   if (typeof pattern === "function") {
//     return pattern(context, value);
//   }
//   if (isArray(value) && isArray(pattern) && value.length === pattern.length) {
//     return every(zip(value, pattern), (pair) => matchNode(context, pair[0], pair[1]);
//   }
//   return value === match;
// };

// allignNode is only used for testing so we don't care about performance and use reflection.
export const allignNode = (
  context,
  node1,
  node2,
  callbacks,
  default_callback,
) => {
  const type1 = node1[0];
  const type2 = node2[0];
  if (type1 === type2 && type1 in callbacks) {
    const callback = callbacks[type1];
    assert(
      callback.length + 1 === node1.length + node2.length,
      "wrong callback arity",
    );
    return apply(
      callback,
      undefined,
      concat(
        [context],
        slice(node1, 1, node1.length),
        slice(node2, 1, node2.length),
      ),
    );
  }
  return default_callback(context, node1, node2);
};
