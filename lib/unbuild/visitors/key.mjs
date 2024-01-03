import {
  makeApplyExpression,
  makeConditionalEffect,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../predicate.mjs";
import { guard } from "../../util/index.mjs";
import { initSequence, mapSequence, zeroSequence } from "../sequence.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";

const { String } = globalThis;

/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   key: import("./key").Key,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listCheckStaticKeyEffect = ({ path }, key) => {
  if (key.computed) {
    return [
      makeConditionalEffect(
        makeBinaryExpression(
          "===",
          makeReadCacheExpression(key.value, path),
          makePrimitiveExpression("prototype", path),
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Illegal computed static key: 'prototype'",
              path,
            ),
            path,
          ),
        ],
        [],
        path,
      ),
    ];
  } else {
    return key.access === "public" && key.value === "prototype"
      ? [
          makeExpressionEffect(
            makeEarlyErrorExpression(
              "Illegal non-computed static key: 'prototype'",
              path,
            ),
            path,
          ),
        ]
      : [];
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
 * ) => import("../sequence").SetupSequence<
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
          return initSequence(
            [
              makeExpressionEffect(
                makeEarlyErrorExpression(
                  "Illegal non-computed key: RegExpLiteral",
                  path,
                ),
                path,
              ),
            ],
            {
              computed: false,
              access: "public",
              value: /** @type {estree.Key} */ ("_ARAN_DUMMY_KEY_"),
            },
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
        return initSequence(
          [
            makeExpressionEffect(
              makeEarlyErrorExpression(
                `Illegal non-computed key: ${node.type}`,
                path,
              ),
              path,
            ),
          ],
          {
            computed: false,
            access: "public",
            value: /** @type {estree.Key} */ ("_ARAN_DUMMY_KEY_"),
          },
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
