import { partialx___ } from "../../util/index.mjs";
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
  makeScopeMetaWriteEffect,
  makeScopeBaseWriteEffect,
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
      return [
        makeScopeMetaWriteEffect(
          context,
          object_variable,
          visitExpression(node.object, context, ANONYMOUS),
        ),
        makeScopeMetaWriteEffect(
          context,
          property_variable,
          visitProperty(node.property, context, node),
        ),
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
      ];
    },
    Identifier: (node, context, site) => [
      makeScopeBaseWriteEffect(
        context,
        node.name,
        makeBinaryExpression(
          site.operator[0],
          makeScopeBaseReadExpression(context, node.name),
          makeLiteralExpression(1),
        ),
      ),
    ],
  },
  UpdateExpression: {
    Identifier: (node, context, site) => {
      if (site.prefix) {
        const variable = declareScopeMeta(
          context,
          "UpdateExpressionIdentifier",
        );
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            variable,
            makeBinaryExpression(
              site.operator[0],
              makeScopeBaseReadExpression(context, node.name),
              makeLiteralExpression(1),
            ),
          ),
          makeSequenceExpression(
            makeScopeBaseWriteEffect(
              context,
              node.name,
              makeScopeMetaReadExpression(context, variable),
            ),
            makeScopeMetaReadExpression(context, variable),
          ),
        );
      } else {
        const variable = declareScopeMeta(
          context,
          "UpdateExpressionIdentifier",
        );
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            variable,
            makeScopeBaseReadExpression(context, node.name),
          ),
          makeSequenceExpression(
            makeScopeBaseWriteEffect(
              context,
              node.name,
              makeBinaryExpression(
                site.operator[0],
                makeScopeMetaReadExpression(context, variable),
                makeLiteralExpression(1),
              ),
            ),
            makeScopeMetaReadExpression(context, variable),
          ),
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
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            object_variable,
            visitExpression(node.object, context, ANONYMOUS),
          ),
          makeSequenceExpression(
            makeScopeMetaWriteEffect(
              context,
              property_variable,
              visitProperty(node.property, context, ANONYMOUS),
            ),
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
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            object_variable,
            visitExpression(node.object, context, ANONYMOUS),
          ),
          makeSequenceExpression(
            makeScopeMetaWriteEffect(
              context,
              property_variable,
              visitProperty(node.property, context, ANONYMOUS),
            ),
            makeSequenceExpression(
              makeScopeMetaWriteEffect(
                context,
                value_variable,
                makeGetExpression(
                  makeScopeMetaReadExpression(context, object_variable),
                  makeScopeMetaReadExpression(context, property_variable),
                ),
              ),
              makeSequenceExpression(
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
                makeScopeMetaReadExpression(context, value_variable),
              ),
            ),
          ),
        );
      }
    },
  },
};
