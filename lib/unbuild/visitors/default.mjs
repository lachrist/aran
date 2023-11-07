import {
  makeEffectStatement,
  makeExportEffect,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.Declaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildDefault = ({ node, path }, context, { meta }) => {
  if (
    node.type === "VariableDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    return unbuildStatement({ node, path }, context, {
      meta,
      labels: [],
      completion: null,
      loop: { break: null, continue: null },
    });
  } else {
    return [
      makeEffectStatement(
        makeExportEffect(
          /** @type {estree.Specifier} */ ("default"),
          unbuildNameExpression({ node, path }, context, {
            meta,
            name: makePrimitiveExpression("default", path),
          }),
          path,
        ),
        path,
      ),
    ];
  }
};
