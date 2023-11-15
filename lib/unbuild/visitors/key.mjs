import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

const { String } = globalThis;

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
  if (convert) {
    return makeApplyExpression(
      makeIntrinsicExpression("aran.toPropertyKey", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        unbuildKeyExpression({ node, path, meta }, context, {
          convert: false,
          computed,
        }),
      ],
      path,
    );
  } else {
    if (computed) {
      switch (node.type) {
        case "PrivateIdentifier": {
          return makeSyntaxErrorExpression(
            "private key should not be computed",
            path,
          );
        }
        default: {
          return unbuildExpression({ node, path, meta }, context, {});
        }
      }
    } else {
      switch (node.type) {
        case "Identifier": {
          return makePrimitiveExpression(node.name, path);
        }
        case "PrivateIdentifier": {
          return makePrimitiveExpression(`#${node.name}`, path);
        }
        case "Literal": {
          if (typeof node.value === "object" && node.value !== null) {
            return makeSyntaxErrorExpression("illegal non-computed key", path);
          } else {
            return makePrimitiveExpression(String(node.value), path);
          }
        }
        default: {
          return makeSyntaxErrorExpression(
            `illegal non-computed key: ${node.type}`,
            path,
          );
        }
      }
    }
  }
};
