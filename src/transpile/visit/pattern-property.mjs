import { map, concat } from "array-lite";
import { partialx_, assert, push, reduceReverse } from "../../util/index.mjs";
import {
  makeExpressionEffect,
  makeIntrinsicExpression,
  makeSequenceExpression,
} from "../../ast/index.mjs";
import {
  makeDeleteStrictExpression,
  makeObjectExpression,
  makeObjectAssignExpression,
  makeGetExpression,
} from "../../intrinsic.mjs";
import {
  declareScopeMeta,
  makeScopeMetaReadExpression,
  makeScopeMetaWriteEffectArray,
} from "../scope/index.mjs";
import {
  annotateNodeArray,
  visit,
  liftEffect,
  getKeySite,
} from "./context.mjs";

const { Error } = globalThis;

export default {
  __ANNOTATE__: annotateNodeArray,
  Property: (node, context, site) => {
    if (site.key_variable_array === null) {
      return visit(node.value, context, {
        type: "Pattern",
        kind: site.kind,
        right: makeGetExpression(
          makeScopeMetaReadExpression(context, site.right_variable),
          visit(node.key, context, getKeySite(node.computed)),
        ),
      });
    } else {
      const key_variable = declareScopeMeta(context, "pattern_object_key");
      push(site.key_variable_array, key_variable);
      return visit(node.value, context, {
        type: "Pattern",
        kind: site.kind,
        right: makeGetExpression(
          makeScopeMetaReadExpression(context, site.right_variable),
          reduceReverse(
            makeScopeMetaWriteEffectArray(
              context,
              key_variable,
              visit(node.key, context, getKeySite(node.computed)),
            ),
            makeSequenceExpression,
            makeScopeMetaReadExpression(context, key_variable),
          ),
        ),
      });
    }
  },
  RestElement: (node, context, site) => {
    assert(
      site.key_variable_array !== null,
      Error,
      "missing array of key variables",
    );
    const rest_variable = declareScopeMeta(context, "pattern_object_rest");
    return concat(
      map(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            rest_variable,
            makeObjectAssignExpression(
              makeObjectExpression(
                makeIntrinsicExpression("Object.prototype"),
                [],
              ),
              makeScopeMetaReadExpression(context, site.right_variable),
            ),
          ),
          map(
            map(
              map(
                site.key_variable_array,
                partialx_(makeScopeMetaReadExpression, context),
              ),
              partialx_(
                makeDeleteStrictExpression,
                makeScopeMetaReadExpression(context, rest_variable),
              ),
            ),
            makeExpressionEffect,
          ),
        ),
        partialx_(liftEffect, site.kind),
      ),
      visit(node.argument, context, {
        type: "Pattern",
        kind: site.kind,
        right: makeScopeMetaReadExpression(context, rest_variable),
      }),
    );
  },
};
