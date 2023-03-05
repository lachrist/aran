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
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeBaseWriteEffectArray,
  makeScopeBaseReadExpression,
  makeScopeMetaReadExpression,
} from "../scope/index.mjs";
import { expectSyntaxEqual } from "./report.mjs";
import { visit, EXPRESSION, KEY_MAP } from "./context.mjs";

export default {
  __ANNOTATE__: annotateNode,
  Identifier: (node, context, site) => {
    if (site.prefix) {
      const variable = declareScopeMeta(context, "UpdateExpressionIdentifier");
      return reduceReverse(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            makeBinaryExpression(
              site.operator[0],
              makeScopeBaseReadExpression(context, node.name),
              makeLiteralExpression(1),
            ),
          ),
          makeScopeBaseWriteEffectArray(
            context,
            node.name,
            makeScopeMetaReadExpression(context, variable),
          ),
        ),
        makeSequenceExpression,
        makeScopeMetaReadExpression(context, variable),
      );
    } else {
      const variable = declareScopeMeta(context, "UpdateExpressionIdentifier");
      return reduceReverse(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            makeScopeBaseReadExpression(context, node.name),
          ),
          makeScopeBaseWriteEffectArray(
            context,
            node.name,
            makeBinaryExpression(
              site.operator[0],
              makeScopeMetaReadExpression(context, variable),
              makeLiteralExpression(1),
            ),
          ),
        ),
        makeSequenceExpression,
        makeScopeMetaReadExpression(context, variable),
      );
    }
  },
  MemberExpression: (node, context, site) => {
    expectSyntaxEqual(node, "optional", false);
    if (site.prefix) {
      const object_variable = declareScopeMeta(
        context,
        "UpdateExpressionMemberExpressionObject",
      );
      const property_variable = declareScopeMeta(
        context,
        "UpdateExpressionMemberExpressionKey",
      );
      return reduceReverse(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            object_variable,
            visit(node.object, context, EXPRESSION),
          ),
          makeScopeMetaWriteEffectArray(
            context,
            property_variable,
            visit(node.property, context, KEY_MAP[node.computed]),
          ),
        ),
        makeSequenceExpression,
        makeSetExpression(
          context.strict,
          makeScopeMetaReadExpression(context, object_variable),
          makeScopeMetaReadExpression(context, property_variable),
          makeBinaryExpression(
            site.operator[0],
            makeGetExpression(
              makeScopeMetaReadExpression(context, object_variable),
              makeScopeMetaReadExpression(context, property_variable),
            ),
            makeLiteralExpression(1),
          ),
        ),
      );
    } else {
      const object_variable = declareScopeMeta(
        context,
        "UpdateExpressionMemberExpressionObject",
      );
      const property_variable = declareScopeMeta(
        context,
        "UpdateExpressionMemberExpressionKey",
      );
      const value_variable = declareScopeMeta(
        context,
        "UpdateExpressionMemberExpressionValue",
      );
      return reduceReverse(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            object_variable,
            visit(node.object, context, EXPRESSION),
          ),
          makeScopeMetaWriteEffectArray(
            context,
            property_variable,
            visit(node.property, context, KEY_MAP[node.computed]),
          ),
          makeScopeMetaWriteEffectArray(
            context,
            value_variable,
            makeGetExpression(
              makeScopeMetaReadExpression(context, object_variable),
              makeScopeMetaReadExpression(context, property_variable),
            ),
          ),
          [
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                makeScopeMetaReadExpression(context, object_variable),
                makeScopeMetaReadExpression(context, property_variable),
                makeBinaryExpression(
                  site.operator[0],
                  makeScopeMetaReadExpression(context, value_variable),
                  makeLiteralExpression(1),
                ),
              ),
            ),
          ],
        ),
        makeSequenceExpression,
        makeScopeMetaReadExpression(context, value_variable),
      );
    }
  },
};
