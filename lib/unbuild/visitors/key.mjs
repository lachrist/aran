import {
  EMPTY_EFFECT,
  makeApplyExpression,
  makeConditionalEffect,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
  reportEarlyError,
} from "../early-error.mjs";
import { guard } from "../../util/index.mjs";
import { mapSequence, zeroSequence } from "../sequence.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../query/index.mjs";

const { String } = globalThis;

/** @type {import("./key").Key} */
const ILLEGAL_NON_COMPUTED_KEY = {
  computed: false,
  access: "public",
  value: /** @type {estree.Key} */ ("_ARAN_ILLEGAL_NON_COMPUTED_KEY_"),
};

/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   key: import("./key").Key,
 *   path: unbuild.Path,
 * ) => import("../sequence").EffectSequence}
 */
export const listCheckStaticKeyEffect = ({ path }, key) => {
  if (key.computed) {
    return makeConditionalEffect(
      makeBinaryExpression(
        "===",
        makeReadCacheExpression(key.value, path),
        makePrimitiveExpression("prototype", path),
        path,
      ),
      makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          "Illegal computed static key: 'prototype'",
          path,
        ),
        path,
      ),
      EMPTY_EFFECT,
      path,
    );
  } else {
    if (key.access === "public" && key.value === "prototype") {
      return listEarlyErrorEffect(
        "Illegal non-computed static key: 'prototype'",
        path,
      );
    } else {
      return EMPTY_EFFECT;
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Expression
 *     | estree.PrivateIdentifier
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     computed: boolean,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").NodePrelude,
 *   import("./key").Key
 * >}
 */
export const unbuildKey = ({ node, path, meta }, scope, { computed }) => {
  if (computed) {
    return mapSequence(
      cacheConstant(
        forkMeta((meta = nextMeta(meta))),
        makeApplyExpression(
          makeIntrinsicExpression("aran.toPropertyKey", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            node.type === "PrivateIdentifier"
              ? makeEarlyErrorExpression(
                  "Illegal computed key: PrivateIdentifier",
                  path,
                )
              : unbuildExpression(
                  { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  null,
                ),
          ],
          path,
        ),
        path,
      ),
      (key) => ({
        computed,
        access: "public",
        value: key,
      }),
    );
  } else {
    switch (node.type) {
      case "Identifier": {
        return zeroSequence({
          computed,
          access: "public",
          value: /** @type {estree.Key} */ (node.name),
        });
      }
      case "PrivateIdentifier": {
        return zeroSequence({
          computed,
          access: "private",
          value: /** @type {estree.PrivateKey} */ (node.name),
        });
      }
      case "Literal": {
        if (isRegExpLiteral(node)) {
          return reportEarlyError(
            ILLEGAL_NON_COMPUTED_KEY,
            "Illegal non-computed key: RegExpLiteral",
            path,
          );
        } else if (isBigIntLiteral(node)) {
          return zeroSequence({
            computed,
            access: "public",
            value: /** @type {estree.Key} */ (node.bigint),
          });
        } else {
          return zeroSequence({
            computed,
            access: "public",
            value: /** @type {estree.Key} */ (String(node.value)),
          });
        }
      }
      default: {
        return reportEarlyError(
          ILLEGAL_NON_COMPUTED_KEY,
          `Illegal non-computed key: ${node.type}`,
          path,
        );
      }
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.Expression | estree.PrivateIdentifier
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     convert: boolean,
 *     computed: boolean,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildKeyExpression = (
  { node, path, meta },
  scope,
  { convert, computed },
) => {
  if (computed) {
    return node.type === "PrivateIdentifier"
      ? makeEarlyErrorExpression(
          "Invalid computed key: PrivateIdentifier",
          path,
        )
      : guard(
          convert,
          (node) =>
            makeApplyExpression(
              makeIntrinsicExpression("aran.toPropertyKey", path),
              makePrimitiveExpression({ undefined: null }, path),
              [node],
              path,
            ),
          unbuildExpression({ node, path, meta }, scope, null),
        );
  } else {
    switch (node.type) {
      case "PrivateIdentifier": {
        return makePrimitiveExpression(`#${node.name}`, path);
      }
      case "Identifier": {
        return makePrimitiveExpression(node.name, path);
      }
      case "Literal": {
        if (isRegExpLiteral(node)) {
          return makeEarlyErrorExpression(
            `Invalid non-computed key: RegExpLiteral`,
            path,
          );
        } else if (isBigIntLiteral(node)) {
          return makePrimitiveExpression(node.bigint, path);
        } else {
          return makePrimitiveExpression(String(node.value), path);
        }
      }
      default: {
        return makeEarlyErrorExpression(
          `Invalid non-computed key: ${node.type}`,
          path,
        );
      }
    }
  }
};
