import { slice } from "array-lite";

import {
  assert,
  partialx__,
  partialx___,
  partialx____,
  partialx_____,
  hasOwn,
} from "./util/index.mjs";

const {
  Error,
  Symbol,
  Array: { isArray },
} = globalThis;

export const DEFAULT_CLAUSE = Symbol("node-default-callback");

export const MISMATCH_CLAUSE = Symbol("node-mismatch-callback");

///////////////
// ArrayNode //
///////////////

export const isArrayNode = (any) =>
  isArray(any) && any.length > 0 && typeof any[0] === "string";

export const isObjectNode = (any) =>
  typeof any === "object" &&
  any !== null &&
  hasOwn(any, "type") &&
  typeof any.type === "string";

export const getArrayNodeType = ({ 0: type }) => type;

export const getArrayNodeContent = (array) => slice(array, 1, array.length);

export const getObjectNodeType = ({ type }) => type;

//////////////
// dispatch //
//////////////

const getDispatchClause = (clauses, type) => {
  if (hasOwn(clauses, type)) {
    return clauses[type];
  } else if (hasOwn(clauses, DEFAULT_CLAUSE)) {
    return clauses[DEFAULT_CLAUSE];
  } else {
    console.log("Missing dispatch clause", { clauses, type });
    throw new Error("missing dispatch clause");
  }
};

// dispatchNode0 //

const dispatchNode0 = (getType, clauses, node) =>
  getDispatchClause(clauses, getType(node))(node);

export const dispatchArrayNode0 = partialx__(dispatchNode0, getArrayNodeType);

export const dispatchObjectNode0 = partialx__(dispatchNode0, getObjectNodeType);

// dispatchNode1 //

const dispatchNode1 = (getType, clauses, node, extra1) =>
  getDispatchClause(clauses, getType(node))(node, extra1);

export const dispatchArrayNode1 = partialx___(dispatchNode1, getArrayNodeType);

export const dispatchObjectNode1 = partialx___(
  dispatchNode1,
  getObjectNodeType,
);

// dispatchNode2 //

const dispatchNode2 = (getType, clauses, node, extra1, extra2) =>
  getDispatchClause(clauses, getType(node))(node, extra1, extra2);

export const dispatchArrayNode2 = partialx____(dispatchNode2, getArrayNodeType);

export const dispatchObjectNode2 = partialx____(
  dispatchNode2,
  getObjectNodeType,
);

////////////
// allign //
////////////

const getAllignClause = (clauses, type1, type2) => {
  if (type1 === type2) {
    return getDispatchClause(clauses, type1);
  } else {
    assert(hasOwn(clauses, MISMATCH_CLAUSE), "missing mismatch clause");
    return clauses[MISMATCH_CLAUSE];
  }
};

// allignNode0 //

const allignNode0 = (getType, clauses, node1, node2) =>
  getAllignClause(clauses, getType(node1), getType(node2))(node1, node2);

export const allignArrayNode0 = partialx____(allignNode0, getArrayNodeType);

export const allignObjectNode0 = partialx____(allignNode0, getObjectNodeType);

// allign1 //

const allignNode1 = (getType, clauses, node1, node2, extra) =>
  getAllignClause(clauses, getType(node1), getType(node2))(node1, node2, extra);

export const allignArrayNode1 = partialx_____(allignNode1, getArrayNodeType);

export const allignObjectNode1 = partialx_____(allignNode1, getObjectNodeType);
