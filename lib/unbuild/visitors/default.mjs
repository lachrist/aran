import {
  makeEffectStatement,
  makeExportEffect,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression | estree.Declaration>,
 *   context: import("../context.d.ts").Context,
 *   options: {},
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildDefault = ({ node, path, meta }, context, {}) => {
  if (
    node.type === "VariableDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    return unbuildStatement({ node, path, meta }, context, {
      labels: [],
      completion: null,
      loop: { break: null, continue: null },
    });
  } else {
    return [
      makeEffectStatement(
        makeExportEffect(
          /** @type {estree.Specifier} */ ("default"),
          unbuildNameExpression({ node, path, meta }, context, {
            name: makePrimitiveExpression("default", path),
          }),
          path,
        ),
        path,
      ),
    ];
  }
};
