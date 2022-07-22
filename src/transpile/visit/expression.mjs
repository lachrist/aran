import {map} from "array-lite";

import {partial_xx, partialxx___} from "../../util/index.mjs";

import {makeLiteralExpression, makeApplyExpression} from "../../ast/index.mjs";

import {applyVisitor} from "./visit.mjs";

export const visitExpression = partialxx___(
  applyVisitor,
  {
    Literal: (node, _context, {}) => makeLiteralExpression(node.value),
    CallExpression: (node, context, {}) =>
      makeApplyExpression(
        visitExpression(node.callee, context),
        makeLiteralExpression({undefined: null}),
        map(node.arguments, partial_xx(visitExpression, context, null)),
      ),
  },
  {
    dropped: false,
    name: null,
  },
);
