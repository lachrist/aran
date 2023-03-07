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
import { declareScopeMeta } from "../scope/index.mjs";
import {
  annotateNodeArray,
  visit,
  liftEffect,
  getKeySite,
  getKeyMacroSite,
  PATTERN,
} from "./context.mjs";

const { Error } = globalThis;

export default {
  __ANNOTATE__: annotateNodeArray,
  Property: (node, context, site) => {
    if (site.keys === null) {
      return visit(node.value, context, {
        ...PATTERN,
        kind: site.kind,
        right: makeGetExpression(
          site.right,
          visit(node.key, context, getKeySite(node.computed)),
        ),
      });
    } else {
      const macro = visit(node.key, context, getKeyMacroSite(node.computed));
      push(site.keys, macro.value);
      return visit(node.value, context, {
        ...PATTERN,
        kind: site.kind,
        right: makeGetExpression(
          site.right,
          reduceReverse(macro.setup, makeSequenceExpression, macro.value),
        ),
      });
    }
  },
  RestElement: (node, context, site) => {
    assert(site.keys !== null, Error, "missing array of key variables");
    const macro = declareScopeMeta(
      context,
      "rest",
      makeObjectAssignExpression(
        makeObjectExpression(makeIntrinsicExpression("Object.prototype"), []),
        site.right,
      ),
    );
    return concat(
      map(
        concat(
          macro.setup,
          map(
            map(site.keys, partialx_(makeDeleteStrictExpression, macro.value)),
            makeExpressionEffect,
          ),
        ),
        partialx_(liftEffect, site.kind),
      ),
      visit(node.argument, context, {
        ...PATTERN,
        kind: site.kind,
        right: macro.value,
      }),
    );
  },
};
