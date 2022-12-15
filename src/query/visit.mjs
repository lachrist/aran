import { hasOwnProperty } from "../util/index.mjs";

export const applyVisitor = (visitors, node, missing) => {
  if (hasOwnProperty(visitors, node.type)) {
    const visitor = visitors[node.type];
    return visitor(node);
  } else {
    return missing(node);
  }
};
