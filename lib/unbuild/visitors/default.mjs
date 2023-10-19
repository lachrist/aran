import { makeEffectStatement, makeExportEffect } from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";

/** @type {import("../name.mjs").Name} */
const NAME = {
  type: "static",
  kind: "init",
  base: /** @type {estree.Specifier} */ ("default"),
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.Declaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: null,
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildDefault = ({ node, path }, context) => {
  if (
    node.type === "VariableDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    return unbuildStatement({ node, path }, context, {
      labels: [],
      completion: null,
      loop: { break: null, continue: null },
    });
  } else {
    return [
      makeEffectStatement(
        makeExportEffect(
          /** @type {estree.Specifier} */ ("default"),
          unbuildExpression({ node, path }, context, {
            name: NAME,
          }),
          path,
        ),
        path,
      ),
    ];
  }
};
