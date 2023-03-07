import { concat } from "array-lite";
import { reduceReverse } from "../../util/index.mjs";
import {
  annotateNode,
  makeSequenceExpression,
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
import { makeMacro } from "./macro.mjs";
import { expectSyntaxPropertyEqual } from "./report.mjs";
import { visit, EXPRESSION_MACRO, getKeyMacroSite } from "./context.mjs";

export default {
  __ANNOTATE__: annotateNode,
  Identifier: (node, context, site) => {
    if (site.prefix) {
      const macro = makeMacro(
        context,
        "right_new",
        makeBinaryExpression(
          site.operator[0],
          makeScopeBaseReadExpression(context, node.name),
          makeLiteralExpression(1),
        ),
      );
      return reduceReverse(
        concat(
          macro.setup,
          makeScopeBaseWriteEffectArray(context, node.name, macro.value),
        ),
        makeSequenceExpression,
        macro.value,
      );
    } else {
      const macro = makeMacro(
        context,
        "right_old",
        makeScopeBaseReadExpression(context, node.name),
      );
      return reduceReverse(
        concat(
          macro.setup,
          makeScopeBaseWriteEffectArray(
            context,
            node.name,
            makeBinaryExpression(
              site.operator[0],
              macro.value,
              makeLiteralExpression(1),
            ),
          ),
        ),
        makeSequenceExpression,
        macro.value,
      );
    }
  },
  MemberExpression: (node, context, site) => {
    expectSyntaxPropertyEqual(node, ["optional"], false);
    if (site.prefix) {
      const object_macro = visit(node.object, context, {
        ...EXPRESSION_MACRO,
        info: "object",
      });
      const key_macro = visit(
        node.property,
        context,
        getKeyMacroSite(node.computed),
      );
      return reduceReverse(
        concat(object_macro.setup, key_macro.setup),
        makeSequenceExpression,
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
      );
    } else {
      const object_macro = visit(node.object, context, {
        ...EXPRESSION_MACRO,
        info: "object",
      });
      const key_macro = visit(
        node.property,
        context,
        getKeyMacroSite(node.computed),
      );
      const right_old_macro = makeMacro(
        context,
        "right_old",
        makeGetExpression(object_macro.value, key_macro.value),
      );
      return reduceReverse(
        concat(object_macro.setup, key_macro.setup, right_old_macro.setup, [
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              object_macro.value,
              key_macro.value,
              makeBinaryExpression(
                site.operator[0],
                right_old_macro.value,
                makeLiteralExpression(1),
              ),
            ),
          ),
        ]),
        makeSequenceExpression,
        right_old_macro.value,
      );
    }
  },
};
