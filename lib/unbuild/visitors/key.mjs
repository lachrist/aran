import { makePrimitiveExpression } from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { ANONYMOUS } from "../name.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

const { String } = globalThis;

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.PrivateIdentifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     computed: boolean,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildKeyExpression = (
  { node, path },
  context,
  { meta, computed },
) => {
  if (computed) {
    switch (node.type) {
      case "PrivateIdentifier": {
        return makeSyntaxErrorExpression(
          "private key should not be computed",
          path,
        );
      }
      default: {
        return unbuildExpression({ node, path }, context, {
          name: ANONYMOUS,
          meta,
        });
      }
    }
  } else {
    switch (node.type) {
      case "Identifier": {
        return makePrimitiveExpression(node.name, path);
      }
      case "PrivateIdentifier": {
        return makePrimitiveExpression(node.name, path);
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
};
