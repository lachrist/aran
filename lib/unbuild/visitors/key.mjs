import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { mapSetup, setupCache } from "../cache.mjs";
import { splitMeta } from "../mangle.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../predicate.mjs";
import { guard } from "../../util/index.mjs";

const { String } = globalThis;

/**
 * @template V
 * @typedef {import("../cache.d.ts").Setup<V>} Setup
 */

/**
 * @typedef {import("../key.d.ts").Key} Key
 */

/**
 * @typedef {import("../context.d.ts").Context} Context
 */

/**
 * @template N
 * @typedef {import("../site.mjs").Site<N>} Site
 */

/**
 * @type {(
 *   site: Site<(
 *     | estree.Expression
 *     | estree.PrivateIdentifier
 *   )>,
 *   context: Context,
 *   options: {
 *     computed: boolean,
 *   },
 * ) => Setup<Key>}
 */
export const unbuildKeySetup = (
  { node, path, meta },
  context,
  { computed },
) => {
  if (computed) {
    const metas = splitMeta(meta, ["unbuild", "key"]);
    return mapSetup(
      setupCache(
        "constant",
        makeApplyExpression(
          makeIntrinsicExpression("aran.toPropertyKey", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            node.type === "PrivateIdentifier"
              ? makeSyntaxErrorExpression(
                  "Illegal computed key: PrivateIdentifier",
                  path,
                )
              : unbuildExpression(
                  { node, path, meta: metas.unbuild },
                  context,
                  {},
                ),
          ],
          path,
        ),
        { path, meta: metas.key },
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
        return {
          setup: [],
          value: {
            computed,
            access: "public",
            value: /** @type {estree.Key} */ (node.name),
          },
        };
      }
      case "PrivateIdentifier": {
        return {
          setup: [],
          value: {
            computed,
            access: "private",
            value: /** @type {estree.PrivateKey} */ (node.name),
          },
        };
      }
      case "Literal": {
        if (isRegExpLiteral(node)) {
          return {
            setup: [
              makeExpressionEffect(
                makeSyntaxErrorExpression(
                  "Illegal non-computed key: RegExpLiteral",
                  path,
                ),
                path,
              ),
            ],
            value: {
              computed: false,
              access: "public",
              value: /** @type {estree.Key} */ ("_ARAN_DUMMY_KEY_"),
            },
          };
        } else if (isBigIntLiteral(node)) {
          return {
            setup: [],
            value: {
              computed,
              access: "public",
              value: /** @type {estree.Key} */ (node.bigint),
            },
          };
        } else {
          return {
            setup: [],
            value: {
              computed,
              access: "public",
              value: /** @type {estree.Key} */ (String(node.value)),
            },
          };
        }
      }
      default: {
        return {
          setup: [
            makeExpressionEffect(
              makeSyntaxErrorExpression(
                `Illegal non-computed key: ${node.type}`,
                path,
              ),
              path,
            ),
          ],
          value: {
            computed: false,
            access: "public",
            value: /** @type {estree.Key} */ ("_ARAN_DUMMY_KEY_"),
          },
        };
      }
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.Expression | estree.PrivateIdentifier
 *   >,
 *   context: import("../context.js").Context,
 *   options: {
 *     convert: boolean,
 *     computed: boolean,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildKeyExpression = (
  { node, path, meta },
  context,
  { convert, computed },
) => {
  if (computed) {
    return node.type === "PrivateIdentifier"
      ? makeSyntaxErrorExpression(
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
          unbuildExpression({ node, path, meta }, context, {}),
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
          return makeSyntaxErrorExpression(
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
        return makeSyntaxErrorExpression(
          `Invalid non-computed key: ${node.type}`,
          path,
        );
      }
    }
  }
};
