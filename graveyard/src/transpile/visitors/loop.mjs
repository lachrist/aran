import { makeWhileStatement } from "../../ast/index.mjs";
import { annotateArray } from "../annotate.mjs";
import { EXPRESSION, LOOP_BODY } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateArray,
  WhileStatement: (node, context, { type: _type, ...rest }) => [
    makeWhileStatement(
      visit(node.test, context, EXPRESSION),
      visit(node.body, context, {
        ...LOOP_BODY,
        ...rest,
      }),
    ),
  ],
};
