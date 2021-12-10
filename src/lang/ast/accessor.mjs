import {concat, slice} from "array-lite";
import {assert} from "../../util.mjs";

const {
  Error,
  Array: {isArray},
  Reflect: {apply},
  undefined,
} = globalThis;

export const makeNode = (...args) => args;

export const getNodeType = ({0: type}) => type;

export const getNodeFieldArray = (node) => slice(node, 1, node.length);

export const dispatchNode = (context, node, callbacks, default_callback) => {
  const {0: type, length} = node;
  if (type in callbacks) {
    const callback = callbacks[type];
    assert(callback.length === 1 + length, "wrong callback arity");
    if (length === 1) {
      return callback(context, node);
    }
    if (length === 2) {
      return callback(context, node, node[1]);
    }
    if (length === 3) {
      return callback(context, node, node[1], node[2]);
    }
    if (length === 4) {
      return callback(context, node, node[1], node[2], node[3]);
    }
    if (length === 5) {
      return callback(context, node, node[1], node[2], node[3], node[4]);
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
  assert(callback.length === 1 + length, "wrong callback arity");
  if (length === 1) {
    return callback(context, node);
  }
  if (length === 2) {
    return callback(context, node, node[1]);
  }
  if (length === 3) {
    return callback(context, node, node[1], node[2]);
  }
  if (length === 4) {
    return callback(context, node, node[1], node[2], node[3]);
  }
  if (length === 5) {
    return callback(context, node, node[1], node[2], node[3], node[4]);
  }
  /* c8 ignore start */
  throw new Error("invalid node length");
  /* c8 ignore stop */
};

export const matchNode = (context, value, match) => {
  if (typeof match === "function") {
    return match(context, value);
  }
  if (isArray(value) && isArray(match) && value.length === match.length) {
    const {length} = value;
    for (let index = 0; index < length; index += 1) {
      if (!matchNode(context, value[index], match[index])) {
        return false;
      }
    }
    return true;
  }
  return value === match;
};

// Allign is only used for testing so we don't care about performance and use reflection.
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
      callback.length === 1 + node1.length + node2.length,
      "wrong callback arity",
    );
    return apply(
      callback,
      undefined,
      concat(
        [context, node1, node2],
        slice(node1, 1, node1.length),
        slice(node2, 1, node2.length),
      ),
    );
  }
  return default_callback(context, node1, node2);
};
