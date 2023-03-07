import { concat } from "array-lite";
import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeGetExpression,
  makeSetExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  makeScopeBaseWriteEffectArray,
  makeScopeBaseReadExpression,
} from "../scope/index.mjs";
import { annotateArray } from "./annotate.mjs";
import { expectSyntaxPropertyEqual } from "./report.mjs";
import { EXPRESSION_MACRO, getKeyMacroSite } from "./site.mjs";
import { visit } from "./context.mjs";

export default {
  __ANNOTATE__: annotateArray,
  MemberExpression: (node, context, site) => {
    expectSyntaxPropertyEqual(node, ["optional"], false);
    const object_macro = visit(node.object, context, {
      ...EXPRESSION_MACRO,
      info: "object",
    });
    const key_macro = visit(
      node.property,
      context,
      getKeyMacroSite(node.computed),
    );
    return concat(object_macro.setup, key_macro.setup, [
      makeExpressionEffect(
        makeSetExpression(
          context.strict,
          object_macro.value,
          key_macro.value,
          makeBinaryExpression(
            site.operator[0],
            makeGetExpression(object_macro.value, key_macro.value),
            makeLiteralExpression(1),
          ),
        ),
      ),
    ]);
  },
  Identifier: (node, context, site) =>
    makeScopeBaseWriteEffectArray(
      context,
      node.name,
      makeBinaryExpression(
        site.operator[0],
        makeScopeBaseReadExpression(context, node.name),
        makeLiteralExpression(1),
      ),
    ),
};
