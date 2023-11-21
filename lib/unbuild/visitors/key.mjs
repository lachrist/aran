import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { initCache } from "../cache.mjs";
import { splitMeta } from "../mangle.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../predicate.mjs";
import { guard } from "../../util/index.mjs";

const { String } = globalThis;

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
 * @type {<X>(
 *   site: Site<(
 *     | estree.Expression
 *     | estree.PrivateIdentifier
 *   )>,
 *   context: Context,
 *   options: {
 *     computed: boolean,
 *     prepend: (
 *       head: aran.Effect<unbuild.Atom>,
 *       tail: X,
 *       path: unbuild.Path,
 *     ) => X,
 *     kontinue: (key: Key) => X,
 *   },
 * ) => X}
 */
export const unbuildKey = (
  { node, path, meta },
  context,
  { computed, prepend, kontinue },
) => {
  if (computed) {
    const metas = splitMeta(meta, ["unbuild", "key"]);
    return initCache(
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
      prepend,
      (key) =>
        kontinue({
          computed,
          access: "public",
          value: key,
        }),
    );
  } else {
    switch (node.type) {
      case "Identifier": {
        return kontinue({
          computed,
          access: "public",
          value: /** @type {estree.Key} */ (node.name),
        });
      }
      case "PrivateIdentifier": {
        return kontinue({
          computed,
          access: "private",
          value: /** @type {estree.PrivateKey} */ (node.name),
        });
      }
      case "Literal": {
        if (isRegExpLiteral(node)) {
          return initCache(
            "constant",
            makeSyntaxErrorExpression(
              `Illegal non-computed key: RegExpLiteral`,
              path,
            ),
            { path, meta },
            prepend,
            (key) =>
              kontinue({
                computed: true,
                access: "public",
                value: key,
              }),
          );
        } else if (isBigIntLiteral(node)) {
          return kontinue({
            computed,
            access: "public",
            value: /** @type {estree.Key} */ (node.bigint),
          });
        } else {
          return kontinue({
            computed,
            access: "public",
            value: /** @type {estree.Key} */ (String(node.value)),
          });
        }
      }
      default: {
        return initCache(
          "constant",
          makeSyntaxErrorExpression(
            `Illegal non-computed key: ${node.type}`,
            path,
          ),
          { path, meta },
          prepend,
          (key) =>
            kontinue({
              computed: true,
              access: "public",
              value: key,
            }),
        );
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
