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
import { annotateArray } from "../annotate.mjs";
import { memoize } from "../memoize.mjs";
import { getKeySite, getKeyMemoSite, PATTERN } from "../site.mjs";
import { visit, liftEffect } from "../context.mjs";

const { Error } = globalThis;

export default {
  __ANNOTATE__: annotateArray,
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
      const memo = visit(node.key, context, getKeyMemoSite(node.computed));
      push(site.keys, memo.pure);
      return visit(node.value, context, {
        ...PATTERN,
        kind: site.kind,
        right: makeGetExpression(
          site.right,
          reduceReverse(memo.setup, makeSequenceExpression, memo.pure),
        ),
      });
    }
  },
  RestElement: (node, context, site) => {
    assert(site.keys !== null, Error, "missing array of key variables");
    const memo = memoize(
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
          memo.setup,
          map(
            map(site.keys, partialx_(makeDeleteStrictExpression, memo.pure)),
            makeExpressionEffect,
          ),
        ),
        partialx_(liftEffect, site.kind),
      ),
      visit(node.argument, context, {
        ...PATTERN,
        kind: site.kind,
        right: memo.pure,
      }),
    );
  },
};
