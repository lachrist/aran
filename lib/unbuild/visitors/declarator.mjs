import { drill } from "../../drill.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { hasInit } from "../predicate.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

const BASENAME = /** @type {__basename} */ ("declarator");

/**
 * @type {(
 *   pair: {
 *     node: estree.VariableDeclarator,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: null,
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildDeclarator = ({ node, path }, context) =>
  unbuildPatternStatement(drill({ node, path }, "id"), context, {
    right: {
      var: mangleMetaVariable(BASENAME, /** @type {__unique} */ ("init"), path),
      val: hasInit(node)
        ? unbuildExpression(drill({ node, path }, "init"), context, {
            name:
              node.id.type === "Identifier"
                ? {
                    type: "static",
                    kind: "scope",
                    base: /** @type {estree.Variable} */ (node.id.name),
                  }
                : ANONYMOUS,
          })
        : makePrimitiveExpression({ undefined: null }, path),
    },
  });
