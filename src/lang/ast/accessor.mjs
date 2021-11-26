import {slice} from "array-lite";
import {assert} from "../../util.mjs";

const {Error} = globalThis;

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
