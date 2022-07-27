import {slice} from "array-lite";

import {
  partialx___,
  partialx____,
  partialx_____,
  hasOwnProperty,
} from "./util/index.mjs";

const {
  Array: {isArray},
} = globalThis;

///////////////
// ArrayNode //
///////////////

export const isArrayNode = (any) =>
  isArray(any) && any.length > 0 && typeof any[0] === "string";

export const isObjectNode = (any) =>
  typeof any === "object" &&
  any !== null &&
  hasOwnProperty(any, "type") &&
  typeof any.type === "string";

export const getArrayNodeType = ({0: type}) => type;

export const getArrayNodeContent = (array) => slice(array, 1, array.length);

export const getObjectNodeType = ({type}) => type;

///////
// 0 //
///////

const dispatchNode0 = (getType, clauses, default_clause, node) => {
  const type = getType(node);
  if (hasOwnProperty(clauses, type)) {
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

///////
// 1 //
///////

const dispatchNode1 = (getType, clauses, default_clause, node, extra1) => {
  const type = getType(node);
  if (hasOwnProperty(clauses, type)) {
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

///////
// 2 //
///////

const dispatchNode2 = (
  getType,
  clauses,
  default_clause,
  node,
  extra1,
  extra2,
) => {
  const type = getType(node);
  if (hasOwnProperty(clauses, type)) {
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
