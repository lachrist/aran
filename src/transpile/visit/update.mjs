import { concat } from "array-lite";
import { reduceReverse, partialx___ } from "../../util/index.mjs";
import {
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
import { visit } from "./context.mjs";

const ANONYMOUS = { name: null };
const visitProperty = partialx___(visit, "Property");
const visitExpression = partialx___(visit, "Expression");

export default {
  UpdateEffect: {
    MemberExpression: (node, context, site) => {
      expectSyntaxEqual(node, "optional", false);
      const object_variable = declareScopeMeta(
        context,
        "UpdateEffectMemberExpressionObject",
      );
      const property_variable = declareScopeMeta(
        context,
        "UpdateEffectMemberExpressionProperty",
      );
      return concat(
        makeScopeMetaWriteEffectArray(
          context,
          object_variable,
          visitExpression(node.object, context, ANONYMOUS),
        ),
        makeScopeMetaWriteEffectArray(
          context,
          property_variable,
          visitProperty(node.property, context, node),
        ),
        [
          makeExpressionEffect(
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
          ),
        ],
      );
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
  },
  UpdateExpression: {
    Identifier: (node, context, site) => {
      if (site.prefix) {
        const variable = declareScopeMeta(
          context,
          "UpdateExpressionIdentifier",
        );
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
        const variable = declareScopeMeta(
          context,
          "UpdateExpressionIdentifier",
        );
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
          "UpdateExpressionMemberExpressionProperty",
        );
        return reduceReverse(
          concat(
            makeScopeMetaWriteEffectArray(
              context,
              object_variable,
              visitExpression(node.object, context, ANONYMOUS),
            ),
            makeScopeMetaWriteEffectArray(
              context,
              property_variable,
              visitProperty(node.property, context, ANONYMOUS),
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
          "UpdateExpressionMemberExpressionProperty",
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
              visitExpression(node.object, context, ANONYMOUS),
            ),
            makeScopeMetaWriteEffectArray(
              context,
              property_variable,
              visitProperty(node.property, context, ANONYMOUS),
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
  },
};
