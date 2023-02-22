import {
  makeYieldExpression,
  makeAwaitExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { visitExpression } from "./context.mjs";

const EMPTY = {
  name: null,
  dropped: false,
};

export default {
  Literal: (node, _context, _specific) => makeLiteralExpression(node.value),
  AwaitExpression: (node, context, _specific) =>
    makeAwaitExpression(visitExpression(node.argument, context, EMPTY)),
  YieldExpression: (node, context, _specific) =>
    makeYieldExpression(
      node.delegate,
      node.argument === null
        ? makeLiteralExpression({ undefined: null })
        : visitExpression(node.argument, context, EMPTY),
    ),
};
