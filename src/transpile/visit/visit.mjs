import { map } from "array-lite";

import { hasOwnProperty, assert, partial_x } from "../../util/index.mjs";

import { annotateNode } from "../../ast/index.mjs";

import { serializeContextNode } from "./context.mjs";

const applyVisitorCommon = (
  visitors,
  node,
  context,
  default_specific,
  specific,
) => {
  dispatchNodeObject2(visitors, node, context, {
    ...default_specific,
    ...specific,
  });
  assert(hasOwnProperty(visitors, node.type), `missing ${node.type} visitor`);
  const visitor = visitors[node.type];
  return visitor(node, context, { ...default_specific, ...specific });
};

export const applyVisitor = (
  visitors,
  default_specific,
  node,
  context,
  specific,
) => {
  const serial = serializeContextNode(context, node);
  return annotateNode(
    applyVisitorCommon(visitors, node, context, default_specific, specific),
    serial,
  );
};

export const applyArrayVisitor = (
  visitors,
  default_specific,
  node,
  context,
  specific,
) => {
  const serial = serializeContextNode(context, node);
  return map(
    applyVisitorCommon(visitors, node, context, default_specific, specific),
    partial_x(annotateNode, serial),
  );
};
