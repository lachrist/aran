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
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeBaseWriteEffectArray,
  makeScopeBaseReadExpression,
  makeScopeMetaReadExpression,
} from "../scope/index.mjs";
import { expectSyntaxEqual } from "./report.mjs";
import { annotateNodeArray, visit } from "./context.mjs";

const EXPRESSION = { type: "Expression", name: "" };
const KEY = {
  true: { type: "Key", computed: true },
  false: { type: "Key", computed: false },
};

export default {
  __ANNOTATE__: annotateNodeArray,
  MemberExpression: (node, context, site) => {
    expectSyntaxEqual(node, "optional", false);
    const object_variable = declareScopeMeta(
      context,
      "UpdateEffectMemberExpressionObject",
    );
    const property_variable = declareScopeMeta(
      context,
      "UpdateEffectMemberExpressionKey",
    );
    return concat(
      makeScopeMetaWriteEffectArray(
        context,
        object_variable,
        visit(node.object, context, EXPRESSION),
      ),
      makeScopeMetaWriteEffectArray(
        context,
        property_variable,
        visit(node.property, context, KEY[node.computed]),
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
};
