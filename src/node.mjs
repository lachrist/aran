import { slice } from "array-lite";

import {
  partialx___,
  partialx____,
  partialx_____,
  hasOwn,
} from "./util/index.mjs";

const {
  Error,
  Array: { isArray },
} = globalThis;

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

export const throwUnexpectedArrayNodeType = ({ 0: type }) => {
  throw new Error(`unexpected array node type ${type}`);
};

export const throwUnexpectedObjectNodeType = ({ type }) => {
  throw new Error(`unexpected object node type ${type}`);
};

///////////////////
// dispatchNode0 //
///////////////////

const dispatchNode0 = (getType, clauses, default_clause, node) => {
  const type = getType(node);
  if (hasOwn(clauses, type)) {
    const clause = clauses[type];
    return clause(node);
  } else {
    return default_clause(node);
  }
};

export const dispatchArrayNode0 = partialx___(dispatchNode0, getArrayNodeType);

export const dispatchObjectNode0 = partialx___(
  dispatchNode0,
  getObjectNodeType,
);

///////////////////
// dispatchNode1 //
///////////////////

const dispatchNode1 = (getType, clauses, default_clause, node, extra1) => {
  const type = getType(node);
  if (hasOwn(clauses, type)) {
    const clause = clauses[type];
    return clause(node, extra1);
  } else {
    return default_clause(node, extra1);
  }
};

export const dispatchArrayNode1 = partialx____(dispatchNode1, getArrayNodeType);

export const dispatchObjectNode1 = partialx____(
  dispatchNode1,
  getObjectNodeType,
);

///////////////////
// dispatchNode2 //
///////////////////

const dispatchNode2 = (
  getType,
  clauses,
  default_clause,
  node,
  extra1,
  extra2,
) => {
  const type = getType(node);
  if (hasOwn(clauses, type)) {
    const clause = clauses[type];
    return clause(node, extra1, extra2);
  } else {
    return default_clause(node, extra1, extra2);
  }
};

export const dispatchArrayNode2 = partialx_____(
  dispatchNode2,
  getArrayNodeType,
);

export const dispatchObjectNode2 = partialx_____(
  dispatchNode2,
  getObjectNodeType,
);

/////////////////
// allignNode0 //
/////////////////

const allignNode0 = (getType, clauses, default_clause, node1, node2) => {
  const type1 = getType(node1);
  const type2 = getType(node2);
  if (type1 === type2 && hasOwn(clauses, type1)) {
    const clause = clauses[type1];
    return clause(node1, node2);
  } else {
    return default_clause(node1, node2);
  }
};

export const allignArrayNode0 = partialx____(allignNode0, getArrayNodeType);

export const allignObjectNode0 = partialx____(allignNode0, getObjectNodeType);
