import { reduceReverse } from "../../util/index.mjs";
import {
  makeSequenceExpression,
  makeConditionalExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
} from "../../ast/index.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { annotate } from "../annotate.mjs";
import { EXPRESSION_MACRO } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotate,
  Literal: (node, _context, _site) => {
    if (node.value === null) {
      return makeLiteralExpression(null);
    } else {
      return makeIntrinsicExpression("Object.prototype");
    }
  },
  __DEFAULT__: (node, context, _site) => {
    const macro = visit(node, context, {
      ...EXPRESSION_MACRO,
      info: "prototype",
    });
    return reduceReverse(
      macro.setup,
      makeSequenceExpression,
      makeConditionalExpression(
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeUnaryExpression("typeof", macro.value),
            makeLiteralExpression("object"),
          ),
          makeLiteralExpression(true),
          makeBinaryExpression(
            "===",
            makeUnaryExpression("typeof", macro.value),
            makeLiteralExpression("function"),
          ),
        ),
        macro.value,
        makeIntrinsicExpression("Object.prototype"),
      ),
    );
  },
};
